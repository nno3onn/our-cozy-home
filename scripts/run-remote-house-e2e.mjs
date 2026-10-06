import { execFileSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { pathToFileURL } from 'node:url';

import { createClient } from '@supabase/supabase-js';
import WebSocket from 'ws';

const DEFAULT_PROJECT_REF = 'cbyikdryogktctskvzzk';
const REPORT_PREFIX = '[remote-house-e2e]';

export function resolveApiKeys(env = process.env, cliKeys) {
  if (env.SUPABASE_PUBLISHABLE_KEY && env.SUPABASE_SECRET_KEY) {
    return {
      publishableKey: env.SUPABASE_PUBLISHABLE_KEY,
      secretKey: env.SUPABASE_SECRET_KEY,
      source: 'environment',
    };
  }

  if (!Array.isArray(cliKeys)) {
    throw new Error('Supabase API keys are unavailable. Set keys or sign in with the Supabase CLI.');
  }

  const publishable = cliKeys.find((key) => key.type === 'publishable')
    ?? cliKeys.find((key) => key.type === 'legacy' && key.name === 'anon');
  const secret = cliKeys.find((key) => key.type === 'secret')
    ?? cliKeys.find((key) => key.type === 'legacy' && key.name === 'service_role');

  if (!publishable?.api_key || !secret?.api_key) {
    throw new Error('The Supabase project does not expose the required API key roles.');
  }

  return {
    publishableKey: publishable.api_key,
    secretKey: secret.api_key,
    source: 'supabase-cli',
  };
}

export function safeStepReporter(write = console.log) {
  return (step) => write(`${REPORT_PREFIX} ${step}`);
}

export function isExpectedHouseFullError(error) {
  return [error?.message, error?.details, error?.hint]
    .filter(Boolean)
    .some((value) => String(value).includes('house_full'));
}

export function isMissingAuthUserError(error) {
  return error?.status === 404 || error?.code === 'user_not_found';
}

export function buildCleanupPlan({ houseId, inviteIds = [], userIds = [] }) {
  const plan = [];
  if (houseId) {
    plan.push(
      { table: 'notification_events', column: 'house_id', values: [houseId] },
      { table: 'invite_acceptance_requests', column: 'house_id', values: [houseId] },
    );
  }
  if (inviteIds.length > 0) {
    plan.push({ table: 'invite_acceptances', column: 'invite_id', values: inviteIds });
  }
  if (houseId) {
    plan.push(
      { table: 'house_create_requests', column: 'house_id', values: [houseId] },
      { table: 'house_invites', column: 'house_id', values: [houseId] },
      { table: 'house_memberships', column: 'house_id', values: [houseId] },
      { table: 'houses', column: 'id', values: [houseId] },
    );
  }
  if (userIds.length > 0) {
    plan.push({ authUsers: userIds });
  }
  return plan;
}

function loadCliKeys(projectRef, cliBinary) {
  const candidates = cliBinary
    ? [cliBinary]
    : ['supabase', '/opt/homebrew/bin/supabase', '/usr/local/bin/supabase'];
  for (const candidate of [...new Set(candidates)]) {
    try {
      const output = execFileSync(candidate, [
        'projects',
        'api-keys',
        '--project-ref',
        projectRef,
        '--reveal',
        '--output',
        'json',
      ], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
      return JSON.parse(output);
    } catch {
      // npm can put an older project-local CLI before the current global CLI.
    }
  }
  throw new Error('A signed-in Supabase CLI with projects api-keys support is required.');
}

function requireRpcData(data, error, label) {
  if (error) throw new Error(`${label}: ${error.message}`);
  const row = Array.isArray(data) ? data[0] : data;
  if (!row) throw new Error(`${label}: empty response`);
  return row;
}

async function removeExactRows(admin, step) {
  const { error } = await admin.from(step.table).delete().in(step.column, step.values);
  if (error) throw new Error(`cleanup ${step.table}: ${error.message}`);
}

async function cleanup(admin, context, report) {
  const failures = [];
  if (!context.houseId && context.userIds.length > 0) {
    const { data, error } = await admin
      .from('house_memberships')
      .select('house_id')
      .in('profile_id', context.userIds);
    const discoveredHouseIds = [...new Set((data ?? []).map((row) => row.house_id))];
    if (error) failures.push('house cleanup discovery failed');
    if (discoveredHouseIds.length > 1) failures.push('multiple test houses discovered');
    context.houseId = discoveredHouseIds[0] ?? null;
  }

  let inviteIds = context.inviteIds;
  if (context.houseId && inviteIds.length === 0) {
    const { data, error } = await admin
      .from('house_invites')
      .select('id')
      .eq('house_id', context.houseId);
    if (error) failures.push('invite cleanup discovery failed');
    inviteIds = (data ?? []).map((row) => row.id);
  }

  for (const step of buildCleanupPlan({
    houseId: context.houseId,
    inviteIds,
    userIds: context.userIds,
  })) {
    try {
      if (step.authUsers) {
        for (const userId of step.authUsers) {
          const { error } = await admin.auth.admin.deleteUser(userId);
          if (error) throw error;
        }
      } else {
        await removeExactRows(admin, step);
      }
    } catch (error) {
      failures.push(error instanceof Error ? error.message : String(error));
    }
  }

  if (context.houseId) {
    const { count, error } = await admin
      .from('houses')
      .select('id', { count: 'exact', head: true })
      .eq('id', context.houseId);
    if (error || count !== 0) failures.push('house cleanup verification failed');
  }
  for (const userId of context.userIds) {
    const { data, error } = await admin.auth.admin.getUserById(userId);
    if (data?.user) failures.push('auth user cleanup verification failed');
    if (error && !isMissingAuthUserError(error)) {
      failures.push('auth user cleanup verification unavailable');
    }
  }
  report('cleanup-finished');
  if (failures.length > 0) {
    throw new Error(`cleanup failed in ${failures.length} step(s)`);
  }
}

function createUserClient(url, publishableKey) {
  return createClient(url, publishableKey, {
    auth: { autoRefreshToken: false, persistSession: false },
    realtime: { transport: WebSocket },
  });
}

export async function runRemoteHouseE2E({
  env = process.env,
  projectRef = env.SUPABASE_PROJECT_REF || DEFAULT_PROJECT_REF,
  keyRows,
  write = console.log,
} = {}) {
  const report = safeStepReporter(write);
  const rows = keyRows ?? (
    env.SUPABASE_PUBLISHABLE_KEY && env.SUPABASE_SECRET_KEY
      ? undefined
      : loadCliKeys(projectRef, env.SUPABASE_CLI_BIN)
  );
  const { publishableKey, secretKey } = resolveApiKeys(env, rows);
  const url = env.SUPABASE_URL || `https://${projectRef}.supabase.co`;
  const admin = createClient(url, secretKey, {
    auth: { autoRefreshToken: false, persistSession: false },
    realtime: { transport: WebSocket },
  });
  const context = { houseId: null, inviteIds: [], userIds: [] };
  const clients = [];

  try {
    report('create-users');
    for (let index = 0; index < 5; index += 1) {
      const email = `e2e-house-${randomUUID()}@example.com`;
      const password = `E2E-${randomUUID()}-aA1!`;
      const { data: created, error: createError } = await admin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
      });
      if (createError || !created.user) {
        throw new Error(`create user ${index + 1}: ${createError?.message ?? 'empty response'}`);
      }
      context.userIds.push(created.user.id);

      const client = createUserClient(url, publishableKey);
      const { error: signInError } = await client.auth.signInWithPassword({ email, password });
      if (signInError) throw new Error(`sign in user ${index + 1}: ${signInError.message}`);
      clients.push(client);
    }

    report('complete-onboarding');
    const species = ['rabbit', 'cat', 'bear', 'dog', 'rabbit'];
    for (let index = 0; index < clients.length; index += 1) {
      const { error } = await clients[index].rpc('complete_onboarding', {
        p_animal_name: `동물${index + 1}`,
        p_display_name: `E2E${index + 1}`,
        p_point_color: ['#F28B82', '#81C995', '#8AB4F8', '#C58AF9', '#FDD663'][index],
        p_species: species[index],
      });
      if (error) throw new Error(`onboarding ${index + 1}: ${error.message}`);
    }

    report('create-house');
    const createResponse = await clients[0].rpc('create_house', {
      p_name: `E2E 우리집 ${randomUUID().slice(0, 8)}`,
      p_request_key: randomUUID(),
    });
    const createResult = requireRpcData(createResponse.data, createResponse.error, 'create house');
    context.houseId = createResult.house_id;

    report('create-invite');
    const inviteResponse = await clients[0].rpc('create_house_invite', { p_reissue: false });
    const invite = requireRpcData(inviteResponse.data, inviteResponse.error, 'create invite');
    const { data: inviteRows, error: inviteLookupError } = await admin
      .from('house_invites')
      .select('id')
      .eq('house_id', context.houseId);
    if (inviteLookupError) throw new Error(`invite lookup: ${inviteLookupError.message}`);
    context.inviteIds = (inviteRows ?? []).map((row) => row.id);

    report('join-three-members');
    for (let index = 1; index <= 3; index += 1) {
      const response = await clients[index].rpc('accept_house_invite', {
        p_request_key: randomUUID(),
        p_token: invite.invite_token,
      });
      const joined = requireRpcData(response.data, response.error, `accept invite ${index + 1}`);
      if (joined.result !== 'joined' || joined.house_id !== context.houseId) {
        throw new Error(`accept invite ${index + 1}: unexpected result`);
      }
    }

    report('verify-capacity');
    const fifthResponse = await clients[4].rpc('accept_house_invite', {
      p_request_key: randomUUID(),
      p_token: invite.invite_token,
    });
    if (!fifthResponse.error || !isExpectedHouseFullError(fifthResponse.error)) {
      throw new Error('fifth member was not rejected with house_full');
    }
    const { data: activeMembers, error: membersError } = await admin
      .from('house_memberships')
      .select('profile_id,role,joined_at,id')
      .eq('house_id', context.houseId)
      .eq('status', 'active')
      .order('joined_at', { ascending: true })
      .order('id', { ascending: true });
    if (membersError) throw new Error(`membership verification: ${membersError.message}`);
    if (activeMembers?.length !== 4) throw new Error('active membership count is not four');

    report('verify-admin-succession');
    const firstLeaveResponse = await clients[0].rpc('leave_house');
    const firstLeave = requireRpcData(
      firstLeaveResponse.data,
      firstLeaveResponse.error,
      'admin leave',
    );
    if (firstLeave.house_archived || firstLeave.successor_profile_id !== context.userIds[1]) {
      throw new Error('admin succession did not select the earliest remaining member');
    }

    report('verify-final-archive');
    for (let index = 1; index <= 3; index += 1) {
      const response = await clients[index].rpc('leave_house');
      const left = requireRpcData(response.data, response.error, `leave member ${index + 1}`);
      if (index < 3 && left.house_archived) throw new Error('house archived before the last member left');
      if (index === 3 && !left.house_archived) throw new Error('house was not archived after the last member left');
    }
    const { data: house, error: houseError } = await admin
      .from('houses')
      .select('status,archived_at')
      .eq('id', context.houseId)
      .single();
    if (houseError) throw new Error(`house verification: ${houseError.message}`);
    if (house.status !== 'archived' || !house.archived_at) throw new Error('archived house state is invalid');

    report('scenario-passed');
  } finally {
    await cleanup(admin, context, report);
  }
}

async function main() {
  await runRemoteHouseE2E();
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error(`${REPORT_PREFIX} failed: ${error instanceof Error ? error.message : String(error)}`);
    process.exitCode = 1;
  });
}
