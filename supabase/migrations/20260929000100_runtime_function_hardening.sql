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

-- TABLE return names become PL/pgSQL variables. Recreate existing public
-- PL/pgSQL functions with a compile directive, preserving their signatures,
-- grants and bodies while preferring real table columns over result variables.
-- `ALTER FUNCTION ... SET` is unavailable to the unprivileged migration role.
do $$
declare function_definition text;
begin
  for function_definition in
    select pg_get_functiondef(proc.oid)
    from pg_proc proc
    join pg_namespace namespace on namespace.oid = proc.pronamespace
    join pg_language language on language.oid = proc.prolang
    where namespace.nspname = 'public'
      and language.lanname = 'plpgsql'
      and proc.prokind = 'f'
      and position('#variable_conflict' in pg_get_functiondef(proc.oid)) = 0
  loop
    function_definition := replace(
      function_definition,
      E'AS $function$\n',
      E'AS $function$\n#variable_conflict use_column\n'
    );
    execute function_definition;
  end loop;
end;
$$;
