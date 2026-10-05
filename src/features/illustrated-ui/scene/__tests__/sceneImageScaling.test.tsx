import { render } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';

import { RoomBackdrop } from '../RoomBackdrop';

describe('room scene image scaling', () => {
  it('constrains the wide room artwork to the scene before covering it', async () => {
    const view = await render(<RoomBackdrop />);
    const image = view.getByTestId('room-backdrop-image');

    expect(StyleSheet.flatten(image.props.style)).toMatchObject({
      height: '100%',
      width: '100%',
    });
    expect(image.props.resizeMode).toBe('cover');
  });
});
