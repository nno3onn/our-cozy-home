import type {
  Animal,
  AttendanceReward,
  AnimalAction,
  AcceptInviteInput,
  CreateHouseInput,
  CreatedInvite,
  HabitLearningSummary,
  HouseCreation,
  HouseLeaveResult,
  InvitePreview,
  InviteAcceptance,
  HomeSnapshot,
  MemorySummary,
  PlaceItemInput,
  RoomPlacement,
} from '@/domain/models';
import type { HomeRepository } from '@/domain/repository';
import { ITEM_CATALOG } from '@/catalog/items';

import { demoSeed, type DemoState } from './demoSeed';

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

export class DemoRepository implements HomeRepository {
  private state: DemoState = clone(demoSeed);

  async createHouse(_input: CreateHouseInput): Promise<HouseCreation> {
    throw new Error('demo_house_creation_not_available');
  }

  async createInvite(_reissue: boolean): Promise<CreatedInvite> {
    return { token: 'demo-invite-token', code: 'DEMO2026', expiresAt: new Date(Date.now() + 86_400_000).toISOString() };
  }

  async previewInvite(_token: string): Promise<InvitePreview> {
    return { houseName: this.state.home.house.name, inviterName: '나래', currentMemberCount: 4, state: 'active' };
  }

  async acceptInvite(_input: AcceptInviteInput): Promise<InviteAcceptance> {
    throw new Error('demo_invite_acceptance_not_available');
  }

  async leaveHouse(): Promise<HouseLeaveResult> {
    throw new Error('demo_house_leave_not_available');
  }
  async claimAttendance(): Promise<AttendanceReward> { throw new Error('demo_attendance_not_available'); }
  async listShopItems() {
    return clone(ITEM_CATALOG.filter((item) => item.source === 'shop'));
  }

  async getHomeSnapshot(): Promise<HomeSnapshot> {
    return clone(this.state.home);
  }

  async performAnimalAction(
    animalId: string,
    action: AnimalAction,
  ): Promise<Animal> {
    const animal = this.state.home.animals.find((candidate) => candidate.id === animalId);

    if (!animal) {
      throw new Error('animal_not_found');
    }

    animal.state = action;
    return clone(animal);
  }

  async placeItem(input: PlaceItemInput): Promise<RoomPlacement> {
    const item = this.state.home.ownedItems.find(
      (candidate) => candidate.id === input.ownedItemId,
    );
    const placement = this.state.home.placements.find(
      (candidate) => candidate.slotId === input.slotId,
    );

    if (!item) {
      throw new Error('owned_item_not_found');
    }

    if (!item.allowedSlotIds.includes(input.slotId)) {
      throw new Error('incompatible_slot');
    }

    if (placement && placement.version !== input.expectedVersion) {
      throw new Error('placement_conflict');
    }

    if (placement) {
      placement.ownedItemId = item.id;
      placement.version += 1;
      return clone(placement);
    }

    const created: RoomPlacement = {
      id: `placement-${input.slotId}`,
      ownedItemId: item.id,
      slotId: input.slotId,
      version: 1,
    };
    this.state.home.placements.push(created);
    return clone(created);
  }

  async listMemories(): Promise<MemorySummary[]> {
    return clone(this.state.memories);
  }

  async listHabitLearning(): Promise<HabitLearningSummary[]> {
    return clone(this.state.habitLearning);
  }

  async resetDemo(): Promise<void> {
    this.state = clone(demoSeed);
  }
}
