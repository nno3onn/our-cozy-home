import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useOptionalAuth } from '@/auth/AuthProvider';
import { AppButton } from '@/components/ui/AppButton';
import { AppText } from '@/components/ui/AppText';
import { EmptyState } from '@/components/ui/EmptyState';
import { useRepository } from '@/repositories/RepositoryContext';
import { colors, spacing } from '@/theme/tokens';
import { InviteAcceptanceControls } from '@/features/house/screens/InviteAcceptanceControls';
import { homeSnapshotKey } from '@/features/room/hooks/useHomeSnapshot';

const stateCopy = {
  cancelled: ['초대가 취소됐어요', '집 관리자에게 새 초대를 요청해 주세요.'],
  expired: ['초대가 만료됐어요', '초대는 만든 뒤 24시간 동안만 사용할 수 있어요.'],
  full: ['집이 꽉 찼어요', '빈자리가 생겨도 종료된 초대는 다시 열리지 않아요.'],
  invalid: ['초대를 찾지 못했어요', '링크가 올바른지 확인해 주세요.'],
  reissued: ['새 초대가 발급됐어요', '집 관리자에게 최신 링크를 요청해 주세요.'],
} as const;

export default function InvitePreviewRoute() {
  const { token } = useLocalSearchParams<{ token: string }>();
  const router = useRouter();
  const repository = useRepository();
  const auth = useOptionalAuth();
  const queryClient = useQueryClient();
  const preview = useQuery({ queryKey: ['invite-preview', token], queryFn: () => repository.previewInvite(token), enabled: Boolean(token) });
  const acceptance = useMutation({
    mutationFn: (input: { token: string; requestId: string }) => repository.acceptInvite(input),
    onSuccess: async () => { await queryClient.invalidateQueries({ queryKey: homeSnapshotKey }); },
  });

  if (preview.isPending) return <SafeAreaView style={styles.center}><ActivityIndicator accessibilityLabel="초대 확인 중" color={colors.ink} /></SafeAreaView>;
  if (preview.isError || !preview.data) return <SafeAreaView style={styles.center}><EmptyState title="초대를 확인하지 못했어요" description="연결을 확인하고 다시 시도해 주세요." actionLabel="다시 시도" onAction={() => void preview.refetch()} /></SafeAreaView>;
  if (preview.data.state !== 'active') {
    const [title, description] = stateCopy[preview.data.state];
    return <SafeAreaView style={styles.center}><EmptyState title={title} description={description} /></SafeAreaView>;
  }
  const continueToSignIn = () => { auth?.setPendingInvite(token); router.push('/auth/sign-in'); };
  return <SafeAreaView style={styles.center}><View style={styles.card}><AppText variant="title">{preview.data.houseName}</AppText><AppText tone="muted">{preview.data.inviterName}님이 초대했어요 · 현재 {preview.data.currentMemberCount}/4명</AppText><AppText tone="muted" variant="caption">추억 사진과 글은 입주 전에는 볼 수 없어요.</AppText>{auth?.state.status === 'signed_out' ? <AppButton label="로그인하고 입주하기" onPress={continueToSignIn} /> : auth?.state.status === 'signed_in' ? <InviteAcceptanceControls onAccept={acceptance.mutateAsync} onJoined={() => router.replace('/')} token={token} /> : <AppText tone="muted">데모 모드에서는 초대 미리보기만 확인할 수 있어요.</AppText>}</View></SafeAreaView>;
}

const styles = StyleSheet.create({ center: { flex: 1, justifyContent: 'center', padding: spacing.xl, backgroundColor: colors.cream }, card: { gap: spacing.md } });
