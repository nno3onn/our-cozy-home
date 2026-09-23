begin;
select plan(3);
select has_table('public', 'coin_wallets');
select has_table('public', 'attendance_rewards');
select has_function('public', 'claim_attendance_reward');
select * from finish();
rollback;
