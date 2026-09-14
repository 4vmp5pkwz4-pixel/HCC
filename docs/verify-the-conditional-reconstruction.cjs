#!/usr/bin/env node
'use strict';
/* ══ THE CONDITIONAL RECONSTRUCTION, AND THE MEAN THAT DOES NOT EXIST ═════════
 *
 * Preece & Batenin (14 September 2026) supersede the v38 fiducial this atlas
 * opened on, and the change is not a new number for an old one — it is a change
 * of KIND, which is the whole reason to make it.
 *
 * WHAT THE OLD CONSTANTS WERE. R = 548.32 Gly came from |Ω_K| = 0.0007 at
 * H₀ = 67.4, a round illustrative modulus, carried beside ten other constants
 * typed in to agree with it. Eleven numbers for one fact, with nothing in the
 * file checking they still matched.
 *
 * WHAT THE NEW ONE IS. The published DESI DR2 Lyα FS + CMB + DES-Dovekie
 * ΛCDM+Ω_K marginal is 10³Ω_K = 2.20 ± 1.00 — a POSITIVE central value, so the
 * data mildly prefer the OPEN sign. The round-S³ hypothesis needs Ω_K < 0, so
 * the honest operation is to condition on that hard sign and report what is left:
 * 1.390% of the posterior, conditional median Ω_K = −2.5975×10⁻⁴, R_c = 886.59
 * Gly. This file checks that the atlas says all of that and not just the radius.
 *
 * AND THE MEAN OF THE VOLUME DOES NOT EXIST. V ∝ |Ω_K|^(−3/2) with the density
 * finite at the flat boundary, so E[R_c^m] diverges for m ≥ 2. A posterior mean
 * "size of the Universe" is not large, it is undefined — so the checks below
 * require quantiles and a band, and require the divergence to be DEMONSTRATED
 * numerically rather than asserted in a sentence.
 *
 * THE ARITHMETIC IS CHECKED AGAINST THE AUTHORS' OWN REFERENCE OUTPUT, which is
 * the rarest thing a reimplementation can have: an independent implementation in
 * another language printing twelve significant figures. Every quantity below is
 * compared with it, and the tolerances are tight enough that the three-line error
 * function tried first — accurate to 1.2×10⁻⁷, which sounds like plenty — fails
 * them. It has to: the conditioning happens 2.2σ into a tail, where a relative
 * error in Φ becomes a far larger one in Φ⁻¹.
 */
const fs = require('node:fs'), path = require('node:path');
const ROOT = path.join(__dirname, '..');
const src = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
let pass = 0, fail = 0;
const ok = (n, c, d) => { if (c) { pass++; console.log('  PASS — ' + n + (d ? ' :: ' + d : '')); }
  else { fail++; console.log('  FAIL — ' + n + (d ? ' :: EXPECTED ' + d : '')); } };

/* run the atlas's own reconstruction rather than a copy of it */
const BLOCK = (() => {
  const i = src.indexOf('/* ══ THE CONDITIONAL RECONSTRUCTION');
  const j = src.indexOf('/* ONE AUTHORITY FOR EVERY WORLD-SCALE SEAM.');
  if (i < 0 || j < 0) throw new Error('reconstruction block not found');
  return src.slice(i, j);
})();
const A = new Function(BLOCK + '\nreturn {S3, S3R, HCC_S3R, HCC_S3C, hccS3Reconstruct, hccPhi, hccInvPhi, hccErfc, hccTruncQuantile};')();
const P = A.HCC_S3R.published, rel = (a, b) => Math.abs(a - b) / Math.abs(b);

/* 1 ── the error function, which is why the rest reproduces at all */
{ /* three values known in closed form or to published precision */
  ok('the error function is accurate enough for a 2.2σ tail, which the three-line approximation is not',
    Math.abs(A.hccErfc(0) - 1) < 1e-16
    && Math.abs(A.hccErfc(1) - 0.15729920705028513) < 1e-15
    && Math.abs(A.hccPhi(0) - 0.5) < 1e-16
    && Math.abs(A.hccInvPhi(0.975) - 1.959963984540054) < 1e-12,
    'erfc(1) = 0.15729920705028513 and Φ⁻¹(0.975) = 1.959963984540054 to the last printed digit · the Numerical-Recipes form is good to 1.2×10⁻⁷ and reproduced the paper to only eight figures');
  ok('and Φ and Φ⁻¹ are inverse to machine precision across the range, including the tail this uses',
    [1e-8, 1e-4, 0.00695, 0.1, 0.5, 0.9, 0.999].every(p => Math.abs(A.hccPhi(A.hccInvPhi(p)) / p - 1) < 1e-12),
    'a quantile function that is not the inverse of its own CDF will still return plausible numbers');
}

/* 2 ── the conditioning: what survives the hard sign, and what it implies */
{ ok('the published curvature marginal is carried with its POSITIVE central value rather than its modulus',
    A.HCC_S3R.mu_k === 2.20e-3 && A.HCC_S3R.sig_k === 1.00e-3 && A.HCC_S3R.openSign === true,
    '10³Ω_K = +2.20 ± 1.00 · storing |Ω_K| would have hidden the sign the whole exercise is conditional on');
  ok('conditioning on Ω_K < 0 leaves 1.39% of it, reproducing the reference',
    rel(A.S3R.pClosed, P.p_closed) < 5e-8 && A.S3R.pClosed > 0.0138 && A.S3R.pClosed < 0.0140,
    `P(Ω_K<0) = ${A.S3R.pClosed.toPrecision(12)} against the reference ${P.p_closed}, which is printed to nine decimals`);
  ok('and every conditional quantile is negative, ordered, and matches the reference to eleven figures',
    (() => { const q = A.HCC_S3R.probes.map(p => A.S3R.quantiles[p]);
      const ref = [-1.1914760539e-3, -6.4442948808e-4, -2.5974832661e-4, -6.7531254956e-5, -9.9054827688e-6];
      return q.every((v, i) => v < 0 && rel(v, ref[i]) < 1e-9)
        && q.every((v, i) => i === 0 || v > q[i - 1]); })(),
    'Ω_K ∈ [−1.191e−3, −9.91e−6] at 95% · strictly increasing toward the flat boundary, which is where the trouble is');
  ok('the profile-like bound is carried too, because a quantile depends on the prior and it does not',
    rel(A.S3R.OkProf, -5.4772633281e-4) < 1e-10 && rel(A.S3R.RcProfGly, 610.545771) < 1e-8,
    `Δχ² = ${A.HCC_S3R.deltaChi2} below the constrained Ω_K = 0⁻ gives R_c > ${A.S3R.RcProfGly.toFixed(3)} Gly`);
}

/* 3 ── the whole inventory chain, against the reference output */
{ const rows = [
    ['R_c (Gly)', A.S3R.RcGly, P.Rc_Gly, 1e-11],
    ['V (m³)', A.S3R.V, P.V_m3, 1e-11],
    ['t₀ (Gyr)', A.S3R.age, P.age_Gyr, 1e-9],
    ['D_particle (Gly)', A.S3R.DpGly, P.Dp_Gly, 1e-9],
    ['D_event (Gly)', A.S3R.DeGly, P.De_Gly, 1e-9],
    ['Γ_obs', A.S3R.fObs, P.f_obs, 1e-9],
    ['k₁ (Mpc⁻¹)', A.S3R.k1_Mpc, P.k1_Mpc, 1e-11],
    ['M_m (kg)', A.S3R.globalize(A.HCC_S3R.Omega_m * A.S3R.rhoC), P.M_m_kg, 1e-10],
    ['N_γ', A.S3R.globalize(2 * A.HCC_S3C.zeta3 / Math.PI ** 2
      * Math.pow(A.HCC_S3C.kB * A.HCC_S3R.T_cmb / (A.HCC_S3C.hbar * A.HCC_S3C.c), 3)), P.N_gamma, 1e-9]];
  const bad = rows.filter(([, g, w, t]) => !(rel(g, w) < t));
  ok('every quantity in the chain reproduces the reference implementation, which was written in another language',
    bad.length === 0,
    rows.map(([n, g, w]) => `${n} ${rel(g, w).toExponential(1)}`).join(' · ')
    + (bad.length ? ` · FAILED: ${bad.map(r => r[0]).join(', ')}` : ''));
  ok('and the globalization theorem is one function, so any mean density at all becomes a global inventory',
    typeof A.S3R.globalize === 'function'
    && Math.abs(A.S3R.globalize(1) - 2 * Math.PI ** 2 * Math.pow(A.S3R.Rc, 3)) < 1e-60
    && rel(A.S3R.globalize(A.HCC_S3R.Omega_m * A.S3R.rhoC), P.M_m_kg) < 1e-10,
    'Q = 2π²R_c³ q̄ · the matter mass, the photon count and any census row are the same operation with a different q̄');
}

/* 4 ── the eleven carrier constants are DERIVED, not typed */
{ /* the first version of this also required that the string `R: 548.32` appear
     nowhere, and went red against correct code: SEL_LEDGER still carries
     `R:548.324513026856039` as the v38 canonical row, which is a faithful record
     of a PUBLISHED curvature input and must not be deleted because the carrier
     moved. A check that forbids an atlas from recording its own history is worse
     than no check, so the question is asked the other way round — the carrier is
     derived, AND the ledger still remembers where it used to be. */
  ok('the eleven carrier constants are computed from the two published inputs rather than maintained by hand',
    !/const S3 = \{/.test(src)
    && /R:\s+S3R\.RcGly,/.test(src) && /Dcausal:\s+Math\.PI\*S3R\.RcGly,/.test(src)
    && /GammaObs:\s+S3R\.fObs,/.test(src),
    'eleven numbers for one fact, with nothing checking they still matched, is the defect this closes');
  ok('and the published ledger still carries the v38 modulus it replaced, because that row is a record and not a mistake',
    /\{key:'canon',\s+OmK:0\.0007, R:548\.324513026856039/.test(src)
    && /v38 canonical modulus/.test(src) && /SIGN OPEN/.test(src),
    'the trisphere radius is a DATA-DEPENDENT FAMILY over published Ω_K constraints; superseding the carrier does not unpublish any of them');
  ok('and they agree with the geometry they claim, to the last bit rather than to a tolerance',
    Math.abs(A.S3.V - 2 * Math.PI ** 2 * Math.pow(A.S3.R, 3)) / A.S3.V < 1e-15
    && Math.abs(A.S3.Dcausal - Math.PI * A.S3.R) / A.S3.R < 1e-15
    && Math.abs(A.S3.Circ - 2 * Math.PI * A.S3.R) / A.S3.R < 1e-15
    && Math.abs(A.S3.chiP - A.S3.Dparticle / A.S3.R) < 1e-15,
    'V = 2π²R³ · D_causal = πR · C = 2πR · χ_p = D_p/R — identities now, where they used to be four typed numbers that happened to agree');
}

/* 5 ── THE MEAN THAT DOES NOT EXIST, demonstrated rather than asserted */
{ /* E[R^m] ∝ ∫₀ x^{-m/2} p(x) dx with p finite at 0: converges for m<2 only.
     Integrate the truncated Gaussian against R^m down to progressively smaller
     cutoffs and watch m=1 settle while m=2 and m=3 climb without limit. */
  const mu = A.HCC_S3R.mu_k, sig = A.HCC_S3R.sig_k;
  const pdf = x => Math.exp(-0.5 * Math.pow((-x - mu) / sig, 2)) / (sig * Math.sqrt(2 * Math.PI));
  /* substitute x = u². The integrand x^(−m/2) p(x) dx becomes 2 u^(1−m) p(u²) du,
     which is SMOOTH at the boundary for m = 1 — the first attempt integrated in x
     on a uniform grid and could not resolve x^(−1/2) near zero, so the convergent
     moment looked as though it were drifting too. A quadrature that cannot resolve
     the integrand reports divergence for everything and distinguishes nothing. */
  const moment = (m, lo) => { const uLo = Math.sqrt(lo), uHi = Math.sqrt(3e-3);
    const n = 200000, h = (uHi - uLo) / n; let s = 0;
    for (let i = 0; i <= n; i++) { const u = uLo + i * h, w = (i === 0 || i === n) ? 1 : (i % 2 ? 4 : 2);
      s += w * 2 * Math.pow(u, 1 - m) * pdf(u * u); }
    return s * h / 3; };
  const cuts = [1e-6, 1e-8, 1e-10, 1e-12];
  const m1 = cuts.map(c => moment(1, c)), m2 = cuts.map(c => moment(2, c)), m3 = cuts.map(c => moment(3, c));
  ok('the first moment converges as the flat boundary is approached — the radius has a mean',
    Math.abs(m1[3] / m1[1] - 1) < 0.02,
    `∫ x^(−1/2) p dx over cutoffs 10⁻⁶ → 10⁻¹² : ${m1.map(v => v.toPrecision(6)).join(' → ')} — settling`);
  /* the thresholds here were ×50 and ×10⁴, picked off the first (unresolved)
     quadrature. With the integrand resolved they are wrong, and replacing one set
     of magic numbers with another would be fitting the check to the output. The
     divergences have KNOWN RATES, so the rates are what get asserted:
       m = 2 → ∫u⁻¹du, logarithmic: grows without bound but slowly, and must
               still be climbing at the smallest cutoff rather than settling;
       m = 3 → ∫u⁻²du ∝ u_lo⁻¹ = x_lo^(−1/2): two decades of cutoff must
               multiply the moment by ten, and that is a prediction, not a fit. */
  const step = m3[3] / m3[2], predicted = Math.sqrt(1e-10 / 1e-12);
  ok('and the second and third DIVERGE, at the rates the integrals say they must',
    Math.abs(m1[3] / m1[2] - 1) < 0.01
    && m2[3] / m2[2] > 1.05
    && Math.abs(step / predicted - 1) < 0.1,
    `E[R] settles to ${(100 * (m1[3] / m1[2] - 1)).toFixed(2)}% per decade while E[R²] is still climbing ${(100 * (m2[3] / m2[2] - 1)).toFixed(1)}% · E[R³] multiplies by ${step.toPrecision(4)} for two decades of cutoff against the predicted ${predicted} from x_lo^(−1/2) · V ∝ R³, so a posterior mean "size of the Universe" is a number that does not exist`);
  ok('so the atlas reports a band and a median, and says in the source why it may not report a mean',
    A.S3R.shells.length === 5 && A.S3R.shells.every(s => s.RcGly > 0)
    && /THE MEAN THAT DOES NOT EXIST/.test(src)
    && /Not large: divergent/.test(src)
    && !/posterior mean volume\s*=/.test(src),
    `the 95% conditional band is ${A.S3R.shells[0].RcGly.toFixed(0)}–${A.S3R.shells[4].RcGly.toFixed(0)} Gly, a factor of ${(A.S3R.shells[4].RcGly / A.S3R.shells[0].RcGly).toFixed(1)} in radius and ${Math.pow(A.S3R.shells[4].RcGly / A.S3R.shells[0].RcGly, 3).toFixed(0)} in volume`);
}

/* 6 ── the |Ω_K|^(−3/2) scaling that makes all of this singular */
{ const r = x => A.hccS3Reconstruct({ probes: [0.5] });
  const a = A.hccS3Reconstruct({ mu_k: 2.20e-3, sig_k: 1.00e-3 });
  const b = A.hccS3Reconstruct({ mu_k: 2.20e-3, sig_k: 2.00e-3 });
  ok('the reconstruction is parameterisable end to end, so a different marginal moves every downstream number together',
    b.Ok !== a.Ok && Math.abs(b.RcGly / a.RcGly - Math.sqrt(a.Ok / b.Ok)) < 1e-9
    && Math.abs(b.V / a.V - Math.pow(a.Ok / b.Ok, 1.5)) < 1e-9,
    `doubling σ moves R_c from ${a.RcGly.toFixed(1)} to ${b.RcGly.toFixed(1)} Gly · R ∝ |Ω_K|^(−1/2) and V ∝ |Ω_K|^(−3/2) hold exactly across the change, which is the sensitivity law and not a fit`);
  ok('and the scaling is stated where the numbers are, because it is what makes a near-flat inventory singular',
    /\|Ω_K\|\^\(−3\/2\)/.test(src) && /R_c ∝ \|Ω_K\|\^\(−1\/2\)/.test(src),
    'curvature dominates global-inventory error when |Ω_K| ≪ 1, and the atlas says so beside the inventory');
}

/* 7 ── the honesty the paper insists on, carried into the page the reader sees */
{ ok('the reader is told the closed branch is a tail of a marginal that prefers the other sign',
    /mildly prefer the OPEN sign/.test(src)
    && /THIS IS NOT A MEASUREMENT OF\s*\n\s+CLOSURE/.test(src)
    && /central sign OPEN/.test(src)
    && /this branch holds 1\.39% of the posterior and is NOT a detection/.test(src),
    'the number is the answer to "if the slices are a round S³, what follows?" and the page says so where it shows it');
  ok('and the geometry table the reader opens carries the probability and the band, not just the radius',
    /P\(Ω<sub>K<\/sub>&lt;0 \| data\)/.test(src)
    && /95% conditional band on R/.test(src)
    && /the closed branch is a tail/.test(src),
    'a radius quoted without its conditioning is the misleading number the paper spends a section warning about');
}

console.log(`\n  ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
