import type { AppMode } from '@/config/appMode';
import type { HomeRepository } from '@/domain/repository';

import { DemoRepository } from './demo/DemoRepository';

export type RepositoryResult =
  | { ok: true; repository: HomeRepository }
  | { ok: false; reason: 'not_configured' };

export function createRepository(mode: AppMode): RepositoryResult {
  if (mode === 'demo') {
    return { ok: true, repository: new DemoRepository() };
  }

  return { ok: false, reason: 'not_configured' };
}
