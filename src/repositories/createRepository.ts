import type { RuntimeConfig } from '@/config/env';
import type { HomeRepository } from '@/domain/repository';

import { DemoRepository } from './demo/DemoRepository';
import { connectionState } from '@/network/connectionState';
import { OnlineGuardedHomeRepository } from './OnlineGuardedHomeRepository';
import { createSupabaseClient } from './supabase/client';
import { SupabaseRepository } from './supabase/SupabaseRepository';

export type RepositoryResult =
  | { ok: true; repository: HomeRepository; supabaseRepository?: SupabaseRepository }
  | { ok: false; reason: 'supabase_client_initialization_failed' };

export function createRepository(config: Extract<RuntimeConfig, { ok: true }>): RepositoryResult {
  if (config.mode === 'demo') {
    return { ok: true, repository: new DemoRepository() };
  }

  try {
    const supabaseRepository = new SupabaseRepository(
      createSupabaseClient({
        supabaseUrl: config.supabaseUrl,
        supabasePublishableKey: config.supabasePublishableKey,
      }),
    );
    return {
      ok: true,
      repository: new OnlineGuardedHomeRepository(supabaseRepository, connectionState),
      supabaseRepository,
    };
  } catch {
    return { ok: false, reason: 'supabase_client_initialization_failed' };
  }
}
