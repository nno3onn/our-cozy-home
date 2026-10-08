import { fireEvent, render } from '@testing-library/react-native';
import { StyleSheet, Text } from 'react-native';

import { colors } from '@/theme/tokens';
import { AppButton } from '../AppButton';

describe('AppButton', () => {
  it('exposes its action name and disabled state', async () => {
    const view = await render(
      <AppButton disabled label="기억 남기기" onPress={() => undefined} />,
    );

    expect(view.getByRole('button', { name: '기억 남기기' })).toBeDisabled();
  });

  it('rejects an unnamed icon-only action', async () => {
    await expect(
      render(
        <AppButton icon={<Text>+</Text>} onPress={() => undefined} />,
      ),
    ).rejects.toThrow('아이콘 버튼에는 accessibilityLabel이 필요해요.');
  });

  it('accepts an accessible name for an icon-only action', async () => {
    const view = await render(
      <AppButton
        accessibilityLabel="친구 초대"
        icon={<Text>+</Text>}
        onPress={() => undefined}
      />,
    );

    expect(view.getByRole('button', { name: '친구 초대' })).toBeOnTheScreen();
    expect(
      StyleSheet.flatten(view.getByRole('button', { name: '친구 초대' }).props.style),
    ).toMatchObject({ minHeight: 44, minWidth: 44 });
  });

  it('uses the brand color and 52px height for the primary action', async () => {
    const view = await render(<AppButton label="계속하기" onPress={() => undefined} />);

    expect(
      StyleSheet.flatten(view.getByRole('button', { name: '계속하기' }).props.style),
    ).toMatchObject({ backgroundColor: colors.brand, minHeight: 52 });
  });

  it('exposes selected state without relying on color alone', async () => {
    const view = await render(
      <AppButton label="토끼" onPress={() => undefined} selected tone="secondary" />,
    );

    expect(
      view.getByRole('button', { name: '토끼' }).props.accessibilityState,
    ).toMatchObject({ selected: true });
  });

  it('shows and clears a semantic focus ring for keyboard navigation', async () => {
    const onBlur = jest.fn();
    const onFocus = jest.fn();
    const view = await render(<AppButton label="계속하기" onBlur={onBlur} onFocus={onFocus} onPress={jest.fn()} />);
    const button = view.getByRole('button', { name: '계속하기' });

    await fireEvent(button, 'focus');
    expect(StyleSheet.flatten(button.props.style)).toMatchObject({
      outlineColor: colors.brand,
      outlineStyle: 'solid',
      outlineWidth: 2,
    });

    await fireEvent(button, 'blur');
    expect(StyleSheet.flatten(button.props.style).outlineWidth).toBeUndefined();
    expect(onFocus).toHaveBeenCalledTimes(1);
    expect(onBlur).toHaveBeenCalledTimes(1);
  });
});
