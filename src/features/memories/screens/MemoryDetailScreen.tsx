import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';

import { AppText } from '@/components/ui/AppText';
import { EmptyState } from '@/components/ui/EmptyState';
import { Panel } from '@/components/ui/Panel';
import { colors, spacing } from '@/theme/tokens';

import { useArchivedMemories, useMemories, useMemoryContributions } from '../hooks/useMemories';

export function MemoryDetailScreen({ memoryId }: { memoryId: string }) {
  const memoriesQuery = useMemories();
  const archivedMemoriesQuery = useArchivedMemories();
  const contributionsQuery = useMemoryContributions(memoryId);
  const memory = memoriesQuery.data?.find((candidate) => candidate.id === memoryId) ?? archivedMemoriesQuery.data?.find((candidate) => candidate.id === memoryId);

  if (!memory) {
    return (
      <SafeAreaView style={styles.centered}>
        <EmptyState
          description="현재 계정의 열람 권한이 없거나 삭제된 추억이에요."
          title="추억을 열 수 없어요"
          actionLabel="추억 목록으로"
          onAction={() => router.replace('/(tabs)/memories')}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.content}>
        <AppText variant="title">{memory.title}</AppText>
        <AppText tone="muted">{memory.occurredOn}</AppText>
        <Panel style={styles.card}>
          <AppText variant="label">함께 기록한 친구</AppText>
          <AppText>{memory.participantNames.join(' · ')}</AppText>
          <AppText variant="label">기여 {memory.contributionCount}명</AppText>
          <AppText>{memory.preview}</AppText>
        </Panel>
        {contributionsQuery.data?.length ? <Panel style={styles.card}><AppText variant="label">기여 내용</AppText>{contributionsQuery.data.map((contribution) => <View key={`${contribution.id}-${contribution.publishedAt}`}><AppText variant="label">{contribution.displayName}</AppText><AppText>{contribution.body}</AppText></View>)}</Panel> : null}
        <AppText tone="muted" variant="caption">
          데모에서는 글만 표시해요. 실제 사진은 비공개 Storage와 열람 권한 확인 후 제공할 예정이에요.
        </AppText>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.cream },
  centered: { flex: 1, justifyContent: 'center', padding: spacing.lg, backgroundColor: colors.cream },
  content: { width: '100%', maxWidth: 760, alignSelf: 'center', gap: spacing.md, padding: spacing.lg },
  card: { gap: spacing.md, padding: spacing.lg },
});
