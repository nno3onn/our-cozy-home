import { router } from 'expo-router';

import { useNavigateAfterHouseEntry } from '@/auth/useNavigateAfterHouseEntry';
import { useCreateHouse } from '@/features/house/hooks/useCreateHouse';
import { HouseCreateScreen } from '@/features/house/screens/HouseCreateScreen';

export default function HouseCreateRoute() {
  const creation = useCreateHouse();
  const navigateAfterEntry = useNavigateAfterHouseEntry();
  return (
    <HouseCreateScreen
      onCreate={creation.mutateAsync}
      onCreated={navigateAfterEntry}
      onOpenExistingHouse={() => router.replace('/')}
    />
  );
}
