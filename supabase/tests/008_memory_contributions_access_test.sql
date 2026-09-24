begin;

select plan(30);

select has_table('public', 'memory_contributions');
select has_table('public', 'memory_contribution_revisions');
select has_table('public', 'memory_photos');
select has_function('public', 'revise_memory_contribution', array['uuid', 'text']);
select has_function('public', 'delete_memory_contribution', array['uuid']);
select has_function('public', 'list_memory_summaries', array['text']);
select has_function('public', 'get_memory_contribution_detail', array['uuid']);
select has_function('public', 'get_memory_photo_metadata', array['uuid']);

insert into auth.users (id) values
  ('00000000-0000-0000-0000-000000000040'),
  ('00000000-0000-0000-0000-000000000041'),
  ('00000000-0000-0000-0000-000000000042');
select set_config('request.jwt.claim.role', 'authenticated', true);
set local role authenticated;

select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000040', true);
select lives_ok($$select public.complete_onboarding('Writer', '#BFD7FF', 'Writer Animal', 'bear')$$, 'writer is onboarded');
select lives_ok($$select public.create_house('기여 범위 집', 'contribution-house')$$, 'writer creates a house');
create temporary table contribution_invites (token text not null);
insert into contribution_invites select invite_token from public.create_house_invite(false);
create temporary table contribution_memory (id uuid not null);
insert into contribution_memory select public.create_memory_draft('공원 산책', '처음 남긴 기록', date '2026-09-24');

select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000041', true);
select lives_ok($$select public.complete_onboarding('Contributor', '#FFD3A5', 'Friend Animal', 'rabbit')$$, 'contributor is onboarded');
select is((select result from public.accept_house_invite((select token from contribution_invites), 'contributor-join')), 'joined', 'contributor joins before sharing');

select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000042', true);
select lives_ok($$select public.complete_onboarding('Viewer', '#D6E6FF', 'Viewer Animal', 'cat')$$, 'viewer is onboarded');
select is((select result from public.accept_house_invite((select token from contribution_invites), 'viewer-join')), 'joined', 'viewer joins before sharing');

select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000040', true);
select lives_ok($$select public.share_memory_draft((select id from contribution_memory))$$, 'sharing creates the writer contribution');
reset role;
select is((select count(*) from public.memory_contributions where memory_id=(select id from contribution_memory)), 1::bigint, 'the original draft counts as one contribution');
set local role authenticated;

select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000041', true);
create temporary table friend_contribution (id uuid not null);
insert into friend_contribution select public.add_memory_contribution((select id from contribution_memory), '두 번째 기록');
select lives_ok($$select public.revise_memory_contribution((select id from friend_contribution), '수정한 두 번째 기록')$$, 'a contributor can revise their own contribution');
reset role;
select is((select count(*) from public.memory_contributions where memory_id=(select id from contribution_memory) and deleted_at is null), 2::bigint, 'revisions do not add contributors');
set local role authenticated;

select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000042', true);
select lives_ok($$select public.leave_house()$$, 'a viewer without a contribution can leave');
select is((select count(*) from public.list_memory_summaries('archive')), 0::bigint, 'a non-contributor receives no personal archive');

select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000041', true);
select lives_ok($$select public.leave_house()$$, 'a direct contributor can leave');
select is((select count(*) from public.list_memory_summaries('archive')), 1::bigint, 'a direct contributor retains the personal archive');
select is((select count(*) from public.get_memory_contribution_detail((select id from contribution_memory))), 2::bigint, 'the archive exposes only revisions published before departure');

select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000040', true);
create temporary table writer_contribution (id uuid not null);
insert into writer_contribution select id from public.memory_contributions where memory_id=(select id from contribution_memory) and author_profile_id='00000000-0000-0000-0000-000000000040';
select lives_ok($$select public.revise_memory_contribution((select id from writer_contribution), '퇴장 뒤 새 기록')$$, 'a current member can revise after another member leaves');

select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000041', true);
select is((select count(*) from public.get_memory_contribution_detail((select id from contribution_memory))), 2::bigint, 'post-departure revisions stay hidden from the archive');

select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000040', true);
select lives_ok($$select public.delete_memory_contribution((select id from writer_contribution))$$, 'the original author can delete their contribution');

select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000041', true);
select is((select count(*) from public.get_memory_contribution_detail((select id from contribution_memory))), 1::bigint, 'origin deletion hides the original contribution from the archive');

select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000040', true);
create temporary table rejoin_invites (token text not null);
insert into rejoin_invites select invite_token from public.create_house_invite(false);
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000041', true);
select is((select result from public.accept_house_invite((select token from rejoin_invites), 'contributor-rejoin')), 'joined', 'the contributor can later rejoin the house');
select is((select count(*) from public.list_memory_summaries('current')), 0::bigint, 'rejoining does not restore the old current-memory grant');
select is((select count(*) from public.list_memory_summaries('archive')), 1::bigint, 'rejoining preserves only the original personal archive scope');

reset role;
select * from finish();
rollback;
