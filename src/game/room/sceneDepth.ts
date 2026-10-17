// All room siblings use screen foot positions, including mobile companion emphasis.
// Flat wall/floor decoration stays behind objects irrespective of its bottom edge.
export const ROOM_CONTROLS_DEPTH = 100_000;

export function getRoomActorDepth(screenFootY: number): number {
  return 100 + Math.round(screenFootY * 10);
}

export function getRoomItemDepth(slotId: string, screenFootY: number): number {
  if (slotId === 'window' || slotId === 'floor-rug' || slotId === 'memory-wall') return 1;
  return getRoomActorDepth(screenFootY);
}
