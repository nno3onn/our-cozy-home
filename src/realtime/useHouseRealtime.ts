import { useEffect } from 'react';
import type { QueryClient } from '@tanstack/react-query';
import type { SupabaseClient } from '@supabase/supabase-js';
import { keysForRealtimeTable, type RealtimeTable } from './queryInvalidation';

const tables: RealtimeTable[]=['house_memberships','room_placements','memories','memory_contributions','habit_learning'];
export function subscribeHouseRealtime(client: SupabaseClient, queryClient: QueryClient, houseId: string) {
 const channel=client.channel(`house:${houseId}`);
 tables.forEach(table=>channel.on('postgres_changes' as never,{event:'*',schema:'public',table,filter:`house_id=eq.${houseId}`} as never,()=>{keysForRealtimeTable(table).forEach(key=>void queryClient.invalidateQueries({queryKey:key}));}));
 channel.subscribe(); return ()=>{void client.removeChannel(channel);};
}
export function useHouseRealtime(client: SupabaseClient|undefined,queryClient:QueryClient,houseId:string|undefined){useEffect(()=>client&&houseId?subscribeHouseRealtime(client,queryClient,houseId):undefined,[client,queryClient,houseId]);}
