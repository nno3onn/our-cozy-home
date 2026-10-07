import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { ResponsiveFormPage } from '@/components/layout/ResponsiveFormPage';
import { AppButton } from '@/components/ui/AppButton';
import { AppInput } from '@/components/ui/AppInput';
import { AppPageHeader } from '@/components/ui/AppPageHeader';
import { AppSection } from '@/components/ui/AppSection';
import { AppText } from '@/components/ui/AppText';
import { InlineNotice } from '@/components/ui/InlineNotice';
import { spacing } from '@/theme/tokens';

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
    <ResponsiveFormPage maxWidth={640} testID="house-entry-page">
      <AppPageHeader backHref="/" title="우리집 시작하기" />
      <View style={styles.intro}>
        <AppText variant="display">어떤 집에서 시작할까요?</AppText>
        <AppText tone="secondary">혼자 새 집을 만들거나 친구가 보낸 초대를 확인해요.</AppText>
      </View>

      <AppSection description="집 이름은 나중에도 바꿀 수 있어요." title="새로운 집">
        <AppButton label="새 집 만들기" onPress={onCreateHouse} />
      </AppSection>

      <AppSection description="화면을 보는 것만으로 자리가 예약되지는 않아요." title="친구 집에 입주하기">
        <AppInput
          autoCapitalize="none"
          label="초대 코드 또는 링크"
          onChangeText={(value) => {
            setInviteValue(value);
            setError(null);
          }}
          placeholder="초대 코드 또는 링크"
          value={inviteValue}
        />
        {error ? <InlineNotice message={error} tone="danger" /> : null}
        <AppButton label="초대 확인하기" onPress={openInvite} tone="quiet" />
      </AppSection>
    </ResponsiveFormPage>
  );
}

const styles = StyleSheet.create({ intro: { gap: spacing.sm } });
