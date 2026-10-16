-- Publish only the existing room table. Preserve all RLS, grants, data and
-- compatible publication options. No replica identity expansion is necessary.
do $$
begin
  if not exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    create publication supabase_realtime with (publish = 'insert, update');
  end if;
  -- Client-side INSERT/UPDATE selection does not prevent custom clients from
  -- requesting DELETE, whose events bypass RLS. Never publish room deletion
  -- identifiers globally. Only reconfigure an empty publication; otherwise
  -- fail closed without changing other tables' established delivery behavior.
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime' and (pubdelete or pubtruncate)) then
    if exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime') then
      raise exception 'room_realtime_requires_insert_update_only_publication';
    end if;
    alter publication supabase_realtime set (publish = 'insert, update');
  end if;
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime' and (not pubinsert or not pubupdate)) then
    raise exception 'room_realtime_requires_insert_and_update';
  end if;
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'room_placements'
  ) then
    alter publication supabase_realtime add table public.room_placements;
  end if;
end;
$$;
