import type { PropsWithChildren } from 'react';
import * as ReactNative from 'react-native';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import type { HomeSnapshot } from '@/domain/models';
import { AppText } from '@/components/ui/AppText';
import { GameTabBar } from '@/features/illustrated-ui/chrome/GameTabBar';
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
          <GameTabBar activeTab={activeTab} onNavigate={onNavigate} vertical />
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
            <GameTabBar activeTab={activeTab} onNavigate={onNavigate} />
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
  main: { flex: 1, minWidth: 0 },
  stage: { flex: 1, minHeight: 0 },
});
