import { Redirect, Stack, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';

import { AppProviders } from '@/providers/AppProviders';
import { AuthProvider, useAuth } from '@/auth/AuthProvider';
import { DemoBanner } from '@/components/DemoBanner';
import { ModeErrorScreen } from '@/components/ModeErrorScreen';
import { readRuntimeConfig } from '@/config/env';
import { createRepository } from '@/repositories/createRepository';
import { SupabaseRepository } from '@/repositories/supabase/SupabaseRepository';
import { getAuthRedirect } from '@/auth/routeGuard';
import { AppText } from '@/components/ui/AppText';
import { colors, spacing } from '@/theme/tokens';

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
  const { state, onboarding, onboardingError, refreshOnboarding } = useAuth();
  const segments = useSegments();
  const redirect = getAuthRedirect({ ...state, onboarding }, segments);
  if (state.status === 'loading' || (state.status === 'signed_in' && onboarding === 'loading')) {
    return <View style={styles.loading}><ActivityIndicator color={colors.ink} /></View>;
  }
  if (state.status === 'signed_in' && onboarding === 'unavailable') {
    return <View style={styles.loading}><AppText tone="danger">프로필을 확인하지 못했어요.</AppText><AppText tone="muted">{onboardingError ?? '네트워크 상태를 확인한 뒤 다시 시도해 주세요.'}</AppText><Pressable accessibilityRole="button" accessibilityLabel="프로필 다시 확인" onPress={() => void refreshOnboarding()}><AppText variant="label">다시 시도</AppText></Pressable></View>;
  }
  if (redirect) return <Redirect href={redirect} />;
  return <Stack screenOptions={{ headerShown: false }} />;
}

const styles = StyleSheet.create({
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.md, backgroundColor: colors.cream, padding: spacing.xl },
});
