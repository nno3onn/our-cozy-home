begin;
select plan(8);

select ok(exists (
  select 1 from pg_publication_tables
  where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'room_placements'
), 'room placement table is published');
select ok((select pubinsert and pubupdate and not pubdelete from pg_publication where pubname = 'supabase_realtime'), 'publication allows inserts and updates without exposing delete IDs');
select ok((select not pubtruncate from pg_publication where pubname = 'supabase_realtime'), 'publication excludes truncate events');
select ok((select relrowsecurity from pg_class where oid = 'public.room_placements'::regclass), 'room placement RLS stays enabled');
select ok(not has_table_privilege('anon', 'public.room_placements', 'INSERT'), 'anonymous users cannot insert placements');
select ok(not has_table_privilege('authenticated', 'public.room_placements', 'INSERT'), 'authenticated users must use the placement command');
select ok(not has_table_privilege('authenticated', 'public.room_placements', 'UPDATE'), 'direct placement updates stay forbidden');
select ok(not has_table_privilege('authenticated', 'public.room_placements', 'DELETE'), 'direct placement recovery stays forbidden');

select * from finish();
rollback;
