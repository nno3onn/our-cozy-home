-- Publish the fifth finished miniature furniture art set without rewriting
-- prior catalog migrations. Both thumbnail and room rendering use one key.
with finished_assets(item_id, asset_key) as (
  values
    ('curtain-cafe-check', 'illustrated:furniture:curtain-cafe-check'),
    ('table-clover-table', 'illustrated:furniture:table-clover'),
    ('cushion-petal', 'illustrated:furniture:cushion-petal'),
    ('rug-forest-path', 'illustrated:furniture:rug-forest-path'),
    ('bed-bookcase-bed', 'illustrated:furniture:bed-bookcase'),
    ('lighting-tulip-lamp', 'illustrated:furniture:lighting-tulip'),
    ('plant-mini-palm', 'illustrated:furniture:plant-mini-palm'),
    ('snack-milk-jelly', 'illustrated:furniture:snack-milk-jelly'),
    ('snack-leaf-biscuit', 'illustrated:furniture:snack-leaf-biscuit'),
    ('memory-dining-table-brunch-table', 'illustrated:memory:brunch-table')
)
update public.item_definitions as item
set thumbnail_key = finished_assets.asset_key,
    room_asset_key = finished_assets.asset_key,
    asset_status = 'final'
from finished_assets
where item.id = finished_assets.item_id;
