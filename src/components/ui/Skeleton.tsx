import type { DimensionValue, ViewProps } from 'react-native';
import { StyleSheet, View } from 'react-native';

import { colors, radii } from '@/theme/tokens';

type SkeletonProps = ViewProps & {
  height: number;
  radius?: number;
  reducedMotion?: boolean;
  width?: DimensionValue;
};

export function Skeleton({ height, radius = radii.control, reducedMotion: _reducedMotion, style, width = '100%', ...props }: SkeletonProps) {
  return <View {...props} accessible={false} style={[styles.base, { borderRadius: radius, height, width }, style]} />;
}

const styles = StyleSheet.create({
  base: { overflow: 'hidden', backgroundColor: colors.surfaceSubtle },
});
