import { StyleSheet, View } from 'react-native';

import type { Animal, AnimalAction } from '@/domain/models';
import { spacing } from '@/theme/tokens';

import { AppButton } from '@/components/ui/AppButton';
import { AppText } from '@/components/ui/AppText';
import { Panel } from '@/components/ui/Panel';

const stateLabels = {
  idle: '가만히 있어요',
  eating: '간식을 먹고 있어요',
  resting: '쉬고 있어요',
  playing: '놀고 있어요',
  reacting: '반가워하고 있어요',
} as const;

export function AnimalActions({
  animal,
  disabled,
  onAction,
}: {
  animal: Animal;
  disabled?: boolean;
  onAction: (action: AnimalAction) => void;
}) {
  return (
    <Panel style={styles.panel}>
      <AppText variant="label">
        {animal.name} · {stateLabels[animal.state]}
      </AppText>
      <View style={styles.actions}>
        <AppButton disabled={disabled} label="먹기" onPress={() => onAction('eating')} tone="quiet" />
        <AppButton disabled={disabled} label="쉬기" onPress={() => onAction('resting')} tone="quiet" />
        <AppButton disabled={disabled} label="놀기" onPress={() => onAction('playing')} tone="secondary" />
      </View>
    </Panel>
  );
}

const styles = StyleSheet.create({
  panel: { marginHorizontal: spacing.lg, padding: spacing.md },
  actions: { flexDirection: 'row', gap: spacing.sm },
});
