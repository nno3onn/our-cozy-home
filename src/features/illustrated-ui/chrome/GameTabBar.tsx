import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { colors, radii, spacing } from '@/theme/tokens';

type HouseTab = 'home' | 'decorate' | 'memories';
const labels: Record<HouseTab, { icon: string; label: string; accessibilityLabel: string }> = {
  home: { icon: '⌂', label: '우리집', accessibilityLabel: '우리집으로 이동' },
  decorate: { icon: '✦', label: '꾸미기', accessibilityLabel: '꾸미기로 이동' },
  memories: { icon: '▣', label: '추억', accessibilityLabel: '추억으로 이동' },
};

export function GameTabBar({ activeTab, onNavigate, vertical = false }: { activeTab: HouseTab; onNavigate?: (tab: HouseTab) => void; vertical?: boolean }) {
  return <View accessibilityLabel={vertical ? '데스크톱 방 탐색' : '우리집 탐색'} style={[styles.bar, vertical && styles.vertical]}>{(Object.keys(labels) as HouseTab[]).map((tab) => { const active = tab === activeTab; return <Pressable accessibilityLabel={labels[tab].accessibilityLabel} accessibilityRole="button" accessibilityState={{ disabled: !onNavigate || active, selected: active }} disabled={!onNavigate || active} key={tab} onPress={() => onNavigate?.(tab)} style={[styles.tab, active && styles.active]}><AppText style={[styles.icon, active && styles.activeText]}>{labels[tab].icon}</AppText><AppText style={[styles.label, active && styles.activeText]} variant="caption">{labels[tab].label}</AppText></Pressable>; })}</View>;
}

const styles = StyleSheet.create({
  bar: { alignItems: 'center', backgroundColor: colors.surface, borderTopColor: colors.border, borderTopWidth: StyleSheet.hairlineWidth, flexDirection: 'row', justifyContent: 'space-around', minHeight: 70, paddingHorizontal: spacing.md },
  vertical: { alignItems: 'stretch', backgroundColor: colors.background, borderTopWidth: 0, flexDirection: 'column', justifyContent: 'flex-start', minHeight: undefined, paddingHorizontal: spacing.sm, paddingTop: 88, width: 80 },
  tab: { alignItems: 'center', borderRadius: radii.control, gap: 2, justifyContent: 'center', minHeight: 48, minWidth: 72, paddingHorizontal: spacing.sm },
  active: { backgroundColor: colors.brandSoft },
  icon: { color: colors.textTertiary, fontSize: 19, lineHeight: 20 },
  label: { color: colors.textSecondary },
  activeText: { color: colors.brand, fontWeight: '700' },
});
