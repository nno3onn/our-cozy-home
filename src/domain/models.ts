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
