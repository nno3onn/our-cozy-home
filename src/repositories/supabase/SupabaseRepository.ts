import type { SupabaseClient } from '@supabase/supabase-js';

import { DomainError } from '@/domain/errors';
import type {
  Animal,
  AttendanceReward,
  CatalogItem,
  AnimalAction,
  AcceptInviteInput,
  CreateHouseInput,
  CreatedInvite,
  HabitLearningSummary,
  HouseCreation,
  HouseLeaveResult,
  HomeSnapshot,
  InvitePreview,
  InviteAcceptance,
  MemorySummary,
  PlaceItemInput,
  PurchaseItemInput,
  PurchaseResult,
  RoomPlacement,
  CreateMemoryDraftInput,
  MemoryDraftResult,
  MemoryShareResult,
  MemoryContributionInput,
  MemoryContribution,
  MemoryPhotoUploadInput,
} from '@/domain/models';
import type { HomeRepository } from '@/domain/repository';
import type { Database } from '@/types/database.generated';

import { mapSupabaseError } from './errors';
import { mapAnimalRow, mapHouseRow, mapProfileRow } from './mappers';

export class SupabaseRepository implements HomeRepository {
  constructor(private readonly client: SupabaseClient<Database>) {}

  getClient(): SupabaseClient<Database> {
    return this.client;
  }

  dispose(): void {
    this.client.auth.stopAutoRefresh();
  }

  async createHouse(input: CreateHouseInput): Promise<HouseCreation> {
    const { data, error } = await this.client.rpc('create_house' as never, {
      p_name: input.name,
      p_request_key: input.requestId,
    } as never);
    if (error) {
      if (error.code === 'P0001' && error.message === 'already_in_house') {
        throw new DomainError('conflict', 'already_in_house');
      }
      throw mapSupabaseError(error);
    }

    const result = (data as unknown as { house_id: string; membership_id: string }[] | null)?.[0];
    if (!result) throw new DomainError('unknown', 'house_creation_result_missing');
    return {
      house: { id: result.house_id, name: input.name, capacity: 4 },
      membershipId: result.membership_id,
    };
  }

  async createInvite(reissue: boolean): Promise<CreatedInvite> {
    const { data, error } = await this.client.rpc('create_house_invite' as never, { p_reissue: reissue } as never);
    if (error) throw mapSupabaseError(error);
    const result = (data as unknown as { invite_token: string; invite_code: string; expires_at: string }[] | null)?.[0];
    if (!result) throw new DomainError('unknown', 'invite_creation_result_missing');
    return { token: result.invite_token, code: result.invite_code, expiresAt: result.expires_at };
  }

  async previewInvite(token: string): Promise<InvitePreview> {
    const { data, error } = await this.client.rpc('preview_house_invite' as never, { p_token: token } as never);
    if (error) throw mapSupabaseError(error);
    const result = (data as unknown as { house_name: string | null; inviter_name: string | null; current_member_count: number | null; state: InvitePreview['state'] }[] | null)?.[0];
    if (!result) throw new DomainError('unknown', 'invite_preview_result_missing');
    return { houseName: result.house_name, inviterName: result.inviter_name, currentMemberCount: result.current_member_count, state: result.state };
  }

  async acceptInvite(input: AcceptInviteInput): Promise<InviteAcceptance> {
    const { data, error } = await this.client.rpc('accept_house_invite' as never, {
      p_token: input.token,
      p_request_key: input.requestId,
    } as never);
    if (error) {
      if (error.code === 'P0001' && ['house_full', 'already_in_house', 'invite_expired', 'invite_cancelled', 'invite_invalid'].includes(error.message)) {
        throw new DomainError('conflict', error.message);
      }
      throw mapSupabaseError(error);
    }
    const result = (data as unknown as { house_id: string; house_name: string; membership_id: string; result: InviteAcceptance['result'] }[] | null)?.[0];
    if (!result) throw new DomainError('unknown', 'invite_acceptance_result_missing');
    return {
      house: { id: result.house_id, name: result.house_name, capacity: 4 },
      membershipId: result.membership_id,
      result: result.result,
    };
  }

  async leaveHouse(): Promise<HouseLeaveResult> {
    const { data, error } = await this.client.rpc('leave_house' as never, {} as never);
    if (error) throw mapSupabaseError(error);
    const result = (data as unknown as { house_id: string | null; house_archived: boolean; successor_profile_id: string | null; result: HouseLeaveResult['result'] }[] | null)?.[0];
    if (!result) throw new DomainError('unknown', 'house_leave_result_missing');
    return {
      houseId: result.house_id,
      houseArchived: result.house_archived,
      successorProfileId: result.successor_profile_id,
      result: result.result,
    };
  }
  async claimAttendance(): Promise<AttendanceReward> {
    const { data, error } = await this.client.rpc('claim_attendance_reward' as never, {} as never);
    if (error) throw mapSupabaseError(error);
    const row = (data as unknown as { balance: number; game_date: string; granted: boolean }[] | null)?.[0];
    if (!row) throw new DomainError('unknown', 'attendance_result_missing');
    return { balance: row.balance, gameDate: row.game_date, granted: row.granted };
  }

  async listShopItems(): Promise<CatalogItem[]> {
    const { data, error } = await this.client
      .from('item_definitions')
      .select('*')
      .eq('source', 'shop')
      .eq('active', true)
      .order('category')
      .order('id');
    if (error) throw mapSupabaseError(error);
    return data.map((row) => ({
      id: row.id,
      source: row.source as CatalogItem['source'],
      category: row.category,
      theme: row.theme,
      nameKo: row.name_ko,
      price: row.price,
      consumable: row.consumable,
      thumbnailKey: row.thumbnail_key,
      roomAssetKey: row.room_asset_key,
      silhouette: row.silhouette,
      size: row.size as CatalogItem['size'],
      anchor: row.anchor as CatalogItem['anchor'],
      allowedSlotIds: row.allowed_slot_ids as CatalogItem['allowedSlotIds'],
      layerBias: row.layer_bias,
      interaction: row.interaction,
      assetStatus: row.asset_status as CatalogItem['assetStatus'],
      previewColor: row.preview_color,
    }));
  }

  async purchaseItem(input: PurchaseItemInput): Promise<PurchaseResult> {
    const { data, error } = await this.client.rpc('purchase_item' as never, {
      p_item_definition_id: input.itemDefinitionId, p_request_key: input.requestId,
    } as never);
    if (error) throw mapSupabaseError(error);
    return this.mapPurchaseResult(data, input.requestId);
  }

  async getPurchaseResult(requestId: string): Promise<PurchaseResult | null> {
    const { data, error } = await this.client.rpc('get_purchase_result' as never, { p_request_key: requestId } as never);
    if (error) throw mapSupabaseError(error);
    if (!(data as unknown[] | null)?.[0]) return null;
    return this.mapPurchaseResult(data, requestId);
  }

  private mapPurchaseResult(data: unknown, requestId: string): PurchaseResult {
    const row = (data as { item_definition_id: string; owned_item_id: string; balance: number; quantity: number; result: PurchaseResult['result'] }[] | null)?.[0];
    if (!row) throw new DomainError('unknown', 'purchase_result_missing');
    return { requestId, itemDefinitionId: row.item_definition_id, ownedItemId: row.owned_item_id, balance: row.balance, quantity: row.quantity, result: row.result };
  }

  async getHomeSnapshot(): Promise<HomeSnapshot> {
    const { data: authData, error: authError } = await this.client.auth.getUser();
    if (authError || !authData.user) {
      throw new DomainError('unauthenticated');
    }

    const profileResult = await this.client
      .from('profiles')
      .select('*')
      .eq('id', authData.user.id)
      .maybeSingle();
    if (profileResult.error) {
      throw mapSupabaseError(profileResult.error);
    }
    if (!profileResult.data) {
      throw new DomainError('not_found', 'profile_not_found');
    }

    const membershipResult = await this.client
      .from('house_memberships')
      .select('*')
      .eq('profile_id', authData.user.id)
      .eq('status', 'active')
      .maybeSingle();
    if (membershipResult.error) {
      throw mapSupabaseError(membershipResult.error);
    }
    if (!membershipResult.data) {
      throw new DomainError('not_found', 'active_house_not_found');
    }

    const houseResult = await this.client
      .from('houses')
      .select('*')
      .eq('id', membershipResult.data.house_id)
      .eq('status', 'active')
      .maybeSingle();
    if (houseResult.error) {
      throw mapSupabaseError(houseResult.error);
    }
    if (!houseResult.data) {
      throw new DomainError('not_found', 'active_house_not_found');
    }

    const membersResult = await this.client
      .from('house_memberships')
      .select('*')
      .eq('house_id', houseResult.data.id)
      .eq('status', 'active')
      .order('joined_at', { ascending: true });
    if (membersResult.error) {
      throw mapSupabaseError(membersResult.error);
    }

    const memberProfileIds = membersResult.data.map((member) => member.profile_id);
    const profilesResult = await this.client
      .from('profiles')
      .select('*')
      .in('id', memberProfileIds);
    if (profilesResult.error) {
      throw mapSupabaseError(profilesResult.error);
    }
    const profilesById = new Map(profilesResult.data.map((row) => [row.id, mapProfileRow(row)]));

    const animalsResult = await this.client.from('animals').select('*').in('profile_id', memberProfileIds);
    if (animalsResult.error) {
      throw mapSupabaseError(animalsResult.error);
    }
    const placementsResult = await (this.client.from('room_placements' as never) as any)
      .select('*')
      .eq('house_id', houseResult.data.id);
    if (placementsResult.error) throw mapSupabaseError(placementsResult.error);
    const ownedItemsResult = await (this.client.from('owned_items' as never) as any)
      .select('*')
      .is('recovered_at', null)
      .or(`profile_id.eq.${authData.user.id},id.in.(${placementsResult.data.map((placement: { owned_item_id: string }) => placement.owned_item_id).join(',') || '00000000-0000-0000-0000-000000000000'})`);
    if (ownedItemsResult.error) throw mapSupabaseError(ownedItemsResult.error);

    return {
      currentUserId: authData.user.id,
      coinBalance: 0,
      house: mapHouseRow(houseResult.data),
      members: membersResult.data.flatMap((membership) => {
        const profile = profilesById.get(membership.profile_id);
        return profile
          ? [
              {
                id: membership.id,
                userId: profile.id,
                displayName: profile.displayName,
                pointColor: profile.pointColor,
                role: membership.role,
              },
            ]
          : [];
      }),
      animals: animalsResult.data.map(mapAnimalRow),
      ownedItems: ownedItemsResult.data.map((item: { id: string; profile_id: string; item_definition_id: string; kind: 'furniture' | 'consumable' | 'memory'; quantity: number }) => ({
        id: item.id, ownerId: item.profile_id, itemDefinitionId: item.item_definition_id, kind: item.kind,
        allowedSlotIds: [], quantity: item.quantity,
      })),
      placements: placementsResult.data.map((placement: { id: string; owned_item_id: string; slot_id: string; version: number }) => ({
        id: placement.id, ownedItemId: placement.owned_item_id, slotId: placement.slot_id, version: placement.version,
      })),
    };
  }

  async performAnimalAction(_animalId: string, _action: AnimalAction): Promise<Animal> {
    throw new DomainError('not_implemented', 'animal_action_rpc_not_implemented');
  }

  async placeItem(input: PlaceItemInput): Promise<RoomPlacement> {
    const { data, error } = await this.client.rpc('place_owned_item' as never, {
      p_owned_item_id: input.ownedItemId, p_slot_id: input.slotId, p_expected_version: input.expectedVersion,
    } as never);
    if (error) throw mapSupabaseError(error);
    const row = (data as { placement_id: string; owned_item_id: string; slot_id: string; version: number }[] | null)?.[0];
    if (!row) throw new DomainError('unknown', 'placement_result_missing');
    return { id: row.placement_id, ownedItemId: row.owned_item_id, slotId: row.slot_id, version: row.version };
  }

  async listMemories(): Promise<MemorySummary[]> {
    return this.listMemorySummaries('current');
  }

  async listArchivedMemories(): Promise<MemorySummary[]> {
    return this.listMemorySummaries('archive');
  }

  private async listMemorySummaries(scope: 'current' | 'archive'): Promise<MemorySummary[]> {
    const { data, error } = await this.client.rpc('list_memory_summaries' as never, { p_scope: scope } as never);
    if (error) throw mapSupabaseError(error);
    return ((data as { id: string; title: string; occurred_on: string; participant_names: string[]; contribution_count: number; furniture_owned_item_id: string | null; preview: string }[] | null) ?? [])
      .map((row) => ({
        id: row.id, title: row.title, occurredOn: row.occurred_on,
        participantNames: row.participant_names ?? [], contributionCount: row.contribution_count,
        furnitureOwnedItemId: row.furniture_owned_item_id, preview: row.preview,
      }));
  }

  async createMemoryDraft(input: CreateMemoryDraftInput): Promise<MemoryDraftResult> {
    const { data, error } = await this.client.rpc('create_memory_draft' as never, {
      p_title: input.title, p_body: input.body, p_occurred_on: input.occurredOn,
    } as never);
    if (error) throw mapSupabaseError(error);
    if (typeof data !== 'string') throw new DomainError('unknown', 'memory_draft_result_missing');
    return { id: data, status: 'private_draft' };
  }

  async shareMemoryDraft(memoryId: string): Promise<MemoryShareResult> {
    const { data, error } = await this.client.rpc('share_memory_draft' as never, { p_memory_id: memoryId } as never);
    if (error) throw mapSupabaseError(error);
    const row = (data as { memory_id: string; house_id: string; viewer_count: number; result: MemoryShareResult['result'] }[] | null)?.[0];
    if (!row) throw new DomainError('unknown', 'memory_share_result_missing');
    return { memoryId: row.memory_id, houseId: row.house_id, viewerCount: row.viewer_count, result: row.result };
  }
  async addMemoryContribution(input: MemoryContributionInput): Promise<string> {
    const { data, error } = await this.client.rpc('add_memory_contribution' as never, { p_memory_id: input.memoryId, p_body: input.body } as never);
    if (error) throw mapSupabaseError(error);
    if (typeof data !== 'string') throw new DomainError('unknown', 'memory_contribution_result_missing');
    return data;
  }

  async getMemoryContributions(memoryId: string): Promise<MemoryContribution[]> {
    const { data, error } = await this.client.rpc('get_memory_contribution_detail' as never, { p_memory_id: memoryId } as never);
    if (error) throw mapSupabaseError(error);
    return ((data as { contribution_id: string; author_profile_id: string; display_name: string; body: string; published_at: string }[] | null) ?? [])
      .map((row) => ({
        id: row.contribution_id, authorProfileId: row.author_profile_id, displayName: row.display_name,
        body: row.body, publishedAt: row.published_at,
      }));
  }

  async uploadMemoryPhoto(input: MemoryPhotoUploadInput): Promise<string> {
    const { data, error } = await this.client.rpc('prepare_memory_photo_upload' as never, { p_contribution_id: input.contributionId, p_request_key: input.requestId, p_mime_type: input.mimeType } as never);
    if (error) throw mapSupabaseError(error);
    const row = (data as { photo_id: string; storage_path: string }[] | null)?.[0];
    if (!row) throw new DomainError('unknown', 'memory_photo_prepare_missing');
    const upload = await this.client.storage.from('memory-photos').upload(row.storage_path, input.body, { contentType: input.mimeType, upsert: true });
    if (upload.error) throw new DomainError('unknown', 'memory_photo_upload_failed');
    const completed = await this.client.rpc('complete_memory_photo_upload' as never, { p_photo_id: row.photo_id } as never);
    if (completed.error) throw mapSupabaseError(completed.error);
    return row.photo_id;
  }

  async getOwnMemoryContribution(memoryId: string): Promise<string> {
    const { data, error } = await this.client.rpc('get_own_memory_contribution' as never, { p_memory_id: memoryId } as never);
    if (error) throw mapSupabaseError(error);
    if (typeof data !== 'string') throw new DomainError('not_found', 'memory_contribution_not_found');
    return data;
  }

  async listHabitLearning(): Promise<HabitLearningSummary[]> {
    throw new DomainError('not_implemented', 'habit_repository_not_implemented');
  }
}
