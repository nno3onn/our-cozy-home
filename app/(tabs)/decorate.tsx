import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { EmptyState } from '@/components/ui/EmptyState';
import { colors, spacing } from '@/theme/tokens';

export default function DecorateRoute() {
  return (
    <SafeAreaView style={styles.container}>
      <EmptyState
        description="다음 단계에서 보유한 가구를 고정 슬롯에 놓을 수 있어요."
        title="꾸미기 도구를 준비하고 있어요"
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: spacing.lg, backgroundColor: colors.cream },
});
