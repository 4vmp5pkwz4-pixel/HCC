#!/usr/bin/env node
// Replay a reproducibility track outside any browser.
//   node api/track-replay.mjs '<https://…/index.html#track=…>'      a shared link
//   node api/track-replay.mjs --discovery ghostSky                  a ledger entry's canonical track
//   node api/track-replay.mjs --list                                 the tracked discoveries and the operations
// The calls run on core/atlas/extracted.mjs — the physics sliced byte for byte out of index.html — so a track that
// passes here and in the atlas has been re-derived twice, by two different hosts, from the same source.
// Screen steps (nav, state, camera) need a screen and are reported, not run. Exit code 0 iff every expectation
// holds (and, for a sealed link, the fingerprint matches).
import { fileURLToPath } from 'node:url';
import path from 'node:path';
const here = path.dirname(fileURLToPath(import.meta.url));
const K = await import(path.join(here, '..', 'core', 'atlas', 'extracted.mjs'));
const arg = process.argv[2] || '';
if (!arg || arg === '--help') { console.log('usage: node api/track-replay.mjs <link> | --discovery <id> | --list'); process.exit(2); }
if (arg === '--list') {
  console.log('tracked discoveries:', Object.keys(K.DISCOVERY_TRACKS).join(', '));
  for (const [k, v] of Object.entries(K.TRACK_OPS)) console.log(`  ${k.padEnd(16)} ${v.doc}`);
  process.exit(0);
}
let t;
try { t = arg === '--discovery' ? K.discoveryTrack(process.argv[3]) : K.trackDecode(arg); } catch (e) { console.error('not a track:', e.message); process.exit(2); }
if (!t) { console.error('no track for', process.argv[3]); process.exit(2); }
const r = K.trackRun(t);
console.log(`${t.title || t.id} · recorded on v${t.atlas?.version ?? '?'} · core ${K.HCC_VERSION ?? ''}`.trim());
for (const s of r.steps) {
  if (s.screen) { console.log(`  · ${s.op} (needs a screen — replayed in the atlas)`); continue; }
  console.log(`  ${s.ok ? '✓' : '✗'} ${s.fn}${s.err ? ' — ' + s.err : ''}`);
  for (const c of s.checks || []) console.log(`      ${c.pass ? '✓' : '✗'} ${c.key} = ${K.trackCanon(c.got)} (expected ${K.trackCanon(c.want)}${c.tol ? ' ± ' + c.tol : ''})`);
}
console.log(`fingerprint ${r.fingerprint}${r.fingerprintMatch === true ? ' = the link\'s' : r.fingerprintMatch === false ? ' ≠ the link\'s ' + t.fingerprint : ''}`);
process.exit(r.ok && r.fingerprintMatch !== false ? 0 : 1);
