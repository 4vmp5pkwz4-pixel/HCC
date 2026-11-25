# Formal verification — HCC Scale Nexus (Frontier II, items 13–19)

## What is proved, and what is not

- **What the Lean library proves** (`lean/scale-nexus/`) is mathematics about the coordinates the atlas uses: identities, inverses, a group action and its invariant, inequalities, the geometry of a round S³, one algebraic identity of the Friedmann relation, and linear covariance propagation.
- **What it does not prove:**
  - no physical model is formalised: general relativity is absent, and the Friedmann relation is a hypothesis of the theorems that use it;
  - nothing about data, fits or the golden lattice.

## Build (item 19)

**Pinned versions**

| | |
|---|---|
| Lean | 4.19.0, commit 6caaee842e94 |
| Lake | 5.0.0-6caaee8 |
| Mathlib | v4.19.0, rev c44e0c8ee63ca166450922a373c7409c5d26b00b (`lake-manifest.json`) |
| Library | `lakefile.toml` v0.2.0, `lean_lib ScaleNexus`, roots `ScaleNexus`, `Frontier` |

**Clean rebuild.** In a new directory holding only the sources, the lakefile, the toolchain and the manifest:
1. `lake update`, then `lake exe cache get`;
2. `rm -rf .lake/build`, then `lake build`.

The full log is in `build.log`, and `REBUILD.md` gives the procedure and the hash history.

**Olean hashes (sha256)**
- ScaleNexus.olean: `e7f47689682ad996d04a7fc80e8a433536ea3dc7d8477766561d26c3e9b35d27`
- Frontier.olean: `8fec991a70fa0ab5c9e6ac3a46529cf66beeeae8b1d5adf9e54a76b0efbd5262`

**Reproducibility.**
- Three builds of identical sources gave identical oleans.
- ScaleNexus.olean changed exactly once, when its module docstring changed. Lean stores docstrings in the olean.
- Frontier.olean was identical across all three builds.

**Integrity.** Every file of the record is hashed in `SHA256SUMS`, and `docs/verify-the-scale-nexus.mjs` re-checks the hashes on every run.

## Axiom audit

- `Audit.lean` prints `#print axioms` for **all 42 theorems**; its output is `axioms.txt`.
- Every line reads `[propext, Classical.choice, Quot.sound]`: Lean's standard foundations.
- There is no `sorry`, no `admit` and no `axiom` declaration in any source.
- The verifier checks that every theorem in the sources appears in the audit, and the reverse.

## The 42 theorems

**`ScaleNexus.lean` (29, first release)**
- **The SI bridge and the coordinates:** product, ratio, si_bridge, left_u, left_v, right_a, right_b, product_log, ratio_log, log_coordinates, density_line.
- **Rungs:** radius_level, level_radius, relabel, golden_log_bridge.
- **The walls and their crossing:** horizon_normalized, crossing_squared, crossing.
- **Dilation:** dilation (C → s^{p−1}C, Q → s^{−p−1}Q).
- **The round S³:** areal_symmetric, cap_complement, areal_le_geodesic, capVolume_deriv, capVolume_integral, cap_le_ball, ball_sub_le_cap (the two-sided flat limit).
- **FLRW, with Friedmann as a hypothesis:** apparent_horizon, apparent_horizon_omega.
- **Photons:** photon_on_compton_line.

**`Frontier.lean` (13, Frontier II)**

| # | Item | Theorem | Statement (Planck-normalised) |
|---|---|---|---|
| 13 | allowed masses | `allowed_masses` | for m, r > 0: (C ≤ 1 ∧ Q ≤ 1) ⇔ 1/r ≤ m ≤ r/2 |
| 13 | nonempty iff | `allowed_nonempty` | ∃ m > 0 with C ≤ 1 ∧ Q ≤ 1 ⇔ r² ≥ 2 |
| 14 | unique crossing | `crossing_unique` | ∃! (m, r) with m, r > 0, C = Q = 1, namely (1/√2, √2) |
| 15 | dilation group | `dil_one`, `dil_comp`, `dil_inv` | identity, composition dil_s ∘ dil_t = dil_{st}, inverse |
| 15 | invariant | `dilation_invariant` | C^{p+1} Q^{p−1} is unchanged by dil_s of exponent p |
| 16 | both branches | `branches_geodesic` | Aχ + A(π − χ) = πA |
| 16 | monotone volume | `capVolume_strictMono` | the cap volume is strictly increasing on [0, π] |
| 16 | near vs far | `near_lt_far` | for χ < π/2: V(χ) < V(π − χ), with equal areal radius |
| 17 | horizon bound | `apparent_lt_curvature` | Ω_K < 0 ⇒ R_H/√(1 − Ω_K) < R_H/√(−Ω_K), i.e. R_A < A |
| 18 | covariance | `covariance_propagation` | J Σ Jᵀ for the affine map (ln M, ln R) ↦ (a, b) |
| 18 | covariance with G | `covariance_with_G` | G adds k²σ_G² to σ_a² and nothing to σ_b² or cov(a, b) |

**Quantitative flat-limit bounds (item 16).**
- `cap_le_ball` and `ball_sub_le_cap` give (4/3)π(Aχ)³ − (2/5)πA³χ⁵ ≤ V(χ) ≤ (4/3)π(Aχ)³.
- The verifier places the JavaScript cap between these bounds.

## Lean ↔ kernel parity

- **Exact rational fixtures.** `Fixtures.lean` prints 60 exact rational fixtures, and `fixtures.json` is equal to its output element for element.
  - The JavaScript kernel matches them within 3.8·10⁻¹⁵ relative, over 540 comparisons.
  - The exact dilation law holds in every Lean row.
- **Frontier II identities, checked numerically in the page's kernel** (verifier check 13 and `docs/verify-the-scale-dynamics.mjs` check 5):
  - the allowed-mass interval over 61 decades of radius (endpoint error 2.2·10⁻¹⁶);
  - R_A/A < 1 and both χ branches in 21 FLRW cases;
  - the invariant along 20 000 random tracks (worst drift 5.7·10⁻¹⁴).

  A numerical check is not a proof. It shows that the code computes what the theorems state.

## Open

- **No independent rebuild on other hardware.** All three builds were made by the same agent on the same machine type. A reviewer's rebuild is part of G7.
- **Physics is not formalised.** General relativity, the Friedmann equation and quantum mechanics enter only as hypotheses or as names.
