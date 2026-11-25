# Publication readiness — HCC Scale Nexus, Frontier II (v4.442, branch `feature/scale-nexus`)

**Verdict**
- **Ready for independent review. Not ready for publication claims, and not to be merged into production before G7.**
- The Quest 3 hardware test is a separate open condition.
- Nothing in this branch claims a discovery.

## The 30 items

| # | Item | Status | Where |
|---|---|---|---|
| 1 | Preregistration vs `BASES` (φ, 2, e exact); ranking; multiple comparisons | **DONE** — v2 released beside v1 (kept) | `golden-lattice-result-v2.json`, `STATISTICAL_REPLICATION.md` §1 |
| 2 | Float32 vs the NASA originals, uncertainties, asymmetric intervals | **DONE** | `statistical-audit.json` |
| 3 | Calibration on independent synthetic populations | **DONE** — the scan is miscalibrated; its p withdrawn | same |
| 4 | System means vs multiplicity, observation, selection | **DONE** | same |
| 5 | Power of the full registered criterion | **DONE** — 0.03–0.45 | same |
| 6 | Precision update vs contradiction; the "4.4σ" electron | **DONE** — an edition update driven by α; wording withdrawn | `SCIENTIFIC_AUDIT.md` II |
| 7 | One versioned constants registry | **DONE** — three modules adopted it; the rest is a capped debt | `docs/verify-the-constants-registry.mjs` |
| 8 | The Lineweaver–Patel 2024 erratum | **BLOCKED** — metadata verified; full text not accessible | `REPORT.md` §3 |
| 9 | Strict C ≤ 1 ∧ Q ≤ 1 compatibility | **DONE** + Lean | `SCIENTIFIC_AUDIT.md` III |
| 10 | Ω_K < −1; Hubble, areal, curvature, apparent and geodesic lengths | **DONE** + Lean (R_A < A) | same |
| 11 | Both branches χ and π − χ | **DONE** + Lean | same |
| 12 | Physical compactness vs formal ratio, per entry | **DONE** — 98/98 | same |
| 13–18 | Lean: allowed masses, unique crossing, dilation group and invariant, S³ branches and monotone volume, R_A/A < 1, covariance | **DONE** — 13 new theorems | `FORMAL_VERIFICATION.md` |
| 19 | Clean rebuild, pinned versions, axiom audit, hashes | **DONE** by this agent; a rebuild on other hardware is **OPEN** (part of G7) | `lean/scale-nexus/REBUILD.md` |
| 20 | √5 kept exploratory | **DONE** | `STATISTICAL_REPLICATION.md` |
| 21 | New independent preregistration for φ and √5 | **DONE** — committed before the data | `PREREGISTRATION_II.md` |
| 22 | The holdout not reused | **DONE** — new population, hosts excluded | same |
| 23 | Smooth, mixture, log-periodic and selection models compared | **DONE** | `replication-II-result.json` |
| 24 | Independent data; uncertainties, system correlations, instrumental limits, multiple testing | **DONE** — with stated limits (candidate list; window normalisation; correlated stellar radii) | `STATISTICAL_REPLICATION.md` §4 |
| 25 | No discovery claim without independent replication | **DONE** — none made; preregistration III outlined | `STATISTICAL_REPLICATION.md` §5 |
| 26 | Scale Dynamics Observatory: M(R), local p_eff, invariants, family transitions | **DONE** | laboratory `scaledyn` |
| 27 | Independent homogeneous populations | **DONE**, with one limit (below) | `data/scale-nexus/scale-dynamics.json` |
| 28 | Measured, model, identity and hypothetical kept apart | **DONE** — tagged everywhere | `docs/verify-the-scale-dynamics.mjs` check 8 |
| 29 | Integration with Invariant Nexus, FBS3R, Scale Nexus, Multiview and the typed bus | **DONE** | check 9 |
| 30 | Machine-readable export: data, uncertainties, sources, covariances, certificates | **DONE** | `HCC_SCALE_DYNAMICS.exportJSON()`, the JSON |

### Items 26–27 in numbers

**Planets.** NASA Exoplanet Archive, true masses only (no M sin i, no masses from an M–R relation): 1578 planets around 1286 stars.
- Broken power law, 0–3 breaks compared by BIC: −882.2, −1750.3, **−1803.9**, −1801.1, so **two breaks**.
- The breaks lie at ≈ 17 M⊕ (95 % block bootstrap 8.6–35.5) and ≈ 150 M⊕ (112–154).
- The slopes are S = d log R / d log M = 0.447, 0.619 and −0.005. Where p_eff = 1/S is defined, it is 2.24 and 1.62; the giants have no finite p_eff, because R barely changes with M.
- **Against Chen & Kipping (2017):**
  - the upper break agrees with their 131.6 M⊕;
  - the lower one does **not** reproduce their 2.04 M⊕. This sample, with these selections, puts it higher.

**Main-sequence hosts.** 3940 stars, S = 1.071. Their masses and radii are mostly model-derived, and the page says so.

**White dwarfs and neutron stars.** Three white dwarfs with dynamical masses lie on the Nauenberg curve (slope → −1/3 at low mass). NICER provides five analyses of three pulsars. Both groups are shown, not fitted.

**The invariant.** I_S = (1+S) log C + (1−S) log Q is a Lean theorem along each family. Its scatter, 0.21–0.45 dex, measures goodness of fit; it is not a finding.

**A method defect, found and fixed in this release.**
- The first version of the slope fit re-weighted at a fixed slope.
- Its synthetic check showed it as attenuated as ordinary least squares: mean error −0.079 at S = 0.5, coverage 0 %.
- The fit now minimises χ² with the slope in the denominator: mean error 0.0002, coverage 91 %.
- The planet slopes moved from 0.415 / 0.616 to 0.447 / 0.619.

**Limit of item 27.** The detached-eclipsing-binary catalogues (DEBCat; VizieR J/A+ARv/18/67) were not reachable from the build environment (the connections were refused). Dynamical stellar masses and radii should replace the host-star parameters when they can be fetched.

## Acceptance (VI)

| Check | Result |
|---|---|
| Full release chain (pipeline → invariants → uniqueness → reach → extract → bindu → api → metalaws → extract --check → demo agent → pipeline --if-needed → api) | see `RELEASE_NOTES.md` (Frontier II) |
| `npm run test:source` (every verifier) | see `RELEASE_NOTES.md` |
| `node scripts/selftest.mjs --list` | see `RELEASE_NOTES.md` |
| Registry audit | `verify-the-constants-registry.mjs` 8/8 |
| Lean–kernel parity | 60 exact fixtures, worst 3.8·10⁻¹⁵; the Frontier II identities numerically in the page kernel |
| Regression | No existing verifier's assertions were weakened. Two that cut code from the page now also cut the registry it reads. The Scale Nexus Lean check was raised from 29 to 42. |
| Browser | Desktop Chromium, iPhone 13 emulation, EN/RU/DE/JA: no page or console errors, no horizontal overflow, the slider moves by keyboard on desktop |

## What still blocks publication

1. **G7** — independent scientific review, including a Lean rebuild on other hardware.
2. **Quest 3 / XR hardware test** — not run.
3. **Item 8** — the erratum's full text.
4. **Golden lattice** — any claim needs preregistration III on new, independent data (`STATISTICAL_REPLICATION.md` §5). The present statement is **no evidence** for φ or √5.
5. **Stellar population** — dynamical masses (eclipsing binaries) to replace the model-derived host parameters.
6. **Constants debt** — 244 duplicated literals and 26 copies of a 1986-G solar mass are to be retired module by module, each re-verified.
