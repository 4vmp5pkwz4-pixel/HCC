# CEF × OpenAI Math: selector integrity and bridge audit

**Date:** 2026-10-08. **Status:** research audit, not evidence of established quantum gravity.
**Reviewed source snapshot:** [openai/math, commit fd4aeeb2ee4fc729c18d98444fed42fd0529eeeb](https://github.com/openai/math/commit/fd4aeeb2ee4fc729c18d98444fed42fd0529eeeb).
**Internal target:** HCC `docs/verify-capacity-selector-closure.cjs` (before this branch: derivative and global-convexity error).
**Code gate:** `node docs/verify-capacity-selector-sign.cjs`.

## P0: exactly stated differential obstruction

The selector verifier explicitly asserted the two simultaneous statements

```text
Gamma(q) = q*(log(q/q_star)-1) + nu*log(q)
dGamma(q)/dq = log(q/q_star) - nu/q
```

They are incompatible. If `-log Z_edge = +nu log q + r(q)`, then necessarily

```text
Gamma' (q) = log(q/q_star) + nu/q + r'(q)
Gamma''(q) = 1/q - nu/q^2 + r''(q).
```

If—and only if—the omitted remainder is constant (or separately controlled), the derivative formula simplifies to the corrected expressions in the verifier. For `nu=1/2`, the claim of strict convexity on all `q>0` is false: `Gamma''(1/4) = -4` in this model. Indeed `Gamma(q)->-infinity` as `q->0+` if the remainder is constant. There is **no global minimizer over q>0** under those assumptions.

### Correct conditional theorem (continuous q)

Let `q_star > exp(nu)`, `0 < nu < 1`, and `q >= 1`. Assume the free energy exactly equals
`Gamma(q)=q(log(q/q_star)-1)+nu log q+C`, with `C` constant.
Then `Gamma''(q)=(q-nu)/q^2>0` for all `q>=1`, `Gamma'(1)=nu-log(q_star)<0`, and `Gamma'(q)->+infinity` as `q->infinity`.
Therefore there is exactly **one global minimizer on [1,infinity)**, at
`q_min = -nu / W_0(-nu/q_star)` (principal real Lambert-W branch).
Its relative displacement from the input `q_star` is `O(nu/q_star)`; for this numerical model it is below double-precision resolution. This does **not** independently determine `q_star`: `q_star` already appears inside the free energy. An independent renormalized edge partition function and a physical domain/measure are still required.

**Alternative sign convention:** If `-log Z_edge = -nu log q`, the old code derivatives were appropriate, but the written free-energy statement was wrong. We use the *written* `+nu log q` sign and explicitly expose this convention rather than silently conflating alternatives.

**Discrete capacity:** Nothing here proves a unique integer capacity, identifies `q_can=q_ind=N_emb`, or constructs a regulator-independent physical partition measure.

### Regression safeguards

- `node docs/verify-capacity-selector-closure.cjs`: corrected plus derivative, Hessian and explicit `q>=1` domain.
- `node docs/verify-capacity-selector-sign.cjs`: independent finite differences; checks the non-convex counterexample and distinguishes the input `q_star` from an exact derivative root.
- Planck-reference numeric proximity is marked a *conditional input-based comparison*, not an out-of-sample prediction. The illustrative sigma uses an uncorrelated approximation and cannot establish astrophysical provenance.

## Primary-source candidates in OpenAI Math

The collection includes numerous research preprints, some with Lean formalizations; the collection's README explicitly warns that not all unformalized claims are sound. Its [history](https://github.com/openai/math/blob/main/history.md) records three manuscript withdrawals on 2026-10-07 because a sign error invalidated a core cancellation and downstream arguments. The research manuscripts below are **author-proposed results**, not independently certified as true in this audit.

| Primary manuscript | Exact published scope / hypothesis | CEF bridge assessment |
| --- | --- | --- |
| [Bounded recovery for modular spectral averages](https://github.com/openai/math/blob/main/preprints/Bounded-recovery-for-modular-spectral-averages-September-23-2026/build/sections/01-introduction.tex) | Separably acting Type-III_1 factor and faithful normal state; bicentralizer scalarity, and bounded recovery under a *scalar* modular centralizer for its separate theorem | Potential analytical technique for `T_q`, **not** a Type-II normal-weight existence theorem. Under a faithful normal trace on a nontrivial finite factor, the modular automorphisms are trivial and centralizer is the entire factor, not scalar. No direct transfer of hypotheses. |
| [Area-controlled end replacement and Bondi–Penrose inequality in CKS class](https://github.com/openai/math/blob/main/preprints/Area-controlled-end-replacement-and-the-Bondi-Penrose-inequality-in-the-CKS-class-September-27-2026/build/sections/00-introduction.tex) | DEC, CKS hyperboloidal asymptotics, positive timelike Bondi initial-data charge; under additionally `theta_+(S)<=0`, proposed inequality `sqrt(E_B^2-|P_B|^2)>=sqrt(A_min(S)/(16*pi))` in `G=c=1` | A *candidate* geometric bound for the shape/mass side. Here `A_min` is the infimum over enclosing cuts, **not automatically the area of the apparent horizon**, not a memory charge, and not CIVP-to-index transgression. Its proof imports an asymptotically flat numerical inequality, requiring separate audit. |
| [Two-dimensional area law from a global spectral gap](https://github.com/openai/math/blob/main/preprints/A-two-dimensional-area-law-from-a-global-spectral-gap-September-24-2026/build/sections/00-introduction.tex) | A unique, globally gapped ground state of finite-range bounded Hamiltonians on finite induced square-lattice domains: proposed `S(A)<=C(q,R,J,Delta)|partial A|` | A promising *non-gravitational lattice* bound. Its local Hilbert-space dimension `q` is not the CEF horizon capacity `q`; no black-hole entropy, Type-II limit, or quantum-gravity embedding follows without a mathematically specified map. |
| [Closed Ricci flow with bounded scalar curvature and finite-time blow-up](https://github.com/openai/math/blob/main/preprints/A-closed-Ricci-flow-with-bounded-scalar-curvature-and-finite-time-curvature-blowup-September-24-2026/build/sections/01-introduction.tex) | Proposed high-dimensional example on `S^2 x S^(q+1)`, `q>=10`, with bounded scalar curvature and divergent full curvature at finite time | Candidate warning against relying on scalar curvature as a universal singularity detector. **Not** a theorem about round spatial `S^3` or four-dimensional spacetime gravity. |

## The six explicit closure gates

1. **`q_can–q_ind–N_emb`** — Open. Distinguish index/evaluation algebra from a *physical* operator correspondence with regulator and bundle data.
2. **CIVP/Damour → index/determinant line** — Open. Require an actual morphism and commuting diagram, not a numerical coincidence.
3. **`T_q` conditional trace/normal-weight** — Open. Require the algebra type, faithful normal weight or trace domain, modular action, and explicit proof that the source hypotheses apply.
4. **`zeta_partial` UV activity** — Open. Require a defined positive operator, domain, spectral asymptotics, and renormalization-invariance analysis.
5. **Shape/memory nonfactorization** — Open. Bondi mass/area data alone do not implement soft/hard BMS charge brackets or gravitational-wave memory.
6. **Selector stability** — Strict convexity *only on declared `q>=1` and constant remainder* follows analytically for `nu=1/2`; independent `q_star` selection, measure dependence, and observational predictive status remain open.

## Admission rule

No primary-source preprint, atlas numerical self-test, or AI proof draft becomes `measured`, `independently proved`, or `physically validated` by proximity of numerical values. For any proposed bridge, require a **typed source/target object, map, assumptions, proof or counterexample, regulator/limit, and independent verification**. Admit changes first into a research branch, with no silent upgrade of the production atlas.

**Verdict (2026-10-08):** One confirmed and repairable **internal selector-verification contradiction**; four relevant external research candidates, **zero externally confirmed closures of CEF P0 bridges**.
