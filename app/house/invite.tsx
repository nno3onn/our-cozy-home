import * as Linking from 'expo-linking';

import { InviteManagerScreen } from '@/features/house/screens/InviteManagerScreen';
import { useCancelInvite, useCreateInvite } from '@/features/house/hooks/useCreateInvite';

export default function InviteManagerRoute() {
  const inviteMutation = useCreateInvite();
  const cancelMutation = useCancelInvite();
  return (
    <InviteManagerScreen
      createLink={(token) => Linking.createURL(`/invite/${token}`)}
      onCancelInvite={cancelMutation.mutateAsync}
      onCreateInvite={inviteMutation.mutateAsync}
    />
  );
}
