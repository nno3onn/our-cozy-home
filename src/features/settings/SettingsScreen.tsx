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
import { MobileBackButton } from '@/features/illustrated-ui/chrome/MobileBackButton';

type ResettableRepository = HomeRepository & { resetDemo: () => Promise<void> };

function canResetDemo(repository: HomeRepository): repository is ResettableRepository {
  return 'resetDemo' in repository && typeof repository.resetDemo === 'function';
}

export function SettingsScreen({
  mode,
  onLeftHouse,
  onOpenAssets,
}: {
  mode: AppMode;
  onLeftHouse?: () => void;
  onOpenAssets?: () => void;
}) {
  const repository = useRepository();
  const queryClient = useQueryClient();
  const clearDecorateSelection = useDecorateStore((state) => state.clearSelection);
  const [confirming, setConfirming] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [confirmingDeletion, setConfirmingDeletion] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [deletionMessage, setDeletionMessage] = useState<string | null>(null);
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

  const requestAccountDeletion = async () => {
    if (!auth) return;
    setDeletingAccount(true);
    setDeletionMessage(null);
    try {
      const result = await repository.requestAccountDeletion(crypto.randomUUID());
      if (result.authDeletionComplete) {
        await auth.signOut();
        setDeletionMessage('계정 삭제가 완료되었어요.');
      } else {
        setDeletionMessage('개인 데이터 정리는 준비되었어요. 계정 삭제를 다시 시도해 주세요.');
      }
    } catch {
      setDeletionMessage('계정 삭제를 시작하지 못했어요. 네트워크를 확인한 뒤 다시 시도해 주세요.');
    } finally {
      setDeletingAccount(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <MobileBackButton fallbackHref="/" />
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
            <HouseLeaveControls
              onLeave={() => repository.leaveHouse()}
              onLeft={() => {
                void queryClient.resetQueries();
                onLeftHouse?.();
              }}
            />
            {!confirmingDeletion ? (
              <AppButton label="계정 삭제" onPress={() => setConfirmingDeletion(true)} tone="danger" />
            ) : (
              <View style={styles.confirmation}>
                <AppText variant="label">정말 계정을 삭제할까요?</AppText>
                <AppText tone="muted" variant="caption">집 퇴장과 가구 회수 뒤 개인 기록·사진·토큰이 정리돼요. 다른 친구의 기록과 완성 가구는 남아요.</AppText>
                <View style={styles.row}>
                  <AppButton disabled={deletingAccount} label="취소" onPress={() => setConfirmingDeletion(false)} tone="quiet" />
                  <AppButton disabled={deletingAccount} label="계정 삭제 확인" onPress={() => void requestAccountDeletion()} tone="danger" />
                </View>
              </View>
            )}
            {deletionMessage ? <AppText tone="muted" variant="caption">{deletionMessage}</AppText> : null}
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
  content: { width: '100%', maxWidth: 720, alignSelf: 'center', gap: spacing.lg, padding: spacing.lg, paddingTop: 72 },
  panel: { gap: spacing.md, padding: spacing.lg },
  confirmation: { gap: spacing.sm },
  row: { flexDirection: 'row', gap: spacing.sm },
});
