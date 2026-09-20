import { createContext, type PropsWithChildren, useContext } from 'react';

import type { HomeRepository } from '@/domain/repository';

const RepositoryContext = createContext<HomeRepository | null>(null);

export function RepositoryProvider({
  children,
  repository,
}: PropsWithChildren<{ repository: HomeRepository }>) {
  return (
    <RepositoryContext.Provider value={repository}>
      {children}
    </RepositoryContext.Provider>
  );
}

export function useRepository(): HomeRepository {
  const repository = useContext(RepositoryContext);
  if (!repository) {
    throw new Error('repository_provider_missing');
  }
  return repository;
}
