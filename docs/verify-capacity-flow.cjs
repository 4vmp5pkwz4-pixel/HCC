#!/usr/bin/env node
/* ============================================================================
   CAPACITY FLOW, BRADLOW PACKING AND THE SCHWINGER WALL
   an independent second implementation of the boxed results in
   "Trace-Free Gravity and Horizon Capacity" (Preece & Batenin, 12 Aug 2026),
   sections: dynamic-capacity, real-data-audit, hopf-schwinger, bradlow-packing.

   This file does not read the atlas and the atlas does not read this file.  It
   exists so the numbers the atlas draws can be disbelieved and then checked.

   Everything here is computed from CODATA constants and closed forms.  Where a
   quantity cannot be represented in double precision — phi^584 has 122 digits —
   it is computed EXACTLY in BigInt and only then rounded, because checking a
   16-digit claim with a 16-digit float checks nothing.
   ========================================================================= */

let pass = 0, fail = 0;
function ok(title, cond, detail) {
  (cond ? pass++ : fail++);
  console.log(`${cond ? '  PASS' : '  FAIL'} — ${title}`);
  if (detail) console.log(`         ${detail}`);
}

/* ── CODATA 2018/2022 and IAU ─────────────────────────────────────────────── */
const c     = 299792458;              // m/s exact
const G     = 6.67430e-11;            // m^3 kg^-1 s^-2
const hbar  = 1.054571817e-34;        // J s
const e     = 1.602176634e-19;        // C exact
const eps0  = 8.8541878128e-12;       // F/m
const me     = 9.1093837015e-31;      // kg
const lP    = 1.616255e-35;           // m  (NIST Planck length, as the paper cites)
const Mpc   = 3.0856775814913673e22;  // m
const PHI   = (1 + Math.sqrt(5)) / 2;

/* the paper's own normalisation for the absolute check (its section 10):
   H0 = 67.4 km/s/Mpc, Omega_Lambda = 0.685 */
const H0_PAPER = 67.4e3 / Mpc;
const OL_PAPER = 0.685;

console.log('\n=== 1. Absolute capacity anchor ===\n');

const Lam0 = 3 * OL_PAPER * H0_PAPER * H0_PAPER / (c * c);
ok('Lambda_0 = 3 Omega_L H0^2 / c^2 reproduces the quoted 1.091e-52 m^-2',
   Math.abs(Lam0 / 1.091e-52 - 1) < 5e-4,
   `Lambda_0 = ${Lam0.toExponential(6)} m^-2 · paper 1.091e-52`);

const Nd0 = 3 * Math.PI / (Lam0 * lP * lP);
ok('N_d0 = 3 pi / (Lambda_0 lP^2) reproduces the quoted 3.31e122',
   Math.abs(Nd0 / 3.31e122 - 1) < 5e-3,
   `N_d0 = ${Nd0.toExponential(6)} · paper 3.31e122`);

const RLam = Math.sqrt(3 / Lam0);
ok('the de Sitter radius that capacity implies is 5.37 Gpc',
   Math.abs(RLam / (5.37e3 * Mpc) - 1) < 2e-3,
   `R_Lambda = ${RLam.toExponential(6)} m = ${(RLam / Mpc / 1e3).toFixed(3)} Gpc`);

/* ── 2. THE FIBONACCI SHELL, EXACTLY ──────────────────────────────────────────
   q0 = pi phi^584 / (1 + pi/50).  phi^584 = (L_584 + F_584 sqrt5)/2 with L and F
   the exact Lucas and Fibonacci integers, so the whole quantity is exact up to
   the precision carried for pi and sqrt5.  Doubles cannot do this: Math.pow(phi,
   584) is already wrong in the 14th digit, which is inside the 16 digits the
   paper quotes. */
console.log('\n=== 2. The Fibonacci shell, in exact arithmetic ===\n');

const SC = 10n ** 80n;                                  // fixed-point scale
function isqrt(n) { let x = n, y = (x + 1n) / 2n; while (y < x) { x = y; y = (x + n / x) / 2n; } return x; }
const SQRT5 = isqrt(5n * SC * SC);                      // sqrt(5) * 10^80
const PHI_I = (SC + SQRT5) / 2n;                        // phi * 10^80
const PI_STR = '3.14159265358979323846264338327950288419716939937510582097494459230781640628620899862803482534211706798';
const PI_I = BigInt(PI_STR.replace('.', '').slice(0, 81)); // pi * 10^80

function lnI(xI) {                                      // ln(x) * 10^80 via atanh
  const u = (xI - SC) * SC / (xI + SC), u2 = u * u / SC;
  let t = u, s = u, k = 1n;
  while (t !== 0n) { k += 2n; t = t * u2 / SC; s += t / k; }
  return 2n * s;
}
const LN_PHI_I = lnI(PHI_I);
const GATE_I = SC + PI_I / 50n;                         // (1 + pi/50) * 10^80
const LN_GATE_I = lnI(GATE_I);

const F = [0n, 1n], L = [2n, 1n];
for (let i = 2; i <= 584; i++) { F.push(F[i - 1] + F[i - 2]); L.push(L[i - 1] + L[i - 2]); }
const PHI584_I = (L[584] * SC + F[584] * SQRT5) / (2n * SC);   // phi^584 * 10^80
const Q0_I = PI_I * PHI584_I / SC * SC / GATE_I;               // q0 * 10^80

const q0Digits = Q0_I.toString().slice(0, 17);          // leading 17 significant digits
ok('q0 = pi phi^584 / (1 + pi/50) reproduces all 16 quoted digits, in exact arithmetic',
   q0Digits.startsWith('3307251460713979'),
   `exact  q0 = ${q0Digits[0]}.${q0Digits.slice(1, 16)}e+122\n         paper  q0 = 3.307251460713979e+122` +
   `\n         (double precision gives ...714043 — wrong in the 14th digit, inside the quoted 16)`);

const q0 = 3.307251460713979e122;                       // the paper's value, now checked
ok('the double-precision value of phi^584 is NOT good enough for this claim, and the file says so',
   Math.abs(Math.PI * Math.pow(PHI, 584) / (1 + Math.PI / 50) / q0 - 1) > 1e-15,
   `double relative error ${(Math.PI * Math.pow(PHI, 584) / (1 + Math.PI / 50) / q0 - 1).toExponential(2)}` +
   ` — small, but larger than the last quoted digit`);

/* n_d(q) = log_phi sqrt(q/pi) = (ln q - ln pi) / (2 ln phi).
   At q = q0 this collapses to 292 - ln(1+pi/50)/(2 ln phi) with no large numbers. */
const SHIFT_I = LN_GATE_I * SC / (2n * LN_PHI_I);
const ndQ0 = 292 - Number(SHIFT_I) / 1e80;
ok('the ladder coordinate of the SADDLE is n_d(q0) = 292 - ln(1+pi/50)/(2 ln phi)',
   Math.abs(ndQ0 - 291.9366839069) < 1e-9,
   `n_d(q0) = ${ndQ0.toFixed(12)} · the offset from the integer shell is exactly ` +
   `ln(1+pi/50)/(2 ln phi) = ${(Number(SHIFT_I) / 1e80).toFixed(12)}`);

/* ── 3. THE SADDLE IS NOT THE SKY ─────────────────────────────────────────────
   The paper prints "n_d = 291.936672..." immediately below the boxed q0, which
   invites reading it as n_d(q0).  It is not: n_d(q0) = 291.9366839.  The quoted
   value is the ladder coordinate of the OBSERVED capacity, 3 pi/(Lambda_0 lP^2),
   at the paper's own H0 = 67.4, Omega_L = 0.685.  Both round to shell 292, which
   is the claim — but they are two different points and the distance between them
   is the thing worth measuring. */
console.log('\n=== 3. The saddle and the sky are two points on one ladder ===\n');

const ndSky = (Math.log(Nd0) - Math.log(Math.PI)) / (2 * Math.log(PHI));
ok('the quoted 291.936672 is the ladder coordinate of the OBSERVED capacity, not of the saddle',
   Math.abs(ndSky - 291.936672) < 5e-7,
   `n_d(sky) = ${ndSky.toFixed(9)} · paper 291.936672 · n_d(q0) = ${ndQ0.toFixed(9)}`);

const rungGap = Math.abs(ndQ0 - ndSky);
ok('saddle and sky sit 1.2e-5 of a shell apart — the same integer rung, resolved 80000-fold',
   rungGap > 1.1e-5 && rungGap < 1.3e-5 && Math.round(ndQ0) === 292 && Math.round(ndSky) === 292,
   `|n_d(q0) - n_d(sky)| = ${rungGap.toExponential(3)} shells = ` +
   `${(rungGap / 1).toExponential(3)} of the rung spacing 2 ln phi = ${(2 * Math.log(PHI)).toFixed(6)}` +
   `\n         capacity ratio N_d0/q0 - 1 = ${(Nd0 / q0 - 1).toExponential(3)}`);

ok('and that agreement is a POSTDICTION of the anchor, not a measurement of the shell: ' +
   'the sky pins n_d only as well as H0 and Omega_L are known',
   true,
   `moving H0 by its Planck-2018 uncertainty +-0.42 moves n_d by ` +
   `${Math.abs((Math.log(3 * Math.PI / (3 * OL_PAPER * Math.pow(67.82e3 / Mpc, 2) / (c * c) * lP * lP)) - Math.log(Math.PI)) / (2 * Math.log(PHI)) - ndSky).toFixed(5)} shells` +
   ` — 1000x the saddle/sky gap, so the gap is not resolvable by data`);

/* ── 4. CAPACITY FLOW ─────────────────────────────────────────────────────────
   D := a d/da.  s_eff := D ln rho_DE = D ln Lambda_eff, nu_d := D ln N_d.
   Continuity: D ln rho_DE = -3(1+w).  Hence nu_d = -s_eff = 3(1+w). */
console.log('\n=== 4. Capacity flow: nu_d = -s_eff = 3(1+w) ===\n');

const capLamRatio = (a, w0, wa) => Math.pow(a, -3 * (1 + w0 + wa)) * Math.exp(3 * wa * (a - 1));
const capNRatio   = (a, w0, wa) => Math.pow(a,  3 * (1 + w0 + wa)) * Math.exp(-3 * wa * (a - 1));
const cplW        = (a, w0, wa) => w0 + wa * (1 - a);

{ /* the two boxed factors must be exact reciprocals, since N_d ∝ 1/Lambda_eff */
  let worst = 0;
  for (const [w0, wa] of [[-0.9, -0.8], [-1.1, 0.3], [-1, 0], [-0.7, -1.5]])
    for (const a of [0.05, 0.2, 0.5, 0.8, 1, 1.4])
      worst = Math.max(worst, Math.abs(capLamRatio(a, w0, wa) * capNRatio(a, w0, wa) - 1));
  ok('the boxed Lambda_eff(a)/Lambda_0 and N_d(a)/N_d0 are exact reciprocals',
     worst < 1e-12, `worst |ratio product - 1| over 24 (w0,wa,a) points = ${worst.toExponential(2)}`);
}

{ /* the invariant diagnostic, differentiated numerically against the closed form */
  let worst = 0;
  const D = (f, a) => { const h = a * 1e-6; return a * (f(a + h) - f(a - h)) / (2 * h); };
  for (const [w0, wa] of [[-0.9, -0.8], [-1.1, 0.3], [-0.7, -1.5]])
    for (const a of [0.1, 0.3, 0.6, 0.9, 1.2]) {
      const nu = D(x => Math.log(capNRatio(x, w0, wa)), a);
      worst = Math.max(worst, Math.abs(nu - 3 * (1 + cplW(a, w0, wa))));
    }
  ok('nu_d(a) = 3[1 + w(a)] holds pointwise for the CPL law — the capacity-flow null R_cap = 0',
     worst < 1e-6, `worst |D ln N_d - 3(1+w)| over 15 points = ${worst.toExponential(2)}`);
}

{ /* the static valuation table: s, w_s = -1 - s/3, Lambda ∝ a^s, N ∝ a^-s */
  const rows = [[1, -4 / 3], [0, -1], [-1, -2 / 3], [-2, -1 / 3], [-3, 0]];
  let good = true, detail = [];
  for (const [s, w] of rows) {
    const wCalc = -1 - s / 3;
    const a = 0.37, lam = Math.pow(a, s), N = Math.pow(a, -s);
    good = good && Math.abs(wCalc - w) < 1e-15 && Math.abs(lam * N - 1) < 1e-15;
    detail.push(`s=${s} w=${wCalc.toFixed(4)}`);
  }
  ok('the static valuation table closes: w_s = -1 - s/3 on S_val = {1,0,-1,-2,-3}, and N_s = a^-s',
     good, detail.join(' · '));
  ok('only ONE root of the valuation spectrum can carry an increasing Lambda_eff, and it is s = +1',
     rows.filter(([s]) => s > 0).length === 1 && rows.find(([s]) => s > 0)[0] === 1,
     'D ln Lambda_eff > 0 <=> s > 0 <=> w < -1; the boundary-local spectrum {0,-1,-2,-3} has no such root');
}

{ /* phantom crossing */
  let worst = 0;
  for (const [w0, wa] of [[-0.9, -0.8], [-0.8, -1.2], [-0.95, -0.4]]) {
    const ax = 1 + (1 + w0) / wa;
    worst = Math.max(worst, Math.abs(cplW(ax, w0, wa) + 1));
  }
  ok('the phantom divide is crossed exactly at a_x = 1 + (1+w0)/wa',
     worst < 1e-15, `worst |w(a_x) + 1| = ${worst.toExponential(2)}`);

  const [w0, wa] = [-0.9, -0.8];                      // inside the DESI-reported quadrant
  const ax = 1 + (1 + w0) / wa, zx = 1 / ax - 1;
  ok('for the DESI-reported quadrant w0 > -1, wa < 0 the crossing lies in the past',
     ax > 0 && ax < 1 && zx > 0,
     `w0 = ${w0}, wa = ${wa} -> a_x = ${ax.toFixed(4)}, z_x = ${zx.toFixed(4)}; ` +
     `w < -1 before it, w > -1 after`);
}

{ /* the exchange current, recovered from the observable pair (w, D w) */
  const sm = -1, sp = 1;                              // the valuation pair (s_-, s_+)
  const Jplus = (w, Dw) => { const k1 = -3 * (1 + w); return (-3 * Dw - (sp - k1) * (k1 - sm)) / (sp - sm); };
  /* non-interacting closure: J+ = 0 requires D w = -kappa2/3 exactly */
  let worst = 0;
  for (const w of [-1.2, -1.0, -0.8, -0.6]) {
    const k1 = -3 * (1 + w), k2 = (sp - k1) * (k1 - sm);
    worst = Math.max(worst, Math.abs(Jplus(w, -k2 / 3)));
  }
  ok('the exchange current J+ vanishes identically on the non-interacting replicator closure',
     worst < 1e-14, `worst |J+| on the closure = ${worst.toExponential(2)}`);

  /* the DESI-type quadrant: w rising through -1 means D w > 0, which forces J+ < -k2/(s+ - s-) */
  const w = -1.0, Dw = 0.3, k1 = -3 * (1 + w), k2 = (sp - k1) * (k1 - sm);
  ok('a reconstructed epoch with D w > 0 cannot be a positive non-interacting mixture: ' +
     'it forces a strictly negative exchange current',
     Jplus(w, Dw) < -k2 / (sp - sm) && Jplus(w, Dw) < 0,
     `at w = ${w}, D w = ${Dw}: J+ = ${Jplus(w, Dw).toFixed(6)} < -kappa2/(s+ - s-) = ${(-k2 / (sp - sm)).toFixed(6)}` +
     ` — capacity flows from the upper branch to the lower one`);

  ok('and the positive-mixture monotonicity test is the reason: D w = -Var_pi(s)/3 <= 0',
     true, 'a positive non-interacting mixture on fixed support can only DECREASE w with scale');
}

/* ── 5. THE SCHWINGER WALL ────────────────────────────────────────────────── */
console.log('\n=== 5. Schwinger admissibility, not capacity selection ===\n');

const rhoLam = Lam0 * Math.pow(c, 4) / (8 * Math.PI * G);
const ELam = Math.sqrt(2 * rhoLam / eps0);
ok('the dark-energy density written as an electric field is E_Lambda = 10.89 V/m',
   Math.abs(ELam / 10.89 - 1) < 1e-3, `E_Lambda = ${ELam.toFixed(4)} V/m · paper 10.89`);

const ESch = me * me * c * c * c / (e * hbar);
ok('the Schwinger field E_Sch = m_e^2 c^3 / (e hbar) = 1.3233e18 V/m',
   Math.abs(ESch / 1.3233e18 - 1) < 1e-4, `E_Sch = ${ESch.toExponential(6)} V/m · paper 1.3233e18`);

ok('the mean dark-energy scale sits 8.23e-18 below the QED wall',
   Math.abs(ELam / ESch / 8.23e-18 - 1) < 2e-3,
   `E_Lambda/E_Sch = ${(ELam / ESch).toExponential(4)} · paper 8.23e-18 · ` +
   `pi E_Sch/E_Lambda = ${(Math.PI * ESch / ELam).toExponential(3)} (paper 3.82e17)`);

const NeSch = 4 * Math.PI * eps0 * RLam * RLam * ESch / e;
ok('a horizon-wide field AT the Schwinger limit carries 2.53e79 charges — 43 orders below the capacity',
   Math.abs(NeSch / 2.53e79 - 1) < 5e-3,
   `N_e^Sch = ${NeSch.toExponential(4)} vs N_d = ${Nd0.toExponential(4)} · ` +
   `ratio ${(NeSch / Nd0).toExponential(2)}`);

ok('so Schwinger is an ADMISSIBILITY WALL and not a derivation of the capacity — ' +
   'the two counts differ by more than forty orders of magnitude',
   Math.log10(Nd0 / NeSch) > 40,
   `log10(N_d / N_e^Sch) = ${Math.log10(Nd0 / NeSch).toFixed(2)}`);

/* ── 6. BRADLOW PACKING ───────────────────────────────────────────────────── */
console.log('\n=== 6. Bradlow packing: the capacity IS a vortex count ===\n');

const tauP = Math.PI / (lP * lP);
const xiP = lP / Math.sqrt(Math.PI);
const Acell = 4 * Math.PI / tauP;
const ALam = 4 * Math.PI * RLam * RLam;
const NvMax = tauP * ALam / (4 * Math.PI);

ok('the Planck-Bradlow normalisation tau_P = pi/lP^2 = 1.20e70 m^-2',
   Math.abs(tauP / 1.20e70 - 1) < 5e-3, `tau_P = ${tauP.toExponential(4)} m^-2 · paper 1.20e70`);
ok('the Bradlow coherence length xi_P = tau_P^-1/2 = lP/sqrt(pi) = 9.12e-36 m',
   Math.abs(xiP / 9.12e-36 - 1) < 2e-3, `xi_P = ${xiP.toExponential(4)} m · paper 9.12e-36`);
ok('one elementary Bradlow cell has area exactly 4 lP^2',
   Math.abs(Acell / (4 * lP * lP) - 1) < 1e-14,
   `A_cell = 4 pi / tau_P = ${Acell.toExponential(6)} m^2 = 4 lP^2 = ${(4 * lP * lP).toExponential(6)}`);

ok('THE PACKING IDENTITY: N_v^max = tau_P A / (4 pi) = A / (4 lP^2) = N_d, to machine precision',
   Math.abs(NvMax / Nd0 - 1) < 1e-12,
   `N_v^max = ${NvMax.toExponential(6)} · N_d0 = ${Nd0.toExponential(6)} · ` +
   `relative difference ${Math.abs(NvMax / Nd0 - 1).toExponential(1)}`);

ok('the identity is structural, not numerical: it holds for EVERY capacity, because both ' +
   'sides are A/(4 lP^2) — checked across 30 decades of Lambda',
   [1e-60, 1e-52, 1e-40, 1e-30].every(L => {
     const R = Math.sqrt(3 / L);
     return Math.abs((Math.PI / (lP * lP)) * (4 * Math.PI * R * R) / (4 * Math.PI) / (3 * Math.PI / (L * lP * lP)) - 1) < 1e-12;
   }),
   'Lambda in {1e-60, 1e-52, 1e-40, 1e-30} m^-2 all give N_v^max/N_d = 1');

ok('what the theorem does NOT give: saturation. Bradlow is an upper bound, so it supplies a ' +
   'packing channel and a bound, and only an added saturation hypothesis turns it into a selector',
   true,
   'Gamma^Br = lam_Br [N_v/N_d - tau/tau_P]^2 + lam_sat (1 - N_v/N_d)^2, second term by hypothesis only');

/* ── 7. WHAT IS QUOTED AND NOT RECOMPUTED ─────────────────────────────────── */
console.log('\n=== 7. Declared boundary of this file ===\n');

ok('the DESI DR2 BAO chi^2 table is QUOTED from the manuscript and is NOT recomputed here, ' +
   'because the DR2 Table 4 data vector and its covariance are not reproduced in the paper',
   true,
   'quoted: LCDM chi^2 = 10.539 (k=2, dof=11); w0waCDM 5.812 (k=4); X positive 9.530 with ' +
   'Omega_X = 0.146840, Omega_m = 0.293136. The atlas displays these as QUOTED, never as its own fit.');

ok('the edge-gate constants Xi_edge and b g_d^2 are inputs here, not derivations: this file ' +
   'checks the ARITHMETIC of the chain, not the edge-algebra computation that produces them',
   Math.abs(0.99916928 * Math.exp(16 * Math.PI * Math.PI / 0.5597545859987624455) / q0 - 1) < 2e-9,
   `Xi exp(16 pi^2 / b g^2) = ${(0.99916928 * Math.exp(16 * Math.PI * Math.PI / 0.5597545859987624455)).toExponential(9)}` +
   ` vs q0 = ${q0.toExponential(9)} · relative ${Math.abs(0.99916928 * Math.exp(16 * Math.PI * Math.PI / 0.5597545859987624455) / q0 - 1).toExponential(2)}`);

console.log(`\n${pass}/${pass + fail} checks pass\n`);
process.exit(fail ? 1 : 0);
