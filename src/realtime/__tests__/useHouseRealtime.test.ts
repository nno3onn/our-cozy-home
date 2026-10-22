import { QueryClient } from '@tanstack/react-query';
import type { SupabaseClient } from '@supabase/supabase-js';

import { homeSnapshotKey } from '@/features/room/hooks/useHomeSnapshot';
import { subscribeHouseRealtime } from '../useHouseRealtime';
import { PrivateDataScope } from '@/auth/PrivateDataScope';
import { DemoRepository } from '@/repositories/demo/DemoRepository';

function fixture() {
  const handlers: { filter: { table: string; event: string; filter: string }; callback: () => void }[] = [];
  let status: ((value: string) => void) | undefined;
  const channel = { on: jest.fn(), subscribe: jest.fn() };
  channel.on.mockImplementation((_type, filter, callback) => { handlers.push({ filter, callback }); return channel; });
  channel.subscribe.mockImplementation(callback => { status = callback; return channel; });
  const client = { channel: jest.fn(() => channel), removeChannel: jest.fn(async () => 'ok') };
  const queries = new QueryClient();
  queries.setQueryData(homeSnapshotKey, { confirmed: true });
  const stop = subscribeHouseRealtime(client as unknown as SupabaseClient, queries, 'house-a');
  return { client, handlers, queries, stop, status: (value: string) => status?.(value) };
}

it('invalidates the actual room query without accepting event data as state', () => {
  const { handlers, queries, stop } = fixture();
  handlers.find(handler => handler.filter.table === 'room_placements')!.callback();
  expect(queries.getQueryState(homeSnapshotKey)?.isInvalidated).toBe(true);
  expect(queries.getQueryData(homeSnapshotKey)).toEqual({ confirmed: true });
  stop(); queries.clear();
});

it('refreshes the snapshot when a subscription first connects or reconnects', () => {
  const { queries, status, stop } = fixture();
  for (const connection of [1, 2]) {
    queries.setQueryData(homeSnapshotKey, { connection });
    status('SUBSCRIBED');
    expect(queries.getQueryState(homeSnapshotKey)?.isInvalidated).toBe(true);
  }
  stop(); queries.clear();
});

it('removes the channel and ignores late events from a departed house', () => {
  const { handlers, client, queries, stop, status } = fixture();
  stop();
  handlers.forEach(handler => handler.callback());
  status('SUBSCRIBED');
  expect(client.removeChannel).toHaveBeenCalledTimes(1);
  expect(queries.getQueryState(homeSnapshotKey)?.isInvalidated).toBe(false);
  queries.clear();
});

it('subscribes only to RLS-checked room inserts and updates in the intended house', () => {
  const { handlers, stop, queries } = fixture();
  expect(handlers.map(handler => handler.filter)).toEqual([
    { event: 'INSERT', schema: 'public', table: 'room_placements', filter: 'house_id=eq.house-a' },
    { event: 'UPDATE', schema: 'public', table: 'room_placements', filter: 'house_id=eq.house-a' },
  ]);
  stop(); queries.clear();
});

it('does not reuse an SDK channel that is still asynchronously leaving', () => {
  // realtime-js returns the existing channel for the same topic until removal
  // finishes. A rapid offline/online cycle must not subscribe that channel twice.
  const channels = new Map<string, { on: jest.Mock; subscribe: jest.Mock }>();
  const client = {
    channel: (topic: string) => {
      if (!channels.has(topic)) {
        let subscribed = false;
        const channel = { on: jest.fn().mockReturnThis(), subscribe: jest.fn(() => {
          if (subscribed) throw new Error('already subscribed');
          subscribed = true;
        }) };
        channels.set(topic, channel);
      }
      return channels.get(topic)!;
    },
    removeChannel: () => new Promise(() => {}),
  };
  const queries = new QueryClient();
  const stop = subscribeHouseRealtime(client as unknown as SupabaseClient, queries, 'house-a');
  stop();
  expect(() => subscribeHouseRealtime(client as unknown as SupabaseClient, queries, 'house-a')).not.toThrow();
  queries.clear();
});

it('fences queued event and reconnect callbacks synchronously when the account retires', () => {
  const { handlers, client, queries, stop, status } = fixture();
  const scope = new PrivateDataScope('A', new DemoRepository());
  scope.registerTeardown(stop);
  scope.retire();
  // The SDK may still deliver a queued message before async removal finishes.
  handlers.forEach(handler => handler.callback()); status('SUBSCRIBED'); stop();
  expect(client.removeChannel).toHaveBeenCalledTimes(1);
  expect(queries.getQueryState(homeSnapshotKey)?.isInvalidated).toBe(false);
  queries.clear();
});
