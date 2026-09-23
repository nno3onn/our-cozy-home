import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render } from '@testing-library/react-native';

import { RepositoryProvider } from '@/repositories/RepositoryContext';
import { DemoRepository } from '@/repositories/demo/DemoRepository';

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
});
