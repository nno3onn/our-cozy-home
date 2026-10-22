import { DomainError } from '@/domain/errors';

export function isAccessLoss(error: unknown): boolean {
  return error instanceof DomainError && (
    error.code === 'forbidden' || error.code === 'unauthenticated' ||
    error.message === 'active_house_not_found' || error.message === 'profile_not_found'
  );
}

export function isTransportFailure(error: unknown): boolean {
  return error instanceof DomainError && error.code === 'network_unavailable';
}
