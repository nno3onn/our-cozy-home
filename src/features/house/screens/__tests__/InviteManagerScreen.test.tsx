import { render, userEvent } from '@testing-library/react-native';

import { InviteManagerScreen } from '../InviteManagerScreen';

describe('InviteManagerScreen', () => {
  it('shows a newly created 24-hour invite without exposing house content', async () => {
    const onCreateInvite = jest.fn().mockResolvedValue({
      token: 'private-invite-token',
      code: 'AB12CD34',
      expiresAt: '2026-09-23T00:00:00.000Z',
    });
    const view = await render(
      <InviteManagerScreen
        createLink={(token) => `https://our-cozy-home.example/invite/${token}`}
        onCreateInvite={onCreateInvite}
      />,
    );
    const user = userEvent.setup();

    await user.press(view.getByRole('button', { name: '초대 만들기' }));

    expect(onCreateInvite).toHaveBeenCalledWith(false);
    expect(await view.findByText('AB12CD34')).toBeOnTheScreen();
    expect(view.getByDisplayValue('https://our-cozy-home.example/invite/private-invite-token')).toBeOnTheScreen();
    expect(view.getByText('이 초대는 만든 뒤 24시간 동안 사용할 수 있어요.')).toBeOnTheScreen();
    expect(view.queryByText(/추억 사진/)).not.toBeOnTheScreen();
  });

  it('reissues the active invite only after one has been created', async () => {
    const onCreateInvite = jest.fn()
      .mockResolvedValueOnce({ token: 'first', code: 'FIRST111', expiresAt: '2026-09-23T00:00:00.000Z' })
      .mockResolvedValueOnce({ token: 'second', code: 'SECOND22', expiresAt: '2026-09-24T00:00:00.000Z' });
    const view = await render(
      <InviteManagerScreen createLink={(token) => `ourcozy://invite/${token}`} onCreateInvite={onCreateInvite} />,
    );
    const user = userEvent.setup();

    await user.press(view.getByRole('button', { name: '초대 만들기' }));
    await view.findByText('FIRST111');
    await user.press(view.getByRole('button', { name: '새 초대 재발급' }));

    expect(onCreateInvite).toHaveBeenNthCalledWith(1, false);
    expect(onCreateInvite).toHaveBeenNthCalledWith(2, true);
    expect(await view.findByText('SECOND22')).toBeOnTheScreen();
  });
});
