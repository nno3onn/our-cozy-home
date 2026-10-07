import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, fireEvent, render } from '@testing-library/react-native';
import * as ReactNative from 'react-native';

import { RepositoryProvider } from '@/repositories/RepositoryContext';
import { DemoRepository } from '@/repositories/demo/DemoRepository';
import { ConnectionProvider } from '@/network/ConnectionProvider';
import type { ConnectionState } from '@/network/connectionState';
import { DomainError } from '@/domain/errors';
import { SnackbarProvider } from '@/components/ui/AppSnackbar';

import { ShopScreen } from '../ShopScreen';

function ShopHarness() {
  return <SnackbarProvider><ShopScreen /></SnackbarProvider>;
}

describe('ShopScreen', () => {
  it('shows all forty products by default and filters the eight shop categories', async () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity } } });
    const view = await render(
      <QueryClientProvider client={client}>
        <RepositoryProvider repository={new DemoRepository()}>
          <ShopHarness />
        </RepositoryProvider>
      </QueryClientProvider>,
    );

    expect(await view.findByText('햇살 리본 커튼')).toBeOnTheScreen();
    expect(view.getByText('네잎 식탁')).toBeOnTheScreen();
    expect(view.getByText('민트 잎비스킷')).toBeOnTheScreen();
    expect(view.getByRole('button', { name: '전체 카테고리' })).toBeOnTheScreen();
    expect(view.getAllByRole('button', { name: / 구매$/ })).toHaveLength(40);
    await act(async () => {
      fireEvent.press(view.getByRole('button', { name: '쿠션 카테고리' }));
    });
    expect(await view.findByText('복숭아 조개 쿠션')).toBeOnTheScreen();
    expect(view.queryByText('햇살 리본 커튼')).not.toBeOnTheScreen();
    expect(view.getAllByText('생활 가구')).toHaveLength(5);
    expect(view.queryByText('임시 에셋')).not.toBeOnTheScreen();
    expect(view.queryByText('최종 에셋')).not.toBeOnTheScreen();

    await act(async () => {
      fireEvent.press(view.getByRole('button', { name: '전체 카테고리' }));
    });
    expect(view.getAllByRole('button', { name: / 구매$/ })).toHaveLength(40);
  });

  it('keeps the catalog readable but disables purchases offline', async () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity } } });
    const offlineState: ConnectionState = { isOnline: () => false, subscribe: () => () => undefined };
    const view = await render(
      <ConnectionProvider state={offlineState}>
        <QueryClientProvider client={client}>
          <RepositoryProvider repository={new DemoRepository()}>
            <ShopHarness />
          </RepositoryProvider>
        </QueryClientProvider>
      </ConnectionProvider>,
    );

    expect(await view.findByText('오프라인 읽기 전용')).toBeOnTheScreen();
    expect(view.getByText('햇살 리본 커튼')).toBeOnTheScreen();
    expect(view.getByRole('button', { name: '햇살 리본 커튼 구매' })).toBeDisabled();
  });

  it('shows the server-confirmed shortage without trusting catalog prices', async () => {
    class InsufficientCoinsRepository extends DemoRepository {
      override async purchaseItem(_input: Parameters<DemoRepository['purchaseItem']>[0]): Promise<never> {
        throw new DomainError('conflict', 'insufficient_coins', { balance: 100, price: 320, shortage: 220 });
      }
    }
    const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity } } });
    const view = await render(
      <QueryClientProvider client={client}>
        <RepositoryProvider repository={new InsufficientCoinsRepository()}>
          <ShopHarness />
        </RepositoryProvider>
      </QueryClientProvider>,
    );

    await act(async () => {
      fireEvent.press(await view.findByRole('button', { name: '햇살 리본 커튼 구매' }));
    });

    expect(view.getByLabelText('햇살 리본 커튼 상품 정보')).toBeOnTheScreen();
    await act(async () => {
      fireEvent.press(view.getByRole('button', { name: '320코인으로 구매' }));
    });

    expect(view.getByText('현재 100코인 · 가격 320코인 · 220코인 부족')).toBeOnTheScreen();
  });

  it('uses two catalogue columns at tablet width with cards wide enough to read', async () => {
    jest.spyOn(ReactNative, 'useWindowDimensions').mockReturnValue({ fontScale: 1, height: 1024, scale: 1, width: 768 });
    const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity } } });
    const view = await render(
      <QueryClientProvider client={client}>
        <RepositoryProvider repository={new DemoRepository()}><ShopHarness /></RepositoryProvider>
      </QueryClientProvider>,
    );

    expect(await view.findByTestId('shop-grid-3')).toBeOnTheScreen();
    expect(view.getByTestId('shop-grid-3').props.children[0].props.style).toEqual(
      expect.arrayContaining([expect.objectContaining({ minWidth: 156 })]),
    );
  });

  it('uses two compact columns and expands to four desktop columns', async () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity } } });
    const dimensions = jest.spyOn(ReactNative, 'useWindowDimensions');
    dimensions.mockReturnValue({ fontScale: 1, height: 844, scale: 1, width: 390 });
    const view = await render(
      <QueryClientProvider client={client}>
        <RepositoryProvider repository={new DemoRepository()}><ShopHarness /></RepositoryProvider>
      </QueryClientProvider>,
    );
    expect(await view.findByTestId('shop-grid-2')).toBeOnTheScreen();

    dimensions.mockReturnValue({ fontScale: 1, height: 800, scale: 1, width: 1280 });
    view.rerender(
      <QueryClientProvider client={client}>
        <RepositoryProvider repository={new DemoRepository()}><ShopHarness /></RepositoryProvider>
      </QueryClientProvider>,
    );
    expect(await view.findByTestId('shop-grid-4')).toBeOnTheScreen();
  });

  it('shows a success snackbar after the server confirms a purchase', async () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity } } });
    const view = await render(
      <QueryClientProvider client={client}>
        <RepositoryProvider repository={new DemoRepository()}><ShopHarness /></RepositoryProvider>
      </QueryClientProvider>,
    );

    await act(async () => {
      fireEvent.press(await view.findByRole('button', { name: '햇살 리본 커튼 구매' }));
    });

    expect(view.getByLabelText('햇살 리본 커튼 상품 정보')).toBeOnTheScreen();
    await act(async () => {
      fireEvent.press(view.getByRole('button', { name: '320코인으로 구매' }));
    });

    expect(await view.findByText('구매했어요. 960 코인이 남았어요.')).toBeOnTheScreen();
    expect(view.getByRole('alert')).toBeOnTheScreen();
  });
});
