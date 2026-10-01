import { StyleSheet, View } from 'react-native';

import type { MemorySummary } from '@/domain/models';
import { AppButton } from '@/components/ui/AppButton';
import { AppText } from '@/components/ui/AppText';
import { EmptyState } from '@/components/ui/EmptyState';
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
  return <>{Object.entries(groups).map(([month, values]) => <View key={month} style={styles.section}><AppText style={styles.month} variant="heading">{month}</AppText><ResponsiveGrid maxColumns={3} testID={`memory-grid-${scope}`}>{values.map((memory) => <ScrapbookMemoryCard key={memory.id} memory={memory} onPress={onOpenMemory} scope={scope} />)}</ResponsiveGrid></View>)}</>;
}

export function MemoriesScreen({ onOpenMemory, onCreateMemory, onNavigateHome }: { onOpenMemory: (memoryId: string) => void; onCreateMemory?: () => void; onNavigateHome?: () => void }) {
  const currentMemories = useMemories().data ?? [];
  const archivedMemories = useArchivedMemories().data ?? [];
  if (!currentMemories.length && !archivedMemories.length) return <ResponsivePage><EmptyState actionLabel="첫 추억 기록하기" description="사진이나 글을 남기면 초안이 생기고, 서로 다른 두 사람이 기여하면 가구가 완성돼요." onAction={onCreateMemory} title="첫 추억을 만들어 보세요" /></ResponsivePage>;
  return <ResponsivePage contentMaxWidth={1120} scroll testID="memories-page"><View style={styles.content}><View style={styles.header}>{onNavigateHome ? <AppButton accessibilityLabel="우리집으로 돌아가기" icon={<AppText>←</AppText>} onPress={onNavigateHome} tone="quiet" /> : null}<View style={styles.titleBlock}><AppText variant="title">우리의 추억</AppText><AppText tone="muted">함께 남긴 순간을 가구로 간직해요.</AppText></View>{onCreateMemory ? <AppButton label="새 기록" onPress={onCreateMemory} /> : null}</View><AppText tone="muted" variant="caption">공유 당시 대상이었던 멤버만 볼 수 있어요.</AppText><MemorySection memories={currentMemories} onOpenMemory={onOpenMemory} scope="current" />{archivedMemories.length ? <View style={styles.archive}><View style={styles.archiveHeading}><AppText variant="heading">개인 보관함</AppText><AppText tone="muted" variant="caption">내가 직접 기여한 기록</AppText></View><AppText tone="muted" variant="caption">퇴장 시점까지 공개된 내용만 계속 볼 수 있어요.</AppText><MemorySection memories={archivedMemories} onOpenMemory={onOpenMemory} scope="archive" /></View> : null}</View></ResponsivePage>;
}

const styles = StyleSheet.create({ content: { gap: spacing.md, paddingBottom: spacing.lg }, header: { alignItems: 'center', flexDirection: 'row', gap: spacing.sm }, titleBlock: { flex: 1, gap: 2 }, section: { gap: spacing.sm }, month: { writingDirection: 'ltr' }, archive: { gap: spacing.sm, paddingTop: spacing.md }, archiveHeading: { alignItems: 'baseline', flexDirection: 'row', gap: spacing.sm } });
