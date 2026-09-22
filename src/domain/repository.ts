import type {
  Animal,
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
  RoomPlacement,
} from './models';

export interface HomeRepository {
  createHouse(input: CreateHouseInput): Promise<HouseCreation>;
  createInvite(reissue: boolean): Promise<CreatedInvite>;
  previewInvite(token: string): Promise<InvitePreview>;
  acceptInvite(input: AcceptInviteInput): Promise<InviteAcceptance>;
  leaveHouse(): Promise<HouseLeaveResult>;
  getHomeSnapshot(): Promise<HomeSnapshot>;
  performAnimalAction(animalId: string, action: AnimalAction): Promise<Animal>;
  placeItem(input: PlaceItemInput): Promise<RoomPlacement>;
  listMemories(): Promise<MemorySummary[]>;
  listHabitLearning(): Promise<HabitLearningSummary[]>;
}
