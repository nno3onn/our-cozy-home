import {
  buildNotificationMessage,
  calculateRetryAt,
  classifyExpoTicketResponses,
} from '../notificationOutbox';

describe('notification outbox helpers', () => {
  it('creates a private-content-free memory completion message', () => {
    expect(
      buildNotificationMessage({
        eventType: 'memory_completed',
        eventId: 'event-1',
        memoryId: 'memory-1',
      }),
    ).toEqual({
      title: '새 추억 가구가 완성됐어요',
      body: '우리집 방에서 확인해 보세요.',
      data: { eventId: 'event-1', type: 'memory_completed', memoryId: 'memory-1' },
      sound: 'default',
    });
  });

  it('separates retryable tickets from invalid device tokens', () => {
    expect(
      classifyExpoTicketResponses([
        { status: 'ok', id: 'ticket-ok' },
        { status: 'error', details: { error: 'DeviceNotRegistered' } },
        { status: 'error', message: 'temporary gateway error' },
      ]),
    ).toEqual({
      ticketIds: ['ticket-ok'],
      invalidIndexes: [1],
      retryable: true,
      permanentFailure: false,
    });
  });

  it('backs off retries without exceeding one hour', () => {
    const now = new Date('2026-09-24T00:00:00.000Z');

    expect(calculateRetryAt(now, 1).toISOString()).toBe('2026-09-24T00:01:00.000Z');
    expect(calculateRetryAt(now, 10).toISOString()).toBe('2026-09-24T01:00:00.000Z');
  });
});
