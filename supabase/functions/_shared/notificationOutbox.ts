export type NotificationEventType = 'house_joined' | 'memory_completed' | 'habit_learned';

export type NotificationMessage = {
  title: string;
  body: string;
  data: Record<string, string>;
  sound: 'default';
};

type NotificationMessageInput = {
  eventType: NotificationEventType;
  eventId: string;
  memoryId?: string;
  learningId?: string;
  houseId?: string;
};

type ExpoTicket = {
  status: 'ok' | 'error';
  id?: string;
  message?: string;
  details?: { error?: string };
};

export type ExpoTicketClassification = {
  ticketIds: string[];
  invalidIndexes: number[];
  retryable: boolean;
  permanentFailure: boolean;
};

const messageCopy: Record<NotificationEventType, Pick<NotificationMessage, 'title' | 'body'>> = {
  house_joined: {
    title: '새 친구가 우리집에 왔어요',
    body: '함께 방을 꾸며 보세요.',
  },
  memory_completed: {
    title: '새 추억 가구가 완성됐어요',
    body: '우리집 방에서 확인해 보세요.',
  },
  habit_learned: {
    title: '새 버릇을 배웠어요',
    body: '동물의 새로운 모습을 확인해 보세요.',
  },
};

export function buildNotificationMessage(input: NotificationMessageInput): NotificationMessage {
  const copy = messageCopy[input.eventType];
  const data: Record<string, string> = { eventId: input.eventId, type: input.eventType };

  if (input.memoryId) data.memoryId = input.memoryId;
  if (input.learningId) data.learningId = input.learningId;
  if (input.houseId) data.houseId = input.houseId;

  return { ...copy, data, sound: 'default' };
}

export function classifyExpoTicketResponses(tickets: ExpoTicket[]): ExpoTicketClassification {
  const ticketIds: string[] = [];
  const invalidIndexes: number[] = [];
  let retryable = false;
  let permanentFailure = false;

  tickets.forEach((ticket, index) => {
    if (ticket.status === 'ok' && ticket.id) {
      ticketIds.push(ticket.id);
      return;
    }

    if (ticket.details?.error === 'DeviceNotRegistered') {
      invalidIndexes.push(index);
      return;
    }

    if (ticket.details?.error === 'MessageTooBig') {
      permanentFailure = true;
      return;
    }

    retryable = true;
  });

  return { ticketIds, invalidIndexes, retryable, permanentFailure };
}

export function calculateRetryAt(now: Date, attemptCount: number): Date {
  const minutes = Math.min(60, 2 ** Math.max(0, attemptCount - 1));
  return new Date(now.getTime() + minutes * 60_000);
}
