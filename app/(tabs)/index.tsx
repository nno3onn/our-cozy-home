import { useRouter } from 'expo-router';

import { HomeScreen } from '@/features/room/screens/HomeScreen';

export default function HomeRoute() {
  const router = useRouter();
  return (
    <HomeScreen
      onOpenMemory={(id) => router.push({ pathname: '/memories/[id]', params: { id } })}
      onOpenSettings={() => router.push('/settings')}
      onCreateHouse={() => router.push('/house/create')}
    />
  );
}
