import { act, render } from '@testing-library/react-native';
import { Text } from 'react-native';

import { ConnectionProvider, useConnectionStatus } from '../ConnectionProvider';
import { createConnectionState, type ConnectionSource } from '../connectionState';

function createSource(initialOnline: boolean): { source: ConnectionSource; setOnline(online: boolean): void } {
  let online = initialOnline;
  const listeners = new Set<(nextOnline: boolean) => void>();
  return {
    source: {
      getCurrentOnline: () => online,
      subscribe(listener) { listeners.add(listener); return () => listeners.delete(listener); },
    },
    setOnline(nextOnline) {
      online = nextOnline;
      listeners.forEach((listener) => listener(nextOnline));
    },
  };
}

describe('ConnectionProvider', () => {
  it('re-renders consumers when the connection changes', async () => {
    const source = createSource(true);
    const connectionState = createConnectionState(source.source);
    function Probe() {
      return <Text>{useConnectionStatus() ? 'online' : 'offline'}</Text>;
    }
    const view = await render(<ConnectionProvider state={connectionState}><Probe /></ConnectionProvider>);

    expect(view.getByText('online')).toBeOnTheScreen();
    await act(async () => source.setOnline(false));
    expect(view.getByText('offline')).toBeOnTheScreen();
  });
});
