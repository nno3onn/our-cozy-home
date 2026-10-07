import { fireEvent, render } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';

import { ListRow } from '../ListRow';

describe('ListRow', () => {
  it('uses the entire minimum-height row as one accessible action', async () => {
    const onPress = jest.fn();
    const view = await render(
      <ListRow description="현재 2/4명" onPress={onPress} title="집 구성원" value="관리" />,
    );
    const row = view.getByRole('button', { name: '집 구성원' });

    expect(StyleSheet.flatten(row.props.style)).toMatchObject({ minHeight: 56 });
    fireEvent.press(row);
    expect(onPress).toHaveBeenCalledTimes(1);
  });
});
