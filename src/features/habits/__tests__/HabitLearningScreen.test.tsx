import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render } from '@testing-library/react-native';

import { RepositoryProvider } from '@/repositories/RepositoryContext';
import { DemoRepository } from '@/repositories/demo/DemoRepository';

import { HabitLearningScreen } from '../HabitLearningScreen';

describe('HabitLearningScreen', () => {
  it('identifies the learner and teacher and exposes three-day progress', async () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity } } });
    const view = await render(
      <QueryClientProvider client={client}>
        <RepositoryProvider repository={new DemoRepository()}>
          <HabitLearningScreen />
        </RepositoryProvider>
      </QueryClientProvider>,
    );

    expect(await view.findByText('토리가 두부에게 배우는 중')).toBeOnTheScreen();
    expect(view.getByText('서로 다른 날짜 2/3')).toBeOnTheScreen();
    expect(view.getByRole('progressbar', { name: '빙글빙글 춤 학습 진행' })).toHaveAccessibilityValue({
      max: 3,
      min: 0,
      now: 2,
    });
    expect(view.getByText('보리가 토리에게 배웠어요')).toBeOnTheScreen();
  });
});
