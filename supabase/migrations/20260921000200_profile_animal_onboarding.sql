-- Profile and first-animal onboarding is owned by the authenticated user.
-- The RPC is idempotent so retries never create a second animal.

create or replace function public.complete_onboarding(
  p_display_name text,
  p_point_color text,
  p_animal_name text,
  p_species public.animal_species
)
returns table (profile_id uuid, animal_id uuid)
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
  created_animal_id uuid;
begin
  if current_user_id is null then
    raise exception 'authentication required' using errcode = '42501';
  end if;
  if btrim(p_display_name) !~ '^[[:alnum:]가-힣 _-]{1,20}$' then
    raise exception 'invalid display name' using errcode = '22023';
  end if;
  if p_point_color !~ '^#[0-9A-Fa-f]{6}$' then
    raise exception 'invalid point color' using errcode = '22023';
  end if;
  if btrim(p_animal_name) !~ '^[[:alnum:]가-힣 _-]{1,20}$' then
    raise exception 'invalid animal name' using errcode = '22023';
  end if;

  insert into public.profiles (id, display_name, point_color)
  values (current_user_id, btrim(p_display_name), p_point_color)
  on conflict (id) do update set display_name = excluded.display_name, point_color = excluded.point_color;

  insert into public.animals (profile_id, name, species, state)
  values (current_user_id, btrim(p_animal_name), p_species, 'idle')
  on conflict (profile_id) do update set name = excluded.name, species = excluded.species
  returning id into created_animal_id;

  return query select current_user_id, created_animal_id;
end;
$$;

revoke all on function public.complete_onboarding(text, text, text, public.animal_species) from public;
grant execute on function public.complete_onboarding(text, text, text, public.animal_species) to authenticated;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles for select to authenticated using (id = auth.uid());

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

drop policy if exists "animals_select_own" on public.animals;
create policy "animals_select_own" on public.animals for select to authenticated using (profile_id = auth.uid());

drop policy if exists "animals_update_own" on public.animals;
create policy "animals_update_own" on public.animals for update to authenticated using (profile_id = auth.uid()) with check (profile_id = auth.uid());
