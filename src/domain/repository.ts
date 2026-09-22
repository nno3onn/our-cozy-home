import type {
  Animal,
  AnimalAction,
  CreateHouseInput,
  HabitLearningSummary,
  HouseCreation,
  HomeSnapshot,
  InvitePreview,
  MemorySummary,
  PlaceItemInput,
  RoomPlacement,
} from './models';

export interface HomeRepository {
  createHouse(input: CreateHouseInput): Promise<HouseCreation>;
  previewInvite(token: string): Promise<InvitePreview>;
  getHomeSnapshot(): Promise<HomeSnapshot>;
  performAnimalAction(animalId: string, action: AnimalAction): Promise<Animal>;
  placeItem(input: PlaceItemInput): Promise<RoomPlacement>;
  listMemories(): Promise<MemorySummary[]>;
  listHabitLearning(): Promise<HabitLearningSummary[]>;
}
