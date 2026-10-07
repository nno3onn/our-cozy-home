import { StyleSheet, View } from 'react-native';

import { spacing } from '@/theme/tokens';

import { AppButton } from './AppButton';
import { AppText } from './AppText';

type EmptyStateProps = {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
};

export function EmptyState({
  actionLabel,
  description,
  onAction,
  title,
}: EmptyStateProps) {
  return (
    <View accessibilityRole="summary" style={styles.panel}>
      <View style={styles.copy}>
        <AppText accessibilityRole="header" variant="heading">
          {title}
        </AppText>
        <AppText tone="muted">{description}</AppText>
      </View>
      {actionLabel && onAction ? (
        <AppButton label={actionLabel} onPress={onAction} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  panel: { alignItems: 'stretch', gap: spacing.lg, paddingVertical: spacing.xl },
  copy: { gap: spacing.sm },
});
