-- Preserve historical migrations while correcting runtime function behaviour
-- under PostgreSQL's PL/pgSQL name-resolution rules.

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
#variable_conflict use_column
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
  on conflict (id) do update
    set display_name = excluded.display_name,
        point_color = excluded.point_color;

  insert into public.animals (profile_id, name, species, state)
  values (current_user_id, btrim(p_animal_name), p_species, 'idle')
  on conflict (profile_id) do update
    set name = excluded.name,
        species = excluded.species
  returning id into created_animal_id;

  return query select current_user_id, created_animal_id;
end;
$$;

create or replace function public.reject_deleted_profile_write()
returns trigger language plpgsql security definer set search_path = public
as $$
declare writer_id uuid;
begin
  if TG_TABLE_NAME in ('memories', 'memory_contributions') then
    writer_id := (to_jsonb(new) ->> 'author_profile_id')::uuid;
  else
    select mc.author_profile_id into writer_id
    from public.memory_contributions mc
    where mc.id = (to_jsonb(new) ->> 'contribution_id')::uuid;
  end if;
  perform public.assert_active_profile(writer_id);
  return new;
end;
$$;

create or replace function public.create_house_invite(p_reissue boolean default false)
returns table (invite_token text, invite_code text, expires_at timestamptz)
language plpgsql security definer set search_path = public
as $$
#variable_conflict use_column
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
  if found and not p_reissue then raise exception 'active_invite_exists' using errcode = 'P0001'; end if;
  if found then update public.house_invites set status = 'reissued', ended_at = timezone('utc', now()) where id = current_invite.id; end if;
  raw_token := encode(extensions.gen_random_bytes(32), 'hex');
  loop
    new_code := upper(substr(encode(extensions.gen_random_bytes(6), 'hex'), 1, 8));
    exit when not exists (select 1 from public.house_invites where invite_code = new_code);
  end loop;
  insert into public.house_invites (house_id, created_by_profile_id, token_hash, invite_code, expires_at)
  values (current_membership.house_id, current_user_id, encode(extensions.digest(raw_token, 'sha256'), 'hex'), new_code, new_expiry);
  return query select raw_token, new_code, new_expiry;
end;
$$;

-- Qualify only the output-name collisions in invite acceptance. This preserves
-- local variables such as timestamps instead of changing PL/pgSQL's global
-- variable-resolution mode.
do $$
declare function_definition text;
begin
  select pg_get_functiondef('public.accept_house_invite(text,text)'::regprocedure)
  into function_definition;
  function_definition := replace(
    function_definition,
    E'select id, house_id into candidate_invite_id, candidate_house_id\n  from public.house_invites\n  where token_hash',
    E'select invite.id, invite.house_id into candidate_invite_id, candidate_house_id\n  from public.house_invites invite\n  where invite.token_hash'
  );
  function_definition := replace(
    function_definition,
    E'from public.house_memberships\n  where house_id = locked_house.id and status = \'active\';',
    E'from public.house_memberships membership\n  where membership.house_id = locked_house.id and membership.status = \'active\';'
  );
  execute function_definition;
end;
$$;

-- The notification outbox function returns a UUID and historically used the
-- same `event_id` identifier for its local value and delivery-table column.
-- Keep the event value distinct so runtime PL/pgSQL resolution remains
-- explicit without changing the semantics of `on conflict` column names.
create or replace function public.enqueue_notification_event(
  p_event_key text,
  p_event_type text,
  p_house_id uuid,
  p_actor_profile_id uuid default null,
  p_memory_id uuid default null,
  p_habit_learning_id uuid default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  created_event_id uuid;
  inserted_event boolean := false;
begin
  if p_event_type not in ('house_joined', 'memory_completed', 'habit_learned') then
    raise exception 'invalid_notification_event_type' using errcode = '22023';
  end if;

  insert into public.notification_events(event_key,event_type,house_id,actor_profile_id,memory_id,habit_learning_id)
  values(p_event_key,p_event_type,p_house_id,p_actor_profile_id,p_memory_id,p_habit_learning_id)
  on conflict(event_key) do nothing
  returning id into created_event_id;
  inserted_event := found;

  if not inserted_event then
    select queued_event.id into created_event_id
    from public.notification_events queued_event
    where queued_event.event_key = p_event_key;
    return created_event_id;
  end if;

  insert into public.notification_deliveries(event_id,recipient_profile_id)
  select created_event_id, membership.profile_id
  from public.house_memberships membership
  where membership.house_id = p_house_id
    and membership.status = 'active'
    and membership.profile_id is distinct from p_actor_profile_id
    and (
      p_event_type = 'house_joined'
      or (p_event_type = 'memory_completed' and exists (
        select 1 from public.memory_viewers viewer
        where viewer.memory_id = p_memory_id
          and viewer.profile_id = membership.profile_id
          and viewer.access_ended_at is null
      ))
      or (p_event_type = 'habit_learned' and exists (
        select 1 from public.habit_learning learning
        join public.animals learner on learner.id = learning.learner_animal_id
        join public.animals teacher on teacher.id = learning.teacher_animal_id
        where learning.id = p_habit_learning_id
          and membership.profile_id in (learner.profile_id, teacher.profile_id)
      ))
    )
  on conflict(event_id,recipient_profile_id) do nothing;

  return created_event_id;
end;
$$;
