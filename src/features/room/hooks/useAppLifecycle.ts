import { useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import type { AppStateStatus } from 'react-native';

type LifecycleOptions = {
  onActive?: () => void;
  onPause?: () => void;
};

export function useAppLifecycle({ onActive, onPause }: LifecycleOptions = {}) {
  const initialState = AppState.currentState ?? 'active';
  const stateRef = useRef<AppStateStatus>(initialState);
  const activeCallback = useRef(onActive);
  const pauseCallback = useRef(onPause);
  const [isActive, setIsActive] = useState(initialState === 'active');

  useEffect(() => {
    activeCallback.current = onActive;
    pauseCallback.current = onPause;
  }, [onActive, onPause]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextState) => {
      const previousState = stateRef.current;
      if (previousState === nextState) {
        return;
      }

      stateRef.current = nextState;
      const nextIsActive = nextState === 'active';

      if (nextIsActive) {
        activeCallback.current?.();
      } else if (previousState === 'active') {
        pauseCallback.current?.();
      }

      setIsActive(nextIsActive);
    });

    return () => subscription.remove();
  }, []);

  return isActive;
}
