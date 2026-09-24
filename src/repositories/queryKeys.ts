import type { QueryClient } from '@tanstack/react-query';

const root = ['our-cozy-home'] as const;

export const queryKeys = {
  user: (userId: string) => [...root, 'user', userId] as const,
  house: (houseId: string) => [...root, 'house', houseId] as const,
  home: {
    activeSnapshot: [...root, 'home', 'snapshot'] as const,
    snapshot: (userId: string, houseId: string) =>
      [...root, 'user', userId, 'house', houseId, 'home', 'snapshot'] as const,
  },
};

export function clearScopedCaches(queryClient: QueryClient, userId: string): void {
  queryClient.removeQueries({ queryKey: queryKeys.user(userId) });
  queryClient.removeQueries({ queryKey: queryKeys.home.activeSnapshot });
}
