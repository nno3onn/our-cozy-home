import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { colors, radii, spacing } from '@/theme/tokens';

export function AttendanceRewardCard({ balance, granted }: { balance: number; granted: boolean }) {
  return (
    <View accessibilityLabel={granted ? '출석 보상 100코인' : '오늘 출석 완료'} style={styles.card}>
      <View style={styles.badge}><AppText style={styles.sun}>☀</AppText></View>
      <View style={styles.copy}>
        <AppText variant="sectionTitle">{granted ? '오늘도 집에 왔네요!' : '오늘 출석을 완료했어요'}</AppText>
        <AppText tone="secondary">출석 보상은 하루 한 번 개인 지갑으로 받아요.</AppText>
      </View>
      <AppText tone={granted ? 'brand' : 'secondary'} variant="display">
        {granted ? '+100 코인' : `${balance.toLocaleString()} 코인`}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { alignItems: 'center', gap: spacing.xl, paddingVertical: spacing.xl },
  badge: { width: 72, height: 72, borderRadius: radii.pill, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.warningSoft },
  sun: { color: colors.warning, fontSize: 40, lineHeight: 44 },
  copy: { alignItems: 'center', gap: spacing.sm },
});
