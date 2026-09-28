import { fireEvent, render } from '@testing-library/react-native';

import type { MemorySummary } from '@/domain/models';

import { ScrapbookMemoryCard } from '../ScrapbookMemoryCard';

const memory: MemorySummary = {
  id: 'memory-a', title: '한강에서 피크닉', occurredOn: '2026-09-21', participantNames: ['다은', '한섭'], contributionCount: 2, furnitureOwnedItemId: 'owned-memory', preview: '햇살 아래 함께 쉬었어요.',
};

describe('ScrapbookMemoryCard', () => {
  it('renders memory participants and opens the selected card', async () => {
    const onPress = jest.fn();
    const view = await render(<ScrapbookMemoryCard memory={memory} onPress={onPress} scope="current" />);

    expect(view.getByText('한강에서 피크닉')).toBeOnTheScreen();
    expect(view.getByText('다은 · 한섭')).toBeOnTheScreen();
    expect(view.getByText('Sep 21')).toBeOnTheScreen();
    fireEvent.press(view.getByRole('button', { name: '한강에서 피크닉 상세 열기' }));
    expect(onPress).toHaveBeenCalledWith('memory-a');
  });

  it('labels an archived card as personal archive content', async () => {
    const view = await render(<ScrapbookMemoryCard memory={memory} onPress={jest.fn()} scope="archive" />);

    expect(view.getByText('개인 보관함 기록')).toBeOnTheScreen();
  });
});
