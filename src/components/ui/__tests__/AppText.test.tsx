import { render } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';

import { colors, typeScale } from '@/theme/tokens';
import { fontFamilies } from '@/theme/fonts';

import { AppText } from '../AppText';

describe('AppText', () => {
  it('renders the display hierarchy with the approved metrics', async () => {
    const view = await render(<AppText variant="display">우리집</AppText>);
    const style = StyleSheet.flatten(view.getByText('우리집').props.style);

    expect(style).toMatchObject({ ...typeScale.display, fontFamily: fontFamilies.sans });
  });

  it('uses semantic text tones', async () => {
    const view = await render(<AppText tone="secondary">도움말</AppText>);

    expect(StyleSheet.flatten(view.getByText('도움말').props.style).color).toBe(
      colors.textSecondary,
    );
  });

  it('keeps the legacy heading variant aligned with section titles', async () => {
    const view = await render(<AppText variant="heading">구성원</AppText>);

    expect(StyleSheet.flatten(view.getByText('구성원').props.style)).toMatchObject(
      typeScale.sectionTitle,
    );
  });
});
