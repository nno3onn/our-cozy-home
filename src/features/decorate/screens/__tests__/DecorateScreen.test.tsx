import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, waitFor } from '@testing-library/react-native';

import { RepositoryProvider } from '@/repositories/RepositoryContext';
import { DemoRepository } from '@/repositories/demo/DemoRepository';

import { DecorateScreen } from '../DecorateScreen';

describe('DecorateScreen', () => {
  it('replaces a fixed-slot item while preserving its owner', async () => {
    const repository = new DemoRepository();
    const client = new QueryClient({
      defaultOptions: {
        queries: { retry: false, gcTime: Infinity },
        mutations: { retry: false, gcTime: Infinity },
      },
    });
    const view = await render(
      <QueryClientProvider client={client}>
        <RepositoryProvider repository={repository}>
          <DecorateScreen />
        </RepositoryProvider>
      </QueryClientProvider>,
    );

    expect(await view.findByText('복숭아 조개 쿠션 배치 중')).toBeOnTheScreen();
    fireEvent.press(view.getByRole('button', { name: '민트 매듭 쿠션 선택' }));
    await waitFor(() => expect(view.getByText('선택: 민트 매듭 쿠션')).toBeOnTheScreen());
    fireEvent.press(view.getByRole('button', { name: '선택한 가구 놓기' }));

    await waitFor(() => expect(view.getByText('민트 매듭 쿠션 배치 중')).toBeOnTheScreen());
    expect(view.getAllByText('소유자 나래')).toHaveLength(2);

    const snapshot = await repository.getHomeSnapshot();
    expect(snapshot.placements.find((placement) => placement.slotId === 'floor-accent-left')).toEqual(
      expect.objectContaining({ ownedItemId: 'owned-mint-cushion', version: 2 }),
    );
    await waitFor(() => expect(client.isMutating()).toBe(0));
    await view.unmount();
    client.clear();
  });
});
