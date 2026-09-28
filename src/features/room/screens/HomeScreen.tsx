import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useEffect, useMemo, useRef } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import type { AnimalAction } from '@/domain/models';
import { DomainError } from '@/domain/errors';
import { ITEM_BY_ID } from '@/catalog/items';
import { EmptyState } from '@/components/ui/EmptyState';
import { OfflineReadOnlyBanner } from '@/components/OfflineReadOnlyBanner';
import { HouseGameShell } from '@/features/house-shell/components/HouseGameShell';
import { HouseOverlay } from '@/features/house-shell/components/HouseOverlay';
import { useHouseShellStore } from '@/features/house-shell/store/useHouseShellStore';
import { useMemories } from '@/features/memories/hooks/useMemories';
import { useConnectionStatus } from '@/network/ConnectionProvider';
import { colors, spacing } from '@/theme/tokens';

import { AnimalDetailSheet } from '../components/AnimalDetailSheet';
import { HomePrompt } from '../components/HomePrompt';
import { RoomCanvas } from '../components/RoomCanvas';
import { homeSnapshotKey, useAnimalAction, useHomeSnapshot } from '../hooks/useHomeSnapshot';
import { useAppLifecycle } from '../hooks/useAppLifecycle';

export function HomeScreen({
  onOpenMemory,
  onOpenSettings,
  onCreateHouse,
  onOpenInvite,
}: {
  onOpenMemory: (memoryId: string) => void;
  onOpenSettings: () => void;
  onCreateHouse?: () => void;
  onOpenInvite?: () => void;
}) {
  const queryClient = useQueryClient();
  const router = useRouter();
  const homeQuery = useHomeSnapshot();
  const actionMutation = useAnimalAction();
  const memoriesQuery = useMemories();
  const isOnline = useConnectionStatus();
  const wasMounted = useRef(false);
  const overlay = useHouseShellStore((state) => state.overlay);
  const selectedAnimalId = useHouseShellStore((state) => state.selectedAnimalId);
  const closeOverlay = useHouseShellStore((state) => state.closeOverlay);
  const openAnimal = useHouseShellStore((state) => state.openAnimal);
  const isActive = useAppLifecycle({
    onActive: () => {
      void queryClient.invalidateQueries({ queryKey: homeSnapshotKey });
    },
  });

  useEffect(() => {
    if (wasMounted.current && isOnline) {
      void queryClient.invalidateQueries({ queryKey: homeSnapshotKey });
    }
    wasMounted.current = true;
  }, [isOnline, queryClient]);

  const effectiveSelectedAnimalId =
    selectedAnimalId ??
    homeQuery.data?.animals.find((animal) => animal.ownerId === homeQuery.data.currentUserId)?.id ??
    homeQuery.data?.animals[0]?.id ??
    null;
  const selectedAnimal = useMemo(
    () => homeQuery.data?.animals.find((animal) => animal.id === effectiveSelectedAnimalId),
    [effectiveSelectedAnimalId, homeQuery.data],
  );
  const selectedOwner = homeQuery.data?.members.find((member) => member.userId === selectedAnimal?.ownerId);

  const memoryFurniture = useMemo(() => {
    const placement = homeQuery.data?.placements.find((candidate) => candidate.slotId === 'memory-shelf');
    const ownedItem = homeQuery.data?.ownedItems.find((candidate) => candidate.id === placement?.ownedItemId);
    const memory = memoriesQuery.data?.find((candidate) => candidate.furnitureOwnedItemId === ownedItem?.id);
    const definition = ownedItem ? ITEM_BY_ID.get(ownedItem.itemDefinitionId) : undefined;
    return memory && definition ? { memoryId: memory.id, name: definition.nameKo } : undefined;
  }, [homeQuery.data, memoriesQuery.data]);

  const accentFurniture = useMemo(() => {
    const placement = homeQuery.data?.placements.find((candidate) => candidate.slotId === 'floor-accent-left');
    const ownedItem = homeQuery.data?.ownedItems.find((candidate) => candidate.id === placement?.ownedItemId);
    const definition = ownedItem ? ITEM_BY_ID.get(ownedItem.itemDefinitionId) : undefined;
    return definition ? { name: definition.nameKo, color: definition.previewColor } : undefined;
  }, [homeQuery.data]);

  if (homeQuery.isPending) {
    return (
      <SafeAreaView style={styles.centered}>
        <ActivityIndicator accessibilityLabel="우리집 불러오는 중" color={colors.ink} />
      </SafeAreaView>
    );
  }

  if (homeQuery.isError || !homeQuery.data) {
    const missingActiveHouse = homeQuery.error instanceof DomainError && homeQuery.error.message === 'active_house_not_found';
    return (
      <SafeAreaView style={styles.errorArea}>
        <EmptyState
          actionLabel={missingActiveHouse ? '새 집 만들기' : '다시 불러오기'}
          description={missingActiveHouse ? '혼자서 먼저 시작하고, 친구는 나중에 초대할 수 있어요.' : '마지막으로 저장된 집을 불러오지 못했어요. 연결을 확인해 주세요.'}
          onAction={missingActiveHouse ? onCreateHouse : () => void homeQuery.refetch()}
          title={missingActiveHouse ? '아직 우리집이 없어요' : '집 문이 잠시 닫혔어요'}
        />
      </SafeAreaView>
    );
  }

  const handleAction = (action: AnimalAction) => {
    if (selectedAnimal) actionMutation.mutate({ animalId: selectedAnimal.id, action });
  };

  const handleAnimalPress = (animalId: string) => {
    openAnimal(animalId);
    if (isActive && isOnline && !actionMutation.isPending) {
      actionMutation.mutate({ animalId, action: 'reacting' });
    }
  };

  return (
    <HouseGameShell
      activeTab="home"
      onNavigate={(tab) => router.replace(tab === 'decorate' ? '/decorate' : tab === 'memories' ? '/memories' : '/')}
      onOpenInvite={onOpenInvite}
      onOpenSettings={onOpenSettings}
      snapshot={homeQuery.data}
    >
      <View style={styles.stage}>
        {!isOnline ? <OfflineReadOnlyBanner /> : null}
        <RoomCanvas
          accentFurniture={accentFurniture}
          animals={homeQuery.data.animals}
          isActive={isActive}
          memoryFurniture={memoryFurniture}
          members={homeQuery.data.members}
          onOpenMemory={onOpenMemory}
          onSelectAnimal={handleAnimalPress}
          selectedAnimalId={effectiveSelectedAnimalId}
        />
        {selectedAnimal ? <HomePrompt animal={selectedAnimal} onPress={() => openAnimal(selectedAnimal.id)} /> : null}
      </View>
      <HouseOverlay
        accessibilityLabel={`${selectedAnimal?.name ?? '동물'} 동물 상세`}
        dismissLabel="동물 상세 닫기"
        onDismiss={closeOverlay}
        visible={overlay === 'animal' && Boolean(selectedAnimal)}
      >
        {selectedAnimal ? (
          <AnimalDetailSheet
            animal={selectedAnimal}
            disabled={!isActive || !isOnline || actionMutation.isPending}
            onAction={handleAction}
            onDismiss={closeOverlay}
            owner={selectedOwner}
          />
        ) : null}
      </HouseOverlay>
    </HouseGameShell>
  );
}

const styles = StyleSheet.create({
  centered: { alignItems: 'center', backgroundColor: colors.cream, flex: 1, justifyContent: 'center' },
  errorArea: { backgroundColor: colors.cream, flex: 1, padding: spacing.lg },
  stage: { flex: 1 },
});
