import { StyleSheet, View } from 'react-native';

import { ITEM_BY_ID } from '@/catalog/items';
import { AppText } from '@/components/ui/AppText';
import { EmptyState } from '@/components/ui/EmptyState';
import { Panel } from '@/components/ui/Panel';
import { useHomeSnapshot } from '@/features/room/hooks/useHomeSnapshot';
import { ResponsiveGrid } from '@/components/layout/ResponsiveGrid';
import { ResponsivePage } from '@/components/layout/ResponsivePage';
import { spacing } from '@/theme/tokens';

export function InventoryScreen() {
  const home = useHomeSnapshot();
  if (!home.data) return <ResponsivePage fallbackHref="/shop"><EmptyState title="보관함을 불러오는 중이에요" description="잠시 후 다시 시도해 주세요." /></ResponsivePage>;
  const items = home.data.ownedItems.filter((item) => item.ownerId === home.data.currentUserId);
  return <ResponsivePage contentMaxWidth={960} fallbackHref="/shop" scroll testID="inventory-page"><View style={styles.content}>
    <AppText variant="title">내 보관함</AppText>
    {items.length === 0 ? <EmptyState title="아직 가진 아이템이 없어요" description="상점에서 마음에 드는 물건을 골라 보세요." /> : <ResponsiveGrid testID="inventory-grid">{items.map((item) => {
      const definition = ITEM_BY_ID.get(item.itemDefinitionId);
      return <Panel key={item.id} style={styles.item}><AppText variant="label">{definition?.nameKo ?? item.itemDefinitionId}</AppText><AppText tone="muted" variant="caption">수량 {item.quantity} · 내 소유</AppText></Panel>;
    })}</ResponsiveGrid>}
  </View></ResponsivePage>;
}
const styles = StyleSheet.create({ content: { gap: spacing.md, paddingBottom: spacing.lg }, item: { gap: spacing.xs, padding: spacing.md } });
