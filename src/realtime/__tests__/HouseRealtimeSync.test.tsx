import type { SupabaseClient } from '@supabase/supabase-js';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, render, waitFor } from '@testing-library/react-native';
import { AppState, type AppStateStatus } from 'react-native';
import { ConnectionProvider } from '@/network/ConnectionProvider';
import type { ConnectionState } from '@/network/connectionState';

import { RepositoryProvider } from '@/repositories/RepositoryContext';
import { DemoRepository } from '@/repositories/demo/DemoRepository';
import { homeSnapshotKey } from '@/features/room/hooks/useHomeSnapshot';
import { DomainError } from '@/domain/errors';
import { HouseRealtimeSync } from '../HouseRealtimeSync';

async function setup(userId?: string, connection?: ConnectionState) {
  const repository = new DemoRepository();
  const getSnapshot = jest.spyOn(repository, 'getHomeSnapshot');
  const snapshot = await repository.getHomeSnapshot();
  getSnapshot.mockClear();
  const queries = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity } } });
  const channel = { on: jest.fn().mockReturnThis(), subscribe: jest.fn().mockReturnThis() };
  const client = { channel: jest.fn(() => channel), removeChannel: jest.fn(async () => 'ok') };
  const tree = (id?: string) => <ConnectionProvider state={connection}><QueryClientProvider client={queries}><RepositoryProvider repository={repository}>
    <HouseRealtimeSync client={client as unknown as SupabaseClient} userId={id} />
  </RepositoryProvider></QueryClientProvider></ConnectionProvider>;
  const view = await render(tree(userId));
  return { client, queries, view, tree, snapshot, getSnapshot };
}

it('does not query or subscribe signed out, then binds and releases each active house', async () => {
  const { client, queries, view, tree, snapshot, getSnapshot } = await setup();
  expect(getSnapshot).not.toHaveBeenCalled();
  expect(client.channel).not.toHaveBeenCalled();
  await view.rerender(tree(snapshot.currentUserId));
  await waitFor(() => expect(client.channel).toHaveBeenCalledWith(expect.stringContaining(`house:${snapshot.house.id}:`)));
  await act(async () => { queries.setQueryData(homeSnapshotKey, { ...snapshot, house: { ...snapshot.house, id: 'house-b' } }); });
  await waitFor(() => expect(client.channel).toHaveBeenCalledWith(expect.stringContaining('house:house-b:')));
  expect(client.removeChannel).toHaveBeenCalledTimes(1);
  await view.rerender(tree());
  expect(client.removeChannel).toHaveBeenCalledTimes(2);
  await view.unmount(); queries.clear();
});

it('releases the channel offline or in background, then reconciles when active again', async () => {
  let online = true;
  let notify: (online: boolean) => void = () => {};
  let lifecycle: (state: AppStateStatus) => void = () => {};
  const connection = { isOnline: () => online, subscribe: (callback: (online: boolean) => void) => { notify = callback; return () => {}; } };
  jest.spyOn(AppState, 'addEventListener').mockImplementation((_event, callback) => {
    lifecycle = callback; return { remove: jest.fn() };
  });
  const { client, queries, view } = await setup('user-narae', connection);
  await waitFor(() => expect(client.channel).toHaveBeenCalledTimes(1));
  await act(async () => { online = false; notify(online); });
  expect(client.removeChannel).toHaveBeenCalledTimes(1);
  await act(async () => { online = true; notify(online); });
  await waitFor(() => expect(client.channel).toHaveBeenCalledTimes(2));
  await act(async () => lifecycle('background'));
  expect(client.removeChannel).toHaveBeenCalledTimes(2);
  await act(async () => lifecycle('active'));
  await waitFor(() => expect(client.channel).toHaveBeenCalledTimes(3));
  await view.unmount(); queries.clear();
});

it('does not subscribe a cached house belonging to the previous account', async () => {
  const { client, queries, view } = await setup('other-account');
  await waitFor(() => expect(queries.getQueryState(homeSnapshotKey)?.status).toBe('success'));
  expect(client.channel).not.toHaveBeenCalled();
  await view.unmount(); queries.clear();
});

it('refreshes after a missed event and releases access when the authoritative lookup fails', async () => {
  jest.useFakeTimers();
  try {
    const { client, queries, view, getSnapshot } = await setup('user-narae');
    await waitFor(() => expect(client.channel).toHaveBeenCalledTimes(1));
    const calls = getSnapshot.mock.calls.length;
    await act(async () => { await jest.advanceTimersByTimeAsync(15_000); });
    expect(getSnapshot.mock.calls.length).toBeGreaterThan(calls);
    getSnapshot.mockRejectedValue(new DomainError('forbidden'));
    await act(async () => { await jest.advanceTimersByTimeAsync(15_000); });
    await waitFor(() => expect(client.removeChannel).toHaveBeenCalledTimes(1));
    await view.unmount(); queries.clear();
  } finally { jest.useRealTimers(); }
});
