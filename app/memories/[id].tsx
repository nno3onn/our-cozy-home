import { useLocalSearchParams } from 'expo-router';

import { MemoryDetailScreen } from '@/features/memories/screens/MemoryDetailScreen';

export default function MemoryDetailRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <MemoryDetailScreen memoryId={id} />;
}
