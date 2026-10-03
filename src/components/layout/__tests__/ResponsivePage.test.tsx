import * as ReactNative from 'react-native';
import { render } from '@testing-library/react-native';
import { Text } from 'react-native';

import { ResponsivePage } from '../ResponsivePage';

describe('ResponsivePage', () => {
  const dimensions = jest.spyOn(ReactNative, 'useWindowDimensions');

  afterEach(() => {
    dimensions.mockReset();
  });

  it('reserves bottom safe space for compact scroll content', async () => {
    dimensions.mockReturnValue({ fontScale: 1, height: 844, scale: 1, width: 390 });
    const view = await render(<ResponsivePage fallbackHref="/" scroll testID="responsive-page"><Text>content</Text></ResponsivePage>);

    expect(view.getByLabelText('이전 화면으로 돌아가기')).toBeOnTheScreen();
    expect(view.getByTestId('responsive-page-navigation')).toBeOnTheScreen();
    expect(ReactNative.StyleSheet.flatten(view.getByTestId('responsive-page-navigation').props.style).position).not.toBe('absolute');
    expect(ReactNative.StyleSheet.flatten(view.getByTestId('responsive-page-scroll').props.contentContainerStyle).paddingBottom).toBe(88);
  });

  it('keeps a constrained desktop reading column without a mobile back control', async () => {
    dimensions.mockReturnValue({ fontScale: 1.3, height: 720, scale: 1, width: 1280 });
    const view = await render(<ResponsivePage contentMaxWidth={760} fallbackHref="/" testID="responsive-page"><Text>content</Text></ResponsivePage>);

    expect(view.queryByLabelText('이전 화면으로 돌아가기')).not.toBeOnTheScreen();
    expect(ReactNative.StyleSheet.flatten(view.getByTestId('responsive-page-content').props.style).maxWidth).toBe(760);
  });
});
