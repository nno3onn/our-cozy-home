-- Publish the remaining memory furniture art without rewriting prior
-- catalog migrations. Both thumbnail and room rendering use one key.
with finished_assets(item_id, asset_key) as (
  values
    ('memory-dining-table-snow-table', 'illustrated:memory:snow-table'),
    ('memory-radio-cassette-radio', 'illustrated:memory:cassette-radio'),
    ('memory-radio-shell-radio', 'illustrated:memory:shell-radio'),
    ('memory-frame-cloud-frame', 'illustrated:memory:cloud-frame'),
    ('memory-frame-star-frame', 'illustrated:memory:star-frame'),
    ('memory-frame-stamp-frame', 'illustrated:memory:stamp-frame')
)
update public.item_definitions as item
set thumbnail_key = finished_assets.asset_key,
    room_asset_key = finished_assets.asset_key,
    asset_status = 'final'
from finished_assets
where item.id = finished_assets.item_id;
