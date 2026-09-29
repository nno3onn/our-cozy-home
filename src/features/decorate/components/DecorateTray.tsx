import { ScrollView, StyleSheet, View } from 'react-native';

import { ITEM_BY_ID } from '@/catalog/items';
import { AppButton } from '@/components/ui/AppButton';
import { AppText } from '@/components/ui/AppText';
import { Panel } from '@/components/ui/Panel';
import { ItemThumbnail } from '@/features/illustrated-ui/scene/ItemThumbnail';
import type { HomeSnapshot, RoomPlacement } from '@/domain/models';
import { colors, radii, spacing } from '@/theme/tokens';

export function DecorateTray({
  isOnline,
  isPending,
  onOpenShop,
  onPlace,
  onSelect,
  placement,
  selectedOwnedItemId,
  snapshot,
}: {
  snapshot: HomeSnapshot;
  placement: RoomPlacement | undefined;
  selectedOwnedItemId: string | null;
  isOnline: boolean;
  isPending: boolean;
  onSelect: (ownedItemId: string) => void;
  onPlace: () => void;
  onOpenShop: () => void;
}) {
  const furniture = snapshot.ownedItems.filter((item) => item.kind === 'furniture' && item.allowedSlotIds.includes('floor-accent-left'));
  const selected = furniture.find((item) => item.id === selectedOwnedItemId) ?? furniture.find((item) => item.ownerId === snapshot.currentUserId);
  const placed = snapshot.ownedItems.find((item) => item.id === placement?.ownedItemId);
  const placedDefinition = placed ? ITEM_BY_ID.get(placed.itemDefinitionId) : undefined;

  return (
    <View accessibilityLabel="꾸미기 보관함" style={styles.tray}>
      <View style={styles.header}>
        <AppText variant="heading">보관함</AppText>
        <AppButton label="상점" onPress={onOpenShop} tone="quiet" />
      </View>
      <AppText tone="muted" variant="caption">{placedDefinition ? `${placedDefinition.nameKo} 배치 중` : '이 자리는 비어 있어요'}</AppText>
      <ScrollView contentContainerStyle={styles.items} horizontal showsHorizontalScrollIndicator={false}>
        {furniture.map((item) => {
          const definition = ITEM_BY_ID.get(item.itemDefinitionId);
          const owner = snapshot.members.find((member) => member.userId === item.ownerId);
          const movable = item.ownerId === snapshot.currentUserId;
          if (!definition) return null;
          return (
            <Panel key={item.id} style={[styles.card, item.id === selected?.id && styles.selectedCard]}>
              <View style={styles.preview}><ItemThumbnail itemId={definition.id} style={styles.thumbnail} /></View>
              <AppText numberOfLines={1} variant="label">{definition.nameKo}</AppText>
              <AppText tone="muted" variant="caption">소유자 {owner?.displayName ?? '알 수 없음'}</AppText>
              {movable ? <AppButton label={`${definition.nameKo} 선택`} onPress={() => onSelect(item.id)} tone="quiet" /> : null}
            </Panel>
          );
        })}
      </ScrollView>
      {selected ? (
        <View style={styles.selection}>
          <AppText variant="label">선택: {ITEM_BY_ID.get(selected.itemDefinitionId)?.nameKo}</AppText>
          <AppButton disabled={!isOnline || isPending || placement?.ownedItemId === selected.id} label="선택한 가구 놓기" onPress={onPlace} />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  tray: { backgroundColor: colors.paper, borderTopLeftRadius: radii.scene, borderTopRightRadius: radii.scene, borderWidth: 1.5, borderColor: colors.line, gap: spacing.sm, maxHeight: '52%', padding: spacing.md, shadowColor: '#8D684C', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.12, shadowRadius: 12 },
  header: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  items: { gap: spacing.sm, paddingVertical: spacing.xs },
  card: { gap: spacing.xs, padding: spacing.sm, width: 142 },
  selectedCard: { borderColor: colors.coral, borderWidth: 2 },
  preview: { alignItems: 'center', backgroundColor: colors.surface, borderRadius: radii.card, height: 82, justifyContent: 'center', width: '100%' },
  thumbnail: { height: '92%', width: '92%' },
  selection: { alignItems: 'center', flexDirection: 'row', gap: spacing.sm, justifyContent: 'space-between' },
});
