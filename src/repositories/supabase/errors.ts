import type { PostgrestError } from '@supabase/supabase-js';

import { DomainError, type DomainErrorCode } from '@/domain/errors';

export function mapSupabaseError(error: PostgrestError): DomainError {
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
