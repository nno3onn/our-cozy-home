import { useMutation, useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import * as ReactNative from 'react-native';
import { useRouter } from 'expo-router';

import { SHOP_CATEGORIES } from '@/catalog/items';
import { AppText } from '@/components/ui/AppText';
import { AppButton } from '@/components/ui/AppButton';
import { AppPageHeader } from '@/components/ui/AppPageHeader';
import { InlineNotice } from '@/components/ui/InlineNotice';
import { Skeleton } from '@/components/ui/Skeleton';
import { useSnackbar } from '@/components/ui/AppSnackbar';
import { EmptyState } from '@/components/ui/EmptyState';
import { CategoryChips, type ShopCategoryFilter } from '@/features/illustrated-ui/catalog/CategoryChips';
import { ShopItemCard } from '@/features/illustrated-ui/catalog/ShopItemCard';
import { ItemThumbnail } from '@/features/illustrated-ui/scene/ItemThumbnail';
import { HouseOverlay } from '@/features/house-shell/components/HouseOverlay';
import { OfflineReadOnlyBanner } from '@/components/OfflineReadOnlyBanner';
import { ResponsiveGrid } from '@/components/layout/ResponsiveGrid';
import { ResponsivePage } from '@/components/layout/ResponsivePage';
import { DomainError } from '@/domain/errors';
import type { CatalogItem } from '@/domain/models';
import { useConnectionStatus } from '@/network/ConnectionProvider';
import { useRepository } from '@/repositories/RepositoryContext';
import { colors, radii, spacing } from '@/theme/tokens';

function createPurchaseRequestId() {
  const cryptoWithUuid = globalThis.crypto as Crypto | undefined;
  return cryptoWithUuid?.randomUUID?.() ?? `purchase-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function ShopScreen() {
  const repository = useRepository();
  const snackbar = useSnackbar();
  const isOnline = useConnectionStatus();
  const router = useRouter();
  const [category, setCategory] = useState<ShopCategoryFilter>('all');
  const [message, setMessage] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<CatalogItem | null>(null);
  const shopQuery = useQuery({ queryKey: ['catalog', 'shop'], queryFn: () => repository.listShopItems() });
  const purchase = useMutation({
    mutationFn: (input: { itemDefinitionId: string; requestId: string }) => repository.purchaseItem(input),
    onSuccess: (result) => {
      setMessage(null);
      setSelectedItem(null);
      snackbar.show(`구매했어요. ${result.balance.toLocaleString()} 코인이 남았어요.`);
    },
    onError: async (error, input) => {
      if (error instanceof DomainError && error.message === 'insufficient_coins') {
        const { balance, price, shortage } = error.details ?? {};
        if (typeof balance === 'number' && typeof price === 'number' && typeof shortage === 'number') {
          setMessage(`현재 ${balance}코인 · 가격 ${price}코인 · ${shortage}코인 부족`);
          return;
        }
      }
      setMessage('구매 결과를 확인 중이에요.');
      const recovered = await repository.getPurchaseResult(input.requestId).catch(() => null);
      setMessage(recovered ? `${recovered.balance} 코인이 남았어요.` : '구매 결과를 확인하지 못했어요. 같은 요청을 다시 시도해 주세요.');
    },
  });

  if (shopQuery.isLoading) return <ResponsivePage><AppPageHeader backHref="/" title="상점" /><ReactNative.View accessibilityLabel="상점 목록을 불러오는 중" style={styles.loading}><Skeleton height={42} width="45%" /><Skeleton height={44} /><Skeleton height={220} /></ReactNative.View></ResponsivePage>;
  if (shopQuery.isError || !shopQuery.data) {
    return <ResponsivePage><AppPageHeader backHref="/" title="상점" /><EmptyState title="상점을 열지 못했어요" description="네트워크를 확인한 뒤 다시 시도해 주세요." /></ResponsivePage>;
  }

  const items = category === 'all' ? shopQuery.data : shopQuery.data.filter((item) => item.category === category);
  return (
    <ResponsivePage contentMaxWidth={1120} scroll testID="shop-page">
      <ReactNative.View style={styles.content}>
        <AppPageHeader backHref="/" title="말랑 상점" trailing={<AppButton label="내 보관함" onPress={() => router.push('/inventory')} tone="tertiary" />} />
        <AppText tone="secondary">마음에 드는 물건을 골라 우리집을 채워 보세요.</AppText>
        {!isOnline ? <OfflineReadOnlyBanner /> : null}
        <CategoryChips categories={['all', ...SHOP_CATEGORIES]} onSelect={setCategory} selected={category} />
        <ResponsiveGrid columnsByBreakpoint={{ compact: 2, medium: 3, wide: 4 }} maxColumns={4} testID="shop-grid">
          {items.map((item) => (
            <ShopItemCard disabled={!isOnline || purchase.isPending} item={item} key={item.id} onPurchase={() => { setMessage(null); setSelectedItem(item); }} />
          ))}
        </ResponsiveGrid>
        {message && !selectedItem ? <InlineNotice message={message} title="구매 안내" tone={message.includes('부족') ? 'warning' : 'info'} /> : null}
      </ReactNative.View>
      <HouseOverlay
        accessibilityLabel={selectedItem ? `${selectedItem.nameKo} 상품 정보` : '상품 정보'}
        dismissLabel="상품 정보 닫기"
        onDismiss={() => { if (!purchase.isPending) setSelectedItem(null); }}
        visible={selectedItem !== null}
      >
        {selectedItem ? (
          <ReactNative.View style={styles.purchaseSheet}>
            <ReactNative.View style={styles.preview}>
              <ItemThumbnail itemId={selectedItem.id} style={styles.previewImage} />
            </ReactNative.View>
            <ReactNative.View style={styles.purchaseCopy}>
              <AppText accessibilityRole="header" variant="sectionTitle">{selectedItem.nameKo}</AppText>
              <AppText tone="secondary">{selectedItem.consumable ? '동물에게 줄 수 있는 간식이에요.' : '구매 후 보관함에서 방에 배치할 수 있어요.'}</AppText>
            </ReactNative.View>
            {message ? <InlineNotice message={message} title="구매 안내" tone={message.includes('부족') ? 'warning' : 'info'} /> : null}
            <AppButton
              disabled={!isOnline || purchase.isPending}
              label={purchase.isPending ? '구매 확인 중…' : `${selectedItem.price.toLocaleString()}코인으로 구매`}
              onPress={() => purchase.mutate({ itemDefinitionId: selectedItem.id, requestId: createPurchaseRequestId() })}
            />
          </ReactNative.View>
        ) : null}
      </HouseOverlay>
    </ResponsivePage>
  );
}

const styles = ReactNative.StyleSheet.create({
  content: { gap: spacing.md, paddingBottom: spacing.lg },
  loading: { gap: spacing.lg, paddingTop: spacing.xl },
  purchaseSheet: { gap: spacing.lg },
  preview: { alignItems: 'center', backgroundColor: colors.surfaceSubtle, borderRadius: radii.card, minHeight: 168, justifyContent: 'center' },
  previewImage: { height: 150, width: 180 },
  purchaseCopy: { gap: spacing.xs },
});
