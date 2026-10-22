import { act, fireEvent, render, waitFor } from '@testing-library/react-native';
import { router } from 'expo-router';

import HouseCreateRoute from '../../../app/house/create';

jest.mock('expo-router', () => ({ router: { replace: jest.fn() } }));
let mockScopePhase: 'checking' | 'active' | null = null;
jest.mock('@/auth/PrivateScopeContext', () => ({
  usePrivateScopeState: () => mockScopePhase ? { phase: mockScopePhase } : null,
}));
jest.mock('@/features/house/hooks/useCreateHouse', () => ({
  useCreateHouse: () => ({ mutateAsync: jest.fn() }),
}));
jest.mock('@/features/house/screens/HouseCreateScreen', () => ({
  HouseCreateScreen: ({ onCreated }: { onCreated: () => void }) => {
    const { Button } = jest.requireActual<typeof import('react-native')>('react-native');
    return <Button title="complete house creation" onPress={onCreated} />;
  },
}));

beforeEach(() => { jest.clearAllMocks(); mockScopePhase = null; });

it('navigates after the private scope replacement has left the current commit', async () => {
  mockScopePhase = null;
  const view = await render(<HouseCreateRoute />);
  await act(async () => { fireEvent.press(view.getByText('complete house creation')); });
  expect(router.replace).not.toHaveBeenCalled();
  await waitFor(() => expect(router.replace).toHaveBeenCalledWith('/'));
  await view.unmount();
});

it('waits for an authoritative first-house snapshot before navigating', async () => {
  mockScopePhase = 'checking';
  const view = await render(<HouseCreateRoute />);
  await act(async () => { fireEvent.press(view.getByText('complete house creation')); });
  await act(async () => { await new Promise(resolve => setTimeout(resolve, 20)); });
  expect(router.replace).not.toHaveBeenCalled();
  mockScopePhase = 'active';
  await view.rerender(<HouseCreateRoute />);
  await waitFor(() => expect(router.replace).toHaveBeenCalledWith('/'));
  await view.unmount();
  mockScopePhase = null;
});
