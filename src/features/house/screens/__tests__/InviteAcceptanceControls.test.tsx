import { render, userEvent } from '@testing-library/react-native';

import { InviteAcceptanceControls } from '../InviteAcceptanceControls';
import { ConnectionProvider } from '@/network/ConnectionProvider';
import type { ConnectionState } from '@/network/connectionState';

describe('InviteAcceptanceControls', () => {
  it('submits a stable idempotency key and opens the joined house', async () => {
    const onAccept = jest.fn().mockResolvedValue({
      house: { id: 'house-1', name: '도란도란 우리집', capacity: 4 },
      membershipId: 'membership-1',
      result: 'joined',
    });
    const onJoined = jest.fn();
    const view = await render(
      <InviteAcceptanceControls createRequestId={() => 'accept-request'} onAccept={onAccept} onJoined={onJoined} token="invite-token" />,
    );

    await userEvent.setup().press(view.getByRole('button', { name: '이 집에 입주하기' }));

    expect(onAccept).toHaveBeenCalledWith({ token: 'invite-token', requestId: 'accept-request' });
    expect(onJoined).toHaveBeenCalledTimes(1);
  });

  it('shows a full-house result without claiming entry succeeded', async () => {
    const onAccept = jest.fn().mockRejectedValue({ message: 'house_full' });
    const view = await render(
      <InviteAcceptanceControls createRequestId={() => 'accept-request'} onAccept={onAccept} onJoined={jest.fn()} token="invite-token" />,
    );

    await userEvent.setup().press(view.getByRole('button', { name: '이 집에 입주하기' }));

    expect(await view.findByText('집이 꽉 찼어요. 다른 우리집을 찾아봐요.')).toBeOnTheScreen();
  });

  it('explains when a previously previewed invite is no longer valid', async () => {
    const onAccept = jest.fn().mockRejectedValue({ message: 'invite_invalid' });
    const view = await render(
      <InviteAcceptanceControls createRequestId={() => 'accept-request'} onAccept={onAccept} onJoined={jest.fn()} token="invite-token" />,
    );

    await userEvent.setup().press(view.getByRole('button', { name: '이 집에 입주하기' }));

    expect(await view.findByText('초대를 찾지 못했어요. 집 관리자에게 새 링크를 요청해 주세요.')).toBeOnTheScreen();
  });

  it('does not reserve or accept an invite while offline', async () => {
    const onAccept = jest.fn();
    const offlineState: ConnectionState = { isOnline: () => false, subscribe: () => () => undefined };
    const view = await render(
      <ConnectionProvider state={offlineState}>
        <InviteAcceptanceControls onAccept={onAccept} onJoined={jest.fn()} token="invite-token" />
      </ConnectionProvider>,
    );

    expect(view.getByText('오프라인 읽기 전용')).toBeOnTheScreen();
    expect(view.getByRole('button', { name: '이 집에 입주하기' })).toBeDisabled();
    expect(onAccept).not.toHaveBeenCalled();
  });
});
