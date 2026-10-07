import { Redirect, Stack, useSegments } from 'expo-router';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppProviders } from '@/providers/AppProviders';
import { AuthProvider, useAuth } from '@/auth/AuthProvider';
import { DemoBanner } from '@/components/DemoBanner';
import { ModeErrorScreen } from '@/components/ModeErrorScreen';
import { readRuntimeConfig } from '@/config/env';
import { createRepository } from '@/repositories/createRepository';
import { getAuthRedirect, getPendingInviteRedirect } from '@/auth/routeGuard';
import { AppButton } from '@/components/ui/AppButton';
import { InlineNotice } from '@/components/ui/InlineNotice';
import { Skeleton } from '@/components/ui/Skeleton';
import { colors, spacing } from '@/theme/tokens';
import { appFonts } from '@/theme/fonts';

void SplashScreen.preventAutoHideAsync();

const runtimeConfig = readRuntimeConfig();
const repositoryResult = runtimeConfig.ok
  ? createRepository(runtimeConfig)
  : null;

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts(appFonts);

  useEffect(() => {
    if (fontsLoaded || fontError) {
      void SplashScreen.hideAsync();
    }
  }, [fontError, fontsLoaded]);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <AppProviders repository={repositoryResult?.ok ? repositoryResult.repository : undefined}>
      <StatusBar style="dark" />
      {!runtimeConfig.ok ? (
        <ModeErrorScreen reason={runtimeConfig.reason} />
      ) : repositoryResult && !repositoryResult.ok ? (
        <ModeErrorScreen reason={repositoryResult.reason} />
      ) : runtimeConfig.mode === 'supabase' && repositoryResult?.ok && repositoryResult.supabaseRepository ? (
        <AuthProvider client={repositoryResult.supabaseRepository.getClient()}><AuthenticatedRoutes /></AuthProvider>
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
    return <View style={styles.loading}><View style={styles.loadingCard}><Skeleton height={32} width="48%" /><Skeleton height={20} width="72%" /><Skeleton height={52} /></View></View>;
  }
  if (state.status === 'signed_in' && onboarding === 'unavailable') {
    return <View style={styles.loading}><View style={styles.loadingCard}><InlineNotice message={onboardingError ?? '네트워크 상태를 확인한 뒤 다시 시도해 주세요.'} title="프로필을 확인하지 못했어요" tone="danger" /><AppButton label="다시 시도" onPress={() => void refreshOnboarding()} /></View></View>;
  }
  if (redirect) return <Redirect href={redirect} />;
  if (state.status === 'signed_in') {
    const inviteRedirect = getPendingInviteRedirect(state.pendingInvite, segments);
    if (inviteRedirect) return <Redirect href={inviteRedirect} />;
  }
  return <Stack screenOptions={{ headerShown: false }} />;
}

const styles = StyleSheet.create({
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background, padding: spacing.xl },
  loadingCard: { width: '100%', maxWidth: 420, gap: spacing.lg },
});
