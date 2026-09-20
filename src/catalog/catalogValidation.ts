import type { ItemDefinition } from './items';

export function validateCatalog(items: ItemDefinition[]): string[] {
  const errors: string[] = [];
  const ids = new Set<string>();

  for (const item of items) {
    if (ids.has(item.id)) errors.push(`duplicate_id:${item.id}`);
    ids.add(item.id);
    if (!item.nameKo.trim()) errors.push(`missing_name:${item.id}`);
    if (item.source === 'shop' && (!Number.isInteger(item.price) || item.price <= 0)) {
      errors.push(`invalid_price:${item.id}`);
    }
    if (!item.thumbnailKey || !item.roomAssetKey) errors.push(`missing_asset_key:${item.id}`);
    if (item.size.width <= 0 || item.size.height <= 0) errors.push(`invalid_size:${item.id}`);
    if (item.anchor.x < 0 || item.anchor.y < 0) errors.push(`invalid_anchor:${item.id}`);
    if (item.allowedSlotIds.length === 0) errors.push(`missing_slot:${item.id}`);
    if (!Number.isFinite(item.layerBias)) errors.push(`invalid_layer:${item.id}`);
    if (!item.interaction) errors.push(`missing_interaction:${item.id}`);
    if (!item.assetStatus) errors.push(`missing_asset_status:${item.id}`);
  }

  return errors;
}
