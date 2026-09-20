import type { ReactNode } from 'react';
import type { PressableProps } from 'react-native';
import { Pressable, StyleSheet, View } from 'react-native';

import { colors, radii, spacing } from '@/theme/tokens';

import { AppText } from './AppText';

type AppButtonProps = Omit<PressableProps, 'children' | 'style'> & {
  label?: string;
  icon?: ReactNode;
  tone?: 'primary' | 'secondary' | 'quiet' | 'danger';
};

export function AppButton({
  accessibilityLabel,
  disabled,
  icon,
  label,
  onPress,
  tone = 'primary',
  ...props
}: AppButtonProps) {
  if (!label && !accessibilityLabel) {
    throw new Error('아이콘 버튼에는 accessibilityLabel이 필요해요.');
  }

  const accessibleName = accessibilityLabel ?? label;

  return (
    <Pressable
      {...props}
      accessibilityLabel={accessibleName}
      accessibilityRole="button"
      accessibilityState={{ disabled: Boolean(disabled) }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        styles[tone],
        pressed && !disabled && styles.pressed,
        disabled && styles.disabled,
      ]}
    >
      <View style={styles.content}>
        {icon}
        {label ? (
          <AppText style={tone === 'primary' ? styles.primaryText : undefined} variant="label">
            {label}
          </AppText>
        ) : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 44,
    minWidth: 44,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    borderRadius: radii.md,
    borderWidth: 1.5,
    borderColor: colors.ink,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  primary: { backgroundColor: colors.ink },
  secondary: { backgroundColor: colors.mint },
  quiet: { backgroundColor: colors.paper, borderColor: colors.line },
  danger: { backgroundColor: colors.paper, borderColor: colors.danger },
  primaryText: { color: colors.white },
  pressed: { transform: [{ translateY: 1 }], opacity: 0.86 },
  disabled: { opacity: 0.42 },
});
