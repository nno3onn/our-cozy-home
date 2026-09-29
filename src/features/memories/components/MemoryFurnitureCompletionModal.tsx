import { StyleSheet, View } from 'react-native';

import type { MemorySummary } from '@/domain/models';
import { HouseOverlay } from '@/features/house-shell/components/HouseOverlay';
import { AppButton } from '@/components/ui/AppButton';
import { AppText } from '@/components/ui/AppText';
import { FurnitureSprite } from '@/features/illustrated-ui/scene/FurnitureSprite';
import { spacing } from '@/theme/tokens';

export function MemoryFurnitureCompletionModal({ memory, onDismiss, onKeepInInventory, onPlaceInRoom, visible }: { memory: MemorySummary; visible: boolean; onDismiss: () => void; onKeepInInventory: () => void; onPlaceInRoom: () => void }) {
  return <HouseOverlay accessibilityLabel="추억 가구 완성" dismissLabel="추억 완성 닫기" onDismiss={onDismiss} visible={visible}><View style={styles.content}><AppText style={styles.sparkle}>✦ ✦ ✦</AppText><AppText variant="heading">새로운 추억이 가구가 되었어요!</AppText><View style={styles.furniture}><FurnitureSprite itemId="table-round-cookie" /></View><AppText variant="label">「{memory.title}」</AppText><AppText tone="muted" variant="caption">두 명이 함께 남긴 기록이 우리집의 가구가 되었어요.</AppText><View style={styles.actions}><AppButton label="보관함에 두기" onPress={onKeepInInventory} tone="quiet" /><AppButton label="방에 놓기" onPress={onPlaceInRoom} /></View></View></HouseOverlay>;
}

const styles = StyleSheet.create({ content: { alignItems: 'center', gap: spacing.md }, sparkle: { color: '#D99A55', fontSize: 20 }, furniture: { height: 160, width: 220 }, actions: { flexDirection: 'row', gap: spacing.sm } });
