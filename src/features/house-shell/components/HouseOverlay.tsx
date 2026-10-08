import type { PropsWithChildren } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useReducedMotion } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

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
  const reducedMotion = useReducedMotion();

  return (
    <Modal animationType={reducedMotion ? 'none' : 'slide'} onRequestClose={onDismiss} transparent visible={visible}>
      <View style={styles.root}>
        <Pressable accessibilityLabel="패널 바깥 영역 닫기" accessibilityRole="button" onPress={onDismiss} style={styles.scrim} />
        <SafeAreaView accessibilityLabel={accessibilityLabel} accessibilityViewIsModal edges={['bottom']} role="dialog" style={styles.sheet}>
          <View style={styles.handle} />
          <View style={styles.close}><AppButton accessibilityLabel={dismissLabel} icon={<AppText style={styles.closeMark}>×</AppText>} onPress={onDismiss} tone="icon" /></View>
          <ScrollView
            contentContainerStyle={styles.content}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            style={styles.scroll}
            testID="house-overlay-scroll"
          >
            {children}
          </ScrollView>
        </SafeAreaView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { zIndex: zIndex.sheet, flex: 1, justifyContent: 'flex-end' },
  scrim: { ...StyleSheet.absoluteFill, backgroundColor: colors.scrim },
  sheet: { backgroundColor: colors.surface, borderTopLeftRadius: radii.sheet, borderTopRightRadius: radii.sheet, gap: spacing.lg, maxHeight: '90%', minHeight: 310, padding: spacing.xl },
  handle: { alignSelf: 'center', width: 40, height: 4, borderRadius: radii.pill, backgroundColor: colors.border },
  close: { position: 'absolute', right: spacing.md, top: spacing.md },
  closeMark: { fontSize: 24, lineHeight: 26 },
  scroll: { flexShrink: 1 },
  content: { gap: spacing.lg, paddingBottom: spacing.xs },
});
