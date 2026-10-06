#!/usr/bin/env node
/* THE 2MASS REDSHIFT SURVEY AND COSMICFLOWS-4, embedded in index.html (v4.362).

   Sources — the authoritative CDS/VizieR copies, fetched once and hashed:
     2MRS  : Huchra et al. 2012, ApJS 199, 26 — J/ApJS/199/26/table3 (44 599 galaxies, K_s ≤ 11.75, |b| ≥ 5°–8°)
     CF4   : Tully et al. 2023, ApJ 944, 94 — J/ApJ/944/94/table2 (55 877 galaxy distances),
             table3 (38 053 group distances), table4 (the same groups: distances, velocities, peculiar velocities)
   Every column is read by its byte range from the catalogue's own ReadMe; nothing is typed in by hand.

   Validated before anything is written (the build stops on any failure):
     row counts against the ReadMe; RA ∈ [0,360), Dec ∈ [−90,90]; the catalogue's own galactic coordinates against
     RA/Dec through the IAU J2000 rotation (max deviation); missing values counted per column; duplicate IDs; CF4 table4
     luminosity distance against its distance modulus, D = 10^((DM−25)/5); table3 and table4 rows describe the same
     groups in the same order.

   Frames and units, as embedded:
     positions in J2000 equatorial Cartesian Mpc (x → RA 0, z → Dec +90°) — the frame of the atlas's local web;
     2MRS: REDSHIFT SPACE — cz is barycentric (ReadMe), moved to the CMB frame with Planck's dipole (369.82 km/s toward
       l = 264.021°, b = 48.253°) and placed at the comoving distance of the atlas's flat ΛCDM (H₀ = 68.43, Ω_m = 0.305);
     CF4: DISTANCE SPACE — the measured luminosity distance (zero point from TRGB, Cepheids, masers: H₀ ≈ 75 on that
       scale) turned into comoving distance d_L/(1+z_cmb); the published peculiar velocity Vpec (their eq. 11) kept as is.
   The two are deliberately NOT forced onto one scale: the radial offset between them IS the distance-ladder H₀.

   Usage: node scripts/build-2mrs-cf4.mjs <dir with 2mrs_table3.dat.gz, cf4_table2.dat.gz, cf4_table3.dat.gz,
          cf4_table4.dat.gz, 2mrs_ReadMe, cf4_ReadMe> [index.html]                                                      */
import fs from 'node:fs'; import path from 'node:path'; import zlib from 'node:zlib'; import crypto from 'node:crypto';
const DIR = process.argv[2]; if (!DIR) { console.error('usage: node scripts/build-2mrs-cf4.mjs <dir> [index.html]'); process.exit(2); }
const INDEX = process.argv[3] || path.join(path.dirname(new URL(import.meta.url).pathname), '..', 'index.html');
const sha = b => crypto.createHash('sha256').update(b).digest('hex');
const read = f => { const raw = fs.readFileSync(path.join(DIR, f)); return { raw, text: (f.endsWith('.gz') ? zlib.gunzipSync(raw) : raw).toString('latin1'), sha: sha(raw) }; };
const fail = m => { console.error('VALIDATION FAILED: ' + m); process.exit(1); };
/* byte ranges are 1-based inclusive, as in the ReadMe */
const col = (line, a, b) => line.slice(a - 1, b).trim();
const num = (line, a, b) => { const s = col(line, a, b); return s === '' ? null : +s; };
const D = Math.PI / 180, C = 299792.458;
const EQ2GAL = [[-0.0548755604, -0.8734370902, -0.4838350155], [0.4941094279, -0.4448296300, 0.7469822445], [-0.8676661490, -0.1980763734, 0.4559837762]];
const unit = (ra, de) => [Math.cos(de * D) * Math.cos(ra * D), Math.cos(de * D) * Math.sin(ra * D), Math.sin(de * D)];
const toGal = u => { const g = EQ2GAL.map(r => r[0] * u[0] + r[1] * u[1] + r[2] * u[2]); return [(Math.atan2(g[1], g[0]) / D + 360) % 360, Math.asin(Math.max(-1, Math.min(1, g[2]))) / D]; };
const sep = (l1, b1, l2, b2) => { const c = Math.sin(b1 * D) * Math.sin(b2 * D) + Math.cos(b1 * D) * Math.cos(b2 * D) * Math.cos((l1 - l2) * D); return Math.acos(Math.max(-1, Math.min(1, c))) / D; };
const galToEq = (l, b) => { const g = [Math.cos(b * D) * Math.cos(l * D), Math.cos(b * D) * Math.sin(l * D), Math.sin(b * D)]; return [0, 1, 2].map(j => EQ2GAL[0][j] * g[0] + EQ2GAL[1][j] * g[1] + EQ2GAL[2][j] * g[2]); };
const DIP = { v: 369.82, l: 264.021, b: 48.253 }, uDip = galToEq(DIP.l, DIP.b);
/* comoving distance in flat ΛCDM, Simpson on a fine grid, tabulated */
const H0 = 68.43, OM = 0.305; const ZT = [], DT = [];
{ const n = 20000, zmax = 0.2; let s = 0; ZT.push(0); DT.push(0); const E = z => Math.sqrt(OM * (1 + z) ** 3 + 1 - OM);
  for (let i = 1; i <= n; i++) { const z0 = (i - 1) / n * zmax, z1 = i / n * zmax; s += (z1 - z0) / 6 * (1 / E(z0) + 4 / E((z0 + z1) / 2) + 1 / E(z1)); ZT.push(z1); DT.push(s * C / H0); } }
const dcOfZ = z => { if (z <= 0) return 0; const i = Math.min(ZT.length - 2, Math.floor(z / ZT[ZT.length - 1] * (ZT.length - 1))); const t = (z - ZT[i]) / (ZT[i + 1] - ZT[i]); return DT[i] + t * (DT[i + 1] - DT[i]); };
const report = {};
/* ── 2MRS ── */
const M2 = read('2mrs_table3.dat.gz'), RM2 = read('2mrs_ReadMe');
const L2 = M2.text.split('\n').filter(l => l.trim()); if (L2.length !== 44599) fail(`2MRS rows ${L2.length} ≠ 44599`);
const ids = new Set(); let galDev = 0, czMissing = 0, kMissing = 0; const G2 = [];
for (const l of L2) { const id = col(l, 1, 16), ra = num(l, 18, 26), de = num(l, 28, 36), gl = num(l, 38, 46), gb = num(l, 48, 56), k = num(l, 58, 63), cz = num(l, 174, 178), ecz = num(l, 180, 182);
  if (ids.has(id)) fail('2MRS duplicate ID ' + id); ids.add(id);
  if (!(ra >= 0 && ra < 360 && de >= -90 && de <= 90)) fail('2MRS coordinates out of range ' + id);
  const g = toGal(unit(ra, de)); galDev = Math.max(galDev, sep(g[0], g[1], gl, gb));
  if (k == null) kMissing++; if (cz == null) { czMissing++; continue; }
  const u = unit(ra, de), czc = cz + DIP.v * (u[0] * uDip[0] + u[1] * uDip[1] + u[2] * uDip[2]); G2.push({ u, cz, czc, ecz, k, gb }); }
if (galDev > 0.01) fail(`2MRS galactic coordinates disagree with RA/Dec by ${galDev}°`);
report.twoMRS = { rows: L2.length, withCz: G2.length, czMissing, kMissing, duplicates: 0, maxGalacticDeviationDeg: +galDev.toFixed(5), czMin: Math.min(...G2.map(g => g.cz)), czMax: Math.max(...G2.map(g => g.cz)) };
/* ── CF4 ── */
const T2 = read('cf4_table2.dat.gz'), T3 = read('cf4_table3.dat.gz'), T4 = read('cf4_table4.dat.gz'), RM4 = read('cf4_ReadMe');
const L42 = T2.text.split('\n').filter(l => l.trim()), L43 = T3.text.split('\n').filter(l => l.trim()), L44 = T4.text.split('\n').filter(l => l.trim());
if (L42.length !== 55877) fail(`CF4 table2 rows ${L42.length} ≠ 55877`); if (L43.length !== 38053 || L44.length !== 38053) fail(`CF4 group rows ${L43.length}/${L44.length} ≠ 38053`);
const pgc = new Set(); let dev2 = 0; const C2 = [], flagged = [];
for (const l of L42) { const p = num(l, 1, 7), g1 = num(l, 9, 15), v = num(l, 23, 27), dm = num(l, 29, 34), edm = num(l, 36, 40), ra = num(l, 138, 145), de = num(l, 147, 154), gl = num(l, 156, 163), gb = num(l, 165, 172);
  if (pgc.has(p)) fail('CF4 duplicate PGC ' + p); pgc.add(p);
  if (dm == null || edm == null || v == null) fail('CF4 table2 missing DM/Vcmb for PGC ' + p);
  if (!(ra >= 0 && ra < 360 && de >= -90 && de <= 90)) fail('CF4 table2 coordinates out of range ' + p);
  const g = toGal(unit(ra, de)), dd = sep(g[0], g[1], gl, gb); if (dd > 0.01) flagged.push({ pgc: p, deg: +dd.toFixed(3) }); else dev2 = Math.max(dev2, dd); C2.push({ u: unit(ra, de), v, dm, edm, g1 }); }
/* four CF4-assigned PGC 900xxxx rows carry galactic coordinates that disagree with their own RA/Dec by 0.26–0.92°:
   RA/Dec (J2000) are taken as primary, the rows are kept and listed by name; more than ten such rows stops the build */
if (flagged.length > 10) fail(`CF4 table2: ${flagged.length} rows with galactic coordinates inconsistent with RA/Dec`);
const grp = new Set(); let dev4 = 0, distDev = 0, order = 0; const C4 = [];
for (let i = 0; i < L44.length; i++) { const l = L44[i], p = num(l, 1, 7), dm = num(l, 9, 14), edm = num(l, 16, 20), dist = num(l, 22, 26), v3k = num(l, 40, 44), fv = num(l, 46, 50), vpec = num(l, 65, 69), ra = num(l, 84, 91), de = num(l, 93, 100), gl = num(l, 102, 109), gb = num(l, 111, 118);
  if (grp.has(p)) fail('CF4 duplicate group ' + p); grp.add(p); if (num(L43[i], 1, 7) !== p) order++;
  if ([dm, edm, dist, v3k, vpec, ra, de].some(x => x == null)) fail('CF4 table4 missing value for group ' + p);
  const g = toGal(unit(ra, de)); dev4 = Math.max(dev4, sep(g[0], g[1], gl, gb));
  const dl = Math.pow(10, (dm - 25) / 5); distDev = Math.max(distDev, Math.abs(dl - dist) - 0.05 - 1e-3 * dist);   /* Dist is F5.1: half a unit of rounding, plus 0.1 % for the 3-decimal DM */
  C4.push({ u: unit(ra, de), dm, edm, dist, v3k, fv, vpec }); }
if (order) fail(`CF4 table3/table4 order differs in ${order} rows`); if (dev4 > 0.01) fail(`CF4 table4 galactic coordinates disagree by ${dev4}°`); if (distDev > 0) fail(`CF4 table4 Dist disagrees with DM beyond rounding by ${distDev} Mpc`);
report.cf4 = { galaxies: L42.length, groups: L44.length, duplicates: 0, galacticInconsistentRows: flagged, maxGalacticDeviationDeg: +Math.max(dev2, dev4).toFixed(5), distVsDmBeyondRoundingMpc: Math.max(0, +distDev.toFixed(4)), table3Table4SameOrder: true, missingInRequiredColumns: 0 };
/* ── encode ── */
const Q2 = 0.05, Q4 = 0.025;   /* Mpc per unit of the int16 positions */
const p2 = new Int16Array(G2.length * 3), k2 = new Uint8Array(G2.length);
G2.forEach((g, i) => { const d = dcOfZ(g.czc / C); if (d / Q2 > 32767) fail('2MRS distance overflows the encoding'); for (let a = 0; a < 3; a++) p2[3 * i + a] = Math.round(g.u[a] * d / Q2); k2[i] = Math.max(0, Math.min(255, Math.round((g.k ?? 12.75) * 20))); });
const enc4 = (rows, dmKey) => { const p = new Int16Array(rows.length * 3), e = new Uint8Array(rows.length), v = new Int16Array(rows.length);
  rows.forEach((r, i) => { const dl = Math.pow(10, (r[dmKey] - 25) / 5), z = Math.max(0, (r.v3k ?? r.v) / C), dc = dl / (1 + z); if (dc / Q4 > 32767) fail('CF4 distance overflows the encoding');
    for (let a = 0; a < 3; a++) p[3 * i + a] = Math.round(r.u[a] * dc / Q4); e[i] = Math.max(0, Math.min(255, Math.round(r.edm * 100))); v[i] = Math.max(-32767, Math.min(32767, Math.round(r.vpec ?? r.v))); }); return { p, e, v }; };
const g4 = enc4(C4, 'dm'), g2 = enc4(C2, 'dm');
const b64 = a => Buffer.from(a.buffer, a.byteOffset, a.byteLength).toString('base64');
const blob = { m2p: b64(p2), m2k: b64(k2), cgp: b64(g4.p), cge: b64(g4.e), cgv: b64(g4.v), ccp: b64(g2.p), cce: b64(g2.e), ccv: b64(g2.v) };
const META = { generated: 'scripts/build-2mrs-cf4.mjs', frame: 'J2000 equatorial Cartesian Mpc, x toward RA 0 Dec 0, z toward Dec +90',
  twoMRS: { source: 'Huchra et al. 2012, ApJS 199, 26 — CDS J/ApJS/199/26/table3', sha256: M2.sha, readmeSha256: RM2.sha, n: G2.length, qMpc: Q2, space: 'redshift space: barycentric cz → CMB frame (Planck dipole 369.82 km/s, l 264.021, b 48.253) → comoving distance, flat ΛCDM H0 68.43, Ωm 0.305', kScale: 'uint8 = 20·Kc (mag)', ...report.twoMRS },
  cf4: { source: 'Tully et al. 2023, ApJ 944, 94 — CDS J/ApJ/944/94/table2, table3, table4', sha256: { table2: T2.sha, table3: T3.sha, table4: T4.sha }, readmeSha256: RM4.sha, qMpc: Q4,
    space: 'distance space: measured luminosity distance (zero point TRGB/Cepheid/maser) → comoving d_L/(1+z_cmb); groups carry the published peculiar velocity Vpec (km/s, eq. 11); galaxies carry Vcmb', eScale: 'uint8 = 100·e_DM (mag)', ...report.cf4 },
  dipole: DIP };
let s = fs.readFileSync(INDEX, 'utf8');
const tag = `<script type="application/json" id="hcc-2mrs-cf4">${JSON.stringify(blob)}</script>`;
s = /<script type="application\/json" id="hcc-2mrs-cf4">[\s\S]*?<\/script>/.test(s) ? s.replace(/<script type="application\/json" id="hcc-2mrs-cf4">[\s\S]*?<\/script>/, tag) : s.replace('<script type="application/json" id="hcc-local-web">', tag + '\n<script type="application/json" id="hcc-local-web">');
const metaLine = `const SURVEY_META=Object.freeze(${JSON.stringify(META)});`;
s = /const SURVEY_META=Object\.freeze\(.*\);/.test(s) ? s.replace(/const SURVEY_META=Object\.freeze\(.*\);/, metaLine) : s.replace('const LOCAL_WEB_META=Object.freeze(', metaLine + '\nconst LOCAL_WEB_META=Object.freeze(');
fs.writeFileSync(INDEX, s);
console.log(JSON.stringify(report, null, 1)); console.log('embedded', Math.round(tag.length / 1024), 'KB');
