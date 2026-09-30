import { Children, type PropsWithChildren } from 'react';
import * as ReactNative from 'react-native';

import { spacing } from '@/theme/tokens';

import { useResponsiveLayout } from './ResponsivePage';

type ResponsiveGridProps = PropsWithChildren<{
  maxColumns?: 1 | 2 | 3 | 4;
  minItemWidth?: number;
  testID?: string;
}>;

function basisFor(columns: number) {
  if (columns <= 1) return '100%';
  if (columns === 2) return '48%';
  if (columns === 3) return '31%';
  return '23%';
}

export function ResponsiveGrid({ children, maxColumns = 3, minItemWidth = 156, testID }: ResponsiveGridProps) {
  const { gridColumns } = useResponsiveLayout();
  const columns = Math.min(gridColumns, maxColumns);

  return (
    <ReactNative.View style={styles.grid} testID={testID ? `${testID}-${columns}` : undefined}>
      {Children.toArray(children).map((child, index) => (
        <ReactNative.View key={`grid-item-${index}`} style={[styles.item, { flexBasis: basisFor(columns), minWidth: minItemWidth }]}>
          {child}
        </ReactNative.View>
      ))}
    </ReactNative.View>
  );
}

const styles = ReactNative.StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  item: { flexGrow: 1, minWidth: 0 },
});
