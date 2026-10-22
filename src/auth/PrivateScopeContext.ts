import { createContext, useContext, useSyncExternalStore } from 'react';
import type { PrivateDataScope } from './PrivateDataScope';

export const PrivateScopeContext = createContext<PrivateDataScope | null>(null);
const emptySubscribe = () => () => {};
const emptySnapshot = () => null;

export function usePrivateScope() { return useContext(PrivateScopeContext); }
export function usePrivateScopeState() {
  const scope = usePrivateScope();
  return useSyncExternalStore(scope?.subscribe ?? emptySubscribe, scope?.getSnapshot ?? emptySnapshot, scope?.getSnapshot ?? emptySnapshot);
}
