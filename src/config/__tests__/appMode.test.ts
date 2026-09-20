import { parseAppMode } from '../appMode';
import { resolveRuntimeConfig } from '../env';

describe('runtime mode configuration', () => {
  it('accepts demo only when it is explicitly requested', () => {
    expect(parseAppMode('demo')).toEqual({ ok: true, mode: 'demo' });
  });

  it('rejects a missing mode instead of silently using demo data', () => {
    expect(parseAppMode(undefined)).toEqual({
      ok: false,
      reason: 'missing_app_mode',
    });
  });

  it('rejects unknown mode names', () => {
    expect(parseAppMode('production')).toEqual({
      ok: false,
      reason: 'invalid_app_mode',
    });
  });

  it('requires both Supabase public environment values in real mode', () => {
    expect(resolveRuntimeConfig({ mode: 'supabase' })).toEqual({
      ok: false,
      reason: 'missing_supabase_environment',
    });
  });

  it('returns a usable Supabase config only when all values are present', () => {
    expect(
      resolveRuntimeConfig({
        mode: 'supabase',
        supabaseUrl: 'https://example.supabase.co',
        supabasePublishableKey: 'publishable-test-key',
      }),
    ).toEqual({
      ok: true,
      mode: 'supabase',
      supabaseUrl: 'https://example.supabase.co',
      supabasePublishableKey: 'publishable-test-key',
    });
  });
});
