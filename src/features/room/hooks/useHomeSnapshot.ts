import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import type { AnimalAction } from '@/domain/models';
import { useRepository } from '@/repositories/RepositoryContext';

export const homeSnapshotKey = ['home', 'snapshot'] as const;

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
