#!/usr/bin/env node
'use strict';
/* ══ THE REAL LOCAL WEB ═══════════════════════════════════════════════════════════════════
 * 17 300 galaxies with measured redshifts (Stellarium 23.4 catalogue, NED/HyperLEDA) are placed at their
 * comoving distances, and superclusters and voids are FOUND in the band-pass contrast δ = n₈/n₄₀
 * (scripts/build-local-web.py). This file checks, from the page alone:
 *   1. the picture is the one measured: the 64³ volume hashes to what the build recorded, and every
 *      embedded galaxy lies inside the reach
 *   2. INDEPENDENTLY OF THE GRID: counted in the raw galaxies, each found supercluster holds more galaxies
 *      than the same radial shell in the same direction (35° cone) predicts for its volume, and each of the
 *      largest voids fewer
 *   3. the rich clusters are overdense: every catalogued cluster the mask does not hide (Coma, Perseus,
 *      Virgo, Centaurus, Hercules, Hydra, Fornax) stands at δ > 1, and Norma — behind the Milky Way — is masked
 *   4. FOUND AGAINST DECLARED: the superclusters found with no name consulted fall where the atlas had
 *      placed them by hand — Perseus–Pisces within 12° and 10% in distance, Pavo–Indus and the Local
 *      Supercluster within 20°
 *   5. the voids are what they claim: mean contrast inside below the wall level 0.6, at least 80% inside the mask, radius
 *      at least 9 Mpc, and none overlapping another by more than half its radius
 *   6. wiring: the volume is sampled in the build's axis order, reads the log-depth buffer, the layer is on
 *      by default with its control, the found structures are selectable, and HCC_LOCAL_WEB answers
 */
const fs = require('node:fs'), path = require('node:path'), crypto = require('node:crypto');
const SRC = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
let pass = 0, fail = 0;
const ok = (n, c, d) => { if (c) { pass++; console.log('  PASS — ' + n + (d ? ' :: ' + d : '')); } else { fail++; console.log('  FAIL — ' + n + (d ? ' :: ' + d : '')); } };
const xyz = (ra, dec, d) => { const a = ra * Math.PI / 180, b = dec * Math.PI / 180; return [d * Math.cos(b) * Math.cos(a), d * Math.cos(b) * Math.sin(a), d * Math.sin(b)]; };

(async () => {
  const K = await import(path.join(__dirname, '..', 'core', 'atlas', 'extracted.mjs'));
  const M = K.LOCAL_WEB_META;
  const a = SRC.indexOf('<script type="application/json" id="hcc-local-web">'), j = JSON.parse(SRC.slice(SRC.indexOf('>', a) + 1, SRC.indexOf('</script>', a)));
  const vol = Buffer.from(j.vol, 'base64'), gb = Buffer.from(j.gal, 'base64'), gal = new Int16Array(gb.buffer, gb.byteOffset, gb.length / 2), n = gal.length / 3;
  const G = []; for (let i = 0; i < n; i++) G.push([gal[3 * i] / 100, gal[3 * i + 1] / 100, gal[3 * i + 2] / 100]);
  const D = G.map(p => Math.hypot(...p));

  /* 1 · integrity */
  ok('the picture is the one measured: the 64³ volume hashes to what the build recorded and every embedded galaxy lies inside the reach',
    crypto.createHash('sha256').update(vol).digest('hex') === M.volSha256 && vol.length === M.volN ** 3 && n === M.nInReach && Math.max(...D) <= M.reachMpc + 1e-6,
    `${n} galaxies of ${M.nWithZ} · reach ${M.reachMpc} Mpc · volume ${M.volN}³`);

  /* 2 · independently of the grid: raw counts against the radial shell */
  /* the same radial shell IN THE SAME DIRECTION (a 35° cone, the sphere itself excluded): the catalogue's depth varies over the sky */
  const CONE = 35 * Math.PI / 180;
  const ratio = (c, r) => { const dc = Math.hypot(...c), u = c.map(v => v / dc); let nin = 0, nsh = 0;
    for (let i = 0; i < n; i++) { const p = G[i], inside = Math.hypot(p[0] - c[0], p[1] - c[1], p[2] - c[2]) < r; if (inside) { nin++; continue; }
      if (Math.abs(D[i] - dc) < r && (p[0] * u[0] + p[1] * u[1] + p[2] * u[2]) / Math.max(D[i], 1e-9) > Math.cos(CONE)) nsh++; }
    const vsh = 2 / 3 * Math.PI * (1 - Math.cos(CONE)) * (Math.pow(dc + r, 3) - Math.pow(Math.max(0, dc - r), 3)) - 4 / 3 * Math.PI * r ** 3, vsp = 4 / 3 * Math.PI * r ** 3;
    return nin / Math.max(1e-9, nsh * vsp / Math.max(vsh, 1)); };
  { const sc = M.superclusters.filter(o => o.dMpc > 2 * Math.max(o.reffMpc, 8)).map(o => ({ name: o.name || `RA ${o.ra}`, q: ratio(xyz(o.ra, o.dec, o.dMpc), Math.max(o.reffMpc, 8)) }));   /* the Local Supercluster contains us: no shell-and-cone around it */
    const vd = M.voids.map(o => ({ r: o.reffMpc, q: ratio(xyz(o.ra, o.dec, o.dMpc), o.reffMpc), b: o.rawRatio }));
    ok('INDEPENDENTLY OF THE GRID: counted in the raw galaxies, every found supercluster we are not inside holds more than the same shell in the same direction predicts, and every void fewer than half — the JS count reproducing the build\'s',
      sc.length >= 4 && sc.every(s => s.q > 1.5) && vd.every(v => v.q < 0.5 && Math.abs(v.q - v.b) < 0.02), `superclusters ×${sc.map(s => s.q.toFixed(1)).join(', ')} · voids ×${vd.map(v => v.q.toFixed(2)).join(', ')}`); }

  /* 3 · the rich clusters */
  { const P = M.probes, seen = P.filter(p => p.density != null), norma = P.find(p => /Norma/.test(p.name));
    ok('the rich clusters are overdense: every catalogued cluster the mask does not hide stands at δ > 1, and Norma, behind the Milky Way, is masked',
      seen.length >= 7 && seen.every(p => p.density > 1) && norma && norma.density == null, seen.map(p => `${p.name.split(' ')[0]} ${p.density}`).join(' · ')); }

  /* 4 · found against declared */
  { const decl = { 'Perseus–Pisces Supercluster': [25.0, 35.0, 0.23], 'Pavo–Indus Supercluster': [315.0, -60.0, 0.235], 'Virgo (Local) Supercluster': [186.63, 12.72, 0.054] };
    const MPC = 306.601, ang = (a1, d1, a2, d2) => { const r = Math.PI / 180; return Math.acos(Math.min(1, Math.sin(d1 * r) * Math.sin(d2 * r) + Math.cos(d1 * r) * Math.cos(d2 * r) * Math.cos((a1 - a2) * r))) / r; };
    const rows = M.superclusters.filter(o => decl[o.name]).map(o => { const [ra, de, dG] = decl[o.name]; return { name: o.name, ang: ang(o.ra, o.dec, ra, de), dRel: o.dMpc / (dG * MPC) - 1 }; });
    const pp = rows.find(r => /Perseus/.test(r.name)), pi = rows.find(r => /Pavo/.test(r.name)), lo = rows.find(r => /Local/.test(r.name));
    ok('FOUND AGAINST DECLARED: with no name consulted, Perseus–Pisces falls within 12° and 10% of where the atlas placed it by hand, Pavo–Indus and the Local Supercluster within 20°',
      pp && pp.ang < 12 && Math.abs(pp.dRel) < 0.10 && pi && pi.ang < 20 && lo && lo.ang < 20, rows.map(r => `${r.name.split(' ')[0]} ${r.ang.toFixed(1)}°, ${(r.dRel * 100).toFixed(0)}%`).join(' · ')); }

  /* 5 · the voids */
  { const V = M.voids; let overlap = 0; for (let i = 0; i < V.length; i++) for (let k = i + 1; k < V.length; k++) { const a1 = xyz(V[i].ra, V[i].dec, V[i].dMpc), a2 = xyz(V[k].ra, V[k].dec, V[k].dMpc); if (Math.hypot(a1[0] - a2[0], a1[1] - a2[1], a1[2] - a2[2]) < Math.max(V[i].reffMpc, V[k].reffMpc) + 0.5 * Math.min(V[i].reffMpc, V[k].reffMpc) - 3.01) overlap++; }
    ok('the voids are what they claim: mean contrast inside below the wall level 0.6, at least 80% inside the mask, radius at least 9 Mpc, and no two overlapping beyond the finder\'s rule',
      V.length >= 10 && V.every(v => v.meanDelta < 0.6 && v.inMask >= 0.8 && v.reffMpc >= 9) && overlap === 0, `${V.length} voids · radii ${V.slice(0, 6).map(v => v.reffMpc).join(', ')}… Mpc · largest mean δ ${Math.max(...V.map(v => v.meanDelta)).toFixed(3)}`); }

  /* 6 · wiring */
  ok('wiring: the volume is sampled in the build\'s axis order and reads the log-depth buffer, the layer is on by default with its control, the found structures are selectable, and HCC_LOCAL_WEB answers',
    /texture\(uVol,p\.zyx\)/.test(SRC) && /const LOCAL_WEB=\{group:null[\s\S]{0,3200}#include <logdepthbuf_pars_fragment>/.test(SRC) && /showLocalWeb:true,/.test(SRC) && /id="localWeb"/.test(SRC)
    && /registerSel\(key,\{name:nm, mode:'obs'/.test(SRC) && /globalThis\.HCC_LOCAL_WEB=Object\.freeze/.test(SRC) && /try\{ localWebTick\(\); \}/.test(SRC));

  console.log('\n  ' + pass + ' passed, ' + fail + ' failed'); process.exit(fail ? 1 : 0);
})();
