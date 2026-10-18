import { useMutation, useQueryClient } from '@tanstack/react-query';

import type { CreateHouseInput } from '@/domain/models';
import { useRepository } from '@/repositories/RepositoryContext';
import { homeSnapshotKey } from '@/features/room/hooks/useHomeSnapshot';
import { usePrivateScope } from '@/auth/PrivateScopeContext';

export function useCreateHouse() {
  const repository = useRepository();
  const queryClient = useQueryClient();
  const privateScope = usePrivateScope();

  return useMutation({
    mutationFn: (input: CreateHouseInput) => repository.createHouse(input),
    onSuccess: async () => {
      // Creating a house rotates the private QueryClient. Invalidating the
      // retired client can notify an unmounting route during navigation.
      if (!privateScope) await queryClient.invalidateQueries({ queryKey: homeSnapshotKey });
    },
  });
}
