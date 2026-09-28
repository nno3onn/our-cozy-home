import { ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import type { MemorySummary } from '@/domain/models';
import { AppButton } from '@/components/ui/AppButton';
import { AppText } from '@/components/ui/AppText';
import { EmptyState } from '@/components/ui/EmptyState';
import { colors, spacing } from '@/theme/tokens';

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
  return <>{Object.entries(groups).map(([month, values]) => <ScrollView contentContainerStyle={styles.cards} horizontal key={month} showsHorizontalScrollIndicator={false}><AppText style={styles.month} variant="heading">{month}</AppText>{values.map((memory) => <ScrapbookMemoryCard key={memory.id} memory={memory} onPress={onOpenMemory} scope={scope} />)}</ScrollView>)}</>;
}

export function MemoriesScreen({ onOpenMemory, onCreateMemory }: { onOpenMemory: (memoryId: string) => void; onCreateMemory?: () => void }) {
  const currentMemories = useMemories().data ?? [];
  const archivedMemories = useArchivedMemories().data ?? [];
  if (!currentMemories.length && !archivedMemories.length) return <SafeAreaView style={styles.centered}><EmptyState actionLabel="첫 추억 기록하기" description="사진이나 글을 남기면 초안이 생기고, 서로 다른 두 사람이 기여하면 가구가 완성돼요." onAction={onCreateMemory} title="첫 추억을 만들어 보세요" /></SafeAreaView>;
  return <SafeAreaView edges={['left', 'right']} style={styles.safeArea}><ScrollView contentContainerStyle={styles.content}><AppText variant="title">우리의 추억</AppText>{onCreateMemory ? <AppButton label="새 추억 기록" onPress={onCreateMemory} /> : null}<AppText tone="muted">공유 당시 대상이었던 멤버만 볼 수 있어요.</AppText><MemorySection memories={currentMemories} onOpenMemory={onOpenMemory} scope="current" />{archivedMemories.length ? <><AppText variant="heading">개인 보관함</AppText><AppText tone="muted" variant="caption">내가 직접 기여한 추억은 퇴장 시점까지의 내용만 보관돼요.</AppText><MemorySection memories={archivedMemories} onOpenMemory={onOpenMemory} scope="archive" /></> : null}</ScrollView></SafeAreaView>;
}

const styles = StyleSheet.create({ safeArea: { backgroundColor: colors.cream, flex: 1 }, centered: { backgroundColor: colors.cream, flex: 1, justifyContent: 'center', padding: spacing.lg }, content: { gap: spacing.md, padding: spacing.lg, paddingBottom: spacing.xxl }, cards: { gap: spacing.md, paddingVertical: spacing.xs }, month: { alignSelf: 'center', marginRight: spacing.sm, writingDirection: 'ltr' } });
