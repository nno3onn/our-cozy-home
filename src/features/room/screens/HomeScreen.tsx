import { useQueryClient } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import type { AnimalAction } from '@/domain/models';
import { DomainError } from '@/domain/errors';
import { ITEM_BY_ID } from '@/catalog/items';
import { useMemories } from '@/features/memories/hooks/useMemories';
import { colors, spacing } from '@/theme/tokens';
import { AppButton } from '@/components/ui/AppButton';
import { AppText } from '@/components/ui/AppText';
import { EmptyState } from '@/components/ui/EmptyState';

import { AnimalActions } from '../components/AnimalActions';
import { MemberStrip } from '../components/MemberStrip';
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
  const { width } = useWindowDimensions();
  const isWideLayout = width >= 900;
  const isCompactHeader = width < 560;
  const queryClient = useQueryClient();
  const homeQuery = useHomeSnapshot();
  const actionMutation = useAnimalAction();
  const memoriesQuery = useMemories();
  const [selectedAnimalId, setSelectedAnimalId] = useState<string | null>(null);
  const isActive = useAppLifecycle({
    onActive: () => {
      void queryClient.invalidateQueries({ queryKey: homeSnapshotKey });
    },
  });

  const effectiveSelectedAnimalId =
    selectedAnimalId ??
    homeQuery.data?.animals.find((animal) => animal.ownerId === homeQuery.data.currentUserId)?.id ??
    homeQuery.data?.animals[0]?.id ??
    null;

  const selectedAnimal = useMemo(
    () => homeQuery.data?.animals.find((animal) => animal.id === effectiveSelectedAnimalId),
    [effectiveSelectedAnimalId, homeQuery.data],
  );
  const currentMember = homeQuery.data?.members.find(
    (member) => member.userId === homeQuery.data?.currentUserId,
  );

  const memoryFurniture = useMemo(() => {
    const placement = homeQuery.data?.placements.find(
      (candidate) => candidate.slotId === 'memory-shelf',
    );
    const ownedItem = homeQuery.data?.ownedItems.find(
      (candidate) => candidate.id === placement?.ownedItemId,
    );
    const memory = memoriesQuery.data?.find(
      (candidate) => candidate.furnitureOwnedItemId === ownedItem?.id,
    );
    const definition = ownedItem ? ITEM_BY_ID.get(ownedItem.itemDefinitionId) : undefined;
    return memory && definition ? { memoryId: memory.id, name: definition.nameKo } : undefined;
  }, [homeQuery.data, memoriesQuery.data]);

  const accentFurniture = useMemo(() => {
    const placement = homeQuery.data?.placements.find(
      (candidate) => candidate.slotId === 'floor-accent-left',
    );
    const ownedItem = homeQuery.data?.ownedItems.find(
      (candidate) => candidate.id === placement?.ownedItemId,
    );
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
    const missingActiveHouse = homeQuery.error instanceof DomainError
      && homeQuery.error.message === 'active_house_not_found';
    return (
      <SafeAreaView style={styles.safeArea}>
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
    if (!selectedAnimal) return;
    actionMutation.mutate({ animalId: selectedAnimal.id, action });
  };

  const handleAnimalPress = (animalId: string) => {
    setSelectedAnimalId(animalId);
    if (isActive && !actionMutation.isPending) {
      actionMutation.mutate({ animalId, action: 'reacting' });
    }
  };

  return (
    <SafeAreaView edges={['left', 'right']} style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={[styles.titleRow, isCompactHeader && styles.titleRowCompact]}>
          <View>
            <AppText variant="title">{homeQuery.data.house.name}</AppText>
            <AppText tone="muted" variant="caption">
              동물의 상태는 접속 여부가 아니라 지금 하는 행동이에요.
            </AppText>
          </View>
          <View style={[styles.headerActions, isCompactHeader && styles.headerActionsCompact]}>
            <View style={styles.coin}>
              <AppText variant="label">{homeQuery.data.coinBalance.toLocaleString()} 코인</AppText>
            </View>
            {currentMember?.role === 'admin' && onOpenInvite ? <AppButton label="친구 초대" onPress={onOpenInvite} tone="secondary" /> : null}
            <AppButton label="설정 열기" onPress={onOpenSettings} tone="quiet" />
          </View>
        </View>
        <MemberStrip members={homeQuery.data.members} />
        <View style={[styles.stage, isWideLayout && styles.stageWide]}>
          <View style={styles.roomColumn}>
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
          </View>
          <View style={[styles.actionColumn, isWideLayout && styles.actionColumnWide]}>
            {selectedAnimal ? (
              <AnimalActions
                animal={selectedAnimal}
                disabled={!isActive || actionMutation.isPending}
                onAction={handleAction}
              />
            ) : null}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.cream },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.cream,
  },
  content: {
    width: '100%',
    maxWidth: 1120,
    alignSelf: 'center',
    gap: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
  },
  titleRowCompact: { flexDirection: 'column', alignItems: 'stretch' },
  coin: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 2,
    borderColor: colors.ink,
  },
  headerActions: { alignItems: 'flex-end', gap: spacing.sm },
  headerActionsCompact: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  stage: { gap: spacing.lg },
  stageWide: { flexDirection: 'row', alignItems: 'flex-start', paddingHorizontal: spacing.lg },
  roomColumn: { flex: 1, minWidth: 0 },
  actionColumn: { flexShrink: 0 },
  actionColumnWide: { width: 320, paddingTop: spacing.lg },
});
