-- Publish the second finished miniature furniture set without rewriting the
-- original catalog snapshot migration.
begin;

with finished_assets(item_id, asset_key) as (
  values
    ('curtain-cloud-valance', 'illustrated:furniture:curtain-cloud-valance'),
    ('table-tulip-pedestal', 'illustrated:furniture:table-tulip-pedestal'),
    ('cushion-knot', 'illustrated:furniture:cushion-mint-knot'),
    ('rug-wavy', 'illustrated:furniture:rug-wavy'),
    ('bed-log-bed', 'illustrated:furniture:bed-log'),
    ('lighting-mushroom-lamp', 'illustrated:furniture:lighting-mushroom'),
    ('plant-hanging-ivy', 'illustrated:furniture:plant-hanging-ivy'),
    ('snack-carrot-stars', 'illustrated:furniture:snack-carrot-stars'),
    ('memory-frame-ribbon-frame', 'illustrated:memory:ribbon-frame'),
    ('memory-dining-table-picnic-table', 'illustrated:memory:picnic-table')
)
update public.item_definitions as item
set thumbnail_key = finished.asset_key,
    room_asset_key = finished.asset_key,
    asset_status = 'final'
from finished_assets as finished
where item.id = finished.item_id;

commit;
