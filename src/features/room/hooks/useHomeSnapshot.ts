import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import type { AnimalAction } from '@/domain/models';
import { useRepository } from '@/repositories/RepositoryContext';
import { queryKeys } from '@/repositories/queryKeys';

export const homeSnapshotKey = queryKeys.home.activeSnapshot;

export function useHomeSnapshot() {
  const repository = useRepository();
  return useQuery({
    queryKey: homeSnapshotKey,
    queryFn: () => repository.getHomeSnapshot(),
  });
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
