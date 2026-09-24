export type DomainErrorCode =
  | 'unauthenticated'
  | 'forbidden'
  | 'not_found'
  | 'network_unavailable'
  | 'conflict'
  | 'not_implemented'
  | 'unknown';

export class DomainError extends Error {
  constructor(
    public readonly code: DomainErrorCode,
    message: string = code,
    public readonly details?: Record<string, unknown>,
  ) {
    super(message);
    this.name = 'DomainError';
  }
}

export type CommandRequest = {
  requestId: string;
};

export type CommandRecoveryState =
  | { status: 'confirmed' }
  | { status: 'unknown'; requestId: string };
