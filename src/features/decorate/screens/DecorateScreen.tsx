import { StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ITEM_BY_ID } from '@/catalog/items';
import { EmptyState } from '@/components/ui/EmptyState';
import { OfflineReadOnlyBanner } from '@/components/OfflineReadOnlyBanner';
import { HouseGameShell } from '@/features/house-shell/components/HouseGameShell';
import { RoomCanvas } from '@/features/room/components/RoomCanvas';
import { useHomeSnapshot } from '@/features/room/hooks/useHomeSnapshot';
import { useConnectionStatus } from '@/network/ConnectionProvider';
import { colors, spacing } from '@/theme/tokens';

import { DecorateTray } from '../components/DecorateTray';
import { usePlaceItem } from '../hooks/usePlaceItem';
import { useDecorateStore } from '../store/useDecorateStore';

const SLOT_ID = 'floor-accent-left';

export function DecorateScreen() {
  const router = useRouter();
  const isOnline = useConnectionStatus();
  const homeQuery = useHomeSnapshot();
  const placeMutation = usePlaceItem();
  const selectedOwnedItemId = useDecorateStore((state) => state.selectedOwnedItemId);
  const setSelectedOwnedItemId = useDecorateStore((state) => state.setSelectedOwnedItemId);

  if (!homeQuery.data) {
    return <SafeAreaView style={styles.centered}><EmptyState description="보관함을 불러온 뒤 다시 시도해 주세요." title="가구를 찾지 못했어요" /></SafeAreaView>;
  }

  const placement = homeQuery.data.placements.find((candidate) => candidate.slotId === SLOT_ID);
  const selected = homeQuery.data.ownedItems.find((item) => item.id === selectedOwnedItemId)
    ?? homeQuery.data.ownedItems.find((item) => item.ownerId === homeQuery.data.currentUserId && item.kind === 'furniture' && item.allowedSlotIds.includes(SLOT_ID));
  const placed = homeQuery.data.ownedItems.find((item) => item.id === placement?.ownedItemId);
  const accentDefinition = placed ? ITEM_BY_ID.get(placed.itemDefinitionId) : undefined;

  const placeSelected = () => {
    if (!selected) return;
    placeMutation.mutate({ ownedItemId: selected.id, slotId: SLOT_ID, expectedVersion: placement?.version ?? 0 });
  };

  return (
    <HouseGameShell
      activeTab="decorate"
      onNavigate={(tab) => router.replace(tab === 'home' ? '/' : tab === 'memories' ? '/memories' : '/decorate')}
      onOpenInvite={() => router.push('/house/invite')}
      onOpenSettings={() => router.push('/settings')}
      snapshot={homeQuery.data}
    >
      <View style={styles.stage}>
        {!isOnline ? <OfflineReadOnlyBanner /> : null}
        <RoomCanvas
          accentFurniture={accentDefinition ? { name: accentDefinition.nameKo, color: accentDefinition.previewColor, itemId: accentDefinition.id } : undefined}
          animals={homeQuery.data.animals}
          isActive
          members={homeQuery.data.members}
          onOpenMemory={(id) => router.push({ pathname: '/memories/[id]', params: { id } })}
          onSelectAnimal={() => undefined}
          selectedAnimalId={null}
        />
        <DecorateTray
          isOnline={isOnline}
          isPending={placeMutation.isPending}
          onOpenShop={() => router.push('/shop')}
          onPlace={placeSelected}
          onSelect={setSelectedOwnedItemId}
          placement={placement}
          selectedOwnedItemId={selected?.id ?? null}
          snapshot={homeQuery.data}
        />
      </View>
    </HouseGameShell>
  );
}

const styles = StyleSheet.create({
  centered: { backgroundColor: colors.cream, flex: 1, justifyContent: 'center', padding: spacing.lg },
  stage: { flex: 1, justifyContent: 'flex-end' },
});
