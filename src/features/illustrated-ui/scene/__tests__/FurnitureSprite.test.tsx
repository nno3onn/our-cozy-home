import { render } from '@testing-library/react-native';

import { FurnitureSprite } from '../FurnitureSprite';

describe('FurnitureSprite', () => {
  it('renders finished catalog art with the product name', async () => {
    const view = await render(<FurnitureSprite itemId="table-clover-table" />);

    expect(view.getByLabelText('네잎 식탁')).toBeOnTheScreen();
  });

  it('keeps structured placeholders for the unfinished memory furniture families', async () => {
    const cases = [
      ['memory-dining-table-snow-table', '탁자'],
      ['memory-radio-cassette-radio', '라디오'],
      ['memory-frame-cloud-frame', '액자'],
    ] as const;

    for (const [itemId, kind] of cases) {
      expect((await render(<FurnitureSprite itemId={itemId} />)).getByLabelText(new RegExp(`미니어처 ${kind}`))).toBeOnTheScreen();
    }
  });
});
