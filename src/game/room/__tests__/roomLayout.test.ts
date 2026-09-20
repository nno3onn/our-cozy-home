import { ROOM_SIZE } from '../constants';
import {
  getAnimalAnchors,
  getHitTarget,
  toViewport,
  type Rect,
} from '../roomLayout';

function intersects(left: Rect, right: Rect) {
  return !(
    left.x + left.width <= right.x ||
    right.x + right.width <= left.x ||
    left.y + left.height <= right.y ||
    right.y + right.height <= left.y
  );
}

describe('room layout', () => {
  it.each([1, 2, 3, 4] as const)(
    'provides %i explicit in-bounds animal anchors',
    (memberCount) => {
      const anchors = getAnimalAnchors(memberCount);

      expect(anchors).toHaveLength(memberCount);
      for (const anchor of anchors) {
        expect(anchor.foot.x).toBeGreaterThan(0);
        expect(anchor.foot.x).toBeLessThan(ROOM_SIZE.width);
        expect(anchor.foot.y).toBeGreaterThan(0);
        expect(anchor.foot.y).toBeLessThan(ROOM_SIZE.height);
      }
    },
  );

  it('centers the logical room while preserving its aspect ratio', () => {
    expect(toViewport({ x: 500, y: 500 }, { width: 320, height: 568 })).toEqual({
      x: 160,
      y: 284,
    });
  });

  it('keeps four accessible hit targets separate on a 320pt-wide screen', () => {
    const viewport = { width: 320, height: 568 };
    const targets = getAnimalAnchors(4).map((anchor) =>
      getHitTarget(anchor, viewport),
    );

    for (const target of targets) {
      expect(target.width).toBeGreaterThanOrEqual(44);
      expect(target.height).toBeGreaterThanOrEqual(44);
    }

    for (let left = 0; left < targets.length; left += 1) {
      for (let right = left + 1; right < targets.length; right += 1) {
        expect(intersects(targets[left], targets[right])).toBe(false);
      }
    }
  });

  it('places each name label in a dedicated band above its animal', () => {
    const anchors = getAnimalAnchors(4);

    expect(anchors.map((anchor) => anchor.labelBand)).toEqual([
      'upper-left',
      'upper-right',
      'lower-left',
      'lower-right',
    ]);
  });
});
