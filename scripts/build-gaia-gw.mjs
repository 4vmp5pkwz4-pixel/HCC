#!/usr/bin/env node
/* THE STARS WITHIN 50 PC (Gaia DR3) AND EVERY CATALOGUED GRAVITATIONAL-WAVE EVENT (GWTC), embedded (v4.364).
   Gaia DR3 — ESA Gaia archive TAP (gaiadr3.gaia_source), the query recorded in the metadata: parallax > 20 mas,
     parallax_over_error > 10, ruwe < 1.4 (good single-star astrometry, so 1/parallax is an unbiased distance to ~1 %).
     Validated: unique source_id, ranges, the cuts themselves, missing photometry and radial velocities counted.
     Positions are carried from the catalogue epoch J2016.0 to J2000.0 by their proper motions; each star keeps its
     space velocity (km/s, J2000 equatorial; the radial part only where Gaia measured one — flagged) so the time
     machine can move it in a straight line (valid for ~1 Myr; the Galaxy's pull is not integrated).
   GWTC — the GWOSC event API (https://gwosc.org/eventapi/json/GWTC/), all catalogue releases. Validated: unique names,
     events with a luminosity distance and source masses kept, the rest counted by release. Sky positions are not part of
     the catalogue (localisations are tens to thousands of square degrees): an event is a distance, not a point — except
     GW170817, whose host NGC 4993 is known.
   Usage: node scripts/build-gaia-gw.mjs <gaia.csv> <gwtc.json> [index.html] */
import fs from 'node:fs'; import path from 'node:path'; import crypto from 'node:crypto';
const [GA, GW] = process.argv.slice(2), INDEX = process.argv[4] || path.join(path.dirname(new URL(import.meta.url).pathname), '..', 'index.html');
const fail = m => { console.error('VALIDATION FAILED: ' + m); process.exit(1); }, sha = b => crypto.createHash('sha256').update(b).digest('hex');
const QUERY = 'SELECT source_id, ra, dec, parallax, parallax_error, pmra, pmdec, radial_velocity, phot_g_mean_mag, bp_rp, ruwe FROM gaiadr3.gaia_source WHERE parallax > 20 AND parallax_over_error > 10 AND ruwe < 1.4';
/* ── Gaia ── */
const graw = fs.readFileSync(GA), gl = graw.toString('utf8').trim().split('\n'), gh = gl[0].split(','), G = Object.fromEntries(gh.map((h, i) => [h, i]));
const ids = new Set(), D = Math.PI / 180, K = 4.740470463533348, DT = -16.0;   /* km/s per (arcsec/yr · pc); J2016.0 → J2000.0 */
const pos = [], vel = [], phot = []; let noRV = 0, noBP = 0, noG = 0, maxCut = 0;
for (const line of gl.slice(1)) { const c = line.split(','), v = k => c[G[k]] === '' ? null : +c[G[k]];
  const id = c[G.source_id]; if (ids.has(id)) fail('duplicate source_id ' + id); ids.add(id);
  const ra = v('ra'), de = v('dec'), plx = v('parallax'), pe = v('parallax_error'), pmra = v('pmra'), pmde = v('pmdec'), rv = v('radial_velocity'), g = v('phot_g_mean_mag'), br = v('bp_rp'), ruwe = v('ruwe');
  if (!(ra >= 0 && ra < 360 && de >= -90 && de <= 90)) fail('coordinates out of range ' + id);
  if (!(plx > 20 && plx / pe > 10 && ruwe < 1.4)) fail('row outside the query cuts ' + id);
  if (pmra == null || pmde == null) fail('missing proper motion ' + id);
  if (rv == null) noRV++; if (br == null) noBP++; if (g == null) noG++;
  const d = 1000 / plx, cd = Math.cos(de * D), ra0 = ra + pmra * DT / 3.6e6 / Math.max(cd, 1e-9), de0 = de + pmde * DT / 3.6e6;
  const a = ra0 * D, b = de0 * D, u = [Math.cos(b) * Math.cos(a), Math.cos(b) * Math.sin(a), Math.sin(b)], ea = [-Math.sin(a), Math.cos(a), 0], eb = [-Math.sin(b) * Math.cos(a), -Math.sin(b) * Math.sin(a), Math.cos(b)];
  const va = K * pmra / 1000 * d, vb = K * pmde / 1000 * d, vr = rv ?? 0;
  pos.push(u[0] * d, u[1] * d, u[2] * d); vel.push(...[0, 1, 2].map(k => vr * u[k] + va * ea[k] + vb * eb[k]), rv == null ? 0 : 1); phot.push(g ?? 25, br ?? -9);
  maxCut = Math.max(maxCut, d); }
if (ids.size !== gl.length - 1) fail('row count');
const f32 = a => Buffer.from(new Float32Array(a).buffer).toString('base64');
const gaia = { n: ids.size, p: f32(pos), v: f32(vel), ph: f32(phot) };
const GMETA = { source: 'Gaia DR3 (gaiadr3.gaia_source), ESA Gaia archive TAP', query: QUERY, sha256: sha(graw), n: ids.size, withRV: ids.size - noRV, withoutRV: noRV, withoutBpRp: noBP, withoutG: noG, maxPc: +maxCut.toFixed(3),
  epoch: 'positions propagated J2016.0 → J2000.0 by proper motion', frame: 'J2000 equatorial Cartesian pc; velocities km/s (radial part zero where Gaia has none, flagged)', velocityStride: 4, photStride: 2 };
/* ── GWTC ── */
const wraw = fs.readFileSync(GW), ev = JSON.parse(wraw.toString('utf8')).events, names = new Set(), byCat = {}, rows = [];
for (const e of Object.values(ev)) { if (names.has(e.commonName)) fail('duplicate event ' + e.commonName); names.add(e.commonName); const c = e['catalog.shortName']; byCat[c] = byCat[c] || { all: 0, kept: 0 }; byCat[c].all++;
  if (!(e.luminosity_distance > 0 && e.mass_1_source > 0 && e.mass_2_source > 0)) continue; byCat[c].kept++;
  rows.push({ n: e.commonName, c, dL: e.luminosity_distance, dLlo: e.luminosity_distance_lower, dLhi: e.luminosity_distance_upper, m1: e.mass_1_source, m2: e.mass_2_source, mc: e.chirp_mass_source, mf: e.final_mass_source, z: e.redshift, snr: e.network_matched_filter_snr, chi: e.chi_eff, pa: e.p_astro, gps: e.GPS }); }
rows.sort((a, b) => a.gps - b.gps);
const GWMETA = { source: 'GWOSC event API, GWTC (all releases): https://gwosc.org/eventapi/json/GWTC/', sha256: sha(wraw), events: names.size, kept: rows.length, byCatalog: byCat,
  note: 'luminosity distance in Mpc and source-frame masses in solar masses as published (medians, 90 % intervals); no sky positions in the catalogue', host170817: { name: 'NGC 4993', ra: 197.448776, dec: -23.383831, vHubble: 3017, vHubbleErr: 166, src: 'Abbott et al. 2017, Nature 551, 85' } };
let s = fs.readFileSync(INDEX, 'utf8');
const put = (id, obj, before) => { const tag = `<script type="application/json" id="${id}">${JSON.stringify(obj)}</script>`, re = new RegExp(`<script type="application/json" id="${id}">[\\s\\S]*?<\\/script>`);
  s = re.test(s) ? s.replace(re, () => tag) : s.replace(before, tag + '\n' + before); return tag.length; };
const k1 = put('hcc-gaia50', gaia, '<script type="application/json" id="hcc-exoplanets">'), k2 = put('hcc-gwtc', rows, '<script type="application/json" id="hcc-exoplanets">');
const metaLine = `const GAIA50_META=Object.freeze(${JSON.stringify(GMETA)});\nconst GWTC_META=Object.freeze(${JSON.stringify(GWMETA)});`;
s = /const GAIA50_META=Object\.freeze\(.*\);\nconst GWTC_META=Object\.freeze\(.*\);/.test(s) ? s.replace(/const GAIA50_META=Object\.freeze\(.*\);\nconst GWTC_META=Object\.freeze\(.*\);/, () => metaLine) : s.replace('const EXO_META=Object.freeze(', metaLine + '\nconst EXO_META=Object.freeze(');
fs.writeFileSync(INDEX, s); console.log(JSON.stringify({ gaia: GMETA, gw: { events: GWMETA.events, kept: GWMETA.kept, byCatalog: byCat } }, null, 1)); console.log('embedded', Math.round(k1 / 1024), '+', Math.round(k2 / 1024), 'KB');
