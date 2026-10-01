import { ITEM_BY_ID } from '@/catalog/items';

import { getIllustratedAsset } from '../assetManifest';

describe('illustrated asset manifest', () => {
  it('resolves the pilot room, animals, and furniture assets', () => {
    expect(getIllustratedAsset('illustrated:room:sunny')).toMatchObject({ status: 'final' });
    expect(getIllustratedAsset('illustrated:animal:rabbit')).toMatchObject({ status: 'final' });
    expect(getIllustratedAsset('illustrated:animal:cat')).toMatchObject({ status: 'final' });
    expect(getIllustratedAsset('illustrated:animal:bear')).toMatchObject({ status: 'final' });
    expect(getIllustratedAsset('illustrated:animal:dog')).toMatchObject({ status: 'final' });
    expect(getIllustratedAsset('illustrated:furniture:cushion-shell')).toMatchObject({ status: 'final' });
    expect(getIllustratedAsset('illustrated:furniture:table-cookie')).toMatchObject({ status: 'final' });
    expect(getIllustratedAsset('illustrated:furniture:plant-rubber-tree')).toMatchObject({ status: 'final' });
  });

  it('provides a thumbnail fallback for every catalog item', () => {
    expect(ITEM_BY_ID.size).toBeGreaterThan(0);
    for (const item of ITEM_BY_ID.values()) {
      expect(getIllustratedAsset(item.thumbnailKey) ?? getIllustratedAsset('illustrated:placeholder:item')).toBeDefined();
    }
  });

  it('keeps the pilot cushion thumbnail and room asset on one shared art key', () => {
    const cushion = ITEM_BY_ID.get('cushion-shell');

    expect(cushion?.thumbnailKey).toBe('illustrated:furniture:cushion-shell');
    expect(cushion?.roomAssetKey).toBe(cushion?.thumbnailKey);
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
});
