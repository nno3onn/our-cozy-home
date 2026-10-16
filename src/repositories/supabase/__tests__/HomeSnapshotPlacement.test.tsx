import { fireEvent, render } from '@testing-library/react-native';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database, Json } from '@/types/database.generated';
import { getOwnInventoryItems } from '@/features/inventory/inventoryItems';
import { DecorateTray } from '@/features/decorate/components/DecorateTray';
import { SupabaseRepository } from '../SupabaseRepository';

// Only the external Data API is replaced: mapping and the actual tray run unchanged.
function fixture(slots: Json = ['floor-accent-left', 'server-extra-slot'], definitionError = false) {
  const owned = [
    { id: 'owned-a', profile_id: 'user-a', item_definition_id: 'cushion-knot', kind: 'furniture', quantity: 1, item_definitions: { allowed_slot_ids: slots } },
    { id: 'owned-b', profile_id: 'user-b', item_definition_id: 'cushion-star', kind: 'furniture', quantity: 1, item_definitions: { allowed_slot_ids: ['floor-accent-left'] } },
    { id: 'snack-a', profile_id: 'user-a', item_definition_id: 'snack-fish', kind: 'consumable', quantity: 3, item_definitions: { allowed_slot_ids: ['animal-use'] } },
  ];
  const rows: Record<string, unknown[]> = {
    profiles: [{ id: 'user-a', display_name: '다은', point_color: '#3182F6' }, { id: 'user-b', display_name: '한섭', point_color: '#F18191' }],
    houses: [{ id: 'house-a', name: '우리집', capacity: 4 }],
    house_memberships: [{ id: 'member-a', house_id: 'house-a', profile_id: 'user-a', role: 'admin' }, { id: 'member-b', house_id: 'house-a', profile_id: 'user-b', role: 'member' }],
    animals: [],
    room_placements: [{ id: 'placement-b', slot_id: 'floor-accent-right', owned_item_id: 'owned-b', version: 7 }],
    owned_items: owned,
  };
  const from = jest.fn((table: string) => {
    const data = rows[table];
    let error: { code: string; message: string } | null = null;
    type FixtureQuery = {
      select: (projection: string) => FixtureQuery;
      eq: () => FixtureQuery; in: () => FixtureQuery; is: () => FixtureQuery; or: () => FixtureQuery; order: () => FixtureQuery;
      maybeSingle: () => Promise<{ data: unknown; error: unknown }>;
      then: (resolve: (value: { data: unknown[]; error: unknown }) => unknown) => Promise<unknown>;
    };
    const query: FixtureQuery = {
      select: jest.fn((projection: string) => {
        if (table === 'owned_items' && projection.includes('item_definitions') && definitionError) error = { code: '42501', message: 'permission denied' };
        return query;
      }),
      eq: jest.fn(() => query), in: jest.fn(() => query), is: jest.fn(() => query), or: jest.fn(() => query), order: jest.fn(() => query),
      maybeSingle: () => Promise.resolve({ data: data?.[0], error }),
      then: (resolve: (value: { data: unknown[]; error: unknown }) => unknown) => Promise.resolve({ data, error }).then(resolve),
    };
    return query;
  });
  const client = {
    auth: { getUser: async () => ({ data: { user: { id: 'user-a' } }, error: null }) },
    from,
    rpc: jest.fn().mockResolvedValue({ data: [{ balance: 1280, claimed: false, reward: 100, game_date: '2026-10-11', next_reset_at: '2026-10-11T15:00:00Z' }], error: null }),
  };
  return { repository: new SupabaseRepository(client as unknown as SupabaseClient<Database>), from, owned };
}

it('carries DB slot metadata through the real snapshot into usable owner-only furniture choices', async () => {
  const { repository } = fixture();
  const snapshot = await repository.getHomeSnapshot();
  expect(snapshot.ownedItems[0].allowedSlotIds).toEqual(['floor-accent-left', 'server-extra-slot']);
  expect(snapshot.ownedItems[1]).toMatchObject({ ownerId: 'user-b', allowedSlotIds: ['floor-accent-left'] });
  expect(snapshot.ownedItems[2]).toMatchObject({ kind: 'consumable', quantity: 3, allowedSlotIds: ['animal-use'] });
  expect(snapshot.placements[0]).toEqual({ id: 'placement-b', ownedItemId: 'owned-b', slotId: 'floor-accent-right', version: 7 });
  const onSelect = jest.fn();
  const view = await render(<DecorateTray snapshot={snapshot} placement={undefined} selectedOwnedItemId={null} isOnline isPending={false} onSelect={onSelect} onPlace={jest.fn()} onOpenShop={jest.fn()} />);
  await fireEvent.press(view.getByRole('button', { name: '민트 매듭 쿠션 선택' }));
  expect(onSelect).toHaveBeenCalledWith('owned-a');
  expect(view.getByRole('button', { name: '선택한 가구 놓기' })).toBeEnabled();
  expect(view.queryByRole('button', { name: '별 쿠션 선택' })).toBeNull();
  expect(getOwnInventoryItems(snapshot)).toHaveLength(2);
});

it.each([null, { unexpected: 'floor-accent-left' }, ['floor-accent-left', 7]])('keeps invalid slot metadata unplaceable without guessing from the bundled catalog: %p', async (slots) => {
  const { repository } = fixture(slots);
  const snapshot = await repository.getHomeSnapshot();
  expect(snapshot.ownedItems[0].allowedSlotIds).toEqual([]);
});

it('keeps an unavailable joined definition unplaceable while preserving the owned item', async () => {
  const { repository, owned } = fixture();
  Object.assign(owned[0], { item_definitions: null });
  const snapshot = await repository.getHomeSnapshot();
  expect(snapshot.ownedItems[0]).toMatchObject({ id: 'owned-a', ownerId: 'user-a', quantity: 1, allowedSlotIds: [] });
});

it('reports a failed definition query instead of treating it as an empty inventory', async () => {
  const { repository } = fixture(undefined, true);
  await expect(repository.getHomeSnapshot()).rejects.toMatchObject({ code: 'forbidden' });
});
