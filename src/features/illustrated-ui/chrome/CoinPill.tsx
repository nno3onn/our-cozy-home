import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { colors, radii, spacing } from '@/theme/tokens';

export function CoinPill({ balance }: { balance: number }) {
  return (
    <View accessibilityLabel={`내 코인 ${balance.toLocaleString()}`} style={styles.pill}>
      <AppText style={styles.coin}>●</AppText>
      <AppText style={styles.balance} variant="label">{balance.toLocaleString()}</AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: { alignItems: 'center', backgroundColor: colors.surfaceSubtle, borderRadius: radii.pill, flexDirection: 'row', gap: spacing.xs, minHeight: 44, paddingHorizontal: spacing.md },
  coin: { color: colors.warning, fontSize: 18 },
  balance: { color: colors.textPrimary },
});
