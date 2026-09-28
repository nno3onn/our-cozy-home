import { Image, StyleSheet, View, type ImageStyle, type StyleProp } from 'react-native';

import { ITEM_BY_ID } from '@/catalog/items';
import { illustratedColors } from '@/theme/illustratedTokens';

import { getIllustratedAsset } from './assetManifest';

type Props = {
  itemId: string;
  style?: StyleProp<ImageStyle>;
};

export function FurnitureSprite({ itemId, style }: Props) {
  const item = ITEM_BY_ID.get(itemId);
  const asset = item ? getIllustratedAsset(item.roomAssetKey) : undefined;

  if (asset?.source) {
    return <Image accessibilityLabel={item?.nameKo} resizeMode="contain" source={asset.source} style={[styles.image, style]} />;
  }

  return <View accessibilityLabel={item?.nameKo ?? '가구 자리표시자'} style={[styles.placeholder, { backgroundColor: item?.previewColor ?? illustratedColors.peach }, style]} />;
}

const styles = StyleSheet.create({
  image: { width: '100%', height: '100%' },
  placeholder: { width: '100%', height: '100%', borderRadius: 18, borderWidth: 2, borderColor: illustratedColors.line },
});
