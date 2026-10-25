-- Short codes are intentionally less secret than 64-character links. Require an
-- authenticated account and limit guesses without exposing invite rows or token hashes.
create table public.house_invite_code_attempts (
  profile_id uuid primary key references auth.users (id) on delete cascade,
  window_started_at timestamptz not null,
  attempts integer not null check (attempts > 0)
);
alter table public.house_invite_code_attempts enable row level security;
revoke all on public.house_invite_code_attempts from anon, authenticated;

create function public.consume_house_invite_code_attempt()
returns boolean language plpgsql security definer set search_path = public
as $$
declare
  caller_id uuid := auth.uid();
  attempt_count integer;
begin
  if caller_id is null then return false; end if;
  insert into public.house_invite_code_attempts (profile_id, window_started_at, attempts)
  values (caller_id, timezone('utc', now()), 1)
  on conflict (profile_id) do update set
    window_started_at = case
      when house_invite_code_attempts.window_started_at <= timezone('utc', now()) - interval '1 hour'
      then excluded.window_started_at else house_invite_code_attempts.window_started_at end,
    attempts = case
      when house_invite_code_attempts.window_started_at <= timezone('utc', now()) - interval '1 hour'
      then 1 else house_invite_code_attempts.attempts + 1 end
  returning attempts into attempt_count;
  return attempt_count <= 10;
end;
$$;
revoke all on function public.consume_house_invite_code_attempt() from public, anon, authenticated;

create or replace function public.preview_house_invite(p_token text)
returns table (house_name text, inviter_name text, current_member_count integer, state text)
language plpgsql security definer set search_path = public
as $$
declare
  invite_row public.house_invites%rowtype;
  short_code boolean := btrim(coalesce(p_token, '')) ~ '^[A-Za-z0-9]{8}$';
begin
  if short_code then
    if auth.uid() is null then
      return query select null::text, null::text, null::integer, 'login_required'::text; return;
    end if;
    if not public.consume_house_invite_code_attempt() then
      return query select null::text, null::text, null::integer, 'rate_limited'::text; return;
    end if;
    select * into invite_row from public.house_invites
    where invite_code = upper(btrim(p_token));
  else
    select * into invite_row from public.house_invites
    where token_hash = encode(extensions.digest(p_token, 'sha256'), 'hex');
  end if;
  if not found then return query select null::text, null::text, null::integer, 'invalid'::text; return; end if;
  if invite_row.status <> 'active' then
    return query select null::text, null::text, null::integer, invite_row.status::text; return;
  end if;
  if invite_row.expires_at <= timezone('utc', now()) then
    update public.house_invites set status = 'expired', ended_at = timezone('utc', now()) where id = invite_row.id;
    return query select null::text, null::text, null::integer, 'expired'::text; return;
  end if;
  return query
  select h.name, p.display_name, count(m.id)::integer, 'active'::text
  from public.houses h join public.profiles p on p.id = invite_row.created_by_profile_id
  left join public.house_memberships m on m.house_id = h.id and m.status = 'active'
  where h.id = invite_row.house_id and h.status = 'active'
  group by h.name, p.display_name;
end;
$$;

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
  short_code boolean := btrim(coalesce(p_token, '')) ~ '^[A-Za-z0-9]{8}$';
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

  if short_code then
    if not public.consume_house_invite_code_attempt() then
      return query select null::uuid, null::text, null::uuid, 'rate_limited'::text; return;
    end if;
    select invite.id, invite.house_id into candidate_invite_id, candidate_house_id
    from public.house_invites invite where invite.invite_code = upper(btrim(p_token));
    if not found then
      -- Return a non-success row so the attempt counter commits. The client
      -- treats this exactly like the existing invite_invalid exception.
      return query select null::uuid, null::text, null::uuid, 'invite_invalid'::text; return;
    end if;
  else
    select invite.id, invite.house_id into candidate_invite_id, candidate_house_id
    from public.house_invites invite
    where invite.token_hash = encode(extensions.digest(p_token, 'sha256'), 'hex');
    if not found then raise exception 'invite_invalid' using errcode = 'P0001'; end if;
  end if;

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
  select count(*)::integer into active_member_count from public.house_memberships membership
  where membership.house_id = locked_house.id and membership.status = 'active';
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
