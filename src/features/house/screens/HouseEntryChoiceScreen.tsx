import { useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';

import { AppButton } from '@/components/ui/AppButton';
import { AppText } from '@/components/ui/AppText';
import { colors, spacing } from '@/theme/tokens';
import { Panel } from '@/components/ui/Panel';
import { ResponsiveFormPage } from '@/components/layout/ResponsiveFormPage';

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
    <ResponsiveFormPage fallbackHref="/" maxWidth={640} testID="house-entry-page">
      <View style={styles.content}>
        <AppText variant="title">어떤 집에서 시작할까요?</AppText>
        <AppText tone="muted">혼자 새 집을 만들거나 친구의 초대를 확인할 수 있어요.</AppText>
        <Panel style={styles.newHome}><View style={styles.optionHeading}><AppText style={styles.homeArt}>⌂</AppText><View style={styles.optionCopy}><AppText variant="heading">새 우리집</AppText><AppText tone="muted" variant="caption">혼자서 먼저 시작해요</AppText></View></View><AppButton label="새 집 만들기" onPress={onCreateHouse} /></Panel>
        <Panel style={styles.inviteArea}>
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
        </Panel>
      </View>
    </ResponsiveFormPage>
  );
}

const styles = StyleSheet.create({
  content: { gap: spacing.md },
  newHome: { gap: spacing.sm, padding: spacing.lg },
  optionHeading: { alignItems: 'center', flexDirection: 'row', gap: spacing.md },
  homeArt: { color: '#F49A86', fontSize: 40, lineHeight: 42 },
  optionCopy: { flex: 1, gap: 1 },
  inviteArea: { gap: spacing.sm, marginTop: spacing.md, padding: spacing.lg },
  input: { minHeight: 48, borderWidth: 1, borderColor: colors.line, borderRadius: 12, paddingHorizontal: 12, backgroundColor: colors.paper, color: colors.ink },
});
