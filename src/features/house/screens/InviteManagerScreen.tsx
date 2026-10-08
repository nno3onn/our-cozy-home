import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import type { CreatedInvite } from '@/domain/models';
import { AppButton } from '@/components/ui/AppButton';
import { AppPageHeader } from '@/components/ui/AppPageHeader';
import { AppSection } from '@/components/ui/AppSection';
import { AppText } from '@/components/ui/AppText';
import { InlineNotice } from '@/components/ui/InlineNotice';
import { colors, radii, spacing } from '@/theme/tokens';
import { InviteCard } from '@/features/illustrated-ui/overlays/InviteCard';
import { ResponsiveFormPage } from '@/components/layout/ResponsiveFormPage';

type InviteManagerScreenProps = {
  createLink: (token: string) => string;
  onCancelInvite: () => Promise<void>;
  onCreateInvite: (reissue: boolean) => Promise<CreatedInvite>;
};

export function InviteManagerScreen({ createLink, onCancelInvite, onCreateInvite }: InviteManagerScreenProps) {
  const [invite, setInvite] = useState<CreatedInvite | null>(null);
  const [feedback, setFeedback] = useState<{ message: string; tone: 'success' | 'danger' } | null>(null);
  const [confirmation, setConfirmation] = useState<'reissue' | 'cancel' | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function createInvite(reissue: boolean) {
    setSubmitting(true);
    setFeedback(null);
    try {
      setInvite(await onCreateInvite(reissue));
      setConfirmation(null);
    } catch {
      setFeedback({ message: '초대를 만들지 못했어요. 연결을 확인한 뒤 다시 시도해 주세요.', tone: 'danger' });
    } finally {
      setSubmitting(false);
    }
  }

  async function cancelInvite() {
    setSubmitting(true);
    setFeedback(null);
    try {
      await onCancelInvite();
      setInvite(null);
      setConfirmation(null);
      setFeedback({ message: '초대를 취소했어요. 기존 링크는 더 이상 사용할 수 없어요.', tone: 'success' });
    } catch {
      setFeedback({ message: '초대를 취소하지 못했어요. 연결을 확인한 뒤 다시 시도해 주세요.', tone: 'danger' });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <ResponsiveFormPage maxWidth={640} testID="invite-manager-page">
        <View style={styles.content}>
          <AppPageHeader backHref="/" title="친구 초대" />
          <InlineNotice message="초대를 본다고 자리가 예약되지는 않아요. 수락 순서대로 입주해요." />
          {invite ? <InviteCard createLink={createLink} invite={invite} /> : null}
          {feedback ? <InlineNotice message={feedback.message} tone={feedback.tone} /> : null}
          {!invite ? <AppButton disabled={submitting} label={submitting ? '초대 만드는 중…' : '초대 만들기'} onPress={() => void createInvite(false)} /> : null}
          {invite && confirmation === null ? <AppSection title="초대 관리" description="재발급하거나 취소하면 지금 링크는 즉시 무효화돼요."><AppButton disabled={submitting} label="새 초대 재발급" onPress={() => setConfirmation('reissue')} tone="secondary" /><AppButton disabled={submitting} label="초대 취소" onPress={() => setConfirmation('cancel')} tone="danger" /></AppSection> : null}
          {confirmation ? <View style={[styles.confirmation, confirmation === 'cancel' && styles.dangerConfirmation]}><AppText variant="sectionTitle">{confirmation === 'reissue' ? '새 초대를 만들까요?' : '현재 초대를 취소할까요?'}</AppText><AppText tone="secondary">{confirmation === 'reissue' ? '기존 링크는 즉시 사용할 수 없게 돼요.' : '취소하면 이 링크와 코드는 다시 활성화할 수 없어요.'}</AppText><View style={styles.actions}><AppButton disabled={submitting} label="돌아가기" onPress={() => setConfirmation(null)} tone="quiet" /><AppButton disabled={submitting} label={confirmation === 'reissue' ? '재발급 확인' : '취소 확인'} onPress={() => confirmation === 'reissue' ? void createInvite(true) : void cancelInvite()} tone={confirmation === 'reissue' ? 'primary' : 'danger'} /></View></View> : null}
        </View>
    </ResponsiveFormPage>
  );
}

const styles = StyleSheet.create({
  content: { gap: spacing.xl },
  confirmation: { backgroundColor: colors.brandSoft, borderRadius: radii.card, gap: spacing.md, padding: spacing.lg },
  dangerConfirmation: { backgroundColor: colors.dangerSoft },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
});
