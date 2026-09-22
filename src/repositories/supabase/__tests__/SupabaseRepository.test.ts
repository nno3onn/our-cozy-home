import { createSupabaseClient } from '../client';
import { SupabaseRepository } from '../SupabaseRepository';
import type { Database } from '@/types/database.generated';
import type { SupabaseClient } from '@supabase/supabase-js';

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

  it('maps an idempotent house creation RPC result into the domain result', async () => {
    const rpc = jest.fn().mockResolvedValue({
      data: [{ house_id: 'house-1', membership_id: 'membership-1' }],
      error: null,
    });
    const repository = new SupabaseRepository({ rpc } as unknown as SupabaseClient<Database>);

    await expect(repository.createHouse({ name: '도란도란 우리집', requestId: 'request-1' })).resolves.toEqual({
      house: { id: 'house-1', name: '도란도란 우리집', capacity: 4 },
      membershipId: 'membership-1',
    });
    expect(rpc).toHaveBeenCalledWith('create_house', {
      p_name: '도란도란 우리집',
      p_request_key: 'request-1',
    });
  });

  it('exposes an existing active house as a recoverable conflict', async () => {
    const rpc = jest.fn().mockResolvedValue({
      data: null,
      error: { code: 'P0001', message: 'already_in_house' },
    });
    const repository = new SupabaseRepository({ rpc } as unknown as SupabaseClient<Database>);

    await expect(repository.createHouse({ name: '다른 집', requestId: 'request-2' })).rejects.toMatchObject({
      code: 'conflict',
      message: 'already_in_house',
    });
  });

  it('maps only the safe invite preview fields returned by the server', async () => {
    const rpc = jest.fn().mockResolvedValue({
      data: [{ house_name: '도란도란 우리집', inviter_name: '모모', current_member_count: 2, state: 'active' }],
      error: null,
    });
    const repository = new SupabaseRepository({ rpc } as unknown as SupabaseClient<Database>);

    await expect(repository.previewInvite('untrusted-link-token')).resolves.toEqual({
      houseName: '도란도란 우리집', inviterName: '모모', currentMemberCount: 2, state: 'active',
    });
    expect(rpc).toHaveBeenCalledWith('preview_house_invite', { p_token: 'untrusted-link-token' });
  });
});
