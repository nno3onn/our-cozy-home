begin;

select plan(10);

select has_function(
  'public',
  'perform_animal_action',
  array['uuid', 'animal_state'],
  'authenticated animal action RPC exists'
);

insert into auth.users (id) values
  ('00000000-0000-0000-0000-000000000091'),
  ('00000000-0000-0000-0000-000000000092'),
  ('00000000-0000-0000-0000-000000000093');
select set_config('request.jwt.claim.role', 'authenticated', true);
set local role authenticated;

select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000091', true);
select lives_ok(
  $$select public.complete_onboarding('행동 주인', '#F2A98C', '토리', 'dog')$$,
  'owner is onboarded'
);
select lives_ok(
  $$select public.create_house('행동 테스트 집', 'animal-action-house')$$,
  'owner creates the house'
);
create temporary table animal_action_invite (token text not null);
insert into animal_action_invite select invite_token from public.create_house_invite(false);

select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000092', true);
select lives_ok(
  $$select public.complete_onboarding('행동 친구', '#91C9AF', '두부', 'bear')$$,
  'friend is onboarded'
);
select is(
  (select result from public.accept_house_invite((select token from animal_action_invite), 'animal-action-friend')),
  'joined',
  'friend joins the same active house'
);

select lives_ok(
  $$select public.perform_animal_action(
    (select id from public.animals where profile_id = '00000000-0000-0000-0000-000000000091'),
    'eating'
  )$$,
  'a member can interact with a friend animal'
);
select is(
  (select state::text from public.animals where profile_id = '00000000-0000-0000-0000-000000000091'),
  'eating',
  'the requested action is stored'
);
create temporary table animal_action_target (id uuid not null);
insert into animal_action_target
select id from public.animals where profile_id = '00000000-0000-0000-0000-000000000091';
grant select on animal_action_target to authenticated;
select throws_ok(
  $$select public.perform_animal_action(
    (select id from public.animals where profile_id = '00000000-0000-0000-0000-000000000092'),
    'idle'
  )$$,
  '22023',
  'invalid_animal_action',
  'idle cannot be submitted as an action'
);

select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000093', true);
select lives_ok(
  $$select public.complete_onboarding('바깥 사용자', '#94BFE0', '보리', 'cat')$$,
  'outsider is onboarded'
);
select throws_ok(
  $$select public.perform_animal_action(
    (select id from animal_action_target),
    'playing'
  )$$,
  '42501',
  'animal_action_forbidden',
  'an outsider cannot interact with the house animal'
);

select * from finish();
rollback;
