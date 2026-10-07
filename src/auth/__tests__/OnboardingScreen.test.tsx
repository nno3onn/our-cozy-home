import { render, userEvent } from '@testing-library/react-native';

import OnboardingScreen from '../../../app/onboarding';

const mockCompleteOnboarding = jest.fn();

jest.mock('@/auth/AuthProvider', () => ({
  useAuth: () => ({ completeOnboarding: mockCompleteOnboarding }),
}));

jest.mock('expo-router', () => ({
  router: { replace: jest.fn() },
  useRouter: () => ({ back: jest.fn(), canGoBack: () => false, replace: jest.fn() }),
}));

describe('onboarding screen', () => {
  beforeEach(() => mockCompleteOnboarding.mockReset());

  it('explains the point color and exposes the selected animal', async () => {
    const view = await render(<OnboardingScreen />);

    expect(view.getByText('이름표와 내 가구를 구별하는 색이에요.')).toBeOnTheScreen();
    expect(view.getByRole('button', { name: '토끼' })).toHaveProp('accessibilityState', { disabled: false, selected: true });
  });

  it('keeps input after validation fails', async () => {
    const view = await render(<OnboardingScreen />);
    const user = userEvent.setup();

    await user.type(view.getByLabelText('내 이름'), '다온');
    await user.press(view.getByRole('button', { name: '완료' }));

    expect(view.getByRole('alert')).toBeOnTheScreen();
    expect(view.getByDisplayValue('다온')).toBeOnTheScreen();
  });

  it('keeps completed input after the server rejects onboarding', async () => {
    mockCompleteOnboarding.mockResolvedValue('프로필을 저장하지 못했어요.');
    const view = await render(<OnboardingScreen />);
    const user = userEvent.setup();

    await user.type(view.getByLabelText('내 이름'), '다온');
    await user.type(view.getByLabelText('동물 이름'), '마루');
    await user.press(view.getByRole('button', { name: '완료' }));

    expect(await view.findByText('프로필을 저장하지 못했어요.')).toBeOnTheScreen();
    expect(view.getByDisplayValue('다온')).toBeOnTheScreen();
    expect(view.getByDisplayValue('마루')).toBeOnTheScreen();
  });
});
