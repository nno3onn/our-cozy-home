import type { PropsWithChildren, ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { spacing } from '@/theme/tokens';

import { AppText } from './AppText';

type AppSectionProps = PropsWithChildren<{ action?: ReactNode; description?: string; title: string }>;

export function AppSection({ action, children, description, title }: AppSectionProps) {
  return (
    <View style={styles.section}>
      <View style={styles.header}>
        <View style={styles.copy}>
          <AppText accessibilityRole="header" variant="sectionTitle">{title}</AppText>
          {description ? <AppText tone="secondary">{description}</AppText> : null}
        </View>
        {action}
      </View>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  section: { gap: spacing.lg },
  header: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.lg },
  copy: { minWidth: 0, flex: 1, gap: spacing.xs },
});
