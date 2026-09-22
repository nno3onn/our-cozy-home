import { useState } from 'react';
import { View } from 'react-native';

import type { HouseLeaveResult } from '@/domain/models';
import { AppButton } from '@/components/ui/AppButton';
import { AppText } from '@/components/ui/AppText';
import { spacing } from '@/theme/tokens';

export function HouseLeaveControls({ onLeave, onLeft }: { onLeave: () => Promise<HouseLeaveResult>; onLeft: () => void }) {
  const [confirming, setConfirming] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  async function leave() {
    setSubmitting(true);
    setError(null);
    try {
      await onLeave();
      onLeft();
    } catch {
      setError('우리집을 나가지 못했어요. 연결을 확인한 뒤 다시 시도해 주세요.');
    } finally {
      setSubmitting(false);
    }
  }
  if (!confirming) return <AppButton label="우리집 나가기" onPress={() => setConfirming(true)} tone="danger" />;
  return <View style={{ gap: spacing.sm }}><AppText variant="label">정말 우리집을 나갈까요?</AppText><AppText tone="muted" variant="caption">내 동물과 코인, 인벤토리는 그대로 보관돼요.</AppText>{error ? <AppText tone="danger">{error}</AppText> : null}<View style={{ flexDirection: 'row', gap: spacing.sm }}><AppButton disabled={submitting} label="취소" onPress={() => setConfirming(false)} tone="quiet" /><AppButton disabled={submitting} label={submitting ? '나가는 중…' : '나가기 확인'} onPress={() => void leave()} tone="danger" /></View></View>;
}
