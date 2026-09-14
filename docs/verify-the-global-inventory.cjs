#!/usr/bin/env node
'use strict';
/* ══ WHAT A COMPACT SLICE BUYS, AND WHAT IT DOES NOT ══════════════════════════
 *
 * The globalization theorem is one line, and it is the entire reason to assume a
 * compact topology:
 *
 *      Q_S³ = ∫ q dV = 2π² R_c³ q̄
 *
 * In a non-compact or metrically unspecified universe "the total amount of X" is
 * usually not an observable, because the global volume need not be known. On a
 * round S³ with a measured R_c it IS one, for ANY statistically homogeneous mean
 * density. So this file does not check nine special numbers — it checks one
 * function applied nine times, against the reference output of an independent
 * implementation, and checks that a tenth density would work the same way.
 *
 * EVERY INVENTORY INHERITS |Ω_K|^(−3/2), and that is the sensitivity law rather
 * than a footnote. The 95% conditional band spans ×1319 in volume, so each total
 * is reported with that band and not with its own measurement error: quoting ±10%
 * on a stellar density beside a ×1319 volume is arithmetic that flatters itself.
 *
 * TWO RATIOS ESCAPE IT ENTIRELY. η = N_b/N_γ and the census fractions are
 * inventory-over-inventory, so the volume cancels and the curvature band with it.
 * Those are the sharpest numbers the reconstruction produces, and this file checks
 * that they carry no band — because a band on a quantity that cannot have one
 * would be as wrong as a missing band on one that must.
 *
 * MASS IS NOT COUNT. Compactness makes a total MASS well defined once a mean
 * density is known; it does not define the number of galaxies, haloes or black
 * holes, because a steep enough low-mass tail makes ∫φ dM cutoff-dependent or
 * divergent while ∫Mφ dM stays finite. The source has to say so.
 *
 * AND THE DISCRETE SPECTRUM IS NOT A NOVELTY CLAIM. n(n+2)/R_c² with degeneracy
 * (n+1)² is exact geometry, and closed-universe Boltzmann codes have used it for
 * decades. "Replace the continuous k integral by the discrete S³ spectrum" is a
 * description of what CAMB and CLASS already do, not a correction to them.
 */
const fs = require('node:fs'), path = require('node:path');
const ROOT = path.join(__dirname, '..');
const src = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
let pass = 0, fail = 0;
const ok = (n, c, d) => { if (c) { pass++; console.log('  PASS — ' + n + (d ? ' :: ' + d : '')); }
  else { fail++; console.log('  FAIL — ' + n + (d ? ' :: EXPECTED ' + d : '')); } };

const BLOCK = (() => {
  const i = src.indexOf('/* ══ THE CONDITIONAL RECONSTRUCTION');
  const j = src.indexOf('/* ONE AUTHORITY FOR EVERY WORLD-SCALE SEAM.');
  if (i < 0 || j < 0) throw new Error('reconstruction block not found');
  return src.slice(i, j);
})();
const A = new Function(BLOCK + '\nreturn {S3, S3R, HCC_S3R, HCC_S3C, HCC_S3_CENSUS, HCC_CBL,'
  + ' hccS3Inventory, hccCBLCurvature, hccCBLSensitivity, hccSlopeSuppression, hccS3Eigen};')();
const I = A.hccS3Inventory(), C = A.HCC_S3C, rel = (a, b) => Math.abs(a - b) / Math.abs(b);

/* 1 ── every inventory against the reference output */
{ const rows = [
    ['M_m', I.matter.median, 3.124943922296e58],
    ['M_b', I.baryons.median, 4.894578441740e57],
    ['N_b', I.nucleons.median, 2.926290972157e84],
    ['N_γ', I.photons.median, 4.784298413547e93],
    ['N_ν', I.neutrinos.median, 3.914425974720e93],
    ['E_CMB', I.cmbEnergy.median, 4.862927016204e71],
    ['S_γ/k_B', I.cmbEntropy.median, 1.723098903680e94],
    ['E_X', I.darkEnergy.median, 6.401401769853e75],
    ['η', I.eta, 6.116447427006e-10],
    ['T_ν', I.T_nu, 1.945354564]];
  const bad = rows.filter(([, g, w]) => !(rel(g, w) < 1e-9));
  ok('every global inventory reproduces the reference implementation, which was written in another language',
    bad.length === 0,
    rows.map(([n, g, w]) => `${n} ${rel(g, w).toExponential(1)}`).join(' · ')
    + (bad.length ? ` · FAILED ${bad.map(r => r[0]).join(', ')}` : ''));
  ok('and they are one function applied many times rather than a table of special cases',
    /globalize:qbar=>2\*Math\.PI\*Math\.PI\*Rc\*Rc\*Rc\*qbar/.test(src)
    && Math.abs(A.S3R.globalize(1) - 2 * Math.PI ** 2 * Math.pow(A.S3R.Rc, 3)) < 1e-60
    && rel(A.S3R.globalize(A.HCC_S3R.Omega_m * A.S3R.rhoC), 3.124943922296e58) < 1e-10,
    'Q = 2π²R_c³ q̄ — hand it a tenth mean density and it globalizes that too');
}

/* 2 ── the astrophysical census, and the fractions that survive the band */
{ const c = I.census;
  ok('the z≈0 baryon census globalizes to the published masses',
    rel(c.stars.median, 2.14e56) < 3e-3 && rel(c.hi.median, 5.02e55) < 3e-3
    && rel(c.neutral.median, 7.27e55) < 3e-3 && rel(c.hot.median, 2.64e56) < 3e-3,
    Object.keys(c).map(k => `${c[k].label} ${(c[k].median / I.msunKg).toExponential(2)} M☉`).join(' · '));
  ok('and the fractions of the baryon budget come out at the published values',
    Math.abs(100 * c.stars.fracOfBaryons - 4.37) < 0.02
    && Math.abs(100 * c.neutral.fracOfBaryons - 1.49) < 0.02
    && Math.abs(100 * c.hot.fracOfBaryons - 5.40) < 0.02
    && Math.abs(100 * I.censusFracOfBaryons - 11.3) < 0.05,
    `stars ${(100 * c.stars.fracOfBaryons).toFixed(2)}% · neutral ${(100 * c.neutral.fracOfBaryons).toFixed(2)}% · hot ${(100 * c.hot.fracOfBaryons).toFixed(2)}% · together ${(100 * I.censusFracOfBaryons).toFixed(1)}% — this is a compact-volume globalization of an external census, not a new missing-baryon measurement`);
  ok('the census rows carry their own asymmetric errors, which the curvature band then dwarfs',
    A.HCC_S3_CENSUS.every(r => r.lo > 0 && r.hi > 0 && r.hi !== r.lo)
    && I.volumeBandFactor > 1000,
    `the widest census error is ±${(100 * Math.max(...A.HCC_S3_CENSUS.map(r => r.hi / r.Om))).toFixed(0)}% against a volume band of ×${I.volumeBandFactor.toFixed(0)}`);
}

/* 3 ── the band, and the two quantities that must NOT have one */
{ ok('every extensive inventory is reported with the conditional band, from the same posterior',
    ['matter', 'baryons', 'nucleons', 'photons', 'neutrinos', 'cmbEnergy', 'cmbEntropy', 'darkEnergy']
      .every(k => I[k].lo < I[k].median && I[k].median < I[k].hi
        && Math.abs((I[k].hi / I[k].lo) / I.volumeBandFactor - 1) < 1e-9),
    `every one spans the same ×${I.volumeBandFactor.toFixed(0)} as the volume, because every one is proportional to it`);
  ok('and the two ratios carry NO band, because the volume cancels out of them exactly',
    typeof I.eta === 'number' && I.eta.lo === undefined
    && typeof I.T_nu === 'number' && I.T_nu.lo === undefined,
    'η = N_b/N_γ is inventory over inventory — the sharpest number here, and a band on it would be as wrong as a missing band on M_m');
  ok('the |Ω_K|^(−3/2) inheritance is stated where the inventories are',
    /EVERY ONE OF THEM INHERITS \|Ω_K\|\^\(−3\/2\)/.test(src)
    && /quoting ±10% on a stellar density beside a ×1319 volume would be arithmetic\s*\n\s+that flatters itself/.test(src),
    'curvature dominates the error of every global total near flatness, by orders of magnitude');
  ok('and mass is distinguished from count, which no topology supplies',
    /MASS IS NOT COUNT/.test(src)
    && /does not define the\s*\n\s+number of galaxies, haloes or black holes/.test(src)
    && /it is a benchmark and not a conserved baryon number/.test(src),
    'a steep low-mass tail makes ∫φ dM cutoff-dependent while ∫Mφ dM stays finite');
}

/* 4 ── the curvature test that assumes no dark energy */
{ const Ok = A.S3R.Ok;
  const rec = [0.4, 0.9, 1.4, 1.9].map(d => A.hccCBLCurvature(1, d, Math.sqrt(1 + Ok * d * d)));
  ok('the Clarkson–Bassett–Lu estimator recovers the curvature exactly, and the SAME value at every distance',
    rec.every(v => rel(v, Ok) < 1e-9)
    && Math.max(...rec) - Math.min(...rec) < 1e-15,
    `Ω_K recovered as ${rec[0].toExponential(10)} at four distances · redshift independence is the null test, and a significant drift would falsify FLRW itself rather than this branch`);
  ok('and it is written with no dark-energy equation of state anywhere in it',
    !/w0|wa|w\(z\)/.test((() => { const i = src.indexOf('function hccCBLCurvature'); return src.slice(i, src.indexOf('\n}', i)); })()),
    'the whole point is a test that a change of w(z) cannot absorb');

  const sens = A.hccCBLSensitivity();
  ok('the signal on this branch is two orders of magnitude below the DESI Lyα distance errors, and the atlas reports the ratio',
    sens.length === 3 && sens.every(r => Math.abs(r.suppression) < 1e-3 && r.ratio > 50 && r.ratio < 300),
    sens.map(r => `z=${r.z}: suppression ${(100 * r.suppression).toExponential(2)}% vs ${(100 * r.fracErr).toFixed(2)}% error, ratio ${r.ratio.toFixed(0)}`).join(' · ')
    + ' — a predicted effect quoted without the precision needed to see it is how a near-flat model makes itself unfalsifiable');
  ok('the three-bin Lyα measurements are carried with their published within-bin correlations',
    A.HCC_CBL.lya.length === 3
    && A.HCC_CBL.lya.every(b => b.rho < 0 && b.rho > -0.6 && b.sDM > 0 && b.sDH > 0)
    && Math.abs(A.HCC_CBL.lya[0].DM - 37.21) < 1e-12,
    'D_M/r_d and D_H/r_d are anti-correlated at about −0.47 in every bin, and a test that ignored that would overstate its own precision');
}

/* 5 ── the spectrum, and the claim it is not */
{ const e = [0, 1, 2, 3, 10].map(n => A.hccS3Eigen(n));
  ok('the scalar Laplacian spectrum is n(n+2)/R_c² with degeneracy (n+1)², exactly',
    e.every(x => Math.abs(x.eigenvalue - x.n * (x.n + 2) / (A.S3R.Rc ** 2)) < 1e-70
      && x.degeneracy === (x.n + 1) ** 2)
    && e[0].eigenvalue === 0 && e[0].degeneracy === 1,
    'the constant mode is the n = 0 eigenvalue and it is zero, which is what makes it the constant mode');
  ok('and the first non-constant mode reproduces the published k₁',
    rel(e[1].k_Mpc, 6.371810387942e-6) < 1e-11
    && Math.abs(e[1].k * A.S3R.Rc - Math.sqrt(3)) < 1e-12,
    `k₁ = √3/R_c = ${e[1].k_Mpc.toExponential(9)} Mpc⁻¹, a wavelength of ${(2 * Math.PI / e[1].k_Mpc / 1e3).toFixed(0)} Gpc — a geometric scale, not automatically a physical primordial wavelength`);
  ok('the source refuses the novelty claim that discreteness itself is a new CMB signature',
    /THE CLAIM IT IS NOT/.test(src)
    && /CAMB was written to do exactly\s*\n\s+this, and CLASS implements it independently/.test(src)
    && /is a description of what they already do/.test(src)
    && /gauge and constraint\s*\n\s+conditions remove or reorganise them/.test(src),
    'a topology-specific claim must identify something the curved-space Boltzmann treatment does not already contain, and then show it');
}

/* 6 ── the band is drawn, not just written */
{ ok('the five conditional quantiles are drawn together at true scale around the observer',
    /const obsQuantGroup=new THREE\.Group\(\); obsGroup\.add\(obsQuantGroup\);/.test(src)
    && /S3R\.shells\.forEach\(\(s,i\)=>\{/.test(src)
    && /new THREE\.SphereGeometry\(s\.RcGly,40,26\)/.test(src),
    'a posterior that has no single radius must not be drawn as though it had one');
  ok('and the drawing is the argument: the outermost shell is eleven times the innermost',
    Math.abs(A.S3R.shells[4].RcGly / A.S3R.shells[0].RcGly - 10.97) < 0.1
    && /ELEVEN TIMES the innermost/.test(src),
    `${A.S3R.shells.map(s => s.RcGly.toFixed(0)).join(' / ')} Gly · a reader who has flown between the innermost and the outermost understands the divergent mean in a way no sentence achieves`);
}

console.log(`\n  ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
