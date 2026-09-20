import { useRouter } from 'expo-router';

import { MemoriesScreen } from '@/features/memories/screens/MemoriesScreen';

export default function MemoriesRoute() {
  const router = useRouter();
  return <MemoriesScreen onOpenMemory={(id) => router.push({ pathname: '/memories/[id]', params: { id } })} />;
}
