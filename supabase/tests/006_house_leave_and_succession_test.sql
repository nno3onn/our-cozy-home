begin;

select plan(16);

select has_function('public', 'leave_house');

insert into auth.users (id) values
  ('00000000-0000-0000-0000-000000000020'),
  ('00000000-0000-0000-0000-000000000021'),
  ('00000000-0000-0000-0000-000000000022');
select set_config('request.jwt.claim.role', 'authenticated', true);
set local role authenticated;

select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000020', true);
select lives_ok($$select public.complete_onboarding('Leaving Owner', '#BFD7FF', 'Owner Animal', 'bear')$$, 'owner is onboarded');
select lives_ok($$select public.create_house('탈퇴 테스트 집', 'leave-house-request')$$, 'owner creates the house');
create temporary table leave_test_tokens (token text not null);
insert into leave_test_tokens (token) select invite_token from public.create_house_invite(false);
select is((select state from public.preview_house_invite((select token from leave_test_tokens))), 'active', 'an invite is active before departure');

select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000021', true);
select lives_ok($$select public.complete_onboarding('First Friend', '#FFD3A5', 'First Animal', 'rabbit')$$, 'first friend is onboarded');
select is((select result from public.accept_house_invite((select token from leave_test_tokens), 'first-request')), 'joined', 'first friend joins');

select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000022', true);
select lives_ok($$select public.complete_onboarding('Second Friend', '#D6E6FF', 'Second Animal', 'cat')$$, 'second friend is onboarded');
select is((select result from public.accept_house_invite((select token from leave_test_tokens), 'second-request')), 'joined', 'second friend joins');

select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000020', true);
select is((select successor_profile_id from public.leave_house()), '00000000-0000-0000-0000-000000000021'::uuid, 'admin role transfers to the earliest active member');

reset role;
select is((select role::text from public.house_memberships where profile_id = '00000000-0000-0000-0000-000000000021' and status = 'active'), 'admin', 'the successor membership becomes admin');
select is((select status::text from public.house_invites), 'cancelled', 'departure cancels the active invite');

set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000021', true);
select is((select result from public.leave_house()), 'left', 'a non-last member can leave');
reset role;
select is((select status::text from public.houses), 'active', 'a house with one remaining member stays active');

set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000022', true);
select is((select house_archived from public.leave_house()), true, 'the last member archives the house');
select is((select result from public.leave_house()), 'already_left', 'a leave retry is safe');
reset role;
select is((select status::text from public.houses), 'archived', 'only the final departure archives the house');

select * from finish();
rollback;
