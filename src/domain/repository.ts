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
} from './models';

export interface HomeRepository {
  createHouse(input: CreateHouseInput): Promise<HouseCreation>;
  createInvite(reissue: boolean): Promise<CreatedInvite>;
  previewInvite(token: string): Promise<InvitePreview>;
  acceptInvite(input: AcceptInviteInput): Promise<InviteAcceptance>;
  leaveHouse(): Promise<HouseLeaveResult>;
  claimAttendance(): Promise<AttendanceReward>;
  listShopItems(): Promise<CatalogItem[]>;
  purchaseItem(input: PurchaseItemInput): Promise<PurchaseResult>;
  getPurchaseResult(requestId: string): Promise<PurchaseResult | null>;
  getHomeSnapshot(): Promise<HomeSnapshot>;
  performAnimalAction(animalId: string, action: AnimalAction): Promise<Animal>;
  placeItem(input: PlaceItemInput): Promise<RoomPlacement>;
  listMemories(): Promise<MemorySummary[]>;
  createMemoryDraft(input: CreateMemoryDraftInput): Promise<MemoryDraftResult>;
  shareMemoryDraft(memoryId: string): Promise<MemoryShareResult>;
  listHabitLearning(): Promise<HabitLearningSummary[]>;
}
