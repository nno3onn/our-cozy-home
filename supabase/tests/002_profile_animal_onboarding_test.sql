begin;

select plan(7);

select has_function(
  'public',
  'complete_onboarding',
  array['text', 'text', 'text', 'animal_species'],
  'onboarding is exposed through one authenticated RPC'
);

insert into auth.users (id)
values ('00000000-0000-0000-0000-000000000012');

select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000012', true);
select set_config('request.jwt.claim.role', 'authenticated', true);

select lives_ok(
  $$select public.complete_onboarding('Momo', '#FF99AA', 'Kong', 'rabbit')$$,
  'an authenticated user can create their profile and first animal'
);

select is(
  (select count(*) from public.profiles where id = '00000000-0000-0000-0000-000000000012'),
  1::bigint,
  'onboarding creates one profile'
);

select is(
  (select count(*) from public.animals where profile_id = '00000000-0000-0000-0000-000000000012'),
  1::bigint,
  'onboarding creates one personal animal'
);

select lives_ok(
  $$select public.complete_onboarding('Momo Two', '#FF99AA', 'Kong Two', 'cat')$$,
  'retrying onboarding is idempotent'
);

select is(
  (select count(*) from public.animals where profile_id = '00000000-0000-0000-0000-000000000012'),
  1::bigint,
  'retrying onboarding never creates a second animal'
);

set local role authenticated;
select throws_ok(
  $$insert into public.profiles (id, display_name, point_color)
    values ('00000000-0000-0000-0000-000000000012', 'direct', '#FF99AA')$$,
  '42501',
  '.*',
  'direct profile writes are blocked by RLS'
);
reset role;

select * from finish();
rollback;
