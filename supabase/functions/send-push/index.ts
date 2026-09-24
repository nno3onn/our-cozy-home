import { createClient } from 'npm:@supabase/supabase-js@2';

import {
  buildNotificationMessage,
  classifyExpoTicketResponses,
  type NotificationEventType,
} from '../_shared/notificationOutbox.ts';

type ClaimedTarget = {
  target_id: string;
  event_id: string;
  event_type: NotificationEventType;
  house_id: string;
  memory_id: string | null;
  habit_learning_id: string | null;
  expo_token: string;
};

type ClaimedReceipt = { target_id: string; expo_ticket_id: string };
type ExpoTicket = { status: 'ok' | 'error'; id?: string; message?: string; details?: { error?: string } };
type ExpoReceipt = { status: 'ok' | 'error'; message?: string; details?: { error?: string } };

const expoPushUrl = 'https://exp.host/--/api/v2/push/send';
const expoReceiptUrl = 'https://exp.host/--/api/v2/push/getReceipts';

function chunk<T>(values: T[], size: number): T[][] {
  return Array.from({ length: Math.ceil(values.length / size) }, (_, index) => values.slice(index * size, index * size + size));
}

function ticketResult(ticket: ExpoTicket): 'accepted' | 'invalid_token' | 'permanent_failure' | 'retry' {
  const result = classifyExpoTicketResponses([ticket]);
  if (result.ticketIds.length === 1) return 'accepted';
  if (result.invalidIndexes.length === 1) return 'invalid_token';
  return result.permanentFailure ? 'permanent_failure' : 'retry';
}

function receiptResult(receipt: ExpoReceipt | undefined): 'sent' | 'pending_receipt' | 'invalid_token' | 'permanent_failure' | 'retry' {
  if (!receipt) return 'pending_receipt';
  if (receipt.status === 'ok') return 'sent';
  if (receipt.details?.error === 'DeviceNotRegistered') return 'invalid_token';
  if (receipt.details?.error === 'MessageTooBig') return 'permanent_failure';
  return 'retry';
}

function errorMessage(value: unknown): string {
  return value instanceof Error ? value.message.slice(0, 500) : 'Expo Push request failed';
}

Deno.serve(async (request) => {
  const workerSecret = Deno.env.get('NOTIFICATION_WORKER_SECRET');
  if (!workerSecret || request.headers.get('x-notification-worker-secret') !== workerSecret) {
    return new Response(JSON.stringify({ error: 'unauthorized' }), { status: 401, headers: { 'content-type': 'application/json' } });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!supabaseUrl || !serviceRoleKey) {
    return new Response(JSON.stringify({ error: 'server configuration missing' }), { status: 500, headers: { 'content-type': 'application/json' } });
  }

  const admin = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data: claimedTargets, error: claimError } = await admin.rpc('claim_notification_delivery_targets', { p_limit: 100, p_lease_seconds: 120 });
  if (claimError) return new Response(JSON.stringify({ error: 'claim failed' }), { status: 500, headers: { 'content-type': 'application/json' } });

  for (const targets of chunk((claimedTargets ?? []) as ClaimedTarget[], 100)) {
    try {
      const response = await fetch(expoPushUrl, {
        method: 'POST',
        headers: { accept: 'application/json', 'content-type': 'application/json' },
        body: JSON.stringify(targets.map((target) => ({
          to: target.expo_token,
          ...buildNotificationMessage({
            eventType: target.event_type,
            eventId: target.event_id,
            houseId: target.house_id,
            memoryId: target.memory_id ?? undefined,
            learningId: target.habit_learning_id ?? undefined,
          }),
        }))),
      });
      const body = (await response.json()) as { data?: ExpoTicket[] };
      const tickets = response.ok && Array.isArray(body.data) ? body.data : targets.map(() => ({ status: 'error' as const, message: `Expo HTTP ${response.status}` }));
      await Promise.all(targets.map((target, index) => {
        const ticket = tickets[index] ?? { status: 'error' as const, message: 'missing Expo ticket' };
        return admin.rpc('record_notification_ticket_result', {
          p_target_id: target.target_id,
          p_result: ticketResult(ticket),
          p_ticket_id: ticket.id ?? null,
          p_error: ticket.message ?? ticket.details?.error ?? null,
        });
      }));
    } catch (error) {
      await Promise.all(targets.map((target) => admin.rpc('record_notification_ticket_result', {
        p_target_id: target.target_id,
        p_result: 'retry',
        p_ticket_id: null,
        p_error: errorMessage(error),
      })));
    }
  }

  const { data: claimedReceipts, error: receiptClaimError } = await admin.rpc('claim_notification_receipts', { p_limit: 100, p_lease_seconds: 120 });
  if (receiptClaimError) return new Response(JSON.stringify({ error: 'receipt claim failed' }), { status: 500, headers: { 'content-type': 'application/json' } });

  for (const receipts of chunk((claimedReceipts ?? []) as ClaimedReceipt[], 100)) {
    try {
      const response = await fetch(expoReceiptUrl, {
        method: 'POST',
        headers: { accept: 'application/json', 'content-type': 'application/json' },
        body: JSON.stringify({ ids: receipts.map((receipt) => receipt.expo_ticket_id) }),
      });
      const body = (await response.json()) as { data?: Record<string, ExpoReceipt> };
      const responseData = response.ok ? body.data : undefined;
      await Promise.all(receipts.map((receipt) => {
        const result = response.ok ? receiptResult(responseData?.[receipt.expo_ticket_id]) : 'pending_receipt';
        const detail = responseData?.[receipt.expo_ticket_id];
        return admin.rpc('record_notification_receipt_result', {
          p_target_id: receipt.target_id,
          p_result: result,
          p_error: detail?.message ?? detail?.details?.error ?? (response.ok ? null : `Expo HTTP ${response.status}`),
        });
      }));
    } catch (error) {
      await Promise.all(receipts.map((receipt) => admin.rpc('record_notification_receipt_result', {
        p_target_id: receipt.target_id,
        p_result: 'pending_receipt',
        p_error: errorMessage(error),
      })));
    }
  }

  return new Response(JSON.stringify({ claimed: (claimedTargets ?? []).length, receipts: (claimedReceipts ?? []).length }), {
    headers: { 'content-type': 'application/json' },
  });
});
