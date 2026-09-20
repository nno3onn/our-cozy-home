import { StyleSheet, View } from 'react-native';

import type { Member } from '@/domain/models';
import { colors, radii, spacing } from '@/theme/tokens';

import { AppText } from '@/components/ui/AppText';

export function MemberStrip({ members }: { members: Member[] }) {
  return (
    <View style={styles.container}>
      <View style={styles.heading}>
        <AppText variant="label">함께 사는 친구</AppText>
        <AppText accessibilityLabel={`현재 ${members.length}명, 최대 4명`} variant="label">
          {members.length}/4
        </AppText>
      </View>
      <View style={styles.slots}>
        {Array.from({ length: 4 }, (_, index) => {
          const member = members[index];
          return (
            <View
              accessibilityLabel={member ? `${member.displayName}의 자리` : '빈 자리, 친구 초대'}
              key={member?.id ?? `empty-${index}`}
              style={styles.slot}
            >
              <View
                style={[
                  styles.avatar,
                  { backgroundColor: member?.pointColor ?? colors.paper },
                  !member && styles.emptyAvatar,
                ]}
              >
                <AppText variant="label">{member ? member.displayName.slice(0, 1) : '+'}</AppText>
              </View>
              <AppText numberOfLines={1} variant="caption">
                {member?.displayName ?? '초대'}
              </AppText>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.sm, paddingHorizontal: spacing.lg },
  heading: { flexDirection: 'row', justifyContent: 'space-between' },
  slots: { flexDirection: 'row', gap: spacing.sm },
  slot: { flex: 1, alignItems: 'center', gap: spacing.xs },
  avatar: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.pill,
    borderWidth: 1.5,
    borderColor: colors.ink,
  },
  emptyAvatar: { borderStyle: 'dashed', borderColor: colors.line },
});
