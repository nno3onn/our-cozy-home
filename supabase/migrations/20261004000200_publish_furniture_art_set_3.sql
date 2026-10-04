-- Publish the third finished miniature furniture art set without rewriting
-- prior catalog migrations. Both thumbnail and room rendering use one key.
with finished_assets(item_id, asset_key) as (
  values
    ('curtain-leaf-panels', 'illustrated:furniture:curtain-leaf-panels'),
    ('table-cloud-low', 'illustrated:furniture:table-cloud-low'),
    ('cushion-star', 'illustrated:furniture:cushion-star'),
    ('rug-daisy', 'illustrated:furniture:rug-daisy'),
    ('bed-cloud-nest', 'illustrated:furniture:bed-cloud-nest'),
    ('lighting-cloud-pendant', 'illustrated:furniture:lighting-cloud-pendant'),
    ('plant-cactus-trio', 'illustrated:furniture:plant-cactus-trio'),
    ('snack-acorn-cookie', 'illustrated:furniture:snack-acorn-cookie'),
    ('memory-radio-night-radio', 'illustrated:memory:night-radio'),
    ('memory-frame-leaf-frame', 'illustrated:memory:leaf-frame')
)
update public.item_definitions as item
set thumbnail_key = finished_assets.asset_key,
    room_asset_key = finished_assets.asset_key,
    asset_status = 'final'
from finished_assets
where item.id = finished_assets.item_id;
