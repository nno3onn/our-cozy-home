import { homeSnapshotKey } from '@/features/room/hooks/useHomeSnapshot';
import { keysForRealtimeTable } from '../queryInvalidation';

describe('realtime query mapping',()=>{it('refreshes memory and room derived data without trusting payloads',()=>{expect(keysForRealtimeTable('memory_contributions')).toEqual([['memories'],homeSnapshotKey]);expect(keysForRealtimeTable('room_placements')).toEqual([homeSnapshotKey]);});});
