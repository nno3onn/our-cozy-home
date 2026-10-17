import { PostgrestError, type SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database.generated';
import { SupabaseRepository } from '../SupabaseRepository';
import { mapSupabaseError } from '../errors';

function fixture(revokeAfterRead: boolean, finalError = false) {
  let left = false;
  let membershipReads = 0;
  const rows: Record<string, object[]> = {
    profiles: [{ id: 'A', display_name: 'A private name', point_color: '#123456' }],
    house_memberships: [{ id: 'member-a', house_id: 'house-a', profile_id: 'A', role: 'admin' }],
    houses: [{ id: 'house-a', name: 'A private house', capacity: 4 }],
    animals: [], owned_items: [], room_placements: [],
  };
  const client = {
    auth: { getUser: jest.fn(async () => ({ data: { user: { id: 'A' } }, error: null })) },
    from: (table: string) => {
      const query = {
        select: () => query, eq: () => query, in: () => query, is: () => query, or: () => query, order: () => query,
        maybeSingle: async () => {
          if (table === 'house_memberships') membershipReads++;
          if (table === 'house_memberships' && membershipReads > 1 && finalError) return { data: null, error: { code: '42501', message: 'permission denied' } };
          return { data: table === 'house_memberships' && left ? null : rows[table][0], error: null };
        },
        then: (resolve: (value: unknown) => unknown) => {
          if (table === 'owned_items' && revokeAfterRead) left = true;
          return Promise.resolve({ data: rows[table], error: null }).then(resolve);
        },
      };
      return query;
    },
  };
  return { repository: new SupabaseRepository(client as unknown as SupabaseClient<Database>), client };
}

it('does not return a room read across a committed departure', async () => {
  await expect(fixture(true).repository.getHomeSnapshot()).rejects.toMatchObject({ code: 'not_found', message: 'active_house_not_found' });
});
it('propagates a final RLS denial instead of returning a cached or empty room', async () => {
  await expect(fixture(false, true).repository.getHomeSnapshot()).rejects.toMatchObject({ code: 'forbidden' });
});
it('returns a confirmed empty room only after the final membership check succeeds', async () => {
  await expect(fixture(false).repository.getHomeSnapshot()).resolves.toMatchObject({ currentUserId: 'A', house: { id: 'house-a' }, placements: [] });
});
it('distinguishes an Auth transport outage from a rejected session', async () => {
  const { repository, client } = fixture(false);
  client.auth.getUser.mockResolvedValue({ data: { user: null }, error: { name: 'AuthRetryableFetchError', status: 0 } } as never);
  await expect(repository.getHomeSnapshot()).rejects.toMatchObject({ code: 'network_unavailable' });
  client.auth.getUser.mockResolvedValue({ data: { user: null }, error: { name: 'AuthApiError', status: 401 } } as never);
  await expect(repository.getHomeSnapshot()).rejects.toMatchObject({ code: 'unauthenticated' });
});
it.each(['PGRST301', 'PGRST302', 'PGRST303'])('treats %s as an authentication denial, not a missing catalog row', (code) => {
  expect(mapSupabaseError(new PostgrestError({ code, message: 'JWT denied', details: '', hint: '' }))).toMatchObject({ code: 'unauthenticated' });
});
