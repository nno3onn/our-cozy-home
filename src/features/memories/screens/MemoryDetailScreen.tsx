import { StyleSheet, View } from 'react-native';
import { router } from 'expo-router';

import { AppText } from '@/components/ui/AppText';
import { AppPageHeader } from '@/components/ui/AppPageHeader';
import { AppSection } from '@/components/ui/AppSection';
import { EmptyState } from '@/components/ui/EmptyState';
import { InlineNotice } from '@/components/ui/InlineNotice';
import { Skeleton } from '@/components/ui/Skeleton';
import { ResponsivePage } from '@/components/layout/ResponsivePage';
import { colors, radii, spacing } from '@/theme/tokens';

import { useArchivedMemories, useMemories, useMemoryContributions } from '../hooks/useMemories';

export function MemoryDetailScreen({ memoryId }: { memoryId: string }) {
  const memoriesQuery = useMemories();
  const archivedMemoriesQuery = useArchivedMemories();
  const contributionsQuery = useMemoryContributions(memoryId);
  const memory = memoriesQuery.data?.find((candidate) => candidate.id === memoryId) ?? archivedMemoriesQuery.data?.find((candidate) => candidate.id === memoryId);

  if (memoriesQuery.isLoading || archivedMemoriesQuery.isLoading) {
    return <ResponsivePage><AppPageHeader backHref="/(tabs)/memories" title="추억 상세" /><View accessibilityLabel="추억 상세를 불러오는 중" style={styles.loading}><Skeleton height={42}/><Skeleton height={180}/></View></ResponsivePage>;
  }

  if (!memory) {
    return (
      <ResponsivePage>
        <AppPageHeader backHref="/(tabs)/memories" title="추억 상세" />
        <EmptyState
          description="현재 계정의 열람 권한이 없거나 삭제된 추억이에요."
          title="추억을 열 수 없어요"
          actionLabel="추억 목록으로"
          onAction={() => router.replace('/(tabs)/memories')}
        />
      </ResponsivePage>
    );
  }

  return (
    <ResponsivePage scroll testID="memory-detail-page">
      <View style={styles.content}>
        <AppPageHeader backHref="/(tabs)/memories" title={memory.title} />
        <AppText tone="tertiary">{memory.occurredOn}</AppText>
        <InlineNotice message={memory.furnitureOwnedItemId ? '서로 다른 두 명의 기여로 추억 가구가 완성됐어요.' : `가구 완성까지 ${Math.max(0, 2 - memory.contributionCount)}명의 기여가 더 필요해요.`} tone={memory.furnitureOwnedItemId ? 'success' : 'info'} />
        <AppSection title="함께 기록한 친구" description={memory.participantNames.join(' · ')}>
          <View style={styles.preview}>
            <AppText tone="secondary">{memory.preview}</AppText>
            <View style={styles.meta}><AppText tone="tertiary" variant="caption">기여 {memory.contributionCount}명</AppText><AppText tone="tertiary" variant="caption">열람 대상은 공유 시점에 고정</AppText></View>
          </View>
        </AppSection>
        {contributionsQuery.isLoading ? <Skeleton height={120} /> : null}
        {contributionsQuery.isError ? <InlineNotice message="기여 내용을 불러오지 못했어요. 잠시 뒤 다시 시도해 주세요." tone="danger" /> : null}
        {contributionsQuery.data?.length ? <AppSection title="기여 내용">{contributionsQuery.data.map((contribution) => <View key={`${contribution.id}-${contribution.publishedAt}`} style={styles.contribution}><AppText variant="label">{contribution.displayName}</AppText><AppText>{contribution.body}</AppText></View>)}</AppSection> : null}
        <AppText tone="tertiary" variant="caption">사진은 비공개 Storage의 현재 열람 권한을 확인한 뒤에만 표시돼요.</AppText>
      </View>
    </ResponsivePage>
  );
}

const styles = StyleSheet.create({
  content: { gap: spacing.xl, paddingBottom: spacing.xl },
  loading: { gap: spacing.lg, paddingTop: spacing.xl },
  preview: { backgroundColor: colors.surface, borderRadius: radii.card, gap: spacing.md, padding: spacing.lg },
  contribution: { borderBottomColor: colors.border, borderBottomWidth: StyleSheet.hairlineWidth, gap: spacing.sm, paddingVertical: spacing.lg },
  meta: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
});
