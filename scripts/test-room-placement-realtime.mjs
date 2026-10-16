#!/usr/bin/env node
/** Actual local Supabase Auth / REST / postgres_changes integration.
 * Start/reset the disposable local stack first. Requires psql, Supabase CLI,
 * and the existing @supabase/supabase-js and ws dependencies.
 * ROOM_PLACEMENT_DISPOSABLE_DB=1 ROOM_PLACEMENT_REQUIRE_REALTIME=1 node scripts/test-room-placement-realtime.mjs
 * No environment API URL/key overrides are accepted; keys come from local status.
 */
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { createClient } from '@supabase/supabase-js';
import WebSocket from 'ws';

const timeoutMs = 15000;
const tag = `rt-${randomUUID()}`;
const report = { status: 'running', passed: false, scenarios: [] };
const users = [], clients = [], itemIds = [randomUUID(), randomUUID()];
let admin, houseId, channel, status;
const secrets = [];
function safe(message) {
  let result = String(message);
  for (const secret of secrets) if (secret) result = result.replaceAll(secret, '[redacted]');
  return result.replace(/eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/g, '[redacted JWT]');
}
function localUrl(value, protocols, allowQuery = false) {
  const url = new URL(value);
  assert.ok(protocols.includes(url.protocol), 'Unexpected local URL protocol');
  assert.ok(['127.0.0.1', '[::1]'].includes(url.hostname), 'Only literal loopback endpoints are allowed');
  assert.ok((allowQuery || !url.search) && !url.hash, 'Base URL query options and fragments are forbidden');
  return url;
}
function localStatus() {
  for (const executable of ['supabase', '/opt/homebrew/bin/supabase', '/usr/local/bin/supabase']) {
    try {
      execFileSync(executable, ['status', '--help'], { stdio: 'ignore', timeout: 10000 });
      return JSON.parse(execFileSync(executable, ['status', '-o', 'json'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], timeout: 20000 }));
    } catch { /* CLI failures may contain local keys; never print raw output. */ }
  }
  throw new Error('Cannot read running local Supabase status JSON; start the disposable stack and install the CLI');
}
async function ok(request, label) {
  const { data, error } = await request;
  if (error) throw new Error(`${label}: ${error.code ?? error.name ?? 'error'} ${error.message}`);
  return data;
}
async function rpc(client, name, args) {
  const data = await ok(client.rpc(name, args), name);
  const row = Array.isArray(data) ? data[0] : data;
  assert.ok(row, `${name} returned no row`);
  return row;
}
function client(key) {
  const result = createClient(status.API_URL, key, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    global: { fetch: (url, options = {}) => {
      const endpoint = localUrl(String(url), ['http:', 'https:'], true);
      assert.equal(endpoint.origin, new URL(status.API_URL).origin, 'Requests must stay on the local API origin');
      // Deny redirects so credentials cannot follow a local endpoint elsewhere.
      return fetch(url, { ...options, redirect: 'error', signal: options.signal ?? AbortSignal.timeout(timeoutMs) });
    } },
    realtime: { transport: WebSocket, timeout: timeoutMs },
  });
  clients.push(result);
  return result;
}
function publicationEnabled() {
  const db = localUrl(status.DB_URL, ['postgres:', 'postgresql:']);
  secrets.push(db.password);
  const env = Object.fromEntries(Object.entries(process.env).filter(([key]) => !key.startsWith('PG')));
  try {
    const output = execFileSync('psql', ['-X', '-qAt', '-v', 'ON_ERROR_STOP=1', '-d', db.href, '-c', "select exists(select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='room_placements');"], { env, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], timeout: 15000 });
    assert.ok(['t', 'f'].includes(output.trim()), 'Unexpected publication metadata response');
    return output.trim() === 't';
  } catch {
    throw new Error('Cannot inspect actual local publication metadata; psql and a reachable local database are required');
  }
}
const passed = (scenario) => report.scenarios.push({ scenario, status: 'passed' });
async function placements(client) {
  return await ok(client.from('room_placements').select('id,house_id,slot_id,owned_item_id,version').eq('house_id', houseId), 'fresh placement REST read');
}
async function clean() {
  if (!admin) return;
  const failures = [];
  async function remove(table, column, values) {
    if (!values.length) return;
    try { await ok(admin.from(table).delete().in(column, values), `cleanup ${table}`); }
    catch (error) { failures.push(safe(error.message)); }
  }
  const ids = users.map((u) => u.id);
  // Discover a committed house if an RPC response was lost during setup.
  if (!houseId && ids.length) {
    try {
      const rows = await ok(admin.from('house_memberships').select('house_id').in('profile_id', ids), 'cleanup house discovery');
      const houses = [...new Set(rows.map((row) => row.house_id))];
      assert.ok(houses.length <= 1, 'Unexpected multiple fixture houses');
      houseId = houses[0];
    } catch (error) { failures.push(safe(error.message)); }
  }
  await remove('room_placement_requests', 'profile_id', ids);
  await remove('room_placements', 'owned_item_id', itemIds);
  await remove('notification_events', 'house_id', houseId ? [houseId] : []);
  await remove('invite_acceptance_requests', 'profile_id', ids);
  await remove('invite_acceptances', 'profile_id', ids);
  await remove('house_create_requests', 'profile_id', ids);
  await remove('house_invites', 'house_id', houseId ? [houseId] : []);
  await remove('house_memberships', 'profile_id', ids);
  await remove('houses', 'id', houseId ? [houseId] : []);
  await remove('owned_items', 'id', itemIds);
  for (const user of users) {
    try { await ok(admin.auth.admin.deleteUser(user.id), 'cleanup auth user'); }
    catch (error) { failures.push(safe(error.message)); }
  }
  if (houseId) {
    try {
      const rows = await ok(admin.from('houses').select('id').eq('id', houseId), 'verify house cleanup');
      assert.equal(rows.length, 0, 'Fixture house survived cleanup');
    } catch (error) { failures.push(safe(error.message)); }
  }
  if (failures.length) throw new Error(failures.join('; '));
}
try {
  assert.equal(process.env.ROOM_PLACEMENT_DISPOSABLE_DB, '1', 'Set ROOM_PLACEMENT_DISPOSABLE_DB=1 to authorize disposable local fixtures');
  status = localStatus();
  localUrl(status.API_URL, ['http:', 'https:']);
  localUrl(status.DB_URL, ['postgres:', 'postgresql:']);
  secrets.push(status.ANON_KEY, status.SERVICE_ROLE_KEY, status.SECRET_KEY, status.PUBLISHABLE_KEY);
  const anonKey = status.ANON_KEY ?? status.PUBLISHABLE_KEY;
  const adminKey = status.SERVICE_ROLE_KEY ?? status.SECRET_KEY;
  assert.ok(anonKey && adminKey, 'Local status did not include required API keys');
  const realtime = publicationEnabled();
  if (!realtime && process.env.ROOM_PLACEMENT_REQUIRE_REALTIME === '1') throw new Error('room_placements is absent from actual supabase_realtime publication');
  admin = client(adminKey);
  const a = client(anonKey), b = client(anonKey);
  for (const [index, current] of [a, b].entries()) {
    const email = `${tag}-${index}@example.invalid`, password = `T-${randomUUID()}-aA9!`;
    secrets.push(password);
    const created = await ok(admin.auth.admin.createUser({ email, password, email_confirm: true }), 'create local test user');
    assert.ok(created.user?.id, 'Auth admin returned no user');
    users.push({ id: created.user.id, email, password });
    const login = await ok(current.auth.signInWithPassword({ email, password }), 'password sign-in');
    assert.equal(login.user.id, created.user.id);
    assert.ok(login.session?.access_token, 'Password sign-in returned no JWT');
    secrets.push(login.session.access_token, login.session.refresh_token);
    await rpc(current, 'complete_onboarding', { p_display_name: `Realtime ${index}`, p_point_color: '#123456', p_animal_name: 'Cat', p_species: 'cat' });
  }
  houseId = (await rpc(a, 'create_house', { p_name: `RT ${randomUUID().slice(0,8)}`, p_request_key: tag })).house_id;
  const invite = await rpc(a, 'create_house_invite', {});
  await rpc(b, 'accept_house_invite', { p_token: invite.invite_token, p_request_key: tag });
  passed('genuine password Auth and house onboarding/invite RPCs');

  const definitions = await ok(admin.from('item_definitions').select('id,allowed_slot_ids').eq('consumable', false).eq('source', 'shop').eq('active', true), 'read seeded furniture');
  const slots = await ok(admin.from('room_slots').select('id'), 'read seeded slots');
  const slotIds = new Set(slots.map((s) => s.id));
  const definition = definitions.find((d) => Array.isArray(d.allowed_slot_ids) && d.allowed_slot_ids.some((id) => slotIds.has(id)));
  assert.ok(definition, 'Seeded compatible furniture/slot is required');
  const slotId = definition.allowed_slot_ids.find((id) => slotIds.has(id));
  await ok(admin.from('owned_items').insert(itemIds.map((id) => ({ id, profile_id: users[0].id, item_definition_id: definition.id, kind: 'furniture', quantity: 1 }))), 'seed isolated owned furniture');

  const events = [];
  let waiting;
  function eventReceived(payload) {
    events.push(payload);
    if (waiting && waiting.matches(payload)) { clearTimeout(waiting.timer); waiting.resolve(payload); waiting = null; }
  }
  function eventFor(eventType, itemId, version) {
    const matches = (e) => e.eventType === eventType && e.new.house_id === houseId && e.new.slot_id === slotId && e.new.owned_item_id === itemId && e.new.version === version;
    const observed = events.find(matches);
    if (observed) return Promise.resolve(observed);
    return new Promise((resolve, reject) => {
      waiting = { matches, resolve, timer: setTimeout(() => { waiting = null; reject(new Error(`No authenticated B postgres_changes ${eventType} event at version ${version}`)); }, timeoutMs) };
    });
  }
  if (realtime) {
    const session = await ok(b.auth.getSession(), 'B session for Realtime');
    await b.realtime.setAuth(session.session.access_token);
    channel = b.channel(tag).on('postgres_changes', { event: '*', schema: 'public', table: 'room_placements', filter: `house_id=eq.${houseId}` }, eventReceived);
    await new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error('Authenticated B subscription timed out')), timeoutMs);
      channel.subscribe((subscriptionStatus) => {
        if (subscriptionStatus === 'SUBSCRIBED') { clearTimeout(timer); resolve(); }
        if (['CHANNEL_ERROR', 'TIMED_OUT', 'CLOSED'].includes(subscriptionStatus)) { clearTimeout(timer); reject(new Error(`B subscription ${subscriptionStatus}`)); }
      });
    });
  } else {
    report.scenarios.push({ scenario: 'authenticated B postgres_changes INSERT/UPDATE', status: 'skipped', reason: 'room_placements absent from actual supabase_realtime publication' });
  }
  const place = (itemId, version, key) => rpc(a, 'place_owned_item_scoped', { p_house_id: houseId, p_owned_item_id: itemId, p_slot_id: slotId, p_expected_version: version, p_request_key: key });
  const inserted = await place(itemIds[0], 0, `${tag}-insert`);
  assert.equal(inserted.version, 1);
  if (realtime) await eventFor('INSERT', itemIds[0], 1);
  const updated = await place(itemIds[1], 1, `${tag}-update`);
  assert.equal(updated.placement_id, inserted.placement_id);
  assert.equal(updated.version, 2);
  if (realtime) { await eventFor('UPDATE', itemIds[1], 2); passed('authenticated B receives actual postgres_changes INSERT and UPDATE'); }
  let rows = await placements(b);
  assert.equal(rows.length, 1); assert.equal(rows[0].owned_item_id, itemIds[1]); assert.equal(rows[0].version, 2);
  passed('B fresh REST matches placement RPC and Realtime state');

  await ok(a.auth.signOut({ scope: 'local' }), 'A sign-out');
  const loginAgain = await ok(a.auth.signInWithPassword({ email: users[0].email, password: users[0].password }), 'A re-login');
  secrets.push(loginAgain.session.access_token, loginAgain.session.refresh_token);
  const refreshed = await ok(a.auth.refreshSession(), 'A refresh session');
  assert.equal(refreshed.user.id, users[0].id);
  secrets.push(refreshed.session.access_token, refreshed.session.refresh_token);
  rows = await placements(a);
  assert.equal(rows.length, 1); assert.equal(rows[0].id, inserted.placement_id); assert.equal(rows[0].version, 2);
  passed('A sign-out/re-login and refresh preserve server placement');

  await rpc(a, 'leave_house', {});
  assert.equal((await placements(b)).length, 0, 'B fresh REST still sees departed A placement');
  const inventory = await ok(a.from('owned_items').select('id,quantity,recovered_at').in('id', itemIds), 'A recovered inventory');
  assert.equal(inventory.length, 2); assert.ok(inventory.every((i) => i.quantity === 1 && i.recovered_at === null));
  passed('leave removes placement in B fresh REST and preserves A inventory');
  const valid = await ok(a.auth.getUser(), 'departed A JWT remains valid');
  assert.equal(valid.user.id, users[0].id);
  const denied = await a.rpc('place_owned_item_scoped', { p_house_id: houseId, p_owned_item_id: itemIds[0], p_slot_id: slotId, p_expected_version: 0, p_request_key: `${tag}-departed` });
  assert.ok(denied.error, 'Departed A placement unexpectedly succeeded');
  assert.equal(denied.error.code, '42501', 'Expected membership authorization denial');
  assert.equal((await placements(b)).length, 0);
  passed('departed A valid JWT cannot place into former house');
  report.status = realtime ? 'passed' : 'skipped';
  report.passed = realtime ? true : null;
  if (!realtime) report.reason = 'REST/Auth checks passed; Realtime publication unavailable, so full integration is unverified';
} catch (error) {
  report.status = 'failed'; report.error = safe(error.message); process.exitCode = 1;
} finally {
  for (const current of clients) await current.removeAllChannels().catch(() => {});
  try { await clean(); } catch (error) { report.status = 'failed'; report.passed = false; report.cleanupError = safe(error.message); process.exitCode = 1; }
  for (const current of clients) { current.realtime.disconnect(); current.auth.stopAutoRefresh(); }
  console.log(JSON.stringify(report, null, 2));
}
