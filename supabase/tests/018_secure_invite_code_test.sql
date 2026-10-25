begin;
set local search_path = public, extensions;

select plan(18);

select has_table('public', 'house_invite_code_attempts', 'short-code attempts have a private counter');
select has_function('public', 'consume_house_invite_code_attempt', array[]::text[]);
select ok(not has_table_privilege('authenticated', 'public.house_invite_code_attempts', 'SELECT'), 'attempt counters are not readable through the Data API');
select ok(not has_function_privilege('authenticated', 'public.consume_house_invite_code_attempt()', 'EXECUTE'), 'clients cannot directly consume or reset the counter');

insert into auth.users (id) values
  ('00000000-0000-0000-0000-000000000181'),
  ('00000000-0000-0000-0000-000000000182'),
  ('00000000-0000-0000-0000-000000000183');

select set_config('request.jwt.claim.role', 'authenticated', true);
set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000181', true);
select lives_ok($$select public.complete_onboarding('Code Owner', '#BFD7FF', 'Owner Animal', 'bear')$$, 'owner is onboarded');
select lives_ok($$select public.create_house('코드 초대 집', 'code-house-request')$$, 'owner creates a house');
create temporary table code_test_invite as select invite_token, invite_code from public.create_house_invite(false);
grant select on code_test_invite to anon;

select set_config('request.jwt.claim.sub', '', true);
set local role anon;
select is((select state from public.preview_house_invite((select invite_code from code_test_invite))), 'login_required', 'anonymous code lookup reveals no house');
select is((select state from public.preview_house_invite((select invite_token from code_test_invite))), 'active', 'the long link retains anonymous preview');

set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000182', true);
select lives_ok($$select public.complete_onboarding('Code Friend', '#D6E6FF', 'Friend Animal', 'cat')$$, 'friend is onboarded');
select is((select state from public.preview_house_invite((select lower(invite_code) from code_test_invite))), 'active', 'lowercase short code previews the active house');
select is((select result from public.accept_house_invite((select invite_code from code_test_invite), 'code-friend-request')), 'joined', 'friend joins with the short code');
select is((select result from public.accept_house_invite((select invite_code from code_test_invite), 'code-friend-request')), 'already_joined', 'same request remains idempotent');

select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000183', true);
select lives_ok($$select public.complete_onboarding('Code Guesser', '#FFD3A5', 'Guesser Animal', 'rabbit')$$, 'second friend is onboarded');
select is((select result from public.accept_house_invite('ZZZZZZZZ', 'bad-code-request')), 'invite_invalid', 'invalid code cannot join');
select is((select state from public.preview_house_invite('ZZZZZZZZ')), 'invalid', 'invalid preview reveals no house');
create temporary table code_guess_states (state text);
do $$ declare i integer; begin
  for i in 1..8 loop
    insert into code_guess_states select state from public.preview_house_invite('ZZZZZZZZ');
  end loop;
end $$;
select is((select count(*) from code_guess_states where state = 'invalid'), 8::bigint, 'attempts below the limit remain generic');
select is((select state from public.preview_house_invite('ZZZZZZZZ')), 'rate_limited', 'the eleventh code lookup is limited');
select is((select result from public.accept_house_invite('ZZZZZZZZ', 'limited-request')), 'rate_limited', 'acceptance cannot bypass the limit');

set local role postgres;
select * from finish();
rollback;
