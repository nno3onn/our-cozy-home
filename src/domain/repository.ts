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
} from './models';

export interface HomeRepository {
  createHouse(input: CreateHouseInput): Promise<HouseCreation>;
  getHomeSnapshot(): Promise<HomeSnapshot>;
  performAnimalAction(animalId: string, action: AnimalAction): Promise<Animal>;
  placeItem(input: PlaceItemInput): Promise<RoomPlacement>;
  listMemories(): Promise<MemorySummary[]>;
  listHabitLearning(): Promise<HabitLearningSummary[]>;
}
