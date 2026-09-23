import type { ItemDefinition } from './items';

export const ROOM_SLOT_SEED = [
  { id: 'window', nameKo: '창가 커튼 자리', zone: 'wall' },
  { id: 'center-table', nameKo: '가운데 탁자 자리', zone: 'floor' },
  { id: 'floor-accent-left', nameKo: '왼쪽 포근 자리', zone: 'floor' },
  { id: 'floor-accent-right', nameKo: '오른쪽 포근 자리', zone: 'floor' },
  { id: 'floor-rug', nameKo: '바닥 러그 자리', zone: 'floor' },
  { id: 'bed-corner', nameKo: '침대 모서리', zone: 'floor' },
  { id: 'light-left', nameKo: '왼쪽 조명 자리', zone: 'floor' },
  { id: 'light-right', nameKo: '오른쪽 조명 자리', zone: 'floor' },
  { id: 'plant-corner', nameKo: '식물 모서리', zone: 'floor' },
  { id: 'animal-use', nameKo: '동물 사용 아이템', zone: 'animal' },
  { id: 'memory-wall', nameKo: '추억 벽 자리', zone: 'wall' },
  { id: 'memory-shelf', nameKo: '추억 선반 자리', zone: 'shelf' },
] as const;

function sqlString(value: string): string {
  return `'${value.replaceAll("'", "''")}'`;
}

function sqlJson(value: unknown): string {
  return `${sqlString(JSON.stringify(value))}::jsonb`;
}

function itemValues(item: ItemDefinition): string {
  return [
    item.id,
    item.source,
    item.category,
    item.theme,
    item.nameKo,
    String(item.price),
    String(item.consumable),
    item.thumbnailKey,
    item.roomAssetKey,
    item.silhouette,
    sqlJson(item.size),
    sqlJson(item.anchor),
    sqlJson(item.allowedSlotIds),
    String(item.layerBias),
    item.interaction,
    item.assetStatus,
    item.previewColor,
    'true',
  ]
    .map((value, index) => (index === 5 || index === 6 || (index >= 10 && index <= 13) || index === 17 ? value : sqlString(value)))
    .join(', ');
}

export function renderCatalogSeed(items: readonly ItemDefinition[]): string {
  const slotRows = ROOM_SLOT_SEED.map(
    (slot) => `(${sqlString(slot.id)}, ${sqlString(slot.nameKo)}, ${sqlString(slot.zone)})`,
  ).join(',\n  ');
  const itemRows = items.map((item) => `  (${itemValues(item)})`).join(',\n');

  return `-- Generated from src/catalog/items.ts. Run npm run catalog:seed to refresh.\nbegin;\n\ninsert into public.room_slots (id, name_ko, zone)\nvalues\n  ${slotRows}\non conflict (id) do update\nset name_ko = excluded.name_ko,\n    zone = excluded.zone;\n\ninsert into public.item_definitions (\n  id, source, category, theme, name_ko, price, consumable, thumbnail_key, room_asset_key,\n  silhouette, size, anchor, allowed_slot_ids, layer_bias, interaction, asset_status, preview_color, active\n)\nvalues\n${itemRows}\non conflict (id) do update\nset source = excluded.source,\n    category = excluded.category,\n    theme = excluded.theme,\n    name_ko = excluded.name_ko,\n    price = excluded.price,\n    consumable = excluded.consumable,\n    thumbnail_key = excluded.thumbnail_key,\n    room_asset_key = excluded.room_asset_key,\n    silhouette = excluded.silhouette,\n    size = excluded.size,\n    anchor = excluded.anchor,\n    allowed_slot_ids = excluded.allowed_slot_ids,\n    layer_bias = excluded.layer_bias,\n    interaction = excluded.interaction,\n    asset_status = excluded.asset_status,\n    preview_color = excluded.preview_color,\n    active = excluded.active;\n\ncommit;\n`;
}
