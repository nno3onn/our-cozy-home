import { StyleSheet, View } from 'react-native';

import type { MemorySummary } from '@/domain/models';
import { HouseOverlay } from '@/features/house-shell/components/HouseOverlay';
import { AppButton } from '@/components/ui/AppButton';
import { AppText } from '@/components/ui/AppText';
import { FurnitureSprite } from '@/features/illustrated-ui/scene/FurnitureSprite';
import { colors, radii, spacing } from '@/theme/tokens';

export function MemoryFurnitureCompletionModal({ memory, onDismiss, onKeepInInventory, onPlaceInRoom, visible }: { memory: MemorySummary; visible: boolean; onDismiss: () => void; onKeepInInventory: () => void; onPlaceInRoom: () => void }) {
  return <HouseOverlay accessibilityLabel="추억 가구 완성" dismissLabel="추억 완성 닫기" onDismiss={onDismiss} visible={visible}><View style={styles.content}><AppText accessibilityRole="header" variant="sectionTitle">새 추억 가구가 완성됐어요</AppText><View style={styles.furniture}><FurnitureSprite itemId="table-round-cookie" /></View><View style={styles.copy}><AppText variant="bodyStrong">{memory.title}</AppText><AppText tone="secondary">서로 다른 두 명의 기록으로 한 번만 만들어졌어요.</AppText></View><View style={styles.actions}><AppButton label="보관함에 두기" onPress={onKeepInInventory} tone="quiet" /><AppButton label="방에 놓기" onPress={onPlaceInRoom} /></View></View></HouseOverlay>;
}

const styles = StyleSheet.create({ content: { alignItems: 'stretch', gap: spacing.lg }, furniture: { alignSelf: 'center', backgroundColor: colors.surfaceSubtle, borderRadius: radii.card, height: 160, width: 220 }, copy: { alignItems: 'center', gap: spacing.xs }, actions: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, justifyContent: 'flex-end' } });
