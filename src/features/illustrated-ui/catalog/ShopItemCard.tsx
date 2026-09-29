import { StyleSheet, View } from 'react-native';

import type { CatalogItem } from '@/domain/models';
import { AppButton } from '@/components/ui/AppButton';
import { AppText } from '@/components/ui/AppText';
import { Panel } from '@/components/ui/Panel';
import { illustratedColors } from '@/theme/illustratedTokens';

import { ItemThumbnail } from '../scene/ItemThumbnail';

export function ShopItemCard({ disabled, item, onPurchase }: { item: CatalogItem; disabled: boolean; onPurchase: () => void }) {
  return <Panel style={styles.card}>
    <View style={styles.art}><ItemThumbnail itemId={item.id} style={styles.thumbnail} /></View>
    <AppText numberOfLines={1} variant="label">{item.nameKo}</AppText>
    <View style={styles.meta}><AppText style={styles.price} variant="caption">● {item.price}</AppText><AppText tone="muted" variant="caption">{item.assetStatus === 'final' ? '최종 에셋' : '임시 에셋'}</AppText></View>
    <AppButton accessibilityLabel={`${item.nameKo} 구매`} disabled={disabled} label="구매" onPress={onPurchase} />
  </Panel>;
}

const styles = StyleSheet.create({ card: { flexGrow: 1, gap: 7, minWidth: 142, padding: 10 }, art: { alignItems: 'center', backgroundColor: '#FFF1DF', borderRadius: 15, height: 112, justifyContent: 'center' }, thumbnail: { height: '94%', width: '94%' }, meta: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' }, price: { color: illustratedColors.cocoa, fontWeight: '700' } });
