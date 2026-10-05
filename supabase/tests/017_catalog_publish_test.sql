begin;

select plan(6);

select is(
  (select count(*) from public.room_slots),
  12::bigint,
  'all fixed room slots are published by migrations'
);

select is(
  (select count(*) from public.item_definitions where active),
  55::bigint,
  'all active catalog items are published by migrations'
);

select is(
  (select count(*) from public.item_definitions where source = 'shop' and active),
  40::bigint,
  'the eight shop categories publish forty goods'
);

select is(
  (select count(*) from public.item_definitions where source = 'memory' and active),
  15::bigint,
  'the three memory furniture categories publish fifteen appearances'
);

select is(
  (select count(*) from public.item_definitions where asset_status = 'final' and active),
  39::bigint,
  'the thirty-nine completed furniture assets remain marked final'
);

select is(
  (select count(*) from public.item_definitions where not active),
  0::bigint,
  'the v1 catalog contains no accidentally inactive item'
);

select * from finish();
rollback;
