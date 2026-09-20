import { DemoRepository } from '../demo/DemoRepository';
import { createRepository } from '../createRepository';

describe('createRepository', () => {
  it('creates demo data only when demo mode is explicit', () => {
    const result = createRepository('demo');

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.repository).toBeInstanceOf(DemoRepository);
    }
  });

  it('does not hide an unconfigured Supabase connection with demo data', () => {
    expect(createRepository('supabase')).toEqual({
      ok: false,
      reason: 'not_configured',
    });
  });
});
