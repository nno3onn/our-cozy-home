import { Pressable, StyleSheet, View } from 'react-native';

import type { House, Member } from '@/domain/models';
import { AppText } from '@/components/ui/AppText';
import { illustratedColors, illustratedElevation, illustratedRadii } from '@/theme/illustratedTokens';

import { CoinPill } from './CoinPill';
import { GameIconButton } from './GameIconButton';
import { MemberAvatarRow } from './MemberAvatarRow';

export function HouseGameHeader({ coinBalance, currentUserId, house, members, onOpenInvite, onOpenSettings }: { house: House; members: Member[]; currentUserId: string; coinBalance: number; onOpenSettings: () => void; onOpenInvite?: () => void }) {
  return (
    <View style={styles.header}>
      <View style={styles.topRow}>
        <Pressable accessibilityLabel={`${house.name} 집 정보`} accessibilityRole="button" style={styles.housePill}>
          <AppText style={styles.houseMark}>⌂</AppText>
          <AppText variant="label">{house.name}</AppText>
          <AppText tone="muted">⌄</AppText>
        </Pressable>
        <View style={styles.actions}>
          <CoinPill balance={coinBalance} />
          <GameIconButton accessibilityLabel="설정 열기" icon={<AppText>⚙</AppText>} onPress={onOpenSettings} />
        </View>
      </View>
      <MemberAvatarRow capacity={house.capacity} currentUserId={currentUserId} members={members} onInvite={onOpenInvite} />
    </View>
  );
}

const styles = StyleSheet.create({
  header: { gap: 10, paddingHorizontal: 14, paddingTop: 10 },
  topRow: { alignItems: 'center', flexDirection: 'row', gap: 8, justifyContent: 'space-between' },
  housePill: { alignItems: 'center', backgroundColor: illustratedColors.paper, borderColor: illustratedColors.line, borderRadius: illustratedRadii.pill, borderWidth: 1.5, flexDirection: 'row', gap: 7, minHeight: 44, paddingHorizontal: 13, ...illustratedElevation.card },
  houseMark: { color: illustratedColors.peach, fontSize: 21, lineHeight: 22 },
  actions: { alignItems: 'center', flexDirection: 'row', gap: 6 },
});
