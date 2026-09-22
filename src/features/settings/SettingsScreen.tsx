import { useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import type { AppMode } from '@/config/appMode';
import type { HomeRepository } from '@/domain/repository';
import { AppButton } from '@/components/ui/AppButton';
import { AppText } from '@/components/ui/AppText';
import { Panel } from '@/components/ui/Panel';
import { useDecorateStore } from '@/features/decorate/store/useDecorateStore';
import { useRepository } from '@/repositories/RepositoryContext';
import { colors, spacing } from '@/theme/tokens';
import { useOptionalAuth } from '@/auth/AuthProvider';
import { HouseLeaveControls } from '@/features/house/screens/HouseLeaveControls';

type ResettableRepository = HomeRepository & { resetDemo: () => Promise<void> };

function canResetDemo(repository: HomeRepository): repository is ResettableRepository {
  return 'resetDemo' in repository && typeof repository.resetDemo === 'function';
}

export function SettingsScreen({
  mode,
  onOpenAssets,
}: {
  mode: AppMode;
  onOpenAssets?: () => void;
}) {
  const repository = useRepository();
  const queryClient = useQueryClient();
  const clearDecorateSelection = useDecorateStore((state) => state.clearSelection);
  const [confirming, setConfirming] = useState(false);
  const [resetting, setResetting] = useState(false);
  const auth = useOptionalAuth();

  const resetDemo = async () => {
    if (mode !== 'demo' || !canResetDemo(repository)) return;
    setResetting(true);
    try {
      await repository.resetDemo();
      clearDecorateSelection();
      await queryClient.resetQueries();
      setConfirming(false);
    } finally {
      setResetting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.content}>
        <AppText variant="title">설정</AppText>
        <Panel style={styles.panel}>
          <AppText variant="heading">실행 모드</AppText>
          <AppText>{mode === 'demo' ? '데모 모드' : 'Supabase 모드'}</AppText>
          <AppText tone="muted" variant="caption">
            연결 실패 시 다른 모드로 자동 전환하지 않아요.
          </AppText>
        </Panel>

        {mode === 'supabase' && auth ? (
          <Panel style={styles.panel}>
            <AppText variant="heading">계정</AppText>
            <AppText tone="muted" variant="caption">로그아웃하면 이전 사용자 캐시가 기기에서 제거돼요.</AppText>
            <AppButton label="로그아웃" onPress={() => void auth.signOut()} tone="danger" />
            <HouseLeaveControls onLeave={() => repository.leaveHouse()} onLeft={() => void queryClient.resetQueries()} />
          </Panel>
        ) : null}

        {mode === 'demo' && canResetDemo(repository) ? (
          <Panel style={styles.panel}>
            <AppText variant="heading">데모 도구</AppText>
            {onOpenAssets ? (
              <AppButton label="55종 임시 에셋 보기" onPress={onOpenAssets} tone="quiet" />
            ) : null}
            {!confirming ? (
              <AppButton label="데모 데이터 초기화" onPress={() => setConfirming(true)} tone="secondary" />
            ) : (
              <View style={styles.confirmation}>
                <AppText variant="label">정말 처음으로 돌릴까요?</AppText>
                <AppText tone="muted" variant="caption">동물 행동과 가구 배치가 처음 상태로 돌아가요.</AppText>
                <View style={styles.row}>
                  <AppButton disabled={resetting} label="취소" onPress={() => setConfirming(false)} tone="quiet" />
                  <AppButton disabled={resetting} label="초기화 확인" onPress={() => void resetDemo()} tone="secondary" />
                </View>
              </View>
            )}
          </Panel>
        ) : null}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.cream },
  content: { width: '100%', maxWidth: 720, alignSelf: 'center', gap: spacing.lg, padding: spacing.lg },
  panel: { gap: spacing.md, padding: spacing.lg },
  confirmation: { gap: spacing.sm },
  row: { flexDirection: 'row', gap: spacing.sm },
});
