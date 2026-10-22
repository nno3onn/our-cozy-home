import { QueryClient } from '@tanstack/react-query';

import { DomainError } from '@/domain/errors';
import type { HomeSnapshot } from '@/domain/models';
import type { HomeRepository } from '@/domain/repository';
import { queryKeys } from '@/repositories/queryKeys';
import { isAccessLoss } from './privateErrors';

export type PrivateScopeState = {
  generation: number;
  clientEpoch: number;
  phase: 'checking' | 'active' | 'no-house' | 'denied' | 'retired';
  houseId?: string;
  client: QueryClient;
  repository: HomeRepository;
};

/** Repository capabilities belong to one identity/generation. A QueryClient is
 * retained only while entering a first house from a confirmed empty state;
 * leave, account changes, and house changes still replace and clear it.
 * This does not replace any server ownership/RLS checks. */
export class PrivateDataScope {
  private state: PrivateScopeState;
  private listeners = new Set<() => void>();
  private teardowns = new Set<() => void>();
  private snapshotRestarts = 0;

  constructor(readonly userId: string, private readonly source: HomeRepository, private readonly resetUi: () => void = () => {}) {
    this.state = this.createState(0, 'checking');
  }

  getSnapshot = () => this.state;
  subscribe = (listener: () => void) => { this.listeners.add(listener); return () => { this.listeners.delete(listener); }; };

  registerTeardown = (stop: () => void) => {
    if (this.state.phase === 'retired') { stop(); return () => {}; }
    this.teardowns.add(stop);
    return () => { this.teardowns.delete(stop); };
  };

  retire = () => { if (this.state.phase !== 'retired') this.replace('retired'); };
  recheck = () => { if (this.state.phase !== 'retired') { this.snapshotRestarts = 0; this.replace('checking'); } };

  private current(generation: number) {
    return this.state.generation === generation && this.state.phase !== 'retired';
  }

  private createState(generation: number, phase: PrivateScopeState['phase'], snapshot?: HomeSnapshot, existingClient?: QueryClient, clientEpoch = generation): PrivateScopeState {
    const client = existingClient ?? new QueryClient({ defaultOptions: {
      queries: { staleTime: 30_000, retry: (count, error) => !isAccessLoss(error) && count < 1 },
      mutations: { retry: false },
    } });
    if (snapshot) client.setQueryData(queryKeys.home.activeSnapshot, snapshot);
    const repository = new Proxy(this.source, {
      get: (target, property) => {
        const member = Reflect.get(target, property);
        if (typeof member !== 'function') return member;
        return async (...args: unknown[]) => {
          if (!this.current(generation)) throw new DomainError('forbidden', 'retired_data_scope');
          try {
            const result: unknown = await member.apply(target, args);
            if (!this.current(generation)) throw new DomainError('forbidden', 'retired_data_scope');
            if (property === 'getHomeSnapshot') {
              const home = result as HomeSnapshot;
              if (home.currentUserId !== this.userId) throw new DomainError('forbidden', 'snapshot_identity_changed');
              this.snapshotRestarts = 0;
              if (home.house.id !== this.state.houseId) {
                if (this.state.phase === 'checking' && !this.state.houseId) this.activateFirstHouse(home);
                else this.replace('active', home);
              }
            } else if (property === 'leaveHouse') {
              // Publish the empty private boundary BEFORE the caller navigates.
              this.replace('no-house');
            } else if (property === 'createHouse' || property === 'acceptInvite') {
              if (this.state.phase === 'no-house') this.beginFirstHouse();
              else this.replace('checking');
            }
            return result;
          } catch (error) {
            if (this.current(generation) && property === 'getHomeSnapshot' && error instanceof DomainError && error.message === 'house_snapshot_changed') {
              // A multi-request read lost its original membership. Erase its
              // data before one fresh lookup; the user may already have joined
              // a different house. Never label that partial read an empty room.
              this.replace(++this.snapshotRestarts <= 1 ? 'checking' : 'denied');
            } else if (this.current(generation) && isAccessLoss(error)) {
              this.replace(error instanceof DomainError && error.message === 'active_house_not_found' ? 'no-house' : 'denied');
            }
            throw error;
          }
        };
      },
    });
    return { generation, clientEpoch, phase, houseId: snapshot?.house.id, client, repository };
  }

  private beginFirstHouse() {
    const previous = this.state;
    // There is no previous house data to retire, but the old repository
    // capability must expire. Keep the QueryClient and mounted navigator so
    // Expo Router is not remounted while its create/join mutation resolves.
    for (const stop of this.teardowns) stop();
    this.teardowns.clear();
    this.state = this.createState(previous.generation + 1, 'checking', undefined, previous.client, previous.clientEpoch);
    this.resetUi();
    for (const listener of this.listeners) listener();
  }

  private activateFirstHouse(home: HomeSnapshot) {
    const state = this.state;
    this.state = { ...state, phase: 'active', houseId: home.house.id };
    state.client.setQueryData(queryKeys.home.activeSnapshot, home);
    for (const listener of this.listeners) listener();
  }

  private replace(phase: PrivateScopeState['phase'], snapshot?: HomeSnapshot) {
    const previous = this.state;
    // Stop accepting events synchronously, then cancel reads and remove private
    // query/mutation caches. Do not resetQueries: that refetches the old house.
    for (const stop of this.teardowns) stop();
    this.teardowns.clear();
    void previous.client.cancelQueries({}, { silent: true });
    previous.client.clear();
    this.state = this.createState(previous.generation + 1, phase, snapshot, undefined, previous.clientEpoch + 1);
    this.resetUi();
    for (const listener of this.listeners) listener();
  }
}
