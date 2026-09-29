import { Pressable, StyleSheet, View } from 'react-native';

import type { ShopCategory } from '@/catalog/items';
import { AppText } from '@/components/ui/AppText';
import { illustratedColors, illustratedRadii } from '@/theme/illustratedTokens';

const labels: Record<ShopCategory, string> = { curtain: '커튼', table: '탁자', cushion: '쿠션', rug: '러그', bed: '침대', lighting: '조명', plant: '식물', snack: '간식' };

export function CategoryChips({ categories, selected, onSelect }: { categories: readonly ShopCategory[]; selected: ShopCategory; onSelect: (category: ShopCategory) => void }) {
  return <View style={styles.row}>{categories.map((category) => <Pressable accessibilityLabel={`${labels[category]} 카테고리`} accessibilityRole="button" key={category} onPress={() => onSelect(category)} style={[styles.chip, category === selected && styles.selected]}><AppText style={category === selected ? styles.selectedText : styles.text} variant="caption">{labels[category]}</AppText></Pressable>)}</View>;
}

const styles = StyleSheet.create({ row: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 }, chip: { backgroundColor: '#FFF8EF', borderRadius: illustratedRadii.pill, paddingHorizontal: 12, paddingVertical: 8 }, selected: { backgroundColor: illustratedColors.peach }, text: { color: '#806A5D' }, selectedText: { color: '#FFFDF8', fontWeight: '700' } });
