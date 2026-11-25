# A typed scale atlas with reproducible mathematics: the HCC Scale Nexus

*Draft for independent review. Hypotheses, results and limitations are kept in separate sections. No novelty is claimed
beyond what is stated in §6.*

## Abstract
We describe how a single typed scale layer was integrated into an interactive atlas of physical scales (HCC). It has five parts:
- every catalogue entry carries the kind of its mass and of its radius, its source, epoch, frame, uncertainty and status;
- one kernel maps mass–radius coordinates exactly onto compactness–quantum coordinates;
- a round three-sphere and an FLRW apparent horizon are carried as explicitly conditional models;
- the algebra is checked by the Lean 4 kernel, with an axiom audit;
- a frequently asked empirical question — whether measured sizes favour powers of the golden ratio — is answered by a preregistered test on an independent population.

The test finds no evidence for a golden lattice in exoplanet transit radii. The φ statistic gives p = 0.25, and φ ranks 168th of 241 bases. The strongest log-periodic component of that population, at a period of 0.35 dex, comes from its known multimodal radius distribution.

## 1. Hypotheses (stated before results)
- **H1.** Measured radii of a physical population concentrate in phase on rungs φⁿ ℓ_P.
- **H0.** The phases follow the population's smooth size distribution, its within-system correlations and its catalogue rounding.

The protocol fixes:
- the population and the radius definition;
- the holdout split;
- the statistic;
- the null generator;
- α;
- the decision rule;
- the prerequisite calibration and power checks.

It was committed before the data were analysed (`PREREGISTRATION.md`).

## 2. Methods
**Coordinates.** Let m = M/m_P, r = R/ℓ_P, C = 2m/r and Q = 1/(mr). The logarithms (a, b) = (log₁₀C, log₁₀Q) are an exact linear image of (log₁₀m, log₁₀r), with Jacobian −2. The rung N_b = log_b(r) is a relabelling between bases. Dilation laws: C → s^{p−1}C and Q → s^{−p−1}Q.

**Uncertainty.** Per-entry errors in ln M and ln R propagate with their correlation:
- for a horizon, R = 2GM/c², so the correlation is +1;
- for a Compton point, R = ħ/Mc, so it is −1.

G is common to all entries. It shifts every a rigidly and leaves b unchanged.

**Geometry.** A round S³ of curvature radius A distinguishes three lengths:
- the geodesic distance Aχ;
- the areal radius A sin χ;
- the volume-equivalent radius.

Each areal radius has a near and a far branch. With the Friedmann equation taken as a hypothesis, the apparent horizon R_A = R_H/√(1 − Ω_K) satisfies 2GM_MS/(c²R_A) = 1.

**Formal checks.** 29 theorems were proved in Lean 4.19.0 with Mathlib v4.19.0. Every one depends only on the three standard axioms.

**Cross-language checks.** Exact rational fixtures computed in Lean were compared with the JavaScript kernel, which ran 26 915 deterministic cases.

**Statistics.** The primary statistic is Z = n·R̄², where R̄ = |mean e^{2πiN}| with N the rung (a Rayleigh statistic), evaluated on a holdout. A scan over 241 bases is corrected with the max statistic. The null keeps the within-system correlations: it draws a kernel density of system means and permutes within-system deviations. Effect intervals come from a host-block bootstrap.

## 3. Results

| Result | Value |
|---|---|
| Catalogue entries typed | 98/98 |
| Entries for which a density may be formed | 39 |
| Values revised to their cited sources | 2 edition updates, neither a statistical contradiction: the Sun's mass (GM☉ over the 2022 G instead of the 2014 G, 3.3·10⁻⁵); the electron (CODATA 2018 → 2022, Δm/m = 1.36·10⁻⁹, driven by the revised α) |
| Lean theorems | 29/29, standard axioms only |
| Kernel vs. Lean fixtures, worst relative difference | 3.8·10⁻¹⁵ |
| Golden lattice, holdout (n = 2384, 1812 systems), R̄_φ | 0.025 (95 % CI 0.007–0.056) |
| Golden lattice, p | 0.25 |
| Golden lattice, rank of φ | 168/241 |
| Power at a 10 % injected lattice | 1.0 |
| Null calibration, KS | 0.056 |
| Scan maximum (b ≈ 2.24, corrected p = 0.0005) | Attributed post hoc to the multimodal radius distribution |

## 4. Interpretation
- The coordinates organise data; they explain nothing.
- No physical preference for φ is found in this population. That says nothing about other populations, but the protocol is reusable.
- The S³ and FLRW parts are conditional geometry. They are not evidence for an S³ topology.

## 5. Limitations
- The catalogue is curated, so no p-value is computed for it.
- Uncertainties are missing for 69 of the 98 entries, and are stated as missing.
- The Lineweaver–Patel erratum was not obtained.
- The scan's maximum is explained post hoc, not by a preregistered test.
- Typed quantity-bus links to other laboratories are open work.
- XR was not tested on a device.
- No independent review has taken place yet.

## 6. Prior art and what is new
**Prior art:**
- Carr & Rees (1979), the first map of physical scales;
- Lineweaver & Patel (2023), a mass–radius map with the Compton and Schwarzschild lines, and its 2024 erratum;
- interactive universe maps;
- Sornette (1998) on discrete scale invariance.

**What is new here,** and only this:
- a typed audit of an existing atlas's catalogue;
- a single kernel verified against Lean fixtures;
- Lean proofs of the geometric identities, including a two-sided flat-limit bound for the S³ cap volume;
- a preregistered, negative test of a golden lattice on an independent population.
