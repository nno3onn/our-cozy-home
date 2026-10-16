#!/usr/bin/env node
/** Real, separate-session PostgreSQL races. Requires psql and a disposable local
 * Supabase database with all migrations applied. Never points at a remote DB.
 * ROOM_PLACEMENT_DISPOSABLE_DB=1 node scripts/test-room-placement-races.mjs
 * Optional ROOM_PLACEMENT_DATABASE_URL (default local Supabase port 54322).
 */
import assert from 'node:assert/strict';
import { spawn, spawnSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { setTimeout as delay } from 'node:timers/promises';

const url = new URL(process.env.ROOM_PLACEMENT_DATABASE_URL ?? 'postgresql://postgres:postgres@127.0.0.1:54322/postgres');
assert.equal(process.env.ROOM_PLACEMENT_DISPOSABLE_DB, '1', 'Set ROOM_PLACEMENT_DISPOSABLE_DB=1 to authorize a disposable local database');
assert.ok(['postgres:', 'postgresql:'].includes(url.protocol));
assert.ok(['127.0.0.1', '[::1]'].includes(url.hostname), 'Only literal loopback hosts are allowed');
assert.ok(!url.search, 'Connection URL query options are forbidden (host overrides included)');
assert.equal(spawnSync('psql', ['--version']).status, 0, 'psql is required');
const tag = `placement_race_${randomUUID().replaceAll('-', '')}`;
const q = (s) => `'${String(s).replaceAll("'", "''")}'`;
const sessions = [];
class Session {
  constructor(suffix) {
    this.name = `${tag}_${suffix}`;
    this.pending = null;
    this.stdout = '';
    this.stderr = '';
    // Clear libpq overrides; the explicit URL is the sole connection authority.
    const env = Object.fromEntries(Object.entries(process.env).filter(([k]) => !k.startsWith('PG')));
    this.child = spawn('psql', ['-X', '-qAt', '-d', url.href], { env, stdio: ['pipe', 'pipe', 'pipe'] });
    this.child.stdout.setEncoding('utf8').on('data', (data) => {
      this.stdout += data;
      if (!this.pending) return;
      const match = this.stdout.match(new RegExp(`^${this.pending.marker} (true|false) ([A-Z0-9]+)\\r?$`, 'm'));
      if (!match) return;
      const pending = this.pending;
      const result = { lines: this.stdout.slice(0, match.index).trim().split('\n').filter(Boolean), error: match[1] === 'true', state: match[2], stderr: this.stderr };
      this.stdout = this.stdout.slice(match.index + match[0].length).replace(/^\r?\n/, '');
      this.stderr = '';
      this.pending = null;
      clearTimeout(pending.timer);
      pending.resolve(result);
    });
    this.child.stderr.setEncoding('utf8').on('data', (s) => { this.stderr += s; });
    this.child.on('error', (error) => this.pending?.reject(error));
    this.child.on('exit', (code) => this.pending?.reject(new Error(`${this.name} psql exited ${code}: ${this.stderr}`)));
    sessions.push(this);
  }
  run(sql) {
    assert.equal(this.pending, null, 'One outstanding command per SQL session');
    return new Promise((resolve, reject) => {
      const marker = `DONE_${randomUUID().replaceAll('-', '')}`;
      const timer = setTimeout(() => { this.child.kill(); reject(new Error(`${this.name} command timed out: ${sql}`)); }, 25000);
      this.pending = { marker, timer, resolve, reject };
      this.child.stdin.write(`${sql}\n\\echo ${marker} :ERROR :SQLSTATE\n`);
    });
  }
  async ok(sql) { const r = await this.run(sql); assert.equal(r.error, false, `${sql}\n${r.stderr}`); return r.lines; }
  async init() { await this.ok(`set application_name=${q(this.name)}; set statement_timeout='20s'; set lock_timeout='15s';`); }
  async auth(uid) { await this.ok(`begin; set local role authenticated; select set_config('request.jwt.claim.sub',${q(uid)},true);`); }
  async close() { if (!this.child.killed && this.child.exitCode === null) { this.child.stdin.end('rollback;\n\\q\n'); } }
}
const admin = new Session('coordinator');
const x = new Session('first');
const y = new Session('second');
const A = randomUUID(), B = randomUUID(), C = randomUUID();
const a1 = randomUUID(), a2 = randomUUID(), b1 = randomUUID(), c1 = randomUUID(), consumable = randomUUID();
const users = [A, B, C].map(q).join(',');
const items = [a1, a2, b1, c1, consumable].map(q).join(',');
const slot1 = `${tag}_1`, slot2 = `${tag}_2`, definition = `${tag}_furniture`, consumableDefinition = `${tag}_consumable`;
let house, newHouse;
const results = [];
const record = (name) => { results.push({ scenario: name, passed: true }); console.log(`Passed: ${name}`); };
const rpc = (h, item, slot, version, key) => `select row_to_json(r) from public.place_owned_item_scoped(${q(h)},${q(item)},${q(slot)},${version},${q(key)}) r;`;
async function call(uid, sql) { await x.auth(uid); try { return await x.ok(sql); } finally { await x.ok('commit;'); } }
async function deny(uid, sql, expected = 'P0001') {
  await x.auth(uid);
  const r = await x.run(sql);
  await x.ok('rollback;');
  assert.equal(r.error, true, `Expected denial: ${sql}`);
  assert.equal(r.state, expected, `Expected domain denial ${expected}: ${r.stderr}`);
}
async function check(expression, message) {
  const lines = await admin.ok(`select case when (${expression}) then true else false end;`);
  assert.equal(lines.at(-1), 't', message);
}
async function blocked(waiter, blocker) {
  const until = Date.now() + 10000;
  do {
    const lines = await admin.ok(`select exists(select 1 from pg_stat_activity w join pg_stat_activity b on b.pid=any(pg_blocking_pids(w.pid)) where w.application_name=${q(waiter.name)} and b.application_name=${q(blocker.name)} and w.wait_event_type='Lock');`);
    if (lines.at(-1) === 't') return;
    // Polling cadence only; lock evidence, never a timed sleep, establishes order.
    await delay(20);
  } while (Date.now() < until);
  throw new Error(`No observed blocking: ${waiter.name} behind ${blocker.name}`);
}
async function assetCount() { await check(`(select count(*) from public.owned_items where id in (${items}))=5 and (select sum(quantity) from public.owned_items where id in (${items}))=5`, 'Ownership assets/quantity changed'); }
async function inviteA() {
  const token = JSON.parse((await call(B, 'select row_to_json(r) from public.create_house_invite(true) r;')).at(-1)).invite_token;
  await call(A, `select * from public.accept_house_invite(${q(token)},${q(randomUUID())});`);
}
async function cleanup() {
  // The fixture owns no business rows beyond these tables. Notification events
  // are produced by real invite acceptance and cascade to deliveries/targets.
  await admin.ok(`begin;
    delete from public.room_placement_requests where profile_id in (${users});
    delete from public.notification_events where house_id in (select house_id from public.house_memberships where profile_id in (${users}));
    delete from public.room_placements where owned_item_id in (${items});
    delete from public.invite_acceptances where profile_id in (${users});
    delete from public.invite_acceptance_requests where profile_id in (${users});
    delete from public.house_invites where house_id in (select house_id from public.house_memberships where profile_id in (${users}));
    delete from public.house_create_requests where profile_id in (${users});
    delete from public.house_memberships where profile_id in (${users});
    delete from public.houses where admin_profile_id in (${users});
    delete from public.owned_items where id in (${items});
    delete from public.item_definitions where id in (${q(definition)},${q(consumableDefinition)});
    delete from public.room_slots where id in (${q(slot1)},${q(slot2)});
    delete from auth.users where id in (${users});
    commit;`);
}
try {
  await Promise.all([admin.init(), x.init(), y.init()]);
  await admin.ok(`insert into auth.users(id,aud,role,email) values ${[A,B,C].map((u,i) => `(${q(u)},'authenticated','authenticated',${q(`${tag}_${i}@example.invalid`)})`).join(',')};`);
  for (const [i, uid] of [A,B,C].entries()) await call(uid, `select * from public.complete_onboarding('Race ${i}','#123456','Cat','cat');`);
  house = JSON.parse((await call(A, `select row_to_json(r) from public.create_house(${q(tag.slice(0,25))},${q(tag)}) r;`)).at(-1)).house_id;
  const token = JSON.parse((await call(A, 'select row_to_json(r) from public.create_house_invite() r;')).at(-1)).invite_token;
  await call(B, `select * from public.accept_house_invite(${q(token)},${q(tag)});`);
  await admin.ok(`insert into public.room_slots(id,name_ko,zone) values (${q(slot1)},'race slot','floor'),(${q(slot2)},'race slot','floor');
    insert into public.item_definitions(id,source,category,theme,name_ko,price,consumable,thumbnail_key,room_asset_key,silhouette,size,anchor,allowed_slot_ids,layer_bias,interaction,asset_status,preview_color)
    values ${[definition,consumableDefinition].map((id,i)=>`(${q(id)},'shop','furniture','race','race',0,${i===1},'race','race','race','{}','{}',${q(JSON.stringify([slot1,slot2]))},0,'none','placeholder','#123456')`).join(',')};
    insert into public.owned_items(id,profile_id,item_definition_id,kind) values
    (${q(a1)},${q(A)},${q(definition)},'furniture'),(${q(a2)},${q(A)},${q(definition)},'furniture'),(${q(b1)},${q(B)},${q(definition)},'furniture'),(${q(c1)},${q(C)},${q(definition)},'furniture'),(${q(consumable)},${q(A)},${q(consumableDefinition)},'consumable');`);
  await deny(C, rpc(house,c1,slot1,0,'outside'),'42501');
  await deny(A, rpc(house,b1,slot1,0,'foreign'),'42501');
  await deny(A, rpc(house,consumable,slot1,0,'consumable'),'42501');
  await deny(A, rpc(house,a1,'invalid-slot',0,'invalid-slot'));
  await deny(A, `select * from public.place_owned_item(${q(a1)},${q(slot1)},0);`,'42501');
  record('membership, ownership, kind, allowed-slot and legacy RPC denials');
  await x.ok(`begin isolation level repeatable read; set local role authenticated; select set_config('request.jwt.claim.sub',${q(A)},true);`);
  const staleSnapshot = await x.run(rpc(house,a1,slot1,0,'old-snapshot'));
  assert.equal(staleSnapshot.error,true); assert.equal(staleSnapshot.state,'22023'); await x.ok('rollback;');
  record('caller-supplied stale transaction snapshot rejected');

  // Hold the first successful placement open; a second user must wait on house.
  await x.auth(A); await x.ok(rpc(house,a1,slot1,0,'race-A'));
  await y.auth(B); const competitor = y.run(rpc(house,b1,slot1,0,'race-B'));
  await blocked(y,x); await x.ok('commit;');
  const lostRace = await competitor; assert.equal(lostRace.error,true); assert.equal(lostRace.state,'P0001'); await y.ok('rollback;');
  await check(`(select count(*) from public.room_placements where house_id=${q(house)} and slot_id=${q(slot1)} and owned_item_id=${q(a1)} and version=1)=1`, 'Exactly one slot winner at version 1');
  await deny(A, rpc(house,a1,slot2,0,'duplicate-item'));
  await deny(A, rpc(house,a2,slot1,0,'stale-version'));
  await check(`(select count(*) from public.room_placements where house_id=${q(house)})=1 and exists(select 1 from public.room_placements where house_id=${q(house)} and version=1)`, 'Failed writes changed slot count/version');
  record('A/B same-slot contention and uniqueness/version guards');

  const retry = JSON.parse((await call(A,rpc(house,a1,slot1,0,'race-A'))).at(-1));
  assert.equal(retry.version,1);
  await deny(A,rpc(house,a2,slot1,0,'race-A'));
  await call(B,rpc(house,b1,slot1,1,'replace-B'));
  await call(A,rpc(house,a1,slot1,0,'race-A'));
  await check(`exists(select 1 from public.room_placements where house_id=${q(house)} and owned_item_id=${q(b1)} and version=2)`, 'Historical receipt must not reapply stale placement');
  await x.auth(A); await x.ok(rpc(house,a2,slot2,0,'offline-abort')); await x.ok('rollback;');
  await check(`not exists(select 1 from public.room_placements where house_id=${q(house)} and slot_id=${q(slot2)})`, 'Rolled back placement persisted');
  // Lose an actual SQL connection with a successful but uncommitted command.
  // PostgreSQL must roll back both the placement and its idempotency receipt.
  const offline = new Session('offline'); await offline.init(); await offline.auth(A);
  await offline.ok(rpc(house,a2,slot2,0,'offline-abort'));
  const offlineClosed = new Promise((resolve, reject) => {
    const timer = setTimeout(() => { offline.child.kill(); reject(new Error('Terminated backend client did not close')); }, 10000);
    offline.child.once('exit', () => { clearTimeout(timer); resolve(); });
  });
  await admin.ok(`select pg_terminate_backend(pid) from pg_stat_activity where application_name=${q(offline.name)};`);
  // psql can be blocked reading stdin while its idle server socket closes.
  // A new command makes it observe the actual backend termination.
  offline.child.stdin.write('select 1;\n');
  await offlineClosed;
  await check(`not exists(select 1 from public.room_placements where house_id=${q(house)} and slot_id=${q(slot2)})`, 'Disconnected uncommitted placement persisted');
  await call(A,rpc(house,a2,slot2,0,'offline-abort'));
  await call(A,rpc(house,a2,slot2,0,'offline-abort'));
  await check(`exists(select 1 from public.room_placements where house_id=${q(house)} and owned_item_id=${q(a2)} and version=1)`, 'Retry after aborted transaction must apply exactly once');
  record('response-lost retry, payload conflict, stale receipt and aborted/offline retry');

  // Invite holds the membership while waiting for the house. A placement that
  // already holds the house must not acquire that membership in the reverse order.
  await x.auth(A); await x.ok(rpc(house,a2,slot2,1,'invite-first-placement'));
  await y.auth(A); const inviteWaiting = y.run('select * from public.create_house_invite(true);');
  await blocked(y,x);
  await x.ok(rpc(house,a2,slot2,2,'invite-second-placement'));
  await x.ok('commit;'); assert.equal((await inviteWaiting).error,false); await y.ok('commit;');
  record('invite membership lock versus placement house lock');

  // Force placement to queue behind a held house row, then queue leave behind
  // placement's user advisory lock. This proves order at both lock boundaries.
  await admin.ok(`begin; select id from public.houses where id=${q(house)} for update;`);
  await x.auth(A); const placeBefore = x.run(rpc(house,a1,slot2,3,'place-before-leave'));
  await blocked(x,admin);
  await y.auth(A); const leaveAfter = y.run('select * from public.leave_house();');
  await blocked(y,x); await admin.ok('commit;'); assert.equal((await placeBefore).error,false);
  await x.ok('commit;'); assert.equal((await leaveAfter).error,false); await y.ok('commit;');
  await check(`not exists(select 1 from public.room_placements where house_id=${q(house)} and owned_item_id in (${q(a1)},${q(a2)}))`, 'Leave must remove earlier committed placements');
  await assetCount(); record('place-first / leave-second');
  await inviteA();

  await x.auth(A); await x.ok('select * from public.leave_house();');
  await y.auth(A); const placeAfter = y.run(rpc(house,a1,slot2,0,'leave-before-place'));
  await blocked(y,x); await x.ok('commit;'); const rejected = await placeAfter;
  assert.equal(rejected.error,true); assert.equal(rejected.state,'42501'); await y.ok('rollback;');
  await check(`not exists(select 1 from public.room_placements where house_id=${q(house)} and owned_item_id in (${q(a1)},${q(a2)}))`, 'Placement after leave must never appear');
  await assetCount(); record('leave-first / place-second');

  newHouse = JSON.parse((await call(A,`select row_to_json(r) from public.create_house(${q(`${tag.slice(0,23)}_2`)},'new-house') r;`)).at(-1)).house_id;
  await deny(A,rpc(house,a1,slot2,0,'delayed-old-house'),'42501');
  await check(`not exists(select 1 from public.room_placements where house_id=${q(newHouse)})`, 'Delayed old-house command redirected into new house');
  await call(A,rpc(newHouse,a1,slot2,0,'new-house-placement'));
  await deny(A,rpc(house,a1,slot1,0,'race-A'),'42501');
  await check(`exists(select 1 from public.room_placements where house_id=${q(newHouse)} and owned_item_id=${q(a1)} and version=1)`, 'Old receipt mutated current home');
  await assetCount(); record('delayed old-house request after create-house and historical retry');
  console.log(JSON.stringify({ passed:true, scenarios:results }, null,2));
} catch (error) {
  console.error(JSON.stringify({ passed:false, scenarios:results, error:error.message }, null,2));
  process.exitCode=1;
} finally {
  // Release all competing sessions before attempting fixture cleanup.
  for (const s of [x,y]) { if (s.pending) s.child.kill(); else await s.ok('rollback;').catch(()=>{}); }
  await admin.ok('rollback;').catch(()=>{});
  await cleanup().catch((error)=> { console.error(`Fixture cleanup failed (${tag}): ${error.message}`); process.exitCode=1; });
  await Promise.all(sessions.map((s)=>s.close()));
}
