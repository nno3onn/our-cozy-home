import type { Href } from 'expo-router';
import { useRouter } from 'expo-router';
import * as ReactNative from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { illustratedColors, illustratedElevation, illustratedRadii } from '@/theme/illustratedTokens';
import { getResponsiveLayout } from '@/theme/responsive';

export function MobileBackButton({ fallbackHref }: { fallbackHref: Href }) {
  const router = useRouter();
  const { width } = ReactNative.useWindowDimensions();

  if (getResponsiveLayout(width).breakpoint === 'wide') return null;

  function goBack() {
    if (router.canGoBack()) {
      router.back();
      return;
    }

    router.replace(fallbackHref);
  }

  return (
    <ReactNative.Pressable
      accessibilityHint="이전 화면으로 돌아가요."
      accessibilityLabel="이전 화면으로 돌아가기"
      accessibilityRole="button"
      hitSlop={8}
      onPress={goBack}
      style={({ pressed }) => [styles.button, pressed && styles.pressed]}
    >
      <AppText style={styles.icon}>‹</AppText>
    </ReactNative.Pressable>
  );
}

const styles = ReactNative.StyleSheet.create({
  button: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: illustratedColors.paper,
    borderColor: illustratedColors.line,
    borderRadius: illustratedRadii.pill,
    borderWidth: 1.5,
    height: 44,
    justifyContent: 'center',
    width: 44,
    ...illustratedElevation.card,
  },
  icon: { color: illustratedColors.cocoa, fontSize: 38, lineHeight: 39, marginTop: -4 },
  pressed: { opacity: 0.72, transform: [{ scale: 0.96 }] },
});
