import type { PropsWithChildren } from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';

import { AppButton } from '@/components/ui/AppButton';
import { colors, radii, spacing } from '@/theme/tokens';

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
          <AppButton accessibilityLabel={dismissLabel} icon={null} onPress={onDismiss} tone="quiet" />
          {children}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, justifyContent: 'flex-end' },
  scrim: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(56, 51, 46, 0.4)' },
  sheet: { backgroundColor: colors.paper, borderTopLeftRadius: radii.scene, borderTopRightRadius: radii.scene, gap: spacing.md, minHeight: 310, padding: spacing.lg },
});
