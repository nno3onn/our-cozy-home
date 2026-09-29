begin;

select plan(11);

select has_table('public', 'room_placements', 'room placements exists');
select has_function('public', 'place_owned_item');
select has_function('public', 'is_active_house_placed_item');

insert into auth.users (id) values
  ('00000000-0000-0000-0000-000000000060'),
  ('00000000-0000-0000-0000-000000000061');
select set_config('request.jwt.claim.role', 'authenticated', true);
set local role authenticated;

select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000060', true);
select lives_ok($$select public.complete_onboarding('가구 주인', '#BFD7FF', '주인 동물', 'rabbit')$$, 'the furniture owner is onboarded');
select lives_ok($$select public.create_house('배치 권한 테스트 집', 'placement-house')$$, 'the furniture owner creates a house');
create temporary table placement_invites (token text not null);
insert into placement_invites select invite_token from public.create_house_invite(false);

select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000061', true);
select lives_ok($$select public.complete_onboarding('방 친구', '#FFD3A5', '친구 동물', 'cat')$$, 'the room friend is onboarded');
select is((select result from public.accept_house_invite((select token from placement_invites), 'placement-friend')), 'joined', 'the friend joins the same active house');

set local role postgres;
create temporary table placement_fixture (owned_item_id uuid not null);
with inserted_owned_item as (
  insert into public.owned_items(profile_id, item_definition_id, kind)
  values ('00000000-0000-0000-0000-000000000060', 'cushion-shell', 'furniture')
  returning id
)
insert into placement_fixture select id from inserted_owned_item;
grant select on placement_fixture to authenticated;
insert into public.room_placements(house_id, slot_id, owned_item_id)
select hm.house_id, 'floor-accent-left', fixture.owned_item_id
from public.house_memberships hm cross join placement_fixture fixture
where hm.profile_id = '00000000-0000-0000-0000-000000000060' and hm.status = 'active';

set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000061', true);
select results_eq(
  $$select id from public.owned_items order by id$$,
  $$select owned_item_id from placement_fixture$$,
  'an active house member can read a different owner''s currently placed furniture'
);
select is_empty(
  $$select * from public.purchase_requests where profile_id = '00000000-0000-0000-0000-000000000060'$$,
  'shared-room visibility does not expose another member''s purchase records'
);

set local role postgres;
select lives_ok(
  $$delete from public.room_placements where owned_item_id = (select owned_item_id from placement_fixture)$$,
  'a departure-style placement recovery can remove the shared placement'
);
set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000061', true);
select is_empty(
  $$select * from public.owned_items where id = (select owned_item_id from placement_fixture)$$,
  'a former placement is no longer readable to a non-owner'
);

select * from finish();
rollback;
