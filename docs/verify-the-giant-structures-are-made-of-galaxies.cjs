#!/usr/bin/env node
'use strict';
/* ══ THE GIANT STRUCTURES ARE MADE OF GALAXIES ═══════════════════════════════════
 * The Solar world's giant structures were drawn only as volumes: spheres and
 * ellipsoids that say where a structure is and how uncertain its extent is. What fills
 * them is galaxies. This file decodes the embedded galaxies (DSO3D_GAL) from index.html
 * and COMPUTES:
 *   1. the records decode to the declared count, with the same distance code the
 *      builder writes (log10(d/kpc)+2, ×8000) and the atlas reads
 *   2. landmark distances are the published ones, and those the catalogue had wrong or
 *      missing (the Magellanic Clouds, the Local Group dwarfs, Centaurus A, M87) are
 *      replaced by the measurement, which each card names
 *   3. no galaxy stands inside the Galaxy: the nearest is the Sagittarius dwarf, 26 kpc
 *   4. the STRUCTURES EMERGE FROM THE DATA: the Virgo cluster and the Coma cluster are
 *      overdensities of galaxies in their real directions at their real distances,
 *      measured against the same cone pointed in 400 other directions
 *   5. the Galaxy's own globular clusters stand in a halo of 2 to 100 kpc
 *   6. a volume the camera is inside is not drawn as a cage over the view, and the
 *      layer has its switch in Controls
 *   7. MUTATIONS: the old ×1e4 decode, a removed correction, and a cage drawn from
 *      inside are each caught
 */
const fs = require('node:fs'), path = require('node:path');
const ROOT = path.join(__dirname, '..');
const SRC = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const BUILD = fs.readFileSync(path.join(ROOT, 'scripts', 'build-dso-3d.py'), 'utf8');
let pass = 0, fail = 0;
const ok = (n, c, d) => { if (c) { pass++; console.log('  PASS — ' + n + (d ? ' :: ' + d : '')); } else { fail++; console.log('  FAIL — ' + n + (d ? ' :: ' + d : '')); } };

const read = s => {
  const G = s.match(/const DSO3D_GAL=\{count:(\d+),sha256:'([0-9a-f]{64})',b64:'([A-Za-z0-9+/=]+)'\};/);
  const N = s.match(/const DSO3D_GAL_NAMES=(\{.*?\});\n/), L = s.match(/const DSO3D_LOCAL=(\[.*?\]);\n/);
  const div = +(s.match(/dK=Math\.pow\(10,dv\.getUint16\(o\+4,true\)\/(\d+(?:e\d+)?)-2\)/) || [0, NaN])[1];
  if (!G || !N || !L) return null;
  const b = Buffer.from(G[3], 'base64');
  const rec = i => ({ ra: b.readUInt16LE(i * 8) / 65536 * 360, de: b.readInt16LE(i * 8 + 2) / 32767 * 90,
    d: Math.pow(10, b.readUInt16LE(i * 8 + 4) / div - 2), V: b[i * 8 + 6] / 10, c: b[i * 8 + 7] });
  return { count: +G[1], sha: G[2], n: b.length / 8, rec, names: JSON.parse(N[1]), local: JSON.parse(L[1]) };
};
const byName = (D, nm) => { const k = Object.keys(D.names).find(i => D.names[i][0] === nm); return k == null ? null : { ...D.rec(+k), meta: D.names[k] }; };
const D = read(SRC);
ok('the galaxies are embedded and decode to the declared count', D && D.n === D.count && D.count > 4000,
  D ? `${D.count} galaxies declared · ${D.n} records of 8 bytes · catalogue SHA-256 ${D.sha.slice(0, 12)}…` : 'no DSO3D block');
if (!D) { console.log('\n  ' + pass + ' passed, ' + fail + ' failed'); process.exit(1); }

const enc = +(BUILD.match(/ld=int\(round\(\(math\.log10\(r\['dist'\]\)\+2\)\*(\d+)\)\)/) || [0, NaN])[1];
const dec = +(SRC.match(/dK=Math\.pow\(10,dv\.getUint16\(o\+4,true\)\/(\d+(?:e\d+)?)-2\)/) || [0, NaN])[1];
ok('the atlas reads the distance code the builder writes', enc === 8000 && dec === 8000, `builder ×${enc} · atlas ÷${dec} · 1/8000 dex = ${((Math.pow(10, 1 / 8000) - 1) * 100).toFixed(3)} %`);

/* published distances, kpc: [name, value, tolerance, where] */
const REF = [
  ['PGC 17223', 49.59, 0.002, 'LMC · Pietrzyński et al. 2019'],
  ['NGC 292', 62.44, 0.002, 'SMC · Graczyk et al. 2020'],
  ['M31', 778, 0.005, 'M31 · the atlas\'s own 2.537 Mly'],
  ['M33', 840, 0.06, 'M33 · 0.79–0.94 Mpc in the literature'],
  ['NGC 6822', 459, 0.005, 'Barnard\'s Galaxy · McConnachie 2012'],
  ['IC 1613', 755, 0.005, 'IC 1613 · McConnachie 2012'],
  ['M81', 3630, 0.05, 'M81 · Freedman et al. 1994, 3.63 Mpc'],
  ['NGC 5128', 3800, 0.005, 'Centaurus A · Harris et al. 2010'],
  ['M87', 16500, 0.005, 'M87 · Mei et al. 2007'],
];
const rows = REF.map(([nm, v, tol, w]) => { const g = byName(D, nm); return [w, g ? g.d : NaN, v, tol]; });
ok('landmark distances are the published ones', rows.every(([, d, v, t]) => Math.abs(d / v - 1) <= t),
  rows.map(([w, d, v]) => `${w}: ${d >= 1000 ? (d / 1000).toFixed(2) + ' Mpc' : d.toFixed(1) + ' kpc'} (${((d / v - 1) * 100).toFixed(2)} %)`).join(' · '));
const m31 = byName(D, 'M31');
const sep = (a1, d1, a2, d2) => { const r = Math.PI / 180; return Math.acos(Math.min(1, Math.sin(d1 * r) * Math.sin(d2 * r) + Math.cos(d1 * r) * Math.cos(d2 * r) * Math.cos((a1 - a2) * r))) / r; };
ok('and their directions are the catalogued ones', m31 && sep(m31.ra, m31.de, 10.68471, 41.26875) < 0.01,
  m31 ? `M31 at RA ${m31.ra.toFixed(4)}° Dec ${m31.de.toFixed(4)}° — ${(sep(m31.ra, m31.de, 10.68471, 41.26875) * 3600).toFixed(1)}″ from the NED centre` : '');
const fixed = Object.values(D.names).filter(v => v[4]);
ok('every replaced distance names the measurement on its card', fixed.length >= 20 && fixed.every(v => /\(\d{4}\), .+ — /.test(v[4])),
  `${fixed.length} replaced: ${fixed.slice(0, 5).map(v => (v[3] || v[0])).join(', ')}, …`);

/* no placeholder shell: the catalogue gave 49 489 galaxies without a redshift a fill distance
   of 36 +- 4 Mpc; if they came back, a single 1.3x window of distance would hold most galaxies */
const shellFrac = D2 => { const ds = []; for (let i = 0; i < D2.n; i++) ds.push(Math.log(D2.rec(i).d)); ds.sort((a, b) => a - b);
  let best = 0, j = 0; for (let i = 0; i < ds.length; i++) { while (ds[i] - ds[j] > Math.log(1.3)) j++; best = Math.max(best, i - j + 1); } return best / ds.length; };
const sf = shellFrac(D);
ok('no placeholder shell: no window of distance 1.3 times wide holds more than a fifth of the galaxies', sf < 0.2,
  `densest 1.3× window holds ${(100 * sf).toFixed(1)} % (the catalogue's fill value had put ${(100 * 49489 / 53828).toFixed(0)} % of its galaxies at 36 ± 4 Mpc)`);
const B = fs.readFileSync(path.join(ROOT, 'scripts', 'build-dso-3d.py'), 'utf8');
ok('and the builder leaves the fill value out by one stated rule: no redshift, no uncertainty, 30–42 Mpc',
  /placeholder=\[r for r in recs if r\['ot'\] in \(0,1,2,3\) and not \(0<r\['z'\]<50\) and r\['diste'\]<=0 and 30000<=r\['dist'\]<=42000/.test(B));
let nearest = Infinity; for (let i = 0; i < D.n; i++) nearest = Math.min(nearest, D.rec(i).d);
ok('no galaxy stands inside the Galaxy', nearest >= 20, `nearest ${nearest.toFixed(1)} kpc (the Sagittarius dwarf, 26 kpc); the catalogue's IC 359 at 0.1 kpc is left out`);

/* structures from the data alone: galaxies in a cone around a direction and a distance
   shell, against the same cone pointed in 400 deterministic directions */
const cone = (ra, de, r, d0, d1) => { let n = 0; for (let i = 0; i < D.n; i++) { const g = D.rec(i); if (g.d >= d0 && g.d <= d1 && sep(g.ra, g.de, ra, de) <= r) n++; } return n; };
const baseline = (r, d0, d1) => { let s = 0, k = 0, x = 0.5;
  for (let j = 0; j < 400; j++) { x = (x * 9301 + 49297) % 233280; const u = x / 233280; x = (x * 9301 + 49297) % 233280; const v = x / 233280;
    const de = Math.asin(2 * v - 1) * 180 / Math.PI; if (Math.abs(de) < 15) continue; s += cone(u * 360, de, r, d0, d1); k++; } return s / k; };
const virgo = cone(187.71, 12.39, 6, 12000, 25000), vb = baseline(6, 12000, 25000);
const coma = cone(194.95, 27.98, 2, 85000, 125000), cb = baseline(2, 85000, 125000);
ok('the Virgo cluster emerges: galaxies within 6° of M87 at 12–25 Mpc', virgo > 8 * vb, `${virgo} against ${vb.toFixed(1)} in the average cone · ×${(virgo / vb).toFixed(0)}`);
ok('the Coma cluster emerges: galaxies within 2° of its centre at 85–125 Mpc', coma > 8 * cb, `${coma} against ${cb.toFixed(1)} in the average cone · ×${(coma / cb).toFixed(0)}`);

const glob = D.local.filter(r => r[1] === 'globular');
ok('the Galaxy\'s globular clusters stand in a halo of 2 to 100 kpc, and no cluster or nebula is nearer than 10 pc', glob.length >= 120 && glob.every(r => r[4] >= 2 && r[4] <= 100) && D.local.every(r => r[4] >= 0.01),
  `${glob.length} globulars, ${Math.min(...glob.map(r => r[4])).toFixed(1)}–${Math.max(...glob.map(r => r[4])).toFixed(1)} kpc · ${D.local.length} clusters and nebulae in all, nearest ${Math.min(...D.local.map(r => r[4])) * 1000} pc`);

const cage = s => /if\(e\.cage\)\{ const out=e\.o\.worldToLocal\(_dsoCam\.copy\(camera\.position\)\)\.length\(\)>=e\.o\.geometry\.parameters\.radius; if\(e\.o\.visible!==out\) e\.o\.visible=out; \}/.test(s)
  && /const fo=THREE\.MathUtils\.smoothstep\(x,rx-0\.35,rx-0\.05\);\s*s\.wire\.material\.opacity=0\.14\*f\*fo;/.test(s);
ok('a volume the camera is inside is not drawn as a cage over the whole view', cage(SRC));
ok('the layer has its switch in Controls, and it is wired', /<input type="checkbox" id="skyDso" \$\{state\.showDso3d!==false\?'checked':''\}>/.test(SRC)
  && /#skyDso'\)\.onchange=e=>\{ state\.showDso3d=e\.target\.checked; \}/.test(SRC) && /on=state\.mode==='solar'&&state\.showDso3d!==false&&Ly!=='local'/.test(SRC));

/* mutations */
const m1 = read(SRC.replace('getUint16(o+4,true)/8000-2)', 'getUint16(o+4,true)/1e4-2)'));
const m1d = m1 && byName(m1, 'M31');
ok('MUTATION — the old ×1e4 decode is caught', m1d && Math.abs(m1d.d / 778 - 1) > 0.5, m1d ? `M31 would stand at ${m1d.d.toFixed(0)} kpc` : '');
const b64 = SRC.match(/const DSO3D_GAL=\{count:\d+,sha256:'[0-9a-f]+',b64:'([A-Za-z0-9+/=]+)'/)[1], buf = Buffer.from(b64, 'base64');
const k = +Object.keys(D.names).find(i => D.names[i][0] === 'PGC 17223');
buf.writeUInt16LE(Math.round((Math.log10(49.97) + 2) * 8000), k * 8 + 4);
const m2 = read(SRC.replace(b64, buf.toString('base64')));
ok('MUTATION — the catalogue\'s own LMC distance, put back, is caught', m2 && Math.abs(byName(m2, 'PGC 17223').d / 49.59 - 1) > 0.002,
  `${byName(m2, 'PGC 17223').d.toFixed(2)} kpc`);
ok('MUTATION — a cage drawn from inside is caught', !cage(SRC.replace('s.wire.material.opacity=0.14*f*fo;', 's.wire.material.opacity=0.14*f;')));

console.log('\n  ' + pass + ' passed, ' + fail + ' failed'); process.exit(fail ? 1 : 0);
