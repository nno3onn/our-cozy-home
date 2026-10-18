import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, fireEvent, render, waitFor } from '@testing-library/react-native';
import { Pressable, Text } from 'react-native';

import { PrivateScopeContext } from '@/auth/PrivateScopeContext';
import type { PrivateDataScope } from '@/auth/PrivateDataScope';
import { RepositoryProvider } from '@/repositories/RepositoryContext';
import { DemoRepository } from '@/repositories/demo/DemoRepository';
import { useCreateHouse } from '../useCreateHouse';

function CreateButton({ onDone }: { onDone: () => void }) {
  const create = useCreateHouse();
  return <Pressable accessibilityRole="button" onPress={() => void create.mutateAsync({ name: '새 집', requestId: 'create-once' }).then(onDone)}><Text>집 만들기</Text></Pressable>;
}

it.each([true, false])('invalidates only the active client after house creation (private scope: %s)', async scoped => {
  const repository = new DemoRepository();
  jest.spyOn(repository, 'createHouse').mockResolvedValue({ houseId: 'new-house' } as never);
  const client = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
  const invalidate = jest.spyOn(client, 'invalidateQueries');
  const onDone = jest.fn();
  const content = <QueryClientProvider client={client}><RepositoryProvider repository={repository}><CreateButton onDone={onDone} /></RepositoryProvider></QueryClientProvider>;
  const view = await render(scoped ? <PrivateScopeContext.Provider value={{} as PrivateDataScope}>{content}</PrivateScopeContext.Provider> : content);
  await act(async () => { fireEvent.press(view.getByRole('button', { name: '집 만들기' })); });
  await waitFor(() => expect(onDone).toHaveBeenCalledTimes(1));
  expect(invalidate).toHaveBeenCalledTimes(scoped ? 0 : 1);
  client.clear();
  await view.unmount();
});
