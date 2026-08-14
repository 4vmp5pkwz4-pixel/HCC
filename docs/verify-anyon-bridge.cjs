#!/usr/bin/env node
/* ============================================================================
   TWO THINGS THE ATLAS PROMISED AND HAD NOT BUILT

   v3.85.0 ended by naming what it had not done: an instrument for the monodromy
   — the quantity by which a Fibonacci anyon would actually be DETECTED — and a
   station tying the φ-ladder to the fusion space it keeps claiming kinship with.
   Both are decidable, and both are here.

   1. INTERFEROMETRY.  Send a τ around an island and the interference fringe is
      multiplied by the monodromy scalar M_{ab}.  For Fibonacci the two answers
      are exact:

          island empty (charge 1) → M = 1            full visibility
          island holds one τ      → M = −1/φ²        visibility 0.381966, fringe INVERTED

      That is the operational signature.  Not "the state is topological" — a
      number a detector reads.  And it is computed here two independent ways,
      from the S-matrix and from the twists, which must agree.

   2. THE LADDER IS A FUSION SPACE.  q(N) = π φ^{2N}, and the fusion space of
      2N Fibonacci anyons has dimension F_{2N+1}.  Those are the same φ, and the
      relation is an EXACT integer identity:

          dim Fus(2N) = F_{2N+1} = round( φ·(q/π) / √5 )

      At the manuscript's rung, q₀/π = φ^584 and the fusion space is F_585 — a
      122-digit integer, computed here in exact arithmetic rather than asserted.
   ========================================================================= */

let pass = 0, fail = 0;
function ok(t, c, d) { (c ? pass++ : fail++); console.log(`${c ? '  PASS' : '  FAIL'} — ${t}`); if (d) console.log(`         ${d}`); }

const PHI = (1 + Math.sqrt(5)) / 2;
const D_TOT = Math.sqrt(1 + PHI * PHI);
const S = [[1 / D_TOT, PHI / D_TOT], [PHI / D_TOT, -1 / D_TOT]];   /* basis (1, τ) */
const dQ = [1, PHI];                                                /* quantum dimensions */
const THETA = [[1, 0], [Math.cos(4 * Math.PI / 5), Math.sin(4 * Math.PI / 5)]];  /* θ_1 = 1, θ_τ = e^{4πi/5} */
const N3 = (a, b, c) => ((a + b + c) === 1 ? 0 : 1);

/* ── 1. THE MONODROMY, TWO WAYS ──────────────────────────────────────────── */
console.log('\n=== 1. The number an interferometer reads ===\n');

/* route A: straight off the S-matrix.  M_ab = S_ab S_00 / (S_a0 S_0b) */
function monodromyS(a, b) { return (S[a][b] * S[0][0]) / (S[a][0] * S[0][b]); }
/* route B: from the twists and the fusion rule.
   M_ab = (1/(d_a d_b)) Σ_c N^c_ab d_c θ_c/(θ_a θ_b) */
function monodromyTheta(a, b) {
  const div = (x, y) => { const n = y[0] * y[0] + y[1] * y[1];
    return [(x[0] * y[0] + x[1] * y[1]) / n, (x[1] * y[0] - x[0] * y[1]) / n]; };
  const mul = (x, y) => [x[0] * y[0] - x[1] * y[1], x[0] * y[1] + x[1] * y[0]];
  const tab = mul(THETA[a], THETA[b]);
  let re = 0, im = 0;
  for (let c = 0; c < 2; c++) {
    if (!N3(a, b, c)) continue;
    const t = div(THETA[c], tab);
    re += dQ[c] * t[0]; im += dQ[c] * t[1];
  }
  return [re / (dQ[a] * dQ[b]), im / (dQ[a] * dQ[b])];
}
{
  const Mtt = monodromyS(1, 1), MttT = monodromyTheta(1, 1);
  const Mt1 = monodromyS(1, 0), Mt1T = monodromyTheta(1, 0);
  const target = -1 / (PHI * PHI);

  ok('AN EMPTY ISLAND GIVES M = 1 AND A τ INSIDE GIVES M = −1/φ² = −0.381966. That is the ' +
    'operational signature of a Fibonacci anyon: not "the state is topological" but a number a ' +
    'detector reads — the interference fringe keeps 38.2% of its visibility and comes back ' +
    'INVERTED, and no local perturbation of the island can change it',
    Math.abs(Mtt - target) < 1e-14 && Math.abs(Mt1 - 1) < 1e-14,
    `M_{τ1} = ${Mt1.toFixed(12)} · M_{ττ} = ${Mtt.toFixed(12)} · −1/φ² = ${target.toFixed(12)} · ` +
    `|M_{ττ}| = ${Math.abs(Mtt).toFixed(6)} is the surviving visibility and the sign is the π phase slip`);

  ok('and it is computed TWO INDEPENDENT WAYS which must agree: from the S-matrix as ' +
    'S_ab S_00/(S_a0 S_0b), and from the twists and the fusion rule as ' +
    '(1/d_a d_b) Σ_c N^c_ab d_c θ_c/(θ_a θ_b). The first knows nothing about θ and the second ' +
    'knows nothing about S, so agreement is a check on the whole modular data and not a restatement',
    Math.abs(MttT[0] - Mtt) < 1e-13 && Math.abs(MttT[1]) < 1e-13 &&
    Math.abs(Mt1T[0] - Mt1) < 1e-13 && Math.abs(Mt1T[1]) < 1e-13,
    `from θ: M_{ττ} = ${MttT[0].toFixed(12)} ${MttT[1] >= 0 ? '+' : '−'} ${Math.abs(MttT[1]).toExponential(1)}i · ` +
    `from S: ${Mtt.toFixed(12)} · the imaginary part vanishes to ${Math.abs(MttT[1]).toExponential(1)}, ` +
    `which it must, because a monodromy of a self-conjugate pair is real`);

  /* the fringe itself: I(φ) = |t₁|² + |t₂|² + 2 Re( t₁* t₂ M e^{iφ} ) */
  const fringe = (M, phase) => 1 + 1 + 2 * M * Math.cos(phase);
  const vis = M => { let lo = Infinity, hi = -Infinity;
    for (let k = 0; k < 720; k++) { const v = fringe(M, 2 * Math.PI * k / 720); lo = Math.min(lo, v); hi = Math.max(hi, v); }
    return (hi - lo) / (hi + lo); };
  ok('the visibility of the two-path fringe is |M| exactly — 1 with the island empty, 0.381966 ' +
    'with one τ in it. A 61.8% collapse of contrast, and the atlas can draw both curves against ' +
    'each other rather than describe them',
    Math.abs(vis(1) - 1) < 1e-9 && Math.abs(vis(Mtt) - Math.abs(Mtt)) < 1e-9,
    `visibility(empty) = ${vis(1).toFixed(9)} · visibility(one τ) = ${vis(Mtt).toFixed(9)} = 1/φ² · ` +
    `the missing 1 − 1/φ² = ${(1 - 1 / (PHI * PHI)).toFixed(9)} = 1/φ is where the which-path information went`);
}

/* ── 2. THE LADDER IS A FUSION SPACE ─────────────────────────────────────── */
console.log('\n=== 2. q(N) = πφ^{2N} and the fusion space of 2N anyons ===\n');
{
  /* exact Fibonacci in BigInt */
  const fib = n => { let a = 0n, b = 1n; for (let i = 0; i < n; i++) { [a, b] = [b, a + b]; } return a; };
  /* φ^{2N} in exact arithmetic: φ^k = F_k φ + F_{k−1}, so φ^{2N} = F_{2N}φ + F_{2N−1} */
  const digits = x => x.toString().length;

  let idOK = true, rows = [];
  for (const N of [1, 2, 3, 5, 10, 20]) {
    const dim = fib(2 * N + 1);                        /* dim Fus(2N τ) = F_{2N+1} */
    /* round(φ^{2N+1}/√5) — computed with enough precision to be exact at these sizes */
    const approx = BigInt(Math.round(Math.pow(PHI, 2 * N + 1) / Math.sqrt(5)));
    if (2 * N + 1 <= 70 && approx !== dim) idOK = false;
    rows.push(`N=${N}: F_${2 * N + 1} = ${dim}`);
  }
  ok('THE φ-LADDER RUNG AND A FUSION SPACE ARE THE SAME OBJECT. q(N) = π φ^{2N}, and the fusion ' +
    'space of 2N Fibonacci anyons has dimension F_{2N+1} = round(φ^{2N+1}/√5) = round(φ·(q/π)/√5). ' +
    'The atlas has been saying "the golden ladder and this particle are the same φ" since v3.76.0; ' +
    'this is that sentence as an exact integer identity',
    idOK, rows.join(' · '));

  const F585 = fib(585);
  ok('AT THE MANUSCRIPT’S RUNG the correspondence is a 122-digit integer, and it is computed here ' +
    'rather than asserted: q₀/π = φ^584, so the fusion space of 584 τ particles has dimension ' +
    'F_585. The recursion operator’s E_Fus(N) = N ln φ is the logarithm of exactly this number',
    digits(F585) === 122 && F585 > 8n * 10n ** 121n && F585 < 9n * 10n ** 121n,
    `F₅₈₅ has ${digits(F585)} digits and begins ${F585.toString().slice(0, 24)}…${F585.toString().slice(-8)}\n         ` +
    `ln F₅₈₅ = ${(584 * Math.log(PHI) + Math.log(PHI) - 0.5 * Math.log(5)).toFixed(9)} · ` +
    `584 ln φ = ${(584 * Math.log(PHI)).toFixed(9)} · they differ by ln(φ/√5) = ${Math.log(PHI / Math.sqrt(5)).toFixed(9)}, ` +
    `a constant, which is why the RATE is exactly ln φ and the offset never enters E_Fus`);

  /* q₀ = π φ^584 / (1 + π/50) — the valuation gate is part of the shell and was left out of the
     first version of this line, which is exactly the kind of quiet omission the atlas checks for:
     it put u★ 0.0609 too high and the assertion caught it. */
  const u = Math.log(Math.PI) + 584 * Math.log(PHI) - Math.log(1 + Math.PI / 50);
  ok('so u★ = ln q₀ = ln π + 584 ln φ − ln(1 + π/50) decomposes as “one π, the entropy of 584 anyons, ' +
    'and the valuation gate”, and the ' +
    '584 is 2 × 292 — two τ per rung. THAT IS A READING, NOT A DERIVATION, and the atlas says so: ' +
    'nothing here shows the horizon CARRIES those anyons. What is established is that the two ' +
    'appearances of φ are the same φ, and the arithmetic is identical',
    Math.abs(u - 282.1114988153041) < 1e-9,
    `u★ = ln π + 584 ln φ − ln(1 + π/50) = ${u.toFixed(12)} · without the gate it would read ` +
    `${(Math.log(Math.PI) + 584 * Math.log(PHI)).toFixed(6)}, and the first draft of this file did ` +
    `· the shell is 292 rungs and the fusion space is of 584 ` +
    `particles · what is NOT claimed: that the boundary is a Fibonacci anyon liquid — that would ` +
    `need the edge algebra to produce the category, which docs/verify-edge-operator.cjs shows it does not`);
}

console.log(`\n${pass}/${pass + fail} checks pass\n`);
process.exit(fail ? 1 : 0);
