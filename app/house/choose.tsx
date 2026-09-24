import type { Href } from 'expo-router';
import { useRouter } from 'expo-router';

import { HouseEntryChoiceScreen } from '@/features/house/screens/HouseEntryChoiceScreen';

export default function HouseEntryChoiceRoute() {
  const router = useRouter();

  return (
    <HouseEntryChoiceScreen
      onCreateHouse={() => router.push('/house/create')}
      onOpenInvite={(token) => router.push(`/invite/${encodeURIComponent(token)}` as Href)}
    />
  );
}
