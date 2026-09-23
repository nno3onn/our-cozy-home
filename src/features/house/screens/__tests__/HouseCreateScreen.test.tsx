import { render, userEvent } from '@testing-library/react-native';

import { HouseCreateScreen } from '../HouseCreateScreen';

describe('HouseCreateScreen', () => {
  it('submits one stable request key with the trimmed house name', async () => {
    const onCreate = jest.fn().mockResolvedValue(undefined);
    const onCreated = jest.fn();
    const view = await render(
      <HouseCreateScreen createRequestId={() => 'stable-request'} onCreate={onCreate} onCreated={onCreated} />,
    );
    const user = userEvent.setup();

    await user.type(view.getByPlaceholderText('예: 도란도란 우리집'), ' 도란도란 우리집 ');
    await user.press(view.getByRole('button', { name: '집 만들기' }));

    expect(onCreate).toHaveBeenCalledWith({ name: '도란도란 우리집', requestId: 'stable-request' });
    expect(onCreated).toHaveBeenCalledTimes(1);
  });

  it('keeps the name and explains that an existing house should be opened instead', async () => {
    const onCreate = jest.fn().mockRejectedValue({ code: 'conflict', message: 'already_in_house' });
    const onOpenExistingHouse = jest.fn();
    const view = await render(
      <HouseCreateScreen createRequestId={() => 'stable-request'} onCreate={onCreate} onCreated={jest.fn()} onOpenExistingHouse={onOpenExistingHouse} />,
    );
    const user = userEvent.setup();

    await user.type(view.getByPlaceholderText('예: 도란도란 우리집'), '도란도란 우리집');
    await user.press(view.getByRole('button', { name: '집 만들기' }));

    expect(await view.findByText('이미 살고 있는 집이 있어요.')).toBeOnTheScreen();
    expect(view.getByDisplayValue('도란도란 우리집')).toBeOnTheScreen();
    await user.press(view.getByRole('button', { name: '기존 집 열기' }));
    expect(onOpenExistingHouse).toHaveBeenCalledTimes(1);
  });
});
