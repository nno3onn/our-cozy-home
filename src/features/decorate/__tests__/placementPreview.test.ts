import { DemoRepository } from '@/repositories/demo/DemoRepository';
import { getPlacementPreview } from '../placementPreview';
const input = { ownedItemId: 'owned-mint-cushion', slotId: 'floor-accent-left', expectedVersion: 1 };
it('projects one target without mutating the confirmed snapshot or inventory', async () => {
  const snapshot = await new DemoRepository().getHomeSnapshot();
  const before = JSON.stringify(snapshot);
  const preview = getPlacementPreview(snapshot, input);
  expect(preview.placements.filter(p => p.slotId === input.slotId)).toEqual([{ id: 'preview:floor-accent-left', ownedItemId: input.ownedItemId, slotId: input.slotId, version: 1 }]);
  expect(preview.ownedItems).toBe(snapshot.ownedItems);
  expect(JSON.stringify(snapshot)).toBe(before);
});
it('rejects foreign-owned, consumed, incompatible and unsupported movement previews', async () => {
  const snapshot = await new DemoRepository().getHomeSnapshot();
  expect(getPlacementPreview(snapshot, { ...input, ownedItemId: 'owned-peach-cushion' })).toBe(snapshot);
  expect(getPlacementPreview(snapshot, { ...input, slotId: 'window' })).toBe(snapshot);
  expect(getPlacementPreview(snapshot, { ...input, ownedItemId: 'owned-memory-radio', slotId: 'floor-accent-left' })).toBe(snapshot);
  const empty = { ...snapshot, ownedItems: snapshot.ownedItems.map(i => i.id === input.ownedItemId ? { ...i, quantity: 0 } : i) };
  expect(getPlacementPreview(empty, input)).toBe(empty);
});
