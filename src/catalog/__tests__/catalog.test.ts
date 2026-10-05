import { existsSync, readFileSync } from 'node:fs';

import { ITEM_CATALOG } from '../items';
import { validateCatalog } from '../catalogValidation';
import { renderCatalogSeed } from '../catalogSeed';

const shopCategories = [
  'curtain',
  'table',
  'cushion',
  'rug',
  'bed',
  'lighting',
  'plant',
  'snack',
] as const;

const memoryCategories = ['dining-table', 'radio', 'frame'] as const;

describe('ITEM_CATALOG', () => {
  it('contains five distinct shop goods in each of the eight categories', () => {
    const shopItems = ITEM_CATALOG.filter((item) => item.source === 'shop');

    expect(shopItems).toHaveLength(40);
    for (const category of shopCategories) {
      const items = shopItems.filter((item) => item.category === category);
      expect(items).toHaveLength(5);
      expect(new Set(items.map((item) => item.silhouette)).size).toBe(5);
    }
  });

  it('contains five appearances in each memory furniture category', () => {
    const memoryItems = ITEM_CATALOG.filter((item) => item.source === 'memory');

    expect(memoryItems).toHaveLength(15);
    for (const category of memoryCategories) {
      expect(memoryItems.filter((item) => item.category === category)).toHaveLength(5);
    }
  });

  it('ships every catalog item with a finished illustrated asset', () => {
    expect(ITEM_CATALOG.filter((item) => item.assetStatus === 'final')).toHaveLength(55);
    expect(ITEM_CATALOG.filter((item) => item.assetStatus === 'placeholder')).toHaveLength(0);
  });

  it('provides complete rendering and interaction metadata for every item', () => {
    expect(validateCatalog(ITEM_CATALOG)).toEqual([]);
    expect(new Set(ITEM_CATALOG.map((item) => item.id)).size).toBe(55);

    for (const item of ITEM_CATALOG) {
      expect(item.nameKo).not.toHaveLength(0);
      expect(item.thumbnailKey).toMatch(/^(placeholder:|illustrated:)/);
      expect(item.roomAssetKey).toMatch(/^(placeholder:|illustrated:)/);
      expect(item.size.width).toBeGreaterThan(0);
      expect(item.size.height).toBeGreaterThan(0);
      expect(item.anchor.x).toBeGreaterThanOrEqual(0);
      expect(item.anchor.y).toBeGreaterThanOrEqual(0);
      expect(item.allowedSlotIds.length).toBeGreaterThan(0);
      expect(Number.isFinite(item.layerBias)).toBe(true);
      expect(['placeholder', 'final']).toContain(item.assetStatus);
      if (item.source === 'shop') expect(item.price).toBeGreaterThan(0);
    }
  });

  it('renders an idempotent SQL seed for every catalog definition and the fixed room slots', () => {
    const sql = renderCatalogSeed(ITEM_CATALOG);
    const itemSection = sql.split('insert into public.item_definitions')[1];

    expect(sql).toContain("'curtain-ribbon-pair'");
    expect(sql).toContain("'memory-frame-stamp-frame'");
    expect((itemSection.match(/\n  \('/g) ?? [])).toHaveLength(55);
    expect(sql).toContain("'floor-accent-left'");
    expect(sql).toContain('on conflict (id) do update');
  });

  it('keeps the committed database seed in sync with the catalog source', () => {
    expect(readFileSync('supabase/seed/001_item_definitions.sql', 'utf8')).toBe(
      renderCatalogSeed(ITEM_CATALOG),
    );
  });

  it('publishes the complete catalog through migrations without requiring seed execution', () => {
    const migration = readFileSync(
      'supabase/migrations/20261003000200_publish_item_catalog.sql',
      'utf8',
    );
    const itemSection = migration.split('insert into public.item_definitions')[1];

    expect((migration.split('insert into public.item_definitions')[0].match(/\n  \('/g) ?? [])).toHaveLength(12);
    expect((itemSection.match(/\n  \('/g) ?? [])).toHaveLength(55);
    for (const item of ITEM_CATALOG) {
      expect(migration).toContain(`'${item.id}'`);
    }
  });

  it('publishes the second finished art set through an additive migration', () => {
    const migration = readFileSync(
      'supabase/migrations/20261004000100_publish_furniture_art_set_2.sql',
      'utf8',
    );
    const expectedPairs = [
      ['curtain-cloud-valance', 'illustrated:furniture:curtain-cloud-valance'],
      ['table-tulip-pedestal', 'illustrated:furniture:table-tulip-pedestal'],
      ['cushion-knot', 'illustrated:furniture:cushion-mint-knot'],
      ['rug-wavy', 'illustrated:furniture:rug-wavy'],
      ['bed-log-bed', 'illustrated:furniture:bed-log'],
      ['lighting-mushroom-lamp', 'illustrated:furniture:lighting-mushroom'],
      ['plant-hanging-ivy', 'illustrated:furniture:plant-hanging-ivy'],
      ['snack-carrot-stars', 'illustrated:furniture:snack-carrot-stars'],
      ['memory-frame-ribbon-frame', 'illustrated:memory:ribbon-frame'],
      ['memory-dining-table-picnic-table', 'illustrated:memory:picnic-table'],
    ];
    const actualPairs = [...migration.matchAll(/\('([^']+)', '([^']+)'\)/g)].map((match) => [
      match[1],
      match[2],
    ]);

    expect(migration).toContain("asset_status = 'final'");
    expect(actualPairs).toEqual(expectedPairs);
  });

  it('publishes the third finished art set through an additive migration', () => {
    const migration = readFileSync(
      'supabase/migrations/20261004000200_publish_furniture_art_set_3.sql',
      'utf8',
    );
    const expectedPairs = [
      ['curtain-leaf-panels', 'illustrated:furniture:curtain-leaf-panels'],
      ['table-cloud-low', 'illustrated:furniture:table-cloud-low'],
      ['cushion-star', 'illustrated:furniture:cushion-star'],
      ['rug-daisy', 'illustrated:furniture:rug-daisy'],
      ['bed-cloud-nest', 'illustrated:furniture:bed-cloud-nest'],
      ['lighting-cloud-pendant', 'illustrated:furniture:lighting-cloud-pendant'],
      ['plant-cactus-trio', 'illustrated:furniture:plant-cactus-trio'],
      ['snack-acorn-cookie', 'illustrated:furniture:snack-acorn-cookie'],
      ['memory-radio-night-radio', 'illustrated:memory:night-radio'],
      ['memory-frame-leaf-frame', 'illustrated:memory:leaf-frame'],
    ];
    const actualPairs = [...migration.matchAll(/\('([^']+)', '([^']+)'\)/g)].map((match) => [
      match[1],
      match[2],
    ]);

    expect(migration).toContain("asset_status = 'final'");
    expect(actualPairs).toEqual(expectedPairs);
  });

  it('publishes the fourth finished art set through an additive migration', () => {
    const migration = readFileSync(
      'supabase/migrations/20261005000100_publish_furniture_art_set_4.sql',
      'utf8',
    );
    const expectedPairs = [
      ['curtain-star-drape', 'illustrated:furniture:curtain-star-drape'],
      ['table-shelf-table', 'illustrated:furniture:table-shelf'],
      ['cushion-cloud', 'illustrated:furniture:cushion-cloud'],
      ['rug-picnic-check', 'illustrated:furniture:rug-picnic-check'],
      ['bed-berry-canopy', 'illustrated:furniture:bed-berry-canopy'],
      ['lighting-constellation', 'illustrated:furniture:lighting-constellation'],
      ['plant-flower-pot', 'illustrated:furniture:plant-flower-pot'],
      ['snack-fish-cloud', 'illustrated:furniture:snack-fish-cloud'],
      ['memory-dining-table-starlight-table', 'illustrated:memory:starlight-table'],
      ['memory-radio-forest-radio', 'illustrated:memory:forest-radio'],
    ];
    const actualPairs = [...migration.matchAll(/\('([^']+)', '([^']+)'\)/g)].map((match) => [
      match[1],
      match[2],
    ]);

    expect(migration).toContain("asset_status = 'final'");
    expect(actualPairs).toEqual(expectedPairs);
  });

  it('publishes the fifth finished art set through an additive migration', () => {
    const migration = readFileSync(
      'supabase/migrations/20261005000200_publish_furniture_art_set_5.sql',
      'utf8',
    );
    const expectedPairs = [
      ['curtain-cafe-check', 'illustrated:furniture:curtain-cafe-check'],
      ['table-clover-table', 'illustrated:furniture:table-clover'],
      ['cushion-petal', 'illustrated:furniture:cushion-petal'],
      ['rug-forest-path', 'illustrated:furniture:rug-forest-path'],
      ['bed-bookcase-bed', 'illustrated:furniture:bed-bookcase'],
      ['lighting-tulip-lamp', 'illustrated:furniture:lighting-tulip'],
      ['plant-mini-palm', 'illustrated:furniture:plant-mini-palm'],
      ['snack-milk-jelly', 'illustrated:furniture:snack-milk-jelly'],
      ['snack-leaf-biscuit', 'illustrated:furniture:snack-leaf-biscuit'],
      ['memory-dining-table-brunch-table', 'illustrated:memory:brunch-table'],
    ];
    const actualPairs = [...migration.matchAll(/\('([^']+)', '([^']+)'\)/g)].map((match) => [
      match[1],
      match[2],
    ]);

    expect(migration).toContain("asset_status = 'final'");
    expect(actualPairs).toEqual(expectedPairs);
  });

  it('publishes the final memory furniture art through an additive migration', () => {
    const migrationPath =
      'supabase/migrations/20261005000300_publish_final_memory_furniture_art.sql';

    expect(existsSync(migrationPath)).toBe(true);
    if (!existsSync(migrationPath)) return;

    const migration = readFileSync(migrationPath, 'utf8');
    const expectedPairs = [
      ['memory-dining-table-snow-table', 'illustrated:memory:snow-table'],
      ['memory-radio-cassette-radio', 'illustrated:memory:cassette-radio'],
      ['memory-radio-shell-radio', 'illustrated:memory:shell-radio'],
      ['memory-frame-cloud-frame', 'illustrated:memory:cloud-frame'],
      ['memory-frame-star-frame', 'illustrated:memory:star-frame'],
      ['memory-frame-stamp-frame', 'illustrated:memory:stamp-frame'],
    ];
    const actualPairs = [...migration.matchAll(/\('([^']+)', '([^']+)'\)/g)].map((match) => [
      match[1],
      match[2],
    ]);

    expect(migration).toContain("asset_status = 'final'");
    expect(actualPairs).toEqual(expectedPairs);
  });
});
