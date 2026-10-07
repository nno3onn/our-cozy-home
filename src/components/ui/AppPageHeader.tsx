import type { Href } from 'expo-router';
import { useRouter } from 'expo-router';
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { useResponsiveLayout } from '@/components/layout/ResponsivePage';
import { colors, radii, spacing } from '@/theme/tokens';

import { AppText } from './AppText';

type AppPageHeaderProps = {
  backHref?: Href;
  showBackOnWide?: boolean;
  title: string;
  trailing?: ReactNode;
};

export function AppPageHeader({ backHref, showBackOnWide = false, title, trailing }: AppPageHeaderProps) {
  const router = useRouter();
  const { breakpoint } = useResponsiveLayout();
  const showsBack = Boolean(backHref) && (breakpoint !== 'wide' || showBackOnWide);

  const goBack = () => {
    if (router.canGoBack()) router.back();
    else if (backHref) router.replace(backHref);
  };

  return (
    <View style={styles.container}>
      {showsBack ? (
        <Pressable
          accessibilityLabel="이전 화면으로 돌아가기"
          accessibilityRole="button"
          hitSlop={4}
          onPress={goBack}
          style={({ pressed }) => [styles.back, pressed && styles.pressed]}
        >
          <AppText accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={styles.backGlyph}>
            ‹
          </AppText>
        </Pressable>
      ) : null}
      <AppText accessibilityRole="header" style={styles.title} variant="title">
        {title}
      </AppText>
      {trailing ? <View style={styles.trailing}>{trailing}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { minHeight: 52, flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  back: { width: 44, height: 44, borderRadius: radii.pill, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surface },
  backGlyph: { marginTop: -3, fontSize: 36, lineHeight: 40 },
  pressed: { backgroundColor: colors.surfaceSubtle, transform: [{ scale: 0.98 }] },
  title: { minWidth: 0, flex: 1, flexShrink: 1 },
  trailing: { flexShrink: 0 },
});
