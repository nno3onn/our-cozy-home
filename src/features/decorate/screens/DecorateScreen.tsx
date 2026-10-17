import { useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import type { PlaceItemInput } from '@/domain/models';
import { DomainError } from '@/domain/errors';
import { AppButton } from '@/components/ui/AppButton';
import { AppText } from '@/components/ui/AppText';
import { getOwnInventoryItems, getPlacementSlots, getSelectablePlacementSlots } from '@/features/inventory/inventoryItems';
import { getPlacedRoomItems } from '@/game/room/placedItems';
import { getPlacementPreview } from '../placementPreview';
import { useMemories } from '@/features/memories/hooks/useMemories';
import { ITEM_BY_ID } from '@/catalog/items';
import { EmptyState } from '@/components/ui/EmptyState';
import { OfflineReadOnlyBanner } from '@/components/OfflineReadOnlyBanner';
import { HouseGameShell } from '@/features/house-shell/components/HouseGameShell';
import { RoomCanvas } from '@/features/room/components/RoomCanvas';
import { useHomeSnapshot } from '@/features/room/hooks/useHomeSnapshot';
import { useConnectionStatus } from '@/network/ConnectionProvider';
import { colors, spacing } from '@/theme/tokens';
import { useResponsiveLayout } from '@/components/layout/ResponsivePage';

import { DecorateTray } from '../components/DecorateTray';
import { usePlaceItem } from '../hooks/usePlaceItem';
import { useDecorateStore } from '../store/useDecorateStore';


export function DecorateScreen() {
  const homeQuery = useHomeSnapshot();
  // A preview belongs to the house and account that created it. Reset all
  // unconfirmed editing state when either scope changes (including logout).
  return <DecorateSession key={`${homeQuery.data?.house.id}:${homeQuery.data?.currentUserId}`} />;
}

function DecorateSession() {
  const router = useRouter();
  const [roomWidth,setRoomWidth]=useState<number>();
  const [preview,setPreview]=useState<PlaceItemInput|null>(null);
  const [selectedSlotId,setSelectedSlotId]=useState<string|null>(null);
  const locked=useRef(false);
  const [confirming,setConfirming]=useState(false);
  const memoriesQuery=useMemories();
  const isOnline = useConnectionStatus();
  const homeQuery = useHomeSnapshot();
  const placeMutation = usePlaceItem();
  const selectedOwnedItemId = useDecorateStore((state) => state.selectedOwnedItemId);
  const setSelectedOwnedItemId = useDecorateStore((state) => state.setSelectedOwnedItemId);
  const { breakpoint } = useResponsiveLayout();
  const isWide = breakpoint === 'wide';

  if (!homeQuery.data) {
    return <SafeAreaView style={styles.centered}><EmptyState description="보관함을 불러온 뒤 다시 시도해 주세요." title="가구를 찾지 못했어요" /></SafeAreaView>;
  }

  const ownItems=getOwnInventoryItems(homeQuery.data);
  const selected=ownItems.find(item=>item.id===selectedOwnedItemId&&getPlacementSlots(item).length>0) ?? ownItems.find(item=>getPlacementSlots(item).length>0);
  const slots=selected?getSelectablePlacementSlots(selected,homeQuery.data):[];
  const slotId=selectedSlotId&&slots.includes(selectedSlotId)?selectedSlotId:slots[0];
  const placement=homeQuery.data.placements.find(candidate=>candidate.slotId===slotId);
  const scene=getPlacementPreview(homeQuery.data,preview);
  const accentPlacement=scene.placements.find(candidate=>candidate.slotId==='floor-accent-left');
  const placed=scene.ownedItems.find(item=>item.id===accentPlacement?.ownedItemId);
  const accentDefinition=placed?ITEM_BY_ID.get(placed.itemDefinitionId):undefined;
  const previewSelected=()=>{
    if(!selected||!slotId||!isOnline||locked.current||placeMutation.isPending)return;
    placeMutation.reset();setPreview({ownedItemId:selected.id,slotId,expectedVersion:placement?.version??0});
  };
  const confirmPreview=()=>{
    if(!preview||!isOnline||locked.current||placeMutation.isPending)return;
    locked.current=true;setConfirming(true);
    placeMutation.mutate(preview,{onSuccess:()=>setPreview(null),onError:()=>setPreview(null),onSettled:()=>{locked.current=false;setConfirming(false);}});
  };
  const conflict=placeMutation.error instanceof DomainError&&placeMutation.error.code==='conflict' || placeMutation.error instanceof Error&&placeMutation.error.message==='placement_conflict';

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
        {placeMutation.isError?<AppText tone="danger" accessibilityRole="alert">{conflict?'배치가 변경됐어요. 최신 모습을 확인하고 다시 미리 봐 주세요.':'가구를 놓지 못했어요. 현재 배치를 확인하고 다시 시도해 주세요.'}</AppText>:null}
        <View style={[styles.content, isWide && styles.wideContent]} testID={isWide ? 'wide-decorate-content' : undefined}>
          <View style={styles.roomStage} onLayout={event=>setRoomWidth(event.nativeEvent.layout.width)}><RoomCanvas
            availableWidth={roomWidth}
            roomItems={getPlacedRoomItems(scene,memoriesQuery.data)}
            accentFurniture={accentDefinition ? { name: accentDefinition.nameKo, color: accentDefinition.previewColor, itemId: accentDefinition.id } : undefined}
            animals={homeQuery.data.animals}
            isActive
            members={homeQuery.data.members}
            onOpenMemory={(id) => router.push({ pathname: '/memories/[id]', params: { id } })}
            onSelectAnimal={() => undefined}
            selectedAnimalId={null}
          /></View>
          {preview?<View testID="placement-preview-controls"><AppText variant="label">방에서 미리 보고 있어요</AppText><AppButton label="미리보기 취소" disabled={confirming||placeMutation.isPending} tone="quiet" onPress={()=>{if(!locked.current)setPreview(null);}}/><AppButton label="여기에 놓기" disabled={!isOnline||confirming||placeMutation.isPending} onPress={confirmPreview}/></View>:<DecorateTray
            aside={isWide}
            isOnline={isOnline}
            isPending={placeMutation.isPending}
            onOpenShop={() => router.push('/shop')}
            onPlace={previewSelected}
            placeLabel="방에서 미리보기"
            slotId={slotId}
            onSelectSlot={setSelectedSlotId}
            onSelect={(id)=>{setSelectedOwnedItemId(id);setSelectedSlotId(null);}}
            placement={placement}
            selectedOwnedItemId={selected?.id ?? null}
            snapshot={homeQuery.data}
          />}
        </View>
      </View>
    </HouseGameShell>
  );
}

const styles = StyleSheet.create({
  centered: { backgroundColor: colors.background, flex: 1, justifyContent: 'center', padding: spacing.lg },
  stage: { flex: 1, minHeight: 0 },
  content: { flex: 1, justifyContent: 'flex-end', minHeight: 0 },
  wideContent: { alignItems: 'stretch', flexDirection: 'row', gap: spacing.md, padding: spacing.md },
  roomStage: { flex: 1, justifyContent: 'flex-end', minWidth: 0 },
});
