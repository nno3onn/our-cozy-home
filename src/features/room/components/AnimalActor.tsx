import { useEffect } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  cancelAnimation,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import type { Animal, Member } from '@/domain/models';
import type { AnimalAnchor, Viewport } from '@/game/room/roomLayout';
import { toViewport } from '@/game/room/roomLayout';
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
  isActive,
  viewport,
  selected,
  onPress,
}: AnimalActorProps) {
  const foot = toViewport(anchor.foot, viewport);
  const reducedMotion = useReducedMotion();
  const lift = useSharedValue(0);

  useEffect(() => {
    if (!isActive || reducedMotion) {
      cancelAnimation(lift);
      lift.value = 0;
      return;
    }

    lift.value = withRepeat(withTiming(-3, { duration: 1100 }), -1, true);
    return () => cancelAnimation(lift);
  }, [isActive, lift, reducedMotion]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: lift.value }],
  }));

  return (
    <Pressable
      accessibilityLabel={`${animal.name} 동물 선택`}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={[
        styles.target,
        {
          left: foot.x - 26,
          top: foot.y - 78,
        },
      ]}
    >
      <Animated.View
        style={[
          styles.nameTag,
          { borderColor: member.pointColor },
          selected && styles.selectedTag,
          animatedStyle,
        ]}
      >
        <View style={[styles.point, { backgroundColor: member.pointColor }]} />
        <AppText numberOfLines={1} variant="caption">
          {animal.name}
        </AppText>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  target: {
    position: 'absolute',
    width: 52,
    height: 60,
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: 0,
  },
  nameTag: {
    minHeight: 28,
    maxWidth: 88,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: radii.pill,
    borderWidth: 2,
    backgroundColor: colors.paper,
  },
  selectedTag: { borderColor: colors.ink, transform: [{ scale: 1.04 }] },
  point: { width: 8, height: 8, borderRadius: 4 },
});
