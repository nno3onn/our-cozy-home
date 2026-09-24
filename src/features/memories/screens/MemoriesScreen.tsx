import { ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppButton } from '@/components/ui/AppButton';
import { AppText } from '@/components/ui/AppText';
import { EmptyState } from '@/components/ui/EmptyState';
import { Panel } from '@/components/ui/Panel';
import { colors, spacing } from '@/theme/tokens';

import { useArchivedMemories, useMemories } from '../hooks/useMemories';

export function MemoriesScreen({ onOpenMemory, onCreateMemory }: { onOpenMemory: (memoryId: string) => void; onCreateMemory?: () => void }) {
  const memoriesQuery = useMemories();
  const archivedMemoriesQuery = useArchivedMemories();
  const currentMemories = memoriesQuery.data ?? [];
  const archivedMemories = archivedMemoriesQuery.data ?? [];

  if (!currentMemories.length && !archivedMemories.length) {
    return (
      <SafeAreaView style={styles.centered}>
        <EmptyState
          description="사진이나 글을 남기면 초안이 생기고, 서로 다른 두 사람이 기여하면 가구가 완성돼요."
          title="첫 추억을 만들어 보세요"
          actionLabel="첫 추억 기록하기"
          onAction={onCreateMemory}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={['left', 'right']} style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content}>
        <AppText variant="title">추억</AppText>
        {onCreateMemory ? <AppButton label="새 추억 기록" onPress={onCreateMemory} /> : null}
        <AppText tone="muted">공유 당시 대상이었던 멤버만 볼 수 있어요.</AppText>
        {currentMemories.map((memory) => (
          <Panel key={memory.id} style={styles.card}>
            <AppText variant="heading">{memory.title}</AppText>
            <AppText tone="muted" variant="caption">
              {memory.occurredOn} · 기여 {memory.contributionCount}명
            </AppText>
            <AppText numberOfLines={2}>{memory.preview}</AppText>
            <AppButton
              label={`${memory.title} 상세 열기`}
              onPress={() => onOpenMemory(memory.id)}
              tone="secondary"
            />
          </Panel>
        ))}
        {archivedMemories.length ? (
          <>
            <AppText variant="heading">개인 보관함</AppText>
            <AppText tone="muted">내가 직접 기여한 추억은 퇴장 시점까지의 내용만 보관돼요.</AppText>
            {archivedMemories.map((memory) => (
              <Panel key={`archive-${memory.id}`} style={styles.card}>
                <AppText variant="heading">{memory.title}</AppText>
                <AppText tone="muted" variant="caption">
                  {memory.occurredOn} · 기여 {memory.contributionCount}명
                </AppText>
                <AppText numberOfLines={2}>{memory.preview}</AppText>
                <AppButton label={`${memory.title} 보관함 상세 열기`} onPress={() => onOpenMemory(memory.id)} tone="secondary" />
              </Panel>
            ))}
          </>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.cream },
  centered: { flex: 1, justifyContent: 'center', padding: spacing.lg, backgroundColor: colors.cream },
  content: { width: '100%', maxWidth: 840, alignSelf: 'center', gap: spacing.md, padding: spacing.lg, paddingBottom: spacing.xxl },
  card: { gap: spacing.sm, padding: spacing.lg },
});
