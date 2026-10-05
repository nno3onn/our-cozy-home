import { render } from '@testing-library/react-native';

import { FurnitureSprite } from '../FurnitureSprite';

describe('FurnitureSprite', () => {
  it('renders finished catalog art with the product name', async () => {
    const view = await render(<FurnitureSprite itemId="table-clover-table" />);

    expect(view.getByLabelText('네잎 식탁')).toBeOnTheScreen();
  });

  it('renders the completed memory furniture with each product name', async () => {
    const cases = [
      ['memory-dining-table-snow-table', '눈꽃 식탁'],
      ['memory-radio-cassette-radio', '카세트 라디오'],
      ['memory-radio-shell-radio', '조개 라디오'],
      ['memory-frame-cloud-frame', '구름 액자'],
      ['memory-frame-star-frame', '별 액자'],
      ['memory-frame-stamp-frame', '우표 액자'],
    ] as const;

    for (const [itemId, name] of cases) {
      expect((await render(<FurnitureSprite itemId={itemId} />)).getByLabelText(name)).toBeOnTheScreen();
    }
  });
});
