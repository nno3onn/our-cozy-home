import { InlineNotice } from '@/components/ui/InlineNotice';

export function OfflineReadOnlyBanner() {
  return <InlineNotice message="마지막으로 불러온 내용은 볼 수 있지만, 서버에 저장하는 행동은 연결 후에 할 수 있어요." title="오프라인 읽기 전용" tone="warning" />;
}
