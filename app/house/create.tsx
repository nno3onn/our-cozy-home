import { router } from 'expo-router';

import { useCreateHouse } from '@/features/house/hooks/useCreateHouse';
import { HouseCreateScreen } from '@/features/house/screens/HouseCreateScreen';

export default function HouseCreateRoute() {
  const creation = useCreateHouse();
  return (
    <HouseCreateScreen
      onCreate={creation.mutateAsync}
      onCreated={() => router.replace('/')}
      onOpenExistingHouse={() => router.replace('/')}
    />
  );
}
