import { Pressable, StyleSheet, View } from 'react-native';

import type { Member } from '@/domain/models';
import { AppText } from '@/components/ui/AppText';
import { colors, radii, spacing } from '@/theme/tokens';

export function MemberAvatarRow({ capacity, currentUserId, members, onInvite, showSummary = true }: { members: Member[]; capacity: number; currentUserId: string; onInvite?: () => void; showSummary?: boolean }) {
  const isAdmin = members.some((member) => member.userId === currentUserId && member.role === 'admin');
  const slots = Array.from({ length: capacity }, (_, index) => members[index]);
  const canInvite = isAdmin && members.length < capacity && Boolean(onInvite);

  return (
    <View accessibilityLabel={`우리집 식구 ${members.length} / ${capacity}명`} style={styles.container}>
      {showSummary ? <View style={styles.summary}><AppText variant="label">우리 식구</AppText><AppText tone="secondary" variant="caption">{members.length}/{capacity}</AppText></View> : null}
      <View style={styles.row}>{slots.map((member, index) => (
        <View accessibilityLabel={`식구 자리 ${index + 1}: ${member?.displayName ?? '빈 자리'}`} key={member?.id ?? `empty-${index}`} style={styles.slot}>
          {member ? (
            <>
              <View style={[styles.avatar, { borderColor: member.pointColor }]}><AppText variant="label">{member.displayName.slice(0, 1)}</AppText></View>
              <AppText numberOfLines={1} style={styles.name} tone="secondary" variant="caption">{member.displayName}</AppText>
            </>
          ) : canInvite ? (
            <Pressable accessibilityLabel="빈 자리로 친구 초대" accessibilityRole="button" onPress={onInvite} style={styles.invite}>
              <AppText style={styles.plus} variant="heading">+</AppText>
            </Pressable>
          ) : <View style={styles.empty} />}
        </View>
      ))}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.sm },
  summary: { alignItems: 'baseline', flexDirection: 'row', gap: spacing.sm },
  row: { alignItems: 'flex-start', flexDirection: 'row', gap: spacing.sm },
  slot: { alignItems: 'center', minHeight: 64, width: 48 },
  avatar: { alignItems: 'center', backgroundColor: colors.surface, borderRadius: radii.pill, borderWidth: 2, height: 42, justifyContent: 'center', width: 42 },
  name: { marginTop: 3, maxWidth: 48, textAlign: 'center' },
  invite: { alignItems: 'center', backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radii.pill, borderStyle: 'dashed', borderWidth: 1.5, height: 44, justifyContent: 'center', width: 44 },
  plus: { color: colors.brand },
  empty: { height: 44, width: 44 },
});
