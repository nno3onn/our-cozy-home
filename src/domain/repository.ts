import type {
  Animal,
  AnimalAction,
  HabitLearningSummary,
  HomeSnapshot,
  MemorySummary,
  PlaceItemInput,
  RoomPlacement,
} from './models';

export interface HomeRepository {
  getHomeSnapshot(): Promise<HomeSnapshot>;
  performAnimalAction(animalId: string, action: AnimalAction): Promise<Animal>;
  placeItem(input: PlaceItemInput): Promise<RoomPlacement>;
  listMemories(): Promise<MemorySummary[]>;
  listHabitLearning(): Promise<HabitLearningSummary[]>;
}
