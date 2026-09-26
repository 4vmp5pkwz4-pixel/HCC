#!/usr/bin/env node
'use strict';
/* ══ BEYOND THE FIT, THE AXIS KEEPS PRECESSING ═════════════════════════════════════════
 * A reader ran the clock past ±200 000 years and watched Earth's axis fall over and stay
 * there. The Vondrák long-term series is a fit over that window, and its polynomial part
 * runs away outside it: the obliquity climbs to 28.5° by +500 000 years and the pole of
 * date lands on the equator by ±1 000 000 (ε → 0). The header of the port said the
 * extrapolation was bounded; it was not. Past the window the atlas now continues on the
 * precession cone — one turn in 25 772 years about the ecliptic pole, the obliquity on the
 * 41 000-year cycle between 22.1° and 24.5°, joined to the fit at the edge with no jump.
 * This file lifts the LTP block and its continuation out of index.html and checks:
 *   1. the fault itself, reproduced: the bare series gives ε > 27° at +500 kyr and a pole
 *      on the equator at ±1 Myr
 *   2. inside the window the continuation IS the series, to the last bit
 *   3. at both edges there is no jump (1e-4°) and the obliquity keeps its slope
 *   4. beyond, for any epoch out to ±100 Myr, the obliquity stays in 22.1°–24.6° and the
 *      pole is a unit vector — nothing falls over
 *   5. the cone turns once in 25 772 years and the obliquity breathes once in 41 040
 *   6. the legacy linear engine is continued the same way past ±1000 years
 *   7. the wiring: the Earth's axis and the precession cone use the continuation
 *   8. MUTATION: the 41-kyr cycle phased with the wrong sign puts a kink in ε(t) at the
 *      edge, caught
 */
const fs = require('node:fs'), path = require('node:path');
const SRC = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
let pass = 0, fail = 0;
const ok = (n, c, d) => { if (c) { pass++; console.log('  PASS — ' + n + (d ? ' :: ' + d : '')); } else { fail++; console.log('  FAIL — ' + n + (d ? ' :: ' + d : '')); } };
const a0 = SRC.indexOf('const LTP_S=Math.PI'), a1 = SRC.indexOf('/* the ACTIVE precession engine');
const BLOCK = SRC.slice(a0, a1);
const lift = block => new Function('DEG', 'raDecDir', block + ';return {ltpEqu,ltpEcl,ltpEquExt,ltpEclExt,ltpObliquityExtRad,iauPoleEq,iauPoleExt,PREC_EXT};')(Math.PI / 180, () => null);
const L = lift(BLOCK);
const ang = (a, b) => Math.acos(Math.max(-1, Math.min(1, a[0] * b[0] + a[1] * b[1] + a[2] * b[2]))) * 180 / Math.PI;
const epsBare = y => ang(L.ltpEqu(2000 + y), L.ltpEcl(2000 + y)), epsExt = y => L.ltpObliquityExtRad(2000 + y) * 180 / Math.PI;

/* 1 · the fault */
ok('the fault, reproduced: the bare Vondrák series runs away past its window — ε above 27° at +500 kyr, and the pole of date on the equator at ±1 Myr',
  epsBare(5e5) > 27 && Math.abs(L.ltpEqu(2000 + 1e6)[2]) < 1e-9 && Math.abs(L.ltpEqu(2000 - 1e6)[2]) < 1e-9, `ε(+500 kyr) = ${epsBare(5e5).toFixed(2)}° · pole z at ±1 Myr ${L.ltpEqu(2000 + 1e6)[2]}, ${L.ltpEqu(2000 - 1e6)[2]}`);

/* 2 · inside, identical */
{ let same = true; for (let y = -2e5; y <= 2e5; y += 3917) { const a = L.ltpEqu(2000 + y), b = L.ltpEquExt(2000 + y); if (a.some((x, i) => x !== b[i])) same = false; }
  ok('inside ±200 000 years the continuation is the series itself, bit for bit', same); }

/* 3 · no jump at the edges */
{ const j = s => ang(L.ltpEquExt(2000 + s * 2e5 - s * 1e-3), L.ltpEquExt(2000 + s * 2e5 + s * 1e-3)), sl = s => Math.sign(epsExt(s * 2e5 + s * 50) - epsExt(s * 2e5)) === Math.sign(epsBare(s * 2e5) - epsBare(s * 2e5 - s * 50));
  ok('at both edges the axis does not jump (1e-4°) and the obliquity keeps the sense it had inside', j(1) < 1e-4 && j(-1) < 1e-4 && sl(1) && sl(-1), `jumps ${j(1).toExponential(1)}°, ${j(-1).toExponential(1)}°`); }

/* 4 · bounded forever */
{ let lo = 90, hi = 0, unit = true; for (const s of [1, -1]) for (let k = 0; k <= 400; k++) { const y = s * 2e5 * Math.pow(500, k / 400), e = epsExt(y), p = L.ltpEquExt(2000 + y); lo = Math.min(lo, e); hi = Math.max(hi, e); if (Math.abs(Math.hypot(...p) - 1) > 1e-12) unit = false; }
  ok('beyond the window, out to ±100 Myr, the obliquity stays between 22.1° and 24.6° and the pole stays a unit vector — the axis never falls over', lo > 22.1 && hi < 24.6 && unit, `ε in ${lo.toFixed(2)}°–${hi.toFixed(2)}°`); }

/* 5 · the two periods */
{ const y0 = 3e5, e = L.ltpEclExt(2000 + y0), az = y => { const p = L.ltpEquExt(2000 + y), q = p.map((x, i) => x - (p[0] * e[0] + p[1] * e[1] + p[2] * e[2]) * e[i]); return Math.atan2(q[1], q[0]); };
  let turned = 0, prev = az(y0); for (let y = y0 + 50; y <= y0 + 25772; y += 50) { const a = az(y); let d = a - prev; if (d > Math.PI) d -= 2 * Math.PI; if (d < -Math.PI) d += 2 * Math.PI; turned += d; prev = a; }
  const z = []; for (let y = y0; y < y0 + 5 * 41040; y += 20) { const m = 23.32; if ((epsExt(y) - m) * (epsExt(y + 20) - m) < 0) z.push(y); }
  const pe = 2 * (z[z.length - 1] - z[0]) / (z.length - 1);
  ok('beyond the window the cone turns once in 25 772 years and the obliquity breathes once in 41 040', Math.abs(Math.abs(turned) / (2 * Math.PI) - 1) < 0.02 && Math.abs(pe / 41040 - 1) < 0.01, `${(Math.abs(turned) / (2 * Math.PI)).toFixed(4)} turns in 25 772 yr · obliquity period ${pe.toFixed(0)} yr`); }

/* 6 · the legacy engine */
{ const j = ang(L.iauPoleExt(2000 + 1000 - 1e-3), L.iauPoleExt(2000 + 1000 + 1e-3)), far = [5e3, 1e5, 1e7, -1e7].map(y => ang(L.iauPoleExt(2000 + y), [0, 0, 1]));
  ok('the legacy linear engine is continued the same way past ±1000 years: no jump, and its pole stays on a cone (never more than 2ε from the J2000 pole)', j < 1e-4 && far.every(a => a < 48), `jump ${j.toExponential(1)}° · arcs ${far.map(a => a.toFixed(1)).join(', ')}°`); }

/* 7 · wiring */
ok('the wiring: the Earth\'s axis in both engines and the breathing precession cone use the continuation, and the header no longer calls the bare series bounded',
  /return eqVecToScene\(ltpEquExt\(2000\+Tcenturies\*100\)\)\.normalize\(\);/.test(SRC) && /return eqVecToScene\(iauPoleExt\(2000\+Tcenturies\*100\)\)\.normalize\(\);/.test(SRC)
  && /const eps=ltp\?ltpObliquityExtRad\(2000\+state\.epochDays\/365\.25\)/.test(SRC) && !/smooth and bounded for any epoch/.test(SRC));

/* 8 · mutation */
{ const cut = 'const ph0=Math.acos(c0)*(E.dEps>0?-1:1);', M = lift(BLOCK.replace(cut, 'const ph0=Math.acos(c0)*(E.dEps>0?1:-1);'));
  const e = y => M.ltpObliquityExtRad(2000 + y) * 180 / Math.PI, flips = [1, -1].filter(s => Math.sign(e(s * 2e5 + s * 50) - e(s * 2e5)) !== Math.sign(epsBare(s * 2e5) - epsBare(s * 2e5 - s * 50)));
  ok('MUTATION — the 41-kyr cycle phased with the wrong sign makes the obliquity turn back at the edge (a kink in ε(t)), caught', BLOCK.includes(cut) && flips.length > 0, `edges with a kink: ${flips.map(s => s > 0 ? '+200 kyr' : '−200 kyr').join(', ')}`); }

console.log('\n  ' + pass + ' passed, ' + fail + ' failed'); process.exit(fail ? 1 : 0);
