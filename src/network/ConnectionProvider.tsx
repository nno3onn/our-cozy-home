import { createContext, type PropsWithChildren, useContext, useSyncExternalStore } from 'react';

import { connectionState, type ConnectionState } from './connectionState';

const ConnectionContext = createContext<ConnectionState>(connectionState);

export function ConnectionProvider({ children, state = connectionState }: PropsWithChildren<{ state?: ConnectionState }>) {
  return <ConnectionContext.Provider value={state}>{children}</ConnectionContext.Provider>;
}

export function useConnectionStatus(): boolean {
  const state = useContext(ConnectionContext);
  return useSyncExternalStore(state.subscribe, state.isOnline, state.isOnline);
}
