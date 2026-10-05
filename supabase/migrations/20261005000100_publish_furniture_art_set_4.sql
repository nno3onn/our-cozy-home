-- Publish the fourth finished miniature furniture art set without rewriting
-- prior catalog migrations. Both thumbnail and room rendering use one key.
with finished_assets(item_id, asset_key) as (
  values
    ('curtain-star-drape', 'illustrated:furniture:curtain-star-drape'),
    ('table-shelf-table', 'illustrated:furniture:table-shelf'),
    ('cushion-cloud', 'illustrated:furniture:cushion-cloud'),
    ('rug-picnic-check', 'illustrated:furniture:rug-picnic-check'),
    ('bed-berry-canopy', 'illustrated:furniture:bed-berry-canopy'),
    ('lighting-constellation', 'illustrated:furniture:lighting-constellation'),
    ('plant-flower-pot', 'illustrated:furniture:plant-flower-pot'),
    ('snack-fish-cloud', 'illustrated:furniture:snack-fish-cloud'),
    ('memory-dining-table-starlight-table', 'illustrated:memory:starlight-table'),
    ('memory-radio-forest-radio', 'illustrated:memory:forest-radio')
)
update public.item_definitions as item
set thumbnail_key = finished_assets.asset_key,
    room_asset_key = finished_assets.asset_key,
    asset_status = 'final'
from finished_assets
where item.id = finished_assets.item_id;
