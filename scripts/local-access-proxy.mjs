/** Disposable loopback transport harness, never an application/remote proxy.
 * ROOM_PLACEMENT_DISPOSABLE_DB=1 node scripts/local-access-proxy.mjs <fixture.json>
 * Write {"mode":"online"|"offline"|"hold"} to adjacent access-network.json.
 * hold buffers A's room-placement response; online releases it. JWT decoding
 * selects a test delay only: the actual upstream still verifies Auth and RLS. */
import assert from 'node:assert/strict';
import { createServer, request } from 'node:http';
import { readFile, writeFile, chmod } from 'node:fs/promises';
import { watchFile } from 'node:fs';
import { dirname, resolve } from 'node:path';

assert.equal(process.env.ROOM_PLACEMENT_DISPOSABLE_DB, '1');
const fixturePath = resolve(process.argv[2]);
const f = JSON.parse(await readFile(fixturePath, 'utf8'));
assert.equal(f.project, 'cozy-v3-playtest'); assert.equal(f.cleaned, undefined);
const upstream = new URL(f.apiUrl);
assert.equal(upstream.protocol, 'http:'); assert.equal(upstream.hostname, '127.0.0.1'); assert.equal(upstream.port, '54321');
assert.equal(upstream.search, '');
const control = resolve(dirname(fixturePath), 'access-network.json');
const evidence = resolve(dirname(fixturePath), 'access-proxy-state.json');
await writeFile(control, JSON.stringify({ mode: 'online' }), { mode: 0o600 }); await chmod(control, 0o600);
let mode = 'online', held = [], heldTotal = 0, requests = 0;
const sockets = new Set();
const record = () => writeFile(evidence, JSON.stringify({ mode, held: held.length, heldTotal, requests }), { mode: 0o600 });
function localTarget(req) {
  const target = new URL(req.url, upstream);
  return target.origin === upstream.origin ? target : null;
}
function isA(req) {
  try { return JSON.parse(Buffer.from(req.headers.authorization?.split(' ')[1]?.split('.')[1] ?? '', 'base64url').toString()).sub === f.users[0].id; } catch { return false; }
}
watchFile(control, { interval: 100 }, async () => {
  try {
    const next = JSON.parse(await readFile(control, 'utf8')).mode;
    assert.ok(['online', 'offline', 'hold'].includes(next));
    if (next === mode) return;
    mode = next;
    if (mode === 'offline') for (const socket of sockets) socket.destroy();
    if (mode === 'online') { const pending = held; held = []; for (const release of pending) release(); }
    await record();
  } catch { mode = 'offline'; for (const socket of sockets) socket.destroy(); }
});
const server = createServer((req, res) => {
  requests++;
  const target = localTarget(req);
  if (!target) { res.writeHead(400); res.end(); return; }
  if (mode === 'offline') { req.socket.destroy(); return; }
  const hold = mode === 'hold' && isA(req) && req.url.startsWith('/rest/v1/room_placements');
  const forwarded = request(target, { method: req.method, headers: { ...req.headers, host: upstream.host }, agent: false }, incoming => {
    if (hold) {
      const chunks = []; incoming.on('data', chunk => chunks.push(chunk));
      incoming.on('end', () => { held.push(() => { if (!res.destroyed) { res.writeHead(incoming.statusCode, incoming.headers); res.end(Buffer.concat(chunks)); } }); heldTotal++; void record(); });
    } else { res.writeHead(incoming.statusCode, incoming.headers); incoming.pipe(res); }
  });
  forwarded.on('error', () => res.destroy()); req.on('aborted', () => forwarded.destroy()); req.pipe(forwarded);
});
server.on('connection', socket => { sockets.add(socket); socket.on('close', () => sockets.delete(socket)); });
server.on('upgrade', (req, socket, head) => {
  const target = localTarget(req);
  if (mode === 'offline' || !target) { socket.destroy(); return; }
  const forwarded = request(target, { headers: { ...req.headers, host: upstream.host }, agent: false });
  forwarded.on('upgrade', (response, remote, remoteHead) => {
    sockets.add(remote); remote.on('close', () => sockets.delete(remote));
    socket.write(`HTTP/1.1 ${response.statusCode} ${response.statusMessage}\r\n${Object.entries(response.headers).map(([key, value]) => `${key}: ${value}\r\n`).join('')}\r\n`);
    if (remoteHead.length) socket.write(remoteHead); if (head.length) remote.write(head);
    socket.pipe(remote); remote.pipe(socket); socket.on('error', () => remote.destroy()); remote.on('error', () => socket.destroy());
  });
  forwarded.on('response', () => socket.destroy()); forwarded.on('error', () => socket.destroy()); forwarded.end();
});
server.listen(54329, '127.0.0.1', () => { void record(); console.log('Disposable local access proxy on 127.0.0.1:54329'); });
