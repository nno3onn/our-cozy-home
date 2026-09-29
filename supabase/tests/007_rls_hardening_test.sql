begin;
select plan(4);
select has_function('public', 'is_active_house_member', array['uuid']);
select has_function('public', 'is_active_house_admin', array['uuid']);
select ok(exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'profiles' and policyname = 'profiles_select_active_house_members'), 'profiles expose active-house visibility');
select ok(exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'animals' and policyname = 'animals_select_active_house_members'), 'animals expose active-house visibility');
select * from finish();
rollback;
