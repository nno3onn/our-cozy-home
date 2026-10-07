import { StyleSheet, View } from 'react-native';

import type { House, Member } from '@/domain/models';
import { AppText } from '@/components/ui/AppText';
import { colors, spacing } from '@/theme/tokens';

import { CoinPill } from './CoinPill';
import { GameIconButton } from './GameIconButton';
import { MemberAvatarRow } from './MemberAvatarRow';

export function HouseGameHeader({ coinBalance, currentUserId, house, members, onOpenInvite, onOpenSettings }: { house: House; members: Member[]; currentUserId: string; coinBalance: number; onOpenSettings: () => void; onOpenInvite?: () => void }) {
  return (
    <View style={styles.header}>
      <View style={styles.topRow}>
        <View accessibilityLabel={`${house.name} 집 이름`} style={styles.houseTitle}>
          <AppText numberOfLines={1} variant="sectionTitle">{house.name}</AppText>
          <AppText tone="secondary" variant="label">{members.length}/{house.capacity}</AppText>
        </View>
        <View style={styles.actions}>
          <CoinPill balance={coinBalance} />
          <GameIconButton accessibilityLabel="설정 열기" icon={<AppText>⚙</AppText>} onPress={onOpenSettings} />
        </View>
      </View>
      <MemberAvatarRow capacity={house.capacity} currentUserId={currentUserId} members={members} onInvite={onOpenInvite} showSummary={false} />
    </View>
  );
}

const styles = StyleSheet.create({
  header: { gap: spacing.md, paddingHorizontal: spacing.lg, paddingTop: spacing.md, backgroundColor: colors.background },
  topRow: { alignItems: 'center', flexDirection: 'row', gap: spacing.md, justifyContent: 'space-between' },
  houseTitle: { minWidth: 0, flex: 1, flexDirection: 'row', alignItems: 'baseline', gap: spacing.sm },
  actions: { alignItems: 'center', flexDirection: 'row', gap: spacing.xs },
});
