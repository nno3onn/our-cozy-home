import { Image, Pressable, StyleSheet, View } from 'react-native';

import type { MemorySummary } from '@/domain/models';
import { AppText } from '@/components/ui/AppText';
import { colors, radii, spacing } from '@/theme/tokens';

import { getIllustratedAsset } from '../scene/assetManifest';
import { ParticipantRow } from './ParticipantRow';

function shortDate(occurredOn: string) {
  const [, month = '', day = ''] = occurredOn.split('-');
  return `${['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][Number(month) - 1] ?? month} ${Number(day)}`;
}

export function MemoryPhotoCard({ memory, onPress, scope }: { memory: MemorySummary; scope: 'current' | 'archive'; onPress: (memoryId: string) => void }) {
  const room = getIllustratedAsset('illustrated:room:sunny');
  const status = memory.furnitureOwnedItemId ? '가구 완성' : `완성까지 ${Math.max(0, 2 - memory.contributionCount)}명`;
  return <Pressable accessibilityLabel={`${memory.title} 상세 열기`} accessibilityRole="button" onPress={() => onPress(memory.id)} style={({ pressed }) => [styles.card, pressed && styles.pressed]}><View style={styles.photo}>{room?.source ? <Image resizeMode="cover" source={room.source} style={styles.image} /> : null}<View style={[styles.status, memory.furnitureOwnedItemId && styles.complete]}><AppText tone={memory.furnitureOwnedItemId ? 'success' : 'secondary'} variant="caption">{status}</AppText></View></View><View style={styles.copy}>{scope === 'archive' ? <AppText tone="tertiary" variant="caption">퇴장 시점까지 공개된 내용</AppText> : null}<AppText variant="sectionTitle">{memory.title}</AppText><ParticipantRow names={memory.participantNames} /><View style={styles.footer}><AppText tone="tertiary" variant="caption">{shortDate(memory.occurredOn)}</AppText><AppText tone="tertiary" variant="caption">기여 {memory.contributionCount}명</AppText></View></View></Pressable>;
}

const styles = StyleSheet.create({ card: { gap: spacing.md }, pressed: { opacity: 0.82 }, photo: { backgroundColor: colors.surfaceSubtle, borderRadius: radii.card, aspectRatio: 1.35, overflow: 'hidden' }, image: { height: '100%', width: '100%' }, status: { backgroundColor: colors.surface, borderRadius: radii.pill, paddingHorizontal: spacing.md, paddingVertical: spacing.xs, position: 'absolute', right: spacing.sm, top: spacing.sm }, complete: { backgroundColor: colors.successSoft }, copy: { gap: spacing.xs }, footer: { flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing.xs } });
