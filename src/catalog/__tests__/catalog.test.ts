import { readFileSync } from 'node:fs';

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

  it('provides complete rendering and interaction metadata for every item', () => {
    expect(validateCatalog(ITEM_CATALOG)).toEqual([]);
    expect(new Set(ITEM_CATALOG.map((item) => item.id)).size).toBe(55);

    for (const item of ITEM_CATALOG) {
      expect(item.nameKo).not.toHaveLength(0);
      expect(item.thumbnailKey).toMatch(/^placeholder:/);
      expect(item.roomAssetKey).toMatch(/^placeholder:/);
      expect(item.size.width).toBeGreaterThan(0);
      expect(item.size.height).toBeGreaterThan(0);
      expect(item.anchor.x).toBeGreaterThanOrEqual(0);
      expect(item.anchor.y).toBeGreaterThanOrEqual(0);
      expect(item.allowedSlotIds.length).toBeGreaterThan(0);
      expect(Number.isFinite(item.layerBias)).toBe(true);
      expect(item.assetStatus).toBe('placeholder');
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
});
