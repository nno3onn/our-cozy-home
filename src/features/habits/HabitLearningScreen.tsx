import { StyleSheet, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { AppText } from '@/components/ui/AppText';
import { AppPageHeader } from '@/components/ui/AppPageHeader';
import { EmptyState } from '@/components/ui/EmptyState';
import { InlineNotice } from '@/components/ui/InlineNotice';
import { Skeleton } from '@/components/ui/Skeleton';
import { useRepository } from '@/repositories/RepositoryContext';
import { ResponsivePage } from '@/components/layout/ResponsivePage';
import { useHomeSnapshot } from '@/features/room/hooks/useHomeSnapshot';
import { colors, radii, spacing } from '@/theme/tokens';

export function HabitLearningScreen() {
  const repository = useRepository();
  const query = useQuery({ queryKey: ['habit-learning'], queryFn: () => repository.listHabitLearning() });
  const home = useHomeSnapshot();

  if (query.isLoading || home.isLoading) {
    return <ResponsivePage><AppPageHeader backHref="/" title="버릇 배우기" /><View accessibilityLabel="버릇 학습을 불러오는 중" style={styles.content}><Skeleton height={120} /><Skeleton height={120} /></View></ResponsivePage>;
  }
  if (query.isError || home.isError) {
    return <ResponsivePage><AppPageHeader backHref="/" title="버릇 배우기" /><EmptyState title="버릇 학습을 불러오지 못했어요" description="네트워크를 확인한 뒤 다시 시도해 주세요." /></ResponsivePage>;
  }
  if (!query.data?.length) {
    return <ResponsivePage><AppPageHeader backHref="/" title="버릇 배우기" /><EmptyState title="진행 중인 버릇이 없어요" description="친구 동물을 골라 함께 활동하면 버릇을 배울 수 있어요." /></ResponsivePage>;
  }

  const animalName = (id: string) => home.data?.animals.find((animal) => animal.id === id)?.name ?? '알 수 없는 동물';
  return (
    <ResponsivePage scroll testID="habits-page">
      <View style={styles.content}>
        <AppPageHeader backHref="/" title="버릇 배우기" />
        <AppText tone="secondary">두 동물이 같은 게임 날짜에 활동하면 하루가 쌓여요.</AppText>
        <InlineNotice message="하루에 여러 친구와 활동해도 같은 학습의 날짜는 한 번만 늘어요." />
        {query.data.map((item) => {
          const learned = item.status === 'learned';
          const learner = animalName(item.learnerAnimalId);
          const teacher = animalName(item.teacherAnimalId);
          const width = `${Math.min(100, (item.completedDays / item.requiredDays) * 100)}%` as const;
          return (
            <View key={item.id} style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={styles.cardCopy}>
                  <AppText variant="sectionTitle">{item.habitName}</AppText>
                  <AppText tone="secondary">{learned ? `${learner}가 ${teacher}에게 배웠어요` : `${learner}가 ${teacher}에게 배우는 중`}</AppText>
                </View>
                <AppText tone={learned ? 'success' : 'brand'} variant="label">{item.completedDays}/{item.requiredDays}</AppText>
              </View>
              <View accessible accessibilityLabel={`${item.habitName} 학습 진행`} accessibilityRole="progressbar" accessibilityValue={{ min: 0, max: item.requiredDays, now: item.completedDays }} style={styles.track}>
                <View style={[styles.progress, { width }, learned && styles.learned]} />
              </View>
              <AppText tone="tertiary" variant="caption">{learned ? '학습 완료 · 배운 출처가 유지돼요.' : `서로 다른 날짜 ${item.completedDays}/${item.requiredDays}`}</AppText>
            </View>
          );
        })}
      </View>
    </ResponsivePage>
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: spacing.xl, gap: spacing.lg },
  card: { backgroundColor: colors.surface, borderRadius: radii.card, padding: spacing.lg, gap: spacing.md },
  cardHeader: { alignItems: 'flex-start', flexDirection: 'row', gap: spacing.md },
  cardCopy: { flex: 1, gap: spacing.xs },
  track: { backgroundColor: colors.surfaceSubtle, borderRadius: radii.pill, height: 10, overflow: 'hidden' },
  progress: { backgroundColor: colors.brand, borderRadius: radii.pill, height: '100%' },
  learned: { backgroundColor: colors.success },
});
