import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';

import type { Database } from '@/types/database.generated';

import { nativeSessionStorage } from './sessionStorage';

export type SupabaseClientConfig = {
  supabaseUrl: string;
  supabasePublishableKey: string;
};

export function createSupabaseClient({
  supabaseUrl,
  supabasePublishableKey,
}: SupabaseClientConfig): SupabaseClient<Database> {
  return createClient<Database>(supabaseUrl, supabasePublishableKey, {
    auth: {
      // Jest does not own a native app lifecycle. Disabling its interval there keeps
      // repository tests deterministic; device and web builds keep token refresh on.
      autoRefreshToken: process.env.NODE_ENV !== 'test',
      persistSession: true,
      detectSessionInUrl: Platform.OS === 'web',
      ...(Platform.OS === 'web' ? {} : { storage: nativeSessionStorage }),
    },
  });
}
