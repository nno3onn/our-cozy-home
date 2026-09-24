import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { colors, spacing } from '@/theme/tokens';

export function OfflineReadOnlyBanner() {
  return (
    <View accessibilityRole="alert" style={styles.container}>
      <AppText variant="label">오프라인 읽기 전용</AppText>
      <AppText tone="muted" variant="caption">마지막으로 불러온 내용은 볼 수 있지만, 서버에 저장하는 행동은 연결 후에 할 수 있어요.</AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.xs, padding: spacing.md, borderWidth: 1, borderColor: colors.line, borderRadius: 12, backgroundColor: colors.paper },
});
