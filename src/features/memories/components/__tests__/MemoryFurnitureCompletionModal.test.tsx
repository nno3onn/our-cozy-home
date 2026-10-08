import { fireEvent, render } from '@testing-library/react-native';

import { MemoryFurnitureCompletionModal } from '../MemoryFurnitureCompletionModal';

describe('MemoryFurnitureCompletionModal', () => {
  it('presents room placement as the single primary action', async () => {
    const onKeepInInventory = jest.fn();
    const onPlaceInRoom = jest.fn();
    const view = await render(
      <MemoryFurnitureCompletionModal
        memory={{ id: 'm1', title: '우리의 첫 피크닉', occurredOn: '2026-10-08', participantNames: ['다은', '한섭'], contributionCount: 2, furnitureOwnedItemId: 'owned-1', preview: '강가의 오후' }}
        onDismiss={jest.fn()}
        onKeepInInventory={onKeepInInventory}
        onPlaceInRoom={onPlaceInRoom}
        visible
      />,
    );

    expect(view.getByRole('header', { name: '새 추억 가구가 완성됐어요' })).toBeOnTheScreen();
    expect(view.getByText('서로 다른 두 명의 기록으로 한 번만 만들어졌어요.')).toBeOnTheScreen();
    fireEvent.press(view.getByRole('button', { name: '방에 놓기' }));
    expect(onPlaceInRoom).toHaveBeenCalledTimes(1);
    expect(view.getByRole('button', { name: '보관함에 두기' })).toBeOnTheScreen();
  });
});
