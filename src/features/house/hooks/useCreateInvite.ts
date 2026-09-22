import { useMutation } from '@tanstack/react-query';

import { useRepository } from '@/repositories/RepositoryContext';

export function useCreateInvite() {
  const repository = useRepository();
  return useMutation({ mutationFn: (reissue: boolean) => repository.createInvite(reissue) });
}
