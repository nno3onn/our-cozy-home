begin;

select plan(12);

select has_table('public', 'house_invites');
select has_function('public', 'create_house_invite', array['boolean']);
select has_function('public', 'cancel_house_invite');
select has_function('public', 'preview_house_invite', array['text']);

insert into auth.users (id)
values ('00000000-0000-0000-0000-000000000014');

select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000014', true);
select set_config('request.jwt.claim.role', 'authenticated', true);
set local role authenticated;

select lives_ok(
  $$select public.complete_onboarding('Invite Owner', '#BFD7FF', 'Invite Animal', 'bear')$$,
  'the invite owner has an onboarded profile and animal'
);

select lives_ok(
  $$select public.create_house('초대 테스트 집', 'invite-house-request')$$,
  'the invite owner can create a house'
);

create temporary table invite_test_tokens (token text not null);
insert into invite_test_tokens (token)
select invite_token from public.create_house_invite(false);

select is(
  (select state from public.preview_house_invite((select token from invite_test_tokens))),
  'active',
  'a new invite is previewable as active'
);

select is(
  (select house_name from public.preview_house_invite((select token from invite_test_tokens))),
  '초대 테스트 집',
  'the preview contains only the house name needed before entry'
);

select throws_ok(
  $$select public.create_house_invite(false)$$,
  'P0001',
  'active_invite_exists',
  'an admin cannot create a second active invite without reissuing'
);

select lives_ok(
  $$select public.cancel_house_invite()$$,
  'the admin can cancel the active invite'
);

select is(
  (select state from public.preview_house_invite((select token from invite_test_tokens))),
  'cancelled',
  'a cancelled invite no longer reveals its house preview'
);

insert into invite_test_tokens (token)
select invite_token from public.create_house_invite(false);

select is(
  (select state from public.preview_house_invite((select token from invite_test_tokens order by ctid desc limit 1))),
  'active',
  'the admin can create a new active invite after cancelling'
);

reset role;
select * from finish();
rollback;
