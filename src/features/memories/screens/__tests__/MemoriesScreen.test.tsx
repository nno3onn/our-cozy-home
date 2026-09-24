import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render } from '@testing-library/react-native';

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
    fireEvent.press(view.getByRole('button', { name: '강가에서 보낸 오후 상세 열기' }));
    expect(onOpenMemory).toHaveBeenCalledWith('memory-river-picnic');
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

    expect(await view.findByText('개인 보관함')).toBeOnTheScreen();
    expect(view.getByText('보관한 산책')).toBeOnTheScreen();
  });
});
