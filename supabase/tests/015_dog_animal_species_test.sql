begin;

select plan(2);

insert into auth.users (id) values ('00000000-0000-0000-0000-000000000090');
select set_config('request.jwt.claim.role', 'authenticated', true);
set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000090', true);

select lives_ok(
  $$select public.complete_onboarding('강아지 친구', '#FFD3A5', '몽이', 'dog')$$,
  'onboarding accepts the dog enum value'
);
select is(
  (select species::text from public.animals where profile_id = '00000000-0000-0000-0000-000000000090'),
  'dog',
  'the personal animal stores dog as its species'
);

select * from finish();
rollback;
