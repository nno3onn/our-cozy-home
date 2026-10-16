import { PostgrestError } from '@supabase/supabase-js';
import { mapSupabaseError } from '../errors';
it('preserves the placement conflict signal without exposing raw server messages', () => {
  expect(mapSupabaseError(new PostgrestError({ code: 'P0001', message: 'placement_conflict', details: '', hint: '' }))).toMatchObject({ code: 'conflict', message: 'conflict' });
  expect(mapSupabaseError(new PostgrestError({ code: 'P0001', message: 'private server details', details: '', hint: '' }))).toMatchObject({ code: 'unknown', message: 'supabase_request_failed' });
});
