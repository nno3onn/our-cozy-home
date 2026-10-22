import type { PostgrestError } from '@supabase/supabase-js';

import { DomainError, type DomainErrorCode } from '@/domain/errors';

export function mapSupabaseError(error: PostgrestError): DomainError {
  if (!error.code && /fetch|network|connection/i.test(error.message)) return new DomainError('network_unavailable');
  if (['PGRST301', 'PGRST302', 'PGRST303'].includes(error.code)) return new DomainError('unauthenticated');
  const code: DomainErrorCode =
    error.code === '42501'
      ? 'forbidden'
      : error.code === '23505'
        ? 'conflict'
        : error.code.startsWith('PGRST')
          ? 'not_found'
          : 'unknown';

  return new DomainError(code, code === 'unknown' ? 'supabase_request_failed' : code);
}
