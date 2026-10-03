create or replace function public.perform_animal_action(
  p_animal_id uuid,
  p_action public.animal_state
)
returns table (
  id uuid,
  profile_id uuid,
  name text,
  species public.animal_species,
  state public.animal_state,
  created_at timestamptz,
  updated_at timestamptz,
  deleted_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
  target_animal public.animals%rowtype;
begin
  if current_user_id is null then
    raise exception 'authentication_required' using errcode = '42501';
  end if;
  if p_action = 'idle' then
    raise exception 'invalid_animal_action' using errcode = '22023';
  end if;

  select animal.*
  into target_animal
  from public.animals animal
  join public.house_memberships target_membership
    on target_membership.profile_id = animal.profile_id
   and target_membership.status = 'active'
  join public.house_memberships actor_membership
    on actor_membership.house_id = target_membership.house_id
   and actor_membership.profile_id = current_user_id
   and actor_membership.status = 'active'
  join public.houses house
    on house.id = target_membership.house_id
   and house.status = 'active'
  where animal.id = p_animal_id
    and animal.deleted_at is null
  for update of animal;

  if not found then
    raise exception 'animal_action_forbidden' using errcode = '42501';
  end if;

  update public.animals animal
  set state = p_action
  where animal.id = target_animal.id
  returning animal.* into target_animal;

  return query
  select
    target_animal.id,
    target_animal.profile_id,
    target_animal.name,
    target_animal.species,
    target_animal.state,
    target_animal.created_at,
    target_animal.updated_at,
    target_animal.deleted_at;
end;
$$;

revoke all on function public.perform_animal_action(uuid, public.animal_state) from public;
grant execute on function public.perform_animal_action(uuid, public.animal_state) to authenticated;
