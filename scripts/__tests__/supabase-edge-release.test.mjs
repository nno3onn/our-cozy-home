import assert from 'node:assert/strict';
import test from 'node:test';

import {
  deployFunctions,
  invokeWorker,
  resolveWorkerRequest,
} from '../supabase-edge-release.mjs';

const projectRef = 'cbyikdryogktctskvzzk';

test('deploys every production Edge Function to the fixed project', async () => {
  const calls = [];

  await deployFunctions({
    projectRef,
    run: async (command, args) => calls.push([command, args]),
  });

  assert.deepEqual(calls, [
    ['supabase', ['functions', 'deploy', 'send-push', '--project-ref', projectRef]],
    ['supabase', ['functions', 'deploy', 'delete-account', '--project-ref', projectRef]],
    ['supabase', ['functions', 'deploy', 'reconcile-account-deletion', '--project-ref', projectRef]],
  ]);
});

test('builds worker requests with secrets only in their private headers', () => {
  const sendPush = resolveWorkerRequest('send-push', {
    NOTIFICATION_WORKER_SECRET: 'notification-secret',
  }, projectRef);
  const reconcile = resolveWorkerRequest('reconcile-account-deletion', {
    ACCOUNT_DELETION_WORKER_SECRET: 'account-secret',
    ACCOUNT_DELETION_PROFILE_ID: 'profile-id',
  }, projectRef);

  assert.deepEqual(sendPush, {
    url: `https://${projectRef}.supabase.co/functions/v1/send-push`,
    options: {
      method: 'POST',
      headers: { 'x-notification-worker-secret': 'notification-secret' },
    },
  });
  assert.deepEqual(reconcile, {
    url: `https://${projectRef}.supabase.co/functions/v1/reconcile-account-deletion`,
    options: {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-account-deletion-worker-secret': 'account-secret',
      },
      body: JSON.stringify({ profileId: 'profile-id' }),
    },
  });
});

test('refuses a worker invocation when its secret is unavailable', () => {
  assert.throws(
    () => resolveWorkerRequest('send-push', {}, projectRef),
    /NOTIFICATION_WORKER_SECRET is required/,
  );
});

test('refuses account deletion reconciliation without a profile id', () => {
  assert.throws(
    () => resolveWorkerRequest('reconcile-account-deletion', {
      ACCOUNT_DELETION_WORKER_SECRET: 'account-secret',
    }, projectRef),
    /ACCOUNT_DELETION_PROFILE_ID is required/,
  );
});

test('fails the scheduled job when an Edge Function rejects the request', async () => {
  await assert.rejects(
    invokeWorker({
      env: { NOTIFICATION_WORKER_SECRET: 'notification-secret' },
      fetchImpl: async () => ({ ok: false, status: 401 }),
      projectRef,
      workerName: 'send-push',
    }),
    /send-push returned HTTP 401/,
  );
});
