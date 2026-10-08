import { Image, StyleSheet, View } from 'react-native';

import type { Animal, AnimalAction, Member } from '@/domain/models';
import { AppButton } from '@/components/ui/AppButton';
import { AppSection } from '@/components/ui/AppSection';
import { AppText } from '@/components/ui/AppText';
import { InlineNotice } from '@/components/ui/InlineNotice';
import { ListRow } from '@/components/ui/ListRow';
import { colors, spacing } from '@/theme/tokens';
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
  errorMessage,
  onAction,
  owner,
}: {
  animal: Animal;
  owner: Member | undefined;
  disabled: boolean;
  errorMessage?: string | null;
  onAction: (action: AnimalAction) => void;
  onDismiss: () => void;
}) {
  const ownerLabel = owner ? `${owner.displayName}이의 동물` : '알 수 없는 친구의 동물';
  const sprite = getIllustratedAsset(
    animal.species === 'rabbit'
      ? 'illustrated:animal:rabbit'
      : animal.species === 'cat'
        ? 'illustrated:animal:cat'
        : animal.species === 'bear'
          ? 'illustrated:animal:bear'
          : animal.species === 'dog'
            ? 'illustrated:animal:dog'
          : 'illustrated:placeholder:animal',
  );

  return (
    <View style={styles.content}>
      <View style={[styles.avatar, { borderColor: owner?.pointColor ?? colors.brand }]}>
        {sprite?.source ? <Image accessibilityLabel={`${animal.name} 일러스트`} resizeMode="contain" source={sprite.source} style={styles.sprite} /> : <AppText style={styles.emoji}>🐻</AppText>}
      </View>
      <View>
        <AppText accessibilityRole="header" variant="sectionTitle">{animal.name}</AppText>
        <AppText tone="secondary" variant="caption">{ownerLabel}</AppText>
      </View>
      <View style={styles.statusList}>
        <ListRow title="기분" value="행복해요 · 5/5" />
        <ListRow title="지금 상태" value={stateLabels[animal.state]} />
      </View>
      <AppSection title="함께하기">
        <View style={styles.actions}>
          <View style={styles.action}><AppButton disabled={disabled} label="간식 주기" onPress={() => onAction('eating')} selected={animal.state === 'eating'} tone="quiet" /></View>
          <View style={styles.action}><AppButton disabled={disabled} label="놀아주기" onPress={() => onAction('playing')} selected={animal.state === 'playing'} tone="quiet" /></View>
          <View style={styles.action}><AppButton disabled={disabled} label="쉬게 하기" onPress={() => onAction('resting')} selected={animal.state === 'resting'} tone="quiet" /></View>
        </View>
      </AppSection>
      {errorMessage ? <InlineNotice message={errorMessage} tone="danger" /> : null}
      <ListRow description="아직 배운 버릇이 없어요" title="최근 배운 버릇" />
    </View>
  );
}

const styles = StyleSheet.create({
  content: { gap: spacing.md },
  avatar: { alignItems: 'center', alignSelf: 'center', backgroundColor: colors.surface, borderRadius: 42, borderWidth: 2, height: 104, justifyContent: 'center', width: 104 },
  emoji: { fontSize: 42, lineHeight: 50 },
  sprite: { height: 106, width: 106 },
  statusList: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  action: { minWidth: 112, flex: 1 },
});
