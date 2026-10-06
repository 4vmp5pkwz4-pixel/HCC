#!/usr/bin/env node
'use strict';
/* ══ THE REAL SKY: PLANCK 2018 AND EVERY CONFIRMED EXOPLANET (v4.363) ═════════════════════════════════════════════
 *   1. the measured CMB map is embedded with provenance (Planck PR3 SMICA, SHA-256), in the atlas's image layout, and its
 *      images hash to what the build recorded
 *   2. measured on it, as the ledger states: spectrum ratio to the atlas's CAMB within 3 % for 30 ≤ ℓ ≤ 999, the Cold
 *      Spot within 2° of its published place (l ≈ 209°, b ≈ −57°), the ℓ = 2, 3 axes within 15° of each other, D₂ low
 *   3. the wall and the backdrop read the map by GALACTIC direction (not the sphere's ecliptic UVs), the source can be
 *      switched, the found anomalies are labelled
 *   4. exoplanets: the NASA archive table is embedded with provenance and validation counts; planets and hosts decode
 *   5. the radius-valley estimator finds a known valley (track op) and, on the embedded transiting planets, the valley
 *      the ledger states
 */
const fs = require('node:fs'), path = require('node:path'), crypto = require('node:crypto');
const SRC = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
let pass = 0, fail = 0;
const ok = (n, c, d) => { if (c) { pass++; console.log('  PASS — ' + n + (d ? ' :: ' + d : '')); } else { fail++; console.log('  FAIL — ' + n + (d ? ' :: ' + d : '')); } };
const blob = id => { const i = SRC.indexOf(`id="${id}"`), j = SRC.indexOf('>', i), k = SRC.indexOf('</script>', j); return JSON.parse(SRC.slice(j + 1, k)); };
(async () => {
  const K = await import(path.join(__dirname, '..', 'core', 'atlas', 'extracted.mjs'));
  const M = JSON.parse(SRC.match(/const PLANCK_SKY_META=Object\.freeze\((.*)\);/)[1]), P = blob('hcc-planck-sky');
  const h = b => crypto.createHash('sha256').update(Buffer.from(b, 'base64')).digest('hex');
  ok('the measured CMB map is embedded with provenance, in the atlas’s layout, its images hashing to the build’s record', /Planck 2018 PR3 SMICA/.test(M.source) && /^[0-9a-f]{64}$/.test(M.sha256) && M.nside === 2048 && M.frame === 'Galactic' && M.width === 2048 && M.height === 1024 && h(P.t) === M.jpegSha256 && h(P.p) === M.polJpegSha256 && P.dl.length === 1501,
    `sha256 ${M.sha256.slice(0, 12)}… · f_sky ${M.fsky}`);
  { const d = (l1, b1, l2, b2) => { const D = Math.PI / 180; return Math.acos(Math.min(1, Math.sin(b1 * D) * Math.sin(b2 * D) + Math.cos(b1 * D) * Math.cos(b2 * D) * Math.cos((l1 - l2) * D))) / D; };
    const cs = d(M.coldSpot.l, M.coldSpot.b, 209, -57);
    ok('measured on it: spectrum within 3 % of the atlas’s CAMB (30–999), the Cold Spot where it is published, ℓ = 2, 3 axes aligned, D₂ low', Math.abs(M.bandRatio30to999 - 1) < 0.03 && cs < 2 && M.coldSpot.muK < -100 && M.axisSeparationDeg < 15 && M.D2muK2 < 500
      && /numbers:\{ratio30to999:1\.019, coldL:208\.43, coldB:-56\.26, coldMuK:-126\.6, axisSep:7\.7, d2:198\.2/.test(SRC), `ratio ${M.bandRatio30to999} · Cold Spot ${cs.toFixed(2)}° from (209, −57) · axes ${M.axisSeparationDeg}° · D₂ ${M.D2muK2} μK²`); }
  ok('the wall and the backdrop read by galactic direction; the source can be switched; the anomalies are labelled', /vec2 galUv\(\)\{ vec3 d=normalize\(vD\);/.test(SRC) && /vec2 vUv=galUv\(\); vec3 col;/.test(SRC) && /function cmbSkySourceId\(\)\{/.test(SRC) && /data-cmbsrc="\$\{k\}"/.test(SRC) && /Cold Spot — found in the Planck map/.test(SRC));
  const E = JSON.parse(SRC.match(/const EXO_META=Object\.freeze\((.*)\);/)[1]), X = blob('hcc-exoplanets');
  const f32 = b => { const B = Buffer.from(b, 'base64'); return new Float32Array(B.buffer.slice(B.byteOffset, B.byteOffset + B.byteLength)); }, p = f32(X.p), hh = f32(X.h);
  ok('exoplanets: the NASA archive table embedded with provenance and its validation counts; planets and hosts decode', /pscomppars/.test(E.source) && /^[0-9a-f]{64}$/.test(E.sha256) && E.planets === 6375 && E.hosts === 4780 && p.length === 7 * E.planets && hh.length === 7 * E.hosts && X.pn.length === E.planets && X.hn.length === E.hosts && E.hostsWithoutDistance === 28,
    `${E.planets} planets · ${E.hosts} hosts · ${E.hostsWithoutDistance} without distance · ${E.hostsWhosePnumDiffersFromListed} with sy_pnum ≠ listed`);
  { const t = K.TRACK_OPS['exo.valley'].run({}), tr = E.methods.indexOf('Transit'), R = [], Pp = [], T = []; for (let q = 0; q < E.planets; q++) { R.push(p[7 * q + 1]); Pp.push(p[7 * q + 3]); T.push(p[7 * q + 6] === tr); }
    const v = K.exoRadiusValley(R, Pp, T, 0.035);
    ok('the radius-valley estimator finds a known valley, and on the embedded transiting planets the valley the ledger states', Math.abs(t.valleyR - 1.87) < 0.15 && v.n === 3178 && Math.abs(v.valleyR - 1.77) < 0.02 && Math.abs(v.depth - 0.80) < 0.02,
      `synthetic ${t.valleyR.toFixed(3)} · measured ${v.valleyR.toFixed(3)} R⊕ between ${v.peak1R.toFixed(2)} and ${v.peak2R.toFixed(2)}, depth ${v.depth.toFixed(3)} (n ${v.n})`); }
  console.log('\n  ' + pass + ' passed, ' + fail + ' failed'); process.exit(fail ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
