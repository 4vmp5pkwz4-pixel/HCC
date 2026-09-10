#!/usr/bin/env node
'use strict';
/* ══ THE LADDER'S OWN NUMBER, MEASURED INSTEAD OF QUOTED ═══════════════════════
 *
 * The atlas has quoted a late-time Hubble constant up its own distance ladder for
 * releases, as a calibration. It has also held forty-five galaxies at exact
 * positions since v4.213.0. The two had never met.
 *
 * Twenty-four of those galaxies carry a measured radial velocity now, and a
 * velocity against a distance is the Hubble law with nothing else in it. This runs
 * the fit out of index.html and checks it against things that are true outside
 * this file: the answer, the sign and size of the Virgo deceleration, and the one
 * residual the catalogue had already written down in prose.
 */
const fs = require('node:fs'), path = require('node:path'), vm = require('node:vm');
const ROOT = path.join(__dirname, '..');
const src = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
let pass = 0, fail = 0;
const ok = (n, c, d) => { if (c) { pass++; console.log('  PASS — ' + n + (d ? ' :: ' + d : '')); }
  else { fail++; console.log('  FAIL — ' + n + (d ? ' :: EXPECTED ' + d : '')); } };

function cut(from, open, close, tail) {
  const i = src.indexOf(from); if (i < 0) throw new Error('slice not found: ' + from);
  const j = src.indexOf(open, i); let d = 0;
  for (let k = j; k < src.length; k++) {
    if (src[k] === open) d++;
    else if (src[k] === close) { d--; if (d === 0) return src.slice(i, k + 1) + (tail || ''); }
  }
  throw new Error('unbalanced: ' + from);
}
const S_GAL = cut('const GALAXIES=Object.freeze([', '[', ']', ');');
const S_COSMOS = cut('const COSMOS = [', '[', ']', ';');
const S_GALRD = cut('function galacticRaDec(lDeg,bDeg){', '{', '}');
const S_FLOW = src.slice(src.indexOf('const HFLOW_APEX_KMS='), src.indexOf('globalThis.HCC_HUBBLE_FLOW='));

ok('the fit and the catalogue it reads were cut out of index.html rather than copied beside it',
  S_FLOW.length > 900 && S_GAL.length > 4000, `${S_FLOW.length} chars of live fit`);
ok('THE FIT IS THROUGH THE ORIGIN, because v = H d has no intercept and adding one would quietly absorb the infall this laboratory exists to show',
  /sxy\s*\/\s*sxx/.test(S_FLOW) && !/intercept|\+\s*b\b/.test(S_FLOW),
  'H = sum(d v) / sum(d²), with no constant term anywhere in the estimator');

const sandbox = { Math, Map, Set, Object, Array, Number, console, JSON, DEG: Math.PI / 180, MPC_PER_GLY: 306.601 };
const ctx = vm.createContext(sandbox);
const built = vm.runInContext([
  S_GALRD,
  'const VELA_EQ=galacticRaDec(272.5,0), DIPOLE_EQ=galacticRaDec(94,-16), LOCALVOID_EQ=galacticRaDec(60,15);',
  S_GAL, S_COSMOS,
  'for(const s of COSMOS) if(s.dGly==null && s.dMly!=null) s.dGly=s.dMly/1000;',
  S_FLOW,
  '({hflowRows, hflowFit, HFLOW_APEX_KMS, COSMOS})'
].join('\n'), ctx, { timeout: 20000 });
const { hflowRows, hflowFit, HFLOW_APEX_KMS, COSMOS } = built;

/* ── the catalogue side ───────────────────────────────────────────────────── */
const rows = hflowRows();
const VELOCITY_FLOOR = 24;
ok('the number of galaxies carrying a measured radial velocity is at or above its floor, and the floor only rises',
  rows.length >= VELOCITY_FLOOR, `${rows.length} of ${COSMOS.filter(s => s.type === 'galaxy').length} galaxies against floor ${VELOCITY_FLOOR}`);
ok('every galaxy with a velocity also has a distance, so no row can enter the fit half-specified',
  rows.every(r => r.mpc > 0 && Number.isFinite(r.cz)), 'each row carries both numbers or is not a row');
ok('the four galaxies bound to us are marked bound, which is why M31 approaches at all',
  rows.filter(r => r.bound).length === 4 && rows.filter(r => r.bound).every(r => r.mpc < 1.5),
  rows.filter(r => r.bound).map(r => r.key).join(', ') + ' — every one inside 1.5 Mpc');
ok('the Local Group frame correction is declared once, as the apex convention it is',
  HFLOW_APEX_KMS === 300 && (src.match(/const HFLOW_APEX_KMS=/g) || []).length === 1,
  'v_LG = v_helio + 300 sin(l) cos(b), written in one place');

/* ── the answer ───────────────────────────────────────────────────────────── */
const F = hflowFit(3, false, true, 'lg');
ok('fitting this atlas`s own galaxies returns a little over seventy-two kilometres a second per megaparsec',
  F.h0 > 68 && F.h0 < 78, `${F.h0.toFixed(3)} km/s/Mpc from ${F.n} galaxies, scatter ${F.rms.toFixed(0)} km/s`);
const NV = hflowFit(3, false, false, 'lg');
ok('AND THE VIRGO CLUSTER DRAGS IT DOWN. Dropping the four members raises the fit and lowers the scatter, which is the cluster`s own mass decelerating the flow around it',
  NV.h0 > F.h0 && NV.rms < F.rms,
  `${F.h0.toFixed(2)} at scatter ${F.rms.toFixed(0)} with them, ${NV.h0.toFixed(2)} at ${NV.rms.toFixed(0)} without`);
{
  const m86 = rows.find(r => r.key === 'm86');
  const res = m86.czLG - F.h0 * m86.mpc;
  const prose = /falling through Virgo at 1500 km\/s/.test(src);
  ok('THE LARGEST RESIDUAL IS M86, AND THE FIT RECOVERS THE NUMBER ITS OWN CATALOGUE ENTRY STATES IN PROSE. The entry says it is falling through Virgo at 1500 km/s toward us; the fit, which was never told that, puts it fifteen hundred below the flow',
    Math.abs(res + 1500) < 120 && prose,
    `residual ${res.toFixed(0)} km/s against the 1500 written in its note`);
}
ok('the frame correction is worth less than the scatter, which is reported rather than assumed negligible',
  Math.abs(hflowFit(3, false, true, 'heliocentric').h0 - F.h0) < F.rms / 10,
  `heliocentric ${hflowFit(3, false, true, 'heliocentric').h0.toFixed(2)} against Local Group ${F.h0.toFixed(2)}`);

/* ── and the dependences point the way physics says ───────────────────────── */
ok('a through-origin fit barely notices the bound galaxies, so their exclusion is shown per galaxy rather than in the total',
  Math.abs(hflowFit(0, true, true, 'lg').h0 - F.h0) < 1,
  `including all four moves the fit by ${Math.abs(hflowFit(0, true, true, 'lg').h0 - F.h0).toFixed(3)} km/s/Mpc`);
ok('and each bound galaxy on its own returns something no expansion could, which is what an orbital velocity looks like read as one',
  rows.filter(r => r.bound).some(r => r.czLG / r.mpc < 0),
  rows.filter(r => r.bound).map(r => `${r.key} ${(r.czLG / r.mpc).toFixed(0)}`).join(', ') + ' km/s/Mpc');
ok('raising the distance floor keeps the answer and costs galaxies, which is the whole shape of a flow measured through peculiar velocities',
  Math.abs(hflowFit(10, false, true, 'lg').h0 - F.h0) < 6 && hflowFit(10, false, true, 'lg').n < F.n,
  `${hflowFit(10, false, true, 'lg').h0.toFixed(2)} from ${hflowFit(10, false, true, 'lg').n} galaxies beyond 10 Mpc`);

console.log(`\n  ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
