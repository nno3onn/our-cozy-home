import type { Href } from 'expo-router';
import type { PropsWithChildren } from 'react';
import * as ReactNative from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { MobileBackButton } from '@/features/illustrated-ui/chrome/MobileBackButton';
import { getResponsiveLayout } from '@/theme/responsive';
import { colors } from '@/theme/tokens';

type ResponsivePageProps = PropsWithChildren<{
  contentMaxWidth?: number;
  fallbackHref?: Href;
  fill?: boolean;
  scroll?: boolean;
  testID?: string;
}>;

export function useResponsiveLayout() {
  const { width } = ReactNative.useWindowDimensions();
  return getResponsiveLayout(width);
}

export function ResponsivePage({
  children,
  contentMaxWidth = 760,
  fallbackHref,
  fill = false,
  scroll = false,
  testID,
}: ResponsivePageProps) {
  const layout = useResponsiveLayout();
  const contentStyle = [
    styles.content,
    {
      maxWidth: contentMaxWidth,
      paddingHorizontal: layout.pageGutter,
      paddingTop: layout.pageGutter,
    },
  ];

  return (
    <SafeAreaView edges={['left', 'right']} style={styles.safeArea}>
      {fallbackHref && layout.breakpoint !== 'wide' ? (
        <ReactNative.View
          style={[styles.navigation, { maxWidth: contentMaxWidth, paddingHorizontal: layout.pageGutter }]}
          testID={testID ? `${testID}-navigation` : undefined}
        >
          <MobileBackButton fallbackHref={fallbackHref} />
        </ReactNative.View>
      ) : null}
      {scroll ? (
        <ReactNative.ScrollView
          contentContainerStyle={[contentStyle, { paddingBottom: layout.bottomSafeSpace }]}
          testID={testID ? `${testID}-scroll` : undefined}
        >
          <ReactNative.View style={styles.scrollContent} testID={testID ? `${testID}-content` : undefined}>{children}</ReactNative.View>
        </ReactNative.ScrollView>
      ) : (
        <ReactNative.View style={[contentStyle, fill && styles.fill]} testID={testID ? `${testID}-content` : undefined}>{children}</ReactNative.View>
      )}
    </SafeAreaView>
  );
}

const styles = ReactNative.StyleSheet.create({
  safeArea: { backgroundColor: colors.cream, flex: 1, position: 'relative' },
  navigation: { alignSelf: 'center', paddingTop: 12, width: '100%' },
  content: { alignSelf: 'center', minWidth: 0, width: '100%' },
  fill: { flex: 1 },
  scrollContent: { width: '100%' },
});
