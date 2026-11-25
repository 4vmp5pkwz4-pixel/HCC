# Statistical replication — the golden lattice and √5 (Scale Nexus Frontier II, items 1–5 and 20–25)

**Bottom line**
- **φ:** no evidence, in the first test or in the independent replication.
- **√5:** it was an exploratory peak in the first test. In the replication it gave p = 0.005 by one preregistered criterion and failed two of the other three, so the preregistered verdict is **not replicated**.
- **Post hoc** (declared deviations, run afterwards): the √5 term is not the detection edge. It is one point on a broad band of periods, peaking near base 3.3, that tracks known features of the planet population (the radius valley and the sub-Saturn deficit). It is not a lattice line.
- **No discovery is claimed.** No result here confirms FBS3R.

Every file named below is in `docs/scale-nexus/` unless a path is given. All the code is in `scripts/`.

## 1. The first test, corrected (items 1–5)

**What was wrong**

The preregistration (`PREREGISTRATION.md`) ranks φ among a scan of bases. The implementation's `BASES` grid (241 points) did not contain φ, 2 or e exactly, so "φ's rank" was not computed as registered.

**What was done**
- `golden-lattice-result.json`, the first release, is **kept unchanged**.
- The corrected analysis is a separate version, `golden-lattice-result-v2.json` (script `golden-lattice-audit.mjs --v2`): the grid ∪ {φ, 2, e} = 244 bases. Data, seed (4410) and 2000 replicates are unchanged.

| | v1 (kept) | v2 (corrected) |
|---|---|---|
| holdout | 2384 planets, 1812 systems | same |
| Z_φ, p (primary) | 1.48, 0.25 | 1.48, **0.249** |
| rank of φ | 168 / 241 | **170 / 244** (2: 66, e: 127) |
| scan maximum | b ≈ 2.236 | b = 2.2359, Z = 50.0, p_scan = 0.0005 |
| verdict | no evidence | **no evidence** |

**Audit of the inputs and of the null** (`statistical-audit.json`)

- **Float32 reconstruction (item 2).**
  - All 4710 embedded transit radii were matched to the NASA archive by name; 4691 are identical to Float32 of the archive values.
  - 19 have changed since the snapshot.
  - The printed decimals were reconstructed correctly for 4685 radii.
  - 4331 radii have both uncertainties: the median relative error is 7.9 % and the 90th percentile 25 %. Asymmetry err1/err2 has median 1 and 90th percentile 2.
- **Measurement noise (item 2).**
  - Z_φ with the original decimals is 1.62.
  - Redrawing every radius within its own errors gives Z_φ from 0.10 to 3.49 (5th–95th percentile). The statistic moves more under measurement noise than the difference between "no evidence" and a weak hint.
- **Calibration on independent synthetic populations (item 3)**, not on draws from the null generator itself:

  | Population | Primary false-positive rate (60 data sets) | Scan false-positive rate (12 data sets) |
  |---|---|---|
  | log-normal, 0.30 dex | 0.067 | 0 |
  | uniform in log R | 0.083 | **0.92** |
  | two narrow peaks | 0.083 | **1.00** |
  | three populations, planet-like | 0 | **1.00** |
  | power law with cut-off | 0.05 | **1.00** |

  The primary test is roughly calibrated. **The scan is not.** On any population that is not log-normal it "finds" a base almost every time. So the first test's p_scan = 0.0005 at b ≈ 2.236 is **not evidence of anything**. This is the main finding of the audit.
- **System means (item 4).**
  - The null resamples system means as if they were exchangeable. They are not: Spearman ρ with host radius is **+0.41**, with multiplicity −0.15, and with log period −0.03.
  - By discovery facility the mean log₁₀R is 0.34 (Kepler), 0.39 (K2), 0.68 (TESS) and 1.10–1.16 (ground surveys).
  - Within-system scatter is 0.13–0.16 dex.
- **Power of the full registered criterion (item 5)**, not only of the primary test. 60 simulations per row:

  | Injected lattice fraction | Primary test | Full criterion |
  |---|---|---|
  | 0.05 | 0.82 | **0.03** |
  | 0.10 | 1.00 | **0.22** |
  | 0.20 | 1.00 | **0.27** |
  | 0.30 | 1.00 | **0.45** |

  The full criterion is weak. "No evidence" from it is weak evidence of absence.

## 2. Preregistration II and its result (items 21–24)

**The preregistration**

`PREREGISTRATION_II.md` was committed (2f514d4) **before** any statistic was computed on the new data:
- **Data:** the NASA TOI table.
- **Sample:** unconfirmed candidates (PC/APC); every star that hosted a planet in the first test is excluded; 0.5–25 R⊕; finite errors.
- **Models:** smooth mixtures, a selection model, and a log-periodic modulation for φ and for √5, each convolved with every object's own error.
- **Tests:** a parametric-bootstrap LR, Bonferroni over the two bases, TIC-block intervals for ε, and a four-part replication rule.

The holdout of the first test is not reused (item 22).

**Results** (`replication-II-result.json`, seed 4411, 200 replicates)

The sample has n = 3768 candidates on 3665 stars. Excluded: 2853 by disposition, 249 by shared host, 414 by radius and 891 by missing errors.

| Model | BIC |
|---|---|
| mixture K = 1 | 1908.9 |
| **mixture K = 2 (K\*)** | **560.8** |
| mixture K = 3 / 4 / 5 | 561.9 / 585.6 / 608.6 |
| **selection** (mixture × logistic edge at x₀ = −0.063, i.e. 0.86 R⊕, width 0.068 dex) | **398.7** |
| φ-modulated | 574.7 |
| √5-modulated | 564.1 |

| Criterion (all must hold) | φ | √5 |
|---|---|---|
| p < 0.025 (LR bootstrap) | 0.328 ✗ | **0.005 ✓** |
| CI_low(ε) > ε_null95 | 0.016 < 0.106 ✗ | 0.074 < 0.084 ✗ |
| BIC(M_b) < BIC(M_mix) − 10 | 574.7 vs 550.8 ✗ | 564.1 vs 550.8 ✗ |
| **Verdict** | **not replicated** | **not replicated** |

The selection model beats every other model by ΔBIC ≈ −162. Its edge is the detection limit, which the preregistered null did not contain.

## 3. Post-hoc diagnostics — declared deviations, exploration only

None of these was preregistered. Each was run **after** the replication result was known, on the same data. None can confirm anything.

1. **A null that contains the selection** (`exploration-selection-null.json`, `golden-lattice-exploration-sel.mjs`, seed 4415, 200 replicates).
   - Against M_sel, LR(√5) = 11.0, p = 0.005 (the floor of 200 replicates; LR_null95 = 5.2), with ΔBIC = +5.5 against M_sel.
   - LR(φ) = 2.4, p = 0.28.
   - **The detection edge does not explain the √5 term.**
2. **Where the √5 term puts its extrema, and richer smooth models** (`exploration-valley.json`, `golden-lattice-exploration-valley.mjs`).
   - Its minima fall at 1.84 R⊕ and 4.1 R⊕: the radius valley (Fulton et al. 2017) and the sub-Saturn deficit.
   - Against mixtures with K = 2, 3, 4, 5, LR(√5) = 13.1, 12.3, 16.7, 19.3, and the minima stay at 1.6–1.8 R⊕.
   - LR(φ) also grows, to 9.8 at K = 4: the modulation absorbs structure that ≤ 5 Gaussians do not draw, whatever the base.
3. **The LR profile over the period** (K = 2, λ from 0.15 to 0.60 dex).
   - It peaks at λ = 0.52 dex, base **3.31**, with LR = 34.
   - At half maximum it spans bases **2.34 to ≥ 3.98** (the upper edge is the scan limit).
   - **√5 (λ = 0.349, LR = 13) lies outside that band.** "√5" is the shoulder of a broad feature of the population, not a line.

**Reading.**
- The TOI radius distribution has structure beyond a two-component mixture: the radius valley, the sub-Neptune peak and the sub-Saturn deficit, all known and astrophysical.
- A log-periodic term of any period between about 0.37 and 0.6 dex fits part of it. Neither φ nor √5 is singled out.

## 4. Limitations stated, not hidden

- **The sample.** TOI candidates include false positives, and their selection is not that of confirmed planets.
- **Normalisation window.** No model is normalised to the 0.5–25 R⊕ window. M_mix is normalised on the whole line, and M_sel's numerical normalisation stops at log R = 2. One grid point there changes its logL by 0.93 (found in this audit). That is immaterial for ΔBIC ≈ −162, but a future protocol should normalise every model on the observed window.
- **The calibration rows** used 12–60 data sets. They identify gross miscalibration, not fine rates.
- **Correlated errors.** Radius errors are treated as independent within a star; candidates of one star share the stellar radius.

## 5. What would be needed before any claim (item 25)

A **third preregistration**, written before seeing new data, with:
- a smooth null rich enough for the known features, for example a selection-aware spline or KDE;
- a scan over periods with its look-elsewhere correction **calibrated on realistic, structured populations** (§1 shows the old one was not);
- normalisation on the observed window;
- errors correlated through the stellar radius;
- an **independent** population. Candidates:
  - Kepler DR25 with Gaia-revised stellar radii (Berger et al. 2020), excluding the systems already used;
  - the PLATO or Roman samples when released.

Until a protocol like that replicates on new data, the statement is: **no evidence for a golden (φ) lattice; no evidence for a √5 lattice; a broad, known, non-periodic structure in planet radii.**
