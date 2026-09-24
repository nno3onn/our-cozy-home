export type AnimalSpecies = 'rabbit' | 'bear' | 'cat';
export type AnimalState = 'idle' | 'eating' | 'resting' | 'playing' | 'reacting';
export type AnimalAction = Exclude<AnimalState, 'idle'>;

export type House = {
  id: string;
  name: string;
  capacity: 4;
};

export type CreateHouseInput = {
  name: string;
  requestId: string;
};

export type HouseCreation = {
  house: House;
  membershipId: string;
};

export type InvitePreview = {
  houseName: string | null;
  inviterName: string | null;
  currentMemberCount: number | null;
  state: 'active' | 'invalid' | 'cancelled' | 'expired' | 'full' | 'reissued';
};

export type CreatedInvite = { token: string; code: string; expiresAt: string };

export type AcceptInviteInput = {
  token: string;
  requestId: string;
};

export type InviteAcceptance = {
  house: House;
  membershipId: string;
  result: 'joined' | 'already_joined';
};

export type HouseLeaveResult = {
  houseId: string | null;
  houseArchived: boolean;
  successorProfileId: string | null;
  result: 'left' | 'already_left';
};
export type AttendanceReward = { balance: number; gameDate: string; granted: boolean };

export type CatalogItem = {
  id: string;
  source: 'shop' | 'memory';
  category: string;
  theme: string;
  nameKo: string;
  price: number;
  consumable: boolean;
  thumbnailKey: string;
  roomAssetKey: string;
  silhouette: string;
  size: { width: number; height: number };
  anchor: { x: number; y: number };
  allowedSlotIds: string[];
  layerBias: number;
  interaction: string;
  assetStatus: 'placeholder' | 'final';
  previewColor: string;
};

export type PurchaseItemInput = { itemDefinitionId: string; requestId: string };
export type PurchaseResult = {
  requestId: string;
  itemDefinitionId: string;
  ownedItemId: string;
  balance: number;
  quantity: number;
  result: 'purchased' | 'already_purchased';
};

export type Member = {
  id: string;
  userId: string;
  displayName: string;
  pointColor: string;
  role: 'admin' | 'member';
};

export type Animal = {
  id: string;
  ownerId: string;
  name: string;
  species: AnimalSpecies;
  state: AnimalState;
};

export type OwnedItem = {
  id: string;
  ownerId: string;
  itemDefinitionId: string;
  kind: 'furniture' | 'consumable' | 'memory';
  allowedSlotIds: string[];
  quantity: number;
};

export type RoomPlacement = {
  id: string;
  ownedItemId: string;
  slotId: string;
  version: number;
};

export type MemorySummary = {
  id: string;
  title: string;
  occurredOn: string;
  participantNames: string[];
  contributionCount: number;
  furnitureOwnedItemId: string | null;
  preview: string;
};

export type CreateMemoryDraftInput = { title: string; body: string; occurredOn: string };
export type MemoryDraftResult = { id: string; status: 'private_draft' };
export type MemoryShareResult = { memoryId: string; houseId: string; viewerCount: number; result: 'shared' | 'already_shared' };

export type HabitLearningSummary = {
  id: string;
  learnerAnimalId: string;
  teacherAnimalId: string;
  habitName: string;
  completedDays: number;
  requiredDays: 3;
  status: 'learning' | 'learned';
};

export type HomeSnapshot = {
  currentUserId: string;
  coinBalance: number;
  house: House;
  members: Member[];
  animals: Animal[];
  ownedItems: OwnedItem[];
  placements: RoomPlacement[];
};

export type PlaceItemInput = {
  ownedItemId: string;
  slotId: string;
  expectedVersion: number;
};
