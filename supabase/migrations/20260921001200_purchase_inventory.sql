create table public.owned_items (
  id uuid primary key default extensions.gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete restrict,
  item_definition_id text not null references public.item_definitions(id) on delete restrict,
  kind text not null check (kind in ('furniture', 'consumable', 'memory')),
  quantity integer not null default 1 check (quantity > 0),
  recovered_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index owned_consumable_definition_once
on public.owned_items(profile_id, item_definition_id)
where kind = 'consumable' and recovered_at is null;

create table public.purchase_requests (
  profile_id uuid not null references public.profiles(id) on delete restrict,
  request_key uuid not null,
  item_definition_id text not null references public.item_definitions(id) on delete restrict,
  owned_item_id uuid not null references public.owned_items(id) on delete restrict,
  transaction_id uuid not null references public.coin_transactions(id) on delete restrict,
  balance integer not null check (balance >= 0),
  quantity integer not null check (quantity > 0),
  created_at timestamptz not null default now(),
  primary key (profile_id, request_key)
);

alter table public.owned_items enable row level security;
alter table public.purchase_requests enable row level security;
create policy "owned_items_select_owner" on public.owned_items for select to authenticated using (profile_id = auth.uid());
create policy "purchase_requests_select_owner" on public.purchase_requests for select to authenticated using (profile_id = auth.uid());
revoke insert, update, delete on public.owned_items, public.purchase_requests from anon, authenticated;

create or replace function public.purchase_item(p_item_definition_id text, p_request_key uuid)
returns table (item_definition_id text, owned_item_id uuid, balance integer, quantity integer, result text)
language plpgsql security definer set search_path = public
as $$
declare
  uid uuid := auth.uid(); price integer; consumable boolean; item_kind text; owned uuid; item_quantity integer; current_balance integer; tx uuid;
begin
  if uid is null then raise exception 'authentication required' using errcode = '42501'; end if;
  insert into public.coin_wallets(profile_id) values (uid) on conflict (profile_id) do nothing;
  perform 1 from public.coin_wallets where profile_id = uid for update;
  select pr.item_definition_id, pr.owned_item_id, pr.balance, pr.quantity
    into item_definition_id, owned_item_id, balance, quantity
  from public.purchase_requests pr where pr.profile_id = uid and pr.request_key = p_request_key;
  if found then result := 'already_purchased'; return next; return; end if;
  select i.price, i.consumable into price, consumable from public.item_definitions i
    where i.id = p_item_definition_id and i.source = 'shop' and i.active;
  if not found then raise exception 'shop_item_not_found' using errcode = 'P0001'; end if;
  select w.balance into current_balance from public.coin_wallets w where w.profile_id = uid;
  if current_balance < price then raise exception 'insufficient_coins' using errcode = 'P0001', detail = json_build_object('balance', current_balance, 'price', price, 'shortage', price - current_balance)::text; end if;
  item_kind := case when consumable then 'consumable' else 'furniture' end;
  if consumable then
    select id, quantity into owned, item_quantity from public.owned_items where profile_id = uid and item_definition_id = p_item_definition_id and kind = 'consumable' and recovered_at is null for update;
    if found then update public.owned_items set quantity = quantity + 1, updated_at = now() where id = owned returning quantity into item_quantity;
    else insert into public.owned_items(profile_id,item_definition_id,kind) values(uid,p_item_definition_id,item_kind) returning id,quantity into owned,item_quantity; end if;
  else
    insert into public.owned_items(profile_id,item_definition_id,kind) values(uid,p_item_definition_id,item_kind) returning id,quantity into owned,item_quantity;
  end if;
  update public.coin_wallets w set balance = w.balance - price, updated_at = now() where w.profile_id = uid returning w.balance into current_balance;
  insert into public.coin_transactions(profile_id,amount,reason) values(uid,-price,'purchase:' || p_item_definition_id) returning id into tx;
  insert into public.purchase_requests(profile_id,request_key,item_definition_id,owned_item_id,transaction_id,balance,quantity)
    values(uid,p_request_key,p_item_definition_id,owned,tx,current_balance,item_quantity);
  item_definition_id := p_item_definition_id; owned_item_id := owned; balance := current_balance; quantity := item_quantity; result := 'purchased'; return next;
end; $$;

create or replace function public.get_purchase_result(p_request_key uuid)
returns table (item_definition_id text, owned_item_id uuid, balance integer, quantity integer, result text)
language sql security definer set search_path = public
as $$ select pr.item_definition_id, pr.owned_item_id, pr.balance, pr.quantity, 'already_purchased'::text from public.purchase_requests pr where pr.profile_id = auth.uid() and pr.request_key = p_request_key; $$;

revoke all on function public.purchase_item(text, uuid), public.get_purchase_result(uuid) from public;
grant execute on function public.purchase_item(text, uuid), public.get_purchase_result(uuid) to authenticated;
