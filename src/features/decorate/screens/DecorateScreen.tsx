import { ScrollView, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ITEM_BY_ID } from '@/catalog/items';
import { AppButton } from '@/components/ui/AppButton';
import { AppText } from '@/components/ui/AppText';
import { EmptyState } from '@/components/ui/EmptyState';
import { Panel } from '@/components/ui/Panel';
import { useHomeSnapshot } from '@/features/room/hooks/useHomeSnapshot';
import { colors, radii, spacing } from '@/theme/tokens';

import { usePlaceItem } from '../hooks/usePlaceItem';
import { useDecorateStore } from '../store/useDecorateStore';

const SLOT_ID = 'floor-accent-left';

export function DecorateScreen() {
  const router = useRouter();
  const homeQuery = useHomeSnapshot();
  const placeMutation = usePlaceItem();
  const selectedOwnedItemId = useDecorateStore((state) => state.selectedOwnedItemId);
  const setSelectedOwnedItemId = useDecorateStore((state) => state.setSelectedOwnedItemId);

  if (!homeQuery.data) {
    return (
      <SafeAreaView style={styles.centered}>
        <EmptyState description="보관함을 불러온 뒤 다시 시도해 주세요." title="가구를 찾지 못했어요" />
      </SafeAreaView>
    );
  }

  const { members, ownedItems, placements } = homeQuery.data;
  const furniture = ownedItems.filter(
    (item) => item.kind === 'furniture' && item.allowedSlotIds.includes(SLOT_ID),
  );
  const placement = placements.find((candidate) => candidate.slotId === SLOT_ID);
  const effectiveOwnedItemId = selectedOwnedItemId ?? placement?.ownedItemId ?? furniture[0]?.id ?? null;
  const selectedOwnedItem = furniture.find((item) => item.id === effectiveOwnedItemId);
  const selectedDefinition = selectedOwnedItem
    ? ITEM_BY_ID.get(selectedOwnedItem.itemDefinitionId)
    : undefined;
  const owner = selectedOwnedItem
    ? members.find((member) => member.userId === selectedOwnedItem.ownerId)
    : undefined;
  const placedItem = placement
    ? furniture.find((item) => item.id === placement.ownedItemId)
    : undefined;
  const placedDefinition = placedItem ? ITEM_BY_ID.get(placedItem.itemDefinitionId) : undefined;

  const placeSelected = () => {
    if (!selectedOwnedItem) return;
    placeMutation.mutate({
      ownedItemId: selectedOwnedItem.id,
      slotId: SLOT_ID,
      expectedVersion: placement?.version ?? 0,
    });
  };

  return (
    <SafeAreaView edges={['left', 'right']} style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content}>
        <AppText variant="title">꾸미기</AppText>
        <AppButton label="상점 열기" onPress={() => router.push('/shop')} tone="secondary" />
        <Panel style={styles.previewPanel}>
          <AppText variant="heading">왼쪽 포근 자리</AppText>
          <View
            style={[
              styles.preview,
              { backgroundColor: placedDefinition?.previewColor ?? colors.floor },
            ]}
          />
          <AppText variant="label">
            {placedDefinition ? `${placedDefinition.nameKo} 배치 중` : '빈 자리'}
          </AppText>
          <AppText tone="muted" variant="caption">
            배치 버전 {placement?.version ?? 0} · 서버가 같은 슬롯의 충돌을 확인해요.
          </AppText>
        </Panel>

        <AppText variant="heading">이 자리에 놓을 가구</AppText>
        <View style={styles.options}>
          {furniture.map((item) => {
            const definition = ITEM_BY_ID.get(item.itemDefinitionId);
            if (!definition) return null;
            const itemOwner = members.find((member) => member.userId === item.ownerId);
            const selected = item.id === effectiveOwnedItemId;
            return (
              <Panel key={item.id} style={[styles.option, selected && styles.selectedOption]}>
                <View style={[styles.swatch, { backgroundColor: definition.previewColor }]} />
                <AppText variant="label">{definition.nameKo}</AppText>
                <AppText tone="muted" variant="caption">소유자 {itemOwner?.displayName ?? '알 수 없음'}</AppText>
                <AppButton
                  label={`${definition.nameKo} 선택`}
                  onPress={() => setSelectedOwnedItemId(item.id)}
                  tone={selected ? 'secondary' : 'quiet'}
                />
              </Panel>
            );
          })}
        </View>

        {selectedDefinition ? (
          <Panel style={styles.selection}>
            <AppText variant="label">선택: {selectedDefinition.nameKo}</AppText>
            <AppText tone="muted" variant="caption">소유자 {owner?.displayName ?? '알 수 없음'}</AppText>
            <AppButton
              disabled={placeMutation.isPending || placement?.ownedItemId === selectedOwnedItem?.id}
              label="선택한 가구 놓기"
              onPress={placeSelected}
            />
            {placeMutation.isError ? (
              <AppText tone="danger" variant="caption">
                배치가 바뀌었어요. 최신 상태를 불러온 뒤 다시 선택해 주세요.
              </AppText>
            ) : null}
          </Panel>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.cream },
  centered: { flex: 1, justifyContent: 'center', padding: spacing.lg, backgroundColor: colors.cream },
  content: { width: '100%', maxWidth: 960, alignSelf: 'center', gap: spacing.lg, padding: spacing.lg, paddingBottom: spacing.xxl },
  previewPanel: { gap: spacing.sm, padding: spacing.lg },
  preview: { width: '100%', height: 112, borderWidth: 2, borderColor: colors.ink, borderRadius: radii.lg },
  options: { flexDirection: 'row', gap: spacing.md },
  option: { flex: 1, gap: spacing.sm, padding: spacing.md },
  selectedOption: { borderColor: colors.peach, borderWidth: 3 },
  swatch: { height: 58, borderRadius: radii.md, borderWidth: 2, borderColor: colors.ink },
  selection: { gap: spacing.sm, padding: spacing.lg },
});
