import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { PropsWithChildren } from 'react';
import { useState } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import type { HomeRepository } from '@/domain/repository';
import { ConnectionProvider } from '@/network/ConnectionProvider';
import { RepositoryProvider } from '@/repositories/RepositoryContext';

export function AppProviders({
  children,
  repository,
}: PropsWithChildren<{ repository?: HomeRepository }>) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            retry: 1,
            staleTime: 30_000,
          },
          mutations: {
            retry: false,
          },
        },
      }),
  );

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ConnectionProvider>
          <QueryClientProvider client={queryClient}>
            {repository ? (
              <RepositoryProvider repository={repository}>
                {children}
              </RepositoryProvider>
            ) : (
              children
            )}
          </QueryClientProvider>
        </ConnectionProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
