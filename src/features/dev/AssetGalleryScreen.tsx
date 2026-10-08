import { StyleSheet, View } from 'react-native';

import { ITEM_CATALOG } from '@/catalog/items';
import { AppPageHeader } from '@/components/ui/AppPageHeader';
import { AppText } from '@/components/ui/AppText';
import { EmptyState } from '@/components/ui/EmptyState';
import { ItemThumbnail } from '@/features/illustrated-ui/scene/ItemThumbnail';
import { ResponsiveGrid } from '@/components/layout/ResponsiveGrid';
import { ResponsivePage } from '@/components/layout/ResponsivePage';
import { colors, radii, spacing } from '@/theme/tokens';

export function AssetGalleryScreen({ enabled }: { enabled: boolean }) {
  if (!enabled) {
    return (
      <ResponsivePage>
        <AppPageHeader backHref="/settings" title="에셋 목록" />
        <EmptyState
          description="데모 또는 개발 모드에서만 임시 에셋을 확인할 수 있어요."
          title="개발용 화면이에요"
        />
      </ResponsivePage>
    );
  }

  const shopCount = ITEM_CATALOG.filter((item) => item.source === 'shop').length;
  const memoryCount = ITEM_CATALOG.length - shopCount;
  const placeholderCount = ITEM_CATALOG.filter((item) => item.assetStatus === 'placeholder').length;

  return (
    <ResponsivePage contentMaxWidth={1200} scroll testID="asset-gallery-page">
      <View style={styles.content}>
        <AppPageHeader backHref="/settings" title="에셋 목록" />
        <View accessibilityRole="summary" style={styles.summary}>
          <AppText variant="bodyStrong">상점 {shopCount} · 추억 {memoryCount}</AppText>
          <AppText tone="secondary" variant="caption">
            {placeholderCount === 0
              ? '55종 모두 상점·보관함·방에서 함께 사용하는 완성 일러스트예요.'
              : `완성 일러스트와 교체가 필요한 임시 에셋 ${placeholderCount}종을 구분해 표시해요.`}
          </AppText>
        </View>
        <ResponsiveGrid columnsByBreakpoint={{ compact: 1, medium: 3, wide: 4 }} maxColumns={4} minItemWidth={180} testID="asset-gallery-grid">
          {ITEM_CATALOG.map((item) => (
            <View key={item.id} style={styles.card}>
              <View style={styles.preview}>
                <ItemThumbnail itemId={item.id} style={styles.thumbnail} />
              </View>
              <AppText numberOfLines={2} variant="label">{item.nameKo}</AppText>
              <AppText tone="secondary" variant="caption">{item.category} · {item.size.width}×{item.size.height}</AppText>
              <AppText tone="tertiary" variant="caption">테마 {item.theme} · 형태 {item.silhouette}</AppText>
              <AppText tone="tertiary" variant="caption">기준점 {item.anchor.x},{item.anchor.y} · 레이어 {item.layerBias}</AppText>
              <AppText tone="tertiary" variant="caption">슬롯 {item.allowedSlotIds.join(', ')}</AppText>
              <AppText tone="tertiary" variant="caption">상호작용 {item.interaction}</AppText>
              <AppText tone="tertiary" variant="caption">썸네일/방 키 분리됨</AppText>
              <View
                accessible
                accessibilityLabel={item.assetStatus === 'final' ? '완성 에셋' : '임시 에셋'}
                style={[styles.badge, item.assetStatus === 'final' ? styles.finalBadge : styles.placeholderBadge]}
              >
                <AppText variant="caption">{item.assetStatus === 'final' ? '완성 일러스트' : '임시 에셋'}</AppText>
              </View>
            </View>
          ))}
        </ResponsiveGrid>
      </View>
    </ResponsivePage>
  );
}

const styles = StyleSheet.create({
  content: { gap: spacing.lg, paddingBottom: spacing.xl },
  summary: { gap: spacing.xs, padding: spacing.lg, borderRadius: radii.card, backgroundColor: colors.brandSoft },
  card: { gap: spacing.xs, padding: spacing.md, borderRadius: radii.card, backgroundColor: colors.surface },
  preview: { width: '100%', height: 112, borderRadius: radii.md, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surfaceSubtle, overflow: 'hidden' },
  thumbnail: { width: '92%', height: '92%' },
  badge: { alignSelf: 'flex-start', marginTop: spacing.xs, paddingHorizontal: spacing.sm, paddingVertical: spacing.xs, borderRadius: radii.pill },
  finalBadge: { backgroundColor: colors.successSoft },
  placeholderBadge: { backgroundColor: colors.warningSoft },
});
