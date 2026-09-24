begin;

select plan(11);

select has_table('public', 'memories');
select has_table('public', 'memory_viewers');
select has_function('public', 'create_memory_draft', array['text', 'text', 'date']);
select has_function('public', 'share_memory_draft', array['uuid']);

insert into auth.users (id) values
  ('00000000-0000-0000-0000-000000000030'),
  ('00000000-0000-0000-0000-000000000031'),
  ('00000000-0000-0000-0000-000000000032');
select set_config('request.jwt.claim.role', 'authenticated', true);
set local role authenticated;

select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000030', true);
select lives_ok($$select public.complete_onboarding('Writer', '#BFD7FF', 'Writer Animal', 'bear')$$, 'writer is onboarded');
create temporary table memory_ids (id uuid not null);
insert into memory_ids select public.create_memory_draft('혼자 쓴 기록', '공유 전에는 나만 봐요.', date '2026-09-24');
select is((select status::text from public.memories where id = (select id from memory_ids)), 'private_draft', 'first record remains a private draft');

select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000031', true);
select lives_ok($$select public.complete_onboarding('Friend', '#FFD3A5', 'Friend Animal', 'rabbit')$$, 'friend is onboarded');
select is_empty($$select * from public.memories$$, 'another user cannot read a private draft');

select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000030', true);
select lives_ok($$select public.create_house('추억 권한 집', 'memory-house-request')$$, 'writer creates a house');
create temporary table memory_invites (token text not null);
insert into memory_invites select invite_token from public.create_house_invite(false);

select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000031', true);
select is((select result from public.accept_house_invite((select token from memory_invites), 'memory-friend-request')), 'joined', 'friend joins before sharing');

select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000030', true);
select lives_ok($$select public.share_memory_draft((select id from memory_ids))$$, 'writer shares the draft');
select is((select count(*) from public.memory_viewers where memory_id = (select id from memory_ids)), 2::bigint, 'sharing snapshots both active members');
select lives_ok($$select public.share_memory_draft((select id from memory_ids))$$, 'sharing retry is idempotent');
select is((select count(*) from public.memory_viewers where memory_id = (select id from memory_ids)), 2::bigint, 'sharing retry does not duplicate viewers');

reset role;
select * from finish();
rollback;
