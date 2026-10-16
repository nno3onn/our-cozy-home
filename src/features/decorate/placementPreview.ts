import type { HomeSnapshot, PlaceItemInput } from '@/domain/models';
import { getOwnInventoryItems, getSelectablePlacementSlots } from '@/features/inventory/inventoryItems';

/** Pure local projection. Never writes to the repository or changes the cached snapshot. */
export function getPlacementPreview(snapshot: HomeSnapshot, input: PlaceItemInput | null): HomeSnapshot {
  if (!input || input.houseId !== snapshot.house.id) return snapshot;
  const item = getOwnInventoryItems(snapshot).find(candidate => candidate.id === input.ownedItemId);
  if (!item || !getSelectablePlacementSlots(item, snapshot).includes(input.slotId)) return snapshot;
  return {
    ...snapshot,
    placements: [
      ...snapshot.placements.filter(placement => placement.slotId !== input.slotId),
      { id: `preview:${input.slotId}`, ownedItemId: item.id, slotId: input.slotId, version: input.expectedVersion },
    ],
  };
}
