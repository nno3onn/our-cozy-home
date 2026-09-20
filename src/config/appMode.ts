export type AppMode = 'demo' | 'supabase';

export type AppModeResult =
  | { ok: true; mode: AppMode }
  | { ok: false; reason: 'missing_app_mode' | 'invalid_app_mode' };

export function parseAppMode(value: string | undefined): AppModeResult {
  if (value === undefined || value.trim() === '') {
    return { ok: false, reason: 'missing_app_mode' };
  }

  if (value === 'demo' || value === 'supabase') {
    return { ok: true, mode: value };
  }

  return { ok: false, reason: 'invalid_app_mode' };
}
