begin;

select plan(14);

select has_table('public', 'account_deletion_requests', 'account deletion requests exists');
select has_function('public', 'request_account_deletion', array['uuid']);
select has_function('public', 'mark_account_deletion_completed', array['uuid']);
select has_function('public', 'get_account_deletion_status');

insert into auth.users (id) values ('00000000-0000-0000-0000-000000000070');
select set_config('request.jwt.claim.role', 'authenticated', true);
set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000070', true);
select lives_ok($$select public.complete_onboarding('삭제 사용자', '#BFD7FF', '삭제 동물', 'rabbit')$$, 'the deleting user is onboarded');
select lives_ok($$select public.create_house('삭제 테스트 집', 'delete-house')$$, 'the deleting user can own a house before deletion');
create temporary table deletion_draft (id uuid not null);
insert into deletion_draft select public.create_memory_draft('개인 초안', '삭제할 원문', date '2026-09-28');

set local role postgres;
insert into public.push_tokens(profile_id, token, platform) values ('00000000-0000-0000-0000-000000000070', 'ExponentPushToken[deletion-test]', 'web');
set local role authenticated;
select is(
  (select status from public.request_account_deletion('00000000-0000-4000-8000-000000000701')),
  'ready_for_auth_deletion',
  'the user prepares an idempotent deletion before privileged Auth removal'
);

set local role postgres;
select is(
  (select status::text from public.house_memberships where profile_id = '00000000-0000-0000-0000-000000000070' order by created_at desc limit 1),
  'left',
  'deletion reuses the house departure transaction'
);
select is(
  (select display_name from public.profiles where id = '00000000-0000-0000-0000-000000000070'),
  '떠난 친구',
  'the retained profile tombstone has no original display name'
);
select ok(
  (select deleted_at is not null from public.animals where profile_id = '00000000-0000-0000-0000-000000000070'),
  'the retained animal provenance is soft-deleted and anonymized'
);
select is_empty(
  $$select * from public.memories where id = (select id from deletion_draft)$$,
  'private drafts are removed during account deletion preparation'
);
select is_empty(
  $$select * from public.push_tokens where profile_id = '00000000-0000-0000-0000-000000000070'$$,
  'push tokens are removed before Auth deletion'
);

set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000070', true);
select is(
  (select status from public.request_account_deletion('00000000-0000-4000-8000-000000000702')),
  'ready_for_auth_deletion',
  'a retry returns the existing prepared state without repeating cleanup'
);
select is_empty(
  $$select * from public.profiles where id = '00000000-0000-0000-0000-000000000070'$$,
  'a prepared deletion account cannot read its own tombstone through RLS'
);

select * from finish();
rollback;
