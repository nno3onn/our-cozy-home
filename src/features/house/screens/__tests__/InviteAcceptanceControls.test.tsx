import { render, userEvent } from '@testing-library/react-native';

import { InviteAcceptanceControls } from '../InviteAcceptanceControls';

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
});
