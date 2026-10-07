import { StyleSheet, View } from 'react-native';

import type { CreatedInvite } from '@/domain/models';
import { AppInput } from '@/components/ui/AppInput';
import { AppText } from '@/components/ui/AppText';
import { InlineNotice } from '@/components/ui/InlineNotice';
import { colors, radii, spacing } from '@/theme/tokens';

export function InviteCard({ createLink, invite }: { invite: CreatedInvite; createLink: (token: string) => string }) {
  return (
    <View style={styles.card}>
      <View style={styles.copy}>
        <AppText variant="sectionTitle">우리집에 친구를 초대해요</AppText>
        <AppText tone="secondary">한 명이 들어와도 빈자리가 있으면 같은 초대를 계속 사용할 수 있어요.</AppText>
      </View>
      <View accessibilityLabel={`초대 코드 ${invite.code}`} style={styles.code}>
        <AppText tone="secondary" variant="caption">초대 코드</AppText>
        <AppText style={styles.codeText} variant="title">{invite.code}</AppText>
      </View>
      <AppInput editable={false} label="초대 링크" selectTextOnFocus value={createLink(invite.token)} />
      <InlineNotice message="이 초대는 만든 뒤 24시간 동안 사용할 수 있어요." />
    </View>
  );
}

const styles = StyleSheet.create({
  card: { gap: spacing.xl },
  copy: { gap: spacing.sm },
  code: { alignItems: 'center', backgroundColor: colors.surfaceSubtle, borderRadius: radii.card, gap: spacing.xs, padding: spacing.lg },
  codeText: { letterSpacing: 2 },
});
