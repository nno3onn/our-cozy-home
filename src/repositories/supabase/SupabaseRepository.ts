import type { SupabaseClient } from '@supabase/supabase-js';

import { DomainError } from '@/domain/errors';
import type {
  Animal,
  AnimalAction,
  HabitLearningSummary,
  HomeSnapshot,
  MemorySummary,
  PlaceItemInput,
  RoomPlacement,
} from '@/domain/models';
import type { HomeRepository } from '@/domain/repository';
import type { Database } from '@/types/database.generated';

import { mapSupabaseError } from './errors';
import { mapAnimalRow, mapHouseRow, mapProfileRow } from './mappers';

export class SupabaseRepository implements HomeRepository {
  constructor(private readonly client: SupabaseClient<Database>) {}

  dispose(): void {
    this.client.auth.stopAutoRefresh();
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
      ownedItems: [],
      placements: [],
    };
  }

  async performAnimalAction(_animalId: string, _action: AnimalAction): Promise<Animal> {
    throw new DomainError('not_implemented', 'animal_action_rpc_not_implemented');
  }

  async placeItem(_input: PlaceItemInput): Promise<RoomPlacement> {
    throw new DomainError('not_implemented', 'placement_rpc_not_implemented');
  }

  async listMemories(): Promise<MemorySummary[]> {
    throw new DomainError('not_implemented', 'memories_repository_not_implemented');
  }

  async listHabitLearning(): Promise<HabitLearningSummary[]> {
    throw new DomainError('not_implemented', 'habit_repository_not_implemented');
  }
}
