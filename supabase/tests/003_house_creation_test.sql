begin;

select plan(11);

select has_table('public', 'house_create_requests');
select has_function('public', 'create_house', array['text', 'text']);

insert into auth.users (id)
values ('00000000-0000-0000-0000-000000000013');

select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000013', true);
select set_config('request.jwt.claim.role', 'authenticated', true);
set local role authenticated;

select lives_ok(
  $$select public.complete_onboarding('House Owner', '#FF99AA', 'Owner Animal', 'rabbit')$$,
  'the creator has an onboarded profile and animal'
);

select lives_ok(
  $$select public.create_house('도란도란 우리집', 'request-1')$$,
  'an authenticated user can create a house'
);

select is(
  (select count(*) from public.houses),
  1::bigint,
  'house creation stores one house'
);

select is(
  (select count(*) from public.house_memberships where profile_id = auth.uid() and status = 'active'),
  1::bigint,
  'house creation stores one active membership'
);

select is(
  (select role::text from public.house_memberships where profile_id = auth.uid() and status = 'active'),
  'admin',
  'the first membership is admin'
);

select lives_ok(
  $$select public.create_house('새 이름이어도 무시', 'request-1')$$,
  'retrying with the same request key returns the prior result'
);

select is(
  (select count(*) from public.houses),
  1::bigint,
  'the idempotent retry does not create another house'
);

select throws_ok(
  $$select public.create_house('다른 집', 'request-2')$$,
  'P0001',
  'already_in_house',
  'a second active house creation is rejected'
);

select throws_ok(
  $$insert into public.houses (name) values ('direct write')$$,
  '42501',
  '.*',
  'direct house writes are blocked by RLS'
);

reset role;
select * from finish();
rollback;
