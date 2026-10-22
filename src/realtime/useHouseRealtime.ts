import { useEffect } from 'react';
import type { QueryClient } from '@tanstack/react-query';
import type { SupabaseClient } from '@supabase/supabase-js';
import { keysForRealtimeTable } from './queryInvalidation';

let subscriptionId = 0;

export function subscribeHouseRealtime(client: SupabaseClient, queryClient: QueryClient, houseId: string) {
  let active = true;
  const refresh = () => {
    if (active) keysForRealtimeTable('room_placements').forEach(queryKey => {
      void queryClient.invalidateQueries({ queryKey });
    });
  };
  // realtime-js reuses same-topic channels while async removal is pending.
  const channel = client.channel(`house:${houseId}:${++subscriptionId}`);
  // DELETE does not receive the same RLS checks as INSERT/UPDATE. A bounded
  // authoritative snapshot refresh handles removals without exposing old rows.
  for (const event of ['INSERT', 'UPDATE'] as const) {
    channel.on('postgres_changes', { event, schema: 'public', table: 'room_placements', filter: `house_id=eq.${houseId}` }, refresh);
  }
  channel.subscribe(status => { if (status === 'SUBSCRIBED') refresh(); });
  return () => {
    if (!active) return;
    active = false;
    void client.removeChannel(channel).catch(() => {});
  };
}
export function useHouseRealtime(client: SupabaseClient|undefined,queryClient:QueryClient,houseId:string|undefined,registerStop?: (stop: () => void) => () => void){
  useEffect(() => {
    if (!client || !houseId) return;
    const stop = subscribeHouseRealtime(client,queryClient,houseId);
    const unregister = registerStop?.(stop);
    return () => { unregister?.(); stop(); };
  },[client,queryClient,houseId,registerStop]);
}
