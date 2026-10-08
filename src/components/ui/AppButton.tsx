import { type ReactNode, useState } from 'react';
import type { PressableProps } from 'react-native';
import { Pressable, StyleSheet, View } from 'react-native';

import { colors, radii, spacing } from '@/theme/tokens';

import { AppText } from './AppText';

type AppButtonProps = Omit<PressableProps, 'children' | 'style'> & {
  label?: string;
  icon?: ReactNode;
  selected?: boolean;
  tone?: 'primary' | 'secondary' | 'tertiary' | 'quiet' | 'danger' | 'icon';
};

export function AppButton({
  accessibilityLabel,
  disabled,
  icon,
  label,
  onBlur,
  onFocus,
  onPress,
  selected = false,
  tone = 'primary',
  ...props
}: AppButtonProps) {
  const [focused, setFocused] = useState(false);

  if (!label && !accessibilityLabel) {
    throw new Error('아이콘 버튼에는 accessibilityLabel이 필요해요.');
  }

  const accessibleName = accessibilityLabel ?? label;

  return (
    <Pressable
      {...props}
      accessibilityLabel={accessibleName}
      accessibilityRole="button"
      accessibilityState={{ disabled: Boolean(disabled), selected }}
      disabled={disabled}
      onBlur={(event) => {
        setFocused(false);
        onBlur?.(event);
      }}
      onFocus={(event) => {
        setFocused(true);
        onFocus?.(event);
      }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        styles[tone],
        selected && tone !== 'primary' && styles.selected,
        !label && styles.iconOnly,
        focused && styles.focused,
        pressed && !disabled && styles.pressed,
        disabled && styles.disabled,
      ]}
    >
      <View style={styles.content}>
        {icon}
        {label ? (
          <AppText
            style={tone === 'primary' ? styles.primaryText : styles.defaultText}
            variant="label"
          >
            {label}
          </AppText>
        ) : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 52,
    minWidth: 44,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    borderRadius: radii.control,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  primary: { backgroundColor: colors.brand },
  secondary: { backgroundColor: colors.surfaceSubtle },
  tertiary: { backgroundColor: 'transparent' },
  quiet: { backgroundColor: colors.surface, borderColor: colors.border },
  danger: { backgroundColor: colors.dangerSoft },
  icon: { minHeight: 44, minWidth: 44, paddingHorizontal: spacing.md, backgroundColor: 'transparent' },
  iconOnly: { minHeight: 44, minWidth: 44, paddingHorizontal: spacing.md },
  selected: { borderColor: colors.brand, backgroundColor: colors.brandSoft },
  focused: { outlineColor: colors.brand, outlineOffset: 2, outlineStyle: 'solid', outlineWidth: 2 },
  primaryText: { color: colors.inverse },
  defaultText: { color: colors.textPrimary },
  pressed: { transform: [{ translateY: 1 }, { scale: 0.98 }] },
  disabled: { opacity: 0.4 },
});
