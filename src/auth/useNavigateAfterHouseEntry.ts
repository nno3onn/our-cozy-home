import { router } from 'expo-router';
import { useEffect, useState } from 'react';

import { usePrivateScopeState } from './PrivateScopeContext';

/** A create/join RPC can finish before the authorized house snapshot does.
 * Keep the entry route mounted until the new house is confirmed. */
export function useNavigateAfterHouseEntry() {
  const scope = usePrivateScopeState();
  const [awaitingSnapshot, setAwaitingSnapshot] = useState(false);

  useEffect(() => {
    if (awaitingSnapshot && scope?.phase === 'active') router.replace('/');
  }, [awaitingSnapshot, scope?.phase]);

  return () => {
    if (scope) setAwaitingSnapshot(true);
    else setTimeout(() => router.replace('/'), 0);
  };
}
