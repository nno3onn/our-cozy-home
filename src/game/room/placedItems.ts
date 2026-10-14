import { ITEM_BY_ID } from '@/catalog/items';
import type { HomeSnapshot, MemorySummary } from '@/domain/models';

export type PlacedRoomItem = { slotId: string; itemId: string; name: string; memoryId?: string };

export function getPlacedRoomItems(snapshot: HomeSnapshot, memories?: MemorySummary[]): PlacedRoomItem[] {
  return snapshot.placements.flatMap(placement => {
    const owned = snapshot.ownedItems.find(item => item.id === placement.ownedItemId);
    const definition = owned ? ITEM_BY_ID.get(owned.itemDefinitionId) : undefined;
    if (!owned || !definition || owned.kind === 'consumable' || owned.quantity <= 0) return [];
    return [{ slotId: placement.slotId, itemId: definition.id, name: definition.nameKo,
      memoryId: memories?.find(memory => memory.furnitureOwnedItemId === owned.id)?.id }];
  }).sort((a, b) => (ITEM_BY_ID.get(a.itemId)?.layerBias ?? 0) - (ITEM_BY_ID.get(b.itemId)?.layerBias ?? 0));
}

// Foot positions in the existing 1000 × 1000 illustrated room.
export const placedItemLayout: Record<string, { x: number; y: number; width: number; height: number }> = {
  window: { x: 500, y: 470, width: 580, height: 440 },
  'center-table': { x: 500, y: 700, width: 280, height: 190 },
  'floor-accent-left': { x: 505, y: 705, width: 280, height: 230 },
  'floor-accent-right': { x: 790, y: 760, width: 230, height: 190 },
  'floor-rug': { x: 500, y: 970, width: 770, height: 240 },
  'bed-corner': { x: 850, y: 880, width: 300, height: 230 },
  'light-left': { x: 80, y: 540, width: 120, height: 230 },
  'light-right': { x: 920, y: 540, width: 120, height: 230 },
  'plant-corner': { x: 880, y: 500, width: 150, height: 230 },
  'memory-wall': { x: 200, y: 330, width: 160, height: 180 },
  'memory-shelf': { x: 107.5, y: 538, width: 175, height: 148 },
};
