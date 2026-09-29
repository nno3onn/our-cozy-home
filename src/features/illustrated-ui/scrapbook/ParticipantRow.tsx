import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { illustratedColors } from '@/theme/illustratedTokens';

export function ParticipantRow({ names }: { names: string[] }) {
  return <View style={styles.row}>{names.slice(0, 4).map((name, index) => <View accessibilityLabel={`${name} 참여`} key={`${name}-${index}`} style={[styles.avatar, { backgroundColor: [illustratedColors.peach, illustratedColors.sage, illustratedColors.sky, illustratedColors.honey][index] }]}><AppText variant="caption">{name.slice(0, 1)}</AppText></View>)}<AppText tone="muted" variant="caption">{names.join(' · ')}</AppText></View>;
}

const styles = StyleSheet.create({ row: { alignItems: 'center', flexDirection: 'row', gap: 4 }, avatar: { alignItems: 'center', borderColor: '#FFFDF8', borderRadius: 14, borderWidth: 2, height: 28, justifyContent: 'center', marginRight: -10, width: 28 } });
