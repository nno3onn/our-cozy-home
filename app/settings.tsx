import { useRouter } from 'expo-router';

import { readRuntimeConfig } from '@/config/env';
import { SettingsScreen } from '@/features/settings/SettingsScreen';

export default function SettingsRoute() {
  const router = useRouter();
  const config = readRuntimeConfig();
  const mode = config.ok ? config.mode : 'supabase';

  return <SettingsScreen mode={mode} onOpenAssets={() => router.push('/dev/assets')} />;
}
