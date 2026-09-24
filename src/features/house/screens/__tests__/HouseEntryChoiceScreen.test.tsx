import { render, userEvent } from '@testing-library/react-native';

import { HouseEntryChoiceScreen } from '../HouseEntryChoiceScreen';

describe('HouseEntryChoiceScreen', () => {
  it('opens house creation or an entered invite without treating the code as accepted', async () => {
    const onCreateHouse = jest.fn();
    const onOpenInvite = jest.fn();
    const view = await render(<HouseEntryChoiceScreen onCreateHouse={onCreateHouse} onOpenInvite={onOpenInvite} />);
    const user = userEvent.setup();

    await user.press(view.getByRole('button', { name: '새 집 만들기' }));
    expect(onCreateHouse).toHaveBeenCalledTimes(1);

    await user.type(view.getByPlaceholderText('초대 코드 또는 링크'), ' invite-token ');
    await user.press(view.getByRole('button', { name: '초대 확인하기' }));
    expect(onOpenInvite).toHaveBeenCalledWith('invite-token');
  });

  it('asks for an invite value instead of attempting entry when empty', async () => {
    const onOpenInvite = jest.fn();
    const view = await render(<HouseEntryChoiceScreen onCreateHouse={jest.fn()} onOpenInvite={onOpenInvite} />);
    const user = userEvent.setup();

    await user.press(view.getByRole('button', { name: '초대 확인하기' }));

    expect(view.getByText('초대 코드 또는 링크를 입력해 주세요.')).toBeOnTheScreen();
    expect(onOpenInvite).not.toHaveBeenCalled();
  });
});
