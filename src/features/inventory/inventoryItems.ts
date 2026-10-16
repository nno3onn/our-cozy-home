import { ROOM_SLOT_SEED } from '@/catalog/catalogSeed';
import type { HomeSnapshot, OwnedItem } from '@/domain/models';

const furnitureSlots = new Set<string>(ROOM_SLOT_SEED.filter(slot => slot.zone !== 'animal').map(slot => slot.id));

export function getOwnInventoryItems(snapshot: HomeSnapshot): OwnedItem[] {
  return snapshot.ownedItems.filter(item => item.ownerId === snapshot.currentUserId && item.quantity > 0);
}

export function getPlacementSlots(item: OwnedItem): string[] {
  if (item.kind === 'consumable' || item.quantity <= 0) return [];
  return item.allowedSlotIds.filter(id => furnitureSlots.has(id));
}

export function getSelectablePlacementSlots(item: OwnedItem, snapshot: HomeSnapshot): string[] {
  const slots = getPlacementSlots(item);
  const existing = snapshot.placements.find(placement => placement.ownedItemId === item.id);
  // Older servers keep fixed-slot behavior until the room editing migration is available.
  return existing ? slots.filter(id => id === existing.slotId) : slots;
}
