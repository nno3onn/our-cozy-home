export const SHOP_CATEGORIES = [
  'curtain',
  'table',
  'cushion',
  'rug',
  'bed',
  'lighting',
  'plant',
  'snack',
] as const;

export const MEMORY_CATEGORIES = ['dining-table', 'radio', 'frame'] as const;

export type ShopCategory = (typeof SHOP_CATEGORIES)[number];
export type MemoryCategory = (typeof MEMORY_CATEGORIES)[number];
export type ItemCategory = ShopCategory | MemoryCategory;
export type ItemSource = 'shop' | 'memory';
export type InteractionKind = 'none' | 'rest' | 'eat' | 'play' | 'memory-detail';

export type ItemDefinition = {
  id: string;
  source: ItemSource;
  category: ItemCategory;
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
  interaction: InteractionKind;
  assetStatus: 'placeholder' | 'final';
  previewColor: string;
};

type ItemSeed = Pick<ItemDefinition, 'nameKo' | 'silhouette' | 'previewColor'>;

const commonSeeds: Record<ShopCategory, ItemSeed[]> = {
  curtain: [
    { nameKo: '햇살 리본 커튼', silhouette: 'ribbon-pair', previewColor: '#F4C6A8' },
    { nameKo: '구름 주름 커튼', silhouette: 'cloud-valance', previewColor: '#B9D8EC' },
    { nameKo: '숲잎 커튼', silhouette: 'leaf-panels', previewColor: '#A8D2B4' },
    { nameKo: '별밤 커튼', silhouette: 'star-drape', previewColor: '#B9ACD8' },
    { nameKo: '체크 카페 커튼', silhouette: 'cafe-check', previewColor: '#EAA6A1' },
  ],
  table: [
    { nameKo: '둥근 쿠키 탁자', silhouette: 'round-cookie', previewColor: '#CFA77C' },
    { nameKo: '튤립 찻상', silhouette: 'tulip-pedestal', previewColor: '#EFA7A7' },
    { nameKo: '구름 낮은 탁자', silhouette: 'cloud-low', previewColor: '#B8D8E9' },
    { nameKo: '책장 겸용 탁자', silhouette: 'shelf-table', previewColor: '#B89270' },
    { nameKo: '네잎 식탁', silhouette: 'clover-table', previewColor: '#93C7A5' },
  ],
  cushion: [
    { nameKo: '복숭아 조개 쿠션', silhouette: 'shell', previewColor: '#F2A98C' },
    { nameKo: '민트 매듭 쿠션', silhouette: 'knot', previewColor: '#91C9AF' },
    { nameKo: '별 쿠션', silhouette: 'star', previewColor: '#E6C66E' },
    { nameKo: '구름 쿠션', silhouette: 'cloud', previewColor: '#C3DDEE' },
    { nameKo: '꽃잎 방석', silhouette: 'petal', previewColor: '#D9A9C4' },
  ],
  rug: [
    { nameKo: '포근 타원 러그', silhouette: 'soft-oval', previewColor: '#D8B891' },
    { nameKo: '물결 러그', silhouette: 'wavy', previewColor: '#91C5D8' },
    { nameKo: '데이지 러그', silhouette: 'daisy', previewColor: '#E8C96F' },
    { nameKo: '체크 피크닉 러그', silhouette: 'picnic-check', previewColor: '#E8A59B' },
    { nameKo: '숲길 러그', silhouette: 'forest-path', previewColor: '#92B78F' },
  ],
  bed: [
    { nameKo: '달잠 침대', silhouette: 'moon-headboard', previewColor: '#AFA9D5' },
    { nameKo: '통나무 침대', silhouette: 'log-bed', previewColor: '#B68D67' },
    { nameKo: '구름 둥지', silhouette: 'cloud-nest', previewColor: '#C8DCE8' },
    { nameKo: '딸기 캐노피', silhouette: 'berry-canopy', previewColor: '#E99A9C' },
    { nameKo: '책장 침대', silhouette: 'bookcase-bed', previewColor: '#D2AA78' },
  ],
  lighting: [
    { nameKo: '반딧불 스탠드', silhouette: 'firefly-stand', previewColor: '#E9CA6F' },
    { nameKo: '버섯 조명', silhouette: 'mushroom-lamp', previewColor: '#E6A186' },
    { nameKo: '구름 펜던트', silhouette: 'cloud-pendant', previewColor: '#B8D8E9' },
    { nameKo: '별자리 무드등', silhouette: 'constellation', previewColor: '#AFA8D7' },
    { nameKo: '튤립 램프', silhouette: 'tulip-lamp', previewColor: '#EAA0AF' },
  ],
  plant: [
    { nameKo: '동글 고무나무', silhouette: 'round-rubber-tree', previewColor: '#83B598' },
    { nameKo: '매달린 아이비', silhouette: 'hanging-ivy', previewColor: '#76AA86' },
    { nameKo: '선인장 친구', silhouette: 'cactus-trio', previewColor: '#8FBD8D' },
    { nameKo: '꽃핀 화분', silhouette: 'flower-pot', previewColor: '#D59AB2' },
    { nameKo: '작은 야자수', silhouette: 'mini-palm', previewColor: '#78B99A' },
  ],
  snack: [
    { nameKo: '당근 별사탕', silhouette: 'carrot-stars', previewColor: '#EFA26F' },
    { nameKo: '꿀밤 쿠키', silhouette: 'acorn-cookie', previewColor: '#C89665' },
    { nameKo: '생선 구름칩', silhouette: 'fish-cloud', previewColor: '#91BCD4' },
    { nameKo: '딸기 우유젤리', silhouette: 'milk-jelly', previewColor: '#E99CA8' },
    { nameKo: '민트 잎비스킷', silhouette: 'leaf-biscuit', previewColor: '#8EC3A7' },
  ],
};

const categoryDefaults: Record<
  ShopCategory,
  Pick<ItemDefinition, 'size' | 'anchor' | 'allowedSlotIds' | 'layerBias' | 'interaction' | 'consumable'>
> = {
  curtain: { size: { width: 260, height: 250 }, anchor: { x: 130, y: 250 }, allowedSlotIds: ['window'], layerBias: -20, interaction: 'none', consumable: false },
  table: { size: { width: 280, height: 190 }, anchor: { x: 140, y: 180 }, allowedSlotIds: ['center-table'], layerBias: 0, interaction: 'eat', consumable: false },
  cushion: { size: { width: 140, height: 90 }, anchor: { x: 70, y: 82 }, allowedSlotIds: ['floor-accent-left', 'floor-accent-right'], layerBias: 2, interaction: 'rest', consumable: false },
  rug: { size: { width: 550, height: 170 }, anchor: { x: 275, y: 145 }, allowedSlotIds: ['floor-rug'], layerBias: -10, interaction: 'none', consumable: false },
  bed: { size: { width: 300, height: 230 }, anchor: { x: 150, y: 220 }, allowedSlotIds: ['bed-corner'], layerBias: 1, interaction: 'rest', consumable: false },
  lighting: { size: { width: 120, height: 230 }, anchor: { x: 60, y: 220 }, allowedSlotIds: ['light-left', 'light-right'], layerBias: 1, interaction: 'none', consumable: false },
  plant: { size: { width: 150, height: 230 }, anchor: { x: 75, y: 220 }, allowedSlotIds: ['plant-corner'], layerBias: 1, interaction: 'none', consumable: false },
  snack: { size: { width: 84, height: 64 }, anchor: { x: 42, y: 56 }, allowedSlotIds: ['animal-use'], layerBias: 4, interaction: 'eat', consumable: true },
};

const categoryPrices: Record<ShopCategory, number> = {
  curtain: 320,
  table: 450,
  cushion: 180,
  rug: 360,
  bed: 520,
  lighting: 280,
  plant: 240,
  snack: 80,
};

function createShopItems(): ItemDefinition[] {
  return SHOP_CATEGORIES.flatMap((category) =>
    commonSeeds[category].map((seed, index) => {
      const id = `${category}-${seed.silhouette}`;
      return {
        id,
        source: 'shop',
        category,
        theme: ['sunny', 'forest', 'cloud', 'night', 'picnic'][index],
        ...seed,
        price: categoryPrices[category] + index * 20,
        thumbnailKey: `placeholder:thumb:${id}`,
        roomAssetKey: `placeholder:room:${id}`,
        assetStatus: 'placeholder',
        ...categoryDefaults[category],
      };
    }),
  );
}

const memorySeeds: Record<MemoryCategory, ItemSeed[]> = {
  'dining-table': [
    { nameKo: '생일 식탁', silhouette: 'birthday-table', previewColor: '#E9A08E' },
    { nameKo: '소풍 식탁', silhouette: 'picnic-table', previewColor: '#91B995' },
    { nameKo: '별밤 식탁', silhouette: 'starlight-table', previewColor: '#AAA5D4' },
    { nameKo: '브런치 식탁', silhouette: 'brunch-table', previewColor: '#E7C47A' },
    { nameKo: '눈꽃 식탁', silhouette: 'snow-table', previewColor: '#B6D7E7' },
  ],
  radio: [
    { nameKo: '소풍 라디오', silhouette: 'picnic-radio', previewColor: '#E6A889' },
    { nameKo: '밤하늘 라디오', silhouette: 'night-radio', previewColor: '#A9A5D3' },
    { nameKo: '숲속 라디오', silhouette: 'forest-radio', previewColor: '#8DB59A' },
    { nameKo: '카세트 라디오', silhouette: 'cassette-radio', previewColor: '#E2BE70' },
    { nameKo: '조개 라디오', silhouette: 'shell-radio', previewColor: '#D7A6BB' },
  ],
  frame: [
    { nameKo: '리본 액자', silhouette: 'ribbon-frame', previewColor: '#E7A2AE' },
    { nameKo: '나뭇잎 액자', silhouette: 'leaf-frame', previewColor: '#8FB393' },
    { nameKo: '구름 액자', silhouette: 'cloud-frame', previewColor: '#ADD2E5' },
    { nameKo: '별 액자', silhouette: 'star-frame', previewColor: '#D6BA6D' },
    { nameKo: '우표 액자', silhouette: 'stamp-frame', previewColor: '#B1A5D1' },
  ],
};

function createMemoryItems(): ItemDefinition[] {
  return MEMORY_CATEGORIES.flatMap((category) =>
    memorySeeds[category].map((seed, index) => {
      const id = `memory-${category}-${seed.silhouette}`;
      return {
        id,
        source: 'memory',
        category,
        theme: ['celebration', 'picnic', 'night', 'everyday', 'seasonal'][index],
        ...seed,
        price: 0,
        consumable: false,
        thumbnailKey: `placeholder:thumb:${id}`,
        roomAssetKey: `placeholder:room:${id}`,
        size: category === 'frame' ? { width: 150, height: 170 } : { width: 220, height: 160 },
        anchor: category === 'frame' ? { x: 75, y: 160 } : { x: 110, y: 150 },
        allowedSlotIds: category === 'frame' ? ['memory-wall'] : ['memory-shelf'],
        layerBias: category === 'frame' ? -15 : 3,
        interaction: 'memory-detail',
        assetStatus: 'placeholder',
      };
    }),
  );
}

export const ITEM_CATALOG: ItemDefinition[] = [...createShopItems(), ...createMemoryItems()];

export const ITEM_BY_ID = new Map(ITEM_CATALOG.map((item) => [item.id, item]));
