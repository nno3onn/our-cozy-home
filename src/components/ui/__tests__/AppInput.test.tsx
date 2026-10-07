import { render } from '@testing-library/react-native';

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
});
