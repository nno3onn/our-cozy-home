import { useMutation, useQueryClient } from '@tanstack/react-query';

import type { PlaceItemInput } from '@/domain/models';
import { useRepository } from '@/repositories/RepositoryContext';
import { homeSnapshotKey } from '@/features/room/hooks/useHomeSnapshot';

export function usePlaceItem() {
  const repository = useRepository();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: PlaceItemInput) => repository.placeItem(input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: homeSnapshotKey });
    },
    onError: async () => {
      await queryClient.invalidateQueries({ queryKey: homeSnapshotKey });
    },
  });
}
