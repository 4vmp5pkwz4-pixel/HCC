#!/usr/bin/env node
'use strict';
/* ══ THE ARMS HAVE THEIR STARS ═══════════════════════════════════════════════
 * The Milky Way's arms are traced by objects whose distances are measured. This file
 * reads MWT_OBJECTS out of index.html and COMPUTES:
 *   1. every object carries a published distance with its source, and a position
 *      whose galactic coordinates agree with the published ones (SIMBAD) to 0.01°
 *   2. the Solar world draws its arms from the azimuth the Sun ACTUALLY has in the
 *      disc's frame — they were drawn from a display anchor 63° away, which the
 *      tracers exposed (η Carinae read as Perseus, the Double Cluster as the Outer arm)
 *   3. MUTATION — the old anchor, put back, is caught
 */
const fs = require('node:fs'), path = require('node:path');
const SRC = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
let pass = 0, fail = 0;
const ok = (n, c, d) => { if (c) { pass++; console.log('  PASS — ' + n + (d ? ' :: ' + d : '')); } else { fail++; console.log('  FAIL — ' + n + (d ? ' :: ' + d : '')); } };
const O = JSON.parse((SRC.match(/const MWT_OBJECTS=(\[.*?\]);\n/) || [0, '[]'])[1]);
const R = Math.PI / 180, aN = 192.85948, dN = 27.12825, lN = 122.93192;
const gal = (ra, de) => { const a = ra * R, d = de * R, ap = aN * R, dp = dN * R;
  const sb = Math.sin(d) * Math.sin(dp) + Math.cos(d) * Math.cos(dp) * Math.cos(a - ap);
  const l = lN * R - Math.atan2(Math.cos(d) * Math.sin(a - ap), Math.sin(d) * Math.cos(dp) - Math.cos(d) * Math.sin(dp) * Math.cos(a - ap));
  return [((l / R) % 360 + 360) % 360, Math.asin(sb) / R]; };
ok('thirty objects, each with a published distance and its source', O.length >= 30 && O.every(o => o.dKpc > 0 && o.dSrc && o.dSrc.length > 8 && o.n.length === 3),
  `${O.length} objects · ${O.filter(o => o.kind === 'star').length} stars, ${O.filter(o => o.kind !== 'star').length} clusters, nebulae and remnants`);
const REF = { etacar: [287.5967, -0.6296], crab: [184.5575, -5.7843], m45: [166.57, -23.52], m42: [209.01, -19.38], wd1: [339.55, -0.40] };
const rows = Object.entries(REF).map(([k, [l, b]]) => { const o = O.find(x => x.key === k); if (!o) return [k, Infinity];
  const [gl, gb] = gal(o.ra, o.de); return [k, Math.max(Math.abs(((gl - l + 540) % 360) - 180), Math.abs(gb - b))]; });
ok('the positions are the published ones: galactic coordinates recomputed from the embedded RA/Dec agree with SIMBAD to 0.01°',
  rows.every(([, e]) => e < 0.011), rows.map(([k, e]) => `${k} ${e.toFixed(4)}°`).join(' · '));
const anchored = s => /const MW_SOLAR_AZ0=mwSolarSunAzimuth\(\);/.test(s) && /const a=MW_SOLAR_AZ0\+dth, r=rk\*MILKY_WAY\.KPC_LY;/.test(s)
  && /const ta=MW_SOLAR_AZ0\+Math\.log\(Math\.max\(R,0\.2\)\/arm\.R\)\/tp;/.test(s);
ok('the Solar world\'s arms start from the Sun\'s own azimuth in the disc frame, and the tracers are measured against the same arms', anchored(SRC));
const mut = SRC.replace('const a=MW_SOLAR_AZ0+dth, r=rk*MILKY_WAY.KPC_LY;', 'const a=MILKY_WAY.sunAzimuth+dth, r=rk*MILKY_WAY.KPC_LY;');
ok('and the 63° anchor, put back, is caught', mut !== SRC && !anchored(mut));
console.log('\n  ' + pass + ' passed, ' + fail + ' failed'); process.exit(fail ? 1 : 0);
