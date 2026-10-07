import type { Href } from 'expo-router';
import type { PropsWithChildren } from 'react';
import * as ReactNative from 'react-native';

import { spacing } from '@/theme/tokens';

import { ResponsivePage, useResponsiveLayout } from './ResponsivePage';

type ResponsiveFormPageProps = PropsWithChildren<{
  fallbackHref?: Href;
  maxWidth?: number;
  testID?: string;
}>;

export function ResponsiveFormPage({ children, fallbackHref, maxWidth = 640, testID }: ResponsiveFormPageProps) {
  const { bottomSafeSpace } = useResponsiveLayout();

  return (
    <ResponsivePage contentMaxWidth={maxWidth} fallbackHref={fallbackHref} fill testID={testID}>
      <ReactNative.KeyboardAvoidingView behavior={ReactNative.Platform.OS === 'ios' ? 'padding' : undefined} style={styles.keyboard}>
        <ReactNative.ScrollView contentContainerStyle={[styles.scroll, { paddingBottom: bottomSafeSpace }]} keyboardShouldPersistTaps="handled">
          <ReactNative.View style={styles.content} testID={testID ? `${testID}-form-content` : undefined}>{children}</ReactNative.View>
        </ReactNative.ScrollView>
      </ReactNative.KeyboardAvoidingView>
    </ResponsivePage>
  );
}

const styles = ReactNative.StyleSheet.create({
  keyboard: { flex: 1 },
  scroll: { flexGrow: 1, justifyContent: 'center' },
  content: {
    gap: spacing.xl,
    paddingVertical: spacing.xxl,
  },
});
