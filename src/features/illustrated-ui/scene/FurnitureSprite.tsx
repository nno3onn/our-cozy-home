import { Image, StyleSheet, View, type ImageStyle, type StyleProp } from 'react-native';

import { ITEM_BY_ID, type ItemCategory } from '@/catalog/items';
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

  return <MiniaturePlaceholder category={item?.category} color={item?.previewColor ?? illustratedColors.peach} label={item?.nameKo ?? '가구'} style={style} />;
}

const categoryLabel: Record<ItemCategory, string> = {
  curtain: '커튼',
  table: '탁자',
  cushion: '쿠션',
  rug: '러그',
  bed: '침대',
  lighting: '조명',
  plant: '식물',
  snack: '간식',
  'dining-table': '탁자',
  radio: '라디오',
  frame: '액자',
};

function MiniaturePlaceholder({ category, color, label, style }: { category?: ItemCategory; color: string; label: string; style?: StyleProp<ImageStyle> }) {
  const kind = category === 'dining-table' ? 'table' : category;
  const accessibilityLabel = `${label} 미니어처 ${category ? categoryLabel[category] : '가구'}`;

  return (
    <View accessibilityLabel={accessibilityLabel} style={[styles.placeholder, style]}>
      {kind === 'curtain' ? <><View style={styles.curtainRod} /><View style={[styles.curtainPanel, styles.curtainLeft, { backgroundColor: color }]} /><View style={[styles.curtainPanel, styles.curtainRight, { backgroundColor: color }]} /></> : null}
      {kind === 'table' ? <><View style={[styles.tableTop, { backgroundColor: color }]} /><View style={[styles.tableLeg, styles.tableLegLeft, { backgroundColor: color }]} /><View style={[styles.tableLeg, styles.tableLegRight, { backgroundColor: color }]} /></> : null}
      {kind === 'cushion' ? <><View style={[styles.cushionBack, { backgroundColor: color }]} /><View style={[styles.cushionFront, { backgroundColor: color }]} /></> : null}
      {kind === 'rug' ? <View style={[styles.rug, { backgroundColor: color }]}><View style={styles.rugInset} /></View> : null}
      {kind === 'bed' ? <><View style={[styles.headboard, { backgroundColor: color }]} /><View style={styles.mattress}><View style={styles.pillow} /></View></> : null}
      {kind === 'lighting' ? <><View style={[styles.lampShade, { backgroundColor: color }]} /><View style={styles.lampStem} /><View style={styles.lampBase} /></> : null}
      {kind === 'plant' ? <><View style={[styles.plantLeaf, styles.plantLeafLeft, { backgroundColor: color }]} /><View style={[styles.plantLeaf, styles.plantLeafCenter, { backgroundColor: color }]} /><View style={[styles.plantLeaf, styles.plantLeafRight, { backgroundColor: color }]} /><View style={styles.plantPot} /></> : null}
      {kind === 'snack' ? <><View style={styles.snackPlate} /><View style={[styles.snackBite, styles.snackBiteLeft, { backgroundColor: color }]} /><View style={[styles.snackBite, styles.snackBiteCenter, { backgroundColor: color }]} /><View style={[styles.snackBite, styles.snackBiteRight, { backgroundColor: color }]} /></> : null}
      {kind === 'radio' ? <><View style={[styles.radioBody, { backgroundColor: color }]}><View style={styles.radioDial} /><View style={styles.radioSpeaker} /></View><View style={styles.radioHandle} /></> : null}
      {kind === 'frame' ? <View style={[styles.frame, { borderColor: color }]}><View style={[styles.framePicture, { backgroundColor: color }]} /></View> : null}
      {!kind ? <View style={[styles.generic, { backgroundColor: color }]} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  image: { width: '100%', height: '100%' },
  placeholder: { alignItems: 'center', height: '100%', justifyContent: 'center', overflow: 'hidden', width: '100%' },
  curtainRod: { backgroundColor: illustratedColors.cocoa, borderRadius: 4, height: '5%', position: 'absolute', top: '13%', width: '74%' },
  curtainPanel: { borderColor: illustratedColors.line, borderRadius: 12, borderWidth: 1, height: '62%', position: 'absolute', top: '17%', width: '28%' },
  curtainLeft: { left: '17%' }, curtainRight: { right: '17%' },
  tableTop: { borderColor: illustratedColors.line, borderRadius: 999, borderWidth: 1.5, height: '32%', position: 'absolute', top: '25%', width: '82%' },
  tableLeg: { borderRadius: 6, height: '28%', position: 'absolute', top: '49%', width: '10%' },
  tableLegLeft: { left: '26%', transform: [{ rotate: '10deg' }] }, tableLegRight: { right: '26%', transform: [{ rotate: '-10deg' }] },
  cushionBack: { borderColor: illustratedColors.line, borderRadius: 999, borderWidth: 1.5, height: '48%', position: 'absolute', top: '23%', width: '76%' },
  cushionFront: { backgroundColor: 'rgba(255,255,255,0.32)', borderColor: illustratedColors.line, borderRadius: 999, borderWidth: 1, height: '27%', position: 'absolute', top: '47%', width: '66%' },
  rug: { alignItems: 'center', borderColor: illustratedColors.line, borderRadius: 999, borderWidth: 1.5, height: '44%', justifyContent: 'center', width: '88%' },
  rugInset: { borderColor: 'rgba(255,255,255,0.75)', borderRadius: 999, borderWidth: 2, height: '52%', width: '73%' },
  headboard: { borderColor: illustratedColors.line, borderRadius: 12, borderWidth: 1.5, height: '46%', left: '15%', position: 'absolute', top: '17%', width: '70%' },
  mattress: { backgroundColor: '#FFF8E8', borderColor: illustratedColors.line, borderRadius: 12, borderWidth: 1.5, height: '34%', position: 'absolute', top: '49%', width: '80%' },
  pillow: { backgroundColor: '#FFFFFF', borderRadius: 999, height: '45%', left: '12%', position: 'absolute', top: '18%', width: '30%' },
  lampShade: { borderColor: illustratedColors.line, borderRadius: 9, borderWidth: 1.5, height: '30%', position: 'absolute', top: '13%', transform: [{ perspective: 20 }, { rotateX: '6deg' }], width: '48%' },
  lampStem: { backgroundColor: illustratedColors.cocoa, height: '33%', position: 'absolute', top: '39%', width: '5%' }, lampBase: { backgroundColor: illustratedColors.cocoa, borderRadius: 999, height: '8%', position: 'absolute', top: '72%', width: '38%' },
  plantLeaf: { borderColor: illustratedColors.line, borderRadius: 999, borderWidth: 1, height: '34%', position: 'absolute', top: '22%', width: '29%' },
  plantLeafLeft: { left: '22%', transform: [{ rotate: '-32deg' }] }, plantLeafCenter: { top: '13%' }, plantLeafRight: { right: '22%', transform: [{ rotate: '32deg' }] },
  plantPot: { backgroundColor: '#FFF8E8', borderColor: illustratedColors.line, borderRadius: 10, borderWidth: 1.5, bottom: '10%', height: '34%', position: 'absolute', width: '39%' },
  snackPlate: { backgroundColor: '#FFF8E8', borderColor: illustratedColors.line, borderRadius: 999, borderWidth: 1.5, bottom: '18%', height: '25%', position: 'absolute', width: '76%' },
  snackBite: { borderColor: illustratedColors.line, borderRadius: 999, borderWidth: 1, height: '23%', position: 'absolute', top: '34%', width: '20%' }, snackBiteLeft: { left: '20%' }, snackBiteCenter: {}, snackBiteRight: { right: '20%' },
  radioBody: { alignItems: 'center', borderColor: illustratedColors.line, borderRadius: 13, borderWidth: 1.5, height: '47%', justifyContent: 'space-evenly', marginTop: '11%', width: '74%', flexDirection: 'row' },
  radioDial: { backgroundColor: '#FFF8E8', borderColor: illustratedColors.line, borderRadius: 999, borderWidth: 1, height: '34%', width: '17%' }, radioSpeaker: { borderColor: 'rgba(75,55,43,0.55)', borderRadius: 999, borderWidth: 2, height: '44%', width: '25%' },
  radioHandle: { borderColor: illustratedColors.line, borderRadius: 999, borderWidth: 2, height: '18%', position: 'absolute', top: '13%', width: '36%' },
  frame: { alignItems: 'center', backgroundColor: '#FFF8E8', borderRadius: 8, borderWidth: 8, height: '74%', justifyContent: 'center', width: '64%' }, framePicture: { borderRadius: 4, height: '78%', opacity: 0.5, width: '78%' },
  generic: { borderColor: illustratedColors.line, borderRadius: 18, borderWidth: 2, height: '65%', width: '70%' },
});
