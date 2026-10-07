import { useRef, useState } from 'react';
import { View } from 'react-native';

import { ResponsiveFormPage } from '@/components/layout/ResponsiveFormPage';
import { AppButton } from '@/components/ui/AppButton';
import { AppInput } from '@/components/ui/AppInput';
import { AppPageHeader } from '@/components/ui/AppPageHeader';
import { AppText } from '@/components/ui/AppText';
import { InlineNotice } from '@/components/ui/InlineNotice';
import type { CreateHouseInput } from '@/domain/models';
import { spacing } from '@/theme/tokens';

import { validateHouseName } from '../houseValidation';

type HouseCreateScreenProps = {
  createRequestId?: () => string;
  onCreate: (input: CreateHouseInput) => Promise<unknown>;
  onCreated: () => void;
  onOpenExistingHouse?: () => void;
};

function defaultRequestId(): string {
  const cryptoWithUuid = globalThis.crypto as Crypto | undefined;
  if (cryptoWithUuid?.randomUUID) return cryptoWithUuid.randomUUID();
  return `house-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function HouseCreateScreen({ createRequestId = defaultRequestId, onCreate, onCreated, onOpenExistingHouse }: HouseCreateScreenProps) {
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [alreadyInHouse, setAlreadyInHouse] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const requestId = useRef<string | null>(null);

  async function submit() {
    const validation = validateHouseName(name);
    if (validation) {
      setError(validation);
      return;
    }

    requestId.current ??= createRequestId();
    setSubmitting(true);
    setError(null);
    setAlreadyInHouse(false);
    try {
      await onCreate({ name: name.trim(), requestId: requestId.current });
      onCreated();
    } catch (caught) {
      const message = typeof caught === 'object' && caught && 'message' in caught ? String(caught.message) : '';
      if (message === 'already_in_house') {
        setAlreadyInHouse(true);
        setError('이미 살고 있는 집이 있어요.');
      } else {
        setError('집을 만들지 못했어요. 입력은 유지했으니 다시 시도해 주세요.');
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <ResponsiveFormPage maxWidth={640} testID="house-create-page">
      <AppPageHeader backHref="/house/choose" title="새 우리집" />
      <View style={{ gap: spacing.sm }}>
        <AppText variant="display">우리 집의 이름을 지어 주세요</AppText>
        <AppText tone="secondary">혼자서도 바로 시작하고, 친구는 나중에 초대할 수 있어요.</AppText>
      </View>
      <AppInput
        autoFocus
        helperText="친구들이 초대 화면에서 확인할 이름이에요."
        label="집 이름"
        maxLength={30}
        onChangeText={setName}
        placeholder="예: 도란도란 우리집"
        value={name}
      />
      {error ? <InlineNotice message={error} tone="danger" /> : null}
      <AppButton disabled={submitting} label={submitting ? '집 만드는 중…' : '집 만들기'} onPress={() => void submit()} />
      {alreadyInHouse && onOpenExistingHouse ? (
        <AppButton label="기존 집 열기" onPress={onOpenExistingHouse} tone="quiet" />
      ) : null}
    </ResponsiveFormPage>
  );
}
