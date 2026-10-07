import { StyleSheet, View } from 'react-native';

import type { CatalogItem } from '@/domain/models';
import { AppButton } from '@/components/ui/AppButton';
import { AppText } from '@/components/ui/AppText';
import { colors, radii, spacing } from '@/theme/tokens';

import { ItemThumbnail } from '../scene/ItemThumbnail';

export function ShopItemCard({ disabled, item, onPurchase }: { item: CatalogItem; disabled: boolean; onPurchase: () => void }) {
  return <View style={styles.card}>
    <View style={styles.art}><ItemThumbnail itemId={item.id} style={styles.thumbnail} /></View>
    <AppText numberOfLines={1} variant="label">{item.nameKo}</AppText>
    <View style={styles.meta}><AppText tone="brand" variant="bodyStrong">{item.price.toLocaleString()} 코인</AppText><AppText tone="secondary" variant="caption">{item.category === 'snack' ? '동물 간식' : '생활 가구'}</AppText></View>
    <AppButton accessibilityLabel={`${item.nameKo} 구매`} disabled={disabled} label="구매" onPress={onPurchase} tone="quiet" />
  </View>;
}

const styles = StyleSheet.create({ card: { flexGrow: 1, gap: spacing.sm, minWidth: 0 }, art: { alignItems: 'center', backgroundColor: colors.surfaceSubtle, borderRadius: radii.card, aspectRatio: 1, justifyContent: 'center' }, thumbnail: { height: '94%', width: '94%' }, meta: { gap: 2 } });
