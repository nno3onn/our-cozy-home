export type RoomActor = {
  id: string;
  footY: number;
};

export function sortRoomActors<T extends RoomActor>(actors: readonly T[]): T[] {
  return [...actors].sort((left, right) => {
    const depthDifference = left.footY - right.footY;
    if (depthDifference !== 0) {
      return depthDifference;
    }
    return left.id.localeCompare(right.id);
  });
}
