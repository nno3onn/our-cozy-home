import { render } from '@testing-library/react-native';

import { EmptyState } from '../EmptyState';

describe('EmptyState', () => {
  it('offers a clear next action when content is empty', async () => {
    const view = await render(
      <EmptyState
        actionLabel="첫 추억 만들기"
        description="둘만의 기록을 가구로 남겨보세요."
        onAction={() => undefined}
        title="아직 추억이 없어요"
      />,
    );

    expect(
      view.getByRole('header', { name: '아직 추억이 없어요' }),
    ).toBeOnTheScreen();
    expect(
      view.getByRole('button', { name: '첫 추억 만들기' }),
    ).toBeOnTheScreen();
  });

  it('does not render an empty action target when no action is available', async () => {
    const view = await render(
      <EmptyState
        description="친구가 초대를 보내면 여기에서 만날 수 있어요."
        title="기다리는 중이에요"
      />,
    );

    expect(view.queryByRole('button')).not.toBeOnTheScreen();
  });
});
