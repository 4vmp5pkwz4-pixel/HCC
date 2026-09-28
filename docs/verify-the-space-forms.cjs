#!/usr/bin/env node
'use strict';
/* ══ SPACE FORMS S³/Γ ═══════════════════════════════════════════════════════════════════════
 * The spectra of the spherical space forms, from the Spin(4) dictionary by a character sum, and whether matched
 * circles could appear in the sky on this atlas's curvature posterior. Checked:
 *   1. every invariant dimension (1/|Γ|)Σχ is an integer, and the class counts sum to |Γ|
 *   2. the spectra are the known ones: the Poincaré space keeps k = 0, 12, 20, 24, 30, 32, 36, 40 below 42 — the
 *      Molien series (1 + t³⁰)/((1 − t¹²)(1 − t²⁰)) of I* — the octahedral first mode is 8, the tetrahedral 6;
 *      binary groups contain −1, so no odd k survives in them
 *   3. Weyl's law as an invariant: Σ m_k / Σ (k+1)² → 1/|Γ| (within 1% at k = 400)
 *   4. the images of the observer are the group: the orbit has |Γ| points, and for I* each has 12 nearest
 *      neighbours at 36° — the 600-cell
 *   5. the circle criterion: circles exist iff θ_min R < 2χ_LSS; R_max = 144 Gly for I*, and the circle radius
 *      from cos α = tan(θ_min/2)·cot(χ/R) is real exactly then
 *   6. on the atlas's own posterior every binary polyhedral space is hidden (P below the first quantile), while
 *      L(60,1) lies inside the band
 *   7. wiring
 */
const fs = require('node:fs'), path = require('node:path');
const SRC = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
let pass = 0, fail = 0;
const ok = (n, c, d) => { if (c) { pass++; console.log('  PASS — ' + n + (d ? ' :: ' + d : '')); } else { fail++; console.log('  FAIL — ' + n + (d ? ' :: ' + d : '')); } };
(async () => {
  const K = await import(path.join(__dirname, '..', 'core', 'atlas', 'extracted.mjs'));
  const { SG_GROUPS, sgInvariantDim, sgSpectrum, sgFirstMode, sgThetaMin, sgCircles, sgOrbit, sgPosteriorBelow, ctChiOfZ } = K;
  { let bad = 0; for (const g of SG_GROUPS) { if (g.classes.reduce((a, c) => a + c[1], 0) !== g.order) bad++; for (let k = 0; k <= 80; k++) { const d = sgInvariantDim(g, k / 2); if (Math.abs(d - Math.round(d)) > 1e-8) bad++; } }
    ok('every invariant dimension is an integer and the classes sum to |Γ|', bad === 0, `${SG_GROUPS.length} groups × 81 degrees`); }
  { const I = sgSpectrum('Istar', 41).filter(x => x.mult > 0).map(x => x.k), mol = []; for (let k = 0; k <= 41; k++) { let c = 0; for (let a = 0; 12 * a <= k; a++) for (let b = 0; 12 * a + 20 * b <= k; b++) { const r = k - 12 * a - 20 * b; if (r === 0 || r === 30) c++; } if (c) mol.push(k); }
    const odd = ['Tstar', 'Ostar', 'Istar', 'D3'].every(id => sgSpectrum(id, 41).every(x => x.k % 2 === 0 || x.mult === 0));
    ok('the spectra are the known ones: the Poincaré space\'s modes are the Molien series of I*, the octahedral starts at 8, the tetrahedral at 6, and binary groups keep no odd k',
      JSON.stringify(I) === JSON.stringify(mol) && sgFirstMode('Ostar') === 8 && sgFirstMode('Tstar') === 6 && odd && sgSpectrum('Istar', 12)[12].mult === 13, `I*: ${I.join(', ')}`); }
  { const r = SG_GROUPS.filter(g => g.id !== 'S3').map(g => { let N = 0, M = 0; for (const x of sgSpectrum(g.id, 400)) { N += x.mult; M += (x.k + 1) ** 2; } return { id: g.id, v: N / M * g.order }; });
    ok('Weyl\'s law as an invariant: Σ m_k / Σ (k+1)² → 1/|Γ|', r.every(x => Math.abs(x.v - 1) < 0.01), r.map(x => `${x.id} ${x.v.toFixed(4)}`).join(' · ')); }
  { const O = sgOrbit('Istar'), th = sgThetaMin('Istar'); let nb = new Set(); for (let i = 0; i < O.length; i++) { let c = 0; for (let j = 0; j < O.length; j++) if (i !== j) { const d = O[i].reduce((a, v, k) => a + v * O[j][k], 0); if (Math.abs(Math.acos(Math.max(-1, Math.min(1, d))) - th) < 1e-6) c++; } nb.add(c); }
    ok('the images of the observer are the group: |orbit| = |Γ| for every space form, and for I* each image has 12 nearest neighbours at 36° — the 600-cell',
      SG_GROUPS.every(g => sgOrbit(g.id).length === g.order) && nb.size === 1 && nb.has(12) && Math.abs(th * 180 / Math.PI - 36) < 1e-9, `orbits ${SG_GROUPS.map(g => sgOrbit(g.id).length).join(',')}`); }
  { const chi = ctChiOfZ(1089.89), a = sgCircles('Istar', 143, chi), b = sgCircles('Istar', 145, chi);
    ok('the circle criterion: circles exist iff θ_min R < 2χ_LSS — R_max = 144 Gly for the Poincaré space, a real circle just inside it and none just outside',
      Math.abs(a.RmaxGly - 2 * chi / (Math.PI / 5)) < 1e-9 && a.exists && !b.exists && a.RmaxGly > 143 && a.RmaxGly < 144.5, `R_max ${a.RmaxGly.toFixed(2)} Gly · α(143) ${a.alphaDeg.toFixed(2)}°`); }
  { const shells = [414, 563, 887, 1739, 4540].map(R => ({ RcGly: R })), chi = ctChiOfZ(1089.89), P = id => sgPosteriorBelow(sgCircles(id, 1000, chi).RmaxGly, shells);
    ok('on the atlas\'s own posterior the binary polyhedral spaces are hidden — below the first quantile — while L(60,1) sits inside the band',
      ['Tstar', 'Ostar', 'Istar'].every(id => P(id).bound === '<') && P('L60').bound === '=' && P('L60').p > 0.1, `L(60,1): R_max ${sgCircles('L60', 1000, chi).RmaxGly.toFixed(0)} Gly, P ${(P('L60').p * 100).toFixed(1)}%`); }
  ok('wiring: declared, routed, in the API, related to SU(2) and the CMB, and in the discovery ledger',
    /\{id:'s3gamma', category:'geom',/.test(SRC) && /sgGroupNode\.visible = \(v==='s3gamma'\);/.test(SRC) && /id:'s3gamma', world:'s3', lab:'s3gamma',/.test(SRC) && /\['s3gamma','su2','representation'/.test(SRC) && /\{id:'pdsHidden', kind:'found'/.test(SRC));
  console.log('\n  ' + pass + ' passed, ' + fail + ' failed'); process.exit(fail ? 1 : 0);
})();
