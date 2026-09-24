import { createSupabaseClient } from '../client';
import { SupabaseRepository } from '../SupabaseRepository';
import type { Database } from '@/types/database.generated';
import type { SupabaseClient } from '@supabase/supabase-js';

describe('SupabaseRepository', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it('maps a server error while loading memory summaries', async () => {
    const rpc = jest.fn().mockResolvedValue({ data: null, error: { code: '42501', message: 'permission denied' } });
    const repository = new SupabaseRepository({ rpc } as unknown as SupabaseClient<Database>);

    await expect(repository.listMemories()).rejects.toMatchObject({ code: 'forbidden' });
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

  it('returns a newly issued plaintext token only from the create command', async () => {
    const rpc = jest.fn().mockResolvedValue({ data: [{ invite_token: 'token-once', invite_code: 'AB12CD34', expires_at: '2026-09-23T00:00:00Z' }], error: null });
    const repository = new SupabaseRepository({ rpc } as unknown as SupabaseClient<Database>);
    await expect(repository.createInvite(true)).resolves.toEqual({ token: 'token-once', code: 'AB12CD34', expiresAt: '2026-09-23T00:00:00Z' });
    expect(rpc).toHaveBeenCalledWith('create_house_invite', { p_reissue: true });
  });

  it('maps an idempotent invite acceptance into a joined house result', async () => {
    const rpc = jest.fn().mockResolvedValue({
      data: [{ house_id: 'house-2', house_name: '포근한 집', membership_id: 'membership-2', result: 'joined' }],
      error: null,
    });
    const repository = new SupabaseRepository({ rpc } as unknown as SupabaseClient<Database>);

    await expect(repository.acceptInvite({ token: 'invite-token', requestId: 'accept-request-1' })).resolves.toEqual({
      house: { id: 'house-2', name: '포근한 집', capacity: 4 },
      membershipId: 'membership-2',
      result: 'joined',
    });
    expect(rpc).toHaveBeenCalledWith('accept_house_invite', {
      p_token: 'invite-token',
      p_request_key: 'accept-request-1',
    });
  });

  it('maps a leave command result without trusting a client-side role', async () => {
    const rpc = jest.fn().mockResolvedValue({
      data: [{ house_id: 'house-2', house_archived: false, successor_profile_id: 'profile-3', result: 'left' }],
      error: null,
    });
    const repository = new SupabaseRepository({ rpc } as unknown as SupabaseClient<Database>);

    await expect(repository.leaveHouse()).resolves.toEqual({
      houseId: 'house-2',
      houseArchived: false,
      successorProfileId: 'profile-3',
      result: 'left',
    });
    expect(rpc).toHaveBeenCalledWith('leave_house', {});
  });
  it('maps the server-confirmed attendance balance', async () => {
    const rpc = jest.fn().mockResolvedValue({ data: [{ balance: 100, game_date: '2026-09-23', granted: true }], error: null });
    const repository = new SupabaseRepository({ rpc } as unknown as SupabaseClient<Database>);
    await expect(repository.claimAttendance()).resolves.toEqual({ balance: 100, gameDate: '2026-09-23', granted: true });
  });

  it('reads active shop catalog entries and treats database prices as authoritative', async () => {
    const queryResult = {
      data: [{
        id: 'cushion-shell', source: 'shop', category: 'cushion', theme: 'sunny', name_ko: '복숭아 조개 쿠션',
        price: 180, consumable: false, thumbnail_key: 'placeholder:thumb:cushion-shell',
        room_asset_key: 'placeholder:room:cushion-shell', silhouette: 'shell', size: { width: 140, height: 90 },
        anchor: { x: 70, y: 82 }, allowed_slot_ids: ['floor-accent-left'], layer_bias: 2,
        interaction: 'rest', asset_status: 'placeholder', preview_color: '#F2A98C', active: true,
      }],
      error: null,
    };
    const order: jest.Mock = jest.fn();
    order.mockImplementationOnce(() => ({ order })).mockResolvedValueOnce(queryResult);
    const eq: jest.Mock = jest.fn();
    eq.mockReturnValue({ eq, order });
    const select = jest.fn(() => ({ eq }));
    const from = jest.fn(() => ({ select }));
    const repository = new SupabaseRepository({ from } as unknown as SupabaseClient<Database>);

    await expect(repository.listShopItems()).resolves.toEqual([
      expect.objectContaining({ id: 'cushion-shell', price: 180, nameKo: '복숭아 조개 쿠션' }),
    ]);
    expect(from).toHaveBeenCalledWith('item_definitions');
    expect(eq).toHaveBeenCalledWith('source', 'shop');
    expect(eq).toHaveBeenCalledWith('active', true);
  });

  it('treats an empty catalog response as an empty shop instead of throwing', async () => {
    const order: jest.Mock = jest.fn();
    order.mockImplementationOnce(() => ({ order })).mockResolvedValueOnce({ data: null, error: null });
    const eq: jest.Mock = jest.fn();
    eq.mockReturnValue({ eq, order });
    const select = jest.fn(() => ({ eq }));
    const from = jest.fn(() => ({ select }));
    const repository = new SupabaseRepository({ from } as unknown as SupabaseClient<Database>);

    await expect(repository.listShopItems()).resolves.toEqual([]);
  });

  it('sends only a definition id and request key to the purchase RPC', async () => {
    const rpc = jest.fn().mockResolvedValue({ data: [{ item_definition_id: 'cushion-shell', owned_item_id: 'owned-1', balance: 1100, quantity: 1, result: 'purchased' }], error: null });
    const repository = new SupabaseRepository({ rpc } as unknown as SupabaseClient<Database>);

    await expect(repository.purchaseItem({ itemDefinitionId: 'cushion-shell', requestId: '00000000-0000-4000-8000-000000000001' })).resolves.toEqual({
      itemDefinitionId: 'cushion-shell', ownedItemId: 'owned-1', balance: 1100, quantity: 1, result: 'purchased', requestId: '00000000-0000-4000-8000-000000000001',
    });
    expect(rpc).toHaveBeenCalledWith('purchase_item', { p_item_definition_id: 'cushion-shell', p_request_key: '00000000-0000-4000-8000-000000000001' });
  });

  it('preserves the server-confirmed coin shortage for purchase feedback', async () => {
    const rpc = jest.fn().mockResolvedValue({
      data: null,
      error: {
        code: 'P0001',
        message: 'insufficient_coins',
        details: '{"balance":100,"price":320,"shortage":220}',
      },
    });
    const repository = new SupabaseRepository({ rpc } as unknown as SupabaseClient<Database>);

    await expect(repository.purchaseItem({ itemDefinitionId: 'curtain-ribbon-pair', requestId: '00000000-0000-4000-8000-000000000002' }))
      .rejects.toMatchObject({
        code: 'conflict',
        message: 'insufficient_coins',
        details: { balance: 100, price: 320, shortage: 220 },
      });
  });

  it('sends the expected placement version to the server placement RPC', async () => {
    const rpc = jest.fn().mockResolvedValue({ data: [{ placement_id: 'placement-1', owned_item_id: 'owned-1', slot_id: 'floor-accent-left', version: 2 }], error: null });
    const repository = new SupabaseRepository({ rpc } as unknown as SupabaseClient<Database>);
    await expect(repository.placeItem({ ownedItemId: 'owned-1', slotId: 'floor-accent-left', expectedVersion: 1 })).resolves.toEqual({ id: 'placement-1', ownedItemId: 'owned-1', slotId: 'floor-accent-left', version: 2 });
    expect(rpc).toHaveBeenCalledWith('place_owned_item', { p_owned_item_id: 'owned-1', p_slot_id: 'floor-accent-left', p_expected_version: 1 });
  });

  it('creates a private draft without accepting a client supplied owner or house', async () => {
    const rpc = jest.fn().mockResolvedValue({ data: 'memory-1', error: null });
    const repository = new SupabaseRepository({ rpc } as unknown as SupabaseClient<Database>);

    await expect(repository.createMemoryDraft({ title: '혼자 쓴 기록', body: '나만 보는 글', occurredOn: '2026-09-24' })).resolves.toEqual({ id: 'memory-1', status: 'private_draft' });
    expect(rpc).toHaveBeenCalledWith('create_memory_draft', { p_title: '혼자 쓴 기록', p_body: '나만 보는 글', p_occurred_on: '2026-09-24' });
  });

  it('shares a draft through the server-owned active-member snapshot', async () => {
    const rpc = jest.fn().mockResolvedValue({ data: [{ memory_id: 'memory-1', house_id: 'house-1', viewer_count: 3, result: 'shared' }], error: null });
    const repository = new SupabaseRepository({ rpc } as unknown as SupabaseClient<Database>);

    await expect(repository.shareMemoryDraft('memory-1')).resolves.toEqual({ memoryId: 'memory-1', houseId: 'house-1', viewerCount: 3, result: 'shared' });
    expect(rpc).toHaveBeenCalledWith('share_memory_draft', { p_memory_id: 'memory-1' });
  });

  it('reads the current-house shelf and personal archive through separate server scopes', async () => {
    const rpc = jest.fn()
      .mockResolvedValueOnce({
        data: [{ id: 'memory-current', title: '현재 추억', occurred_on: '2026-09-24', participant_names: ['모모', '밤비'], contribution_count: 2, furniture_owned_item_id: null, preview: '같이 남긴 기록' }],
        error: null,
      })
      .mockResolvedValueOnce({
        data: [{ id: 'memory-archive', title: '보관한 추억', occurred_on: '2026-09-20', participant_names: ['모모'], contribution_count: 1, furniture_owned_item_id: null, preview: '퇴장 시점의 기록' }],
        error: null,
      });
    const repository = new SupabaseRepository({ rpc } as unknown as SupabaseClient<Database>);

    await expect(repository.listMemories()).resolves.toEqual([
      expect.objectContaining({ id: 'memory-current', contributionCount: 2 }),
    ]);
    await expect(repository.listArchivedMemories()).resolves.toEqual([
      expect.objectContaining({ id: 'memory-archive', contributionCount: 1 }),
    ]);
    expect(rpc).toHaveBeenNthCalledWith(1, 'list_memory_summaries', { p_scope: 'current' });
    expect(rpc).toHaveBeenNthCalledWith(2, 'list_memory_summaries', { p_scope: 'archive' });
  });

  it('sends a contribution body only to the server-owned contribution RPC', async () => {
    const rpc = jest.fn().mockResolvedValue({ data: 'contribution-1', error: null });
    const repository = new SupabaseRepository({ rpc } as unknown as SupabaseClient<Database>);

    await expect(repository.addMemoryContribution({ memoryId: 'memory-1', body: '함께 산책했어' })).resolves.toBe('contribution-1');
    expect(rpc).toHaveBeenCalledWith('add_memory_contribution', { p_memory_id: 'memory-1', p_body: '함께 산책했어' });
  });

  it('maps server-filtered contribution details without reconstructing access rules in the app', async () => {
    const rpc = jest.fn().mockResolvedValue({
      data: [{ contribution_id: 'contribution-1', author_profile_id: 'profile-1', display_name: '모모', body: '퇴장 전 기록', published_at: '2026-09-24T10:00:00Z' }],
      error: null,
    });
    const repository = new SupabaseRepository({ rpc } as unknown as SupabaseClient<Database>);

    await expect(repository.getMemoryContributions('memory-1')).resolves.toEqual([
      { id: 'contribution-1', authorProfileId: 'profile-1', displayName: '모모', body: '퇴장 전 기록', publishedAt: '2026-09-24T10:00:00Z' },
    ]);
    expect(rpc).toHaveBeenCalledWith('get_memory_contribution_detail', { p_memory_id: 'memory-1' });
  });
});
