begin;

select plan(22);

select has_table('public', 'memory_completion_events');
select has_function('public', 'complete_memory_if_ready', array['uuid']);
select col_is_unique('public', 'memory_completion_events', array['memory_id']);
select has_column('public', 'memories', 'generated_item_id');
select has_column('public', 'owned_items', 'memory_id');

insert into auth.users (id) values
  ('00000000-0000-0000-0000-000000000050'),
  ('00000000-0000-0000-0000-000000000051'),
  ('00000000-0000-0000-0000-000000000052');
select set_config('request.jwt.claim.role', 'authenticated', true);
set local role authenticated;

select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000050', true);
select lives_ok($$select public.complete_onboarding('Writer', '#BFD7FF', 'Writer Animal', 'bear')$$, 'writer is onboarded');
select lives_ok($$select public.create_house('완성 테스트 집', 'completion-house')$$, 'writer creates a house');
create temporary table completion_invites (token text not null);
insert into completion_invites select invite_token from public.create_house_invite(false);
create temporary table completion_memory (id uuid not null);
insert into completion_memory select public.create_memory_draft('같이 만든 추억', '첫 기여', date '2026-09-24');

select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000051', true);
select lives_ok($$select public.complete_onboarding('Friend', '#FFD3A5', 'Friend Animal', 'rabbit')$$, 'friend is onboarded');
select is((select result from public.accept_house_invite((select token from completion_invites), 'completion-friend')), 'joined', 'friend joins');
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000052', true);
select lives_ok($$select public.complete_onboarding('Third', '#D6E6FF', 'Third Animal', 'cat')$$, 'third user is onboarded');
select is((select result from public.accept_house_invite((select token from completion_invites), 'completion-third')), 'joined', 'third user joins');

select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000050', true);
select lives_ok($$select public.share_memory_draft((select id from completion_memory))$$, 'writer shares the first contribution');
select is((select status::text from public.memories where id=(select id from completion_memory)), 'shared', 'one contributor leaves the memory shared');
select is((select count(*) from public.memory_completion_events), 0::bigint, 'one contributor has no furniture event');

select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000051', true);
select lives_ok($$select public.add_memory_contribution((select id from completion_memory), '두 번째 기여')$$, 'second distinct contributor completes the memory');
reset role;
select is((select status::text from public.memories where id=(select id from completion_memory)), 'completed', 'two contributors complete the memory');
select is((select count(*) from public.memory_completion_events where memory_id=(select id from completion_memory)), 1::bigint, 'completion event is emitted once');
select is((select count(*) from public.owned_items where memory_id=(select id from completion_memory)), 1::bigint, 'one memory furniture item is generated');

set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000052', true);
select lives_ok($$select public.add_memory_contribution((select id from completion_memory), '세 번째 기여')$$, 'a third contributor can add content');
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000051', true);
select lives_ok($$select public.add_memory_contribution((select id from completion_memory), '두 번째 기여 수정')$$, 'a revision retry is accepted');
reset role;
select is((select count(*) from public.memory_completion_events where memory_id=(select id from completion_memory)), 1::bigint, 'later contributions do not duplicate the event');
select is((select count(*) from public.owned_items where memory_id=(select id from completion_memory)), 1::bigint, 'later contributions do not duplicate furniture');

select * from finish();
rollback;
