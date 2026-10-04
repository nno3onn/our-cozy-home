import { ITEM_BY_ID } from '@/catalog/items';

import { getIllustratedAsset } from '../assetManifest';

describe('illustrated asset manifest', () => {
  const secondFurnitureSet = [
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
  ] as const;

  it('resolves the pilot room, animals, and furniture assets', () => {
    expect(getIllustratedAsset('illustrated:room:sunny')).toMatchObject({ status: 'final' });
    expect(getIllustratedAsset('illustrated:animal:rabbit')).toMatchObject({ status: 'final' });
    expect(getIllustratedAsset('illustrated:animal:cat')).toMatchObject({ status: 'final' });
    expect(getIllustratedAsset('illustrated:animal:bear')).toMatchObject({ status: 'final' });
    expect(getIllustratedAsset('illustrated:animal:dog')).toMatchObject({ status: 'final' });
    expect(getIllustratedAsset('illustrated:furniture:cushion-shell')).toMatchObject({ status: 'final' });
    expect(getIllustratedAsset('illustrated:furniture:table-cookie')).toMatchObject({ status: 'final' });
    expect(getIllustratedAsset('illustrated:furniture:plant-rubber-tree')).toMatchObject({ status: 'final' });
    expect(getIllustratedAsset('illustrated:furniture:bed-moon-sleep')).toMatchObject({ status: 'final' });
    expect(getIllustratedAsset('illustrated:furniture:lighting-firefly-stand')).toMatchObject({ status: 'final' });
    expect(getIllustratedAsset('illustrated:furniture:rug-soft-oval')).toMatchObject({ status: 'final' });
    expect(getIllustratedAsset('illustrated:furniture:curtain-sunlight-ribbon')).toMatchObject({ status: 'final' });
  });

  it('provides a thumbnail fallback for every catalog item', () => {
    expect(ITEM_BY_ID.size).toBeGreaterThan(0);
    for (const item of ITEM_BY_ID.values()) {
      expect(getIllustratedAsset(item.thumbnailKey) ?? getIllustratedAsset('illustrated:placeholder:item')).toBeDefined();
    }
  });

  it.each(secondFurnitureSet)('uses finished art for %s', (itemId, assetKey) => {
    expect(ITEM_BY_ID.get(itemId)).toMatchObject({
      assetStatus: 'final',
      thumbnailKey: assetKey,
      roomAssetKey: assetKey,
    });
    expect(getIllustratedAsset(assetKey)).toMatchObject({
      kind: 'furniture',
      status: 'final',
    });
  });

  it('keeps the pilot cushion thumbnail and room asset on one shared art key', () => {
    const cushion = ITEM_BY_ID.get('cushion-shell');

    expect(cushion?.thumbnailKey).toBe('illustrated:furniture:cushion-shell');
    expect(cushion?.roomAssetKey).toBe(cushion?.thumbnailKey);
  });

  it('uses the finished moon-sleep bed art in the catalog and room', () => {
    const bed = ITEM_BY_ID.get('bed-moon-headboard');

    expect(bed).toMatchObject({
      assetStatus: 'final',
      thumbnailKey: 'illustrated:furniture:bed-moon-sleep',
      roomAssetKey: 'illustrated:furniture:bed-moon-sleep',
    });
  });

  it('uses the finished firefly stand art in the catalog and room', () => {
    const lamp = ITEM_BY_ID.get('lighting-firefly-stand');

    expect(lamp).toMatchObject({
      assetStatus: 'final',
      thumbnailKey: 'illustrated:furniture:lighting-firefly-stand',
      roomAssetKey: 'illustrated:furniture:lighting-firefly-stand',
    });
  });

  it('uses the finished soft oval rug art in the catalog and room', () => {
    const rug = ITEM_BY_ID.get('rug-soft-oval');

    expect(rug).toMatchObject({
      assetStatus: 'final',
      thumbnailKey: 'illustrated:furniture:rug-soft-oval',
      roomAssetKey: 'illustrated:furniture:rug-soft-oval',
    });
  });

  it('uses the finished sunlight ribbon curtain art in the catalog and room', () => {
    const curtain = ITEM_BY_ID.get('curtain-ribbon-pair');

    expect(curtain).toMatchObject({
      assetStatus: 'final',
      thumbnailKey: 'illustrated:furniture:curtain-sunlight-ribbon',
      roomAssetKey: 'illustrated:furniture:curtain-sunlight-ribbon',
    });
  });

  it('uses the finished birthday memory table art in both catalog contexts', () => {
    const birthdayTable = ITEM_BY_ID.get('memory-dining-table-birthday-table');

    expect(birthdayTable).toMatchObject({
      assetStatus: 'final',
      thumbnailKey: 'illustrated:memory:birthday-table',
      roomAssetKey: 'illustrated:memory:birthday-table',
    });
    expect(getIllustratedAsset('illustrated:memory:birthday-table')).toMatchObject({
      kind: 'furniture',
      status: 'final',
    });
  });

  it('uses the finished picnic radio art in both catalog contexts', () => {
    const radio = ITEM_BY_ID.get('memory-radio-picnic-radio');

    expect(radio).toMatchObject({
      assetStatus: 'final',
      thumbnailKey: 'illustrated:memory:picnic-radio',
      roomAssetKey: 'illustrated:memory:picnic-radio',
    });
    expect(getIllustratedAsset('illustrated:memory:picnic-radio')).toMatchObject({
      kind: 'furniture',
      status: 'final',
    });
  });
});
