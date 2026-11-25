# Scientific audit — HCC Scale Nexus, Frontier II (items 1–12)

**Rules of this audit**
- Each item has a status: **DONE**, **BLOCKED** (with what would unblock it) or **OPEN**.
- First-release results are kept unchanged. A correction is a new version beside the original, and git history keeps the original wording.
- Negative results are reported as results.

## I. The statistics (items 1–5) — DONE

Details are in `STATISTICAL_REPLICATION.md` §1.

| # | Finding | What changed |
|---|---|---|
| 1 | The `BASES` grid did not contain φ, 2 or e exactly, so φ's preregistered rank was not computed as registered. | Corrected analysis released separately as `golden-lattice-result-v2.json` (244 bases): φ rank 170, p = 0.249 — **no evidence**, as before. v1 kept. |
| 2 | The Float32 reconstruction is faithful: 4691/4710 identical to the archive's current values and 19 changed since the snapshot; decimals reconstructed for 4685. Asymmetric errors (median relative 7.9 %) move Z_φ between 0.10 and 3.49. | Measurement noise is now part of the reported uncertainty of the statistic. |
| 3 | On independent synthetic populations the primary test is roughly calibrated (false-positive rate 0–8 %). **The scan is not** (92–100 % on any non-log-normal population). | The first test's scan "significance" at b ≈ 2.236 (p = 0.0005) is **withdrawn as evidence**. |
| 4 | System means are not exchangeable: ρ = +0.41 with host radius, and they differ by discovery facility (0.34–1.16 dex). | Recorded as a defect of the first null. |
| 5 | The full registered criterion has power 0.03–0.45 for lattice fractions 0.05–0.3. | "No evidence" is weak evidence of absence, and is now said so. |

## II. Constants and values (items 6–8)

**Item 6 — DONE: an edition update is not a contradiction.**
- **Electron.** The atlas carried 0.51099895 MeV, the CODATA 2018 value itself. CODATA 2022 gives 0.51099895069 MeV.
  - The shift, Δm/m = 1.36·10⁻⁹, follows from the revised fine-structure constant: m_e = 2hR∞/(cα²) reproduces it from the two editions' α and R∞ (`docs/verify-the-constants-registry.mjs`, check 8).
  - Two adjustments of largely shared data are not independent measurements. The ratio of the shift to one edition's σ (4.4) is **not a significance**, and the first-release wording "4.4σ" is withdrawn in `REPORT.md` and `MANUSCRIPT.md`.
- **Sun.** 1.98847·10³⁰ kg was GM☉ over the 2014 G. Recomputing with the 2022 G is an internal-consistency fix: the shift is 3.3·10⁻⁵, or 1.5 u(G).

**Item 7 — DONE: one versioned registry, `HCC_CONSTANTS`.**
- **What it holds:** each value with its standard uncertainty (0 = exact), its source and edition — SI 2019, CODATA 2022, IAU 2012 B2 and 2015 B2–B3.
- **Who reads it:** the mass–radius catalogue (UC_K), the S³ reconstruction (HCC_S3C) and the white-dwarf laboratory. The verifier checks they agree with it bit for bit.
- **What it is checked against:** an independent table typed in the verifier.
- **Remaining copies:** 244 literals still duplicate the registry in other modules. They are a capped debt that may only fall.
- **Disagreeing literals are listed by name.** The commonest, M☉ = 1.98892·10³⁰ kg in 26 places, is GM☉ over the **1986** G — 11 CODATA-2022 σ from today's G. It is a stale edition, not a different Sun, and is scheduled for retirement module by module, with each module re-verified.

**Item 8 — BLOCKED: the Lineweaver & Patel erratum.**
- Its metadata was verified with Crossref: Am. J. Phys. 92, 240 (2024), doi:10.1119/5.0198864, correcting doi:10.1119/5.0150209.
- The full text is behind the publisher's access control (HTTP 403 to automated requests; no open copy) and was not bypassed.
- **To unblock:** a copy supplied by someone with access. No statement of the atlas depends on it.

## III. Physical rigour (items 9–12) — DONE

These are in the kernel (`index.html`, SNX-MATH, SNX-AUDIT), the FBS3R panel and the laboratory. They are checked by `docs/verify-the-scale-nexus.mjs` check 13 and proved where marked.

**Item 9 — the strict condition replaces "no mass can be held".**
- At radius R the masses with C ≤ 1 and Q ≤ 1 are exactly [ħ/(Rc), Rc²/(2G)].
- The interval is nonempty iff R ≥ √2 ℓ_P (Lean: `allowed_masses`, `allowed_nonempty`).
- FBS3R now states this: a statement about two coordinate ratios, not a law about what can exist.

**Item 10 — the lengths kept apart.**
- **Hubble length** c/H: a length scale. It is an areal radius of the S³ only if Ω_K ≥ −1. For Ω_K < −1 it exceeds A and is no areal radius, and the panel says so.
- **Areal radius** R = A sin χ.
- **Curvature radius** A = R_H/√(−Ω_K).
- **Apparent horizon** R_A = R_H/√(1 − Ω_K). R_A < A for every Ω_K < 0 (Lean: `apparent_lt_curvature`).
- **Geodesic distance** D = Aχ.

**Item 11 — both branches.**
- Every areal radius below A is met at χ and at π − χ: the same area and Misner–Sharp mass, different D and proper volume (Lean: `branches_geodesic`, `near_lt_far`, `capVolume_strictMono`).
- `snxFLRW` returns both branches for R_A and R_H, and the laboratory shows both.

**Item 12 — what C means, entry by entry.** Each of the 98 catalogue entries now carries `cMeaning`:

| Meaning | Entries |
|---|---|
| physical compactness of a self-gravitating body | 8 |
| physical but definition-dependent (radius a chosen extent: tidal, disc, R200, virial, basin) | 5 |
| definitional, C = 1 (horizons) | 3 |
| conditional (FRW spheres; the particle horizon is a proper-volume mass, explicitly not Misner–Sharp) | 3 |
| formal coordinate ratio (particles at their Compton length, energy scales, photons, bits) | 34 |
| formal ratio (bodies not held by gravity) | 28 |
| reference (Planck units, C = 2) | 1 |
| not formed (no mass) | 16 |

## IV. Open conditions

- **G7.** An independent scientific review has not been done.
- **Quest 3.** The hardware XR test is open until a real device is used.
- **Item 8.** Blocked, as above.
- **Stellar population.** The catalogues of detached eclipsing binaries (DEBCat, VizieR) could not be reached from the build environment. The observatory's stellar relation therefore uses host-star parameters, which are mostly model-derived; it says so wherever it is shown.
