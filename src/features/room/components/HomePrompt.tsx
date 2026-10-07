import { Pressable, StyleSheet, View } from 'react-native';

import type { Animal } from '@/domain/models';
import { AppText } from '@/components/ui/AppText';
import { colors, radii, spacing } from '@/theme/tokens';

const actionPrompts = {
  idle: '같이 놀아볼까요?',
  eating: '간식이 먹고 싶어해요!',
  resting: '조용히 쉬고 있어요.',
  playing: '신나게 놀고 있어요!',
  reacting: '친구를 반가워하고 있어요!',
} as const;

export function HomePrompt({ animal, onPress }: { animal: Animal; onPress: () => void }) {
  return (
    <Pressable accessibilityLabel={`${animal.name} 상태 보기`} accessibilityRole="button" onPress={onPress} style={styles.prompt}>
      <View style={styles.copy}>
        <AppText variant="label">{animal.name} · {actionPrompts[animal.state]}</AppText>
      </View>
      <AppText tone="brand" variant="label">보기</AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  prompt: { alignItems: 'center', alignSelf: 'center', backgroundColor: colors.surface, borderRadius: radii.card, flexDirection: 'row', gap: spacing.md, marginHorizontal: spacing.lg, marginVertical: spacing.sm, maxWidth: 420, minHeight: 56, paddingHorizontal: spacing.lg, paddingVertical: spacing.md, width: '92%' },
  copy: { flex: 1 },
});
