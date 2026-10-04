import { render } from '@testing-library/react-native';

import { FurnitureSprite } from '../FurnitureSprite';

describe('FurnitureSprite', () => {
  it('renders a structured miniature prop for an unfinished table instead of a colour block', async () => {
    const view = await render(<FurnitureSprite itemId="table-cloud-low" />);

    expect(view.getByLabelText('구름 낮은 탁자 미니어처 탁자')).toBeOnTheScreen();
  });

  it('uses a matching structured placeholder for each catalog object family', async () => {
    const cases = [
      ['curtain-leaf-panels', '커튼'],
      ['cushion-star', '쿠션'],
      ['rug-daisy', '러그'],
      ['bed-cloud-nest', '침대'],
      ['lighting-cloud-pendant', '조명'],
      ['plant-cactus-trio', '식물'],
      ['snack-acorn-cookie', '간식'],
      ['memory-radio-night-radio', '라디오'],
      ['memory-frame-leaf-frame', '액자'],
    ] as const;

    for (const [itemId, kind] of cases) {
      expect((await render(<FurnitureSprite itemId={itemId} />)).getByLabelText(new RegExp(`미니어처 ${kind}`))).toBeOnTheScreen();
    }
  });
});
