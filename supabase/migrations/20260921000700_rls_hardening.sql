-- Shared read access is always based on a current active membership, never history.

create or replace function public.is_active_house_member(p_house_id uuid)
returns boolean language sql stable security definer set search_path = public
as $$ select exists (select 1 from public.house_memberships where house_id = p_house_id and profile_id = auth.uid() and status = 'active') $$;

create or replace function public.is_active_house_admin(p_house_id uuid)
returns boolean language sql stable security definer set search_path = public
as $$ select exists (select 1 from public.house_memberships where house_id = p_house_id and profile_id = auth.uid() and status = 'active' and role = 'admin') $$;

drop policy if exists "profiles_select_active_house_members" on public.profiles;
create policy "profiles_select_active_house_members" on public.profiles for select to authenticated using (
  id = auth.uid() or exists (
    select 1 from public.house_memberships mine join public.house_memberships theirs on theirs.house_id = mine.house_id
    where mine.profile_id = auth.uid() and mine.status = 'active' and theirs.profile_id = profiles.id and theirs.status = 'active'
  )
);

drop policy if exists "animals_select_active_house_members" on public.animals;
create policy "animals_select_active_house_members" on public.animals for select to authenticated using (
  profile_id = auth.uid() or exists (
    select 1 from public.house_memberships mine join public.house_memberships theirs on theirs.house_id = mine.house_id
    where mine.profile_id = auth.uid() and mine.status = 'active' and theirs.profile_id = animals.profile_id and theirs.status = 'active'
  )
);

drop policy if exists "house_memberships_select_active_house_members" on public.house_memberships;
create policy "house_memberships_select_active_house_members" on public.house_memberships for select to authenticated using (
  profile_id = auth.uid() or public.is_active_house_member(house_id)
);

-- History tables deliberately have no direct client policies: RPCs are the only writers.
revoke all on table public.house_invites, public.house_create_requests, public.invite_acceptances, public.invite_acceptance_requests from anon, authenticated;
revoke all on function public.is_active_house_member(uuid), public.is_active_house_admin(uuid) from public;
grant execute on function public.is_active_house_member(uuid), public.is_active_house_admin(uuid) to authenticated;
