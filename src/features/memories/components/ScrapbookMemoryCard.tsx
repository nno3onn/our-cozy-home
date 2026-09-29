import type { MemorySummary } from '@/domain/models';
import { MemoryPhotoCard } from '@/features/illustrated-ui/scrapbook/MemoryPhotoCard';

export function ScrapbookMemoryCard({ memory, onPress, scope }: { memory: MemorySummary; onPress: (memoryId: string) => void; scope: 'current' | 'archive' }) {
  return <MemoryPhotoCard memory={memory} onPress={onPress} scope={scope} />;
}
