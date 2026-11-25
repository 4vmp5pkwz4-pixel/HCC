# HCC Scale Nexus — scientific and engineering report (v4.441, branch `feature/scale-nexus`)

**Baseline:** `0bf9765` (v4.440 on `main`).
**Handoff:** `HCC_SCALE_NEXUS_20261125.zip`. It is kept byte for byte in `docs/scale-nexus/handoff/`, and its own SHA256SUMS verify it.

This report keeps four levels apart and labels each statement with its level:
- **A** — a mathematical derivation, checked by the Lean kernel;
- **B** — a numerical implementation test;
- **C** — a formal certificate (Lean build and axiom audit);
- **D** — empirical evidence.

## 1. What was handed over, and what was found in it

| Handoff item | State on arrival | What was done |
|---|---|---|
| `kernel.js` | 11 functions; its test passes 15 079 assertions | Ported natively: SNX-MATH block in `index.html`, constants passed in, logarithms throughout. Parity with the handoff kernel: worst difference 2.7·10⁻¹⁰, which comes only from ħ rounded to ten digits. |
| `catalog.js` | 11 seed entries, all with `uncertainty: null` | Not imported. The atlas's own 98-entry matter catalogue (UCAT) is audited instead (§3). |
| `lean/ScaleNexus.lean` | 12 theorems. **Did not compile:** four definitions needed `noncomputable`. | Fixed and extended to 29 theorems (§4). |
| `RESEARCH_RU.md` | Equations and their limits | Reviewed independently. Every equation used is recomputed or proved (§2, §4, §5). |
| Prototype page | Standalone | Superseded by the in-atlas lab `scalenexus`. |

## 2. The kernel (B, with A where noted)

**Coordinates.** Let m = M/m_P, r = R/ℓ_P, u = log₁₀m, v = log₁₀r and k = log₁₀2. Then:
- a = log₁₀C = k + u − v;
- b = log₁₀Q = −u − v;
- the inverse is u = (a − b − k)/2, v = (k − a − b)/2, with Jacobian −2.

This is a representation, not a law.
- A: `left_u … right_b`, `log_coordinates`.
- B: 24 000 identity evaluations, worst error 2.8·10⁻¹⁴.

**Rungs.** N_b = log_b(R/ℓ_P). Since N_φ·ln φ = N_b·ln b, changing the base only relabels the rung.
- A: `relabel`, `radius_level`, `level_radius`.
- B: the kernel's rung equals the page's FBS3R rung to 5.7·10⁻¹⁴, and N_C + N_S = log_φ 2 for every mass to 6.9·10⁻¹⁴.

**Dilation.** R → sR, M → s^pM gives C → s^{p−1}C, Q → s^{−p−1}Q and ρ → s^{p−3}ρ.
- A: `dilation`.
- C: 60 exact rational fixtures evaluated in Lean, compared with the JavaScript kernel; worst 3.8·10⁻¹⁵.
- These tracks are covariance laws, not evolution.

**Uncertainty.**
- G (CODATA 2022, 2.2·10⁻⁵) moves every a by 9.55·10⁻⁶ and every φ-rung by −2.29·10⁻⁵ together. It does not move b, because Q contains no G.
- Per-entry errors in ln M and ln R propagate with their correlation:
  - for a horizon, R = 2GM/c², so ρ = +1;
  - for a Compton point, R = ħ/Mc, so ρ = −1.
- A missing radius error leaves the whole uncertainty missing; it is never set to zero.
- B: checked by finite differences and by a 20 000-draw Monte Carlo (agreement within 0.6 %).

**Boundaries.**
- 10⁵⁰⁰ kg at 10⁻²⁰ m is handled in logarithms, and the inverse returns it exactly.
- 20 classes of invalid input are each refused with a `RangeError`.

## 3. The catalogue audit (G1)

**Scope.** UCAT holds 98 entries: all of the atlas's mass–radius map.
- 82 lie on the plane:

  | Layer | Entries |
  |---|---|
  | bodies | 45 |
  | point masses | 16 |
  | energy scales | 5 |
  | photons | 8 |
  | information equivalents | 5 |
  | horizons | 3 |

- 16 are lengths, times or frequencies only. They are kept in their own layer, with that reason.

**Fields audited for every entry:** mass kind, radius kind, source and edition, epoch, frame, uncertainty (or the reason it is missing), status, placing formula, and whether a density may be formed.

**Densities.** 39 entries may carry a density. Densities are refused for:
- photons (energy equivalents, frame-dependent);
- energy scales;
- bits (information equivalents; *bits are annotations, not objects*);
- horizons;
- bounds;
- entries whose mass and radius belong to different regions: the Milky Way's stellar mass against its disc, Laniakea, the Hubble, de Sitter and observable spheres, and the Planck units.

**Typed exceptions:**
- Neutrinos are bounds or derived lower values: KATRIN gives an *effective* electron-antineutrino mass limit, and Σm_ν is a cosmological sum bound.
- Light quarks have running MS-bar masses, not rest masses.

**Uncertainties.**
- 29 entries state an uncertainty, a bound or an order of magnitude, using the CODATA 2022, PDG 2024 and IAU values already cited.
- The rest state why none is recorded.

**Revisions** to values the catalogue cites:

| Value | Was | Now | Reason |
|---|---|---|---|
| M☉ | 1.98847·10³⁰ kg | GM☉(IAU 2015)/G(CODATA 2022) = 1.988410·10³⁰ kg | An internal-consistency fix: the old value is GM☉ over the 2014 G, while the atlas uses the 2022 G. The shift, 3.3·10⁻⁵ (1.5 u(G)), is an edition difference, not a measurement in tension. *(First wording, withdrawn in Frontier II: "exceeds G's 2.2·10⁻⁵".)* |
| Electron | 0.51099895 MeV | 0.51099895069 MeV (CODATA 2022) | A precision update between editions. The old value is the CODATA 2018 value itself, correct for its edition. It moved because α moved: m_e = 2hR∞/(cα²) reproduces Δm/m = 1.36·10⁻⁹ from the two editions' α and R∞. Two adjustments of largely shared data are not independent measurements, so the shift divided by one edition's σ (4.4) is **not** a significance. *(First wording, withdrawn in Frontier II: "Δ = 1.35·10⁻⁹, i.e. 4.4σ".)* |

**Not changed, and recorded here:**
- A second solar mass constant, 1.98847·10³⁰ at `index.html` line 4355, belongs to another module that other labs depend on. It should be revised in a separate release, with those labs re-verified. **Frontier II:** done — that module (`HCC_S3C`) now reads the registry `HCC_CONSTANTS`, and its verifiers pass. Another 26 copies of 1.98892·10³⁰ kg (GM☉ over the 1986 G) remain in other modules. They are listed by name and capped in `docs/verify-the-constants-registry.mjs`.
- The `PHI_ATLAS` length table has no masses. It is placed by length only and covered by the ladder's own tests; it was not given the typed mass–radius fields.
- **Lineweaver & Patel (2023) and its 2024 erratum: NOT RUN.** The erratum's full text was not obtained. No statement here depends on it.
  - **Frontier II, item 8: BLOCKED.** The erratum's metadata was verified with Crossref: "Erratum: 'All objects and some questions' [Am. J. Phys. 91, 819–825 (2023)]", Am. J. Phys. 92, 240 (2024), doi:10.1119/5.0198864, issued 2024-03-01. It corrects doi:10.1119/5.0150209.
  - The full text is behind the publisher's access control: automated requests get HTTP 403, and no open copy is listed by Unpaywall. It was not bypassed.
  - **What would unblock it:** a copy supplied by someone with access. Until then, no line of the atlas is compared with the erratum, and none depends on it.

## 4. Lean (G3)

**Build.** `lean/scale-nexus/ScaleNexus.lean` builds with exit 0 and no errors on:
- Lean 4.19.0, commit 6caaee842e94;
- Mathlib v4.19.0, rev c44e0c8ee63c (pinned in `lake-manifest.json`).

**Axiom audit.** All 29 theorems carry `#print axioms`, and all 29 report exactly `[propext, Classical.choice, Quot.sound]`. There is no `sorry`, `admit` or custom axiom. While the proofs were developed, the audit visibly caught a `sorryAx` from an unfinished proof before it was fixed.

**The 29 theorems:**

| Group | Theorems |
|---|---|
| Compactness and quantum coordinate | `product`, `ratio` |
| SI bridge | `si_bridge`: 2GM/(Rc²) and ħ/(MRc) are exactly the normalised C and Q, with ℓ_P = √(ħG/c³), m_P = √(ħc/G) |
| Log coordinates and inverse | `left_u`, `left_v`, `right_a`, `right_b`, `product_log`, `ratio_log`, `log_coordinates` |
| Density | `density_line` |
| Rungs | `radius_level`, `level_radius` (the rpow inverse for b > 1), `relabel`, `golden_log_bridge` |
| Crossing | `horizon_normalized`, `crossing_squared`, `crossing` (the crossing is (1/√2, √2), not (1, 1)) |
| Dilation | `dilation` (real exponent p, rpow) |
| S³ geometry | `areal_symmetric`, `cap_complement`, `areal_le_geodesic` |
| S³ volume | `capVolume_deriv` (dV/dχ = 4πA³sin²χ), `capVolume_integral` (V as the integral of that rate) |
| Flat limit | `cap_le_ball` and `ball_sub_le_cap`: (4/3)π(Aχ)³ − (2/5)πA³χ⁵ ≤ V ≤ (4/3)π(Aχ)³ on [0, 1] — a quantitative flat limit |
| FLRW | `apparent_horizon` (2GM_MS/(c²R_A) = 1 **given** the Friedmann equation as a hypothesis), `apparent_horizon_omega` (the Ω_K form) |
| Photon | `photon_on_compton_line` |

**What Lean does not prove.** It does not prove that the Friedmann equation, an S³ topology or any physical model is true. General relativity is not formalised here.

**Fixtures.** `Fixtures.lean` evaluates the algebraic maps exactly on 60 rational inputs (`fixtures.json`). The JavaScript kernel matches them (§2).

**Artifacts:** `build.log`, `axioms.txt`, `toolchain.txt`, `SHA256SUMS`, all in `lean/scale-nexus/`.

## 4b. Across the atlas (G4, G5)

**In the FBS3R world (3D).**
- Four shells live off the Scale Nexus state:
  - the FLRW apparent horizon R_A;
  - the curvature radius A = R_H/√(−Ω_K) that Friedmann and Ω_K imply. It is drawn **beside** the published S³ preset, not in place of it.
  - the selected catalogue entry;
  - the end of that entry's dilation track.
- The panel section "HCC Scale Nexus on the shells" shows, for the rung in view:
  - the rung in three bases;
  - the masses that rung's length can hold — one segment of the C–Q plane, or none below the crossing at N = 0.72;
  - the typed catalogue entries within one rung.

**Linking, both ways.**
- Picking an entry in FBS3R selects it in the Scale Nexus.
- The Scale Nexus flies FBS3R to its entry, and selects the entry nearest the FBS3R rung.
- H₀ and Ω_K are the same sliders in both places.

**The typed bus.**
- The distance ladder's CMB-calibrated H₀ drives the Scale Nexus FLRW slice (`rungs.hubble_constant_early → scalenexus.scalenexus_hubble`, `hubble_rate`).
- The Scale Nexus publishes its outputs for anyone to route. The bus refuses the Planck mass (kind unspecified) as an entry's mass.

**Everywhere the catalogue is shown** — the matter map and the FBS3R matter wheel — each card now carries its typed audit row and (log C, log Q).

## 5. S³ and FLRW (A, B)

**S³ lengths.** On a round S³ of curvature radius A, the geodesic D = Aχ, the areal R = A sin χ and the volume-equivalent radius (3V/4π)^{1/3} are three different lengths.

**Branches.**
- χ and π − χ share one areal radius, and their caps are complements.
- The antipode has areal radius 0 and contains the whole volume. It is flagged, never drawn as a point.
- An areal radius larger than A is refused as unrealizable.

**FLRW, given the Friedmann equation.**
- R_A = R_H/√(1 − Ω_K) and 2GM_MS(R_A)/(c²R_A) = 1. Checked for H₀ from 20 to 120 and Ω_K from −0.5 to 0.5, to 8.5·10⁻¹⁶.
- When the model is closed, A = R_H/√(−Ω_K), and the Misner–Sharp mass of the cap of areal radius R_A agrees with M_MS.
- At Ω_K = −1.5, R_H > A, and it is reported as unrealizable.
- The proper mass ρV never falls below the Misner–Sharp mass. At the default cap the ratio is 1.0003.

**Horizons.**
- The apparent horizon is shown apart from the particle and event horizons. Those come from the atlas's flat ΛCDM chain (`hzAtT`) and are labelled as another model.
- No model equivalence is forced, and the published S³ preset is untouched.

## 6. The golden lattice (D) — preregistered

**Protocol and order.** `docs/scale-nexus/PREREGISTRATION.md` and `scripts/golden-lattice-test.mjs` were committed in `5bbf2ca` before any statistic was computed on the holdout. The results were committed afterwards, in `5bef97a`.

**Population.**
- Transit radii from the NASA Exoplanet Archive composite table (sha256 72118bc2…): 4710 planets.
- Split by host-name hash into 2326 exploration and 2384 holdout planets (1812 systems).

**Results:**

| Quantity | Value |
|---|---|
| Primary R̄_φ | 0.0249 (95 % CI from host-block bootstrap: 0.0069–0.0562) |
| Z_φ | 1.48 |
| p | 0.249 |
| φ's rank among 241 bases | 168th |
| Verdict | **no evidence for a golden lattice in this population** |

**Prerequisites, met on the exploration half only:**
- The null is calibrated: Kolmogorov–Smirnov 0.056 at n = 200. *(Frontier II: calibrated against draws from its own generator only. On independent synthetic populations the primary test holds — false-positive rate 0–8 % — but the scan does not; see `STATISTICAL_REPLICATION.md` §1.)*
- Power is 1.0 at a 10 % injected lattice, so the test could have found one. *(Frontier II: that is the primary test. The full registered criterion has power 0.22 at 10 % and 0.03–0.45 over 5–30 %.)*

**The base scan.**
- The scan's maximum is at b = 2.236, with Z = 50 and corrected p = 0.0005, and it recurs in the exploration half at b = 2.26. *(Frontier II: the scan's false-positive rate is 92–100 % on non-log-normal populations, so this p is withdrawn as evidence. The √5 replication on independent TESS candidates was **not replicated** under preregistration II.)*
- A post-hoc sensitivity analysis, **not preregistered**, is in `golden-lattice-sensitivity.json`:
  - the maximum survives a 1 % jitter, so it is not catalogue rounding;
  - it survives a null that keeps structure down to 0.08 dex.
- Super-Earths (~1.3 R⊕), sub-Neptunes (~2.5 R⊕) and giants (~12 R⊕) fall near one phase of a 0.35-dex period. This is the known multimodal radius distribution, not a lattice.
- No claim of a lattice at √5 is made.

**What this does not cover.** The atlas's curated catalogue gets **no p-value**: it is not a sample. Other populations remain untested.

## 7. Prior art and limits

**Prior work.** Carr & Rees (1979) and Lineweaver & Patel (2023) drew this map before. Interactive precedents exist, for example unitconv.org's universe map. **No priority is claimed.**

**What the coordinates are not.** C and Q do not classify physical regimes. Binding, coherence, charge, spin, temperature and interactions are independent of them. A large C is not a black hole, and Q ≥ 1 is not a forbidden zone.

**Cosmology.** Cosmological observations do not establish an S³ topology. The S³ and FLRW parts here are conditional on their models.

## 8. Reproduction

| What | Command |
|---|---|
| Kernel, audit, Lean artifacts, test result, wiring | `node docs/verify-the-scale-nexus.mjs` — 11 checks, 26 915 deterministic cases |
| Lean build | in `lean/scale-nexus`: `lake update && lake exe cache get && lake env lean ScaleNexus.lean` |
| Lean fixtures | in `lean/scale-nexus`: `lake env lean Fixtures.lean` |
| Golden-lattice test | `node scripts/golden-lattice-test.mjs --prereq --holdout` — about 3 minutes; seed 4410 |
| The handoff's own test | in `docs/scale-nexus/handoff`: `node tests/kernel.test.js` — 15 079 assertions |

## Frontier II (v4.442) — the independent audit and research frontier

This report is kept as released, with the corrections marked in place. The Frontier II results are in four reports:

| Report | Covers |
|---|---|
| `SCIENTIFIC_AUDIT.md` | items 1–12: the statistics corrected; the constants registry; edition updates, not contradictions; the erratum BLOCKED; the strict C ≤ 1 ∧ Q ≤ 1 condition; R_H, R_A, A and D apart; both branches; what C means per entry |
| `FORMAL_VERIFICATION.md` | items 13–19: 42 Lean theorems, the clean rebuild, axiom audit and hashes |
| `STATISTICAL_REPLICATION.md` | items 20–25: preregistration II on independent TESS candidates — φ and √5 **not replicated**; post-hoc diagnostics place √5 on a broad, known, non-periodic structure |
| `PUBLICATION_READINESS.md` | items 26–30 and VI: the Scale Dynamics Observatory; acceptance; what still blocks publication |

**How to reproduce the Frontier II results**

| What | Command |
|---|---|
| Frontier II verifiers | `node docs/verify-the-constants-registry.mjs`, `node docs/verify-the-scale-nexus.mjs` (13 checks), `node docs/verify-the-scale-dynamics.mjs` |
| v2 of the first test and the statistical audit | `node scripts/golden-lattice-audit.mjs --v2`, `node scripts/golden-lattice-audit.mjs --audit` |
| Replication II | `node scripts/golden-lattice-replication.mjs` |
| Post-hoc diagnostics | `node scripts/golden-lattice-exploration-sel.mjs --B=200`, `node scripts/golden-lattice-exploration-valley.mjs` |
| The observatory's fits, then their embed in the page | `node scripts/scale-dynamics.mjs`, then `node scripts/scale-dynamics-embed.mjs` |
| The Lean build and audit | in `lean/scale-nexus`: `lake update && lake exe cache get && lake build && lake env lean Audit.lean` |

