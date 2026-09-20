import { render } from '@testing-library/react-native';

import { AssetGalleryScreen } from '../AssetGalleryScreen';

describe('AssetGalleryScreen', () => {
  it('shows all shop and memory placeholders with honest status labels', async () => {
    const view = await render(<AssetGalleryScreen enabled />);

    expect(view.getByText('상점 40 · 추억 15')).toBeOnTheScreen();
    expect(view.getAllByText('임시 에셋')).toHaveLength(55);
    expect(view.getByText('복숭아 조개 쿠션')).toBeOnTheScreen();
    expect(view.getByText('소풍 라디오')).toBeOnTheScreen();
  });

  it('does not expose the gallery outside demo or development mode', async () => {
    const view = await render(<AssetGalleryScreen enabled={false} />);

    expect(view.getByText('개발용 화면이에요')).toBeOnTheScreen();
    expect(view.queryByText('복숭아 조개 쿠션')).not.toBeOnTheScreen();
  });
});
