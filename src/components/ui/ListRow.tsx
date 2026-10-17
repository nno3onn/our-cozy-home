import type { ReactNode } from 'react';
import type { PressableProps } from 'react-native';
import { Pressable, StyleSheet, View } from 'react-native';

import { colors, spacing } from '@/theme/tokens';

import { AppText } from './AppText';

type ListRowProps = Omit<PressableProps, 'children' | 'style'> & {
  description?: string;
  leading?: ReactNode;
  title: string;
  trailing?: ReactNode;
  value?: string;
};

export function ListRow({ description, disabled, leading, onPress, title, trailing, value, ...props }: ListRowProps) {
  const content = (
    <>
      {leading}
      <View style={styles.copy}>
        <AppText variant="bodyStrong">{title}</AppText>
        {description ? <AppText tone="secondary" variant="caption">{description}</AppText> : null}
      </View>
      {value ? <AppText tone="secondary" variant="label">{value}</AppText> : null}
      {trailing}
    </>
  );

  if (!onPress) {
    return (
      <View {...props} accessibilityLabel={props.accessibilityLabel ?? title} style={styles.row}>
        {content}
      </View>
    );
  }

  return (
    <Pressable
      {...props}
      accessibilityLabel={props.accessibilityLabel ?? title}
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}
    >
      {content}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { minHeight: 56, flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.sm },
  copy: { minWidth: 0, flex: 1, gap: 2 },
  pressed: { backgroundColor: colors.surfaceSubtle },
});
