import type { PropsWithChildren } from 'react';
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { colors, elevation, radii, spacing, zIndex } from '@/theme/tokens';

import { AppText } from './AppText';

type SnackbarOptions = {
  actionLabel?: string;
  duration?: number;
  onAction?: () => void;
};

type SnackbarItem = SnackbarOptions & { id: number; message: string };
type SnackbarContextValue = {
  dismiss: () => void;
  show: (message: string, options?: SnackbarOptions) => void;
};

const SnackbarContext = createContext<SnackbarContextValue | null>(null);
let nextSnackbarId = 1;

export function SnackbarProvider({ children }: PropsWithChildren) {
  const [queue, setQueue] = useState<SnackbarItem[]>([]);
  const current = queue[0];
  const dismiss = useCallback(() => setQueue((items) => items.slice(1)), []);
  const show = useCallback((message: string, options: SnackbarOptions = {}) => {
    setQueue((items) => [...items, { id: nextSnackbarId++, message, duration: 3000, ...options }]);
  }, []);

  useEffect(() => {
    if (!current || current.duration === 0) return undefined;
    const timer = setTimeout(dismiss, current.duration);
    return () => clearTimeout(timer);
  }, [current, dismiss]);

  const value = useMemo(() => ({ dismiss, show }), [dismiss, show]);

  return (
    <SnackbarContext.Provider value={value}>
      <View style={styles.root}>
        {children}
        {current ? (
          <View accessible accessibilityLabel={current.message} accessibilityRole="alert" style={styles.snackbar}>
            <AppText style={styles.message} tone="inverse" variant="bodyStrong">{current.message}</AppText>
            {current.actionLabel ? (
              <Pressable accessibilityRole="button" onPress={() => { current.onAction?.(); dismiss(); }}>
                <AppText tone="inverse" variant="label">{current.actionLabel}</AppText>
              </Pressable>
            ) : null}
            <Pressable accessibilityLabel="알림 닫기" accessibilityRole="button" hitSlop={8} onPress={dismiss}>
              <AppText accessibilityElementsHidden tone="inverse" variant="label">닫기</AppText>
            </Pressable>
          </View>
        ) : null}
      </View>
    </SnackbarContext.Provider>
  );
}

export function useSnackbar(): SnackbarContextValue {
  const value = useContext(SnackbarContext);
  if (!value) throw new Error('useSnackbar는 SnackbarProvider 안에서 사용해야 해요.');
  return value;
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  snackbar: { position: 'absolute', zIndex: zIndex.snackbar, left: spacing.xl, right: spacing.xl, bottom: spacing.xl, minHeight: 52, flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingHorizontal: spacing.lg, paddingVertical: spacing.md, borderRadius: radii.control, backgroundColor: colors.textPrimary, ...elevation.floating },
  message: { minWidth: 0, flex: 1 },
});
