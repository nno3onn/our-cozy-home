begin;
select plan(10);
select has_table('public', 'coin_wallets');
select has_table('public', 'attendance_rewards');
select has_function('public', 'claim_attendance_reward');

insert into auth.users (id) values ('00000000-0000-0000-0000-000000000040');
select set_config('request.jwt.claim.role', 'authenticated', true);
set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000040', true);
select lives_ok(
  $$select public.complete_onboarding('출석 사용자', '#BFD7FF', '출석 동물', 'rabbit')$$,
  'an authenticated profile can claim attendance'
);
select is(
  (select granted from public.claim_attendance_reward()),
  true,
  'the first KST-day claim grants the reward'
);
select is(
  (select balance from public.coin_wallets where profile_id='00000000-0000-0000-0000-000000000040'),
  100,
  'the server-configured reward is exactly 100 coins'
);
select is(
  (select granted from public.claim_attendance_reward()),
  false,
  'a retry on the same KST day returns the existing result'
);
reset role;
select is(
  (select count(*) from public.attendance_rewards where profile_id='00000000-0000-0000-0000-000000000040'),
  1::bigint,
  'one profile has one attendance reward row for the day'
);
select is(
  (select count(*) from public.coin_transactions where profile_id='00000000-0000-0000-0000-000000000040' and reason='attendance'),
  1::bigint,
  'a retry does not create a second attendance ledger entry'
);
select is(
  (select amount from public.coin_transactions where profile_id='00000000-0000-0000-0000-000000000040' and reason='attendance'),
  100,
  'the ledger stores the granted amount'
);
select * from finish();
rollback;
