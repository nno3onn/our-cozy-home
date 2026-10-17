import { QueryClient } from '@tanstack/react-query';

import { DomainError } from '@/domain/errors';
import type { HomeSnapshot } from '@/domain/models';
import type { HomeRepository } from '@/domain/repository';
import { queryKeys } from '@/repositories/queryKeys';
import { isAccessLoss } from './privateErrors';

export type PrivateScopeState = {
  generation: number;
  phase: 'checking' | 'active' | 'no-house' | 'denied' | 'retired';
  houseId?: string;
  client: QueryClient;
  repository: HomeRepository;
};

/** A client and repository capability belong to exactly one identity/generation.
 * Retired clients are never installed in a newer provider, even if a transport
 * ignores cancellation. This does not replace any server ownership/RLS checks. */
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

  private createState(generation: number, phase: PrivateScopeState['phase'], snapshot?: HomeSnapshot): PrivateScopeState {
    const client = new QueryClient({ defaultOptions: {
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
              if (home.house.id !== this.state.houseId) this.replace('active', home);
            } else if (property === 'leaveHouse') {
              // Publish the empty private boundary BEFORE the caller navigates.
              this.replace('no-house');
            } else if (property === 'createHouse' || property === 'acceptInvite') {
              this.replace('checking');
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
    return { generation, phase, houseId: snapshot?.house.id, client, repository };
  }

  private replace(phase: PrivateScopeState['phase'], snapshot?: HomeSnapshot) {
    const previous = this.state;
    // Stop accepting events synchronously, then cancel reads and remove private
    // query/mutation caches. Do not resetQueries: that refetches the old house.
    for (const stop of this.teardowns) stop();
    this.teardowns.clear();
    void previous.client.cancelQueries({}, { silent: true });
    previous.client.clear();
    this.state = this.createState(previous.generation + 1, phase, snapshot);
    this.resetUi();
    for (const listener of this.listeners) listener();
  }
}
