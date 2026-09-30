import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import type { CreatedInvite } from '@/domain/models';
import { AppButton } from '@/components/ui/AppButton';
import { AppText } from '@/components/ui/AppText';
import { spacing } from '@/theme/tokens';
import { InviteCard } from '@/features/illustrated-ui/overlays/InviteCard';
import { ResponsiveFormPage } from '@/components/layout/ResponsiveFormPage';

type InviteManagerScreenProps = {
  createLink: (token: string) => string;
  onCancelInvite: () => Promise<void>;
  onCreateInvite: (reissue: boolean) => Promise<CreatedInvite>;
};

export function InviteManagerScreen({ createLink, onCancelInvite, onCreateInvite }: InviteManagerScreenProps) {
  const [invite, setInvite] = useState<CreatedInvite | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function createInvite(reissue: boolean) {
    setSubmitting(true);
    setError(null);
    try {
      setInvite(await onCreateInvite(reissue));
    } catch {
      setError('초대를 만들지 못했어요. 연결을 확인한 뒤 다시 시도해 주세요.');
    } finally {
      setSubmitting(false);
    }
  }

  async function cancelInvite() {
    setSubmitting(true);
    setError(null);
    try {
      await onCancelInvite();
      setInvite(null);
      setError('초대를 취소했어요. 기존 링크는 더 이상 사용할 수 없어요.');
    } catch {
      setError('초대를 취소하지 못했어요. 연결을 확인한 뒤 다시 시도해 주세요.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <ResponsiveFormPage fallbackHref="/" maxWidth={640} testID="invite-manager-page">
        <View style={styles.content}>
          <AppText variant="title">친구 초대</AppText>
          <AppText tone="muted">초대를 본다고 자리가 예약되지는 않아요. 수락 순서대로 입주해요.</AppText>
          {invite ? <InviteCard createLink={createLink} invite={invite} /> : null}
          {error ? <AppText tone="danger">{error}</AppText> : null}
          <AppButton
            disabled={submitting}
            label={submitting ? '초대 만드는 중…' : invite ? '새 초대 재발급' : '초대 만들기'}
            onPress={() => void createInvite(Boolean(invite))}
          />
          {invite ? <AppButton disabled={submitting} label="초대 취소" onPress={() => void cancelInvite()} tone="quiet" /> : null}
        </View>
    </ResponsiveFormPage>
  );
}

const styles = StyleSheet.create({
  content: { gap: spacing.md },
});
