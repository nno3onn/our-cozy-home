begin;
select plan(4);
select has_function('public', 'is_active_house_member', array['uuid']);
select has_function('public', 'is_active_house_admin', array['uuid']);
select policy_exists('public', 'profiles', 'profiles_select_active_house_members');
select policy_exists('public', 'animals', 'animals_select_active_house_members');
select * from finish();
rollback;
