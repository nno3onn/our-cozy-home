import { ScrollView, StyleSheet, View } from 'react-native';

import { ROOM_SLOT_SEED } from '@/catalog/catalogSeed';
import { getOwnInventoryItems, getPlacementSlots, getSelectablePlacementSlots } from '@/features/inventory/inventoryItems';
import { ITEM_BY_ID } from '@/catalog/items';
import { AppButton } from '@/components/ui/AppButton';
import { AppText } from '@/components/ui/AppText';
import { ItemThumbnail } from '@/features/illustrated-ui/scene/ItemThumbnail';
import type { HomeSnapshot, RoomPlacement } from '@/domain/models';
import { colors, radii, spacing } from '@/theme/tokens';

export function DecorateTray({
  aside = false,
  isOnline,
  isPending,
  onOpenShop,
  onPlace,
  onSelect,
  placement,
  selectedOwnedItemId,
  snapshot,
  slotId = 'floor-accent-left',
  onSelectSlot = () => undefined,
  placeLabel = '선택한 가구 놓기',
}: {
  aside?: boolean;
  slotId?: string;
  onSelectSlot?: (slotId: string) => void;
  placeLabel?: string;
  snapshot: HomeSnapshot;
  placement: RoomPlacement | undefined;
  selectedOwnedItemId: string | null;
  isOnline: boolean;
  isPending: boolean;
  onSelect: (ownedItemId: string) => void;
  onPlace: () => void;
  onOpenShop: () => void;
}) {
  const furniture = getOwnInventoryItems(snapshot).filter(item => getPlacementSlots(item).length > 0);
  const selected = furniture.find((item) => item.id === selectedOwnedItemId) ?? furniture.find((item) => item.ownerId === snapshot.currentUserId);
  const placed = snapshot.ownedItems.find((item) => item.id === placement?.ownedItemId);
  const placedDefinition = placed ? ITEM_BY_ID.get(placed.itemDefinitionId) : undefined;

  return (
    <ScrollView contentContainerStyle={styles.trayContent} nestedScrollEnabled accessibilityLabel={aside ? '꾸미기 보조 패널' : '꾸미기 보관함'} style={[styles.tray, aside && styles.aside]}>
      <View style={styles.header}>
        <View style={styles.headingCopy}>
          <AppText accessibilityRole="header" variant="sectionTitle">내 보관함</AppText>
          <AppText tone="secondary" variant="caption">배치할 가구 {furniture.length}개</AppText>
        </View>
        <AppButton label="상점" onPress={onOpenShop} tone="quiet" />
      </View>
      <AppText tone="secondary" variant="caption">{placedDefinition ? `${placedDefinition.nameKo} 배치 중` : '이 자리는 비어 있어요'}</AppText>
      <ScrollView style={styles.inventoryViewport} contentContainerStyle={[styles.items, aside && styles.asideItems]} nestedScrollEnabled horizontal={!aside} showsHorizontalScrollIndicator={false}>
        {furniture.map((item) => {
          const definition = ITEM_BY_ID.get(item.itemDefinitionId);
          const owner = snapshot.members.find((member) => member.userId === item.ownerId);
          const movable = item.ownerId === snapshot.currentUserId;
          if (!definition) return null;
          return (
            <View key={item.id} style={[styles.card, item.id === selected?.id && styles.selectedCard]}>
              <View style={styles.preview}><ItemThumbnail itemId={definition.id} style={styles.thumbnail} /></View>
              <AppText numberOfLines={1} variant="label">{definition.nameKo}</AppText>
              <AppText tone="secondary" variant="caption">소유자 {owner?.displayName ?? '알 수 없음'}</AppText>
              {movable ? <AppButton label={`${definition.nameKo} 선택`} onPress={() => onSelect(item.id)} selected={item.id === selected?.id} tone="quiet" /> : null}
            </View>
          );
        })}
      </ScrollView>
      {selected ? (
        <View style={styles.selection}>
          <AppText variant="label">선택: {ITEM_BY_ID.get(selected.itemDefinitionId)?.nameKo}</AppText>
          <View style={styles.slotChoices}>{getSelectablePlacementSlots(selected,snapshot).map(id=><AppButton key={id} label={ROOM_SLOT_SEED.find(slot=>slot.id===id)?.nameKo ?? id} selected={id===slotId} disabled={isPending} tone="quiet" onPress={()=>onSelectSlot(id)}/>)}</View>
          <AppButton disabled={!isOnline || isPending || placement?.ownedItemId === selected.id} label={placeLabel} onPress={onPlace} />
        </View>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  tray: { backgroundColor: colors.surface, borderTopLeftRadius: radii.sheet, borderTopRightRadius: radii.sheet, borderTopWidth: StyleSheet.hairlineWidth, borderColor: colors.border, maxHeight: '52%' },
  trayContent: { gap: spacing.md, padding: spacing.lg },
  inventoryViewport: { flexGrow: 0, flexShrink: 0 },
  aside: { borderRadius: radii.sheet, borderWidth: StyleSheet.hairlineWidth, flexGrow: 0, flexShrink: 0, maxHeight: '100%', width: 380 },
  header: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  headingCopy: { gap: 1 },
  items: { gap: spacing.sm, paddingVertical: spacing.xs },
  asideItems: { paddingBottom: spacing.md },
  card: { gap: spacing.xs, padding: spacing.sm, width: 156, borderRadius: radii.card, borderWidth: 1, borderColor: 'transparent' },
  selectedCard: { borderColor: colors.brand, backgroundColor: colors.brandSoft },
  preview: { alignItems: 'center', backgroundColor: colors.surfaceSubtle, borderRadius: radii.card, height: 96, justifyContent: 'center', width: '100%' },
  thumbnail: { height: '92%', width: '92%' },
  slotChoices: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  selection: { alignItems: 'stretch', flexDirection: 'column', gap: spacing.sm, justifyContent: 'space-between' },
});
