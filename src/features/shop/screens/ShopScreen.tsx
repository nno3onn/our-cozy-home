import { useMutation, useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import * as ReactNative from 'react-native';
import { useRouter } from 'expo-router';

import { SHOP_CATEGORIES, type ShopCategory } from '@/catalog/items';
import { AppText } from '@/components/ui/AppText';
import { AppButton } from '@/components/ui/AppButton';
import { EmptyState } from '@/components/ui/EmptyState';
import { CategoryChips } from '@/features/illustrated-ui/catalog/CategoryChips';
import { ShopItemCard } from '@/features/illustrated-ui/catalog/ShopItemCard';
import { OfflineReadOnlyBanner } from '@/components/OfflineReadOnlyBanner';
import { ResponsiveGrid } from '@/components/layout/ResponsiveGrid';
import { ResponsivePage } from '@/components/layout/ResponsivePage';
import { DomainError } from '@/domain/errors';
import { useConnectionStatus } from '@/network/ConnectionProvider';
import { useRepository } from '@/repositories/RepositoryContext';
import { spacing } from '@/theme/tokens';

function createPurchaseRequestId() {
  const cryptoWithUuid = globalThis.crypto as Crypto | undefined;
  return cryptoWithUuid?.randomUUID?.() ?? `purchase-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

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
    onError: async (error, input) => {
      if (error instanceof DomainError && error.message === 'insufficient_coins') {
        const shortage = error.details?.shortage;
        if (typeof shortage === 'number') {
          setMessage(`코인이 ${shortage}만큼 부족해요.`);
          return;
        }
      }
      setMessage('구매 결과를 확인 중이에요.');
      const recovered = await repository.getPurchaseResult(input.requestId).catch(() => null);
      setMessage(recovered ? `${recovered.balance} 코인이 남았어요.` : '구매 결과를 확인하지 못했어요. 같은 요청을 다시 시도해 주세요.');
    },
  });

  if (shopQuery.isLoading) return <ResponsivePage fallbackHref="/"><AppText>상점 목록을 불러오는 중이에요.</AppText></ResponsivePage>;
  if (shopQuery.isError || !shopQuery.data) {
    return <ResponsivePage fallbackHref="/"><EmptyState title="상점을 열지 못했어요" description="네트워크를 확인한 뒤 다시 시도해 주세요." /></ResponsivePage>;
  }

  const items = shopQuery.data.filter((item) => item.category === category);
  return (
    <ResponsivePage contentMaxWidth={1120} fallbackHref="/" scroll testID="shop-page">
      <ReactNative.View style={styles.content}>
        <AppText variant="title">말랑 상점</AppText>
        {!isOnline ? <OfflineReadOnlyBanner /> : null}
        <AppButton label="내 보관함 보기" onPress={() => router.push('/inventory')} tone="secondary" />
        <AppText tone="muted" variant="caption">가격과 상품 정보는 서버 카탈로그를 기준으로 표시돼요.</AppText>
        <CategoryChips categories={SHOP_CATEGORIES} onSelect={setCategory} selected={category} />
        <ResponsiveGrid testID="shop-grid">
          {items.map((item) => (
            <ShopItemCard disabled={!isOnline || purchase.isPending} item={item} key={item.id} onPurchase={() => purchase.mutate({ itemDefinitionId: item.id, requestId: createPurchaseRequestId() })} />
          ))}
        </ResponsiveGrid>
        {message ? <AppText tone="muted" variant="caption">{message}</AppText> : null}
      </ReactNative.View>
    </ResponsivePage>
  );
}

const styles = ReactNative.StyleSheet.create({
  content: { gap: spacing.md, paddingBottom: spacing.lg },
});
