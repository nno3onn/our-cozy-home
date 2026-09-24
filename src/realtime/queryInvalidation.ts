export type RealtimeTable = 'house_memberships'|'room_placements'|'memories'|'memory_contributions'|'habit_learning';
export function keysForRealtimeTable(table: RealtimeTable): readonly (readonly string[])[] {
 if(table==='room_placements'||table==='house_memberships') return [['home']];
 if(table==='memories'||table==='memory_contributions') return [['memories'],['home']];
 return [['habit-learning'],['home']];
}
