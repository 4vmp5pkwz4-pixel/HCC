#!/usr/bin/env node
/* THE AGORA RELAY (v4.369) — any MCP host drives the open atlas, in front of the reader.
 *
 * One process is two things:
 *   · an MCP server on stdio: its tools are the Agora vocabulary (AGORA_SPECS, read from core/atlas/extracted.mjs,
 *     which is built from index.html — one authority), named atlas_<command>;
 *   · the hub on ws://127.0.0.1:<port> that joins every such agent to the atlas page. The first relay to start binds
 *     the port; every later one (a second agent, a second MCP host) joins the same hub as another agent.
 *
 * Usage
 *   claude mcp add hcc-agora -- node /path/to/HCC/scripts/hcc-agora.mjs --name Claude
 *   (or any MCP host: command "node", args [".../scripts/hcc-agora.mjs", "--name", "<agent>"])
 *   then open the atlas with ?agora=ws://127.0.0.1:8787 — or ◈ on the time machine → connect relay — and press Allow.
 *   node scripts/hcc-agora.mjs --hub-only        just the hub (agents connect with api/agora-client.mjs)
 *
 * Safety: the hub binds 127.0.0.1 only. The ATLAS role is accepted only from the atlas's own origins (the published
 * site, localhost, file://) or those given with --origin; an agent may not connect from a web page at all (browsers
 * send an Origin, agents do not), so a site the reader happens to visit cannot pose as either. Every agent still waits
 * for the reader's Allow in the page, and every command is a name with JSON arguments, checked against the vocabulary
 * here and again in the page. */
import http from 'node:http'; import crypto from 'node:crypto'; import path from 'node:path'; import { fileURLToPath } from 'node:url';
const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const argv = process.argv.slice(2), opt = k => { const i = argv.indexOf(k); return i >= 0 ? argv[i + 1] : null; }, has = k => argv.includes(k);
const PORT = +(opt('--port') || process.env.HCC_AGORA_PORT || 8787), HUB_ONLY = has('--hub-only');
const ORIGINS = ['https://4vmp5pkwz4-pixel.github.io', 'null', ...String(opt('--origin') || process.env.HCC_AGORA_ORIGINS || '').split(',').filter(Boolean)];
const log = (...a) => process.stderr.write('[hcc-agora] ' + a.join(' ') + '\n');
const K = await import(path.join(ROOT, 'core', 'atlas', 'extracted.mjs'));
const TOOLS = K.agoraTools(), SPECS = K.AGORA_SPECS;
const originOk = o => !o || ORIGINS.includes(o) || /^https?:\/\/(localhost|127\.0\.0\.1|\[::1\])(:\d+)?$/.test(o);

/* ── a minimal RFC 6455 endpoint (text frames, ping/pong, close), so the relay needs nothing installed ── */
const GUID = '258EAFA5-E914-47DA-95CA-C5AB0DC85B11', MAX = 32 * 1024 * 1024;
function frame(op, payload) { const p = Buffer.isBuffer(payload) ? payload : Buffer.from(String(payload)), n = p.length; let h;
  if (n < 126) h = Buffer.from([0x80 | op, n]); else if (n < 65536) { h = Buffer.alloc(4); h[0] = 0x80 | op; h[1] = 126; h.writeUInt16BE(n, 2); }
  else { h = Buffer.alloc(10); h[0] = 0x80 | op; h[1] = 127; h.writeBigUInt64BE(BigInt(n), 2); } return Buffer.concat([h, p]); }
class Peer {
  constructor(sock, origin) { this.s = sock; this.origin = origin; this.buf = Buffer.alloc(0); this.frag = []; this.dead = false; this.role = null;
    sock.on('data', d => this.data(d)); sock.on('close', () => this.end()); sock.on('error', () => this.end()); }
  data(d) { this.buf = Buffer.concat([this.buf, d]);
    for (;;) { if (this.buf.length < 2) return; const b0 = this.buf[0], b1 = this.buf[1], op = b0 & 15, fin = b0 & 128, masked = b1 & 128; let len = b1 & 127, off = 2;
      if (len === 126) { if (this.buf.length < 4) return; len = this.buf.readUInt16BE(2); off = 4; }
      else if (len === 127) { if (this.buf.length < 10) return; len = Number(this.buf.readBigUInt64BE(2)); off = 10; }
      if (len > MAX) { this.close(); return; } const mk = masked ? this.buf.subarray(off, off + 4) : null; if (masked) off += 4; if (this.buf.length < off + len) return;
      const p = Buffer.from(this.buf.subarray(off, off + len)); this.buf = this.buf.subarray(off + len); if (mk) for (let i = 0; i < p.length; i++) p[i] ^= mk[i & 3];
      if (op === 8) { this.close(); return; } if (op === 9) { this.raw(10, p); continue; } if (op === 10) continue;
      if (op === 1 || op === 0) { this.frag.push(p); if (fin) { const m = Buffer.concat(this.frag).toString('utf8'); this.frag = []; let j; try { j = JSON.parse(m); } catch (e) { continue; } this.onmessage?.(j); } } } }
  raw(op, p) { if (!this.dead) try { this.s.write(frame(op, p)); } catch (e) {} }
  send(o) { this.raw(1, JSON.stringify(o)); }
  close() { if (!this.dead) { this.raw(8, Buffer.alloc(0)); try { this.s.end(); } catch (e) {} } this.end(); }
  end() { if (this.dead) return; this.dead = true; this.onclose?.(); }
}

/* ── the hub ── */
function startHub() { return new Promise((resolve, reject) => {
  const hub = { atlas: null, agents: new Map(), pending: new Map(), n: 0 };
  const server = http.createServer((req, res) => { res.writeHead(200, { 'content-type': 'application/json', 'access-control-allow-origin': '*' });
    res.end(JSON.stringify({ schema: 'hcc.agora-hub/1', atlas: !!hub.atlas, agents: [...hub.agents.values()].map(a => a.name), tools: TOOLS.length })); });
  server.on('upgrade', (req, sock) => {
    const key = req.headers['sec-websocket-key'], origin = req.headers.origin || null;
    if (!key || (req.headers.upgrade || '').toLowerCase() !== 'websocket') { sock.destroy(); return; }
    sock.write('HTTP/1.1 101 Switching Protocols\r\nUpgrade: websocket\r\nConnection: Upgrade\r\nSec-WebSocket-Accept: ' + crypto.createHash('sha1').update(key + GUID).digest('base64') + '\r\n\r\n');
    const P = new Peer(sock, origin);
    P.onmessage = m => {
      if (!P.role) {
        if (m.t === 'atlas') { if (!originOk(origin)) { log('refused an atlas from origin', origin); P.close(); return; }
          if (hub.atlas) hub.atlas.close(); P.role = 'atlas'; hub.atlas = P; log('atlas joined', m.build || '', origin || '');
          for (const [aid, a] of hub.agents) { P.send({ t: 'join', aid, name: a.name }); a.P.send({ t: 'atlas', connected: true, build: m.build }); } return; }
        if (m.t === 'agent') { if (origin) { log('refused an agent from a web origin', origin); P.close(); return; }
          P.role = 'agent'; const aid = 'r' + (++hub.n); P.aid = aid; hub.agents.set(aid, { P, name: String(m.name || 'agent').slice(0, 40) });
          P.send({ t: 'hello', aid, atlas: !!hub.atlas, tools: TOOLS }); hub.atlas?.send({ t: 'join', aid, name: hub.agents.get(aid).name }); log('agent joined', aid, m.name || ''); return; }
        P.close(); return; }
      if (P.role === 'agent' && m.t === 'cmd') {
        if (!hub.atlas) { P.send({ t: 'res', id: m.id, ok: false, error: `no atlas is connected — open the atlas with ?agora=ws://127.0.0.1:${PORT} (or ◈ on its time machine → connect relay) and press Allow` }); return; }
        const gid = ++hub.n; hub.pending.set(gid, { aid: P.aid, id: m.id }); hub.atlas.send({ t: 'cmd', aid: P.aid, id: gid, cmd: m.cmd, args: m.args || {}, name: hub.agents.get(P.aid)?.name }); return; }
      if (P.role === 'atlas' && m.t === 'res') { const q = hub.pending.get(m.id); if (!q) return; hub.pending.delete(m.id); hub.agents.get(q.aid)?.P.send({ t: 'res', id: q.id, ok: m.ok, result: m.result, error: m.error }); return; }
      if (P.role === 'atlas' && m.t === 'kick') { const a = hub.agents.get(m.aid); if (a) { a.P.send({ t: 'kicked' }); a.P.close(); } return; }
    };
    P.onclose = () => {
      if (P.role === 'atlas' && hub.atlas === P) { hub.atlas = null; log('atlas left');
        for (const [gid, q] of hub.pending) { hub.agents.get(q.aid)?.P.send({ t: 'res', id: q.id, ok: false, error: 'the atlas closed before answering' }); hub.pending.delete(gid); }
        for (const a of hub.agents.values()) a.P.send({ t: 'atlas', connected: false }); }
      if (P.role === 'agent') { hub.agents.delete(P.aid); hub.atlas?.send({ t: 'leave', aid: P.aid }); log('agent left', P.aid); }
    };
  });
  server.once('error', reject);
  server.listen(PORT, '127.0.0.1', () => { log(`hub on ws://127.0.0.1:${PORT}`); resolve({ hub, server }); });
}); }

/* ── an agent's connection to the hub (Node's own WebSocket client) ── */
function connectAgent(name) { return new Promise((resolve, reject) => {
  if (typeof WebSocket === 'undefined') { reject(new Error('this Node has no WebSocket client (Node 22 or later is needed)')); return; }
  const ws = new WebSocket(`ws://127.0.0.1:${PORT}`), wait = new Map(); let n = 0, atlas = false;
  ws.onopen = () => ws.send(JSON.stringify({ t: 'agent', name }));
  ws.onmessage = e => { let m; try { m = JSON.parse(e.data); } catch (x) { return; }
    if (m.t === 'hello') { atlas = m.atlas; resolve(api); } else if (m.t === 'atlas') atlas = m.connected;
    else if (m.t === 'res') { const w = wait.get(m.id); if (w) { wait.delete(m.id); clearTimeout(w.to); m.ok ? w.ok(m.result) : w.no(new Error(m.error || 'failed')); } }
    else if (m.t === 'kicked') log('the reader dismissed this agent'); };
  ws.onerror = () => reject(new Error(`hub unreachable on ws://127.0.0.1:${PORT}`));
  ws.onclose = () => { for (const w of wait.values()) w.no(new Error('the hub closed')); wait.clear(); };
  const api = { get atlas() { return atlas; },
    do(cmd, args, timeoutS) { return new Promise((ok, no) => { const id = ++n; const to = setTimeout(() => { wait.delete(id); no(new Error(`no answer in ${timeoutS || 90} s (is the agent allowed in the atlas?)`)); }, 1000 * (timeoutS || 90));
      wait.set(id, { ok, no, to }); ws.send(JSON.stringify({ t: 'cmd', id, cmd, args: args || {} })); }); },
    close() { try { ws.close(); } catch (e) {} } };
}); }

/* ── the MCP server on stdio ── */
async function mcp() {
  let agent = null, name = opt('--name') || process.env.HCC_AGENT_NAME || null, ownHub = null;
  try { ownHub = await startHub(); } catch (e) { if (e.code !== 'EADDRINUSE') throw e; log(`a hub is already on port ${PORT}; joining it`); }
  const ensure = async () => { if (agent) return agent; agent = await connectAgent(name || 'MCP agent'); return agent; };
  const out = o => process.stdout.write(JSON.stringify(o) + '\n');
  const reply = (id, result) => out({ jsonrpc: '2.0', id, result }), fail = (id, code, message) => out({ jsonrpc: '2.0', id, error: { code, message } });
  let buf = '';
  process.stdin.setEncoding('utf8');
  process.stdin.on('data', async d => { buf += d; let i;
    while ((i = buf.indexOf('\n')) >= 0) { const line = buf.slice(0, i).trim(); buf = buf.slice(i + 1); if (!line) continue; let m; try { m = JSON.parse(line); } catch (e) { continue; }
      if (m.id === undefined) continue;                        /* notifications */
      try {
        if (m.method === 'initialize') { if (!name) name = m.params?.clientInfo?.name || 'MCP agent';
          reply(m.id, { protocolVersion: m.params?.protocolVersion || '2025-06-18', capabilities: { tools: { listChanged: false } }, serverInfo: { name: 'hcc-agora', version: '4.370.0' },
            instructions: 'Tools drive the open HCC atlas in front of its reader: see it with atlas_look and atlas_read, start with atlas_scene and atlas_worlds, find objects with atlas_find, open any window (atlas_panels, atlas_panel), operate any control (atlas_controls, atlas_press, atlas_input), lead the reader (atlas_point, atlas_guide, atlas_ask), speak with atlas_say, keep and share records in the journal (atlas_note, atlas_journal, atlas_visit), make checkable predictions with atlas_predict. The reader must open the atlas with ?agora=ws://127.0.0.1:' + PORT + ' and press Allow.' });
          ensure().catch(e => log(e.message)); }
        else if (m.method === 'ping') reply(m.id, {});
        else if (m.method === 'tools/list') reply(m.id, { tools: TOOLS });
        else if (m.method === 'tools/call') { const nm = String(m.params?.name || ''), cmd = nm.replace(/^atlas_/, ''), args = m.params?.arguments || {};
          if (!SPECS[cmd]) { reply(m.id, { isError: true, content: [{ type: 'text', text: 'unknown tool ' + nm }] }); continue; }
          try { K.agoraCheckArgs(cmd, args); const A = await ensure();
            const wait = cmd === 'tour' || cmd === 'guide' ? 900 : cmd === 'ask' ? Math.min(660, (Number(args.seconds) || 60) + 60) : cmd === 'predict' ? 300 : 90;
            const r = await A.do(cmd, args, wait), content = [];
            /* what the agent SEES comes back as an image, the rest as text */
            if (r && typeof r.image === 'string' && /^data:image\/(jpeg|png);base64,/.test(r.image)) { const [head, data] = r.image.split(','); content.push({ type: 'image', data, mimeType: head.slice(5, head.indexOf(';')) }); delete r.image; }
            content.push({ type: 'text', text: JSON.stringify(r, null, 1).slice(0, 400000) });
            reply(m.id, { content }); }
          catch (e) { reply(m.id, { isError: true, content: [{ type: 'text', text: String(e && e.message || e) }] }); } }
        else fail(m.id, -32601, 'method not found: ' + m.method);
      } catch (e) { fail(m.id, -32603, String(e && e.message || e)); } } });
  process.stdin.on('end', () => { agent?.close(); ownHub?.server.close(); process.exit(0); });
}

if (HUB_ONLY) await startHub(); else await mcp();
