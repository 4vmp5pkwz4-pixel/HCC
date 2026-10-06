#!/usr/bin/env node
/* EVERY CONFIRMED EXOPLANET, embedded in index.html (v4.363).
   Source: NASA Exoplanet Archive, Planetary Systems Composite Parameters (pscomppars), fetched by its TAP service
   (https://exoplanetarchive.ipac.caltech.edu/TAP/sync?query=select ... from pscomppars&format=csv), SHA-256 recorded.
   Validated before anything is written (stops on failure): non-empty unique planet names; RA ∈ [0,360), Dec ∈ [−90,90];
   distances positive where given; every host's declared sy_pnum against the planets listed for it (differences are
   counted and reported — the composite table may list fewer than a system is known to hold); missing values counted.
   Embedded per host (J2000 equatorial unit vector × distance in pc; hosts without a distance are kept on the sky
   with d = 0 and flagged) and per planet (a, R, M, P, T_eq, year, method). Usage: node scripts/build-exoplanets.mjs <csv> [index.html] */
import fs from 'node:fs'; import path from 'node:path'; import crypto from 'node:crypto';
const CSV = process.argv[2], INDEX = process.argv[3] || path.join(path.dirname(new URL(import.meta.url).pathname), '..', 'index.html');
const raw = fs.readFileSync(CSV), SHA = crypto.createHash('sha256').update(raw).digest('hex'), fail = m => { console.error('VALIDATION FAILED: ' + m); process.exit(1); };
const parse = line => { const out = []; let cur = '', q = false; for (const ch of line) { if (ch === '"') q = !q; else if (ch === ',' && !q) { out.push(cur); cur = ''; } else cur += ch; } out.push(cur); return out; };
const lines = raw.toString('utf8').split('\n').filter(l => l.trim()), head = parse(lines[0]), rows = lines.slice(1).map(parse);
const H = Object.fromEntries(head.map((h, i) => [h, i])), need = ['pl_name', 'hostname', 'ra', 'dec', 'sy_dist', 'sy_pnum', 'pl_orbsmax', 'pl_rade', 'pl_bmasse', 'pl_orbper', 'pl_eqt', 'disc_year', 'discoverymethod', 'st_teff'];
for (const k of need) if (!(k in H)) fail('missing column ' + k);
const num = (r, k) => { const s = r[H[k]]; return s === '' || s == null ? null : +s; }, METHODS = [];
const names = new Set(), hosts = new Map(), miss = Object.fromEntries(need.map(k => [k, 0]));
for (const r of rows) { if (r.length !== head.length) fail('ragged row ' + r[0]); for (const k of need) if (r[H[k]] === '') miss[k]++;
  const n = r[H.pl_name]; if (!n) fail('empty planet name'); if (names.has(n)) fail('duplicate planet ' + n); names.add(n);
  const ra = num(r, 'ra'), de = num(r, 'dec'), d = num(r, 'sy_dist'); if (!(ra >= 0 && ra < 360 && de >= -90 && de <= 90)) fail('coordinates out of range ' + n); if (d != null && !(d > 0)) fail('non-positive distance ' + n);
  const h = r[H.hostname]; if (!hosts.has(h)) hosts.set(h, { name: h, ra, de, d, teff: num(r, 'st_teff'), pnum: num(r, 'sy_pnum'), planets: [] });
  const m = r[H.discoverymethod]; if (!METHODS.includes(m)) METHODS.push(m);
  hosts.get(h).planets.push({ n, a: num(r, 'pl_orbsmax'), R: num(r, 'pl_rade'), M: num(r, 'pl_bmasse'), P: num(r, 'pl_orbper'), T: num(r, 'pl_eqt'), y: num(r, 'disc_year'), m: METHODS.indexOf(m) }); }
let pnumDiff = 0, hostsNoDist = 0; for (const h of hosts.values()) { if (h.pnum !== h.planets.length) pnumDiff++; if (h.d == null) hostsNoDist++; }
const HL = [...hosts.values()], D = Math.PI / 180, f32 = a => Buffer.from(new Float32Array(a).buffer).toString('base64');
const hp = [], hi = [], pa = [];
for (const h of HL) { const u = [Math.cos(h.de * D) * Math.cos(h.ra * D), Math.cos(h.de * D) * Math.sin(h.ra * D), Math.sin(h.de * D)], d = h.d ?? 0; hp.push(u[0] * d, u[1] * d, u[2] * d, h.teff ?? 0, h.planets.length, h.ra, h.de); }
HL.forEach((h, k) => h.planets.forEach(p => { hi.push(k); pa.push(p.a ?? -1, p.R ?? -1, p.M ?? -1, p.P ?? -1, p.T ?? -1, p.y ?? 0, p.m); }));
const blob = { h: f32(hp), hn: HL.map(h => h.name), pi: Buffer.from(new Uint16Array(hi).buffer).toString('base64'), p: f32(pa), pn: HL.flatMap(h => h.planets.map(p => p.n)) };
const META = { generated: 'scripts/build-exoplanets.mjs', source: 'NASA Exoplanet Archive, Planetary Systems Composite Parameters (pscomppars), TAP', sha256: SHA, planets: rows.length, hosts: HL.length, methods: METHODS,
  hostsWithoutDistance: hostsNoDist, hostsWhosePnumDiffersFromListed: pnumDiff, missing: miss, frame: 'J2000 equatorial Cartesian pc (x → RA 0, z → Dec +90)', hostStride: 7, planetStride: 7, planetFields: ['a_AU', 'R_earth', 'M_earth', 'P_days', 'Teq_K', 'year', 'method'] };
let s = fs.readFileSync(INDEX, 'utf8'); const tag = `<script type="application/json" id="hcc-exoplanets">${JSON.stringify(blob)}</script>`;
s = /<script type="application\/json" id="hcc-exoplanets">[\s\S]*?<\/script>/.test(s) ? s.replace(/<script type="application\/json" id="hcc-exoplanets">[\s\S]*?<\/script>/, () => tag) : s.replace('<script type="application/json" id="hcc-2mrs-cf4">', tag + '\n<script type="application/json" id="hcc-2mrs-cf4">');
const ml = `const EXO_META=Object.freeze(${JSON.stringify(META)});`;
s = /const EXO_META=Object\.freeze\(.*\);/.test(s) ? s.replace(/const EXO_META=Object\.freeze\(.*\);/, () => ml) : s.replace('const SURVEY_META=Object.freeze(', ml + '\nconst SURVEY_META=Object.freeze(');
fs.writeFileSync(INDEX, s); console.log(JSON.stringify(META, null, 1)); console.log('embedded', Math.round(tag.length / 1024), 'KB');
