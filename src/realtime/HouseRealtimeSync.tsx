import type { SupabaseClient } from '@supabase/supabase-js';
import { useQuery, useQueryClient } from '@tanstack/react-query';

import { homeSnapshotKey } from '@/features/room/hooks/useHomeSnapshot';
import { useAppLifecycle } from '@/features/room/hooks/useAppLifecycle';
import { useConnectionStatus } from '@/network/ConnectionProvider';
import { useRepository } from '@/repositories/RepositoryContext';
import { useHouseRealtime } from './useHouseRealtime';
import { usePrivateScope, usePrivateScopeState } from '@/auth/PrivateScopeContext';

// Mount once inside authenticated routes, rather than once per stacked screen.
export function HouseRealtimeSync({ client, userId }: { client: SupabaseClient; userId?: string }) {
  const repository = useRepository();
  const scope = usePrivateScope();
  const scopeState = usePrivateScopeState();
  const queryClient = useQueryClient();
  const isOnline = useConnectionStatus();
  const isActive = useAppLifecycle({ onActive: () => {
    if (userId) void queryClient.invalidateQueries({ queryKey: homeSnapshotKey });
  } });
  const enabled = Boolean(userId) && isOnline && isActive && (!scopeState || scopeState.phase === 'checking' || scopeState.phase === 'active');
  const snapshot = useQuery({
    queryKey: homeSnapshotKey,
    queryFn: () => repository.getHomeSnapshot(),
    enabled,
    // Reconcile missed events and removals through RLS-checked reads. We do not
    // subscribe to DELETE payloads or widen replica identity for private rows.
    refetchInterval: enabled ? 15_000 : false,
    refetchIntervalInBackground: true,
  });
  const houseId = enabled && !snapshot.isError && snapshot.data?.currentUserId === userId
    ? snapshot.data?.house.id : undefined;
  useHouseRealtime(enabled ? client : undefined, queryClient, houseId, scope?.registerTeardown);
  return null;
}
