begin;

select plan(14);

select has_table('public', 'app_settings');
select has_table('public', 'profiles');
select has_table('public', 'houses');
select has_table('public', 'house_memberships');
select has_table('public', 'animals');

select has_index('public', 'house_memberships', 'one_active_house_membership_per_profile');

select is(
  (select value from public.app_settings where key = 'house_capacity'),
  '4'::jsonb,
  'house capacity is seeded as four',
);

select is(
  (select value from public.app_settings where key = 'attendance_daily_reward'),
  '100'::jsonb,
  'attendance daily reward is seeded as one hundred',
);

select throws_ok(
  $$insert into public.profiles (id, display_name, point_color)
    values ('00000000-0000-0000-0000-000000000001', 'missing user', '#ff99aa')$$,
  '23503',
  '.*profiles_id_fkey.*',
  'a profile requires an auth user',
);

select throws_ok(
  $$insert into public.houses (name) values ('   ')$$,
  '23514',
  '.*houses_name_not_blank.*',
  'a house name cannot be blank',
);

select throws_ok(
  $$insert into public.animals (profile_id, name, species)
    values ('00000000-0000-0000-0000-000000000001', 'Momo', 'dog')$$,
  '22P02',
  '.*invalid input value for enum.*',
  'animal species must be an allowed enum',
);

select ok(
  exists (
    select 1
    from pg_indexes
    where schemaname = 'public'
      and indexname = 'one_active_house_membership_per_profile'
      and indexdef like '%WHERE (status = ''active''::public.membership_status)%'
  ),
  'the active-membership unique index is partial',
);

select ok(
  (select relrowsecurity from pg_class where oid = 'public.app_settings'::regclass),
  'app settings has RLS enabled',
);

select ok(
  (select relrowsecurity from pg_class where oid = 'public.house_memberships'::regclass),
  'memberships have RLS enabled',
);

select * from finish();
rollback;
