import { Pressable, StyleSheet, View } from 'react-native';

import type { Animal, Member } from '@/domain/models';
import type { AnimalAnchor, Viewport } from '@/game/room/roomLayout';
import { getHitTarget } from '@/game/room/roomLayout';
import { colors, radii, spacing } from '@/theme/tokens';

import { AppText } from '@/components/ui/AppText';

type AnimalActorProps = {
  animal: Animal;
  member: Member;
  anchor: AnimalAnchor;
  viewport: Viewport;
  selected: boolean;
  isActive: boolean;
  onPress: () => void;
};

export function AnimalActor({
  animal,
  member,
  anchor,
  viewport,
  selected,
  onPress,
}: AnimalActorProps) {
  const hitTarget = getHitTarget(anchor, viewport);

  return (
    <Pressable
      accessibilityLabel={`${animal.name} 동물 선택`}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={[
        styles.target,
        {
          left: hitTarget.x,
          top: hitTarget.y,
          width: hitTarget.width,
          height: hitTarget.height,
        },
      ]}
    >
      <View
        style={[
          styles.nameTag,
          { left: hitTarget.width / 2 - 44, top: hitTarget.height + Math.max(6, viewport.width / 100) },
          { borderColor: member.pointColor },
          selected && styles.selectedTag,
        ]}
      >
        <View style={[styles.point, { backgroundColor: member.pointColor }]} />
        <AppText numberOfLines={1} variant="caption">
          {animal.name}
        </AppText>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  target: {
    position: 'absolute',
  },
  nameTag: {
    position: 'absolute',
    minHeight: 28,
    maxWidth: 88,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: radii.pill,
    borderWidth: 1,
    backgroundColor: 'rgba(255, 253, 249, 0.96)',
    shadowColor: colors.ink,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  selectedTag: { borderColor: colors.ink, borderWidth: 1.5 },
  point: { width: 8, height: 8, borderRadius: 4 },
});
