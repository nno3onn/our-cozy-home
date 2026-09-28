import { Pressable, StyleSheet, View } from 'react-native';

import type { MemorySummary } from '@/domain/models';
import { AppText } from '@/components/ui/AppText';
import { colors, elevation, radii, spacing } from '@/theme/tokens';

function shortDate(occurredOn: string) {
  const [, month = '', day = ''] = occurredOn.split('-');
  return `${['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][Number(month) - 1] ?? month} ${Number(day)}`;
}

export function ScrapbookMemoryCard({ memory, onPress, scope }: { memory: MemorySummary; onPress: (memoryId: string) => void; scope: 'current' | 'archive' }) {
  return (
    <Pressable accessibilityLabel={`${memory.title} 상세 열기`} accessibilityRole="button" onPress={() => onPress(memory.id)} style={styles.card}>
      <View style={styles.photo}><AppText style={styles.photoEmoji}>{memory.furnitureOwnedItemId ? '📻' : '📷'}</AppText></View>
      <View style={styles.copy}>
        {scope === 'archive' ? <AppText tone="muted" variant="caption">개인 보관함 기록</AppText> : null}
        <AppText variant="heading">{memory.title}</AppText>
        <AppText tone="muted" variant="caption">{memory.participantNames.join(' · ')}</AppText>
        <View style={styles.footer}><AppText tone="muted" variant="caption">{shortDate(memory.occurredOn)}</AppText><AppText tone="muted" variant="caption">기여 {memory.contributionCount}명</AppText></View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.paper, borderColor: colors.line, borderRadius: radii.card, borderWidth: 1.5, gap: spacing.sm, padding: spacing.sm, transform: [{ rotate: '-1deg' }], ...elevation.soft },
  photo: { alignItems: 'center', backgroundColor: '#ECD8B7', borderRadius: radii.md, height: 126, justifyContent: 'center' },
  photoEmoji: { fontSize: 42, lineHeight: 50 },
  copy: { gap: spacing.xs },
  footer: { flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing.xs },
});
