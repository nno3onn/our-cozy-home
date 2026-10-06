import assert from 'node:assert/strict';
import test from 'node:test';

import {
  buildCleanupPlan,
  isExpectedHouseFullError,
  isMissingAuthUserError,
  resolveApiKeys,
  safeStepReporter,
} from '../run-remote-house-e2e.mjs';

test('prefers explicit environment keys without exposing their values', () => {
  const keys = resolveApiKeys({
    SUPABASE_PUBLISHABLE_KEY: 'publishable-value',
    SUPABASE_SECRET_KEY: 'secret-value',
  });

  assert.deepEqual(keys, {
    publishableKey: 'publishable-value',
    secretKey: 'secret-value',
    source: 'environment',
  });
});

test('selects publishable and service-role secret keys from CLI metadata', () => {
  const keys = resolveApiKeys({}, [
    { type: 'legacy', name: 'anon', api_key: 'legacy-anon' },
    { type: 'publishable', name: 'default', api_key: 'publishable-value' },
    { type: 'secret', name: 'default', api_key: 'secret-value' },
  ]);

  assert.deepEqual(keys, {
    publishableKey: 'publishable-value',
    secretKey: 'secret-value',
    source: 'supabase-cli',
  });
});

test('reports only fixed step labels and never arbitrary secret details', () => {
  const messages = [];
  const report = safeStepReporter((message) => messages.push(message));

  report('create-users', 'secret@example.test');
  report('verify-capacity', 'invite-token-value');

  assert.deepEqual(messages, [
    '[remote-house-e2e] create-users',
    '[remote-house-e2e] verify-capacity',
  ]);
});

test('recognizes the database house-full contract', () => {
  assert.equal(isExpectedHouseFullError({ message: 'house_full' }), true);
  assert.equal(isExpectedHouseFullError({ details: 'house_full' }), true);
  assert.equal(isExpectedHouseFullError({ message: 'invite_expired' }), false);
});

test('only treats an explicit missing-user response as successful auth cleanup', () => {
  assert.equal(isMissingAuthUserError({ status: 404 }), true);
  assert.equal(isMissingAuthUserError({ code: 'user_not_found' }), true);
  assert.equal(isMissingAuthUserError({ status: 503 }), false);
  assert.equal(isMissingAuthUserError(undefined), false);
});

test('deletes exact test rows in foreign-key-safe order', () => {
  assert.deepEqual(buildCleanupPlan({
    houseId: 'house-id',
    inviteIds: ['invite-id'],
    userIds: ['user-a', 'user-b'],
  }), [
    { table: 'notification_events', column: 'house_id', values: ['house-id'] },
    { table: 'invite_acceptance_requests', column: 'house_id', values: ['house-id'] },
    { table: 'invite_acceptances', column: 'invite_id', values: ['invite-id'] },
    { table: 'house_create_requests', column: 'house_id', values: ['house-id'] },
    { table: 'house_invites', column: 'house_id', values: ['house-id'] },
    { table: 'house_memberships', column: 'house_id', values: ['house-id'] },
    { table: 'houses', column: 'id', values: ['house-id'] },
    { authUsers: ['user-a', 'user-b'] },
  ]);
});
