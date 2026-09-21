begin;

select plan(16);

select has_table('public', 'app_settings');
select has_table('public', 'profiles');
select has_table('public', 'houses');
select has_table('public', 'house_memberships');
select has_table('public', 'animals');

select has_index('public', 'house_memberships', 'one_active_house_membership_per_profile');

insert into auth.users (id)
values ('00000000-0000-0000-0000-000000000011');

insert into public.profiles (id, display_name, point_color)
values ('00000000-0000-0000-0000-000000000011', 'fixture member', '#ff99aa');

insert into public.houses (id, name, admin_profile_id)
values
  ('00000000-0000-0000-0000-000000000101', 'Fixture house one', '00000000-0000-0000-0000-000000000011'),
  ('00000000-0000-0000-0000-000000000102', 'Fixture house two', '00000000-0000-0000-0000-000000000011');

insert into public.house_memberships (id, house_id, profile_id, role)
values (
  '00000000-0000-0000-0000-000000000201',
  '00000000-0000-0000-0000-000000000101',
  '00000000-0000-0000-0000-000000000011',
  'admin'
);

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
    from pg_index index_metadata
    join pg_class index_class on index_class.oid = index_metadata.indexrelid
    where index_class.oid = 'public.one_active_house_membership_per_profile'::regclass
      and index_metadata.indisunique
      and pg_get_expr(index_metadata.indpred, index_metadata.indrelid)
        = '(status = ''active''::membership_status)'
  ),
  'the active-membership index is unique and partial',
);

select throws_ok(
  $$insert into public.house_memberships (id, house_id, profile_id)
    values (
      '00000000-0000-0000-0000-000000000202',
      '00000000-0000-0000-0000-000000000102',
      '00000000-0000-0000-0000-000000000011'
    )$$,
  '23505',
  '.*one_active_house_membership_per_profile.*',
  'a profile cannot have active memberships in two houses',
);

update public.house_memberships
set status = 'left', left_at = timezone('utc', now())
where id = '00000000-0000-0000-0000-000000000201';

select lives_ok(
  $$insert into public.house_memberships (id, house_id, profile_id)
    values (
      '00000000-0000-0000-0000-000000000202',
      '00000000-0000-0000-0000-000000000102',
      '00000000-0000-0000-0000-000000000011'
    )$$,
  'a profile can join another house after leaving the first',
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
