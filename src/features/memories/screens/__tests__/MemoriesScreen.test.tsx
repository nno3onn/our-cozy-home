import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render } from '@testing-library/react-native';
import * as ReactNative from 'react-native';

import { RepositoryProvider } from '@/repositories/RepositoryContext';
import { DemoRepository } from '@/repositories/demo/DemoRepository';

import { MemoriesScreen } from '../MemoriesScreen';
import { MemoryDetailScreen } from '../MemoryDetailScreen';

function wrapper(children: React.ReactNode) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: Infinity } },
  });
  return (
    <QueryClientProvider client={client}>
      <RepositoryProvider repository={new DemoRepository()}>{children}</RepositoryProvider>
    </QueryClientProvider>
  );
}

describe('memory screens', () => {
  it('opens a completed memory from the shelf', async () => {
    const onOpenMemory = jest.fn();
    const view = await render(wrapper(<MemoriesScreen onOpenMemory={onOpenMemory} />));

    expect(await view.findByText('강가에서 보낸 오후')).toBeOnTheScreen();
    expect(view.getByText('2026년 9월')).toBeOnTheScreen();
    expect(view.getByText('가구 완성')).toBeOnTheScreen();
    fireEvent.press(view.getByRole('button', { name: '강가에서 보낸 오후 상세 열기' }));
    expect(onOpenMemory).toHaveBeenCalledWith('memory-river-picnic');
  });

  it('provides a labelled path back to the house shell', async () => {
    const onNavigateHome = jest.fn();
    const view = await render(wrapper(<MemoriesScreen onNavigateHome={onNavigateHome} onOpenMemory={jest.fn()} />));

    await view.findByText('강가에서 보낸 오후');
    fireEvent.press(await view.findByRole('button', { name: '우리집으로 돌아가기' }));

    expect(onNavigateHome).toHaveBeenCalledTimes(1);
  });

  it('shows participants and contribution content in the detail', async () => {
    const view = await render(wrapper(<MemoryDetailScreen memoryId="memory-river-picnic" />));

    expect(await view.findByText('강가에서 보낸 오후')).toBeOnTheScreen();
    expect(view.getByText('나래 · 민준 · 유빈')).toBeOnTheScreen();
    expect(view.getByText('기여 3명')).toBeOnTheScreen();
    expect(view.getByText(/서로 좋아하는 노래/)).toBeOnTheScreen();
  });

  it('separates a departed contributor archive from current-house memories', async () => {
    const repository = new DemoRepository();
    jest.spyOn(repository, 'listArchivedMemories').mockResolvedValue([
      {
        id: 'archive-1', title: '보관한 산책', occurredOn: '2026-09-20', participantNames: ['나래'],
        contributionCount: 1, furnitureOwnedItemId: null, preview: '퇴장 시점의 기록',
      },
    ]);
    const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity } } });
    const view = await render(
      <QueryClientProvider client={client}>
        <RepositoryProvider repository={repository}><MemoriesScreen onOpenMemory={jest.fn()} /></RepositoryProvider>
      </QueryClientProvider>,
    );

    expect((await view.findByRole('button', { name: '현재 추억 보기' })).props.accessibilityState).toEqual(expect.objectContaining({ selected: true }));
    expect(view.getByRole('button', { name: '개인 보관함 보기' }).props.accessibilityState).toEqual(expect.objectContaining({ selected: false }));
    expect(view.queryByText('보관한 산책')).not.toBeOnTheScreen();
    fireEvent.press(view.getByRole('button', { name: '개인 보관함 보기' }));
    expect(await view.findByText('보관한 산책')).toBeOnTheScreen();
    expect(view.getByRole('button', { name: '개인 보관함 보기' }).props.accessibilityState).toEqual(expect.objectContaining({ selected: true }));
    expect(view.getByText('퇴장 시점까지 공개된 내용')).toBeOnTheScreen();
    expect(view.queryByText('강가에서 보낸 오후')).not.toBeOnTheScreen();
  });

  it('opens the personal archive by default when no current-house memory is accessible', async () => {
    const repository = new DemoRepository();
    jest.spyOn(repository, 'listMemories').mockResolvedValue([]);
    jest.spyOn(repository, 'listArchivedMemories').mockResolvedValue([
      { id: 'archive-only', title: '나의 기록', occurredOn: '2026-09-18', participantNames: ['나래'], contributionCount: 1, furnitureOwnedItemId: null, preview: '퇴장 전 기록' },
    ]);
    const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity } } });
    const view = await render(<QueryClientProvider client={client}><RepositoryProvider repository={repository}><MemoriesScreen onOpenMemory={jest.fn()} /></RepositoryProvider></QueryClientProvider>);

    expect((await view.findByRole('button', { name: '개인 보관함 보기' })).props.accessibilityState).toEqual(expect.objectContaining({ selected: true }));
    expect(view.getByText('나의 기록')).toBeOnTheScreen();
  });

  it('turns the scrapbook into two readable tablet columns', async () => {
    jest.spyOn(ReactNative, 'useWindowDimensions').mockReturnValue({ fontScale: 1, height: 1024, scale: 1, width: 768 });
    const view = await render(wrapper(<MemoriesScreen onOpenMemory={jest.fn()} />));

    expect(await view.findByTestId('memory-grid-current-2')).toBeOnTheScreen();
    expect(view.getByTestId('memory-grid-current-2').props.children[0].props.style).toEqual(
      expect.arrayContaining([expect.objectContaining({ minWidth: 156 })]),
    );
  });
});
