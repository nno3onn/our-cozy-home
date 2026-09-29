import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { illustratedColors, illustratedElevation, illustratedRadii } from '@/theme/illustratedTokens';

export function AttendanceRewardCard({ balance, granted }: { balance: number; granted: boolean }) {
  return <View accessibilityLabel={granted ? '출석 보상 100코인' : '오늘 출석 완료'} style={styles.card}><AppText style={styles.sun}>☀</AppText><AppText variant="heading">{granted ? '오늘도 집에 왔네요!' : '오늘의 출석을 이미 받았어요'}</AppText><AppText style={styles.reward} variant="title">{granted ? '+100 ●' : `${balance} ●`}</AppText><AppText tone="muted" variant="caption">출석 보상은 하루 한 번, 개인 지갑으로 지급돼요.</AppText></View>;
}

const styles = StyleSheet.create({ card: { alignItems: 'center', backgroundColor: illustratedColors.paper, borderRadius: illustratedRadii.sheet, gap: 10, padding: 26, ...illustratedElevation.card }, sun: { color: illustratedColors.honey, fontSize: 54 }, reward: { color: illustratedColors.cocoa } });
