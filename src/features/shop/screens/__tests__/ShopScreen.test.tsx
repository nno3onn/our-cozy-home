import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render } from '@testing-library/react-native';

import { RepositoryProvider } from '@/repositories/RepositoryContext';
import { DemoRepository } from '@/repositories/demo/DemoRepository';
import { ConnectionProvider } from '@/network/ConnectionProvider';
import type { ConnectionState } from '@/network/connectionState';

import { ShopScreen } from '../ShopScreen';

describe('ShopScreen', () => {
  it('shows the repository catalog and filters the eight shop categories', async () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity } } });
    const view = await render(
      <QueryClientProvider client={client}>
        <RepositoryProvider repository={new DemoRepository()}>
          <ShopScreen />
        </RepositoryProvider>
      </QueryClientProvider>,
    );

    expect(await view.findByText('햇살 리본 커튼')).toBeOnTheScreen();
    fireEvent.press(view.getByRole('button', { name: '쿠션 카테고리' }));
    expect(await view.findByText('복숭아 조개 쿠션')).toBeOnTheScreen();
    expect(view.queryByText('햇살 리본 커튼')).not.toBeOnTheScreen();
    expect(view.getAllByText('임시 에셋')).toHaveLength(5);
  });

  it('keeps the catalog readable but disables purchases offline', async () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity } } });
    const offlineState: ConnectionState = { isOnline: () => false, subscribe: () => () => undefined };
    const view = await render(
      <ConnectionProvider state={offlineState}>
        <QueryClientProvider client={client}>
          <RepositoryProvider repository={new DemoRepository()}>
            <ShopScreen />
          </RepositoryProvider>
        </QueryClientProvider>
      </ConnectionProvider>,
    );

    expect(await view.findByText('오프라인 읽기 전용')).toBeOnTheScreen();
    expect(view.getByText('햇살 리본 커튼')).toBeOnTheScreen();
    expect(view.getByRole('button', { name: '햇살 리본 커튼 구매' })).toBeDisabled();
  });
});
