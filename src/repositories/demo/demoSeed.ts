import type {
  HabitLearningSummary,
  HomeSnapshot,
  MemorySummary,
} from '@/domain/models';

export type DemoState = {
  home: HomeSnapshot;
  memories: MemorySummary[];
  habitLearning: HabitLearningSummary[];
};

export const demoSeed: DemoState = {
  home: {
    currentUserId: 'user-narae',
    coinBalance: 1280,
    house: {
      id: 'house-dorandoran',
      name: '도란도란 우리집',
      capacity: 4,
    },
    members: [
      {
        id: 'member-narae',
        userId: 'user-narae',
        displayName: '나래',
        pointColor: '#F2A98C',
        role: 'admin',
      },
      {
        id: 'member-minjun',
        userId: 'user-minjun',
        displayName: '민준',
        pointColor: '#91C9AF',
        role: 'member',
      },
      {
        id: 'member-yubin',
        userId: 'user-yubin',
        displayName: '유빈',
        pointColor: '#94BFE0',
        role: 'member',
      },
      {
        id: 'member-haru',
        userId: 'user-haru',
        displayName: '하루',
        pointColor: '#B7A8D8',
        role: 'member',
      },
    ],
    animals: [
      {
        id: 'animal-tori',
        ownerId: 'user-narae',
        name: '토리',
        species: 'rabbit',
        state: 'idle',
      },
      {
        id: 'animal-dubu',
        ownerId: 'user-minjun',
        name: '두부',
        species: 'bear',
        state: 'resting',
      },
      {
        id: 'animal-bori',
        ownerId: 'user-yubin',
        name: '보리',
        species: 'cat',
        state: 'playing',
      },
      {
        id: 'animal-maru',
        ownerId: 'user-haru',
        name: '마루',
        species: 'rabbit',
        state: 'eating',
      },
    ],
    ownedItems: [
      {
        id: 'owned-peach-cushion',
        ownerId: 'user-minjun',
        itemDefinitionId: 'cushion-peach-shell',
        kind: 'furniture',
        allowedSlotIds: ['floor-accent-left', 'floor-accent-right'],
        quantity: 1,
      },
      {
        id: 'owned-mint-cushion',
        ownerId: 'user-narae',
        itemDefinitionId: 'cushion-mint-knot',
        kind: 'furniture',
        allowedSlotIds: ['floor-accent-left', 'floor-accent-right'],
        quantity: 1,
      },
      {
        id: 'owned-memory-radio',
        ownerId: 'user-narae',
        itemDefinitionId: 'memory-radio-picnic',
        kind: 'memory',
        allowedSlotIds: ['memory-shelf'],
        quantity: 1,
      },
    ],
    placements: [
      {
        id: 'placement-floor-accent-left',
        ownedItemId: 'owned-peach-cushion',
        slotId: 'floor-accent-left',
        version: 1,
      },
      {
        id: 'placement-memory-shelf',
        ownedItemId: 'owned-memory-radio',
        slotId: 'memory-shelf',
        version: 1,
      },
    ],
  },
  memories: [
    {
      id: 'memory-river-picnic',
      title: '강가에서 보낸 오후',
      occurredOn: '2026-09-14',
      participantNames: ['나래', '민준', '유빈'],
      contributionCount: 3,
      furnitureOwnedItemId: 'owned-memory-radio',
      preview: '돗자리를 펴고 서로 좋아하는 노래를 들었어요.',
    },
  ],
  habitLearning: [
    {
      id: 'learning-tori-dance',
      learnerAnimalId: 'animal-tori',
      teacherAnimalId: 'animal-dubu',
      habitName: '빙글빙글 춤',
      completedDays: 2,
      requiredDays: 3,
      status: 'learning',
    },
    {
      id: 'learning-bori-pose',
      learnerAnimalId: 'animal-bori',
      teacherAnimalId: 'animal-tori',
      habitName: '사진 포즈',
      completedDays: 3,
      requiredDays: 3,
      status: 'learned',
    },
  ],
};
