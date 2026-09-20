import { act, render } from '@testing-library/react-native';
import { useState } from 'react';
import { AppState, Text } from 'react-native';
import type { AppStateStatus } from 'react-native';

import { useAppLifecycle } from '../useAppLifecycle';

describe('useAppLifecycle', () => {
  it('pauses local work, refreshes once on a real active transition, and cleans up', async () => {
    const listeners: ((state: AppStateStatus) => void)[] = [];
    const remove = jest.fn();
    jest.spyOn(AppState, 'addEventListener').mockImplementation((_event, handler) => {
      listeners.push(handler);
      return { remove };
    });
    const onActive = jest.fn();
    const onPause = jest.fn();

    function Probe() {
      const [ticks, setTicks] = useState(0);
      const isActive = useAppLifecycle({
        onActive,
        onPause: () => {
          onPause();
          setTicks((value) => value + 1);
        },
      });

      return <Text>{`${isActive ? 'active' : 'paused'}:${ticks}`}</Text>;
    }

    const view = await render(<Probe />);

    await act(async () => listeners.forEach((handler) => handler('background')));
    expect(view.getByText('paused:1')).toBeOnTheScreen();
    expect(onPause).toHaveBeenCalledTimes(1);

    await act(async () => listeners.forEach((handler) => handler('active')));
    await act(async () => listeners.forEach((handler) => handler('active')));
    expect(view.getByText('active:1')).toBeOnTheScreen();
    expect(onActive).toHaveBeenCalledTimes(1);

    await view.unmount();
    expect(remove).toHaveBeenCalledTimes(1);
  });
});
