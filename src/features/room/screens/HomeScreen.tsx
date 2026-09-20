import { useQueryClient } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import type { AnimalAction } from '@/domain/models';
import { colors, spacing } from '@/theme/tokens';
import { AppText } from '@/components/ui/AppText';
import { EmptyState } from '@/components/ui/EmptyState';

import { AnimalActions } from '../components/AnimalActions';
import { MemberStrip } from '../components/MemberStrip';
import { RoomCanvas } from '../components/RoomCanvas';
import { homeSnapshotKey, useAnimalAction, useHomeSnapshot } from '../hooks/useHomeSnapshot';
import { useAppLifecycle } from '../hooks/useAppLifecycle';

export function HomeScreen() {
  const queryClient = useQueryClient();
  const homeQuery = useHomeSnapshot();
  const actionMutation = useAnimalAction();
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

  if (homeQuery.isPending) {
    return (
      <SafeAreaView style={styles.centered}>
        <ActivityIndicator accessibilityLabel="우리집 불러오는 중" color={colors.ink} />
      </SafeAreaView>
    );
  }

  if (homeQuery.isError || !homeQuery.data) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <EmptyState
          actionLabel="다시 불러오기"
          description="마지막으로 저장된 집을 불러오지 못했어요. 연결을 확인해 주세요."
          onAction={() => void homeQuery.refetch()}
          title="집 문이 잠시 닫혔어요"
        />
      </SafeAreaView>
    );
  }

  const handleAction = (action: AnimalAction) => {
    if (!selectedAnimal) return;
    actionMutation.mutate({ animalId: selectedAnimal.id, action });
  };

  return (
    <SafeAreaView edges={['left', 'right']} style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.titleRow}>
          <View>
            <AppText variant="title">{homeQuery.data.house.name}</AppText>
            <AppText tone="muted" variant="caption">
              동물의 상태는 접속 여부가 아니라 지금 하는 행동이에요.
            </AppText>
          </View>
          <View style={styles.coin}>
            <AppText variant="label">{homeQuery.data.coinBalance.toLocaleString()} 코인</AppText>
          </View>
        </View>
        <MemberStrip members={homeQuery.data.members} />
        <RoomCanvas
          animals={homeQuery.data.animals}
          isActive={isActive}
          members={homeQuery.data.members}
          onSelectAnimal={setSelectedAnimalId}
          selectedAnimalId={effectiveSelectedAnimalId}
        />
        {selectedAnimal ? (
          <AnimalActions
            animal={selectedAnimal}
            disabled={!isActive || actionMutation.isPending}
            onAction={handleAction}
          />
        ) : null}
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
  content: { gap: spacing.lg, paddingBottom: spacing.xl },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
  },
  coin: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 2,
    borderColor: colors.ink,
  },
});
