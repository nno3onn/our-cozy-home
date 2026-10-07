import { StyleSheet, View } from 'react-native';

import { ITEM_BY_ID } from '@/catalog/items';
import { ResponsiveGrid } from '@/components/layout/ResponsiveGrid';
import { ResponsivePage } from '@/components/layout/ResponsivePage';
import { AppPageHeader } from '@/components/ui/AppPageHeader';
import { AppText } from '@/components/ui/AppText';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';
import { ItemThumbnail } from '@/features/illustrated-ui/scene/ItemThumbnail';
import { useHomeSnapshot } from '@/features/room/hooks/useHomeSnapshot';
import { colors, radii, spacing } from '@/theme/tokens';

export function InventoryScreen() {
  const home = useHomeSnapshot();
  if (!home.data) {
    return <ResponsivePage><AppPageHeader backHref="/shop" title="내 보관함" /><View accessibilityLabel="보관함을 불러오는 중" style={styles.loading}><Skeleton height={44} /><Skeleton height={180} /></View></ResponsivePage>;
  }

  const items = home.data.ownedItems.filter((item) => item.ownerId === home.data.currentUserId);
  return (
    <ResponsivePage contentMaxWidth={1120} scroll testID="inventory-page">
      <View style={styles.content}>
        <AppPageHeader backHref="/shop" title="내 보관함" />
        <AppText tone="secondary">내가 구매하거나 추억으로 만든 물건이에요.</AppText>
        {items.length === 0 ? (
          <EmptyState title="아직 가진 아이템이 없어요" description="상점에서 마음에 드는 물건을 골라 보세요." />
        ) : (
          <ResponsiveGrid columnsByBreakpoint={{ compact: 2, medium: 3, wide: 4 }} maxColumns={4} testID="inventory-grid">
            {items.map((item) => {
              const definition = ITEM_BY_ID.get(item.itemDefinitionId);
              const name = definition?.nameKo ?? item.itemDefinitionId;
              return (
                <View key={item.id} style={styles.item}>
                  <View style={styles.preview}><ItemThumbnail itemId={definition?.id ?? item.itemDefinitionId} style={styles.thumbnail} /></View>
                  <AppText numberOfLines={1} variant="label">{name}</AppText>
                  <AppText tone="secondary" variant="caption">수량 {item.quantity} · 내 소유</AppText>
                </View>
              );
            })}
          </ResponsiveGrid>
        )}
      </View>
    </ResponsivePage>
  );
}

const styles = StyleSheet.create({
  content: { gap: spacing.lg, paddingBottom: spacing.xl },
  loading: { gap: spacing.lg, paddingTop: spacing.xl },
  item: { gap: spacing.sm },
  preview: { aspectRatio: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surfaceSubtle, borderRadius: radii.card },
  thumbnail: { width: '94%', height: '94%' },
});
