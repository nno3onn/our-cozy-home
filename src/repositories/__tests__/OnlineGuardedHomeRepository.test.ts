import { DomainError } from '@/domain/errors';
import type { HomeRepository } from '@/domain/repository';

import { OnlineGuardedHomeRepository } from '../OnlineGuardedHomeRepository';

function createRepository(): jest.Mocked<HomeRepository> {
  return {
    createHouse: jest.fn(),
    createInvite: jest.fn(),
    previewInvite: jest.fn().mockResolvedValue({}),
    acceptInvite: jest.fn(),
    leaveHouse: jest.fn(),
    claimAttendance: jest.fn(),
    listShopItems: jest.fn().mockResolvedValue([]),
    purchaseItem: jest.fn(),
    getPurchaseResult: jest.fn().mockResolvedValue(null),
    getHomeSnapshot: jest.fn().mockResolvedValue({}),
    performAnimalAction: jest.fn(),
    placeItem: jest.fn(),
    listMemories: jest.fn().mockResolvedValue([]),
    listArchivedMemories: jest.fn().mockResolvedValue([]),
    createMemoryDraft: jest.fn(),
    shareMemoryDraft: jest.fn(),
    addMemoryContribution: jest.fn(),
    getMemoryContributions: jest.fn().mockResolvedValue([]),
    uploadMemoryPhoto: jest.fn(),
    getOwnMemoryContribution: jest.fn(),
    listHabitLearning: jest.fn().mockResolvedValue([]),
  };
}

describe('OnlineGuardedHomeRepository', () => {
  it('allows stale-safe reads but rejects server-confirmed commands while offline', async () => {
    const repository = createRepository();
    const guarded = new OnlineGuardedHomeRepository(repository, { isOnline: () => false });

    await expect(guarded.getHomeSnapshot()).resolves.toEqual({});
    await expect(guarded.claimAttendance()).rejects.toEqual(new DomainError('network_unavailable', 'offline_read_only'));
    await expect(guarded.purchaseItem({ itemDefinitionId: 'rug-leaf', requestId: 'request-1' })).rejects.toEqual(new DomainError('network_unavailable', 'offline_read_only'));
    await expect(guarded.placeItem({ ownedItemId: 'owned-1', slotId: 'floor-accent-left', expectedVersion: 1 })).rejects.toEqual(new DomainError('network_unavailable', 'offline_read_only'));

    expect(repository.getHomeSnapshot).toHaveBeenCalledTimes(1);
    expect(repository.claimAttendance).not.toHaveBeenCalled();
    expect(repository.purchaseItem).not.toHaveBeenCalled();
    expect(repository.placeItem).not.toHaveBeenCalled();
  });
});
