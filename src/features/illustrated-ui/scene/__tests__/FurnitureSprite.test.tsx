import { render } from '@testing-library/react-native';

import { FurnitureSprite } from '../FurnitureSprite';

describe('FurnitureSprite', () => {
  it('renders a structured miniature prop for an unfinished table instead of a colour block', async () => {
    const view = await render(<FurnitureSprite itemId="table-shelf-table" />);

    expect(view.getByLabelText('책장 겸용 탁자 미니어처 탁자')).toBeOnTheScreen();
  });

  it('uses a matching structured placeholder for each catalog object family', async () => {
    const cases = [
      ['curtain-star-drape', '커튼'],
      ['cushion-cloud', '쿠션'],
      ['rug-picnic-check', '러그'],
      ['bed-berry-canopy', '침대'],
      ['lighting-constellation', '조명'],
      ['plant-flower-pot', '식물'],
      ['snack-fish-cloud', '간식'],
      ['memory-radio-forest-radio', '라디오'],
      ['memory-frame-cloud-frame', '액자'],
    ] as const;

    for (const [itemId, kind] of cases) {
      expect((await render(<FurnitureSprite itemId={itemId} />)).getByLabelText(new RegExp(`미니어처 ${kind}`))).toBeOnTheScreen();
    }
  });
});
