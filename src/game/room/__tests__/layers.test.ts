import { sortRoomActors } from '../layers';

describe('room actor layering', () => {
  it('draws actors with lower foot points later', () => {
    const sorted = sortRoomActors([
      { id: 'front', footY: 820 },
      { id: 'back', footY: 520 },
      { id: 'middle', footY: 680 },
    ]);

    expect(sorted.map((actor) => actor.id)).toEqual(['back', 'middle', 'front']);
  });

  it('uses stable IDs when two actors share a foot point', () => {
    const sorted = sortRoomActors([
      { id: 'rabbit-b', footY: 700 },
      { id: 'rabbit-a', footY: 700 },
    ]);

    expect(sorted.map((actor) => actor.id)).toEqual(['rabbit-a', 'rabbit-b']);
  });

  it('does not mutate the source actor order', () => {
    const actors = [
      { id: 'front', footY: 820 },
      { id: 'back', footY: 520 },
    ];

    sortRoomActors(actors);

    expect(actors.map((actor) => actor.id)).toEqual(['front', 'back']);
  });
});
