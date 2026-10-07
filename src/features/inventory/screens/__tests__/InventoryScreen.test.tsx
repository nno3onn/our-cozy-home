import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render } from '@testing-library/react-native';

import { RepositoryProvider } from '@/repositories/RepositoryContext';
import { DemoRepository } from '@/repositories/demo/DemoRepository';

import { InventoryScreen } from '../InventoryScreen';

describe('InventoryScreen', () => {
  it('shows owned item artwork, quantity, and ownership', async () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity } } });
    const view = await render(
      <QueryClientProvider client={client}>
        <RepositoryProvider repository={new DemoRepository()}><InventoryScreen /></RepositoryProvider>
      </QueryClientProvider>,
    );

    expect(await view.findByLabelText('민트 매듭 쿠션')).toBeOnTheScreen();
    expect(view.getAllByText('수량 1 · 내 소유').length).toBeGreaterThan(0);
    expect(view.getByRole('header', { name: '내 보관함' })).toBeOnTheScreen();
  });
});
