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
    <View style={styles.meta}><AppText style={styles.price} variant="caption">● {item.price}</AppText><AppText tone="muted" variant="caption">{item.category === 'snack' ? '동물 간식' : '생활 가구'}</AppText></View>
    <AppButton accessibilityLabel={`${item.nameKo} 구매`} disabled={disabled} label="구매" onPress={onPurchase} />
  </Panel>;
}

const styles = StyleSheet.create({ card: { flexGrow: 1, gap: 8, minWidth: 142, padding: 12 }, art: { alignItems: 'center', backgroundColor: '#FFF4E5', borderRadius: 14, height: 124, justifyContent: 'center' }, thumbnail: { height: '94%', width: '94%' }, meta: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' }, price: { color: illustratedColors.cocoa, fontWeight: '700' } });
