import { useState } from 'react';
import { View } from 'react-native';

import type { HouseLeaveResult } from '@/domain/models';
import { AppButton } from '@/components/ui/AppButton';
import { AppText } from '@/components/ui/AppText';
import { InlineNotice } from '@/components/ui/InlineNotice';
import { colors, radii, spacing } from '@/theme/tokens';

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
  return <View style={styles.confirmation}><AppText variant="sectionTitle">정말 우리집을 나갈까요?</AppText><View style={styles.details}><AppText tone="secondary">내 동물·코인·인벤토리·배운 버릇은 유지돼요.</AppText><AppText tone="secondary">내가 산 가구는 개인 보관함으로 회수돼요.</AppText><AppText tone="secondary">집장이면 가장 먼저 입주한 친구에게 권한이 넘어가요.</AppText><AppText tone="secondary">마지막 멤버일 때만 집이 보관 상태가 돼요.</AppText></View>{error ? <InlineNotice message={error} tone="danger" /> : null}<View style={styles.row}><AppButton disabled={submitting} label="취소" onPress={() => setConfirming(false)} tone="quiet" /><AppButton disabled={submitting} label={submitting ? '나가는 중…' : '나가기 확인'} onPress={() => void leave()} tone="danger" /></View></View>;
}

const styles = {
  confirmation: { backgroundColor: colors.dangerSoft, borderRadius: radii.card, gap: spacing.md, padding: spacing.lg },
  details: { gap: spacing.sm },
  row: { flexDirection: 'row' as const, flexWrap: 'wrap' as const, gap: spacing.sm },
};
