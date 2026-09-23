-- One reusable invite per house. The plaintext token is returned only by creation RPCs.

do $$ begin
  create type public.house_invite_status as enum ('active', 'cancelled', 'expired', 'full', 'reissued');
exception when duplicate_object then null; end $$;

create table if not exists public.house_invites (
  id uuid primary key default extensions.gen_random_uuid(),
  house_id uuid not null references public.houses (id) on delete restrict,
  created_by_profile_id uuid not null references public.profiles (id) on delete restrict,
  token_hash text not null unique,
  invite_code text not null unique,
  status public.house_invite_status not null default 'active',
  expires_at timestamptz not null,
  ended_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  constraint house_invites_code_format check (invite_code ~ '^[A-Z0-9]{8}$'),
  constraint house_invites_active_expiry check (expires_at > created_at),
  constraint house_invites_ended_matches_status check (
    (status = 'active' and ended_at is null) or (status <> 'active' and ended_at is not null)
  )
);

create unique index if not exists one_active_house_invite_per_house
  on public.house_invites (house_id) where status = 'active';
create index if not exists house_invites_lookup_hash_idx on public.house_invites (token_hash);
alter table public.house_invites enable row level security;

create or replace function public.create_house_invite(p_reissue boolean default false)
returns table (invite_token text, invite_code text, expires_at timestamptz)
language plpgsql security definer set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
  current_membership public.house_memberships%rowtype;
  current_invite public.house_invites%rowtype;
  raw_token text;
  new_code text;
  new_expiry timestamptz := timezone('utc', now()) + interval '24 hours';
begin
  if current_user_id is null then raise exception 'authentication required' using errcode = '42501'; end if;
  select * into current_membership from public.house_memberships
  where profile_id = current_user_id and status = 'active' for update;
  if not found or current_membership.role <> 'admin' then raise exception 'admin_required' using errcode = '42501'; end if;
  perform 1 from public.houses where id = current_membership.house_id and status = 'active' for update;
  if not found then raise exception 'house_archived' using errcode = 'P0001'; end if;
  select * into current_invite from public.house_invites where house_id = current_membership.house_id and status = 'active' for update;
  if found and current_invite.expires_at <= timezone('utc', now()) then
    update public.house_invites set status = 'expired', ended_at = timezone('utc', now()) where id = current_invite.id;
    found := false;
  end if;
  if found and not p_reissue then
    raise exception 'active_invite_exists' using errcode = 'P0001';
  end if;
  if found then update public.house_invites set status = 'reissued', ended_at = timezone('utc', now()) where id = current_invite.id; end if;
  raw_token := encode(extensions.gen_random_bytes(32), 'hex');
  loop
    new_code := upper(substr(encode(extensions.gen_random_bytes(6), 'hex'), 1, 8));
    exit when not exists (select 1 from public.house_invites where invite_code = new_code);
  end loop;
  insert into public.house_invites (house_id, created_by_profile_id, token_hash, invite_code, expires_at)
  values (current_membership.house_id, current_user_id, encode(extensions.digest(raw_token, 'sha256'), 'hex'), new_code, new_expiry);
  return query select raw_token, new_code, new_expiry;
end; $$;

create or replace function public.cancel_house_invite()
returns void language plpgsql security definer set search_path = public
as $$
declare current_user_id uuid := auth.uid(); current_membership public.house_memberships%rowtype;
begin
  if current_user_id is null then raise exception 'authentication required' using errcode = '42501'; end if;
  select * into current_membership from public.house_memberships where profile_id = current_user_id and status = 'active' for update;
  if not found or current_membership.role <> 'admin' then raise exception 'admin_required' using errcode = '42501'; end if;
  update public.house_invites set status = 'cancelled', ended_at = timezone('utc', now())
  where house_id = current_membership.house_id and status = 'active';
end; $$;

create or replace function public.preview_house_invite(p_token text)
returns table (house_name text, inviter_name text, current_member_count integer, state text)
language plpgsql security definer set search_path = public
as $$
declare invite_row public.house_invites%rowtype;
begin
  select * into invite_row from public.house_invites
  where token_hash = encode(extensions.digest(p_token, 'sha256'), 'hex');
  if not found then return query select null::text, null::text, null::integer, 'invalid'; return; end if;
  if invite_row.status <> 'active' then return query select null::text, null::text, null::integer, invite_row.status::text; return; end if;
  if invite_row.expires_at <= timezone('utc', now()) then
    update public.house_invites set status = 'expired', ended_at = timezone('utc', now()) where id = invite_row.id;
    return query select null::text, null::text, null::integer, 'expired'; return;
  end if;
  return query
  select h.name, p.display_name, count(m.id)::integer, 'active'
  from public.houses h join public.profiles p on p.id = invite_row.created_by_profile_id
  left join public.house_memberships m on m.house_id = h.id and m.status = 'active'
  where h.id = invite_row.house_id and h.status = 'active'
  group by h.name, p.display_name;
end; $$;

revoke all on function public.create_house_invite(boolean) from public;
revoke all on function public.cancel_house_invite() from public;
revoke all on function public.preview_house_invite(text) from public;
grant execute on function public.create_house_invite(boolean), public.cancel_house_invite() to authenticated;
grant execute on function public.preview_house_invite(text) to anon, authenticated;
