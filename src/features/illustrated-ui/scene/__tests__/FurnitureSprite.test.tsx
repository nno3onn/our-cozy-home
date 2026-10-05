import { render } from '@testing-library/react-native';

import { FurnitureSprite } from '../FurnitureSprite';

describe('FurnitureSprite', () => {
  it('renders a structured miniature prop for an unfinished table instead of a colour block', async () => {
    const view = await render(<FurnitureSprite itemId="table-clover-table" />);

    expect(view.getByLabelText('네잎 식탁 미니어처 탁자')).toBeOnTheScreen();
  });

  it('uses a matching structured placeholder for each catalog object family', async () => {
    const cases = [
      ['curtain-cafe-check', '커튼'],
      ['cushion-petal', '쿠션'],
      ['rug-forest-path', '러그'],
      ['bed-bookcase-bed', '침대'],
      ['lighting-tulip-lamp', '조명'],
      ['plant-mini-palm', '식물'],
      ['snack-milk-jelly', '간식'],
      ['memory-radio-cassette-radio', '라디오'],
      ['memory-frame-cloud-frame', '액자'],
    ] as const;

    for (const [itemId, kind] of cases) {
      expect((await render(<FurnitureSprite itemId={itemId} />)).getByLabelText(new RegExp(`미니어처 ${kind}`))).toBeOnTheScreen();
    }
  });
});
