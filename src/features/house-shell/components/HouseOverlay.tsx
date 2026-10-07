import type { PropsWithChildren } from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';

import { AppButton } from '@/components/ui/AppButton';
import { AppText } from '@/components/ui/AppText';
import { colors, radii, spacing, zIndex } from '@/theme/tokens';

type HouseOverlayProps = PropsWithChildren<{
  visible: boolean;
  accessibilityLabel: string;
  dismissLabel?: string;
  onDismiss: () => void;
}>;

export function HouseOverlay({
  accessibilityLabel,
  children,
  dismissLabel = '패널 닫기',
  onDismiss,
  visible,
}: HouseOverlayProps) {
  return (
    <Modal animationType="slide" onRequestClose={onDismiss} transparent visible={visible}>
      <View style={styles.root}>
        <Pressable accessibilityLabel="패널 바깥 영역 닫기" accessibilityRole="button" onPress={onDismiss} style={styles.scrim} />
        <View accessibilityLabel={accessibilityLabel} accessibilityViewIsModal style={styles.sheet}>
          <View style={styles.handle} />
          <View style={styles.close}><AppButton accessibilityLabel={dismissLabel} icon={<AppText style={styles.closeMark}>×</AppText>} onPress={onDismiss} tone="icon" /></View>
          {children}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { zIndex: zIndex.sheet, flex: 1, justifyContent: 'flex-end' },
  scrim: { ...StyleSheet.absoluteFill, backgroundColor: colors.scrim },
  sheet: { backgroundColor: colors.surface, borderTopLeftRadius: radii.sheet, borderTopRightRadius: radii.sheet, gap: spacing.lg, minHeight: 310, padding: spacing.xl },
  handle: { alignSelf: 'center', width: 40, height: 4, borderRadius: radii.pill, backgroundColor: colors.border },
  close: { position: 'absolute', right: spacing.md, top: spacing.md },
  closeMark: { fontSize: 24, lineHeight: 26 },
});
