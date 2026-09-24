#!/usr/bin/env node
'use strict';
/* ══ THE MEASURED UNIVERSE ON THE φ-LADDER ══════════════════════════════════════
 * The golden ladder N = ln(d / l_P) / ln φ was tested on 113 literature scales and found
 * to be a coordinate, not a law. This extends the test to every distance this atlas has
 * MEASURED — Hipparcos stars, clusters and nebulae, galaxies, quasars — decoded here from
 * index.html, and COMPUTES:
 *   1. the census of the rungs: which rungs the measured universe occupies
 *   2. why a naive Rayleigh test is the wrong question for tens of thousands of values:
 *      it calls φ "significant" (p << 0.01) — and √e and 2 as well,
 *      because the smooth run of numbers with distance leaks into every period
 *   3. the question asked the way a spectrum is read: R at ln φ ranked among 421
 *      periods from 0.30 to 0.72 — φ does not stand out, in any class
 *   4. the atlas reports the rank, not the naive p, as its verdict
 *   5. the periodogram is what exposed the catalogue's placeholder shell: put back, the
 *      49 489 fill-value galaxies at 36 +- 4 Mpc drive R towards 1 at EVERY period
 *   6. MUTATIONS: a verdict read from the naive p, and a missing rung census, are caught
 */
const fs = require('node:fs'), path = require('node:path');
const SRC = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
let pass = 0, fail = 0;
const ok = (n, c, d) => { if (c) { pass++; console.log('  PASS — ' + n + (d ? ' :: ' + d : '')); } else { fail++; console.log('  FAIL — ' + n + (d ? ' :: ' + d : '')); } };
const PC = 3.0856775814913673e16, LP = 1.616255e-35, PHI = (1 + Math.sqrt(5)) / 2, LN_PHI = Math.log(PHI);
const comoving = z => { const n = 200, h = z / n; let s = 0; for (let i = 0; i <= n; i++) { const w = (i === 0 || i === n) ? 1 : (i % 2 ? 4 : 2); s += w / Math.sqrt(0.315 * (1 + i * h) ** 3 + 0.685); } return 299792.458 / 67.4 * h / 3 * s; };

/* the four classes, decoded the way the atlas decodes them */
const hip = (() => { const J = SRC.match(/const HCC_SKY_HIP=(\{[^\n]*\});/); const H = J ? eval('(' + J[1] + ')') : null; if (!H) return [];
  const b = Buffer.from(H.b64, 'base64'), out = [];
  for (let i = 0; i < H.count; i++) { const o = i * H.rec, plx = b.readUInt32LE(o + 16) / 100, e = b.readUInt16LE(o + 20) / 1000;
    if (plx > 0 && e > 0 && plx / e >= 5) out.push(Math.log(1000 / plx * PC)); } return out; })();
const gal = (() => { const m = SRC.match(/const DSO3D_GAL=\{count:(\d+),sha256:'[0-9a-f]+',b64:'([A-Za-z0-9+/=]+)'\};/); const b = Buffer.from(m[2], 'base64'), out = [];
  for (let i = 0; i < +m[1]; i++) out.push(Math.log(Math.pow(10, b.readUInt16LE(i * 8 + 4) / 8000 - 2) * 1000 * PC)); return out; })();
const loc = JSON.parse(SRC.match(/const DSO3D_LOCAL=(\[.*?\]);\n/)[1]).map(r => Math.log(r[4] * 1000 * PC));
const qso = eval('(' + SRC.match(/const QSO3D=(\{count:\d+,[^\n]*\});\n/)[1] + ')').rows.map(r => Math.log(comoving(r[3]) * 1e6 * PC));
const CL = { stars: hip, clusters: loc, galaxies: gal, quasars: qso }, ALL = [].concat(hip, loc, gal, qso);
const N = x => (x - Math.log(LP)) / LN_PHI;
const lo = Math.floor(Math.min(...ALL.map(N))), hi = Math.floor(Math.max(...ALL.map(N)));
ok('the census of the rungs: every measured distance of the atlas placed on the ladder',
  hip.length > 10000 && gal.length > 4000 && qso.length > 5000 && loc.length > 600 && lo >= 240 && hi <= 295,
  `${ALL.length.toLocaleString('en-US')} distances — ${hip.length} stars, ${loc.length} clusters & nebulae, ${gal.length} galaxies, ${qso.length} quasars — on rungs ${lo} to ${hi}`);

const Rat = (xs, P) => { let C = 0, S = 0; for (const x of xs) { const a = 2 * Math.PI * x / P; C += Math.cos(a); S += Math.sin(a); } return Math.hypot(C, S) / xs.length; };
const pg = xs => { const out = []; for (let k = 0; k < 421; k++) out.push(Rat(xs, 0.30 + 0.42 * k / 420)); return out; };
const BASES = { 'φ': LN_PHI, '3/2': Math.log(1.5), '√e': 0.5, '2': Math.log(2) };
const test = xs => { const P = pg(xs), r = {}; for (const [k, p] of Object.entries(BASES)) { const R = Rat(xs, p); r[k] = { R, naive: Math.exp(-xs.length * R * R), rank: P.filter(x => x >= R).length / P.length }; } return r; };
const T = test(ALL);
ok('a naive Rayleigh test on tens of thousands of distances calls φ — and most other bases — "significant": the wrong question',
  Object.values(T).filter(b => b.naive < 0.01).length >= 2 && T['φ'].naive < 0.01,
  Object.entries(T).map(([k, b]) => `${k}: naive p ${b.naive.toExponential(1)}`).join(' · '));
const perClass = Object.fromEntries(Object.entries(CL).map(([k, xs]) => [k, test(xs)['φ']]));
ok('asked the way a spectrum is read — R at ln φ ranked among 421 periods — φ does not stand out, overall or in any class',
  T['φ'].rank > 0.05 && Object.values(perClass).every(b => b.rank > 0.05),
  `all: rank p ${T['φ'].rank.toFixed(3)} · ` + Object.entries(perClass).map(([k, b]) => `${k} ${b.rank.toFixed(3)}`).join(' · '));

const verdict = s => /\$\{T\.rank<0\.01\?TT\('φ stands out among the periods/.test(s) && /function phiLadderTest\(which\)\{/.test(s)
  && /const PHI_MEASURED_P=\[0\.30,0\.72,421\];/.test(s);
ok('the atlas gives its verdict from the rank among periods, not from the naive p, and shows both', verdict(SRC) && /naive Rayleigh p/.test(SRC));

/* the placeholder shell, put back */
let seed = 7; const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
const shell = []; for (let i = 0; i < 49489; i++) shell.push(Math.log((32 + 8 * rnd()) * 1e6 * PC));
const Rs = [0.35, LN_PHI, 0.6, 0.7].map(P => Rat(gal.concat(shell), P));
ok('the periodogram is what exposed the catalogue\'s fill value: 49 489 galaxies at 36 ± 4 Mpc drive R high at EVERY period',
  Rs.every(R => R > 0.3), Rs.map(R => R.toFixed(2)).join(' · ') + ` (real galaxies alone: R(ln φ) = ${Rat(gal, LN_PHI).toFixed(3)})`);

ok('MUTATION — a verdict read from the naive p is caught', !verdict(SRC.replace('${T.rank<0.01?TT(\'φ stands out among the periods', '${T.naiveP<0.01?TT(\'φ stands out among the periods')));
ok('MUTATION — a census without the rung counts is caught', !/function phiRungCensus\(\)\{/.test(SRC.replace('function phiRungCensus(){', 'function phiRungCensusX(){')) && /function phiRungCensus\(\)\{/.test(SRC));

console.log('\n  ' + pass + ' passed, ' + fail + ' failed'); process.exit(fail ? 1 : 0);
