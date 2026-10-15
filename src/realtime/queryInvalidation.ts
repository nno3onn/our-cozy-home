import { queryKeys } from '@/repositories/queryKeys';

export type RealtimeTable = 'house_memberships'|'room_placements'|'memories'|'memory_contributions'|'habit_learning';
export function keysForRealtimeTable(table: RealtimeTable): readonly (readonly string[])[] {
 if(table==='room_placements'||table==='house_memberships') return [queryKeys.home.activeSnapshot];
 if(table==='memories'||table==='memory_contributions') return [['memories'],queryKeys.home.activeSnapshot];
 return [['habit-learning'],queryKeys.home.activeSnapshot];
}
