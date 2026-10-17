import { act, render, waitFor } from '@testing-library/react-native';
import { Text } from 'react-native';
import { useEffect } from 'react';

import { DomainError } from '@/domain/errors';
import type { HomeSnapshot } from '@/domain/models';
import type { SupabaseClient } from '@supabase/supabase-js';
import { useHomeSnapshot } from '@/features/room/hooks/useHomeSnapshot';
import { useMemories } from '@/features/memories/hooks/useMemories';
import { ConnectionProvider } from '@/network/ConnectionProvider';
import { RepositoryProvider } from '@/repositories/RepositoryContext';
import { DemoRepository } from '@/repositories/demo/DemoRepository';
import { PrivateDataBoundary } from '../PrivateDataBoundary';
import { usePrivateScope } from '../PrivateScopeContext';
import type { PrivateDataScope } from '../PrivateDataScope';

let mockSegments: string[] = ['decorate'];
jest.mock('expo-router', () => {
  const react = jest.requireActual<typeof import('react')>('react');
  const native = jest.requireActual<typeof import('react-native')>('react-native');
  return { useSegments: () => mockSegments, Redirect: ({ href }: { href: string }) => react.createElement(native.Text, null, `redirect:${href}`) };
});

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>(done => { resolve = done; });
  return { promise, resolve };
}
let currentScope: PrivateDataScope;
function ProtectedContent() {
  const scope = usePrivateScope()!;
  useEffect(() => { currentScope = scope; }, [scope]);
  const home = useHomeSnapshot(), memories = useMemories();
  return <><Text>{home.data?.house.name}</Text><Text>{home.data?.currentUserId}</Text><Text>{`placed:${home.data?.placements.length}`}</Text><Text>{memories.data?.map(memory => memory.title).join(',')}</Text></>;
}
beforeEach(() => { mockSegments = ['decorate']; });

it('distinguishes pending authority lookup from an authoritative room with no furniture', async () => {
  const repository = new DemoRepository(), snapshot = await repository.getHomeSnapshot();
  const read = deferred<HomeSnapshot>();
  jest.spyOn(repository, 'getHomeSnapshot').mockReturnValue(read.promise);
  const view = await render(<RepositoryProvider repository={repository}><PrivateDataBoundary userId={snapshot.currentUserId}><ProtectedContent /></PrivateDataBoundary></RepositoryProvider>);
  expect(view.getByLabelText('우리집 권한과 저장 상태 확인 중')).toBeOnTheScreen();
  expect(view.queryByText(snapshot.house.name)).not.toBeOnTheScreen();
  await act(async () => read.resolve({ ...snapshot, placements: [] }));
  expect(await view.findByText(snapshot.house.name)).toBeOnTheScreen();
  expect(view.queryByLabelText('우리집 권한과 저장 상태 확인 중')).not.toBeOnTheScreen();
  expect(currentScope.getSnapshot().phase).toBe('active');
  await view.unmount();
});

it('never renders cached A data during B bootstrap or a late A response', async () => {
  const repository = new DemoRepository(), snapshot = await repository.getHomeSnapshot();
  const getHome = jest.spyOn(repository, 'getHomeSnapshot');
  const tree = (userId: string) => <RepositoryProvider repository={repository}><PrivateDataBoundary userId={userId}><ProtectedContent /></PrivateDataBoundary></RepositoryProvider>;
  const view = await render(tree(snapshot.currentUserId));
  expect(await view.findByText(snapshot.house.name)).toBeOnTheScreen();
  const old = currentScope.getSnapshot(), lateA = deferred<HomeSnapshot>(), newB = deferred<HomeSnapshot>();
  getHome.mockReturnValueOnce(lateA.promise).mockReturnValue(newB.promise);
  const pending = old.repository.getHomeSnapshot().catch(() => undefined);
  await view.rerender(tree('user-b'));
  expect(view.queryByText(snapshot.house.name)).not.toBeOnTheScreen();
  expect(view.queryByText(snapshot.currentUserId)).not.toBeOnTheScreen();
  await act(async () => { lateA.resolve(snapshot); await pending; });
  expect(view.queryByText(snapshot.house.name)).not.toBeOnTheScreen();
  await act(async () => newB.resolve({ ...snapshot, currentUserId: 'user-b', house: { ...snapshot.house, id: 'house-b', name: 'B private house' } }));
  expect(await view.findByText('B private house')).toBeOnTheScreen();
  expect(view.queryByText(snapshot.house.name)).not.toBeOnTheScreen();
  await view.unmount();
});

it('removes the whole protected tree when a memory lookup denies permission with cached content', async () => {
  const repository = new DemoRepository(), snapshot = await repository.getHomeSnapshot();
  const list = jest.spyOn(repository, 'listMemories');
  const view = await render(<RepositoryProvider repository={repository}><PrivateDataBoundary userId={snapshot.currentUserId}><ProtectedContent /></PrivateDataBoundary></RepositoryProvider>);
  expect(await view.findByText(snapshot.house.name)).toBeOnTheScreen();
  const client = currentScope.getSnapshot().client;
  await act(async () => { client.setQueryData(['memories'], [{ title: 'secret cached title' }]); });
  expect(await view.findByText('secret cached title')).toBeOnTheScreen();
  list.mockRejectedValue(new DomainError('forbidden'));
  await act(async () => { await client.invalidateQueries({ queryKey: ['memories'] }); });
  expect(await view.findByText('집 접근 권한을 확인하지 못했어요')).toBeOnTheScreen();
  expect(view.queryByText('secret cached title')).not.toBeOnTheScreen();
  expect(view.queryByText(snapshot.house.name)).not.toBeOnTheScreen();
  expect(currentScope.getSnapshot().client.getQueryCache().getAll().every(query => query.state.data === undefined)).toBe(true);
  expect(client.getQueryCache().getAll()).toHaveLength(0);
  await view.unmount();
});

it('redirects after leave before a deferred old-house lookup can repopulate the UI', async () => {
  const repository = new DemoRepository(), snapshot = await repository.getHomeSnapshot();
  jest.spyOn(repository, 'leaveHouse').mockResolvedValue({ houseId: snapshot.house.id, result: 'left', houseArchived: false, successorProfileId: null });
  const view = await render(<RepositoryProvider repository={repository}><PrivateDataBoundary userId={snapshot.currentUserId}><ProtectedContent /></PrivateDataBoundary></RepositoryProvider>);
  expect(await view.findByText(snapshot.house.name)).toBeOnTheScreen();
  const old = currentScope.getSnapshot(), late = deferred<HomeSnapshot>();
  jest.spyOn(repository, 'getHomeSnapshot').mockReturnValue(late.promise);
  const pending = old.repository.getHomeSnapshot().catch(() => undefined);
  await act(async () => { await old.repository.leaveHouse(); });
  expect(view.getByText('redirect:/house/choose')).toBeOnTheScreen();
  expect(view.queryByText(snapshot.house.name)).not.toBeOnTheScreen();
  await act(async () => { late.resolve(snapshot); await pending; });
  expect(view.queryByText(snapshot.house.name)).not.toBeOnTheScreen();
  await view.unmount();
});

it('retains confirmed offline data and reconciles on reconnect without treating offline as revocation', async () => {
  const repository = new DemoRepository(), snapshot = await repository.getHomeSnapshot();
  const getHome = jest.spyOn(repository, 'getHomeSnapshot');
  let online = true;
  const listeners = new Set<(online: boolean) => void>();
  const connection = { isOnline: () => online, subscribe: (fn: (online: boolean) => void) => { listeners.add(fn); return () => { listeners.delete(fn); }; } };
  const view = await render(<ConnectionProvider state={connection}><RepositoryProvider repository={repository}><PrivateDataBoundary userId={snapshot.currentUserId}><ProtectedContent /></PrivateDataBoundary></RepositoryProvider></ConnectionProvider>);
  expect(await view.findByText(snapshot.house.name)).toBeOnTheScreen();
  await act(async () => { online = false; for (const fn of listeners) fn(online); });
  expect(view.getByText(snapshot.house.name)).toBeOnTheScreen();
  expect(currentScope.getSnapshot().phase).toBe('active');
  getHome.mockRejectedValue(new DomainError('not_found', 'active_house_not_found'));
  await act(async () => { online = true; for (const fn of listeners) fn(online); });
  await act(async () => { await currentScope.getSnapshot().client.invalidateQueries(); });
  await waitFor(() => expect(view.getByText('redirect:/house/choose')).toBeOnTheScreen());
  expect(view.queryByText(snapshot.house.name)).not.toBeOnTheScreen();
  await view.unmount();
});

it('removes departed furniture through the bounded authoritative poll without DELETE payloads', async () => {
  jest.useFakeTimers();
  try {
    const repository = new DemoRepository(), snapshot = await repository.getHomeSnapshot();
    const getHome = jest.spyOn(repository, 'getHomeSnapshot');
    const channel = { on: jest.fn().mockReturnThis(), subscribe: jest.fn().mockReturnThis() };
    const client = { channel: jest.fn(() => channel), removeChannel: jest.fn(async () => 'ok') };
    const view = await render(<RepositoryProvider repository={repository}><PrivateDataBoundary userId={snapshot.currentUserId} client={client as unknown as SupabaseClient}><ProtectedContent /></PrivateDataBoundary></RepositoryProvider>);
    await view.findByText(`placed:${snapshot.placements.length}`);
    getHome.mockResolvedValue({ ...snapshot, placements: [] });
    await act(async () => { await jest.advanceTimersByTimeAsync(15_000); });
    expect(await view.findByText('placed:0')).toBeOnTheScreen();
    expect(channel.on.mock.calls.every(([, filter]) => ['INSERT', 'UPDATE'].includes(filter.event))).toBe(true);
    await view.unmount();
  } finally { jest.useRealTimers(); }
});

it('does not present a cold offline lookup as a confirmed empty room', async () => {
  const repository = new DemoRepository(), snapshot = await repository.getHomeSnapshot();
  const read = jest.spyOn(repository, 'getHomeSnapshot');
  const offline = { isOnline: () => false, subscribe: () => () => {} };
  const view = await render(<ConnectionProvider state={offline}><RepositoryProvider repository={repository}><PrivateDataBoundary userId={snapshot.currentUserId}><ProtectedContent /></PrivateDataBoundary></RepositoryProvider></ConnectionProvider>);
  expect(view.getByText('연결 후 우리집을 확인할 수 있어요')).toBeOnTheScreen();
  expect(view.queryByText('placed:0')).not.toBeOnTheScreen();
  expect(read).not.toHaveBeenCalled();
  await view.unmount();
});
