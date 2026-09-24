import { useRef, useState } from 'react';
import { View } from 'react-native';

import type { AcceptInviteInput, InviteAcceptance } from '@/domain/models';
import { AppButton } from '@/components/ui/AppButton';
import { AppText } from '@/components/ui/AppText';
import { OfflineReadOnlyBanner } from '@/components/OfflineReadOnlyBanner';
import { useConnectionStatus } from '@/network/ConnectionProvider';
import { spacing } from '@/theme/tokens';

type InviteAcceptanceControlsProps = {
  token: string;
  createRequestId?: () => string;
  onAccept: (input: AcceptInviteInput) => Promise<InviteAcceptance>;
  onJoined: () => void;
};

function defaultRequestId(): string {
  const cryptoWithUuid = globalThis.crypto as Crypto | undefined;
  if (cryptoWithUuid?.randomUUID) return cryptoWithUuid.randomUUID();
  return `invite-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function acceptanceErrorMessage(error: unknown): string {
  const message = typeof error === 'object' && error && 'message' in error ? String(error.message) : '';
  if (message === 'house_full') return '집이 꽉 찼어요. 다른 우리집을 찾아봐요.';
  if (message === 'already_in_house') return '이미 살고 있는 집이 있어요.';
  if (message === 'invite_expired') return '초대가 만료됐어요. 새 초대를 요청해 주세요.';
  if (message === 'invite_cancelled') return '초대가 취소됐어요. 새 초대를 요청해 주세요.';
  return '입주를 확인하지 못했어요. 연결을 확인한 뒤 같은 요청을 다시 시도해 주세요.';
}

export function InviteAcceptanceControls({ token, createRequestId = defaultRequestId, onAccept, onJoined }: InviteAcceptanceControlsProps) {
  const isOnline = useConnectionStatus();
  const requestId = useRef<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function accept() {
    requestId.current ??= createRequestId();
    setSubmitting(true);
    setError(null);
    try {
      await onAccept({ token, requestId: requestId.current });
      onJoined();
    } catch (caught) {
      setError(acceptanceErrorMessage(caught));
    } finally {
      setSubmitting(false);
    }
  }

  return <View style={{ gap: spacing.sm }}>
    {!isOnline ? <OfflineReadOnlyBanner /> : null}
    {error ? <AppText tone="danger">{error}</AppText> : null}
    <AppButton disabled={!isOnline || submitting} label={submitting ? '입주 확인 중…' : '이 집에 입주하기'} onPress={() => void accept()} />
  </View>;
}
