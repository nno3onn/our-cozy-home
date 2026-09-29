import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { illustratedColors, illustratedElevation, illustratedRadii } from '@/theme/illustratedTokens';

export function CoinPill({ balance }: { balance: number }) {
  return (
    <View accessibilityLabel={`내 코인 ${balance.toLocaleString()}`} style={styles.pill}>
      <AppText style={styles.coin}>●</AppText>
      <AppText style={styles.balance} variant="label">{balance.toLocaleString()}</AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: { alignItems: 'center', backgroundColor: illustratedColors.paper, borderColor: illustratedColors.line, borderRadius: illustratedRadii.pill, borderWidth: 1.5, flexDirection: 'row', gap: 6, minHeight: 44, paddingHorizontal: 12, ...illustratedElevation.card },
  coin: { color: illustratedColors.honey, fontSize: 18 },
  balance: { color: illustratedColors.cocoa },
});
