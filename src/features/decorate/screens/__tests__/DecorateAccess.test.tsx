import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, render, waitFor } from '@testing-library/react-native';

import { DomainError } from '@/domain/errors';
import { homeSnapshotKey } from '@/features/room/hooks/useHomeSnapshot';
import { RepositoryProvider } from '@/repositories/RepositoryContext';
import { DemoRepository } from '@/repositories/demo/DemoRepository';
import { DecorateScreen } from '../DecorateScreen';

it('hides a previously cached room after a definitive permission denial', async () => {
  const repository = new DemoRepository();
  const getSnapshot = jest.spyOn(repository, 'getHomeSnapshot');
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity } } });
  const view = await render(<QueryClientProvider client={client}><RepositoryProvider repository={repository}><DecorateScreen /></RepositoryProvider></QueryClientProvider>);
  expect(await view.findByText('복숭아 조개 쿠션 배치 중')).toBeOnTheScreen();

  getSnapshot.mockRejectedValue(new DomainError('forbidden'));
  await act(async () => { await client.invalidateQueries({ queryKey: homeSnapshotKey }); });
  await waitFor(() => expect(client.getQueryState(homeSnapshotKey)?.status).toBe('error'));

  await waitFor(() => expect(view.queryByText('복숭아 조개 쿠션 배치 중')).not.toBeOnTheScreen());
  await view.unmount(); client.clear();
});
