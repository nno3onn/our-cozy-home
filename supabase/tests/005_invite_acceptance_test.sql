begin;

select plan(18);

select has_table('public', 'invite_acceptances');
select has_table('public', 'invite_acceptance_requests');
select has_function('public', 'accept_house_invite', array['text', 'text']);

insert into auth.users (id) values
  ('00000000-0000-0000-0000-000000000015'),
  ('00000000-0000-0000-0000-000000000016'),
  ('00000000-0000-0000-0000-000000000017'),
  ('00000000-0000-0000-0000-000000000018'),
  ('00000000-0000-0000-0000-000000000019');

select set_config('request.jwt.claim.role', 'authenticated', true);
set local role authenticated;

select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000015', true);
select lives_ok($$select public.complete_onboarding('Owner', '#BFD7FF', 'Owner Animal', 'bear')$$, 'owner is onboarded');
select lives_ok($$select public.create_house('수락 테스트 집', 'owner-house-request')$$, 'owner creates the house');
create temporary table acceptance_test_tokens (token text not null);
insert into acceptance_test_tokens (token) select invite_token from public.create_house_invite(false);

select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000016', true);
select lives_ok($$select public.complete_onboarding('Friend B', '#FFD3A5', 'B Animal', 'rabbit')$$, 'first friend is onboarded');
select is(
  (select result from public.accept_house_invite((select token from acceptance_test_tokens), 'b-request')),
  'joined',
  'first friend joins with the reusable invite'
);
select is(
  (select result from public.accept_house_invite((select token from acceptance_test_tokens), 'b-request')),
  'already_joined',
  'a retry with the same request key returns the stored result'
);

select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000017', true);
select lives_ok($$select public.complete_onboarding('Friend C', '#D6E6FF', 'C Animal', 'cat')$$, 'second friend is onboarded');
select is(
  (select result from public.accept_house_invite((select token from acceptance_test_tokens), 'c-request')),
  'joined',
  'second friend joins with the same invite'
);

select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000018', true);
select lives_ok($$select public.complete_onboarding('Friend D', '#D5F2D6', 'D Animal', 'rabbit')$$, 'third friend is onboarded');
select is(
  (select result from public.accept_house_invite((select token from acceptance_test_tokens), 'd-request')),
  'joined',
  'third friend fills the fourth house member slot'
);
select is(
  (select state from public.preview_house_invite((select token from acceptance_test_tokens))),
  'full',
  'the invite is closed when the house reaches four active members'
);

select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000019', true);
select lives_ok($$select public.complete_onboarding('Friend E', '#FFC8DC', 'E Animal', 'cat')$$, 'fifth friend is onboarded');
select throws_ok(
  $$select public.accept_house_invite((select token from acceptance_test_tokens), 'e-request')$$,
  'P0001',
  'house_full',
  'a fifth user cannot enter the full house'
);

reset role;
select is(
  (select count(*) from public.house_memberships where status = 'active'),
  4::bigint,
  'the house never exceeds its four-member capacity'
);
select is(
  (select count(*) from public.invite_acceptances),
  3::bigint,
  'one acceptance history row is stored for each joining friend'
);
select is(
  (select count(*) from public.invite_acceptance_requests),
  3::bigint,
  'request retries do not create duplicate acceptance results'
);

select * from finish();
rollback;
