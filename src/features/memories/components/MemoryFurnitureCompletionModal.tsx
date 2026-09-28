import { StyleSheet, View } from 'react-native';

import type { MemorySummary } from '@/domain/models';
import { HouseOverlay } from '@/features/house-shell/components/HouseOverlay';
import { AppButton } from '@/components/ui/AppButton';
import { AppText } from '@/components/ui/AppText';
import { spacing } from '@/theme/tokens';

export function MemoryFurnitureCompletionModal({ memory, onDismiss, onKeepInInventory, onPlaceInRoom, visible }: { memory: MemorySummary; visible: boolean; onDismiss: () => void; onKeepInInventory: () => void; onPlaceInRoom: () => void }) {
  return <HouseOverlay accessibilityLabel="추억 가구 완성" dismissLabel="추억 완성 닫기" onDismiss={onDismiss} visible={visible}><View style={styles.content}><AppText style={styles.sparkle}>✨</AppText><AppText variant="heading">새로운 추억이 가구가 되었어요!</AppText><AppText style={styles.furniture}>📻</AppText><AppText variant="label">「{memory.title}」</AppText><View style={styles.actions}><AppButton label="보관함에 두기" onPress={onKeepInInventory} tone="quiet" /><AppButton label="방에 놓기" onPress={onPlaceInRoom} /></View></View></HouseOverlay>;
}

const styles = StyleSheet.create({ content: { alignItems: 'center', gap: spacing.md }, sparkle: { fontSize: 32 }, furniture: { fontSize: 58 }, actions: { flexDirection: 'row', gap: spacing.sm } });
