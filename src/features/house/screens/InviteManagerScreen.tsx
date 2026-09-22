import { useState } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import type { CreatedInvite } from '@/domain/models';
import { AppButton } from '@/components/ui/AppButton';
import { AppText } from '@/components/ui/AppText';
import { colors, spacing } from '@/theme/tokens';

type InviteManagerScreenProps = {
  createLink: (token: string) => string;
  onCreateInvite: (reissue: boolean) => Promise<CreatedInvite>;
};

export function InviteManagerScreen({ createLink, onCreateInvite }: InviteManagerScreenProps) {
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

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.keyboard}>
        <View style={styles.content}>
          <AppText variant="title">친구 초대</AppText>
          <AppText tone="muted">초대를 본다고 자리가 예약되지는 않아요. 수락 순서대로 입주해요.</AppText>
          {invite ? (
            <View style={styles.result}>
              <AppText variant="label">초대 코드</AppText>
              <AppText variant="title">{invite.code}</AppText>
              <TextInput
                accessibilityLabel="초대 링크"
                editable={false}
                selectTextOnFocus
                style={styles.link}
                value={createLink(invite.token)}
              />
              <AppText tone="muted" variant="caption">이 초대는 만든 뒤 24시간 동안 사용할 수 있어요.</AppText>
            </View>
          ) : null}
          {error ? <AppText tone="danger">{error}</AppText> : null}
          <AppButton
            disabled={submitting}
            label={submitting ? '초대 만드는 중…' : invite ? '새 초대 재발급' : '초대 만들기'}
            onPress={() => void createInvite(Boolean(invite))}
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.cream },
  keyboard: { flex: 1 },
  content: { flex: 1, gap: spacing.md, justifyContent: 'center', padding: spacing.xl },
  result: { gap: spacing.sm, borderWidth: 1, borderColor: colors.line, borderRadius: 16, padding: spacing.lg, backgroundColor: colors.paper },
  link: { minHeight: 48, borderWidth: 1, borderColor: colors.line, borderRadius: 12, paddingHorizontal: spacing.md, color: colors.ink, backgroundColor: colors.cream },
});
