#!/usr/bin/env node
'use strict';
/* ══ REPRODUCIBILITY TRACKS ════════════════════════════════════════════════════════════════
 * A discovery as a link anyone can replay: in the atlas, and outside it on the extracted core. Checked:
 *   1. a track survives a link: encode → decode is the identity, the link is base64url, a foreign document is refused
 *   2. a link is data, never code: an unknown operation, or one reached through the prototype, is refused and
 *      reported; arguments are JSON and are passed, never evaluated
 *   3. every tracked discovery re-derives on the core: every expectation holds, the fingerprint is the same on a
 *      second run, and a sealed link's fingerprint matches
 *   4. the command-line replayer agrees: a sealed link exits 0 and names the same fingerprint, a tampered one exits 1
 *   5. the two hosts read the same ladder: the core's scales go through the reconciliation the page performs
 *      (Laniakea is the catalogue's diameter, not the typed radius), and the extractor now carries ...spreads
 *   6. the types do not drift: api/tracks.d.mts names exactly the operations TRACK_OPS offers; the page wiring
 */
const fs = require('node:fs'), path = require('node:path'), { spawnSync } = require('node:child_process');
const ROOT = path.join(__dirname, '..'), SRC = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
let pass = 0, fail = 0;
const ok = (n, c, d) => { if (c) { pass++; console.log('  PASS — ' + n + (d ? ' :: ' + d : '')); } else { fail++; console.log('  FAIL — ' + n + (d ? ' :: ' + d : '')); } };
(async () => {
  const K = await import(path.join(ROOT, 'core', 'atlas', 'extracted.mjs'));
  const { trackEncode, trackDecode, trackRun, trackFingerprint, discoveryTrack, DISCOVERY_TRACKS, TRACK_OPS, DISCOVERIES, hypScales, COSMOS } = K;
  { const t = { schema: 'hcc.track/1', id: 'τ-test', title: 'Ω · Млечный Путь · ∮', steps: [{ op: 'call', fn: 'lss.dinf' }] }, e = trackEncode(t), back = trackDecode('https://x/#track=' + e);
    let foreign = false; try { trackDecode(trackEncode({ schema: 'something/else', steps: [] })); } catch (err) { foreign = true; }
    ok('a track survives a link: encode → decode is the identity, the link is base64url, a foreign document is refused', JSON.stringify(back) === JSON.stringify(t) && /^[A-Za-z0-9_-]+$/.test(e) && foreign, `${e.length} characters`); }
  { const r = trackRun({ schema: 'hcc.track/1', steps: [{ op: 'call', fn: 'no.such' }, { op: 'call', fn: '__proto__' }, { op: 'call', fn: 'constructor' }, { op: 'call', fn: 'hyp.ratio', args: { a: 'process.exit(1)', b: '1' } }] });
    ok('a link is data, never code: unknown and prototype-reached operations are refused, arguments are passed and never evaluated',
      !r.ok && r.steps[0].ok === false && r.steps[1].ok === false && r.steps[2].ok === false && /unknown operation/.test(r.steps[0].err) && r.steps[3].got && r.steps[3].got.error && Object.isFrozen(TRACK_OPS), `refused: ${r.steps.slice(0, 3).map(s => s.fn).join(', ')} · the string argument came back as "${r.steps[3].got.error}"`); }
  { const ids = Object.keys(DISCOVERY_TRACKS), bad = []; let det = true, sealed = true;
    for (const id of ids) { if (!DISCOVERIES.some(d => d.id === id)) bad.push(id + ' (no such discovery)'); const t = discoveryTrack(id), a = trackRun(t), b = trackRun(t);
      if (!a.ok) bad.push(id + ': ' + a.steps.filter(s => s.ok === false).map(s => s.fn + ' ' + (s.err || (s.checks || []).filter(c => !c.pass).map(c => `${c.key}=${JSON.stringify(c.got)}`).join(' '))).join('; '));
      if (a.fingerprint !== b.fingerprint) det = false; const s = trackRun({ ...t, fingerprint: a.fingerprint }); if (s.fingerprintMatch !== true) sealed = false; }
    ok('every tracked discovery re-derives on the core, with the same fingerprint twice and a matching sealed link', ids.length >= 13 && !bad.length && det && sealed, `${ids.length} discoveries · ${bad.length ? bad.join(' | ') : 'all expectations hold'}`); }
  { const t = discoveryTrack('ghostSky'), fp = trackRun(t).fingerprint, link = 'https://atlas/#track=' + trackEncode({ ...t, fingerprint: fp });
    const good = spawnSync(process.execPath, [path.join(ROOT, 'api', 'track-replay.mjs'), link], { encoding: 'utf8' });
    const bent = JSON.parse(JSON.stringify(t)); bent.steps.find(s => s.fn === 'ghost.rmax').expect.RmaxGly.value = 70; const tl = 'https://atlas/#track=' + trackEncode(bent);
    const badRun = spawnSync(process.execPath, [path.join(ROOT, 'api', 'track-replay.mjs'), tl], { encoding: 'utf8' });
    ok('the command-line replayer agrees: a sealed link exits 0 with the same fingerprint, a tampered expectation exits 1', good.status === 0 && good.stdout.includes(`fingerprint ${fp} = the link's`) && badRun.status === 1 && /✗ RmaxGly/.test(badRun.stdout), `exit ${good.status} / ${badRun.status} · ${fp}`); }
  { const lan = hypScales().find(x => /^Laniakea/.test(x.name)), cat = COSMOS.find(c => c.key === 'laniakea'), gly = K.HCC_SI.Gly.f;
    ok('the two hosts read the same ladder: the core goes through the reconciliation (Laniakea is the catalogue\'s diameter), and the extractor carries ...spreads (the catalogue holds its galaxies)',
      Math.abs(lan.L / (cat.size * gly) - 1) < 1e-12 && COSMOS.some(c => c.key === 'm31') && /function phiAtlasRows\(\)\{ void HCC_SCALE_RECONCILIATION; return PHI_ATLAS; \}/.test(SRC), `Laniakea ${lan.L.toExponential(4)} m = ${cat.size} Gly · ${COSMOS.length} catalogue entries`); }
  { const dts = fs.readFileSync(path.join(ROOT, 'api', 'tracks.d.mts'), 'utf8'), m = /export type TrackOpName =([\s\S]*?);/.exec(dts), named = new Set((m ? m[1] : '').match(/'[^']+'/g).map(x => x.slice(1, -1))), ops = new Set(Object.keys(TRACK_OPS));
    const same = named.size === ops.size && [...ops].every(o => named.has(o));
    ok('the types do not drift from the operations, and the page is wired: ledger buttons, links at load, the palette, HCC_TRACKS',
      same && /data-trackreplay="\$\{sel\.id\}"/.test(SRC) && /const TRACK_BOOT_HASH=/.test(SRC) && /Record a reproducibility track of this view/.test(SRC) && /globalThis\.HCC_TRACKS=Object\.freeze\(\{schema:TRACK_SCHEMA/.test(SRC),
      same ? `${ops.size} operations in both` : `types ${[...named].join(',')} vs ops ${[...ops].join(',')}`); }
  console.log('\n  ' + pass + ' passed, ' + fail + ' failed'); process.exit(fail ? 1 : 0);
})();
