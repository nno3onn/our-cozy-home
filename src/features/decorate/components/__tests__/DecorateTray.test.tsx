import { fireEvent, render } from '@testing-library/react-native';

import type { HomeSnapshot, RoomPlacement } from '@/domain/models';

import { DecorateTray } from '../DecorateTray';

const snapshot: HomeSnapshot = {
  currentUserId: 'user-a', coinBalance: 820, house: { id: 'house-a', name: '우리집', capacity: 4 },
  members: [
    { id: 'member-a', userId: 'user-a', displayName: '다은', pointColor: '#F18191', role: 'admin' },
    { id: 'member-b', userId: 'user-b', displayName: '한섭', pointColor: '#94BFE0', role: 'member' },
  ],
  animals: [],
  ownedItems: [
    { id: 'owned-a', ownerId: 'user-a', itemDefinitionId: 'cushion-knot', kind: 'furniture', allowedSlotIds: ['floor-accent-left'], quantity: 1 },
    { id: 'owned-b', ownerId: 'user-b', itemDefinitionId: 'cushion-star', kind: 'furniture', allowedSlotIds: ['floor-accent-left'], quantity: 1 },
  ],
  placements: [],
};
const placement: RoomPlacement = { id: 'placement-a', ownedItemId: 'owned-a', slotId: 'floor-accent-left', version: 2 };

describe('DecorateTray', () => {
  it('shows item ownership but only lets the current owner select a movable item', async () => {
    const onSelect = jest.fn();
    const view = await render(<DecorateTray isOnline isPending={false} onOpenShop={jest.fn()} onPlace={jest.fn()} onSelect={onSelect} placement={placement} selectedOwnedItemId={null} snapshot={snapshot} />);

    expect(view.getByText('민트 매듭 쿠션')).toBeOnTheScreen();
    expect(view.getByText('소유자 다은')).toBeOnTheScreen();
    expect(view.getByText('소유자 한섭')).toBeOnTheScreen();
    fireEvent.press(view.getByRole('button', { name: '민트 매듭 쿠션 선택' }));
    expect(onSelect).toHaveBeenCalledWith('owned-a');
    expect(view.queryByRole('button', { name: '별 쿠션 선택' })).not.toBeOnTheScreen();
  });

  it('keeps a selected item visible while blocking placement offline', async () => {
    const view = await render(<DecorateTray isOnline={false} isPending={false} onOpenShop={jest.fn()} onPlace={jest.fn()} onSelect={jest.fn()} placement={placement} selectedOwnedItemId="owned-a" snapshot={snapshot} />);

    expect(view.getByText('선택: 민트 매듭 쿠션')).toBeOnTheScreen();
    expect(view.getByRole('button', { name: '선택한 가구 놓기' })).toBeDisabled();
  });
});
