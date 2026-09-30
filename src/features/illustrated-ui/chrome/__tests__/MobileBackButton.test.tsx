import { fireEvent, render } from '@testing-library/react-native';

import { MobileBackButton } from '../MobileBackButton';

const mockBack = jest.fn();
const mockReplace = jest.fn();
const mockCanGoBack = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({ back: mockBack, canGoBack: mockCanGoBack, replace: mockReplace }),
}));

describe('MobileBackButton', () => {
  beforeEach(() => {
    mockBack.mockReset();
    mockReplace.mockReset();
    mockCanGoBack.mockReset();
  });

  it('returns to the previous screen when history is available', async () => {
    mockCanGoBack.mockReturnValue(true);
    const view = await render(<MobileBackButton fallbackHref="/" />);

    fireEvent.press(view.getByRole('button', { name: '이전 화면으로 돌아가기' }));

    expect(mockBack).toHaveBeenCalledTimes(1);
    expect(mockReplace).not.toHaveBeenCalled();
  });

  it('uses its safe fallback when a deep link has no history', async () => {
    mockCanGoBack.mockReturnValue(false);
    const view = await render(<MobileBackButton fallbackHref="/(tabs)/memories" />);

    fireEvent.press(view.getByRole('button', { name: '이전 화면으로 돌아가기' }));

    expect(mockReplace).toHaveBeenCalledWith('/(tabs)/memories');
  });
});
