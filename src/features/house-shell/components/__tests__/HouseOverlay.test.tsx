import { fireEvent, render } from '@testing-library/react-native';
import * as Reanimated from 'react-native-reanimated';

import { AppText } from '@/components/ui/AppText';

import { HouseOverlay } from '../HouseOverlay';

describe('HouseOverlay', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('opens without slide motion and keeps long content scrollable when reduced motion is enabled', async () => {
    jest.spyOn(Reanimated, 'useReducedMotion').mockReturnValue(true);
    const view = await render(
      <HouseOverlay accessibilityLabel="동물 상세" onDismiss={jest.fn()} visible>
        <AppText>긴 동물 상세 내용</AppText>
      </HouseOverlay>,
    );

    const modal = view.container.queryAll((instance) => instance.props.animationType !== undefined)[0];
    expect(modal).toHaveProp('animationType', 'none');
    expect(view.getByLabelText('동물 상세')).toHaveProp('role', 'dialog');
    expect(view.getByLabelText('동물 상세')).toHaveProp('accessibilityViewIsModal', true);
    expect(view.getByTestId('house-overlay-scroll')).toBeOnTheScreen();
  });

  it('keeps the slide transition when reduced motion is disabled', async () => {
    jest.spyOn(Reanimated, 'useReducedMotion').mockReturnValue(false);
    const view = await render(
      <HouseOverlay accessibilityLabel="상품 정보" onDismiss={jest.fn()} visible>
        <AppText>상품 상세</AppText>
      </HouseOverlay>,
    );

    const modal = view.container.queryAll((instance) => instance.props.animationType !== undefined)[0];
    expect(modal).toHaveProp('animationType', 'slide');
  });

  it('uses one dismiss callback for the scrim, close button, and native back request', async () => {
    const onDismiss = jest.fn();
    const view = await render(
      <HouseOverlay accessibilityLabel="상품 정보" dismissLabel="상품 정보 닫기" onDismiss={onDismiss} visible>
        <AppText>상품 상세</AppText>
      </HouseOverlay>,
    );

    const scrim = view.container.queryAll((instance) => instance.props.accessibilityLabel === '패널 바깥 영역 닫기')[0];
    await fireEvent.press(scrim);
    await fireEvent.press(view.getByRole('button', { name: '상품 정보 닫기' }));
    const modal = view.container.queryAll((instance) => instance.props.animationType !== undefined)[0];
    modal.props.onRequestClose();

    expect(onDismiss).toHaveBeenCalledTimes(3);
  });
});
