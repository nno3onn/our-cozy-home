import { render } from '@testing-library/react-native';

import { ITEM_CATALOG } from '@/catalog/items';

import { AssetGalleryScreen } from '../AssetGalleryScreen';

describe('AssetGalleryScreen', () => {
  it('shows all shop and memory assets with honest status labels', async () => {
    const view = await render(<AssetGalleryScreen enabled />);
    const finalCount = ITEM_CATALOG.filter((item) => item.assetStatus === 'final').length;
    const placeholderCount = ITEM_CATALOG.length - finalCount;

    expect(view.getByText('상점 40 · 추억 15')).toBeOnTheScreen();
    expect(view.getAllByText('임시 에셋')).toHaveLength(placeholderCount);
    expect(view.getAllByText('완성 일러스트')).toHaveLength(finalCount);
    expect(view.getByText('복숭아 조개 쿠션')).toBeOnTheScreen();
    expect(view.getByText('소풍 라디오')).toBeOnTheScreen();
  });

  it('does not expose the gallery outside demo or development mode', async () => {
    const view = await render(<AssetGalleryScreen enabled={false} />);

    expect(view.getByText('개발용 화면이에요')).toBeOnTheScreen();
    expect(view.queryByText('복숭아 조개 쿠션')).not.toBeOnTheScreen();
  });
});
