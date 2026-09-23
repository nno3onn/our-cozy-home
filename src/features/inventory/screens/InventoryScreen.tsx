import { ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ITEM_BY_ID } from '@/catalog/items';
import { AppText } from '@/components/ui/AppText';
import { EmptyState } from '@/components/ui/EmptyState';
import { Panel } from '@/components/ui/Panel';
import { useHomeSnapshot } from '@/features/room/hooks/useHomeSnapshot';
import { colors, spacing } from '@/theme/tokens';

export function InventoryScreen() {
  const home = useHomeSnapshot();
  if (!home.data) return <SafeAreaView style={styles.safe}><EmptyState title="보관함을 불러오는 중이에요" description="잠시 후 다시 시도해 주세요." /></SafeAreaView>;
  const items = home.data.ownedItems.filter((item) => item.ownerId === home.data.currentUserId);
  return <SafeAreaView style={styles.safe}><ScrollView contentContainerStyle={styles.content}>
    <AppText variant="title">내 보관함</AppText>
    {items.length === 0 ? <EmptyState title="아직 가진 아이템이 없어요" description="상점에서 마음에 드는 물건을 골라 보세요." /> : items.map((item) => {
      const definition = ITEM_BY_ID.get(item.itemDefinitionId);
      return <Panel key={item.id} style={styles.item}><AppText variant="label">{definition?.nameKo ?? item.itemDefinitionId}</AppText><AppText tone="muted" variant="caption">수량 {item.quantity} · 내 소유</AppText></Panel>;
    })}
  </ScrollView></SafeAreaView>;
}
const styles = StyleSheet.create({ safe: { flex: 1, backgroundColor: colors.cream, padding: spacing.lg }, content: { gap: spacing.md, paddingBottom: spacing.xxl }, item: { gap: spacing.xs, padding: spacing.md } });
