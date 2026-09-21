import { Redirect, Stack, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';

import { AppProviders } from '@/providers/AppProviders';
import { AuthProvider, useAuth } from '@/auth/AuthProvider';
import { DemoBanner } from '@/components/DemoBanner';
import { ModeErrorScreen } from '@/components/ModeErrorScreen';
import { readRuntimeConfig } from '@/config/env';
import { createRepository } from '@/repositories/createRepository';
import { SupabaseRepository } from '@/repositories/supabase/SupabaseRepository';

const runtimeConfig = readRuntimeConfig();
const repositoryResult = runtimeConfig.ok
  ? createRepository(runtimeConfig)
  : null;

export default function RootLayout() {
  return (
    <AppProviders repository={repositoryResult?.ok ? repositoryResult.repository : undefined}>
      <StatusBar style="dark" />
      {!runtimeConfig.ok ? (
        <ModeErrorScreen reason={runtimeConfig.reason} />
      ) : repositoryResult && !repositoryResult.ok ? (
        <ModeErrorScreen reason={repositoryResult.reason} />
      ) : runtimeConfig.mode === 'supabase' && repositoryResult?.ok && repositoryResult.repository instanceof SupabaseRepository ? (
        <AuthProvider client={repositoryResult.repository.getClient()}><AuthenticatedRoutes /></AuthProvider>
      ) : (
        <View style={{ flex: 1 }}>
          {runtimeConfig.mode === 'demo' ? <DemoBanner /> : null}
          <Stack screenOptions={{ headerShown: false }} />
        </View>
      )}
    </AppProviders>
  );
}

function AuthenticatedRoutes() {
  const { state } = useAuth();
  const segments = useSegments();
  if (state.status === 'loading') return <View style={{ flex: 1 }} />;
  if (state.status === 'signed_out') {
    return segments[0] === 'auth' ? <Stack screenOptions={{ headerShown: false }} /> : <Redirect href="/auth/sign-in" />;
  }
  if (segments[0] === 'auth') return <Redirect href="/" />;
  return <Stack screenOptions={{ headerShown: false }} />;
}
