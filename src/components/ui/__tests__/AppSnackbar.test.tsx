import { fireEvent, render } from '@testing-library/react-native';
import { Pressable, Text } from 'react-native';

import { SnackbarProvider, useSnackbar } from '../AppSnackbar';

function Harness() {
  const snackbar = useSnackbar();
  return (
    <Pressable
      accessibilityLabel="메시지 추가"
      accessibilityRole="button"
      onPress={() => {
        snackbar.show('첫 번째 저장 완료', { duration: 0 });
        snackbar.show('두 번째 저장 완료', { duration: 0 });
      }}
    >
      <Text>추가</Text>
    </Pressable>
  );
}

describe('AppSnackbar', () => {
  it('shows queued messages one at a time in FIFO order', async () => {
    const view = await render(<SnackbarProvider><Harness /></SnackbarProvider>);

    fireEvent.press(view.getByRole('button', { name: '메시지 추가' }));
    expect(await view.findByText('첫 번째 저장 완료')).toBeOnTheScreen();
    expect(view.queryByText('두 번째 저장 완료')).not.toBeOnTheScreen();

    fireEvent.press(view.getByRole('button', { name: '알림 닫기' }));
    expect(await view.findByText('두 번째 저장 완료')).toBeOnTheScreen();
  });

  it('rejects hook use outside its provider', async () => {
    await expect(render(<Harness />)).rejects.toThrow(
      'useSnackbar는 SnackbarProvider 안에서 사용해야 해요.',
    );
  });
});
