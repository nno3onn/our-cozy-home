import { router } from 'expo-router';

import { useCreateHouse } from '@/features/house/hooks/useCreateHouse';
import { HouseCreateScreen } from '@/features/house/screens/HouseCreateScreen';

export default function HouseCreateRoute() {
  const creation = useCreateHouse();
  return (
    <HouseCreateScreen
      onCreate={creation.mutateAsync}
      onCreated={() => {
        // Let the private QueryClient rotate and remount its navigator before
        // requesting the next route. Navigating in the same commit loops Expo Router.
        setTimeout(() => router.replace('/'), 0);
      }}
      onOpenExistingHouse={() => router.replace('/')}
    />
  );
}
