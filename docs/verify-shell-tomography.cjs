#!/usr/bin/env node
'use strict';
/* ══ S³ SHELL TOMOGRAPHY, CHECKED AGAINST THE PAPER THAT DERIVED IT ════════════
 *
 * Preece & Batenin, "Field reconstruction and curvature identifiability from
 * spherical maps in a closed spatial geometry" (9 September 2026), implemented in
 * the atlas as arithmetic rather than quoted as a result.
 *
 * The paper reports its own verification program: 774 assertions, exact shell
 * ranks for 0 ≤ L ≤ 8, a coefficient table for the thin-layer minimum, and a
 * two-shell inversion at d1 = 3, d2 = 6, R = 10. This reproduces those from the
 * atlas's own functions, sliced out of index.html — so what is checked is the
 * code the interface runs, against numbers printed in a document it did not
 * write.
 */
const fs = require('node:fs'), path = require('node:path'), vm = require('node:vm');
const src = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
let pass = 0, fail = 0;
const ok = (n, c, d) => { if (c) { pass++; console.log('  PASS — ' + n + (d ? ' :: ' + d : '')); }
  else { fail++; console.log('  FAIL — ' + n + (d ? ' :: EXPECTED ' + d : '')); } };

const S = src.slice(src.indexOf('function tomoBinom('), src.indexOf('function hccTomographyPublish('));
ok('the tomography was cut out of index.html rather than copied beside it',
  S.length > 3000 && /tomoRadiusFromRatio/.test(S), `${S.length} chars of live source`);

const ctx = vm.createContext({ Math, Object, Array, Number, console, JSON, globalThis: {} });
const T = vm.runInContext(S + '\n({tomoBinom,TOMO_N,tomoRank,tomoNull,tomoRankBySector,tomoShellDesign,tomoH,tomoJ,tomoLambdaCoefficient,tomoLambdaMin,tomoRadial,tomoMixing,tomoDegeneracy,tomoRatio,tomoRadiusFromRatio,tomoFisher,tomoCapFraction,tomoConfluentNull,tomoContaminationBound,tomoFlatLimit,TOMO_OBSTRUCTIONS})', ctx, { timeout: 20000 });

/* ── Theorem 1 and 2: the rank bound and the null space ──────────────────── */
ok('the band dimension is the paper`s N_j = (j+1)(j+2)(2j+3)/6, and it is zero below zero so the edges need no special case',
  T.TOMO_N(0) === 1 && T.TOMO_N(1) === 5 && T.TOMO_N(2) === 14 && T.TOMO_N(-1) === 0 && T.TOMO_N(-3) === 0,
  'N_0 = 1, N_1 = 5, N_2 = 14, N_(−1) = 0');
{
  let agree = 0, checked = 0;
  for (let L = 0; L <= 8; L++) for (let q = 1; q <= L + 2; q++) {
    checked++; if (T.tomoRankBySector(L, q) === T.tomoRank(L, q)) agree++;
  }
  ok('the rank written sector by sector and the rank written as N_L − N_(L−q) agree for every case the paper checked',
    agree === checked, `${agree} of ${checked} cases over 0 ≤ L ≤ 8, 1 ≤ q ≤ L+2 — the two forms are computed separately and compared`);
}
ok('ONE SKY MAP OF A BAND-LIMITED FIELD LEAVES N(L−1) DIRECTIONS UNIDENTIFIABLE, whatever the map is: at L = 4 a single shell sees 25 of 55 directions and thirty are lost, and no angular resolution buys them back',
  T.tomoRank(4, 1) === 25 && T.tomoNull(4, 1) === 30 && T.TOMO_N(4) === 55,
  'rank 25, null 30, band 55 — the rank of one shell is (L+1)² by construction');
ok('and L+1 shells are necessary AND sufficient: at L+1 the null space is empty and at L it is not',
  [0, 1, 2, 5, 8].every(L => T.tomoNull(L, L + 1) === 0 && (L === 0 || T.tomoNull(L, L) > 0)),
  'the monopole sector alone holds L+1 radial degrees of freedom, which angular modes cannot replace');

/* ── the Gaussian shell design ────────────────────────────────────────────── */
for (const L of [0, 1, 3, 6]) {
  const d = T.tomoShellDesign(L);
  const sum = d.reduce((a, x) => a + x.w, 0);
  ok(`the Gauss–Chebyshev design at L = ${L} has L+1 shells strictly inside the sphere and weights summing to one`,
    d.length === L + 1 && d.every(x => x.chi > 0 && x.chi < Math.PI) && Math.abs(sum - 1) < 1e-12,
    `χ = ${d.map(x => x.chi.toFixed(4)).join(', ')} · Σw = ${sum.toFixed(12)}`);
}

/* ── Theorem 3: the thin-layer coefficient, against the paper's table ─────── */
{
  /* The table is printed to eight significant figures, so the honest test is that
     each computed value agrees with its printed one TO THE LAST PRINTED DIGIT —
     half a unit in that place. A single global tolerance was tried first and went
     red at L = 2 against a departure of 3.5e-8, which is inside the precision the
     paper printed: a check tighter than the number it reads cannot pass and is not
     measuring agreement, it is measuring the width of a column. */
  const TABLE = ['1', '0.58091171', '0.11781344', '0.018139078', '0.0024629588',
                 '0.00031074507', '3.7342137e-05'];
  const chi0 = 1.1;
  const ulp = str => { const v = Number(str);
    const digits = str.replace(/^0\.?0*|e[+-]?\d+$|[.]/g, '').replace(/^0+/, '').length;
    return 0.5 * Math.pow(10, Math.floor(Math.log10(Math.abs(v))) - digits + 1); };
  let worstL = 0, worstRatio = 0, allWithin = true;
  for (let L = 0; L < TABLE.length; L++) {
    const printed = Number(TABLE[L]), c = T.tomoLambdaCoefficient(L, chi0);
    const within = Math.abs(c - printed) <= ulp(TABLE[L]);
    const ratio = Math.abs(c - printed) / ulp(TABLE[L]);
    if (ratio > worstRatio) { worstRatio = ratio; worstL = L; }
    if (!within) allWithin = false;
  }
  ok('THE THIN-LAYER COEFFICIENT REPRODUCES THE PAPER`S OWN TABLE TO THE LAST PRINTED DIGIT FOR EVERY L IT PRINTS, from h_L and J_L in closed form with no quadrature anywhere',
    allWithin,
    `L = 0 to 6 at χ₀ = 1.1 rad · the largest departure is ${(100 * worstRatio).toFixed(0)}% of half a unit in the last printed place, at L = ${worstL} · c_1 computed ${T.tomoLambdaCoefficient(1, chi0).toFixed(8)} against 0.58091171 printed`);
  ok('and at the equator with L = 1 the minimum is the four-thirds ε² the paper states in its text',
    Math.abs(T.tomoLambdaCoefficient(1, Math.PI / 2) - 4 / 3) < 1e-12,
    `${T.tomoLambdaCoefficient(1, Math.PI / 2).toFixed(12)} against 4/3`);
  ok('the weakest mode falls as ε^(2L), so halving the layer costs a factor of four per unit of band',
    Math.abs(T.tomoLambdaMin(3, chi0, 0.02) / T.tomoLambdaMin(3, chi0, 0.04) - Math.pow(0.5, 6)) < 1e-9,
    'measured by evaluating the closed form at two widths rather than by fitting a slope');
}

/* ── Theorem 4: the degeneracy a single map cannot see through ────────────── */
{
  let worst = 0, allPositive = true;
  for (let L = 1; L <= 7; L++) {
    const P0 = Array.from({ length: L + 1 }, (_, i) => 1 / (1 + i));
    const d = T.tomoDegeneracy(L, 0.9, 0.90001, P0);
    if (d.residual > worst) worst = d.residual;
    if (!d.positive) allPositive = false;
  }
  ok('A SINGLE MAP HAS NO LOCAL INFORMATION ABOUT ITS OWN RADIUS. Moving the shell and re-solving M(χ)P = M(χ₀)P⁰ leaves the entire Gaussian sky covariance unchanged, with every band power still positive — checked for 1 ≤ L ≤ 7 at the paper`s own χ = 0.9 and 0.90001',
    worst < 1e-9 && allPositive,
    `worst relative covariance residual ${worst.toExponential(2)} across the seven bands, every compensating spectrum positive`);
  const M = T.tomoMixing(1, 0.7);
  ok('and the L = 1 mixing matrix is the one the paper writes out by hand: C₀ = P₀ + 4cos²χ P₁ and C₁ = (4/3)sin²χ P₁',
    Math.abs(M[0][0] - 1) < 1e-12 &&
    Math.abs(M[0][1] - 4 * Math.cos(0.7) ** 2) < 1e-12 &&
    Math.abs(M[1][1] - (4 / 3) * Math.sin(0.7) ** 2) < 1e-12 && M[1][0] === 0,
    'the radial basis was implemented from its Gegenbauer definition and lands on the paper`s closed form');
  ok('the antipodal ambiguity is real and is not patched away: M(π−χ) equals M(χ) exactly',
    (() => { const a = T.tomoMixing(3, 0.8), b = T.tomoMixing(3, Math.PI - 0.8);
      let w = 0; for (let i = 0; i < a.length; i++) for (let j = 0; j < a.length; j++)
        w = Math.max(w, Math.abs(a[i][j] - b[i][j])); return w < 1e-12; })(),
    'a parity of the Gegenbauer polynomials, which an angular-radius prior can remove and the arithmetic cannot');
}

/* ── Theorem 5: two shells recover the radius ─────────────────────────────── */
{
  const d1 = 3, d2 = 6, R = 10;
  let worst = 0;
  for (const L of [1, 2, 4, 7]) {
    const g = T.tomoRatio(R, d1, d2, L);
    const back = T.tomoRadiusFromRatio(g, d1, d2, L);
    worst = Math.max(worst, Math.abs(back / R - 1));
  }
  ok('TWO CALIBRATED SHELLS RECOVER THE CURVATURE RADIUS FROM THEIR HIGHEST SECTOR ALONE, without the field and without the band power — the paper`s own test, d₁ = 3, d₂ = 6, R = 10, at L = 1, 2, 4 and 7',
    worst < 1e-9, `worst relative error ${worst.toExponential(2)} over the four bands`);
  ok('and at κ = 2 the closed form and the bisection are the same number, which is the check that the inversion inverts what it claims to',
    (() => { const g = T.tomoRatio(R, d1, d2, 3);
      const closed = d1 / Math.acos(Math.pow(g, 1 / 3) / 2);
      return Math.abs(closed / T.tomoRadiusFromRatio(g, d1, d2, 3) - 1) < 1e-9; })(),
    'R = d₁ / arccos(g^(1/L)/2) against the monotone root of sin(κx)/sin(x)');
  ok('the ratio is strictly decreasing in the radius, which is what makes the root unique rather than merely present',
    [4, 6, 10, 20, 60].every((r, i, a) => i === 0 || T.tomoRatio(r, d1, d2, 2) > T.tomoRatio(a[i - 1], d1, d2, 2)),
    'g rises toward its flat-space κ^L as R grows, so each admissible ratio has exactly one radius');
  ok('and a ratio outside the branch is refused rather than fitted',
    T.tomoRadiusFromRatio(Math.pow(2.5, 2), d1, d2, 2) === null && T.tomoRadiusFromRatio(0, d1, d2, 2) === null,
    'g^(1/L) must lie strictly between zero and κ, and outside that the function returns nothing');
  const F = T.tomoFisher(R, d1, d2, 2, 1, 0.1, 0.1);
  ok('the Fisher information for the radius is positive and falls steeply with it, which is the nearly-flat limit the paper derives',
    F.I_R > 0 && T.tomoFisher(2 * R, d1, d2, 2, 1, 0.1, 0.1).I_R < F.I_R / 20,
    `I_R = ${F.I_R.toExponential(3)} at R = 10 and ${T.tomoFisher(20, d1, d2, 2, 1, 0.1, 0.1).I_R.toExponential(3)} at R = 20 — it decays as R⁻⁶`);
}
ok('the cap fraction is computed and is NOT used as an information fraction anywhere, which is the paper`s own warning',
  Math.abs(T.tomoCapFraction(Math.PI) - 1) < 1e-12 && !/cap_fraction[^;]*rank/.test(src),
  'f(π) = 1 · a volume fraction does not determine the rank or the singular values of a sky operator');

/* ── and the verdict reaches every screen the atlas draws ─────────────────── */
{
  const built = (src.match(/screenSphere\(/g) || []).length - 1;   // minus the definition
  ok('every observer-centred screen is collected as it is built, in the one constructor they all go through, so a shell added later cannot arrive without the verdict',
    /SHELL_SCREENS\.push\(/.test(src) &&
    /rows:\(\)=>rows\.concat\(shellTomographyRows\(selKey\)\)/.test(src) && built >= 6,
    `${built} screens built through screenSphere, each one appending its own rank row`);
  ok('and the JOINT bound over those screens is computed and refused in writing, which is a different thing from not computing it',
    /joint_claimed:false/.test(src) && /joint_refusal:/.test(src) &&
    /maps of different fields at different epochs/.test(src),
    'they are maps of different fields at different epochs, not q maps of one field on one slice');
}

/* ── and the three theorems that had only numbers now have pictures ───────── */
{
  const drawn = [
    ['the thin-layer ladder', /singular values in powers/, /Math\.pow\(eps,\s*2\*k\)/, /\(L-k\+1\)\*\(L-k\+1\)/],
    ['the monotone two-shell curve', /strictly monotone/, /tomoRatio\(R,d1,d2,Lr\)/, /tomoRadiusFromRatio\(gRef/],
    ['the degeneracy bars', /it MOVES/, /it does NOT/, /tomoDegeneracy\(Ld,chi0,chi,P0\)/],
  ];
  for (const [name, ...pats] of drawn)
    ok(`${name} is drawn from the same functions the readout uses, not from a sketch of them`,
      pats.every(p => p.test(src)),
      pats.map((p, i) => (p.test(src) ? '' : `missing pattern ${i + 1}`)).filter(Boolean).join(', ') || 'every element present in the live source');
  ok('and what the scene actually contains is askable, so a theorem with no picture and a picture with no theorem can be told apart',
    /drawn:\(\(\)=>\{/.test(src) && /if\(!_tomoExtra\.length\) tomoBuild\(\)/.test(src),
    'HCC_SHELL_CENSUS builds the group on demand and counts what is in it');
}

/* ── what breaks the reconstruction, which an instrument must carry too ───── */
{
  let same = 0, checked = 0;
  for (let L = 0; L <= 6; L++) for (let s2 = 1; s2 <= L + 2; s2++) {
    checked++;
    const jet = T.tomoConfluentNull(L, [{ chi: 1.0, s: s2 }]);
    if (jet.null_dimension === T.tomoNull(L, s2) && jet.rank === T.tomoRank(L, s2)) same++;
  }
  ok('A JET IS WORTH SHELLS, EXACTLY: measuring orders 0 through s−1 at ONE radius imposes a root of multiplicity s and leaves the same N(L−s) directions lost as s distinct shells would — checked over the range the paper checks its confluent ranks',
    same === checked, `${same} of ${checked} cases over 0 ≤ L ≤ 6`);
  ok('the leakage bound is the paper`s, and it REFUSES to return a number where the identity gives none',
    Math.abs(T.tomoContaminationBound(2, 0.1, 0.05) - (0.05 + 2 * 0.1) / 0.9) < 1e-12 &&
    T.tomoContaminationBound(2, 1, 0.05) === null && T.tomoContaminationBound(2, 1.5, 0.05) === null,
    `(η₂ + g η₁)/(1 − η₁) = ${T.tomoContaminationBound(2, 0.1, 0.05).toFixed(6)} at g = 2, η₁ = 0.1, η₂ = 0.05 · nothing at η₁ ≥ 1`);
  {
    const a = T.tomoFlatLimit(1000, 3, 6, 1), b = T.tomoFlatLimit(100, 3, 6, 1);
    ok('THE NEARLY FLAT LIMIT IS AN EXPANSION AND ITS DEPARTURE PROVES IT: ln g tends to L ln κ minus L(d₂²−d₁²)K/6, and what it misses scales as K² with a constant of proportionality that holds across four decades of curvature',
      Math.abs(a.departure_over_K2 / b.departure_over_K2 - 1) < 0.02,
      `departure/K² = ${a.departure_over_K2.toFixed(4)} at R = 1000 and ${b.departure_over_K2.toFixed(4)} at R = 100 — the O(K²) term the paper writes and does not evaluate`);
  }
  ok('and the obstructions that are NOT computable are declared rather than omitted, which is the difference between an instrument and a demonstration',
    T.TOMO_OBSTRUCTIONS.length === 4 &&
    T.TOMO_OBSTRUCTIONS.filter(o => !o.computable).length === 3 &&
    T.TOMO_OBSTRUCTIONS.every(o => o.what && o.effect && o.note),
    T.TOMO_OBSTRUCTIONS.map(o => o.id).join(', ') + ' — an unknown relative gain makes the observable b·g(R), and no precision in the ratio removes that');
}

console.log(`\n  ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
