import { render, userEvent } from '@testing-library/react-native';

import { HouseLeaveControls } from '../HouseLeaveControls';

describe('HouseLeaveControls', () => {
  it('requires confirmation before leaving and opens the house creation flow afterwards', async () => {
    const onLeave = jest.fn().mockResolvedValue({ houseId: 'house-1', houseArchived: false, successorProfileId: null, result: 'left' });
    const onLeft = jest.fn();
    const view = await render(<HouseLeaveControls onLeave={onLeave} onLeft={onLeft} />);
    const user = userEvent.setup();

    await user.press(view.getByRole('button', { name: '우리집 나가기' }));
    expect(view.getByText('정말 우리집을 나갈까요?')).toBeOnTheScreen();
    await user.press(view.getByRole('button', { name: '나가기 확인' }));

    expect(onLeave).toHaveBeenCalledTimes(1);
    expect(onLeft).toHaveBeenCalledTimes(1);
  });
});
