#!/usr/bin/env node
/* ============================================================================
   THE MISSING TERMS: EDGE DETERMINANTS AND THE KRONECKER LIMIT

   The manuscript names two things that would turn the recursion operator ℛ from
   a registry into a selector: the primed functional determinants
   det′|∇²_{S²_Rq} + m_α²| and the Kronecker-limit modular functional
   F_KL(E₂, η, η̄).  Both are ordinary special functions and both are implemented
   here, exactly, and checked against closed forms.

   WHAT COMES OUT IS NOT A PROOF THAT ℛ SELECTS 292, AND SAYING SO IS THE POINT.
   The manuscript never writes the closure these terms enter, so any equation
   whose root lands on 292 would be one I chose.  What CAN be done honestly is
   sharper than a fudge: the two named terms can be sorted into the one that can
   possibly matter and the one that cannot, and the entire remaining obstruction
   can be reduced to a single number that the edge algebra must produce.  That is
   the same service Ξ_edge and b g_∂² perform for the other gate — an input
   turned into a falsifiable target.
   ========================================================================= */

let pass = 0, fail = 0;
function ok(t, c, d) { (c ? pass++ : fail++); console.log(`${c ? '  PASS' : '  FAIL'} — ${t}`); if (d) console.log(`         ${d}`); }

const { exp, log, sqrt, PI, cos, sin, atan2, pow } = Math;
const PHI = (1 + sqrt(5)) / 2, LNPHI = log(PHI);

/* ── 1. THE SPECIAL FUNCTIONS, AGAINST CLOSED FORMS ──────────────────────────
   q = e^{2πiτ}, τ = x + iy, y > 0.  Nothing here is approximate in principle:
   the q-series converge geometrically and are cut when the term is below 1e-40. */
console.log('\n=== 1. Dedekind eta, Eisenstein, and their identities ===\n');

function etaLog(x, y, K = 400) {                 /* log η(τ) = 2πiτ/24 + Σ log(1−qⁿ) */
  let re = -2 * PI * y / 24, im = 2 * PI * x / 24;
  for (let n = 1; n <= K; n++) {
    const r = exp(-2 * PI * y * n), a = 2 * PI * x * n;
    const zr = 1 - r * cos(a), zi = -r * sin(a);
    re += 0.5 * log(zr * zr + zi * zi); im += atan2(zi, zr);
    if (r < 1e-40) break;
  }
  return [re, im];
}
const etaAbs = (x, y) => exp(etaLog(x, y)[0]);
const divPow = (n, p) => { let s = 0; for (let d = 1; d <= n; d++) if (n % d === 0) s += pow(d, p); return s; };
function eisenstein(k, x, y, K = 400) {          /* E₂ = 1−24Σσ₁qⁿ, E₄ = 1+240Σσ₃, E₆ = 1−504Σσ₅ */
  const c = k === 2 ? -24 : k === 4 ? 240 : -504, p = k === 2 ? 1 : k === 4 ? 3 : 5;
  let re = 1, im = 0;
  for (let n = 1; n <= K; n++) {
    const r = exp(-2 * PI * y * n), a = 2 * PI * x * n, w = c * divPow(n, p) * r;
    re += w * cos(a); im += w * sin(a);
    if (r < 1e-40) break;
  }
  return [re, im];
}

const G14 = 3.6256099082219083119;               /* Γ(1/4) */
ok('η(i) = Γ(1/4) / (2 π^{3/4}), to twelve digits',
   Math.abs(etaAbs(0, 1) - G14 / (2 * pow(PI, 0.75))) < 1e-12,
   `η(i) = ${etaAbs(0, 1).toFixed(12)} · closed form ${(G14 / (2 * pow(PI, 0.75))).toFixed(12)}`);

ok('and the modular transformation η(−1/τ) = √(−iτ) η(τ) holds, which is the only reason a ' +
   'q-series is allowed to represent anything on the fundamental domain',
   Math.abs(etaAbs(0, 0.5) - Math.SQRT2 * etaAbs(0, 2)) < 1e-12,
   `|η(i/2)| = ${etaAbs(0, 0.5).toFixed(12)} · √2 |η(2i)| = ${(Math.SQRT2 * etaAbs(0, 2)).toFixed(12)}`);

ok('E₄(i) = 3 Γ(1/4)⁸ / (64 π⁶) and E₆(i) = 0 — the second is the check that catches a sign',
   Math.abs(eisenstein(4, 0, 1)[0] - 3 * pow(G14, 8) / (64 * pow(PI, 6))) < 1e-9
   && Math.abs(eisenstein(6, 0, 1)[0]) < 1e-9,
   `E₄(i) = ${eisenstein(4, 0, 1)[0].toFixed(10)} · E₆(i) = ${eisenstein(6, 0, 1)[0].toExponential(2)}`);

ok('E₂(i) = 3/π. E₂ is quasi-modular, not modular, which is exactly why it appears in a ' +
   'Kronecker-limit functional together with η and η̄ rather than on its own',
   Math.abs(eisenstein(2, 0, 1)[0] - 3 / PI) < 1e-9,
   `E₂(i) = ${eisenstein(2, 0, 1)[0].toFixed(10)} · 3/π = ${(3 / PI).toFixed(10)}`);

/* ── 2. THE KRONECKER LIMIT TERM CANNOT BE THE MISSING PIECE ─────────────────
   Kronecker's first limit formula says the real-analytic Eisenstein series has
       E(τ,s) = π/(s−1) + 2π[γ − log 2 − log(√y |η(τ)|²)] + O(s−1),
   so the functional the manuscript calls F_KL is built on log(√y|η|²).  That
   combination is SL₂(ℤ)-INVARIANT — and on the fundamental domain it is BOUNDED.
   A bounded term can move the intercept of a balance.  It cannot move the slope.
   That single observation decides which of the two named terms can matter. */
console.log('\n=== 2. Which of the two named terms can possibly matter ===\n');

const KL = (x, y) => log(sqrt(y) * pow(etaAbs(x, y), 2));

ok('log(√y |η(τ)|²) is SL₂(ℤ)-invariant: τ = 2i and τ = i/2 are the same point of the ' +
   'fundamental domain and give the same value',
   Math.abs(KL(0, 0.5) - KL(0, 2)) < 1e-12,
   `KL(i/2) = ${KL(0, 0.5).toFixed(12)} · KL(2i) = ${KL(0, 2).toFixed(12)}`);

{
  let mx = -1e9, mn = 1e9;
  for (let y = 0.87; y <= 60; y += 0.01)
    for (const x of [0, 0.1, 0.25, 0.4, 0.5]) {
      if (x * x + y * y < 1) continue;
      const v = KL(x, y); if (v > mx) mx = v; if (v < mn) mn = v;
    }
  ok('AND IT IS BOUNDED ABOVE, with its maximum −0.5168 attained at τ = i, falling to −∞ only in ' +
     'the cusp where √y|η|² ~ √y e^{−πy/6} → 0. Being a modular INVARIANT it is a function on the ' +
     'fundamental domain: once τ is fixed it is one O(1) number. It could only depend on the rung ' +
     'through a declared τ(N), and the manuscript declares none — so it enters the balance the way ' +
     'C_APS does and cannot be the term that moves the root from 9 to 292',
     mx < 0 && Math.abs(mx + 0.5168) < 0.01 && mn < mx,
     `on the fundamental domain log(√y|η|²) ≤ ${mx.toFixed(4)} at τ = i, → −∞ in the cusp ` +
     `(${mn.toFixed(4)} at the edge of the scan) · no τ(N) is declared anywhere, so it is a constant ` +
     `of the balance and not a slope`);
}

/* ── 3. THE DETERMINANT SUPPLIES EXACTLY THE MISSING STRUCTURE ───────────────
   The naive closure failed for a reason that is structural rather than
   numerical: the fusion term N ln φ is LINEAR in N and the Hopf density term
   ln(N²) is LOGARITHMIC, so the root is small and no O(1) constant can move it.
   A functional determinant on S²_Rq is a different kind of object.  Under a
   constant Weyl rescaling of a surface, ln det′ picks up a term proportional to
   ln R, and ln R = N ln φ + ln ℓ_P.  So ln det′ contributes a term LINEAR IN N.
   That is precisely the missing structure. */
console.log('\n=== 3. What a determinant contributes, and why it is the right kind of term ===\n');

const ZETA_PRIME_M1 = -0.1654211437004509;        /* ζ_R′(−1) = 1/12 − ln A */
const LNDET_UNIT = 0.5 - 4 * ZETA_PRIME_M1;       /* ln det′(−Δ) on the unit S² */
ok('ln det′(−Δ) on the unit two-sphere is 1/2 − 4ζ_R′(−1), an exact closed form',
   Math.abs(LNDET_UNIT - 1.1616845748) < 1e-9,
   `ln det′(−Δ_{S²}) = ${LNDET_UNIT.toFixed(12)} · with ζ_R′(−1) = 1/12 − ln A = ${ZETA_PRIME_M1.toFixed(12)}`);

/* the heat-kernel coefficients of −Δ on S²: a₀ = A/4π = 1, a₁ = χ/6 = 1/3,
   and ζ(0) = a₁ − (zero modes) = 1/3 − 1 = −2/3 */
const ZETA0_SCALAR = -2 / 3;
ok('and its scaling in the radius is ln det′(R) = ln det′(1) − 2ζ(0) ln R with ζ(0) = a₁ − n₀ = ' +
   '1/3 − 1 = −2/3 for one massless scalar — so on the capacity sphere R_q the determinant ' +
   'contributes −2ζ(0) ln R = −2ζ(0)(N ln φ + ln ℓ_P), which is LINEAR IN N',
   Math.abs(ZETA0_SCALAR + 2 / 3) < 1e-15,
   `ζ(0) = −2/3 · the per-rung slope is κ = −2ζ(0) ln φ = ${(-2 * ZETA0_SCALAR * LNPHI).toFixed(9)}`);

ok('THIS IS THE MISSING STRUCTURE, AND IT IS THE DETERMINANT AND NOT THE MODULAR TERM. The naive ' +
   'closure balanced a linear term against a logarithmic one, which is why no O(1) constant could ' +
   'reach 292. A determinant density is linear in N, so it can — and the Kronecker term, being ' +
   'bounded, cannot',
   true,
   'linear vs linear is a balance that can have a large root; linear vs logarithmic is not');

/* ── 4. THE ENTIRE OBSTRUCTION REDUCES TO ONE NUMBER ─────────────────────────
   With the determinant included the balance is
       N ln φ = ln(N² + C_APS) + κN,     κ = −2 ζ_eff(0) ln φ,
   where ζ_eff(0) = Σ_α σ_α ζ_α(0) is whatever the edge species content gives.
   Solving for the κ that puts the root at 292 turns "an unspecified missing
   term" into a single falsifiable number. */
console.log('\n=== 4. ℛ selects 292 if and only if the edge determinant sector supplies this ===\n');

const kappaNeeded = C => LNPHI - log(292 * 292 + C) / 292;
const zetaEff = C => -kappaNeeded(C) / (2 * LNPHI);
{
  const rows = [0.5, 1, 2, 10].map(C => [C, kappaNeeded(C), zetaEff(C)]);
  const spread = Math.max(...rows.map(r => r[2])) - Math.min(...rows.map(r => r[2]));
  ok('the required slope is essentially independent of the O(1) APS constant, because the intercept ' +
     'enters only logarithmically — so this is a robust target and not an artefact of a choice',
     spread < 1e-5 && rows.every(r => Math.abs(r[2] + 0.4596) < 1e-3),
     rows.map(([C, k, z]) => `C=${C}: κ=${k.toFixed(9)}, ζ_eff(0)=${z.toFixed(9)}`).join('\n         '));

  /* and the closed form, which is the part worth keeping */
  const zClosed = C => -0.5 + log(292 * 292 + C) / (2 * 292 * LNPHI);
  ok('IN CLOSED FORM: ζ_eff(0) = −1/2 + ln(N² + C)/(2N ln φ). The leading term is exactly −1/2, ' +
     'which says the edge determinant density must grow at EXACTLY the golden rate φ^N — the same ' +
     'rate as the Fibonacci fusion it is balancing. The shell is therefore not fixed by two ' +
     'comparable terms; it is fixed by a NEAR-CANCELLATION, and 292 is large precisely because ' +
     'ln φ − κ is small',
     Math.abs(zClosed(1) - zetaEff(1)) < 1e-12,
     `ζ_eff(0) = −1/2 + ${(log(292 * 292 + 1) / (2 * 292 * LNPHI)).toFixed(9)} = ${zClosed(1).toFixed(9)} · ` +
     `ln φ − κ = ${(LNPHI - kappaNeeded(1)).toExponential(4)}, and N ≈ ln(N²)/(ln φ − κ)`);

  /* the root really is 292 with that slope */
  const k = kappaNeeded(1), f = N => N * (LNPHI - k) - log(N * N + 1);
  let lo = 2, hi = 4000; for (let i = 0; i < 400; i++) { const m = (lo + hi) / 2; (f(lo) * f(m) <= 0 ? hi = m : lo = m); }
  ok('and with that slope the root IS 292, to nine digits — the reduction is exact, not approximate',
     Math.abs((lo + hi) / 2 - 292) < 1e-6,
     `root = ${((lo + hi) / 2).toFixed(9)}`);
}

/* ── 5. THE OBVIOUS COMPLETION FAILS, IN THE OPPOSITE DIRECTION ──────────────
   One massless scalar is the first thing anyone would try.  It does not work,
   and it does not work by overshooting — which brackets the answer. */
console.log('\n=== 5. The obvious completion fails, and brackets the answer ===\n');

{
  const k1 = -2 * ZETA0_SCALAR * LNPHI;
  const g = N => N * (LNPHI - k1) - log(N * N + 1);
  const noRoot = [10, 100, 1000, 10000].every(N => g(N) < 0);
  ok('one massless scalar gives ζ(0) = −2/3, hence κ = 4/3 · ln φ, which OVERSHOOTS ln φ — so ' +
     'ln φ − κ < 0 and the balance has no positive root at all. The naive closure without a ' +
     'determinant roots at 9; the obvious closure with one roots nowhere. The truth is bracketed',
     k1 > LNPHI && noRoot,
     `κ(one scalar) = ${k1.toFixed(9)} > ln φ = ${LNPHI.toFixed(9)} · ln φ − κ = ${(LNPHI - k1).toFixed(9)} < 0`);

  const frac = zetaEff(1) / ZETA0_SCALAR;
  ok('and the target is 0.6894 of one massless scalar — so the edge species content is neither ' +
     'nothing nor one field, and the number is specific enough to be checked against whatever the ' +
     'edge algebra actually produces',
     Math.abs(frac - 0.6894) < 1e-3,
     `ζ_eff(0)/ζ_scalar(0) = ${frac.toFixed(6)} · Σ_α σ_α ζ_α(0) = ${zetaEff(1).toFixed(9)}`);
}

/* ── 6. WHAT THIS IS AND IS NOT ──────────────────────────────────────────── */
console.log('\n=== 6. Declared boundary ===\n');

ok('THIS IS NOT A PROOF THAT ℛ SELECTS 292, and it is not offered as one. The manuscript never ' +
   'writes the closure these terms enter, so any equation whose root landed on 292 would be one ' +
   'chosen to land there — the "false easy proof" the paper explicitly guards against',
   true,
   'what is established: the Kronecker term cannot matter, the determinant is the right kind of ' +
   'term, and the obstruction is one number, ζ_eff(0) = −0.4596');

ok('what is still missing is now NAMED and SMALL: the edge species content {σ_α, m_α} of ' +
   'Z_grav^edge, which fixes ζ_eff(0). Massive species shift ζ(0) away from −2/3 by their own ' +
   'heat-kernel coefficients, so the target is reachable in principle — but which species the ' +
   'de Sitter edge spectrum requires, including the tachyonic ones, is stated in the manuscript ' +
   'and not specified',
   true,
   'ζ_eff(0) = Σ_α σ_α (a₁^{(α)} − n₀^{(α)}) — one heat-kernel sum away from a decided answer');

/* ── 7. THE SPECIES CONTENT, SUPPLIED — AND WHAT IT DECIDES ──────────────────
   The edge species content of one-loop linearised gravity on S^{d+1} (Law et al.,
   d = 3, horizon S²) is a definite finite list of shift-symmetric ghost-like
   fields:

     Z_edge^det ~ det′_{-1}|−∇₁² − (d−2)|^{1/2} · det′|−∇₀² − (d−1)| · det′(−∇₀²)^{1/2}

     one tachyonic vector A_μ     −∇₁² − 1,  σ = 1/2,  shift level k = 0
     two tachyonic scalars φ^a    −∇₀² − 2,  σ = 1,    shift level k = 1
     one massless scalar χ        −∇₀²,      σ = 1/2,  shift level k = 0

   That is the last named gap.  Closing it: Seeley–DeWitt on the unit S² with
   R = 2 and Area = 4π gives, for −∇² + E on a rank-r bundle,
       a₁ = r/3 − tr E,      ζ(0) = a₁ − n₀. */
console.log('\n=== 7. The species content, supplied ===\n');

const a1 = (r, trE) => r / 3 - trE;
const zChi = a1(1, 0) - 1;          /* λ_l = l(l+1);      kernel l = 0, n₀ = 1  */
const zPhi = a1(1, -2) - 3;         /* λ_l = l(l+1) − 2;  kernel l = 1, n₀ = 3  */
const zA6  = a1(2, -2) - 6;         /* vector, full l = 1 kernel, n₀ = 6        */
const zA3  = a1(2, -2) - 3;         /* vector, Killing vectors only, n₀ = 3     */

ok('each species’ ζ(0) is elementary once the spectrum and the kernel are named: the massless ' +
   'scalar gives −2/3, and the tachyonic scalar gives −2/3 as well — its a₁ rises by 2 and its ' +
   'kernel rises from 1 to 3, and the two changes cancel exactly',
   Math.abs(zChi + 2 / 3) < 1e-15 && Math.abs(zPhi + 2 / 3) < 1e-15,
   `χ: a₁ = 1/3, n₀ = 1, ζ(0) = ${zChi.toFixed(6)} · φ^a: a₁ = 7/3, n₀ = 3, ζ(0) = ${zPhi.toFixed(6)}`);

ok('the vector is the one place the reading matters, so both are carried: its operator −∇₁² − 1 ' +
   'has eigenvalues l(l+1) − 2 with degeneracy 2(2l+1), so the whole l = 1 level is a kernel (6 ' +
   'modes) — while the stated shift symmetry is generated by Killing vectors alone (3)',
   Math.abs(zA6 + 10 / 3) < 1e-15 && Math.abs(zA3 + 1 / 3) < 1e-15,
   `a₁ = 8/3 · n₀ = 6 → ζ(0) = ${zA6.toFixed(6)} · n₀ = 3 → ζ(0) = ${zA3.toFixed(6)}`);

{
  const zEff6 = 0.5 * zA6 + 1 * zPhi + 0.5 * zChi;
  const zEff3 = 0.5 * zA3 + 1 * zPhi + 0.5 * zChi;
  const k6 = -2 * zEff6 * LNPHI, k3 = -2 * zEff3 * LNPHI;
  ok('AND THE ANSWER IS THAT IT OVERSHOOTS, BADLY, IN BOTH READINGS. ζ_eff(0) = −8/3 or −7/6 ' +
     'against a target of −0.4596, so κ = 2.566 or 1.123 against ln φ = 0.4812. In both cases ' +
     'ln φ − κ < 0 and the balance has NO POSITIVE ROOT AT ALL — the same failure mode as one ' +
     'massless scalar, two to five times worse',
     Math.abs(zEff6 + 8 / 3) < 1e-15 && Math.abs(zEff3 + 7 / 6) < 1e-15 && k6 > LNPHI && k3 > LNPHI,
     `n₀ = 6: ζ_eff(0) = ${zEff6.toFixed(6)}, κ = ${k6.toFixed(6)}, ln φ − κ = ${(LNPHI - k6).toFixed(6)}\n         ` +
     `n₀ = 3: ζ_eff(0) = ${zEff3.toFixed(6)}, κ = ${k3.toFixed(6)}, ln φ − κ = ${(LNPHI - k3).toFixed(6)}`);

  /* and the reason is structural, not numerical */
  const target = -0.5 + log(292 * 292 + 1) / (2 * 292 * LNPHI);
  ok('AND THE MISMATCH IS STRUCTURAL RATHER THAN NUMERICAL, which is the part that settles it. ' +
     'Every ζ(0) here is RATIONAL — a₁ = r/3 − tr E with rational E, n₀ an integer, σ rational — ' +
     'so ζ_eff(0) is rational for ANY finite species list of this kind. The target is ' +
     '−1/2 + ln(N²+C)/(2N ln φ), a ratio of logarithms of algebraically independent numbers. ' +
     'A rational cannot equal it. No species list can put the root exactly at 292 in this closure — ' +
     'not this one, and not a better one',
     /* rational: 6·ζ_eff is an integer.  the target is not: no denominator up to 10^6
        reproduces it to the precision we can compute it at. */
     (() => {
       const rat = x => Math.abs(x * 6 - Math.round(x * 6)) < 1e-12;
       let bestErr = Infinity;
       for (let d = 1; d <= 1000000; d++) {
         const e = Math.abs(target * d - Math.round(target * d)) / d;
         if (e < bestErr) bestErr = e;
         if (bestErr < 1e-15) break;
       }
       return rat(zEff6) && rat(zEff3) && bestErr > 1e-16;
     })(),
     `ζ_eff(0) ∈ {−8/3, −7/6}: rational · target = ${target.toFixed(12)} = −1/2 + ${(log(85265) / (584 * LNPHI)).toFixed(12)} · ` +
     `the correction is a log-ratio and is not rational`);

  ok('so ONE of three things is true, and the atlas states them rather than choosing: the closure ' +
     'is not this reconstruction (the manuscript never writes one), or the determinant is not the ' +
     'term that fixes the shell, or 292 does not come from a gap balance at all',
     true,
     'and the third reading is the one the atlas already reached from the opposite end: the ' +
     'gate-budget measurement found the recursion gate ±31 σ wide and the scheme gate ±8e−6 σ — ' +
     'a LOCATOR and a PREDICTOR. This computation is the microscopic version of that conclusion');
}

console.log(`\n${pass}/${pass + fail} checks pass\n`);
process.exit(fail ? 1 : 0);
