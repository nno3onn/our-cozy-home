import type { PropsWithChildren } from 'react';
import * as ReactNative from 'react-native';
import { Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import type { HomeSnapshot } from '@/domain/models';
import { AppText } from '@/components/ui/AppText';
import { colors, spacing } from '@/theme/tokens';

import { HouseChrome } from './HouseChrome';

type HouseTab = 'home' | 'decorate' | 'memories';

type HouseGameShellProps = PropsWithChildren<{
  snapshot: HomeSnapshot;
  activeTab: HouseTab;
  onNavigate?: (tab: HouseTab) => void;
  onOpenSettings: () => void;
  onOpenInvite?: () => void;
}>;

const tabLabels: Record<HouseTab, string> = {
  home: '🏠 우리집',
  decorate: '🛋️ 꾸미기',
  memories: '📖 추억',
};

export function HouseGameShell({
  activeTab,
  children,
  onNavigate,
  onOpenInvite,
  onOpenSettings,
  snapshot,
}: HouseGameShellProps) {
  const { width } = ReactNative.useWindowDimensions();
  const isDesktop = width >= 900;

  return (
    <SafeAreaView edges={['left', 'right']} style={styles.safeArea}>
      <View style={[styles.frame, isDesktop && styles.desktopFrame]}>
        {isDesktop ? (
          <View accessibilityLabel="데스크톱 방 탐색" style={styles.desktopRail}>
            {(Object.keys(tabLabels) as HouseTab[]).map((tab) => (
              <Pressable
                accessibilityLabel={`${tabLabels[tab].replace(/^.+? /, '')}로 이동`}
                accessibilityRole="button"
                disabled={!onNavigate || tab === activeTab}
                key={tab}
                onPress={() => onNavigate?.(tab)}
                style={styles.railButton}
              >
                <AppText style={tab === activeTab ? styles.activeRailText : styles.railText} variant="caption">
                  {tabLabels[tab]}
                </AppText>
              </Pressable>
            ))}
          </View>
        ) : null}
        <View style={styles.main}>
          <HouseChrome
            coinBalance={snapshot.coinBalance}
            currentUserId={snapshot.currentUserId}
            house={snapshot.house}
            members={snapshot.members}
            onOpenInvite={onOpenInvite}
            onOpenSettings={onOpenSettings}
          />
          <View style={styles.stage}>{typeof children === 'string' ? <AppText>{children}</AppText> : children}</View>
          {!isDesktop ? (
            <View accessibilityLabel="우리집 탐색" style={styles.mobileTabs}>
              {(Object.keys(tabLabels) as HouseTab[]).map((tab) => (
                <Pressable
                  accessibilityLabel={`${tabLabels[tab].replace(/^.+? /, '')}로 이동`}
                  accessibilityRole="button"
                  disabled={!onNavigate || tab === activeTab}
                  key={tab}
                  onPress={() => onNavigate?.(tab)}
                  style={styles.tabButton}
                >
                  <AppText style={tab === activeTab ? styles.activeTabText : styles.tabText} variant="caption">
                    {tabLabels[tab]}
                  </AppText>
                </Pressable>
              ))}
            </View>
          ) : null}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { backgroundColor: colors.cream, flex: 1 },
  frame: { alignSelf: 'center', flex: 1, maxWidth: 1120, width: '100%' },
  desktopFrame: { flexDirection: 'row', padding: spacing.md },
  desktopRail: { borderRightColor: colors.line, borderRightWidth: 1, gap: spacing.xl, paddingHorizontal: spacing.sm, paddingTop: 100, width: 94 },
  railButton: { minHeight: 44, justifyContent: 'center' },
  main: { flex: 1, minWidth: 0 },
  stage: { flex: 1, minHeight: 0 },
  mobileTabs: { alignItems: 'center', backgroundColor: colors.paper, borderTopColor: colors.line, borderTopWidth: 1, flexDirection: 'row', justifyContent: 'space-around', minHeight: 64, paddingHorizontal: spacing.sm },
  tabButton: { alignItems: 'center', justifyContent: 'center', minHeight: 44, minWidth: 70 },
  activeTabText: { color: colors.ink, fontWeight: '700' },
  tabText: { color: colors.mutedInk },
  activeRailText: { color: colors.ink, fontWeight: '700' },
  railText: { color: colors.mutedInk },
});
