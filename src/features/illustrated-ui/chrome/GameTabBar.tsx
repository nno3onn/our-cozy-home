import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { illustratedColors } from '@/theme/illustratedTokens';

type HouseTab = 'home' | 'decorate' | 'memories';
const labels: Record<HouseTab, { icon: string; label: string }> = {
  home: { icon: '⌂', label: '우리집' },
  decorate: { icon: '✦', label: '꾸미기' },
  memories: { icon: '▣', label: '추억' },
};

export function GameTabBar({ activeTab, onNavigate, vertical = false }: { activeTab: HouseTab; onNavigate?: (tab: HouseTab) => void; vertical?: boolean }) {
  return <View accessibilityLabel={vertical ? '데스크톱 방 탐색' : '우리집 탐색'} style={[styles.bar, vertical && styles.vertical]}>{(Object.keys(labels) as HouseTab[]).map((tab) => <Pressable accessibilityLabel={`${labels[tab].label}로 이동`} accessibilityRole="button" disabled={!onNavigate || tab === activeTab} key={tab} onPress={() => onNavigate?.(tab)} style={[styles.tab, tab === activeTab && styles.active]}><AppText style={[styles.icon, tab === activeTab && styles.activeText]}>{labels[tab].icon}</AppText><AppText style={[styles.label, tab === activeTab && styles.activeText]} variant="caption">{labels[tab].label}</AppText></Pressable>)}</View>;
}

const styles = StyleSheet.create({
  bar: { alignItems: 'center', backgroundColor: illustratedColors.paper, borderTopColor: illustratedColors.line, borderTopWidth: 1, flexDirection: 'row', justifyContent: 'space-around', minHeight: 70, paddingHorizontal: 12 },
  vertical: { alignItems: 'stretch', backgroundColor: 'transparent', borderTopWidth: 0, flexDirection: 'column', justifyContent: 'flex-start', minHeight: undefined, paddingHorizontal: 0, paddingTop: 88, width: 72 },
  tab: { alignItems: 'center', borderRadius: 14, gap: 2, justifyContent: 'center', minHeight: 48, minWidth: 72, paddingHorizontal: 8 },
  active: { backgroundColor: '#FFF0E9' },
  icon: { color: illustratedColors.cocoa, fontSize: 19, lineHeight: 20 },
  label: { color: '#806A5D' },
  activeText: { color: illustratedColors.peach, fontWeight: '700' },
});
