import { Pressable, StyleSheet, View } from 'react-native';

import type { Animal } from '@/domain/models';
import { AppText } from '@/components/ui/AppText';
import { colors, elevation, radii, spacing } from '@/theme/tokens';

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
      <View style={styles.avatar}><AppText>🐾</AppText></View>
      <View style={styles.copy}>
        <AppText variant="label">{animal.name}가</AppText>
        <AppText tone="muted" variant="caption">{actionPrompts[animal.state]}</AppText>
      </View>
      <AppText variant="heading">›</AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  prompt: { alignItems: 'center', alignSelf: 'center', backgroundColor: colors.paper, borderColor: colors.line, borderRadius: radii.sheet, borderWidth: 1.5, flexDirection: 'row', gap: spacing.sm, marginHorizontal: spacing.lg, marginVertical: spacing.sm, maxWidth: 420, minHeight: 68, padding: spacing.sm, width: '92%', ...elevation.soft },
  avatar: { alignItems: 'center', backgroundColor: '#FBE2DF', borderRadius: radii.md, height: 46, justifyContent: 'center', width: 46 },
  copy: { flex: 1 },
});
