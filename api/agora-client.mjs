/** The Agora client (v4.369): an agent on the atlas's stage, in front of its reader.
 *
 *   import { joinAgora } from './api/agora-client.mjs';
 *   const agent = await joinAgora({ name: 'Ptolemy' });            // Node ≥ 22 or a browser
 *   await agent.say({ text: 'Watch Mars.' });
 *   const mars = (await agent.find({ q: 'Mars' }))[0];
 *   await agent.focus({ key: mars.key });
 *   await agent.predict({ claim: 'Mars at 1.38 AU from the Sun', date: '2027-03-01', key: mars.key,
 *                         check: { cmd: 'measure', args: { key: mars.key }, path: 'distSun', expect: 1.38, tol: 0.01 } });
 *
 * Transports
 *   'relay' (default): the hub of scripts/hcc-agora.mjs on ws://127.0.0.1:8787 (start one with --hub-only); the atlas
 *                      page joins it with ?agora=ws://127.0.0.1:8787 and its reader allows the agent.
 *   'tab':             a BroadcastChannel to an atlas open in another tab of the same site (browser only).
 * Every method is a command of the Agora vocabulary (HCC_AGORA.specs() in the page, AGORA_SPECS in
 * core/atlas/extracted.mjs); arguments are JSON, results are JSON. Nothing sent is code. */
export async function joinAgora({ name = 'agent', transport = 'relay', url = 'ws://127.0.0.1:8787', timeout = 90 } = {}) {
  let send, close; const wait = new Map(); let n = 0;
  const settle = m => { const w = wait.get(m.id); if (!w) return; wait.delete(m.id); clearTimeout(w.to); m.ok ? w.ok(m.result) : w.no(new Error(m.error || 'failed')); };
  if (transport === 'tab') {
    if (typeof BroadcastChannel === 'undefined') throw new Error('BroadcastChannel is unavailable here');
    const bc = new BroadcastChannel('hcc-agora'), aid = 'tab-' + Math.random().toString(36).slice(2);
    await new Promise((ok, no) => { const to = setTimeout(() => no(new Error('no atlas answered in another tab of this site')), 8000);
      bc.onmessage = e => { const m = e.data || {}; if (m.aid !== aid) return; if (m.t === 'welcome') { clearTimeout(to); ok(); } else if (m.t === 'res') settle(m); };
      bc.postMessage({ t: 'hello', aid, name }); });
    send = (id, cmd, args) => bc.postMessage({ t: 'cmd', aid, id, cmd, args });
    close = () => { bc.postMessage({ t: 'bye', aid }); bc.close(); };
  } else {
    if (typeof WebSocket === 'undefined') throw new Error('no WebSocket client here (Node 22 or later, or a browser)');
    const ws = new WebSocket(url);
    await new Promise((ok, no) => { ws.onerror = () => no(new Error('the Agora hub is unreachable at ' + url + ' — node scripts/hcc-agora.mjs --hub-only'));
      ws.onopen = () => ws.send(JSON.stringify({ t: 'agent', name }));
      ws.onmessage = e => { let m; try { m = JSON.parse(e.data); } catch (x) { return; } if (m.t === 'hello') ok(); else if (m.t === 'res') settle(m); }; });
    ws.onclose = () => { for (const w of wait.values()) w.no(new Error('the hub closed')); wait.clear(); };
    send = (id, cmd, args) => ws.send(JSON.stringify({ t: 'cmd', id, cmd, args }));
    close = () => ws.close();
  }
  const run = (cmd, args = {}) => new Promise((ok, no) => { const id = ++n;
    const to = setTimeout(() => { wait.delete(id); no(new Error(`no answer in time — has the reader allowed this agent?`)); }, 1000 * (cmd === 'tour' || cmd === 'guide' ? Math.max(timeout, 900) : cmd === 'ask' ? Math.max(timeout, (Number(args.seconds) || 60) + 60) : timeout));
    wait.set(id, { ok, no, to }); send(id, cmd, args); });
  const COMMANDS = ['scene', 'find', 'worlds', 'go', 'layer', 'focus', 'camera', 'time', 'instruments', 'describe', 'run', 'kernels', 'kernel', 'bus', 'measure', 'phase', 'oracle', 'say', 'mark', 'predict', 'highlight', 'clear', 'tour', 'look', 'read', 'panels', 'panel', 'press', 'input', 'controls', 'point', 'guide', 'ask', 'note', 'journal', 'visit'];
  return Object.freeze({ name, do: run, close, ...Object.fromEntries(COMMANDS.map(c => [c, args => run(c, args)])) });
}
