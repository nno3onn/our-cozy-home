import { useQuery } from '@tanstack/react-query';

import { useRepository } from '@/repositories/RepositoryContext';

export const memoriesKey = ['memories'] as const;

export function useMemories() {
  const repository = useRepository();
  return useQuery({ queryKey: memoriesKey, queryFn: () => repository.listMemories() });
}
