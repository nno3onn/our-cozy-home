import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';

import { AppProviders } from '@/providers/AppProviders';
import { DemoBanner } from '@/components/DemoBanner';
import { ModeErrorScreen } from '@/components/ModeErrorScreen';
import { readRuntimeConfig } from '@/config/env';
import { createRepository } from '@/repositories/createRepository';

const runtimeConfig = readRuntimeConfig();
const repositoryResult = runtimeConfig.ok
  ? createRepository(runtimeConfig.mode)
  : null;

export default function RootLayout() {
  return (
    <AppProviders repository={repositoryResult?.ok ? repositoryResult.repository : undefined}>
      <StatusBar style="dark" />
      {!runtimeConfig.ok ? (
        <ModeErrorScreen reason={runtimeConfig.reason} />
      ) : repositoryResult && !repositoryResult.ok ? (
        <ModeErrorScreen reason="supabase_repository_unavailable" />
      ) : (
        <View style={{ flex: 1 }}>
          {runtimeConfig.mode === 'demo' ? <DemoBanner /> : null}
          <Stack screenOptions={{ headerShown: false }} />
        </View>
      )}
    </AppProviders>
  );
}
