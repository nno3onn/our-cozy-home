import { Image, Pressable, StyleSheet, View } from 'react-native';

import type { MemorySummary } from '@/domain/models';
import { AppText } from '@/components/ui/AppText';
import { illustratedElevation, illustratedRadii } from '@/theme/illustratedTokens';

import { getIllustratedAsset } from '../scene/assetManifest';
import { ParticipantRow } from './ParticipantRow';

function shortDate(occurredOn: string) {
  const [, month = '', day = ''] = occurredOn.split('-');
  return `${['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][Number(month) - 1] ?? month} ${Number(day)}`;
}

export function MemoryPhotoCard({ memory, onPress, scope }: { memory: MemorySummary; scope: 'current' | 'archive'; onPress: (memoryId: string) => void }) {
  const room = getIllustratedAsset('illustrated:room:sunny');
  return <Pressable accessibilityLabel={`${memory.title} 상세 열기`} accessibilityRole="button" onPress={() => onPress(memory.id)} style={styles.card}><View style={styles.photo}>{room?.source ? <Image resizeMode="cover" source={room.source} style={styles.image} /> : null}<View style={styles.photoBadge}><AppText>{memory.furnitureOwnedItemId ? '♥' : '✦'}</AppText></View></View><View style={styles.copy}>{scope === 'archive' ? <AppText tone="muted" variant="caption">개인 보관함 기록</AppText> : null}<AppText variant="heading">{memory.title}</AppText><ParticipantRow names={memory.participantNames} /><View style={styles.footer}><AppText tone="muted" variant="caption">{shortDate(memory.occurredOn)}</AppText><AppText tone="muted" variant="caption">기여 {memory.contributionCount}명</AppText></View></View></Pressable>;
}

const styles = StyleSheet.create({ card: { backgroundColor: '#FFFDF8', borderColor: '#E7CFAF', borderRadius: illustratedRadii.card, borderWidth: 1.5, gap: 9, overflow: 'hidden', padding: 10, transform: [{ rotate: '-0.8deg' }], ...illustratedElevation.card }, photo: { backgroundColor: '#F1DEC0', borderRadius: 13, height: 148, overflow: 'hidden' }, image: { height: '100%', width: '100%' }, photoBadge: { alignItems: 'center', backgroundColor: '#FFE1DF', borderColor: '#FFFDF8', borderRadius: 18, borderWidth: 2, height: 36, justifyContent: 'center', position: 'absolute', right: 8, top: 8, width: 36 }, copy: { gap: 5 }, footer: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 3 } });
