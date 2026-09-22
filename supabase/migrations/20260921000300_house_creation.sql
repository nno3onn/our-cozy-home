-- A house and its first admin membership must be created as one command.

create table if not exists public.house_create_requests (
  id uuid primary key default extensions.gen_random_uuid(),
  profile_id uuid not null references public.profiles (id) on delete restrict,
  request_key text not null,
  house_id uuid not null references public.houses (id) on delete restrict,
  membership_id uuid not null references public.house_memberships (id) on delete restrict,
  created_at timestamptz not null default timezone('utc', now()),
  constraint house_create_requests_request_key_not_blank check (btrim(request_key) <> ''),
  constraint house_create_requests_profile_request_key_unique unique (profile_id, request_key)
);

create index if not exists house_create_requests_profile_created_at_idx
  on public.house_create_requests (profile_id, created_at desc);

alter table public.house_create_requests enable row level security;

create or replace function public.create_house(
  p_name text,
  p_request_key text
)
returns table (house_id uuid, membership_id uuid)
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
  existing_request public.house_create_requests%rowtype;
  created_house_id uuid;
  created_membership_id uuid;
begin
  if current_user_id is null then
    raise exception 'authentication required' using errcode = '42501';
  end if;
  if btrim(p_name) !~ '^[[:alnum:]가-힣 _-]{1,30}$' then
    raise exception 'invalid house name' using errcode = '22023';
  end if;
  if btrim(p_request_key) = '' then
    raise exception 'invalid request key' using errcode = '22023';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(current_user_id::text, 0));

  select * into existing_request
  from public.house_create_requests
  where profile_id = current_user_id and request_key = p_request_key
  for update;
  if found then
    return query select existing_request.house_id, existing_request.membership_id;
    return;
  end if;

  if not exists (select 1 from public.profiles where id = current_user_id) then
    raise exception 'profile_not_onboarded' using errcode = 'P0001';
  end if;
  if exists (
    select 1 from public.house_memberships
    where profile_id = current_user_id and status = 'active'
  ) then
    raise exception 'already_in_house' using errcode = 'P0001';
  end if;

  insert into public.houses (name, admin_profile_id)
  values (btrim(p_name), current_user_id)
  returning id into created_house_id;

  insert into public.house_memberships (house_id, profile_id, role)
  values (created_house_id, current_user_id, 'admin')
  returning id into created_membership_id;

  insert into public.house_create_requests (profile_id, request_key, house_id, membership_id)
  values (current_user_id, p_request_key, created_house_id, created_membership_id);

  return query select created_house_id, created_membership_id;
end;
$$;

revoke all on function public.create_house(text, text) from public;
grant execute on function public.create_house(text, text) to authenticated;

drop policy if exists "house_memberships_select_own" on public.house_memberships;
create policy "house_memberships_select_own"
  on public.house_memberships for select to authenticated
  using (profile_id = auth.uid());

drop policy if exists "houses_select_active_member" on public.houses;
create policy "houses_select_active_member"
  on public.houses for select to authenticated
  using (
    exists (
      select 1
      from public.house_memberships
      where house_id = houses.id
        and profile_id = auth.uid()
        and status = 'active'
    )
  );
