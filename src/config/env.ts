import { parseAppMode } from './appMode';

export type RuntimeEnvironment = {
  mode?: string;
  supabaseUrl?: string;
  supabasePublishableKey?: string;
};

export type RuntimeConfig =
  | { ok: true; mode: 'demo' }
  | {
      ok: true;
      mode: 'supabase';
      supabaseUrl: string;
      supabasePublishableKey: string;
    }
  | {
      ok: false;
      reason:
        | 'missing_app_mode'
        | 'invalid_app_mode'
        | 'missing_supabase_environment';
    };

export function resolveRuntimeConfig(environment: RuntimeEnvironment): RuntimeConfig {
  const parsedMode = parseAppMode(environment.mode);

  if (!parsedMode.ok) {
    return parsedMode;
  }

  if (parsedMode.mode === 'demo') {
    return { ok: true, mode: 'demo' };
  }

  if (!environment.supabaseUrl || !environment.supabasePublishableKey) {
    return { ok: false, reason: 'missing_supabase_environment' };
  }

  return {
    ok: true,
    mode: 'supabase',
    supabaseUrl: environment.supabaseUrl,
    supabasePublishableKey: environment.supabasePublishableKey,
  };
}

export function readRuntimeConfig(): RuntimeConfig {
  return resolveRuntimeConfig({
    mode: process.env.EXPO_PUBLIC_APP_MODE,
    supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL,
    supabasePublishableKey:
      process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  });
}
