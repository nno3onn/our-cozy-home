import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, userEvent, waitFor } from '@testing-library/react-native';

import { RepositoryProvider } from '@/repositories/RepositoryContext';
import { DemoRepository } from '@/repositories/demo/DemoRepository';

import { SettingsScreen } from '../SettingsScreen';

async function renderSettings(mode: 'demo' | 'supabase', repository = new DemoRepository()) {
  const client = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: Infinity },
      mutations: { retry: false, gcTime: Infinity },
    },
  });
  const view = await render(
    <QueryClientProvider client={client}>
      <RepositoryProvider repository={repository}>
        <SettingsScreen mode={mode} />
      </RepositoryProvider>
    </QueryClientProvider>,
  );
  return { repository, view };
}

describe('SettingsScreen', () => {
  it('confirms and resets demo progress', async () => {
    const repository = new DemoRepository();
    await repository.performAnimalAction('animal-tori', 'playing');
    const { view } = await renderSettings('demo', repository);
    const user = userEvent.setup();

    await user.press(view.getByRole('button', { name: '데모 데이터 초기화' }));
    expect(view.getByText('정말 처음으로 돌릴까요?')).toBeOnTheScreen();
    await user.press(view.getByRole('button', { name: '초기화 확인' }));

    await waitFor(async () => {
      expect((await repository.getHomeSnapshot()).animals[0].state).toBe('idle');
    });
  });

  it('does not leave a hidden reset action in Supabase mode', async () => {
    const { view } = await renderSettings('supabase');

    expect(view.queryByRole('button', { name: '데모 데이터 초기화' })).not.toBeOnTheScreen();
    expect(view.queryByRole('button', { name: '초기화 확인' })).not.toBeOnTheScreen();
  });
});
