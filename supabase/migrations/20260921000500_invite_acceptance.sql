-- A reusable invite can admit several people, but each authenticated user can join
-- only one active house. The command serializes by user then house.

create table if not exists public.invite_acceptances (
  id uuid primary key default extensions.gen_random_uuid(),
  invite_id uuid not null references public.house_invites (id) on delete restrict,
  profile_id uuid not null references public.profiles (id) on delete restrict,
  membership_id uuid not null references public.house_memberships (id) on delete restrict,
  accepted_at timestamptz not null default timezone('utc', now()),
  constraint invite_acceptances_invite_profile_unique unique (invite_id, profile_id)
);

create table if not exists public.invite_acceptance_requests (
  id uuid primary key default extensions.gen_random_uuid(),
  profile_id uuid not null references public.profiles (id) on delete restrict,
  request_key text not null,
  invite_id uuid not null references public.house_invites (id) on delete restrict,
  house_id uuid not null references public.houses (id) on delete restrict,
  membership_id uuid not null references public.house_memberships (id) on delete restrict,
  created_at timestamptz not null default timezone('utc', now()),
  constraint invite_acceptance_requests_key_not_blank check (btrim(request_key) <> ''),
  constraint invite_acceptance_requests_profile_key_unique unique (profile_id, request_key)
);

create index if not exists invite_acceptances_invite_accepted_at_idx
  on public.invite_acceptances (invite_id, accepted_at);

alter table public.invite_acceptances enable row level security;
alter table public.invite_acceptance_requests enable row level security;

create or replace function public.accept_house_invite(
  p_token text,
  p_request_key text
)
returns table (house_id uuid, house_name text, membership_id uuid, result text)
language plpgsql security definer set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
  prior_request public.invite_acceptance_requests%rowtype;
  candidate_invite_id uuid;
  candidate_house_id uuid;
  locked_house public.houses%rowtype;
  locked_invite public.house_invites%rowtype;
  active_membership public.house_memberships%rowtype;
  created_membership_id uuid;
  active_member_count integer;
  house_capacity integer;
  accepted_at timestamptz := timezone('utc', now());
begin
  if current_user_id is null then raise exception 'authentication required' using errcode = '42501'; end if;
  if btrim(p_token) = '' then raise exception 'invite_invalid' using errcode = 'P0001'; end if;
  if btrim(p_request_key) = '' then raise exception 'invalid request key' using errcode = '22023'; end if;

  perform pg_advisory_xact_lock(hashtextextended(current_user_id::text, 0));

  select * into prior_request from public.invite_acceptance_requests
  where profile_id = current_user_id and request_key = p_request_key for update;
  if found then
    return query select prior_request.house_id, h.name, prior_request.membership_id, 'already_joined'
    from public.houses h where h.id = prior_request.house_id;
    return;
  end if;

  select id, house_id into candidate_invite_id, candidate_house_id
  from public.house_invites
  where token_hash = encode(extensions.digest(p_token, 'sha256'), 'hex');
  if not found then raise exception 'invite_invalid' using errcode = 'P0001'; end if;

  select * into locked_house from public.houses
  where id = candidate_house_id and status = 'active' for update;
  if not found then raise exception 'invite_invalid' using errcode = 'P0001'; end if;

  select * into locked_invite from public.house_invites where id = candidate_invite_id for update;
  if locked_invite.status <> 'active' then
    if locked_invite.status = 'full' then raise exception 'house_full' using errcode = 'P0001'; end if;
    if locked_invite.status = 'expired' then raise exception 'invite_expired' using errcode = 'P0001'; end if;
    if locked_invite.status = 'cancelled' then raise exception 'invite_cancelled' using errcode = 'P0001'; end if;
    raise exception 'invite_invalid' using errcode = 'P0001';
  end if;
  if locked_invite.expires_at <= accepted_at then
    update public.house_invites set status = 'expired', ended_at = accepted_at where id = locked_invite.id;
    raise exception 'invite_expired' using errcode = 'P0001';
  end if;

  select * into active_membership from public.house_memberships
  where profile_id = current_user_id and status = 'active' for update;
  if found then raise exception 'already_in_house' using errcode = 'P0001'; end if;

  select value::text::integer into house_capacity from public.app_settings where key = 'house_capacity';
  if house_capacity is null or house_capacity <> 4 then raise exception 'invalid_house_capacity_setting' using errcode = 'P0001'; end if;
  select count(*)::integer into active_member_count from public.house_memberships
  where house_id = locked_house.id and status = 'active';
  if active_member_count >= house_capacity then
    update public.house_invites set status = 'full', ended_at = accepted_at where id = locked_invite.id;
    raise exception 'house_full' using errcode = 'P0001';
  end if;

  insert into public.house_memberships (house_id, profile_id, role)
  values (locked_house.id, current_user_id, 'member')
  returning id into created_membership_id;
  insert into public.invite_acceptances (invite_id, profile_id, membership_id)
  values (locked_invite.id, current_user_id, created_membership_id);
  insert into public.invite_acceptance_requests (profile_id, request_key, invite_id, house_id, membership_id)
  values (current_user_id, p_request_key, locked_invite.id, locked_house.id, created_membership_id);

  if active_member_count + 1 = house_capacity then
    update public.house_invites set status = 'full', ended_at = accepted_at where id = locked_invite.id;
  end if;
  return query select locked_house.id, locked_house.name, created_membership_id, 'joined';
end;
$$;

revoke all on function public.accept_house_invite(text, text) from public;
grant execute on function public.accept_house_invite(text, text) to authenticated;
