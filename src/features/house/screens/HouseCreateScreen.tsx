import { useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import type { CreateHouseInput } from '@/domain/models';
import { AppButton } from '@/components/ui/AppButton';
import { AppText } from '@/components/ui/AppText';
import { colors, spacing } from '@/theme/tokens';

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

export function HouseCreateScreen({
  createRequestId = defaultRequestId,
  onCreate,
  onCreated,
  onOpenExistingHouse,
}: HouseCreateScreenProps) {
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
      const message = typeof caught === 'object' && caught && 'message' in caught
        ? String(caught.message)
        : '';
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
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.keyboard}>
        <View style={styles.content}>
          <AppText variant="title">새 우리집 만들기</AppText>
          <AppText tone="muted">혼자서도 시작할 수 있어요. 친구는 나중에 초대해요.</AppText>
          <TextInput
            accessibilityLabel="집 이름"
            autoFocus
            maxLength={30}
            onChangeText={setName}
            placeholder="예: 도란도란 우리집"
            style={styles.input}
            value={name}
          />
          {error ? <AppText tone="danger">{error}</AppText> : null}
          <AppButton disabled={submitting} label={submitting ? '집 만드는 중…' : '집 만들기'} onPress={() => void submit()} />
          {alreadyInHouse && onOpenExistingHouse ? (
            <AppButton label="기존 집 열기" onPress={onOpenExistingHouse} tone="secondary" />
          ) : null}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.cream },
  keyboard: { flex: 1 },
  content: { flex: 1, justifyContent: 'center', gap: spacing.md, padding: spacing.xl },
  input: {
    minHeight: 48,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 12,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.paper,
    color: colors.ink,
  },
});
