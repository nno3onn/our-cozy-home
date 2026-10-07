import { StyleSheet, View } from 'react-native';

import { colors, radii, spacing } from '@/theme/tokens';

import { AppText } from './AppText';

type NoticeTone = 'info' | 'success' | 'warning' | 'danger';
type InlineNoticeProps = { message: string; title?: string; tone?: NoticeTone };

const toneMeta: Record<NoticeTone, { backgroundColor: string; label: string; textTone: 'brand' | 'success' | 'warning' | 'danger' }> = {
  info: { backgroundColor: colors.brandSoft, label: '안내', textTone: 'brand' },
  success: { backgroundColor: colors.successSoft, label: '완료', textTone: 'success' },
  warning: { backgroundColor: colors.warningSoft, label: '주의', textTone: 'warning' },
  danger: { backgroundColor: colors.dangerSoft, label: '오류', textTone: 'danger' },
};

export function InlineNotice({ message, title, tone = 'info' }: InlineNoticeProps) {
  const meta = toneMeta[tone];
  return (
    <View
      accessible
      accessibilityLabel={[meta.label, title, message].filter(Boolean).join('. ')}
      accessibilityRole="alert"
      style={[styles.notice, { backgroundColor: meta.backgroundColor }]}
    >
      <AppText tone={meta.textTone} variant="label">{meta.label}</AppText>
      <View style={styles.copy}>
        {title ? <AppText variant="bodyStrong">{title}</AppText> : null}
        <AppText tone="secondary" variant="caption">{message}</AppText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  notice: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md, padding: spacing.lg, borderRadius: radii.card },
  copy: { minWidth: 0, flex: 1, gap: spacing.xs },
});
