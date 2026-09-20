import type { PropsWithChildren } from 'react';
import type { TextProps } from 'react-native';
import { StyleSheet, Text } from 'react-native';

import { colors, typeScale } from '@/theme/tokens';

type TextVariant = keyof typeof typeScale;

type AppTextProps = PropsWithChildren<
  TextProps & {
    variant?: TextVariant;
    tone?: 'default' | 'muted' | 'danger';
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
        tone === 'muted' && styles.muted,
        tone === 'danger' && styles.danger,
        style,
      ]}
    >
      {children}
    </Text>
  );
}

const styles = StyleSheet.create({
  base: { color: colors.ink },
  muted: { color: colors.mutedInk },
  danger: { color: colors.danger },
});
