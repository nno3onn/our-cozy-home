import { QueryClient } from '@tanstack/react-query';

import { clearScopedCaches, queryKeys } from '../queryKeys';

describe('query keys', () => {
  it('keeps different users and houses in separate cache namespaces', () => {
    expect(queryKeys.home.snapshot('user-a', 'house-a')).not.toEqual(
      queryKeys.home.snapshot('user-b', 'house-a'),
    );
    expect(queryKeys.home.snapshot('user-a', 'house-a')).not.toEqual(
      queryKeys.home.snapshot('user-a', 'house-b'),
    );
  });

  it('removes only the leaving user cache entries', () => {
    const queryClient = new QueryClient();
    queryClient.setQueryData(queryKeys.home.snapshot('user-a', 'house-a'), 'a');
    queryClient.setQueryData(queryKeys.home.snapshot('user-b', 'house-a'), 'b');

    clearScopedCaches(queryClient, 'user-a');

    expect(queryClient.getQueryData(queryKeys.home.snapshot('user-a', 'house-a'))).toBeUndefined();
    expect(queryClient.getQueryData(queryKeys.home.snapshot('user-b', 'house-a'))).toBe('b');
    queryClient.clear();
  });
});
