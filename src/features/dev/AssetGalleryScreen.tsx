import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ITEM_CATALOG } from '@/catalog/items';
import { AppText } from '@/components/ui/AppText';
import { EmptyState } from '@/components/ui/EmptyState';
import { Panel } from '@/components/ui/Panel';
import { colors, radii, spacing } from '@/theme/tokens';

export function AssetGalleryScreen({ enabled }: { enabled: boolean }) {
  if (!enabled) {
    return (
      <SafeAreaView style={styles.centered}>
        <EmptyState
          description="데모 또는 개발 모드에서만 임시 에셋을 확인할 수 있어요."
          title="개발용 화면이에요"
        />
      </SafeAreaView>
    );
  }

  const shopCount = ITEM_CATALOG.filter((item) => item.source === 'shop').length;
  const memoryCount = ITEM_CATALOG.length - shopCount;

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content}>
        <AppText variant="title">에셋 목록</AppText>
        <AppText tone="muted">상점 {shopCount} · 추억 {memoryCount}</AppText>
        <AppText tone="muted" variant="caption">
          아래 도형은 교체 가능한 제작용 자리표시자이며 최종 이미지가 아니에요.
        </AppText>
        <View style={styles.grid}>
          {ITEM_CATALOG.map((item) => (
            <Panel key={item.id} style={styles.card}>
              <View
                accessibilityLabel={`${item.nameKo} 방 크기 미리보기`}
                style={[
                  styles.preview,
                  {
                    backgroundColor: item.previewColor,
                    borderTopLeftRadius: item.silhouette.includes('star') ? 28 : radii.md,
                    transform: [{ scaleX: item.size.width >= item.size.height ? 1 : 0.72 }],
                  },
                ]}
              />
              <AppText numberOfLines={2} variant="label">{item.nameKo}</AppText>
              <AppText tone="muted" variant="caption">{item.category} · {item.size.width}×{item.size.height}</AppText>
              <AppText tone="muted" variant="caption">테마 {item.theme} · 형태 {item.silhouette}</AppText>
              <AppText tone="muted" variant="caption">기준점 {item.anchor.x},{item.anchor.y} · 레이어 {item.layerBias}</AppText>
              <AppText tone="muted" variant="caption">슬롯 {item.allowedSlotIds.join(', ')}</AppText>
              <AppText tone="muted" variant="caption">상호작용 {item.interaction}</AppText>
              <AppText tone="muted" variant="caption">썸네일/방 키 분리됨</AppText>
              <View style={styles.badge}>
                <AppText variant="caption">임시 에셋</AppText>
              </View>
            </Panel>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.cream },
  centered: { flex: 1, justifyContent: 'center', padding: spacing.lg, backgroundColor: colors.cream },
  content: { width: '100%', maxWidth: 1120, alignSelf: 'center', gap: spacing.sm, padding: spacing.lg, paddingBottom: spacing.xxl },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md, marginTop: spacing.md },
  card: { width: '47%', gap: spacing.xs, padding: spacing.md },
  preview: { width: '100%', height: 88, borderRadius: radii.md, borderWidth: 2, borderColor: colors.ink },
  badge: { alignSelf: 'flex-start', marginTop: spacing.xs, paddingHorizontal: spacing.sm, paddingVertical: spacing.xs, borderRadius: radii.pill, backgroundColor: colors.floor },
});
