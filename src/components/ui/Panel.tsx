import type { PropsWithChildren } from 'react';
import type { ViewProps } from 'react-native';
import { StyleSheet, View } from 'react-native';

import { colors, radii, spacing } from '@/theme/tokens';

export function Panel({ children, style, ...props }: PropsWithChildren<ViewProps>) {
  return (
    <View {...props} style={[styles.panel, style]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: radii.lg,
    borderWidth: 1.5,
    borderColor: colors.line,
    backgroundColor: colors.paper,
  },
});
