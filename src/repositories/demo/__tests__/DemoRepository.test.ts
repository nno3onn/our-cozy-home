import { DemoRepository } from '../DemoRepository';

describe('DemoRepository', () => {
  it('starts with four distinct members and allows repeated animal species', async () => {
    const repository = new DemoRepository();
    const snapshot = await repository.getHomeSnapshot();

    expect(snapshot.members).toHaveLength(4);
    expect(new Set(snapshot.members.map((member) => member.id)).size).toBe(4);
    expect(new Set(snapshot.members.map((member) => member.pointColor)).size).toBe(4);
    expect(snapshot.animals.filter((animal) => animal.species === 'rabbit')).toHaveLength(2);
  });

  it('updates only the animal that receives an action', async () => {
    const repository = new DemoRepository();
    const before = await repository.getHomeSnapshot();

    await repository.performAnimalAction('animal-tori', 'playing');
    const after = await repository.getHomeSnapshot();

    expect(after.animals.find((animal) => animal.id === 'animal-tori')?.state).toBe(
      'playing',
    );
    expect(
      after.animals
        .filter((animal) => animal.id !== 'animal-tori')
        .map((animal) => animal.state),
    ).toEqual(
      before.animals
        .filter((animal) => animal.id !== 'animal-tori')
        .map((animal) => animal.state),
    );
  });

  it('moves an owned item into a compatible fixed slot and increments its version', async () => {
    const repository = new DemoRepository();

    const placed = await repository.placeItem({
      ownedItemId: 'owned-mint-cushion',
      slotId: 'floor-accent-left',
      expectedVersion: 1,
    });

    expect(placed).toEqual({
      id: 'placement-floor-accent-left',
      ownedItemId: 'owned-mint-cushion',
      slotId: 'floor-accent-left',
      version: 2,
    });
  });

  it('returns snapshots that cannot mutate repository state', async () => {
    const repository = new DemoRepository();
    const snapshot = await repository.getHomeSnapshot();
    snapshot.house.name = '바뀐 이름';
    snapshot.members[0].displayName = '몰래 바꿈';

    const fresh = await repository.getHomeSnapshot();

    expect(fresh.house.name).toBe('도란도란 우리집');
    expect(fresh.members[0].displayName).toBe('나래');
  });

  it('restores the original demo state after reset', async () => {
    const repository = new DemoRepository();
    await repository.performAnimalAction('animal-tori', 'eating');

    await repository.resetDemo();

    const snapshot = await repository.getHomeSnapshot();
    expect(snapshot.animals.find((animal) => animal.id === 'animal-tori')?.state).toBe(
      'idle',
    );
  });

  it('purchases a catalog item once per request key and keeps ownership personal', async () => {
    const repository = new DemoRepository();
    const first = await repository.purchaseItem({ itemDefinitionId: 'cushion-shell', requestId: 'purchase-1' });
    const retried = await repository.purchaseItem({ itemDefinitionId: 'cushion-shell', requestId: 'purchase-1' });

    expect(first).toMatchObject({ result: 'purchased', balance: 1100, quantity: 1 });
    expect(retried).toEqual(first);
    const snapshot = await repository.getHomeSnapshot();
    expect(snapshot.ownedItems.filter((item) => item.itemDefinitionId === 'cushion-shell' && item.ownerId === 'user-narae')).toHaveLength(1);
  });
});
