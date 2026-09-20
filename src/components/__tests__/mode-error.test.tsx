import { render } from '@testing-library/react-native';

import { DemoBanner } from '../DemoBanner';
import { ModeErrorScreen } from '../ModeErrorScreen';

describe('application mode feedback', () => {
  it('explains how to start demo mode without changing modes for the user', async () => {
    const view = await render(<ModeErrorScreen reason="missing_app_mode" />);

    expect(view.getByRole('header', { name: '설정 확인' })).toBeOnTheScreen();
    expect(view.getByText(/EXPO_PUBLIC_APP_MODE=demo/)).toBeOnTheScreen();
    expect(view.queryByRole('button')).not.toBeOnTheScreen();
  });

  it('keeps demo mode visibly labelled', async () => {
    const view = await render(<DemoBanner />);

    expect(view.getByLabelText('현재 데모 모드입니다')).toBeOnTheScreen();
    expect(view.getByText('데모 모드')).toBeOnTheScreen();
  });
});
