begin;
select plan(4);
select has_function('public', 'is_active_house_member', array['uuid']);
select has_function('public', 'is_active_house_admin', array['uuid']);
select ok(exists (
  select 1 from pg_policies
  where schemaname = 'public' and tablename = 'profiles'
    and policyname = 'profiles_select_active_house_members'
), 'profiles expose the active-house member policy');
select ok(exists (
  select 1 from pg_policies
  where schemaname = 'public' and tablename = 'animals'
    and policyname = 'animals_select_active_house_members'
), 'animals expose the active-house member policy');
select * from finish();
rollback;
