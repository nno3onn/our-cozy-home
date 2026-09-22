import { useMutation, useQueryClient } from '@tanstack/react-query';

import type { CreateHouseInput } from '@/domain/models';
import { useRepository } from '@/repositories/RepositoryContext';
import { homeSnapshotKey } from '@/features/room/hooks/useHomeSnapshot';

export function useCreateHouse() {
  const repository = useRepository();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateHouseInput) => repository.createHouse(input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: homeSnapshotKey });
    },
  });
}
