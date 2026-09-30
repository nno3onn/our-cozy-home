import { ROOM_SIZE } from '../constants';
import {
  getAnimalAnchors,
  getAnimalHitTargets,
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
    const targets = getAnimalHitTargets(4, viewport);

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

  it('derives a press target for every anchor at desktop size', () => {
    const targets = getAnimalHitTargets(4, { width: 1280, height: 760 });

    expect(targets).toHaveLength(4);
    expect(targets.every((target) => target.width >= 44 && target.height >= 44)).toBe(true);
  });

  it('keeps four touch targets separate at tablet width', () => {
    const targets = getAnimalHitTargets(4, { width: 768, height: 1024 });

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
