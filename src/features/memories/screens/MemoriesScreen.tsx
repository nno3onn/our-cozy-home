import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import type { MemorySummary } from '@/domain/models';
import { AppButton } from '@/components/ui/AppButton';
import { AppPageHeader } from '@/components/ui/AppPageHeader';
import { AppText } from '@/components/ui/AppText';
import { EmptyState } from '@/components/ui/EmptyState';
import { InlineNotice } from '@/components/ui/InlineNotice';
import { Skeleton } from '@/components/ui/Skeleton';
import { ResponsiveGrid } from '@/components/layout/ResponsiveGrid';
import { ResponsivePage } from '@/components/layout/ResponsivePage';
import { spacing } from '@/theme/tokens';

import { ScrapbookMemoryCard } from '../components/ScrapbookMemoryCard';
import { useArchivedMemories, useMemories } from '../hooks/useMemories';

function monthLabel(date: string) {
  const [year, month] = date.split('-');
  return `${year}년 ${Number(month)}월`;
}

function MemorySection({ memories, onOpenMemory, scope }: { memories: MemorySummary[]; onOpenMemory: (memoryId: string) => void; scope: 'current' | 'archive' }) {
  const groups = memories.reduce<Record<string, MemorySummary[]>>((result, memory) => {
    const label = monthLabel(memory.occurredOn);
    (result[label] ??= []).push(memory);
    return result;
  }, {});
  return <>{Object.entries(groups).map(([month, values]) => <View key={month} style={styles.section}><AppText style={styles.month} variant="sectionTitle">{month}</AppText><ResponsiveGrid columnsByBreakpoint={{ compact: 1, medium: 2, wide: 3 }} maxColumns={3} testID={`memory-grid-${scope}`}>{values.map((memory) => <ScrapbookMemoryCard key={memory.id} memory={memory} onPress={onOpenMemory} scope={scope} />)}</ResponsiveGrid></View>)}</>;
}

export function MemoriesScreen({ onOpenMemory, onCreateMemory, onNavigateHome }: { onOpenMemory: (memoryId: string) => void; onCreateMemory?: () => void; onNavigateHome?: () => void }) {
  const [scope, setScope] = useState<'current' | 'archive'>('current');
  const currentQuery = useMemories();
  const archivedQuery = useArchivedMemories();
  const currentMemories = currentQuery.data ?? [];
  const archivedMemories = archivedQuery.data ?? [];
  if (currentQuery.isLoading || archivedQuery.isLoading) return <ResponsivePage><AppPageHeader backHref="/" backLabel="우리집으로 돌아가기" onBack={onNavigateHome} title="우리의 추억" /><View accessibilityLabel="추억 목록을 불러오는 중" style={styles.loading}><Skeleton height={42}/><Skeleton height={220}/></View></ResponsivePage>;
  if (currentQuery.isError || archivedQuery.isError) return <ResponsivePage><AppPageHeader backHref="/" backLabel="우리집으로 돌아가기" onBack={onNavigateHome} title="우리의 추억" /><EmptyState title="추억을 불러오지 못했어요" description="네트워크를 확인한 뒤 다시 시도해 주세요."/></ResponsivePage>;
  if (!currentMemories.length && !archivedMemories.length) return <ResponsivePage><AppPageHeader backHref="/" onBack={onNavigateHome} title="우리의 추억" /><EmptyState actionLabel="첫 추억 기록하기" description="사진이나 글을 남기면 초안이 생기고, 서로 다른 두 사람이 기여하면 가구가 완성돼요." onAction={onCreateMemory} title="첫 추억을 만들어 보세요" /></ResponsivePage>;
  const visibleScope = currentMemories.length ? scope : 'archive';
  const visibleMemories = visibleScope === 'current' ? currentMemories : archivedMemories;

  return (
    <ResponsivePage contentMaxWidth={1120} scroll testID="memories-page">
      <View style={styles.content}>
        <AppPageHeader backHref="/" backLabel="우리집으로 돌아가기" onBack={onNavigateHome} title="우리의 추억" trailing={onCreateMemory ? <AppButton label="새 기록" onPress={onCreateMemory} /> : null} />
        <AppText tone="secondary">함께 남긴 순간을 가구로 간직해요.</AppText>
        {archivedMemories.length ? (
          <View accessibilityRole="tablist" style={styles.segment}>
            <AppButton accessibilityLabel="현재 추억 보기" disabled={!currentMemories.length} label="현재 추억" onPress={() => setScope('current')} selected={visibleScope === 'current'} tone="secondary" />
            <AppButton accessibilityLabel="개인 보관함 보기" label="개인 보관함" onPress={() => setScope('archive')} selected={visibleScope === 'archive'} tone="secondary" />
          </View>
        ) : null}
        {visibleScope === 'current' ? (
          <InlineNotice message="공유를 시작한 시점의 대상 멤버만 볼 수 있어요." />
        ) : (
          <InlineNotice message="퇴장 뒤 추가된 내용은 보이지 않으며, 원작자가 삭제한 내용은 함께 사라져요." tone="warning" />
        )}
        <MemorySection memories={visibleMemories} onOpenMemory={onOpenMemory} scope={visibleScope} />
      </View>
    </ResponsivePage>
  );
}

const styles = StyleSheet.create({ content: { gap: spacing.xl, paddingBottom: spacing.xl }, loading: { gap: spacing.lg, paddingTop: spacing.xl }, section: { gap: spacing.lg }, month: { writingDirection: 'ltr' }, segment: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm } });
