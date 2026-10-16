begin;
select no_plan();

select has_function('public','place_owned_item_scoped',array['uuid','uuid','text','integer','text'],'scoped command exists');
select ok(not has_function_privilege('anon','public.place_owned_item(uuid,text,integer)','EXECUTE'),'anonymous legacy execution revoked');
select ok(not has_function_privilege('authenticated','public.place_owned_item(uuid,text,integer)','EXECUTE'),'authenticated legacy execution revoked');
select ok(not has_function_privilege('anon','public.place_owned_item_scoped(uuid,uuid,text,integer,text)','EXECUTE'),'anonymous scoped execution denied');
select ok(has_function_privilege('authenticated','public.place_owned_item_scoped(uuid,uuid,text,integer,text)','EXECUTE'),'authenticated scoped execution allowed');
select ok(not has_table_privilege('authenticated','public.room_placement_requests','SELECT'),'receipts are not client readable');
select ok(not has_table_privilege('anon','public.room_placement_requests','SELECT'),'receipts are not anonymously readable');
select ok((select relrowsecurity from pg_class where oid='public.room_placement_requests'::regclass),'receipt RLS enabled');
select throws_ok($$select * from public.place_owned_item(null,null,null)$$,'42501','placement_scope_required','legacy body denies even its owner');

insert into auth.users(id) values ('00000000-0000-0000-0000-000000165001'),('00000000-0000-0000-0000-000000165002');
set local role authenticated;
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000165001',true);
select public.complete_onboarding('배치주인','#123456','동물','cat');
create temporary table scope_house as select house_id from public.create_house('배치집','scope-house');
create temporary table scope_invite as select invite_token from public.create_house_invite(false);
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000165002',true);
select public.complete_onboarding('친구','#123456','동물','cat');
select * from public.accept_house_invite((select invite_token from scope_invite),'scope-friend');

set local role postgres;
insert into public.owned_items(id,profile_id,item_definition_id,kind) values
 ('00000000-0000-0000-0000-000000165011','00000000-0000-0000-0000-000000165001','cushion-shell','furniture'),
 ('00000000-0000-0000-0000-000000165012','00000000-0000-0000-0000-000000165002','cushion-knot','furniture'),
 ('00000000-0000-0000-0000-000000165013','00000000-0000-0000-0000-000000165001','snack-carrot-stars','consumable');
set local role authenticated;
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000165001',true);
select throws_ok($$select * from public.place_owned_item_scoped(null,'00000000-0000-0000-0000-000000165011','floor-accent-left',0,'null-house')$$,'22023',null,'null house fails closed');
select throws_ok($$select * from public.place_owned_item_scoped((select house_id from scope_house),'00000000-0000-0000-0000-000000165011','floor-accent-left',null,'null-version')$$,'22023',null,'null version rejected');
select throws_ok($$select * from public.place_owned_item_scoped((select house_id from scope_house),'00000000-0000-0000-0000-000000165011','floor-accent-left',0,' ')$$,'22023',null,'empty request key rejected');
select throws_ok($$select * from public.place_owned_item_scoped((select house_id from scope_house),'00000000-0000-0000-0000-000000165012','floor-accent-left',0,'foreign')$$,'42501',null,'foreign owned item denied');
select throws_ok($$select * from public.place_owned_item_scoped((select house_id from scope_house),'00000000-0000-0000-0000-000000165013','animal-use',0,'snack')$$,'42501',null,'consumable cannot be placed');
select throws_ok($$select * from public.place_owned_item_scoped((select house_id from scope_house),'00000000-0000-0000-0000-000000165011','window',0,'wrong-slot')$$,'P0001',null,'incompatible slot denied');
select throws_ok($$select * from public.place_owned_item_scoped((select house_id from scope_house),'00000000-0000-0000-0000-000000165011','floor-accent-left',4,'empty-stale')$$,'P0001',null,'empty slot requires version zero');
select is((select version from public.place_owned_item_scoped((select house_id from scope_house),'00000000-0000-0000-0000-000000165011','floor-accent-left',0,'first')),1,'first placement is version one');
select is((select version from public.place_owned_item_scoped((select house_id from scope_house),'00000000-0000-0000-0000-000000165011','floor-accent-left',0,'first')),1,'duplicate returns original receipt');
select throws_ok($$select * from public.place_owned_item_scoped((select house_id from scope_house),'00000000-0000-0000-0000-000000165011','floor-accent-right',0,'first')$$,'P0001',null,'same key different payload rejected');
select throws_ok($$select * from public.place_owned_item_scoped((select house_id from scope_house),'00000000-0000-0000-0000-000000165011','floor-accent-right',0,'duplicate-item')$$,'P0001',null,'one owned item cannot occupy two slots');
select throws_ok($$select count(*) from public.room_placement_requests$$,'42501',null,'direct receipt read denied');

select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000165002',true);
select is((select version from public.place_owned_item_scoped((select house_id from scope_house),'00000000-0000-0000-0000-000000165012','floor-accent-left',1,'friend-replace')),2,'active friend may replace with own item');
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000165001',true);
select is((select version from public.place_owned_item_scoped((select house_id from scope_house),'00000000-0000-0000-0000-000000165011','floor-accent-left',0,'first')),1,'historical retry only returns old receipt');
select is((select version from public.room_placements where house_id=(select house_id from scope_house) and slot_id='floor-accent-left'),2,'historical retry does not overwrite friend');
select * from public.leave_house();
select throws_ok($$select * from public.place_owned_item_scoped((select house_id from scope_house),'00000000-0000-0000-0000-000000165011','floor-accent-right',0,'after-leave')$$,'42501',null,'departed member cannot write');
select * from public.create_house('새집','second-house');
select throws_ok($$select * from public.place_owned_item_scoped((select house_id from scope_house),'00000000-0000-0000-0000-000000165011','floor-accent-right',0,'delayed')$$,'42501',null,'old-house request cannot target new active house');
set local role postgres;
select is((select count(*)::integer from public.owned_items where id in ('00000000-0000-0000-0000-000000165011','00000000-0000-0000-0000-000000165012','00000000-0000-0000-0000-000000165013')),3,'all assets preserved');
select is((select count(*)::integer from public.room_placement_requests where profile_id in ('00000000-0000-0000-0000-000000165001','00000000-0000-0000-0000-000000165002')),2,'failed requests leave no partial receipt');
select * from finish();
rollback;
