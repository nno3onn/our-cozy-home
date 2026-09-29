-- Keep historical migrations immutable while making the runtime functions
-- unambiguous under PostgreSQL's current PL/pgSQL name resolution rules.

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

-- TABLE return names become PL/pgSQL variables. Prefer real table columns in
-- each security-definer RPC so result names such as `house_id`, `quantity`,
-- and `game_date` cannot shadow a query column at runtime.
alter function public.create_house(text, text) set plpgsql.variable_conflict = 'use_column';
alter function public.create_house_invite(boolean) set plpgsql.variable_conflict = 'use_column';
alter function public.preview_house_invite(text) set plpgsql.variable_conflict = 'use_column';
alter function public.accept_house_invite(text, text) set plpgsql.variable_conflict = 'use_column';
alter function public.leave_house() set plpgsql.variable_conflict = 'use_column';
alter function public.claim_attendance_reward() set plpgsql.variable_conflict = 'use_column';
alter function public.purchase_item(text, uuid) set plpgsql.variable_conflict = 'use_column';
alter function public.get_purchase_result(uuid) set plpgsql.variable_conflict = 'use_column';
alter function public.place_owned_item(uuid, text, integer) set plpgsql.variable_conflict = 'use_column';
alter function public.share_memory_draft(uuid) set plpgsql.variable_conflict = 'use_column';
alter function public.list_memory_summaries(text) set plpgsql.variable_conflict = 'use_column';
alter function public.get_memory_contribution_detail(uuid) set plpgsql.variable_conflict = 'use_column';
alter function public.get_memory_photo_metadata(uuid) set plpgsql.variable_conflict = 'use_column';
alter function public.prepare_memory_photo_upload(uuid, uuid, text) set plpgsql.variable_conflict = 'use_column';
alter function public.record_habit_activity(uuid) set plpgsql.variable_conflict = 'use_column';
alter function public.claim_notification_delivery_targets(integer, integer) set plpgsql.variable_conflict = 'use_column';
alter function public.claim_notification_receipts(integer, integer) set plpgsql.variable_conflict = 'use_column';
alter function public.request_account_deletion(uuid) set plpgsql.variable_conflict = 'use_column';
