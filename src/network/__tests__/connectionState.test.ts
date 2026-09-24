import { createConnectionState } from '../connectionState';

type Listener = (online: boolean) => void;

function createSource(initialOnline: boolean) {
  let online = initialOnline;
  const listeners = new Set<Listener>();

  return {
    get online() {
      return online;
    },
    source: {
      getCurrentOnline: () => online,
      subscribe(listener: Listener) {
        listeners.add(listener);
        return () => listeners.delete(listener);
      },
    },
    setOnline(nextOnline: boolean) {
      online = nextOnline;
      listeners.forEach((listener) => listener(nextOnline));
    },
  };
}

describe('connection state', () => {
  it('keeps the latest connectivity value and notifies subscribers once per change', () => {
    const source = createSource(true);
    const connection = createConnectionState(source.source);
    const listener = jest.fn();
    const unsubscribe = connection.subscribe(listener);

    expect(connection.isOnline()).toBe(true);

    source.setOnline(false);
    source.setOnline(false);
    source.setOnline(true);

    expect(listener).toHaveBeenCalledTimes(2);
    expect(listener).toHaveBeenNthCalledWith(1, false);
    expect(listener).toHaveBeenNthCalledWith(2, true);
    expect(connection.isOnline()).toBe(true);

    unsubscribe();
    source.setOnline(false);
    expect(listener).toHaveBeenCalledTimes(2);
  });
});
