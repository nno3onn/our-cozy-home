import { ANIMAL_HIT_TARGET, ROOM_SIZE } from './constants';

export type Point = { x: number; y: number };
export type Viewport = { width: number; height: number };
export type Rect = Point & { width: number; height: number };

export type AnimalAnchor = {
  foot: Point;
  labelBand: 'center' | 'left' | 'right' | 'upper-left' | 'upper-right' | 'lower-left' | 'lower-right';
};

const anchorPresets: Record<1 | 2 | 3 | 4, AnimalAnchor[]> = {
  1: [{ foot: { x: 500, y: 720 }, labelBand: 'center' }],
  2: [
    { foot: { x: 330, y: 720 }, labelBand: 'left' },
    { foot: { x: 670, y: 720 }, labelBand: 'right' },
  ],
  3: [
    { foot: { x: 300, y: 610 }, labelBand: 'upper-left' },
    { foot: { x: 700, y: 610 }, labelBand: 'upper-right' },
    { foot: { x: 500, y: 820 }, labelBand: 'center' },
  ],
  4: [
    { foot: { x: 300, y: 590 }, labelBand: 'upper-left' },
    { foot: { x: 700, y: 590 }, labelBand: 'upper-right' },
    { foot: { x: 300, y: 820 }, labelBand: 'lower-left' },
    { foot: { x: 700, y: 820 }, labelBand: 'lower-right' },
  ],
};

export function getAnimalAnchors(memberCount: 1 | 2 | 3 | 4): AnimalAnchor[] {
  return anchorPresets[memberCount].map((anchor) => ({
    ...anchor,
    foot: { ...anchor.foot },
  }));
}

function getViewportTransform(viewport: Viewport) {
  const scale = Math.min(
    viewport.width / ROOM_SIZE.width,
    viewport.height / ROOM_SIZE.height,
  );

  return {
    scale,
    offsetX: (viewport.width - ROOM_SIZE.width * scale) / 2,
    offsetY: (viewport.height - ROOM_SIZE.height * scale) / 2,
  };
}

export function toViewport(point: Point, viewport: Viewport): Point {
  const transform = getViewportTransform(viewport);
  return {
    x: transform.offsetX + point.x * transform.scale,
    y: transform.offsetY + point.y * transform.scale,
  };
}

export function getHitTarget(anchor: AnimalAnchor, viewport: Viewport): Rect {
  const foot = toViewport(anchor.foot, viewport);
  return {
    x: foot.x - ANIMAL_HIT_TARGET.width / 2,
    y: foot.y - ANIMAL_HIT_TARGET.height,
    width: ANIMAL_HIT_TARGET.width,
    height: ANIMAL_HIT_TARGET.height,
  };
}
