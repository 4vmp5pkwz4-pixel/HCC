#!/usr/bin/env node
'use strict';
/* ══ THE AGORA — AGENTS ON THE STAGE (v4.369) ══════════════════════════════════════════════════════════════════════
 *   1. one vocabulary: the page's AGORA_SPECS is what the relay serves as MCP tools, what the client SDK names, and every
 *      command has a runner in the page — no command without a runner, no runner without a command
 *   2. arguments are checked before anything runs (types, enums, required, unknown keys); paths and dates read right
 *   3. the relay, run here for real: a hub, a stand-in atlas page and an MCP host on stdio — initialize, tools/list,
 *      tools/call routed through the hub to the atlas and back; a command with no atlas says how to connect one
 *   4. safety: the hub binds 127.0.0.1, refuses an atlas from a foreign web origin and an agent from any web page; a
 *      prediction's check may only read, never act; the page waits for the reader's Allow and yields the camera to a touch
 *   5. the stage: presences, beams, ripples, pins, rings, captions in the page and in the headset, the predictions that
 *      stop the clock at their epoch, the ◈ button on the time machine
 */
const fs = require('node:fs'), path = require('node:path'), cp = require('node:child_process'), http = require('node:http');
const ROOT = path.join(__dirname, '..'), SRC = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
let pass = 0, fail = 0;
const ok = (n, c, d) => { if (c) { pass++; console.log('  PASS — ' + n + (d ? ' :: ' + d : '')); } else { fail++; console.log('  FAIL — ' + n + (d ? ' :: ' + d : '')); } };
const sleep = ms => new Promise(r => setTimeout(r, ms));
(async () => {
  const K = await import(path.join(ROOT, 'core', 'atlas', 'extracted.mjs')), S = K.AGORA_SPECS, names = Object.keys(S);

  /* 1 */
  { const run = SRC.slice(SRC.indexOf('const AGORA_RUN={'), SRC.indexOf('/* the one gate every command passes */'));
    const runners = [...run.matchAll(/^\s{2}(\w+):(?:async)?(?:\(|[a-zA-Z]+=>)/gm)].map(m => m[1]);
    const cli = fs.readFileSync(path.join(ROOT, 'api', 'agora-client.mjs'), 'utf8'), cl = JSON.parse(cli.match(/const COMMANDS = (\[[^\]]+\])/)[1].replace(/'/g, '"'));
    const tools = K.agoraTools();
    ok('one vocabulary: every command has a runner in the page and every runner a command; the relay serves exactly these as MCP tools; the client SDK names exactly these',
      names.length >= 20 && runners.length === names.length && names.every(n => runners.includes(n)) && tools.length === names.length && tools.every(t => t.name === 'atlas_' + t.name.slice(6) && S[t.name.slice(6)] && t.inputSchema.type === 'object')
      && cl.length === names.length && names.every(n => cl.includes(n)), `${names.length} commands · ${runners.length} runners · ${tools.length} tools · ${cl.length} in the SDK`); }

  /* 2 */
  { const bad = [['go', { world: 5 }], ['layer', { layer: 'nowhere' }], ['find', {}], ['scene', { x: 1 }], ['nothing', {}]].map(([c, a]) => { try { K.agoraCheckArgs(c, a); return false; } catch (e) { return true; } });
    const good = (() => { try { K.agoraCheckArgs('predict', { claim: 'c', check: { cmd: 'measure' } }); K.agoraCheckArgs('layer', { layer: 'galactic' }); return true; } catch (e) { return false; } })();
    const e = K.agoraEpochOf({ date: '2027-01-03T00:00:00Z' }), y = K.agoraEpochOf({ date: '1000000' }), p = K.agoraPath({ a: { b: [1, { c: 7 }] } }, 'a.b.1.c'), num = K.agoraNum('−0.98330 AU');
    const j = K.agoraJson({ a: NaN, f: () => 1, n: [1, 2], d: { e: Infinity } });
    ok('arguments are checked before anything runs — a wrong type, a value outside an enum, a missing or unknown argument, an unknown command are refused; dates, deep years, paths and numbers read right; results are JSON (NaN and ∞ named, functions dropped)',
      bad.every(Boolean) && good && Math.abs(e - 9863.5) < 1e-9 && Math.abs(y - 998000 * 365.2425) < 1e-6 && p === 7 && num === -0.9833 && j.a === 'NaN' && !('f' in j) && j.d.e === 'Infinity',
      `epoch ${e} · path ${p} · number ${num}`); }

  /* 3 · the relay, for real */
  { const port = 18000 + (process.pid % 4000), relay = path.join(ROOT, 'scripts', 'hcc-agora.mjs'), out = [];
    const hub = cp.spawn(process.execPath, [relay, '--hub-only', '--port', String(port)], { stdio: ['ignore', 'ignore', 'pipe'] });
    let hubLog = ''; hub.stderr.on('data', d => hubLog += d);
    for (let i = 0; i < 50 && !/hub on/.test(hubLog); i++) await sleep(100);
    /* the stand-in atlas page: joins as the atlas and answers every command with what it was asked */
    const atlas = new WebSocket(`ws://127.0.0.1:${port}`); let joined = null;
    await new Promise(r => { atlas.onopen = () => { atlas.send(JSON.stringify({ t: 'atlas', build: 'verify' })); r(); }; });
    atlas.onmessage = e => { const m = JSON.parse(e.data); if (m.t === 'join') joined = m.name; if (m.t === 'cmd') atlas.send(JSON.stringify({ t: 'res', id: m.id, ok: true, result: m.cmd === 'look' ? { image: 'data:image/jpeg;base64,/9j/AAAA', width: 4, height: 3 } : { echo: m.cmd, args: m.args, from: m.name } })); };
    /* an MCP host on stdio */
    const mcp = cp.spawn(process.execPath, [relay, '--port', String(port), '--name', 'Verifier'], { stdio: ['pipe', 'pipe', 'pipe'] });
    let buf = ''; const got = new Map(); mcp.stdout.on('data', d => { buf += d; let i; while ((i = buf.indexOf('\n')) >= 0) { const l = buf.slice(0, i); buf = buf.slice(i + 1); try { const m = JSON.parse(l); got.set(m.id, m); } catch (e) {} } });
    const call = async (id, method, params) => { mcp.stdin.write(JSON.stringify({ jsonrpc: '2.0', id, method, params }) + '\n'); for (let i = 0; i < 100 && !got.has(id); i++) await sleep(50); return got.get(id); };
    const init = await call(1, 'initialize', { protocolVersion: '2025-06-18', capabilities: {}, clientInfo: { name: 'verify-host', version: '1' } });
    mcp.stdin.write(JSON.stringify({ jsonrpc: '2.0', method: 'notifications/initialized' }) + '\n');
    const list = await call(2, 'tools/list', {}), go = await call(3, 'tools/call', { name: 'atlas_go', arguments: { world: 'solar' } }), badc = await call(4, 'tools/call', { name: 'atlas_layer', arguments: { layer: 'nowhere' } });
    const echo = go && JSON.parse(go.result.content[0].text), look = await call(6, 'tools/call', { name: 'atlas_look', arguments: { width: 320 } });
    /* and with the atlas gone, the agent is told how to connect one */
    atlas.close(); await sleep(300); const none = await call(5, 'tools/call', { name: 'atlas_scene', arguments: {} });
    /* a web page posing as an agent, and an atlas from a foreign origin, are refused */
    const refused = await new Promise(r => { const req = http.request({ host: '127.0.0.1', port, headers: { Connection: 'Upgrade', Upgrade: 'websocket', 'Sec-WebSocket-Key': 'dGhlIHNhbXBsZSBub25jZQ==', 'Sec-WebSocket-Version': '13', Origin: 'https://evil.example' } });
      req.on('upgrade', (res, sock) => { const f = JSON.stringify({ t: 'atlas' }), m = Buffer.from([1, 2, 3, 4]), p = Buffer.from(f); for (let i = 0; i < p.length; i++) p[i] ^= m[i & 3];
        sock.write(Buffer.concat([Buffer.from([0x81, 0x80 | p.length]), m, p])); let closed = false; sock.on('data', d => { if (d[0] === 0x88) closed = true; }); sock.on('close', () => r(true)); setTimeout(() => r(closed), 1500); });
      req.on('error', () => r(false)); req.end(); });
    const status = await new Promise(r => http.get(`http://127.0.0.1:${port}/`, res => { let b = ''; res.on('data', d => b += d); res.on('end', () => r(JSON.parse(b))); }).on('error', () => r(null)));
    mcp.stdin.end(); hub.kill(); await sleep(200);
    ok('the relay, run here: MCP initialize and tools/list answer with the vocabulary, a tool call goes through the hub to the atlas and its answer comes back, under the agent\'s own name; what the agent sees (look) arrives as an MCP image; a bad argument is refused before it leaves; with no atlas the agent is told how to connect one',
      init && init.result && init.result.serverInfo.name === 'hcc-agora' && list && list.result.tools.length === names.length && echo && echo.echo === 'go' && echo.args.world === 'solar' && echo.from === 'Verifier' && joined === 'Verifier'
      && look && look.result.content[0].type === 'image' && look.result.content[0].mimeType === 'image/jpeg' && look.result.content[0].data === '/9j/AAAA' && JSON.parse(look.result.content[1].text).width === 4
      && badc && badc.result.isError && /layer must be one of/.test(badc.result.content[0].text) && none && none.result.isError && /no atlas is connected/.test(none.result.content[0].text),
      `${list && list.result.tools.length} tools · echo ${echo && echo.echo} from ${echo && echo.from} · no-atlas: "${none && none.result.content[0].text.slice(0, 60)}…"`);
    ok('safety at the hub: it binds 127.0.0.1, and an atlas offered from a foreign web origin is closed on arrival',
      /listen\(PORT, '127\.0\.0\.1'/.test(fs.readFileSync(relay, 'utf8')) && refused === true && status && status.schema === 'hcc.agora-hub/1', `foreign atlas refused: ${refused}`); }

  /* 4 */
  ok('safety in the page: a check may only read, never act; an agent from a tab or the relay waits for the reader\'s Allow; touching the view takes the camera back for eight seconds; the reader can pause or dismiss any agent',
    /a check must read, not act/.test(SRC) && /status:via==='page'\?'live':'pending'/.test(SRC) && /AGORA\.takeoverUntil=performance\.now\(\)\+8000/.test(SRC) && /the reader is steering/.test(SRC)
    && /if\(AGORA\.paused\) throw new Error\('the reader has paused every agent'\)/.test(SRC) && /data-ag="kick"/.test(SRC));

  /* 6 · hands, eyes, voice and memory (v4.370) */
  { const reads = SRC.match(/const AGORA_READS=(\[[^\]]+\]);/), R = reads ? JSON.parse(reads[1].replace(/'/g, '"')) : [];
    const acting = ['go','layer','focus','camera','time','say','mark','predict','highlight','clear','tour','panel','press','input','point','guide','ask','note','visit','phase','look'];
    ok('hands, eyes, voice and memory: look renders a fresh frame, read returns every open window, panels/panel/controls/press/input reach any window and control (each glows first) except the Agora\'s own consent controls; point, guide and ask lead the reader; the journal keeps each record\'s place, persists, syncs across tabs and travels as a file; a prediction\'s check may call only reading commands',
      R.length >= 10 && R.every(c => S[c]) && !R.some(c => acting.includes(c))
      && /!!e\.closest\('#agoraPanel,#agoraAsk,\[data-agora-guard\]'\)/.test(SRC) && /agoraCallout\(A,e,'',1\.4\); await new Promise\(r=>setTimeout\(r,650\)\); e\.click\(\);/.test(SRC)
      && /renderer\.render\(scene,camera\);\s*const h=Math\.round/.test(SRC) && /function agoraAskCard\(A,q,options,seconds\)\{/.test(SRC) && /else if\(m\.t==='journal'&&m\.entry\) agoraJournalMerge\(\[m\.entry\]\);/.test(SRC)
      && /const AGORA_JOURNAL_KEY='hcc\.agora\.journal';/.test(SRC) && /function agoraJournalExport\(\)\{/.test(SRC) && /async function agoraVisit\(E\)\{/.test(SRC),
      `${R.length} reading commands a check may call: ${R.join(', ')}`); }

  /* 5 */
  ok('the stage: a presence per agent (glow, rings, motes, name), beams and ripples to what it touches, pins and rings that follow objects, captions in the page and on a plane in the headset, predictions that stop the clock at their epoch and run their check, the ◈ button on the time machine',
    /function agoraPresence\(A\)\{/.test(SRC) && /function agoraPulse\(A,p\)\{/.test(SRC) && /function agoraPin\(A,p,text,key,kind\)\{/.test(SRC) && /function agoraXrCaption\(A,text\)\{/.test(SRC) && /camera\.add\(m\); AGORA\.xr=m;/.test(SRC)
    && /HCC_TIME_FABRIC\.setPaused\(true,'agora\.prediction'\); HCC_TIME_FABRIC\.setEpochDays\(P\.epoch,'agora\.prediction'\);/.test(SRC) && /id="tmAgora"/.test(SRC) && /try\{ agoraTick\(dt\); \}/.test(SRC)
    && /globalThis\.HCC_AGORA=Object\.freeze\(\{schema:'hcc\.agora\/1'/.test(SRC));

  console.log('\n  ' + pass + ' passed, ' + fail + ' failed'); process.exit(fail ? 1 : 0);
})();
