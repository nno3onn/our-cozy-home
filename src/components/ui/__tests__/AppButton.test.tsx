import { render } from '@testing-library/react-native';
import { Text } from 'react-native';

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
  });
});
