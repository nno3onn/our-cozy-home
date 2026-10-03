import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, userEvent, waitFor } from '@testing-library/react-native';

import { RepositoryProvider } from '@/repositories/RepositoryContext';
import { DemoRepository } from '@/repositories/demo/DemoRepository';
import { DomainError } from '@/domain/errors';
import type { Animal, AnimalAction } from '@/domain/models';
import type { HomeRepository } from '@/domain/repository';
import { ConnectionProvider } from '@/network/ConnectionProvider';
import type { ConnectionState } from '@/network/connectionState';

import { HomeScreen } from '../HomeScreen';

class FailingSnackRepository extends DemoRepository {
  override async performAnimalAction(animalId: string, action: AnimalAction): Promise<Animal> {
    if (action === 'eating') throw new DomainError('unknown', 'animal_action_failed');
    return super.performAnimalAction(animalId, action);
  }
}

async function renderHome(options: { onOpenMemory?: jest.Mock; onOpenInvite?: jest.Mock; repository?: HomeRepository; connectionState?: ConnectionState } = {}) {
  const repository = options.repository ?? new DemoRepository();
  const client = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: Infinity },
      mutations: { retry: false, gcTime: Infinity },
    },
  });
  const view = await render(
    <QueryClientProvider client={client}>
      <ConnectionProvider state={options.connectionState}>
        <RepositoryProvider repository={repository}>
          <HomeScreen onOpenInvite={options.onOpenInvite} onOpenMemory={options.onOpenMemory ?? jest.fn()} onOpenSettings={jest.fn()} />
        </RepositoryProvider>
      </ConnectionProvider>
    </QueryClientProvider>,
  );
  return { repository, view };
}

describe('HomeScreen', () => {
  it('shows four clearly identified members and animals', async () => {
    const { view } = await renderHome();

    expect(await view.findByLabelText('우리집 식구 4 / 4명')).toBeOnTheScreen();
    for (const memberName of ['나래', '민준', '유빈', '하루']) {
      expect(view.getByText(memberName)).toBeOnTheScreen();
    }
    expect(view.getAllByRole('button', { name: /동물 선택$/ })).toHaveLength(4);
    expect(view.queryByText(/온라인|접속 중/)).not.toBeOnTheScreen();
  });

  it('keeps the room visible while an animal detail sheet opens from touch', async () => {
    const { view } = await renderHome();
    const user = userEvent.setup();
    await view.findByLabelText('우리집 식구 4 / 4명');

    await user.press(view.getByRole('button', { name: '토리 동물 선택' }));
    await waitFor(() => {
      expect(view.getByLabelText('토리 동물 상세')).toBeOnTheScreen();
    });
    expect(view.getByLabelText('네 동물이 함께 지내는 방')).toBeOnTheScreen();
    await user.press(view.getByRole('button', { name: '놀아주기' }));

    await waitFor(() => {
      expect(view.getByText('놀고 있어요')).toBeOnTheScreen();
    });
    await user.press(view.getByRole('button', { name: '동물 상세 닫기' }));
    expect(view.queryByLabelText('토리 동물 상세')).not.toBeOnTheScreen();
  });

  it('keeps the detail open and explains when an animal action cannot be saved', async () => {
    const { view } = await renderHome({ repository: new FailingSnackRepository() });
    const user = userEvent.setup();
    await view.findByLabelText('우리집 식구 4 / 4명');

    await user.press(view.getByRole('button', { name: '토리 동물 선택' }));
    await waitFor(() => expect(view.getByRole('button', { name: '간식 주기' })).toBeEnabled());
    await user.press(view.getByRole('button', { name: '간식 주기' }));

    expect(await view.findByText('행동을 저장하지 못했어요. 다시 시도해 주세요.')).toBeOnTheScreen();
    expect(view.getByLabelText('토리 동물 상세')).toBeOnTheScreen();
  });

  it('opens the memory detail from its room furniture', async () => {
    const onOpenMemory = jest.fn();
    const { view } = await renderHome({ onOpenMemory });

    const furniture = await view.findByRole('button', { name: '소풍 라디오 추억 열기' });
    fireEvent.press(furniture);
    expect(onOpenMemory).toHaveBeenCalledWith('memory-river-picnic');
  });

  it('keeps the latest room visible but disables server-confirmed actions offline', async () => {
    const repository = new DemoRepository();
    const offlineState: ConnectionState = { isOnline: () => false, subscribe: () => () => undefined };
    const { view } = await renderHome({ repository, connectionState: offlineState });

    expect(await view.findByText('오프라인 읽기 전용')).toBeOnTheScreen();
    expect(view.getByLabelText('네 동물이 함께 지내는 방')).toBeOnTheScreen();
    await userEvent.setup().press(view.getByRole('button', { name: '토리 동물 선택' }));
    expect(view.getByRole('button', { name: '간식 주기' })).toBeDisabled();
  });

  it('guides an onboarded user without a house to the creation flow', async () => {
    const repository: HomeRepository = {
      createHouse: jest.fn(),
      createInvite: jest.fn(),
      cancelInvite: jest.fn(),
      previewInvite: jest.fn(),
      acceptInvite: jest.fn(),
      leaveHouse: jest.fn(),
      claimAttendance: jest.fn(),
      requestAccountDeletion: jest.fn(),
      listShopItems: jest.fn().mockResolvedValue([]),
      purchaseItem: jest.fn(),
      getPurchaseResult: jest.fn(),
      getHomeSnapshot: jest.fn().mockRejectedValue(new DomainError('not_found', 'active_house_not_found')),
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
      reviseMemoryContribution: jest.fn(),
      deleteMemoryContribution: jest.fn(),
      listHabitLearning: jest.fn().mockResolvedValue([]),
    };
    const onCreateHouse = jest.fn();
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const view = await render(
      <QueryClientProvider client={client}>
        <RepositoryProvider repository={repository}>
          <HomeScreen onCreateHouse={onCreateHouse} onOpenMemory={jest.fn()} onOpenSettings={jest.fn()} />
        </RepositoryProvider>
      </QueryClientProvider>,
    );

    expect(await view.findByText('아직 우리집이 없어요')).toBeOnTheScreen();
    await userEvent.setup().press(view.getByRole('button', { name: '새 집 만들기' }));
    expect(onCreateHouse).toHaveBeenCalledTimes(1);
  });
});
