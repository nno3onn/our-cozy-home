import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import type { AnimalAction } from '@/domain/models';
import { useRepository } from '@/repositories/RepositoryContext';
import { queryKeys } from '@/repositories/queryKeys';
import { isTransportFailure } from '@/auth/privateErrors';
import { usePrivateScopeState } from '@/auth/PrivateScopeContext';
import { useConnectionStatus } from '@/network/ConnectionProvider';

export const homeSnapshotKey = queryKeys.home.activeSnapshot;

export function useHomeSnapshot() {
  const repository = useRepository();
  const scope = usePrivateScopeState();
  const online = useConnectionStatus();
  const query = useQuery({
    queryKey: homeSnapshotKey,
    queryFn: () => repository.getHomeSnapshot(),
    enabled: !scope || (online && (scope.phase === 'checking' || scope.phase === 'active')),
  });
  if (query.isError && !(isTransportFailure(query.error) && !online && query.data)) {
    return { ...query, data: undefined };
  }
  if (query.isError && !online && query.data) {
    return { ...query, isError: false as const, status: 'success' as const, error: null };
  }
  return query;
}

export function useAnimalAction() {
  const repository = useRepository();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ animalId, action }: { animalId: string; action: AnimalAction }) =>
      repository.performAnimalAction(animalId, action),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: homeSnapshotKey });
    },
  });
}
