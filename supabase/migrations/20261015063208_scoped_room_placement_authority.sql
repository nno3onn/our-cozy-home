-- Receipts are not a client-readable history. They survive placement removal
-- so an ambiguous successful request can never be re-applied by retrying it.
create table public.room_placement_requests (
  profile_id uuid not null references public.profiles(id) on delete cascade,
  request_key text not null check (length(request_key) between 1 and 128 and btrim(request_key) <> ''),
  house_id uuid not null references public.houses(id) on delete cascade,
  owned_item_id uuid not null,
  slot_id text not null,
  expected_version integer not null,
  placement_id uuid not null,
  version integer not null,
  created_at timestamptz not null default clock_timestamp(),
  primary key (profile_id, request_key)
);
alter table public.room_placement_requests enable row level security;
revoke all on public.room_placement_requests from public, anon, authenticated;

create function public.place_owned_item_scoped(
  p_house_id uuid, p_owned_item_id uuid, p_slot_id text,
  p_expected_version integer, p_request_key text
)
returns table(placement_id uuid, owned_item_id uuid, slot_id text, version integer)
language plpgsql security definer set search_path = ''
as $$
declare
  uid uuid := auth.uid();
  house_status public.house_status;
  item public.owned_items%rowtype;
  allowed jsonb;
  definition_consumable boolean;
  existing public.room_placements%rowtype;
  receipt public.room_placement_requests%rowtype;
  result_row public.room_placements%rowtype;
begin
  if uid is null then raise exception 'authentication required' using errcode = '42501'; end if;
  if p_house_id is null or p_owned_item_id is null or p_slot_id is null or btrim(p_slot_id) = ''
     or p_expected_version is null or p_expected_version < 0 or p_request_key is null
     or btrim(p_request_key) = '' or length(p_request_key) > 128 then
    raise exception 'invalid_placement_request' using errcode = '22023';
  end if;
  -- A caller-supplied old MVCC snapshot must not authorize a departed member.
  if current_setting('transaction_isolation') <> 'read committed' then
    raise exception 'unsupported_transaction_isolation' using errcode = '22023';
  end if;

  -- Same caller advisory lock as create/accept/leave/account deletion. Never
  -- take a membership row lock here: legacy invite takes membership -> house.
  perform pg_advisory_xact_lock(hashtextextended(uid::text, 0));
  perform public.assert_active_profile(uid);
  select h.status into house_status from public.houses h where h.id = p_house_id for update;
  if not found or house_status <> 'active' then
    raise exception 'not_in_requested_house' using errcode = '42501';
  end if;
  -- This SELECT gets a fresh READ COMMITTED snapshot AFTER waiting. The user
  -- advisory + house lock keep every supported membership writer serialized.
  perform 1 from public.house_memberships hm
  where hm.profile_id = uid and hm.house_id = p_house_id and hm.status = 'active';
  if not found then raise exception 'not_in_requested_house' using errcode = '42501'; end if;

  select * into receipt from public.room_placement_requests r
  where r.profile_id = uid and r.request_key = p_request_key;
  if found then
    if receipt.house_id is distinct from p_house_id or receipt.owned_item_id is distinct from p_owned_item_id
       or receipt.slot_id is distinct from p_slot_id or receipt.expected_version is distinct from p_expected_version then
      raise exception 'placement_conflict' using errcode = 'P0001';
    end if;
    return query select receipt.placement_id, receipt.owned_item_id, receipt.slot_id, receipt.version;
    return;
  end if;

  select * into item from public.owned_items oi where oi.id = p_owned_item_id for update;
  if not found or item.profile_id <> uid or item.recovered_at is not null
     or item.quantity <= 0 or item.kind not in ('furniture', 'memory') then
    raise exception 'not_item_owner_or_placeable' using errcode = '42501';
  end if;
  select d.allowed_slot_ids, d.consumable into allowed, definition_consumable
  from public.item_definitions d where d.id = item.item_definition_id;
  if definition_consumable or not coalesce(allowed ? p_slot_id, false)
     or not exists(select 1 from public.room_slots s where s.id = p_slot_id and s.zone <> 'animal') then
    raise exception 'incompatible_slot' using errcode = 'P0001';
  end if;
  if item.memory_id is not null and not exists (
    select 1 from public.memories m join public.memory_viewers mv on mv.memory_id = m.id
    where m.id = item.memory_id and m.house_id = p_house_id and m.status = 'completed'
      and mv.profile_id = uid and mv.access_ended_at is null
  ) then raise exception 'memory_placement_forbidden' using errcode = '42501'; end if;

  if exists(select 1 from public.room_placements rp where rp.owned_item_id = p_owned_item_id
            and (rp.house_id <> p_house_id or rp.slot_id <> p_slot_id)) then
    raise exception 'placement_conflict' using errcode = 'P0001';
  end if;
  select * into existing from public.room_placements rp
  where rp.house_id = p_house_id and rp.slot_id = p_slot_id for update;
  if coalesce(existing.version, 0) <> p_expected_version then
    raise exception 'placement_conflict' using errcode = 'P0001';
  end if;
  if existing.id is null then
    insert into public.room_placements(house_id, slot_id, owned_item_id)
    values(p_house_id, p_slot_id, p_owned_item_id) returning * into result_row;
  else
    -- Shared-slot replacement by an active member using THEIR OWN item is
    -- retained. Displaced owned_items rows are not changed or consumed.
    update public.room_placements rp set owned_item_id = p_owned_item_id,
      version = rp.version + 1, updated_at = clock_timestamp()
    where rp.id = existing.id returning rp.* into result_row;
  end if;
  insert into public.room_placement_requests(profile_id,request_key,house_id,owned_item_id,slot_id,expected_version,placement_id,version)
  values(uid,p_request_key,p_house_id,p_owned_item_id,p_slot_id,p_expected_version,result_row.id,result_row.version);
  return query select result_row.id, result_row.owned_item_id, result_row.slot_id, result_row.version;
end;
$$;
revoke all on function public.place_owned_item_scoped(uuid,uuid,text,integer,text) from public, anon, authenticated;
grant execute on function public.place_owned_item_scoped(uuid,uuid,text,integer,text) to authenticated;

-- Old clients must fail closed: an unscoped RPC cannot safely infer intent.
-- A deny stub also protects against accidentally restoring an explicit grant.
create or replace function public.place_owned_item(p_owned_item_id uuid, p_slot_id text, p_expected_version integer)
returns table(placement_id uuid, owned_item_id uuid, slot_id text, version integer)
language plpgsql security definer set search_path = ''
as $$ begin raise exception 'placement_scope_required' using errcode = '42501'; end; $$;
revoke all on function public.place_owned_item(uuid,text,integer) from public, anon, authenticated;
