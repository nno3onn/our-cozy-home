import { render } from '@testing-library/react-native';

import { FurnitureSprite } from '../FurnitureSprite';

describe('FurnitureSprite', () => {
  it('renders a structured miniature prop for an unfinished table instead of a colour block', async () => {
    const view = await render(<FurnitureSprite itemId="table-tulip-pedestal" />);

    expect(view.getByLabelText('튤립 찻상 미니어처 탁자')).toBeOnTheScreen();
  });

  it('uses a matching structured placeholder for each catalog object family', async () => {
    const cases = [
      ['curtain-cloud-valance', '커튼'],
      ['cushion-knot', '쿠션'],
      ['rug-wavy', '러그'],
      ['bed-log-bed', '침대'],
      ['lighting-mushroom-lamp', '조명'],
      ['plant-hanging-ivy', '식물'],
      ['snack-acorn-cookie', '간식'],
      ['memory-radio-night-radio', '라디오'],
      ['memory-frame-ribbon-frame', '액자'],
    ] as const;

    for (const [itemId, kind] of cases) {
      expect((await render(<FurnitureSprite itemId={itemId} />)).getByLabelText(new RegExp(`미니어처 ${kind}`))).toBeOnTheScreen();
    }
  });
});
