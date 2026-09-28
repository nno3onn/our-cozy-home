import { Pressable, StyleSheet, View } from 'react-native';

import type { House, Member } from '@/domain/models';
import { AppButton } from '@/components/ui/AppButton';
import { AppText } from '@/components/ui/AppText';
import { colors, elevation, radii, spacing } from '@/theme/tokens';

type HouseChromeProps = {
  house: House;
  members: Member[];
  currentUserId: string;
  coinBalance: number;
  onOpenSettings: () => void;
  onOpenInvite?: () => void;
};

export function HouseChrome({
  house,
  members,
  currentUserId,
  coinBalance,
  onOpenInvite,
  onOpenSettings,
}: HouseChromeProps) {
  const isAdmin = members.find((member) => member.userId === currentUserId)?.role === 'admin';
  const slots = Array.from({ length: house.capacity }, (_, index) => members[index]);

  return (
    <View style={styles.chrome}>
      <View style={styles.topRow}>
        <View style={styles.housePill}>
          <AppText variant="label">🏠 {house.name}</AppText>
        </View>
        <View style={styles.actions}>
          <View accessibilityLabel={`내 코인 ${coinBalance.toLocaleString()}`} style={styles.coinPill}>
            <AppText variant="label">🪙 {coinBalance.toLocaleString()}</AppText>
          </View>
          <AppButton accessibilityLabel="설정 열기" icon={<AppText>⚙️</AppText>} onPress={onOpenSettings} tone="quiet" />
        </View>
      </View>
      <View accessibilityLabel={`우리집 식구 ${members.length} / ${house.capacity}명`} style={styles.memberRow}>
        {slots.map((member, index) => (
          <View accessibilityLabel={`식구 자리 ${index + 1}: ${member?.displayName ?? '빈 자리'}`} key={member?.id ?? `empty-${index}`} style={styles.memberSlot}>
            {member ? (
              <>
                <View style={[styles.avatar, { borderColor: member.pointColor }]}>
                  <AppText>{member.displayName.slice(0, 1)}</AppText>
                </View>
                <AppText numberOfLines={1} style={styles.memberName} variant="caption">{member.displayName}</AppText>
              </>
            ) : isAdmin && onOpenInvite ? (
              <Pressable accessibilityLabel="빈 자리로 친구 초대" accessibilityRole="button" onPress={onOpenInvite} style={styles.inviteSlot}>
                <AppText variant="heading">＋</AppText>
                <AppText variant="caption">초대</AppText>
              </Pressable>
            ) : (
              <View style={styles.emptySlot}><AppText tone="muted" variant="caption">빈 자리</AppText></View>
            )}
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  chrome: { gap: spacing.sm, padding: spacing.md },
  topRow: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', gap: spacing.sm },
  housePill: { backgroundColor: colors.paper, borderColor: colors.line, borderRadius: radii.pill, borderWidth: 1.5, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, ...elevation.soft },
  actions: { alignItems: 'center', flexDirection: 'row', gap: spacing.sm },
  coinPill: { backgroundColor: colors.surface, borderColor: colors.line, borderRadius: radii.pill, borderWidth: 1.5, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, ...elevation.soft },
  memberRow: { alignItems: 'flex-start', flexDirection: 'row', gap: spacing.sm },
  memberSlot: { alignItems: 'center', minHeight: 58, width: 52 },
  avatar: { alignItems: 'center', backgroundColor: colors.paper, borderRadius: 20, borderWidth: 2, height: 40, justifyContent: 'center', width: 40 },
  memberName: { marginTop: 2, maxWidth: 52, textAlign: 'center' },
  inviteSlot: { alignItems: 'center', backgroundColor: colors.surface, borderColor: colors.line, borderRadius: 20, borderStyle: 'dashed', borderWidth: 1.5, height: 40, justifyContent: 'center', width: 40 },
  emptySlot: { alignItems: 'center', height: 40, justifyContent: 'center', width: 40 },
});
