import { Image, StyleSheet, View } from 'react-native';

import type { Animal, AnimalAction, Member } from '@/domain/models';
import { AppButton } from '@/components/ui/AppButton';
import { AppText } from '@/components/ui/AppText';
import { colors, radii, spacing } from '@/theme/tokens';
import { getIllustratedAsset } from '@/features/illustrated-ui/scene/assetManifest';

const stateLabels = {
  idle: '가만히 있어요',
  eating: '간식이 먹고 싶어요',
  resting: '쉬고 있어요',
  playing: '놀고 있어요',
  reacting: '반가워하고 있어요',
} as const;

export function AnimalDetailSheet({
  animal,
  disabled,
  onAction,
  owner,
}: {
  animal: Animal;
  owner: Member | undefined;
  disabled: boolean;
  onAction: (action: AnimalAction) => void;
  onDismiss: () => void;
}) {
  const ownerLabel = owner ? `${owner.displayName}이의 동물` : '알 수 없는 친구의 동물';
  const sprite = getIllustratedAsset(animal.species === 'rabbit' ? 'illustrated:animal:rabbit' : animal.species === 'cat' ? 'illustrated:animal:cat' : 'illustrated:placeholder:animal');

  return (
    <View style={styles.content}>
      <View style={[styles.avatar, { borderColor: owner?.pointColor ?? colors.peach }]}>
        {sprite?.source ? <Image accessibilityLabel={`${animal.name} 일러스트`} resizeMode="contain" source={sprite.source} style={styles.sprite} /> : <AppText style={styles.emoji}>🐻</AppText>}
      </View>
      <View>
        <AppText variant="heading">{animal.name}</AppText>
        <AppText tone="muted" variant="caption">{ownerLabel}</AppText>
      </View>
      <View style={styles.statusRow}>
        <AppText variant="label">기분</AppText>
        <AppText>행복해요 ♡♡♡♡♡</AppText>
      </View>
      <View style={styles.statusRow}>
        <AppText variant="label">상태</AppText>
        <AppText>{stateLabels[animal.state]}</AppText>
      </View>
      <View style={styles.actions}>
        <AppButton disabled={disabled} label="간식 주기" onPress={() => onAction('eating')} tone="quiet" />
        <AppButton disabled={disabled} label="놀아주기" onPress={() => onAction('playing')} tone="secondary" />
        <AppButton disabled={disabled} label="쉬게 하기" onPress={() => onAction('resting')} tone="quiet" />
      </View>
      <View style={styles.habit}>
        <AppText variant="label">최근 배운 버릇</AppText>
        <AppText tone="muted" variant="caption">아직 배운 버릇이 없어요</AppText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { gap: spacing.md },
  avatar: { alignItems: 'center', alignSelf: 'center', backgroundColor: colors.surface, borderRadius: 42, borderWidth: 2, height: 104, justifyContent: 'center', width: 104 },
  emoji: { fontSize: 42, lineHeight: 50 },
  sprite: { height: 106, width: 106 },
  statusRow: { borderBottomColor: colors.line, borderBottomWidth: 1, flexDirection: 'row', justifyContent: 'space-between', paddingBottom: spacing.sm },
  actions: { flexDirection: 'row', gap: spacing.sm },
  habit: { backgroundColor: colors.surface, borderRadius: radii.card, gap: spacing.xs, padding: spacing.md },
});
