import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { FurnitureSprite } from './FurnitureSprite';

type Props = {
  itemId: string;
  style?: StyleProp<ViewStyle>;
};

export function ItemThumbnail({ itemId, style }: Props) {
  return (
    <View style={[styles.frame, style]}>
      <FurnitureSprite itemId={itemId} />
    </View>
  );
}

const styles = StyleSheet.create({
  frame: { width: 84, height: 74, overflow: 'hidden', justifyContent: 'center', alignItems: 'center' },
});
