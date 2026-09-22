import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, userEvent, waitFor } from '@testing-library/react-native';

import { RepositoryProvider } from '@/repositories/RepositoryContext';
import { DemoRepository } from '@/repositories/demo/DemoRepository';
import { DomainError } from '@/domain/errors';
import type { HomeRepository } from '@/domain/repository';

import { HomeScreen } from '../HomeScreen';

async function renderHome(onOpenMemory = jest.fn()) {
  const repository = new DemoRepository();
  const client = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: Infinity },
      mutations: { retry: false, gcTime: Infinity },
    },
  });
  const view = await render(
    <QueryClientProvider client={client}>
      <RepositoryProvider repository={repository}>
        <HomeScreen onOpenMemory={onOpenMemory} onOpenSettings={jest.fn()} />
      </RepositoryProvider>
    </QueryClientProvider>,
  );
  return { repository, view };
}

describe('HomeScreen', () => {
  it('shows four clearly identified members and animals', async () => {
    const { view } = await renderHome();

    expect(await view.findByText('4/4')).toBeOnTheScreen();
    for (const memberName of ['나래', '민준', '유빈', '하루']) {
      expect(view.getByText(memberName)).toBeOnTheScreen();
    }
    expect(view.getAllByRole('button', { name: /동물 선택$/ })).toHaveLength(4);
    expect(view.queryByText(/온라인|접속 중/)).not.toBeOnTheScreen();
  });

  it('uses the same action controls after an animal is selected by touch', async () => {
    const { view } = await renderHome();
    const user = userEvent.setup();
    await view.findByText('4/4');

    await user.press(view.getByRole('button', { name: '토리 동물 선택' }));
    await waitFor(() => {
      expect(view.getByText('토리 · 반가워하고 있어요')).toBeOnTheScreen();
    });
    await user.press(view.getByRole('button', { name: '놀기' }));

    await waitFor(() => {
      expect(view.getByText('토리 · 놀고 있어요')).toBeOnTheScreen();
    });
    expect(view.getByRole('button', { name: '먹기' })).toBeOnTheScreen();
    expect(view.getByRole('button', { name: '쉬기' })).toBeOnTheScreen();
  });

  it('opens the memory detail from its room furniture', async () => {
    const onOpenMemory = jest.fn();
    const { view } = await renderHome(onOpenMemory);

    const furniture = await view.findByRole('button', { name: '소풍 라디오 추억 열기' });
    fireEvent.press(furniture);
    expect(onOpenMemory).toHaveBeenCalledWith('memory-river-picnic');
  });

  it('guides an onboarded user without a house to the creation flow', async () => {
    const repository: HomeRepository = {
      createHouse: jest.fn(),
      getHomeSnapshot: jest.fn().mockRejectedValue(new DomainError('not_found', 'active_house_not_found')),
      performAnimalAction: jest.fn(),
      placeItem: jest.fn(),
      listMemories: jest.fn().mockResolvedValue([]),
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
