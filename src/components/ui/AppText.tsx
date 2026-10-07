import type { PropsWithChildren } from 'react';
import type { TextProps } from 'react-native';
import { StyleSheet, Text } from 'react-native';

import { colors, typeScale } from '@/theme/tokens';
import { fontFamilies } from '@/theme/fonts';

type TextVariant = keyof typeof typeScale;

type AppTextProps = PropsWithChildren<
  TextProps & {
    variant?: TextVariant;
    tone?:
      | 'default'
      | 'muted'
      | 'secondary'
      | 'tertiary'
      | 'brand'
      | 'success'
      | 'warning'
      | 'danger'
      | 'inverse';
  }
>;

export function AppText({
  children,
  style,
  tone = 'default',
  variant = 'body',
  ...props
}: AppTextProps) {
  return (
    <Text
      {...props}
      style={[
        styles.base,
        typeScale[variant],
        (tone === 'muted' || tone === 'secondary') && styles.secondary,
        tone === 'tertiary' && styles.tertiary,
        tone === 'brand' && styles.brand,
        tone === 'success' && styles.success,
        tone === 'warning' && styles.warning,
        tone === 'danger' && styles.danger,
        tone === 'inverse' && styles.inverse,
        style,
      ]}
    >
      {children}
    </Text>
  );
}

const styles = StyleSheet.create({
  base: { color: colors.textPrimary, fontFamily: fontFamilies.sans },
  secondary: { color: colors.textSecondary },
  tertiary: { color: colors.textTertiary },
  brand: { color: colors.brand },
  success: { color: colors.success },
  warning: { color: colors.warning },
  danger: { color: colors.danger },
  inverse: { color: colors.inverse },
});
