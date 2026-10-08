import { render } from '@testing-library/react-native';
import * as ReactNative from 'react-native';

import { ITEM_CATALOG } from '@/catalog/items';

import { AssetGalleryScreen } from '../AssetGalleryScreen';

describe('AssetGalleryScreen', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('shows all shop and memory assets with honest status labels', async () => {
    jest.spyOn(ReactNative, 'useWindowDimensions').mockReturnValue({ fontScale: 1, height: 720, scale: 1, width: 1280 });
    const view = await render(<AssetGalleryScreen enabled />);
    const finalCount = ITEM_CATALOG.filter((item) => item.assetStatus === 'final').length;
    const placeholderCount = ITEM_CATALOG.length - finalCount;

    expect(view.getByText('상점 40 · 추억 15')).toBeOnTheScreen();
    expect(view.getByRole('header', { name: '에셋 목록' })).toBeOnTheScreen();
    expect(view.getByTestId('asset-gallery-grid-4')).toBeOnTheScreen();
    expect(view.queryAllByText('임시 에셋')).toHaveLength(placeholderCount);
    expect(view.getAllByText('완성 일러스트')).toHaveLength(finalCount);
    expect(view.getAllByLabelText('완성 에셋')).toHaveLength(finalCount);
    expect(view.getByText('55종 모두 상점·보관함·방에서 함께 사용하는 완성 일러스트예요.')).toBeOnTheScreen();
    expect(view.getByText('복숭아 조개 쿠션')).toBeOnTheScreen();
    expect(view.getByText('소풍 라디오')).toBeOnTheScreen();
  });

  it('uses a single-column gallery on a narrow phone without duplicating navigation', async () => {
    jest.spyOn(ReactNative, 'useWindowDimensions').mockReturnValue({ fontScale: 1, height: 844, scale: 1, width: 390 });

    const view = await render(<AssetGalleryScreen enabled />);

    expect(view.getByTestId('asset-gallery-grid-1')).toBeOnTheScreen();
    expect(view.getAllByLabelText('이전 화면으로 돌아가기')).toHaveLength(1);
  });

  it('does not expose the gallery outside demo or development mode', async () => {
    const view = await render(<AssetGalleryScreen enabled={false} />);

    expect(view.getByText('개발용 화면이에요')).toBeOnTheScreen();
    expect(view.queryByText('복숭아 조개 쿠션')).not.toBeOnTheScreen();
  });
});
