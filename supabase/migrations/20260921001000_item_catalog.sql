create table if not exists public.item_definitions (
  id text primary key, source text not null check (source in ('shop','memory')), category text not null,
  theme text not null, name_ko text not null, price integer not null check(price >= 0), consumable boolean not null,
  thumbnail_key text not null, room_asset_key text not null, silhouette text not null,
  size jsonb not null, anchor jsonb not null, allowed_slot_ids jsonb not null,
  layer_bias integer not null, interaction text not null, asset_status text not null check(asset_status in ('placeholder','final')),
  preview_color text not null, active boolean not null default true
);
alter table public.item_definitions enable row level security;
create policy "item_definitions_select_active" on public.item_definitions for select to authenticated using (active);
revoke insert,update,delete on public.item_definitions from anon,authenticated;
