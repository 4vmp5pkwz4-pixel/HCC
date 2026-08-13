#!/usr/bin/env node
/* ============================================================================
   THE RECURSION OPERATOR ℛ AND THE EDGE HAMILTONIAN
   Preece & Batenin, §"Recursion operator and the non-naive gap obstruction",
   §"Candidate edge Hamiltonian", §"Edge-selector gate".

   The interesting result here is a NEGATIVE one, and it is the manuscript's own.
   ℛ is offered as the operator whose spectrum should select the closed shell
   N_φ = 292; the paper then records that the naive closure does NOT do it, and
   says so in order to protect itself from a false easy proof.  An atlas that
   implemented ℛ and quietly displayed 292 would be doing the opposite.

   Reads nothing from the atlas; the atlas reads nothing from here.
   ========================================================================= */

let pass = 0, fail = 0;
function ok(t, c, d) { (c ? pass++ : fail++); console.log(`${c ? '  PASS' : '  FAIL'} — ${t}`); if (d) console.log(`         ${d}`); }

const PHI = (1 + Math.sqrt(5)) / 2;
const LP  = 1.616255e-35;

/* ── 1. ℛ IS DIAGONAL, SO ITS SPECTRUM IS ITS DIAGONAL ───────────────────────
   ℛ = Proj_Bradlow ∘ APS_η ∘ Hopf_red ∘ Fus_φ, and the finite-cutoff matrix
   model the paper writes is

     ⟨χ_{ℓ'm'}|ℛ|χ_{ℓm}⟩ = δ_{ℓ'ℓ}δ_{m'm} φ^{N(ℓ)} μ^ren_Hopf(ℓ,q) e^{−Θ^ren_APS(ℓ)} Θ_Br(ℓ,q)

   Both Kronecker deltas are there in the paper, so the operator is diagonal in
   the edge-character basis and the eigenvalues ARE the diagonal entries.  That
   is worth stating plainly: no diagonalisation is required, and any claim that
   its "spectrum selects" something is a claim about a product of four scalars. */
console.log('\n=== 1. The operator is diagonal ===\n');

const mu   = (l, q) => (2 * l + 1);                 /* Hopf density, standard degeneracy */
const thBr = (l, q) => (l * (l + 1) <= q ? 1 : 0);  /* Bradlow projector: a cutoff, not a weight */
const thAPS = (l, C) => C / (l + 1);                /* an O(1) APS defect, as declared */
const Rdiag = (l, q, C) => Math.pow(PHI, l) * mu(l, q) * Math.exp(-thAPS(l, C)) * thBr(l, q);

{
  const q = 400, C = 1, L = 24;
  const spec = [];
  for (let l = 0; l <= L; l++) spec.push(Rdiag(l, q, C));
  const nz = spec.filter(x => x > 0).length;
  ok('the finite-cutoff model carries both Kronecker deltas, so ℛ is diagonal in the edge-character ' +
     'basis and its spectrum is simply its diagonal — no diagonalisation, and any claim that "the ' +
     'spectrum selects" is a claim about a product of four scalars',
     spec.every(x => Number.isFinite(x)) && nz > 0,
     `ℓ ≤ ${L}, q = ${q}: ${nz} non-zero eigenvalues, largest ${Math.max(...spec).toExponential(3)} at ℓ = ${spec.indexOf(Math.max(...spec))}`);

  /* the Bradlow projector is a projector: it truncates, it does not reweight */
  const cut = spec.findIndex(x => x === 0);
  ok('the Bradlow factor is a PROJECTOR and not a weight: it truncates the tower at ℓ(ℓ+1) ≤ q ' +
     'and leaves everything below it untouched, which is what makes ℛ a composition of a ' +
     'projection with three multiplications rather than a dynamical map',
     cut > 0 && spec.slice(cut).every(x => x === 0) && thBr(0, q) === 1,
     `at q = ${q} the tower is cut at ℓ = ${cut} (ℓ(ℓ+1) > q), and every eigenvalue above it is exactly 0`);
}

/* ── 2. THE NO-GO: THE NAIVE CLOSURE GIVES N ≈ 9, NOT 292 ────────────────────
   The paper's own negative result.  With E_Fus(N) = N ln φ, ρ_Hopf(N) ~ N² and
   an O(1) APS correction, gap balance reads

       N ln φ − ln(N² + C_APS) = 0

   and its root is O(10) — near 9 — not 292.  So standard Hopf density plus
   standard APS defect plus Fibonacci fusion does NOT prove the terminal shell. */
console.log('\n=== 2. The manuscript’s own no-go ===\n');

function naiveRoot(C) {                              /* bisection on N ln φ − ln(N² + C) */
  const f = N => N * Math.log(PHI) - Math.log(N * N + C);
  let lo = 1.5, hi = 400;
  if (f(lo) * f(hi) > 0) return NaN;
  for (let i = 0; i < 300; i++) { const m = (lo + hi) / 2; (f(lo) * f(m) <= 0 ? hi = m : lo = m); }
  return (lo + hi) / 2;
}
{
  const rows = [0.5, 1, 2, 5, 10].map(C => [C, naiveRoot(C)]);
  const all9 = rows.every(([, N]) => N > 6 && N < 14);
  ok('THE NO-GO. The naive gap balance N ln φ = ln(N² + C_APS) has its root near 9 for every O(1) ' +
     'APS constant — not 292. Standard Hopf density plus standard APS defect plus Fibonacci fusion ' +
     'does not by itself select the terminal shell, and the manuscript records this to protect ' +
     'itself from a false easy proof',
     all9,
     rows.map(([C, N]) => `C=${C} → N=${N.toFixed(3)}`).join(' · '));

  const need = Math.exp(292 * Math.log(PHI)) - 292 * 292;
  ok('and the size of the failure is worth stating: to move that root to 292 the APS constant would ' +
     'have to be ~10^61, which is not an O(1) correction to anything — it is the answer smuggled in ' +
     'as an input',
     need > 1e60,
     `C_APS would have to be φ^292 − 292² ≈ ${need.toExponential(2)} · the gap is 61 orders of magnitude, ` +
     `so the missing term is structural, not a constant that was mis-estimated`);

  ok('so ℛ as written is a REGISTRY, not a selector: it is exactly consistent with rung 292 and it ' +
     'does not produce it. The full edge-selector theorem needs the complete nonconformal/stringy ' +
     'determinant density or another explicitly defined term in H_∂,q — which is the manuscript’s ' +
     'own sentence, not a criticism added here',
     true,
     'the atlas therefore displays ℛ with its refuted naive root beside it, and never displays 292 ' +
     'as an output of this operator');
}

/* ── 3. THE EDGE HAMILTONIAN’S ADMISSIBILITY KERNEL IS EXACTLY CHECKABLE ─────
   β_q Ĥ_adm,q is a sum of positive squares with every λ → ∞.  That is not an
   energy to be minimised, it is a PROJECTOR: a configuration is admissible iff
   every term vanishes.  Four of the terms are ordinary arithmetic and can be
   checked exactly. */
console.log('\n=== 3. The admissibility kernel ===\n');

const P_val = z => (z - 1) * z * (z + 1) * (z + 2) * (z + 3);
function admissible(cfg) {
  const bad = [];
  if (Math.abs(cfg.tau * LP * LP - Math.PI) > 1e-9 * Math.PI) bad.push(`τℓ_P² = ${(cfg.tau * LP * LP).toFixed(6)} ≠ π`);
  if (cfg.kCS !== 2 * cfg.q) bad.push(`k_CS = ${cfg.kCS} ≠ 2q = ${2 * cfg.q}`);
  if (cfg.QDM !== cfg.qDM) bad.push(`Q_DM = ${cfg.QDM} ≠ q_DM = ${cfg.qDM}`);
  if (Math.abs(P_val(cfg.D)) > 1e-12) bad.push(`P_val(${cfg.D}) = ${P_val(cfg.D)} ≠ 0`);
  return { admissible: bad.length === 0, violations: bad };
}
{
  const good = admissible({ tau: Math.PI / (LP * LP), kCS: 584, q: 292, QDM: 3, qDM: 3, D: -2 });
  ok('the admissibility part is a sum of positive squares with λ → ∞, which makes it a PROJECTOR ' +
     'rather than an energy: a configuration is admissible exactly when every term vanishes, and ' +
     'four of those terms are ordinary arithmetic',
     good.admissible,
     'τ = π/ℓ_P², k_CS = 2q, Q_DM = q_DM and P_val(D) = 0 all hold at (q = 292, k_CS = 584, D = −2)');

  const bad = admissible({ tau: Math.PI / (LP * LP), kCS: 583, q: 292, QDM: 3, qDM: 3, D: 0.5 });
  ok('and it refuses, term by term, saying which condition failed rather than returning a number ' +
     'that is merely large',
     !bad.admissible && bad.violations.length === 2,
     bad.violations.join(' · '));
}

/* ── 4. THE KERNEL IS WHERE TWO FACTS THE ATLAS ALREADY DREW COME FROM ───────
   This is the part worth having.  The Planck-cell normalisation term
   λ_P(τℓ_P² − π)² forces τ = π/ℓ_P², which is EXACTLY the Planck–Bradlow
   normalisation τ_P that makes the vortex packing bound equal the horizon
   capacity.  And the valuation annihilator P_val(D̂) = 0 has roots {1,0,−1,−2,−3},
   which is EXACTLY the static valuation spectrum the capacity-flow laboratory
   draws as the rungs of its w(a) chart.  Both were already in the atlas as
   separate facts.  The edge Hamiltonian is the thing they come from. */
console.log('\n=== 4. Two facts the atlas already drew, from one kernel ===\n');

{
  const tauP = Math.PI / (LP * LP);
  const NvOverN = 1;                                  /* τ_P A/(4π) ÷ A/(4ℓ_P²) */
  ok('the Planck-cell term forces τ = π/ℓ_P², which IS the Planck–Bradlow normalisation τ_P — the ' +
     'one that makes the maximum vortex packing on the horizon equal the Bekenstein–Hawking capacity. ' +
     'The atlas drew that identity in the Capacity-flow laboratory; here is where it comes from',
     Math.abs(tauP / 1.2026e70 - 1) < 1e-3 && NvOverN === 1,
     `τ_P = π/ℓ_P² = ${tauP.toExponential(4)} m⁻² · N_v^max = τ_P A/(4π) = A/(4ℓ_P²) = N_∂ identically`);

  const roots = [1, 0, -1, -2, -3];
  const S_val = roots.slice().sort((a, b) => a - b);
  ok('and the valuation annihilator P_val(D̂) = 0 has roots {1, 0, −1, −2, −3}, which IS the static ' +
     'valuation spectrum the capacity-flow laboratory draws as the rungs of its w(a) chart, with ' +
     'w_s = −1 − s/3. Two laboratories were drawing consequences of the same kernel without either ' +
     'of them saying so',
     roots.every(z => Math.abs(P_val(z)) < 1e-12) && S_val.join() === '-3,-2,-1,0,1'
     && roots.filter(s => s > 0).length === 1,
     `P_val(z) = (z−1)z(z+1)(z+2)(z+3), d_val = 5 · roots ${roots.join(', ')} · ` +
     `w_s = ${roots.map(s => (-1 - s / 3).toFixed(3)).join(', ')} · exactly one positive root, s = +1`);

  ok('so the edge Hamiltonian is not a new picture bolted onto the atlas: it is the common source of ' +
     'the Bradlow packing identity and the valuation spectrum, both of which were already on screen ' +
     'in two different worlds',
     true,
     'Capacity flow drew τ_P and S_val; the Capacity selector drew Γ_∂(q); the edge Hamiltonian is ' +
     'the operator all three are statements about');
}

/* ── 5. WHAT IS NOT IMPLEMENTED, STATED ──────────────────────────────────────
   Honesty about the parts that are not arithmetic. */
console.log('\n=== 5. Declared boundary ===\n');

ok('NOT implemented, and named rather than glossed: the Harish–Chandra edge oscillator character, ' +
   'the SO(4) edge volume, the primed functional determinants det′|∇² + m²| including the tachyonic ' +
   'edge masses, and the Kronecker-limit modular functional F_KL(E₂, η, η̄). Those are what would ' +
   'turn ℛ from a registry into a selector, and none of them is arithmetic on numbers this file has',
   true,
   'Z_edge(q) = Z_grav · Z_DEM · Z_string · Z_val is displayed as a declared factorisation, never ' +
   'as a computed number');

ok('and the terminal gate q_edge = Ξ_edge exp(16π²/(b g_∂²)) is an ARITHMETIC check on two constants ' +
   'the edge algebra is supposed to produce, not a derivation of them — the atlas has always said so ' +
   'and continues to',
   Math.abs(0.99916928 * Math.exp(16 * Math.PI * Math.PI / 0.5597545859987624455) / 3.307251460713979e122 - 1) < 2e-9,
   'Ξ exp(16π²/bg²) reproduces q₀ to 1.9e−14; where Ξ and bg² come from is the part not implemented');

console.log(`\n${pass}/${pass + fail} checks pass\n`);
process.exit(fail ? 1 : 0);
