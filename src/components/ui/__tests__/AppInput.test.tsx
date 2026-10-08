import { fireEvent, render } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';

import { colors } from '@/theme/tokens';

import { AppInput } from '../AppInput';

describe('AppInput', () => {
  it('keeps a visible label and associates helper copy with the field', async () => {
    const view = await render(
      <AppInput label="동물 이름" helperText="친구들에게 보여요." value="마루" />,
    );

    expect(view.getByText('동물 이름')).toBeOnTheScreen();
    expect(view.getByLabelText('동물 이름')).toHaveProp(
      'accessibilityHint',
      '친구들에게 보여요.',
    );
  });

  it('exposes an error without discarding the field value', async () => {
    const view = await render(
      <AppInput error="두 글자 이상 입력해 주세요." label="내 이름" value="나" />,
    );

    expect(view.getByDisplayValue('나')).toHaveProp('aria-invalid', true);
    expect(view.getByRole('alert')).toHaveTextContent('두 글자 이상 입력해 주세요.');
  });

  it('shows and clears the shared focus ring without replacing the input label', async () => {
    const onBlur = jest.fn();
    const onFocus = jest.fn();
    const view = await render(<AppInput label="내 이름" onBlur={onBlur} onFocus={onFocus} value="다은" />);
    const input = view.getByLabelText('내 이름');

    await fireEvent(input, 'focus');
    expect(StyleSheet.flatten(input.props.style)).toMatchObject({
      outlineColor: colors.brand,
      outlineStyle: 'solid',
      outlineWidth: 2,
    });

    await fireEvent(input, 'blur');
    expect(StyleSheet.flatten(input.props.style).outlineWidth).toBeUndefined();
    expect(onFocus).toHaveBeenCalledTimes(1);
    expect(onBlur).toHaveBeenCalledTimes(1);
  });
});
