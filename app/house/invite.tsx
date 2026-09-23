import * as Linking from 'expo-linking';

import { InviteManagerScreen } from '@/features/house/screens/InviteManagerScreen';
import { useCreateInvite } from '@/features/house/hooks/useCreateInvite';

export default function InviteManagerRoute() {
  const inviteMutation = useCreateInvite();
  return (
    <InviteManagerScreen
      createLink={(token) => Linking.createURL(`/invite/${token}`)}
      onCreateInvite={inviteMutation.mutateAsync}
    />
  );
}
