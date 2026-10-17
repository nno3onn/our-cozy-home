let requestSequence = 0;

export function createPlacementRequestId(): string {
  return globalThis.crypto?.randomUUID?.()
    ?? `placement-${Date.now().toString(36)}-${++requestSequence}-${Math.random().toString(36).slice(2)}`;
}
