import type {
  Animal,
  AnimalAction,
  CreateHouseInput,
  HabitLearningSummary,
  HouseCreation,
  HomeSnapshot,
  MemorySummary,
  PlaceItemInput,
  RoomPlacement,
} from '@/domain/models';
import type { HomeRepository } from '@/domain/repository';

import { demoSeed, type DemoState } from './demoSeed';

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

export class DemoRepository implements HomeRepository {
  private state: DemoState = clone(demoSeed);

  async createHouse(_input: CreateHouseInput): Promise<HouseCreation> {
    throw new Error('demo_house_creation_not_available');
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
