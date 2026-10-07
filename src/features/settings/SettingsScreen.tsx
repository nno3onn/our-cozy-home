import { useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import type { AppMode } from '@/config/appMode';
import type { HomeRepository } from '@/domain/repository';
import { AppButton } from '@/components/ui/AppButton';
import { AppPageHeader } from '@/components/ui/AppPageHeader';
import { AppSection } from '@/components/ui/AppSection';
import { AppText } from '@/components/ui/AppText';
import { InlineNotice } from '@/components/ui/InlineNotice';
import { ListRow } from '@/components/ui/ListRow';
import { useDecorateStore } from '@/features/decorate/store/useDecorateStore';
import { useRepository } from '@/repositories/RepositoryContext';
import { colors, radii, spacing } from '@/theme/tokens';
import { useOptionalAuth } from '@/auth/AuthProvider';
import { HouseLeaveControls } from '@/features/house/screens/HouseLeaveControls';
import { ResponsivePage } from '@/components/layout/ResponsivePage';

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
    <ResponsivePage contentMaxWidth={720} scroll testID="settings-page">
      <View style={styles.content}>
        <AppPageHeader backHref="/" title="설정" />
        <AppSection title="앱 환경">
          <ListRow description="연결 실패 시 다른 모드로 자동 전환하지 않아요." title="실행 모드" value={mode === 'demo' ? '데모' : 'Supabase'} />
          <InlineNotice message={mode === 'demo' ? '데모 모드로 실행 중' : 'Supabase 모드로 실행 중'} />
        </AppSection>

        {mode === 'supabase' && auth ? (
          <AppSection title="계정과 집" description="로그아웃, 집 나가기, 계정 삭제는 서로 다른 작업이에요.">
            <ListRow description="이전 사용자 캐시를 기기에서 제거해요." title="로그아웃" trailing={<AppButton label="로그아웃" onPress={() => void auth.signOut()} tone="quiet" />} />
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
                <AppText variant="sectionTitle">정말 계정을 삭제할까요?</AppText>
                <AppText tone="secondary">집 퇴장과 가구 회수 뒤 개인 기록·사진·토큰이 정리돼요. 다른 친구의 기록과 완성 가구는 남아요.</AppText>
                <View style={styles.row}>
                  <AppButton disabled={deletingAccount} label="취소" onPress={() => setConfirmingDeletion(false)} tone="quiet" />
                  <AppButton disabled={deletingAccount} label="계정 삭제 확인" onPress={() => void requestAccountDeletion()} tone="danger" />
                </View>
              </View>
            )}
            {deletionMessage ? <InlineNotice message={deletionMessage} tone={deletionMessage.includes('완료') ? 'success' : deletionMessage.includes('못했') ? 'danger' : 'warning'} /> : null}
          </AppSection>
        ) : null}

        {mode === 'demo' && canResetDemo(repository) ? (
          <AppSection title="데모 도구" description="데모 모드에서만 보이는 개발·체험 기능이에요.">
            {onOpenAssets ? (
              <AppButton label="55종 에셋 보기" onPress={onOpenAssets} tone="quiet" />
            ) : null}
            {!confirming ? (
              <AppButton label="데모 데이터 초기화" onPress={() => setConfirming(true)} tone="secondary" />
            ) : (
              <View style={styles.confirmation}>
                <AppText variant="sectionTitle">정말 처음으로 돌릴까요?</AppText>
                <AppText tone="secondary">동물 행동과 가구 배치가 처음 상태로 돌아가요.</AppText>
                <View style={styles.row}>
                  <AppButton disabled={resetting} label="취소" onPress={() => setConfirming(false)} tone="quiet" />
                  <AppButton disabled={resetting} label="초기화 확인" onPress={() => void resetDemo()} tone="secondary" />
                </View>
              </View>
            )}
          </AppSection>
        ) : null}
      </View>
    </ResponsivePage>
  );
}

const styles = StyleSheet.create({
  content: { gap: spacing.xxl, paddingBottom: spacing.xl },
  confirmation: { backgroundColor: colors.dangerSoft, borderRadius: radii.card, gap: spacing.md, padding: spacing.lg },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
});
