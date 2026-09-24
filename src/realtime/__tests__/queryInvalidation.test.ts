import { keysForRealtimeTable } from '../queryInvalidation';
describe('realtime query mapping',()=>{it('refreshes memory and room derived data without trusting payloads',()=>{expect(keysForRealtimeTable('memory_contributions')).toEqual([['memories'],['home']]);expect(keysForRealtimeTable('room_placements')).toEqual([['home']]);});});
