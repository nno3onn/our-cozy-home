import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';

import { AppProviders } from '@/app/AppProviders';
import { DemoBanner } from '@/components/DemoBanner';
import { ModeErrorScreen } from '@/components/ModeErrorScreen';
import { readRuntimeConfig } from '@/config/env';

export default function RootLayout() {
  const runtimeConfig = readRuntimeConfig();

  return (
    <AppProviders>
      <StatusBar style="dark" />
      {!runtimeConfig.ok ? (
        <ModeErrorScreen reason={runtimeConfig.reason} />
      ) : (
        <View style={{ flex: 1 }}>
          {runtimeConfig.mode === 'demo' ? <DemoBanner /> : null}
          <Stack screenOptions={{ headerShown: false }} />
        </View>
      )}
    </AppProviders>
  );
}
