import { render } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';

import { Skeleton } from '../Skeleton';

describe('Skeleton', () => {
  it('renders a static reduced-motion placeholder at the final content size', async () => {
    const view = await render(
      <Skeleton height={24} radius={12} reducedMotion testID="skeleton" width="60%" />,
    );

    expect(StyleSheet.flatten(view.getByTestId('skeleton').props.style)).toMatchObject({
      height: 24,
      borderRadius: 12,
      width: '60%',
    });
  });
});
