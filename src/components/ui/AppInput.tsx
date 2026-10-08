import { forwardRef, useId, useState } from 'react';
import type { TextInputProps } from 'react-native';
import { StyleSheet, TextInput, View } from 'react-native';

import { colors, radii, spacing, typeScale } from '@/theme/tokens';
import { fontFamilies } from '@/theme/fonts';

import { AppText } from './AppText';

type AppInputProps = TextInputProps & {
  error?: string;
  helperText?: string;
  label: string;
};

export const AppInput = forwardRef<TextInput, AppInputProps>(function AppInput(
  { accessibilityHint, error, helperText, label, onBlur, onFocus, style, ...props },
  ref,
) {
  const generatedId = useId();
  const help = error ?? helperText;
  const [focused, setFocused] = useState(false);

  return (
    <View style={styles.container}>
      <AppText nativeID={`${generatedId}-label`} variant="label">
        {label}
      </AppText>
      <TextInput
        {...props}
        ref={ref}
        accessibilityHint={accessibilityHint ?? help}
        accessibilityLabel={props.accessibilityLabel ?? label}
        aria-invalid={Boolean(error)}
        onBlur={(event) => {
          setFocused(false);
          onBlur?.(event);
        }}
        onFocus={(event) => {
          setFocused(true);
          onFocus?.(event);
        }}
        style={[styles.input, error && styles.inputError, style, focused && styles.focused]}
      />
      {help ? (
        <AppText accessibilityRole={error ? 'alert' : undefined} tone={error ? 'danger' : 'tertiary'} variant="caption">
          {help}
        </AppText>
      ) : null}
    </View>
  );
});

const styles = StyleSheet.create({
  container: { gap: spacing.sm },
  input: {
    minHeight: 52,
    paddingHorizontal: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.control,
    backgroundColor: colors.surface,
    color: colors.textPrimary,
    fontFamily: fontFamilies.sans,
    fontSize: typeScale.body.fontSize,
  },
  inputError: { borderColor: colors.danger },
  focused: { outlineColor: colors.brand, outlineOffset: 2, outlineStyle: 'solid', outlineWidth: 2 },
});
