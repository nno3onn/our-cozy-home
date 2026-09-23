create table public.room_placements (
  id uuid primary key default extensions.gen_random_uuid(),
  house_id uuid not null references public.houses(id) on delete restrict,
  slot_id text not null references public.room_slots(id) on delete restrict,
  owned_item_id uuid not null references public.owned_items(id) on delete restrict,
  version integer not null default 1 check (version > 0),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  unique (house_id, slot_id), unique (owned_item_id)
);
alter table public.room_placements enable row level security;
create policy "room_placements_select_member" on public.room_placements for select to authenticated using (public.is_active_house_member(house_id));
revoke insert, update, delete on public.room_placements from anon, authenticated;

create or replace function public.place_owned_item(p_owned_item_id uuid, p_slot_id text, p_expected_version integer)
returns table (placement_id uuid, owned_item_id uuid, slot_id text, version integer)
language plpgsql security definer set search_path = public
as $$
declare uid uuid := auth.uid(); active_house uuid; owner uuid; allowed jsonb; existing public.room_placements%rowtype;
begin
 if uid is null then raise exception 'authentication required' using errcode='42501'; end if;
 select hm.house_id into active_house from public.house_memberships hm where hm.profile_id=uid and hm.status='active';
 if active_house is null then raise exception 'not_in_house' using errcode='42501'; end if;
 perform 1 from public.houses h where h.id=active_house for update;
 select oi.profile_id, id.allowed_slot_ids into owner, allowed from public.owned_items oi join public.item_definitions id on id.id=oi.item_definition_id where oi.id=p_owned_item_id and oi.recovered_at is null for update;
 if not found or owner <> uid then raise exception 'not_item_owner' using errcode='42501'; end if;
 if not (allowed ? p_slot_id) then raise exception 'incompatible_slot' using errcode='P0001'; end if;
 select * into existing from public.room_placements rp where rp.house_id=active_house and rp.slot_id=p_slot_id for update;
 if found then
   if existing.version <> p_expected_version then raise exception 'placement_conflict' using errcode='P0001'; end if;
   update public.room_placements set owned_item_id=p_owned_item_id, version=existing.version+1, updated_at=now() where id=existing.id returning id,owned_item_id,slot_id,version into placement_id,owned_item_id,slot_id,version;
 else
   if p_expected_version <> 0 then raise exception 'placement_conflict' using errcode='P0001'; end if;
   insert into public.room_placements(house_id,slot_id,owned_item_id) values(active_house,p_slot_id,p_owned_item_id) returning id,owned_item_id,slot_id,version into placement_id,owned_item_id,slot_id,version;
 end if;
 return next;
end; $$;
revoke all on function public.place_owned_item(uuid,text,integer) from public;
grant execute on function public.place_owned_item(uuid,text,integer) to authenticated;

create or replace function public.recover_departing_item_placements()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
 if old.status = 'active' and new.status = 'left' then
   delete from public.room_placements rp using public.owned_items oi
   where rp.house_id = old.house_id and rp.owned_item_id = oi.id and oi.profile_id = old.profile_id;
 end if;
 return new;
end; $$;
create trigger recover_departing_item_placements
after update of status on public.house_memberships
for each row execute function public.recover_departing_item_placements();
