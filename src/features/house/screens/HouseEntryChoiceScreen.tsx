import { useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppButton } from '@/components/ui/AppButton';
import { AppText } from '@/components/ui/AppText';
import { colors, spacing } from '@/theme/tokens';

type HouseEntryChoiceScreenProps = {
  onCreateHouse(): void;
  onOpenInvite(token: string): void;
};

function extractInviteToken(value: string): string {
  const trimmed = value.trim();
  const linkToken = trimmed.match(/(?:^|\/)invite\/([^/?#]+)/)?.[1];
  return linkToken ? decodeURIComponent(linkToken) : trimmed;
}

export function HouseEntryChoiceScreen({ onCreateHouse, onOpenInvite }: HouseEntryChoiceScreenProps) {
  const [inviteValue, setInviteValue] = useState('');
  const [error, setError] = useState<string | null>(null);

  function openInvite() {
    const token = extractInviteToken(inviteValue);
    if (!token) {
      setError('초대 코드 또는 링크를 입력해 주세요.');
      return;
    }
    setError(null);
    onOpenInvite(token);
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.content}>
        <AppText variant="title">어떤 집에서 시작할까요?</AppText>
        <AppText tone="muted">혼자 새 집을 만들거나 친구의 초대를 확인할 수 있어요.</AppText>
        <AppButton label="새 집 만들기" onPress={onCreateHouse} />
        <View style={styles.inviteArea}>
          <AppText variant="label">친구 초대로 입주하기</AppText>
          <TextInput
            accessibilityLabel="초대 코드 또는 링크"
            autoCapitalize="none"
            onChangeText={(value) => { setInviteValue(value); setError(null); }}
            placeholder="초대 코드 또는 링크"
            style={styles.input}
            value={inviteValue}
          />
          {error ? <AppText tone="danger">{error}</AppText> : null}
          <AppButton label="초대 확인하기" onPress={openInvite} tone="secondary" />
          <AppText tone="muted" variant="caption">입주 가능 여부와 빈자리는 다음 화면에서 서버가 확인해요.</AppText>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.cream },
  content: { flex: 1, justifyContent: 'center', gap: spacing.md, padding: spacing.xl },
  inviteArea: { gap: spacing.sm, marginTop: spacing.md },
  input: { minHeight: 48, borderWidth: 1, borderColor: colors.line, borderRadius: 12, paddingHorizontal: 12, backgroundColor: colors.paper, color: colors.ink },
});
