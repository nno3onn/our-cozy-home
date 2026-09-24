import { DomainError } from '@/domain/errors';
import type { HomeRepository } from '@/domain/repository';

type OnlineState = { isOnline(): boolean };

export class OnlineGuardedHomeRepository implements HomeRepository {
  constructor(
    private readonly repository: HomeRepository,
    private readonly onlineState: OnlineState,
  ) {}

  private assertOnline(): void {
    if (!this.onlineState.isOnline()) {
      throw new DomainError('network_unavailable', 'offline_read_only');
    }
  }

  private runCommand<T>(command: () => Promise<T>): Promise<T> {
    try {
      this.assertOnline();
      return command();
    } catch (error) {
      return Promise.reject(error);
    }
  }

  createHouse(input: Parameters<HomeRepository['createHouse']>[0]) { return this.runCommand(() => this.repository.createHouse(input)); }
  createInvite(reissue: Parameters<HomeRepository['createInvite']>[0]) { return this.runCommand(() => this.repository.createInvite(reissue)); }
  previewInvite(token: Parameters<HomeRepository['previewInvite']>[0]) { return this.repository.previewInvite(token); }
  acceptInvite(input: Parameters<HomeRepository['acceptInvite']>[0]) { return this.runCommand(() => this.repository.acceptInvite(input)); }
  leaveHouse() { return this.runCommand(() => this.repository.leaveHouse()); }
  claimAttendance() { return this.runCommand(() => this.repository.claimAttendance()); }
  listShopItems() { return this.repository.listShopItems(); }
  purchaseItem(input: Parameters<HomeRepository['purchaseItem']>[0]) { return this.runCommand(() => this.repository.purchaseItem(input)); }
  getPurchaseResult(requestId: Parameters<HomeRepository['getPurchaseResult']>[0]) { return this.repository.getPurchaseResult(requestId); }
  getHomeSnapshot() { return this.repository.getHomeSnapshot(); }
  performAnimalAction(...args: Parameters<HomeRepository['performAnimalAction']>) { return this.runCommand(() => this.repository.performAnimalAction(...args)); }
  placeItem(input: Parameters<HomeRepository['placeItem']>[0]) { return this.runCommand(() => this.repository.placeItem(input)); }
  listMemories() { return this.repository.listMemories(); }
  listHabitLearning() { return this.repository.listHabitLearning(); }
}
