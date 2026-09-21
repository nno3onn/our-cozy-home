import { DemoRepository } from '../demo/DemoRepository';
import { createRepository } from '../createRepository';
import { SupabaseRepository } from '../supabase/SupabaseRepository';

describe('createRepository', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it('creates demo data only when demo mode is explicit', () => {
    const result = createRepository({ ok: true, mode: 'demo' });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.repository).toBeInstanceOf(DemoRepository);
    }
  });

  it('creates a real repository in Supabase mode instead of falling back to demo data', () => {
    const result = createRepository({
      ok: true,
      mode: 'supabase',
      supabaseUrl: 'https://example.supabase.co',
      supabasePublishableKey: 'publishable-test-key',
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.repository).toBeInstanceOf(SupabaseRepository);
      expect(result.repository).not.toBeInstanceOf(DemoRepository);
      if (result.repository instanceof SupabaseRepository) {
        result.repository.dispose();
      }
    }
  });
});
