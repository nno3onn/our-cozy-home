import { fireEvent, render, userEvent } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';

import { AppButton } from '../AppButton';
import { ListRow } from '../ListRow';

describe('ListRow', () => {
  it('uses the entire minimum-height row as one accessible action', async () => {
    const onPress = jest.fn();
    const view = await render(
      <ListRow description="현재 2/4명" onPress={onPress} title="집 구성원" value="관리" />,
    );
    const row = view.getByRole('button', { name: '집 구성원' });

    expect(StyleSheet.flatten(row.props.style)).toMatchObject({ minHeight: 56 });
    fireEvent.press(row);
    expect(onPress).toHaveBeenCalledTimes(1);
  });
});

describe('ListRow interactions', () => {
  it('keeps a trailing action enabled inside an informational row', async () => {
    const onSignOut = jest.fn();
    const view = await render(
      <ListRow
        description="이전 사용자 캐시를 기기에서 제거해요."
        title="계정"
        trailing={<AppButton label="로그아웃" onPress={onSignOut} />}
      />,
    );
    const button = view.getByRole('button', { name: '로그아웃' });

    expect(button).toBeEnabled();
    await userEvent.setup().press(button);
    expect(onSignOut).toHaveBeenCalledTimes(1);
  });

  it('runs a whole-row action once', async () => {
    const onPress = jest.fn();
    const view = await render(<ListRow onPress={onPress} title="초대 관리" />);

    await userEvent.setup().press(view.getByRole('button', { name: '초대 관리' }));

    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('preserves disabled whole-row actions', async () => {
    const onPress = jest.fn();
    const view = await render(<ListRow disabled onPress={onPress} title="초대 관리" />);
    const button = view.getByRole('button', { name: '초대 관리' });

    expect(button).toBeDisabled();
    await userEvent.setup().press(button);
    expect(onPress).not.toHaveBeenCalled();
  });
});
