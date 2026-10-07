import { render, userEvent } from '@testing-library/react-native';

import SignInScreen from '../../../app/auth/sign-in';
import SignUpScreen from '../../../app/auth/sign-up';

const mockSignIn = jest.fn();
const mockSignUp = jest.fn();
const mockReplace = jest.fn();

jest.mock('@/auth/AuthProvider', () => ({
  useAuth: () => ({ signIn: mockSignIn, signUp: mockSignUp }),
}));

jest.mock('expo-router', () => ({
  Link: ({ children }: { children: unknown }) => children,
  router: { replace: mockReplace },
  useRouter: () => ({ back: jest.fn(), canGoBack: () => false, replace: mockReplace }),
}));

describe('auth entry screens', () => {
  beforeEach(() => {
    mockSignIn.mockReset();
    mockSignUp.mockReset();
    mockReplace.mockReset();
  });

  it('keeps credentials visible when sign in fails', async () => {
    mockSignIn.mockResolvedValue('이메일 인증을 완료해 주세요.');
    const view = await render(<SignInScreen />);
    const user = userEvent.setup();

    await user.type(view.getByLabelText('이메일'), 'hello@example.com');
    await user.type(view.getByLabelText('비밀번호'), 'secret12');
    await user.press(view.getByRole('button', { name: '로그인' }));

    expect(await view.findByText('이메일 인증을 완료해 주세요.')).toBeOnTheScreen();
    expect(view.getByRole('alert')).toBeOnTheScreen();
    expect(view.getByDisplayValue('hello@example.com')).toBeOnTheScreen();
    expect(view.getByDisplayValue('secret12')).toBeOnTheScreen();
  });

  it('requires six password characters before sign up', async () => {
    const view = await render(<SignUpScreen />);
    const user = userEvent.setup();

    await user.type(view.getByLabelText('이메일'), 'hello@example.com');
    await user.type(view.getByLabelText('비밀번호'), '12345');

    expect(view.getByRole('button', { name: '회원가입' })).toBeDisabled();
  });

  it('keeps sign-up credentials visible when the server rejects the request', async () => {
    mockSignUp.mockResolvedValue('이미 가입된 이메일이에요.');
    const view = await render(<SignUpScreen />);
    const user = userEvent.setup();

    await user.type(view.getByLabelText('이메일'), 'hello@example.com');
    await user.type(view.getByLabelText('비밀번호'), 'secret12');
    await user.press(view.getByRole('button', { name: '회원가입' }));

    expect(await view.findByText('이미 가입된 이메일이에요.')).toBeOnTheScreen();
    expect(view.getByRole('alert')).toBeOnTheScreen();
    expect(view.getByDisplayValue('hello@example.com')).toBeOnTheScreen();
    expect(view.getByDisplayValue('secret12')).toBeOnTheScreen();
  });
});
