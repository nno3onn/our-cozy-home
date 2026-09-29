import { StyleSheet, TextInput, View } from 'react-native';

import type { CreatedInvite } from '@/domain/models';
import { AppText } from '@/components/ui/AppText';
import { illustratedColors, illustratedElevation, illustratedRadii } from '@/theme/illustratedTokens';

export function InviteCard({ createLink, invite }: { invite: CreatedInvite; createLink: (token: string) => string }) {
  return <View style={styles.card}><View style={styles.house}><AppText style={styles.houseIcon}>⌂</AppText><AppText style={styles.heart}>♥</AppText></View><AppText variant="heading">우리집에 친구를 초대해요</AppText><AppText tone="muted" variant="caption">한 명이 들어와도 빈자리가 있으면 초대를 유지해요.</AppText><View style={styles.code}><AppText tone="muted" variant="caption">초대 코드</AppText><AppText style={styles.codeText} variant="title">{invite.code}</AppText></View><TextInput accessibilityLabel="초대 링크" editable={false} selectTextOnFocus style={styles.link} value={createLink(invite.token)} /><AppText tone="muted" variant="caption">이 초대는 만든 뒤 24시간 동안 사용할 수 있어요.</AppText></View>;
}

const styles = StyleSheet.create({ card: { alignItems: 'center', backgroundColor: illustratedColors.paper, borderColor: illustratedColors.line, borderRadius: illustratedRadii.sheet, borderWidth: 1.5, gap: 10, padding: 20, ...illustratedElevation.card }, house: { alignItems: 'center', backgroundColor: '#FDE8E1', borderRadius: 44, height: 88, justifyContent: 'center', position: 'relative', width: 88 }, houseIcon: { color: illustratedColors.peach, fontSize: 48, lineHeight: 50 }, heart: { color: '#E87983', fontSize: 17, position: 'absolute', right: 14, top: 13 }, code: { alignItems: 'center', backgroundColor: '#FFF3E5', borderRadius: 14, gap: 2, paddingHorizontal: 24, paddingVertical: 12, width: '100%' }, codeText: { color: illustratedColors.cocoa, letterSpacing: 2 }, link: { alignSelf: 'stretch', backgroundColor: '#FFF8EF', borderColor: illustratedColors.line, borderRadius: 12, borderWidth: 1, color: illustratedColors.cocoa, minHeight: 46, paddingHorizontal: 12 } });
