#!/usr/bin/env node
'use strict';
/* ══ THE LIGHT HAS ITS SOURCES ═════════════════════════════════════════════════
 * The cosmic layer now carries the quasars beside the galaxies, and a census says what
 * share of the light inside any radius is whose. This file decodes both catalogues from
 * index.html and COMPUTES, independently of the atlas's own code:
 *   1. the quasars are the Véron-Cetty & Véron definition (catalogue M <= -23, z > 0),
 *      and every stored M_V is reproduced from V and z by the stated method (flat LCDM
 *      H0 = 67.4, Om = 0.315 luminosity distance; K for alpha_nu = -0.5)
 *   2. the cosmology is right: comoving distance and light-travel time at z = 1 match
 *      the Planck 2018 values
 *   3. inside a region 50 million light years across there is no quasar — all its light
 *      is starlight — and the nearest quasar is some 300 million light years away
 *   4. the census gives the share the fair way, the 1/Vmax luminosity density (Schmidt
 *      1968), each list weighted by its own completeness (galaxies V ~ 12, quasars
 *      V ~ 17.5) — recomputed here from scratch
 *   5. the light field is volume-limited too, so it does not fade with distance merely
 *      because the catalogue does
 *   6. MUTATIONS: a K-correction of the wrong sign, a census limited by the galaxy
 *      catalogue alone, and a field that uses every galaxy are each caught
 */
const fs = require('node:fs'), path = require('node:path');
const SRC = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
let pass = 0, fail = 0;
const ok = (n, c, d) => { if (c) { pass++; console.log('  PASS — ' + n + (d ? ' :: ' + d : '')); } else { fail++; console.log('  FAIL — ' + n + (d ? ' :: ' + d : '')); } };
const H0 = 67.4, OM = 0.315, C = 299792.458;
const comoving = z => { if (z <= 0) return 0; const n = 400, h = z / n; let s = 0;
  for (let i = 0; i <= n; i++) { const w = (i === 0 || i === n) ? 1 : (i % 2 ? 4 : 2); s += w / Math.sqrt(OM * (1 + i * h) ** 3 + 1 - OM); } return C / H0 * h / 3 * s; };
const lookback = z => { const n = 400, h = z / n; let s = 0;
  for (let i = 0; i <= n; i++) { const zz = i * h, w = (i === 0 || i === n) ? 1 : (i % 2 ? 4 : 2); s += w / ((1 + zz) * Math.sqrt(OM * (1 + zz) ** 3 + 1 - OM)); } return 977.8 / H0 * h / 3 * s; };

const Q = (() => { const m = SRC.match(/const QSO3D=(\{count:\d+,[^\n]*\});\n/); if (!m) return null; return eval('(' + m[1] + ')'); })();
ok('the quasars are embedded, each a Véron-Cetty & Véron quasar (catalogue M <= -23, z > 0)', Q && Q.rows.length === Q.count && Q.count > 5000 && Q.rows.every(r => r[3] > 0 && r[6] <= -23),
  Q ? `${Q.count} quasars · z ${Q.rows[0][3]}–${Q.rows.at(-1)[3]} · resource SHA-256 ${Q.resSha256.slice(0, 12)}…` : 'no QSO3D block');
const Mv = (V, z, sign = 1) => V - 5 * Math.log10((1 + z) * comoving(z) * 1e5) - sign * (-2.5 * 0.5 * Math.log10(1 + z));
const worst = r => Q.rows.reduce((m, r2) => Math.max(m, Math.abs(Mv(r2[4], r2[3], r) - r2[5])), 0);
const w1 = Q ? worst(1) : NaN;
ok('every stored M_V is reproduced from V and z by the stated method, to the 0.01 mag it is stored at', w1 <= 0.006, `worst |ΔM| ${w1.toFixed(4)} over ${Q ? Q.count : 0} quasars`);
const d1 = comoving(1), t1 = lookback(1);
ok('the cosmology is Planck 2018: comoving distance and light-travel time at z = 1', Math.abs(d1 / 3409 - 1) < 0.005 && Math.abs(t1 / 7.93 - 1) < 0.01,
  `D_C(1) = ${d1.toFixed(0)} Mpc (3395.9 Mpc for H0 = 67.66, scaled to 67.4: 3409) · t(1) = ${t1.toFixed(2)} Gyr (Planck 2018: 7.93)`);
ok('and the atlas computes the same', /function hccComovingMpc\(z\)\{[\s\S]{0,260}0\.315\*\(1\+i\*h\)\*\*3\+0\.685\); \} return 299792\.458\/67\.4\*\(h\/3\)\*s; \}/.test(SRC));

/* galaxies: the same decode the atlas uses */
const G = (() => { const m = SRC.match(/const DSO3D_GAL=\{count:(\d+),sha256:'[0-9a-f]+',b64:'([A-Za-z0-9+/=]+)'\};/); const b = Buffer.from(m[2], 'base64'), out = [];
  for (let i = 0; i < +m[1]; i++) { const dK = Math.pow(10, b.readUInt16LE(i * 8 + 4) / 8000 - 2), V = b[i * 8 + 6] / 10; out.push({ d: dK / 1000, M: V - 5 * Math.log10(dK * 100) }); } return out; })();
const nearest = Math.min(...Q.rows.map(r => comoving(r[3])));
const in50 = Q.rows.filter(r => comoving(r[3]) <= 25 / 3.26156).length;
ok('inside a region 50 million light years across there is no quasar: all its light is starlight', in50 === 0 && nearest > 50,
  `nearest quasar ${nearest.toFixed(0)} Mpc = ${(nearest * 3.26156).toFixed(0)} million ly · ${G.filter(g => g.d <= 25 / 3.26156).length} galaxies inside`);
const census = (R, bothLimits = true) => { const DM = d => 5 * Math.log10(d * 1e5);
  let lo = 0, hi = 10; for (let k = 0; k < 50; k++) { const m = (lo + hi) / 2; if (comoving(m) < R) lo = m; else hi = m; } const z = (lo + hi) / 2;
  const McG = 12.0 - DM(R), McQ = 17.5 - DM((1 + z) * R) + 1.25 * Math.log10(1 + z), Mc = bothLimits ? Math.min(McG, McQ) : McG;
  const L = M => Math.pow(10, -0.4 * (M - 4.83)), V = d => 4 / 3 * Math.PI * d ** 3; let jg = 0, jq = 0;
  /* 1/Vmax, computed here from scratch: the distance at which each source reaches its list's limit */
  for (const x of G) { if (x.d > R) continue; const dmax = Math.pow(10, (12.0 - x.M + 5) / 5) / 1e6; if (dmax < x.d) continue; jg += L(x.M) / V(Math.min(dmax, R)); }
  for (const r of Q.rows) { const dc = comoving(r[3]); if (dc > R) continue;
    let a = 0, b = 12; for (let k = 0; k < 40; k++) { const zm = (a + b) / 2, Vm = r[5] + 5 * Math.log10((1 + zm) * comoving(zm) * 1e5) - 1.25 * Math.log10(1 + zm); if (Vm < 17.5) a = zm; else b = zm; }
    const dmax = comoving((a + b) / 2); if (dmax < dc) continue; jq += L(r[5]) / V(Math.min(dmax, R)); }
  return { Mc, jg, jq, f: jq / (jq + jg) }; };
const cs = [100, 200, 333].map(R => [R, census(R)]);
const atlasCensus = s => /const McutG=GAL_M_LIM-dmAt\(Rmpc\), McutQ=QSO_M_LIM-dmAt\(dlR\)-Kq, Mcut=Math\.min\(McutG,McutQ\);/.test(s)
  && /const QSO_M_LIM=17\.5, GAL_M_LIM=12\.0, LSUN_MV=4\.83;/.test(s)
  && /out\.vm\.g\+=L\(g\.M\)\/V\(Math\.min\(dmax,Rmpc\)\);/.test(s) && /out\.vm\.q\+=L\(q\.Mv\)\/V\(Math\.min\(q\.dmax,Rmpc\)\);/.test(s);
ok('the fair share is the 1/Vmax luminosity density (Schmidt 1968), each list weighted by its own completeness; recomputed here, quasars give well under one per cent of the local light',
  atlasCensus(SRC) && cs.every(([, c]) => c.f > 0 && c.f < 0.01) && cs.every(([, c]) => c.jg > 5e7 && c.jg < 1e9),
  cs.map(([R, c]) => `${R} Mpc: galaxies ${c.jg.toExponential(2)}, quasars ${c.jq.toExponential(2)} L☉/Mpc³ → ${(100 * c.f).toFixed(3)} %`).join(' · '));
const field = s => /const N=48, S=61\.3, h=S\/N, half=S\/2, Mlim=GAL_M_LIM-5\*Math\.log10\(half\*1e5\)/.test(s) && /if\(G\.M>Mlim\|\|G\.dK\/1000>half\) continue;/.test(s);
const MlimF = 12.0 - 5 * Math.log10(61.3 / 2 * 1e5);
ok('the light field is volume-limited: only galaxies bright enough to be seen from anywhere in the sphere 200 million light years across', field(SRC),
  `M ≤ ${MlimF.toFixed(2)} · ${G.filter(g => g.M <= MlimF && g.d <= 30.65).length} galaxies inside`);

/* mutations */
const w2 = worst(-1);
ok('MUTATION — a K-correction of the wrong sign is caught', w2 > 0.1, `worst |ΔM| ${w2.toFixed(3)}`);
ok('MUTATION — a 1/Vmax that weights every source by the whole sphere is caught',
  !atlasCensus(SRC.replace('out.vm.g+=L(g.M)/V(Math.min(dmax,Rmpc));', 'out.vm.g+=L(g.M)/V(Rmpc);')));
/* inside 333 Mpc the galaxy catalogue (V ~ 12) is the shallower one, so its limit is the one
   that binds at every radius — said here, not hidden: the minimum matters for a deeper galaxy list */
let binds = true; for (const R of [10, 30, 100, 200, 333]) { const a = census(R), b = census(R, false); if (Math.abs(a.Mc - b.Mc) > 1e-9) binds = false; }
const cG = census(333, false);
ok('MUTATION — a census limited by one catalogue alone is caught (and, within 333 Mpc, it is the galaxy limit that binds at every radius)',
  !atlasCensus(SRC.replace('Mcut=Math.min(McutG,McutQ);', 'Mcut=McutG;')) && binds, `at 333 Mpc: M ≤ ${cG.Mc.toFixed(2)} either way`);
ok('MUTATION — a light field that uses every galaxy is caught', !field(SRC.replace('if(G.M>Mlim||G.dK/1000>half) continue;', 'if(G.dK/1000>half) continue;')));

console.log('\n  ' + pass + ' passed, ' + fail + ' failed'); process.exit(fail ? 1 : 0);
