import { createSupabaseClient } from '../client';
import { SupabaseRepository } from '../SupabaseRepository';

describe('SupabaseRepository', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it('returns a domain error for commands whose server RPC has not been implemented', async () => {
    const repository = new SupabaseRepository(createSupabaseClient({
      supabaseUrl: 'https://example.supabase.co',
      supabasePublishableKey: 'publishable-test-key',
    }));

    await expect(repository.listMemories()).rejects.toMatchObject({
      code: 'not_implemented',
    });
    repository.dispose();
  });

  it('stops session refresh work when the repository is disposed', () => {
    const client = createSupabaseClient({
      supabaseUrl: 'https://example.supabase.co',
      supabasePublishableKey: 'publishable-test-key',
    });
    const stopAutoRefresh = jest.spyOn(client.auth, 'stopAutoRefresh');
    const repository = new SupabaseRepository(client);

    repository.dispose();

    expect(stopAutoRefresh).toHaveBeenCalledTimes(1);
  });
});
