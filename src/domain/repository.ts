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
} from './models';

export interface HomeRepository {
  createHouse(input: CreateHouseInput): Promise<HouseCreation>;
  createInvite(reissue: boolean): Promise<CreatedInvite>;
  cancelInvite(): Promise<void>;
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
  listArchivedMemories(): Promise<MemorySummary[]>;
  createMemoryDraft(input: CreateMemoryDraftInput): Promise<MemoryDraftResult>;
  shareMemoryDraft(memoryId: string): Promise<MemoryShareResult>;
  addMemoryContribution(input: MemoryContributionInput): Promise<string>;
  getMemoryContributions(memoryId: string): Promise<MemoryContribution[]>;
  uploadMemoryPhoto(input: MemoryPhotoUploadInput): Promise<string>;
  getOwnMemoryContribution(memoryId: string): Promise<string>;
  reviseMemoryContribution(contributionId: string, body: string): Promise<string>;
  deleteMemoryContribution(contributionId: string): Promise<string>;
  listHabitLearning(): Promise<HabitLearningSummary[]>;
}
