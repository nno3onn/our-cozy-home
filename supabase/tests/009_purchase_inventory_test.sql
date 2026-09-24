begin;

select plan(15);

select has_table('public', 'owned_items');
select has_table('public', 'purchase_requests');
select has_function('public', 'purchase_item');
select has_function('public', 'get_purchase_result');

insert into auth.users (id) values ('00000000-0000-0000-0000-000000000050');
select set_config('request.jwt.claim.role', 'authenticated', true);
set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000050', true);
select lives_ok(
  $$select public.complete_onboarding('구매 사용자', '#BFD7FF', '구매 동물', 'rabbit')$$,
  'an authenticated profile can be onboarded for purchases'
);

reset role;
insert into public.coin_wallets(profile_id, balance) values ('00000000-0000-0000-0000-000000000050', 1000)
on conflict (profile_id) do update set balance = excluded.balance;
set local role authenticated;

select is(
  (select result from public.purchase_item('curtain-ribbon-pair', '00000000-0000-4000-8000-000000000501')),
  'purchased',
  'a purchase records a new request result'
);
select is(
  (select balance from public.coin_wallets where profile_id = '00000000-0000-0000-0000-000000000050'),
  680,
  'the server catalog price is atomically deducted from the wallet'
);
select is(
  (select count(*) from public.owned_items where profile_id = '00000000-0000-0000-0000-000000000050' and item_definition_id = 'curtain-ribbon-pair'),
  1::bigint,
  'a non-consumable purchase grants one personally owned item'
);
select is(
  (select result from public.purchase_item('curtain-ribbon-pair', '00000000-0000-4000-8000-000000000501')),
  'already_purchased',
  'a duplicate request key returns its prior result'
);
select is(
  (select count(*) from public.coin_transactions where profile_id = '00000000-0000-0000-0000-000000000050' and reason = 'purchase:curtain-ribbon-pair'),
  1::bigint,
  'a duplicate request key does not create another debit ledger entry'
);
select is(
  (select result from public.purchase_item('snack-carrot-stars', '00000000-0000-4000-8000-000000000502')),
  'purchased',
  'a consumable purchase succeeds'
);
select is(
  (select result from public.purchase_item('snack-carrot-stars', '00000000-0000-4000-8000-000000000503')),
  'purchased',
  'a second consumable request succeeds'
);
select is(
  (select quantity from public.owned_items where profile_id = '00000000-0000-0000-0000-000000000050' and item_definition_id = 'snack-carrot-stars'),
  2,
  'consumables accumulate on the owner''s single active inventory row'
);

reset role;
update public.coin_wallets set balance = 0 where profile_id = '00000000-0000-0000-0000-000000000050';
set local role authenticated;
select throws_like(
  $$select public.purchase_item('snack-carrot-stars', '00000000-0000-4000-8000-000000000504')$$,
  '%insufficient_coins%',
  'insufficient funds reject the purchase without minting an item'
);
reset role;
select is(
  (select count(*) from public.owned_items where profile_id = '00000000-0000-0000-0000-000000000050' and item_definition_id = 'snack-carrot-stars'),
  1::bigint,
  'a rejected purchase leaves the existing consumable ownership row unchanged'
);

select * from finish();
rollback;
