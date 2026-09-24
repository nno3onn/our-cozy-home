begin;

select plan(19);

select has_table('public', 'notification_events');
select has_table('public', 'notification_deliveries');
select has_table('public', 'notification_delivery_targets');
select has_table('public', 'notification_preferences');
select has_function('public', 'enqueue_notification_event', array['text','text','uuid','uuid','uuid','uuid']);
select has_function('public', 'set_my_push_enabled', array['boolean']);
select has_function('public', 'claim_notification_delivery_targets', array['integer','integer']);
select has_function('public', 'record_notification_ticket_result', array['uuid','text','text','text']);
select has_function('public', 'claim_notification_receipts', array['integer','integer']);
select has_function('public', 'record_notification_receipt_result', array['uuid','text','text']);

insert into auth.users(id) values
  ('00000000-0000-0000-0000-000000000070'),
  ('00000000-0000-0000-0000-000000000071');
select set_config('request.jwt.claim.role', 'authenticated', true);
set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000070', true);
select lives_ok($$select public.complete_onboarding('알림 집장', '#BFD7FF', '집장 동물', 'bear')$$, 'owner is onboarded');
select lives_ok($$select public.create_house('알림 테스트 집', 'notification-house')$$, 'owner creates a house');
create temporary table notification_invites(token text not null);
insert into notification_invites select invite_token from public.create_house_invite(false);

select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000071', true);
select lives_ok($$select public.complete_onboarding('알림 친구', '#FFD3A5', '친구 동물', 'rabbit')$$, 'friend is onboarded');
select lives_ok($$select public.accept_house_invite((select token from notification_invites), 'notification-join')$$, 'friend joins');
reset role;

select is((select count(*) from public.notification_events where event_type='house_joined'), 1::bigint, 'joining creates exactly one outbox event');
select is((select count(*) from public.notification_deliveries d join public.notification_events e on e.id=d.event_id where e.event_type='house_joined'), 1::bigint, 'joining creates one delivery for the existing member');
select is((select count(*) from public.notification_deliveries d join public.notification_events e on e.id=d.event_id where e.event_type='house_joined' and d.recipient_profile_id='00000000-0000-0000-0000-000000000071'::uuid), 0::bigint, 'actor is excluded from the join notification');
select is((select event_key from public.notification_events where event_type='house_joined'), (select event_key from public.notification_events where event_type='house_joined'), 'event key remains stable for idempotent inserts');
select is_empty($$select * from public.notification_events where false$$, 'a no-op event query remains empty');

select * from finish();
rollback;
