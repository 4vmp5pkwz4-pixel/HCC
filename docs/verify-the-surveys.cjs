#!/usr/bin/env node
'use strict';
/* ══ 2MRS AND COSMICFLOWS-4 IN THE ATLAS (v4.362) ═════════════════════════════════════════════════════════════════
 * The surveys are embedded by scripts/build-2mrs-cf4.mjs from the authoritative CDS/VizieR files. Checked here:
 *   1. provenance: the embedded metadata names the VizieR tables and their SHA-256, row counts match the ReadMe
 *      (44 599 / 55 877 / 38 053), no duplicates, galactic vs equatorial within 0.01° except four flagged PGC 900xxxx rows
 *   2. the decoded positions are physical: all finite, 2MRS within its cz range, CF4 within the published 773 Mpc
 *   3. the bulk-flow estimator recovers an injected flow exactly (track op)
 *   4. the measurements the ledger states: 2MRS flux dipole, CF4 bulk flow, CF4 H₀ — recomputed from the embedded data
 *   5. wired: layers, panel, extents switch with a graticule, API, ledger
 */
const fs = require('node:fs'), path = require('node:path');
const SRC = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
let pass = 0, fail = 0;
const ok = (n, c, d) => { if (c) { pass++; console.log('  PASS — ' + n + (d ? ' :: ' + d : '')); } else { fail++; console.log('  FAIL — ' + n + (d ? ' :: ' + d : '')); } };
(async () => {
  const K = await import(path.join(__dirname, '..', 'core', 'atlas', 'extracted.mjs'));
  const M = JSON.parse(SRC.match(/const SURVEY_META=Object\.freeze\((.*)\);/)[1]);
  ok('provenance: VizieR tables named and hashed; rows match the ReadMe; no duplicates; coordinates consistent, four rows flagged by name',
    /J\/ApJS\/199\/26\/table3/.test(M.twoMRS.source) && /J\/ApJ\/944\/94\/table2, table3, table4/.test(M.cf4.source) && /^[0-9a-f]{64}$/.test(M.twoMRS.sha256) && /^[0-9a-f]{64}$/.test(M.cf4.sha256.table4)
    && M.twoMRS.rows === 44599 && M.twoMRS.withCz + M.twoMRS.czMissing === 44599 && M.cf4.galaxies === 55877 && M.cf4.groups === 38053 && M.twoMRS.duplicates === 0 && M.cf4.duplicates === 0
    && M.twoMRS.maxGalacticDeviationDeg < 0.01 && M.cf4.maxGalacticDeviationDeg < 0.01 && M.cf4.galacticInconsistentRows.length === 4 && M.cf4.galacticInconsistentRows.every(r => r.pgc >= 9000000) && M.cf4.table3Table4SameOrder,
    `2MRS ${M.twoMRS.withCz} with cz (${M.twoMRS.czMissing} without) · CF4 ${M.cf4.galaxies}/${M.cf4.groups} · flagged ${M.cf4.galacticInconsistentRows.map(r => r.pgc).join(',')}`);
  const i = SRC.indexOf('id="hcc-2mrs-cf4"'), j = SRC.indexOf('>', i), k = SRC.indexOf('</script>', j), J = JSON.parse(SRC.slice(j + 1, k));
  const buf = (b, T) => { const B = Buffer.from(b, 'base64'); return new T(B.buffer.slice(B.byteOffset, B.byteOffset + B.byteLength)); };
  const d = { m2p: buf(J.m2p, Int16Array), m2k: buf(J.m2k, Uint8Array), cgp: buf(J.cgp, Int16Array), cge: buf(J.cge, Uint8Array), cgv: buf(J.cgv, Int16Array), ccp: buf(J.ccp, Int16Array), ccv: buf(J.ccv, Int16Array) };
  { const rmax = (p, q) => { let m = 0; for (let a = 0; a < p.length; a += 3) m = Math.max(m, Math.hypot(p[a], p[a + 1], p[a + 2]) * q); return m; };
    const r2 = rmax(d.m2p, M.twoMRS.qMpc), r4 = rmax(d.cgp, M.cf4.qMpc);
    ok('the decoded positions are physical: 2MRS within its cz range, CF4 within the published 773 Mpc', d.m2k.length === M.twoMRS.withCz && d.cgv.length === 38053 && d.ccv.length === 55877 && r2 < 800 && r4 < 773, `2MRS to ${r2.toFixed(0)} Mpc · CF4 groups to ${r4.toFixed(0)} Mpc`); }
  { const r = K.TRACK_OPS['survey.bulkflow'].run({ bx: 300, by: -150, bz: 80 });
    ok('the bulk-flow estimator recovers an injected flow', r.angle < 0.05 && Math.abs(r.amp - r.injected) < 0.5, `${r.amp.toFixed(2)} of ${r.injected.toFixed(2)} km/s · ${r.angle.toFixed(4)}°`); }
  { const R = [[-0.0548755604, -0.8734370902, -0.4838350155], [0.4941094279, -0.4448296300, 0.7469822445], [-0.8676661490, -0.1980763734, 0.4559837762]], D = Math.PI / 180;
    const gal = v => { const g = R.map(r => r[0] * v[0] + r[1] * v[1] + r[2] * v[2]); return [(Math.atan2(g[1], g[0]) / D + 360) % 360, Math.asin(g[2] / Math.hypot(...g)) / D]; };
    const g2e = (l, b) => { const g = [Math.cos(b * D) * Math.cos(l * D), Math.cos(b * D) * Math.sin(l * D), Math.sin(b * D)]; return [0, 1, 2].map(j2 => R[0][j2] * g[0] + R[1][j2] * g[1] + R[2][j2] * g[2]); };
    const ang = (a, b) => Math.acos(Math.max(-1, Math.min(1, (a[0] * b[0] + a[1] * b[1] + a[2] * b[2]) / Math.hypot(...a) / Math.hypot(...b)))) / D;
    const dp = K.surveyFluxDipole(d.m2p, d.m2k, M.twoMRS.qMpc, 0), dg = gal(dp.dir), da = ang(dp.dir, g2e(276, 30));
    const bf = K.surveyBulkFlow(d.cgp, M.cf4.qMpc, d.cgv, d.cge, 150, 250, 75), bg = gal(bf.B), h = K.surveyHubble(d.ccp, M.cf4.qMpc, d.ccv, 4000, 30000);
    ok('the measurements are what the ledger states: 2MRS flux dipole, CF4 bulk flow within 150 Mpc, CF4 H₀',
      Math.abs(dg[0] - 256.3) < 0.2 && Math.abs(dg[1] - 51.4) < 0.2 && Math.abs(da - 25.9) < 0.2 && Math.abs(bf.amp - 202) < 1 && Math.abs(bg[0] - 288.2) < 0.3 && Math.abs(bg[1] - 23.9) < 0.3 && Math.abs(h.median - 75.8) < 0.1
      && /numbers:\{dipoleL:256\.3, dipoleB:51\.4, dipoleToCMB:25\.9, bulkFlow150:202, bulkErr150:11, bulkL150:288\.2, bulkB150:23\.9, h0CF4:75\.8/.test(SRC),
      `dipole l ${dg[0].toFixed(1)} b ${dg[1].toFixed(1)} (${da.toFixed(1)}° from CMB) · bulk ${bf.amp.toFixed(0)} ± ${bf.err.toFixed(0)} → l ${bg[0].toFixed(1)} b ${bg[1].toFixed(1)} · H₀ ${h.median.toFixed(2)} (n ${h.n})`); }
  { const w = /function surveyBuild\(\)\{/.test(SRC) && /\$\{surveyPanelHTML\(\)\}/.test(SRC) && /try\{ surveyTick\(\); \}catch\(e\)\{\}/.test(SRC) && /globalThis\.HCC_SURVEYS=Object\.freeze\(/.test(SRC)
      && /id="extShow"/.test(SRC) && /id="extShowS"/.test(SRC) && /hccExtentGrid\(\)\.value=ex\?1:0;/.test(SRC) && /float gridLine\(float x, float n\)/.test(SRC) && /U\.body\.visible=!matter\|\|state\.showStructureExtents===true;/.test(SRC)
      && /\{id:'surveysMeasured', kind:'confirms'/.test(SRC) && /surveysMeasured:\[\{op:'nav', world:'obs'\}/.test(SRC);
    ok('wired: survey layers and panel, the extents switch in both worlds with its graticule, API and ledger', w); }
  console.log('\n  ' + pass + ' passed, ' + fail + ' failed'); process.exit(fail ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
