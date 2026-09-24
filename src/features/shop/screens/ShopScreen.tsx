import { useMutation, useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import { SHOP_CATEGORIES, type ShopCategory } from '@/catalog/items';
import { AppText } from '@/components/ui/AppText';
import { AppButton } from '@/components/ui/AppButton';
import { EmptyState } from '@/components/ui/EmptyState';
import { Panel } from '@/components/ui/Panel';
import { OfflineReadOnlyBanner } from '@/components/OfflineReadOnlyBanner';
import { useConnectionStatus } from '@/network/ConnectionProvider';
import { useRepository } from '@/repositories/RepositoryContext';
import { colors, radii, spacing } from '@/theme/tokens';

const categoryLabels: Record<ShopCategory, string> = {
  curtain: '커튼', table: '탁자', cushion: '쿠션', rug: '러그',
  bed: '침대', lighting: '조명', plant: '식물', snack: '간식',
};

export function ShopScreen() {
  const repository = useRepository();
  const isOnline = useConnectionStatus();
  const router = useRouter();
  const [category, setCategory] = useState<ShopCategory>(SHOP_CATEGORIES[0]);
  const [message, setMessage] = useState<string | null>(null);
  const shopQuery = useQuery({ queryKey: ['catalog', 'shop'], queryFn: () => repository.listShopItems() });
  const purchase = useMutation({
    mutationFn: (input: { itemDefinitionId: string; requestId: string }) => repository.purchaseItem(input),
    onSuccess: (result) => setMessage(`${result.balance} 코인이 남았어요.`),
    onError: async (_error, input) => {
      setMessage('구매 결과를 확인 중이에요.');
      const recovered = await repository.getPurchaseResult(input.requestId).catch(() => null);
      setMessage(recovered ? `${recovered.balance} 코인이 남았어요.` : '구매 결과를 확인하지 못했어요. 같은 요청을 다시 시도해 주세요.');
    },
  });

  if (shopQuery.isLoading) {
    return <SafeAreaView style={styles.centered}><AppText>상점 목록을 불러오는 중이에요.</AppText></SafeAreaView>;
  }
  if (shopQuery.isError || !shopQuery.data) {
    return <SafeAreaView style={styles.centered}><EmptyState title="상점을 열지 못했어요" description="네트워크를 확인한 뒤 다시 시도해 주세요." /></SafeAreaView>;
  }

  const items = shopQuery.data.filter((item) => item.category === category);
  return (
    <SafeAreaView edges={['left', 'right']} style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content}>
        <AppText variant="title">상점</AppText>
        {!isOnline ? <OfflineReadOnlyBanner /> : null}
        <AppButton label="내 보관함 보기" onPress={() => router.push('/inventory')} tone="secondary" />
        <AppText tone="muted" variant="caption">가격과 상품 정보는 서버 카탈로그를 기준으로 표시돼요.</AppText>
        <View style={styles.categories}>
          {SHOP_CATEGORIES.map((entry) => (
            <Pressable
              key={entry}
              accessibilityRole="button"
              accessibilityLabel={`${categoryLabels[entry]} 카테고리`}
              onPress={() => setCategory(entry)}
              style={[styles.category, entry === category && styles.categorySelected]}
            >
              <AppText variant="caption">{categoryLabels[entry]}</AppText>
            </Pressable>
          ))}
        </View>
        <View style={styles.grid}>
          {items.map((item) => (
            <Panel key={item.id} style={styles.item}>
              <View style={[styles.preview, { backgroundColor: item.previewColor }]} />
              <AppText variant="label">{item.nameKo}</AppText>
              <AppText variant="caption">{item.price} 코인</AppText>
              <AppText tone="muted" variant="caption">{item.assetStatus === 'placeholder' ? '임시 에셋' : '최종 에셋'}</AppText>
              <AppButton disabled={!isOnline || purchase.isPending} label={`${item.nameKo} 구매`} onPress={() => purchase.mutate({ itemDefinitionId: item.id, requestId: crypto.randomUUID() })} />
            </Panel>
          ))}
        </View>
        {message ? <AppText tone="muted" variant="caption">{message}</AppText> : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.cream },
  centered: { flex: 1, justifyContent: 'center', padding: spacing.lg, backgroundColor: colors.cream },
  content: { gap: spacing.md, padding: spacing.lg, paddingBottom: spacing.xxl, alignSelf: 'center', maxWidth: 960, width: '100%' },
  categories: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  category: { borderColor: colors.line, borderRadius: radii.pill, borderWidth: 1, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  categorySelected: { backgroundColor: colors.peach, borderColor: colors.ink },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  item: { gap: spacing.sm, minWidth: 140, padding: spacing.md, flexGrow: 1 },
  preview: { borderColor: colors.ink, borderRadius: radii.md, borderWidth: 2, height: 72 },
});
