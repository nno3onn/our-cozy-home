import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import type { ShopCategory } from '@/catalog/items';
import { AppText } from '@/components/ui/AppText';
import { colors, radii, spacing } from '@/theme/tokens';

export type ShopCategoryFilter = 'all' | ShopCategory;

const labels: Record<ShopCategoryFilter, string> = { all: '전체', curtain: '커튼', table: '탁자', cushion: '쿠션', rug: '러그', bed: '침대', lighting: '조명', plant: '식물', snack: '간식' };

export function CategoryChips({ categories, selected, onSelect }: { categories: readonly ShopCategoryFilter[]; selected: ShopCategoryFilter; onSelect: (category: ShopCategoryFilter) => void }) {
  return <ScrollView contentContainerStyle={styles.row} horizontal showsHorizontalScrollIndicator={false}><View style={styles.row}>{categories.map((category) => { const active = category === selected; return <Pressable accessibilityLabel={`${labels[category]} 카테고리`} accessibilityRole="button" accessibilityState={{ selected: active }} key={category} onPress={() => onSelect(category)} style={[styles.chip, active && styles.selected]}><AppText style={active ? styles.selectedText : styles.text} variant="caption">{labels[category]}</AppText></Pressable>; })}</View></ScrollView>;
}

const styles = StyleSheet.create({ row: { flexDirection: 'row', gap: spacing.sm }, chip: { backgroundColor: colors.surfaceSubtle, borderRadius: radii.pill, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm }, selected: { backgroundColor: colors.brandSoft }, text: { color: colors.textSecondary }, selectedText: { color: colors.brand, fontWeight: '700' } });
