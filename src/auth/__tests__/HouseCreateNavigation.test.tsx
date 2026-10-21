import { fireEvent, render, waitFor } from '@testing-library/react-native';
import { router } from 'expo-router';

import HouseCreateRoute from '../../../app/house/create';

jest.mock('expo-router', () => ({ router: { replace: jest.fn() } }));
jest.mock('@/features/house/hooks/useCreateHouse', () => ({
  useCreateHouse: () => ({ mutateAsync: jest.fn() }),
}));
jest.mock('@/features/house/screens/HouseCreateScreen', () => ({
  HouseCreateScreen: ({ onCreated }: { onCreated: () => void }) => {
    const { Button } = jest.requireActual<typeof import('react-native')>('react-native');
    return <Button title="complete house creation" onPress={onCreated} />;
  },
}));

it('navigates after the private scope replacement has left the current commit', async () => {
  const view = await render(<HouseCreateRoute />);
  fireEvent.press(view.getByText('complete house creation'));
  expect(router.replace).not.toHaveBeenCalled();
  await waitFor(() => expect(router.replace).toHaveBeenCalledWith('/'));
  await view.unmount();
});
