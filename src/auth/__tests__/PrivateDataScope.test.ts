import { DomainError } from '@/domain/errors';
import type { HomeSnapshot } from '@/domain/models';
import { queryKeys } from '@/repositories/queryKeys';
import { DemoRepository } from '@/repositories/demo/DemoRepository';
import { PrivateDataScope } from '../PrivateDataScope';

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>(done => { resolve = done; });
  return { promise, resolve };
}
async function setup() {
  const repository = new DemoRepository();
  const snapshot = await repository.getHomeSnapshot();
  const scope = new PrivateDataScope(snapshot.currentUserId, repository);
  await scope.getSnapshot().repository.getHomeSnapshot();
  return { repository, snapshot, scope };
}

it('stops events before cancelling reads and clearing every private cache', async () => {
  const { scope } = await setup();
  const old = scope.getSnapshot();
  old.client.setQueryData(['memories'], ['private title']);
  old.client.setQueryData(['habit-learning'], ['private animal']);
  const order: string[] = [];
  scope.registerTeardown(() => { order.push('stop'); expect(old.client.getQueryData(['memories'])).toBeDefined(); });
  const cancel = old.client.cancelQueries.bind(old.client), clear = old.client.clear.bind(old.client);
  jest.spyOn(old.client, 'cancelQueries').mockImplementation((...args) => { order.push('cancel'); return cancel(...args); });
  jest.spyOn(old.client, 'clear').mockImplementation(() => { order.push('clear'); clear(); });
  scope.retire();
  expect(order).toEqual(['stop', 'cancel', 'clear']);
  expect(old.client.getQueryCache().getAll()).toHaveLength(0);
  expect(scope.getSnapshot().phase).toBe('retired');
  expect(scope.getSnapshot().client).not.toBe(old.client);
});

it('ignores a read that finishes after successful leave and never refetches the retired house', async () => {
  const { scope, repository, snapshot } = await setup();
  const old = scope.getSnapshot(), read = deferred<HomeSnapshot>();
  const getHome = jest.spyOn(repository, 'getHomeSnapshot').mockReturnValue(read.promise);
  jest.spyOn(repository, 'leaveHouse').mockResolvedValue({ houseId: snapshot.house.id, result: 'left', houseArchived: false, successorProfileId: null });
  const pending = old.client.fetchQuery({ queryKey: queryKeys.home.activeSnapshot, queryFn: () => old.repository.getHomeSnapshot(), staleTime: 0 }).catch(() => undefined);
  await old.repository.leaveHouse();
  const next = scope.getSnapshot();
  expect(next.phase).toBe('no-house');
  expect(next.client.getQueryData(queryKeys.home.activeSnapshot)).toBeUndefined();
  read.resolve(snapshot); await pending;
  expect(next.client.getQueryData(queryKeys.home.activeSnapshot)).toBeUndefined();
  expect(getHome).toHaveBeenCalledTimes(1);
  scope.retire();
});

it('blocks old capabilities before they can start a command in a new house', async () => {
  const { scope, repository, snapshot } = await setup();
  const old = scope.getSnapshot(), late = deferred<HomeSnapshot>();
  jest.spyOn(repository, 'getHomeSnapshot').mockReturnValueOnce(late.promise).mockResolvedValue({ ...snapshot, house: { ...snapshot.house, id: 'new-house' } });
  const stale = old.repository.getHomeSnapshot().catch(error => error);
  scope.recheck();
  await scope.getSnapshot().repository.getHomeSnapshot();
  const current = scope.getSnapshot();
  const command = jest.spyOn(repository, 'createHouse');
  await expect(old.repository.createHouse({ name: 'old click', requestId: 'old' })).rejects.toMatchObject({ message: 'retired_data_scope' });
  expect(command).not.toHaveBeenCalled();
  late.resolve(snapshot); expect(await stale).toMatchObject({ message: 'retired_data_scope' });
  expect(scope.getSnapshot()).toBe(current);
  expect(current.client.getQueryData<HomeSnapshot>(queryKeys.home.activeSnapshot)?.house.id).toBe('new-house');
  scope.retire();
});

it('clears memory and animal data on a definitive RLS denial, even with cached results', async () => {
  const { scope, repository } = await setup();
  const old = scope.getSnapshot();
  old.client.setQueryData(['memories', 'secret', 'contributions'], ['private body']);
  jest.spyOn(repository, 'getMemoryContributions').mockRejectedValue(new DomainError('forbidden'));
  await expect(old.repository.getMemoryContributions('secret')).rejects.toMatchObject({ code: 'forbidden' });
  expect(scope.getSnapshot().phase).toBe('denied');
  expect(scope.getSnapshot().client.getQueryCache().getAll()).toHaveLength(0);
  expect(old.client.getQueryCache().getAll()).toHaveLength(0);
  scope.retire();
});

it('preserves confirmed offline data for transport failure without renewing authority', async () => {
  const { scope, repository, snapshot } = await setup();
  const old = scope.getSnapshot();
  jest.spyOn(repository, 'getHomeSnapshot').mockRejectedValue(new DomainError('network_unavailable'));
  await expect(old.repository.getHomeSnapshot()).rejects.toMatchObject({ code: 'network_unavailable' });
  expect(scope.getSnapshot()).toBe(old);
  expect(old.client.getQueryData(queryKeys.home.activeSnapshot)).toEqual(snapshot);
  scope.retire();
});

it('replaces the entire client when an authoritative read discovers a different active house', async () => {
  const { scope, repository, snapshot } = await setup();
  const old = scope.getSnapshot();
  old.client.setQueryData(['memories'], ['old house title']);
  jest.spyOn(repository, 'getHomeSnapshot').mockResolvedValue({ ...snapshot, house: { ...snapshot.house, id: 'new-house' }, placements: [] });
  await old.repository.getHomeSnapshot();
  expect(scope.getSnapshot().client).not.toBe(old.client);
  expect(scope.getSnapshot().client.getQueryData(['memories'])).toBeUndefined();
  expect(scope.getSnapshot().client.getQueryData<HomeSnapshot>(queryKeys.home.activeSnapshot)?.placements).toEqual([]);
  scope.retire();
});

it('rejects a snapshot belonging to a different authenticated identity', async () => {
  const { repository, snapshot } = await setup();
  const scope = new PrivateDataScope('other-account', repository);
  await expect(scope.getSnapshot().repository.getHomeSnapshot()).rejects.toMatchObject({ code: 'forbidden' });
  expect(scope.getSnapshot().phase).toBe('denied');
  expect(scope.getSnapshot().client.getQueryData(queryKeys.home.activeSnapshot)).toBeUndefined();
  expect(snapshot.currentUserId).not.toBe('other-account');
  scope.retire();
});
