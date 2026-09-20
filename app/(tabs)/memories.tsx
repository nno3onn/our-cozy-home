import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { EmptyState } from '@/components/ui/EmptyState';
import { colors, spacing } from '@/theme/tokens';

export default function MemoriesRoute() {
  return (
    <SafeAreaView style={styles.container}>
      <EmptyState
        description="완성된 추억과 가구 이야기를 곧 이곳에서 확인할 수 있어요."
        title="추억 선반을 준비하고 있어요"
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: spacing.lg, backgroundColor: colors.cream },
});
