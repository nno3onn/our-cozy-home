type Listener = (isOnline: boolean) => void;

export type ConnectionSource = {
  getCurrentOnline(): boolean;
  subscribe(listener: Listener): () => void;
};

export type ConnectionState = {
  isOnline(): boolean;
  subscribe(listener: Listener): () => void;
};

export function createConnectionState(source: ConnectionSource): ConnectionState {
  let online = source.getCurrentOnline();
  const listeners = new Set<Listener>();

  source.subscribe((nextOnline) => {
    if (nextOnline === online) return;
    online = nextOnline;
    listeners.forEach((listener) => listener(online));
  });

  return {
    isOnline: () => online,
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}

function browserConnectionSource(): ConnectionSource {
  const navigatorValue = typeof navigator === 'undefined' ? undefined : navigator;
  return {
    getCurrentOnline: () => navigatorValue?.onLine ?? true,
    subscribe(listener) {
      if (typeof window === 'undefined' || typeof window.addEventListener !== 'function') return () => undefined;
      const onOnline = () => listener(true);
      const onOffline = () => listener(false);
      window.addEventListener('online', onOnline);
      window.addEventListener('offline', onOffline);
      return () => {
        window.removeEventListener('online', onOnline);
        window.removeEventListener('offline', onOffline);
      };
    },
  };
}

export const connectionState = createConnectionState(browserConnectionSource());
