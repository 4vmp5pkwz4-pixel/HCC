# Release notes — v4.442 Frontier II (feature/scale-nexus, for review; not to be merged before G7)

## Added
- **Laboratory `scaledyn` — the Scale Dynamics Observatory.**
  - Kernel block `SDO-MATH`, with its data in `SDO-DATA`, generated from `data/scale-nexus/scale-dynamics.json`.
  - Instrument `scaledyn` (2 inputs, 7 outputs), runnable without a browser.
  - Agent handle `HCC_SCALE_DYNAMICS`.
  - Its outputs are read back by FBS3R; one Nexus relation, to the Scale Nexus.
- **`HCC_CONSTANTS`:** one versioned registry, read by the catalogue (UC_K), the S³ reconstruction (HCC_S3C) and the white-dwarf laboratory.
- **Lean:** `Frontier.lean` (13 theorems) and `Audit.lean` (42 `#print axioms`); a clean rebuild recorded in `REBUILD.md`.
- **Statistics:**
  - preregistration II with its data and code, committed before analysis;
  - v2 of the first test;
  - the statistical audit;
  - replication II;
  - two declared post-hoc diagnostics.
- **Verifiers:** `docs/verify-the-constants-registry.mjs` (8 checks) and `docs/verify-the-scale-dynamics.mjs` (9 checks). `docs/verify-the-scale-nexus.mjs` gains check 13, and its Lean check now covers 42 theorems.
- **Reports:** `SCIENTIFIC_AUDIT.md`, `FORMAL_VERIFICATION.md`, `STATISTICAL_REPLICATION.md`, `PUBLICATION_READINESS.md`.

## Changed
- **FBS3R:** "no mass can be held" → the strict C ≤ 1 ∧ Q ≤ 1 condition and its nonemptiness, R ≥ √2 ℓ_P.
- **`snxFLRW`:**
  - returns R_A/A and both χ branches for R_A and R_H;
  - states which length is which;
  - for Ω_K < −1, the Hubble length is no areal radius.
- **Every audit row:** carries `cMeaning`.
- **Reinterpreted, not re-measured:** the electron (an edition update driven by α) and the Sun (consistency with the 2022 G). The first-release wording is marked as withdrawn where it stood.
- **Withdrawn as evidence:** the first test's scan p = 0.0005, because the scan is miscalibrated.
- **Two read-back fixes:** the Scale Nexus and the observatory now refill their readout after the panel is rebuilt.

## Found and fixed during this release
- **The observatory's first slope fit was attenuated.** It re-weighted at a fixed slope. Its own synthetic check caught it: bias −0.079, the same as OLS. The slope now sits in the χ² denominator: bias 0.0002.
- **The constants-registry verifier carried CODATA 2018/2014 literals**, which `verify-codata-2022.mjs` forbids. It now reads them from the NIST listings in `data/codata/`.
- **Two bus links from the observatory into the Scale Nexus's mass and radius broke that verifier's invariant.** A population fit is not a typed body, so the links were removed.
- **Three Nexus relations through the new node moved the atlas's verified spectral seam.** One relation is kept; the other two are left out with the reason.

## Blocked / open
- **Blocked:** the Lineweaver–Patel erratum (full text not accessible).
- **Blocked:** the eclipsing-binary catalogues (not reachable from the build environment).
- **Open:** G7; the Quest 3 hardware test; a Lean rebuild on other hardware.

## Tests (Frontier II)
- **Full release chain:** pipeline → invariants → uniqueness → reach → extract → bindu → api → metalaws → extract --check → demo agent → pipeline --if-needed → api. Every step exits 0. After the last source change, the fast chain was re-run (extract, manifest, api, transfers, sensitivity, reach, metalaws, check, demo, pipeline --if-needed): FAST-DONE.
- **`npm run test:source`:** GREEN — 260 verifiers, 0 failed.
- **`node scripts/selftest.mjs --list`:** 1209/1209, 0 failures.
- **Browser:**
  - desktop Chromium, iPhone 13 emulation, EN/RU/DE/JA;
  - no page or console errors and no horizontal overflow;
  - on desktop, the window slider moves by keyboard.

# Release notes — v4.441 (feature/scale-nexus, for review)

## Added
- **Laboratory `scalenexus`.** One plane holds every entry of the matter catalogue and turns between the mass–radius and compactness–quantum pictures. It also offers:
  - rungs in base φ, 2, e or 10;
  - an exact dilation track;
  - the entry's uncertainty and typed audit row;
  - an S³ cap with near and far branches;
  - the FLRW apparent horizon, kept apart from the atlas's flat-ΛCDM particle and event horizons;
  - JSON export.
- **Kernel blocks** `SNX-MATH` and `SNX-AUDIT` in `index.html`: pure functions, with constants passed in.
- **Instrument `scalenexus`** (6 inputs, 8 outputs). It runs without a browser.
- **Agent handle `HCC_SCALE_NEXUS`:** coordinates, inverse, level, radius, dilate, S³ cap, FLRW, audit, export and import.
- **`lean/scale-nexus/`:** 29 Lean theorems with build log, axiom audit, toolchain pin, exact fixtures and hashes.
- **`scripts/golden-lattice-test.mjs`**, `docs/scale-nexus/PREREGISTRATION.md` and the recorded result and sensitivity analysis.
- **`docs/verify-the-scale-nexus.mjs`:** 11 checks, 26 915 cases.
- **Reports** `REPORT.md`, `GATES.md`, `LINEAGE.json`, `MANUSCRIPT.md`; the handoff kept in `docs/scale-nexus/handoff/`.

- **FBS3R.** Scale Nexus shells (R_A, A, the entry, its dilation end) in the 3D scene. A panel section links the two worlds both ways, with shared H₀ and Ω_K.
- **Catalogue cards.** Every card carries its typed audit row.
- **Typed bus coupling** `rungs.hubble_constant_early → scalenexus.scalenexus_hubble`, plus routable publications of the Scale Nexus outputs.

## Changed
- **Sun's mass:** now GM☉(IAU 2015)/G(CODATA 2022) = 1.988410·10³⁰ kg. It was 1.98847·10³⁰, which used the 2014 G.
- **Electron mass:** now 0.51099895069 MeV (CODATA 2022). It was 0.51099895, the CODATA 2018 value. This is an edition update, not a contradiction (Frontier II, item 6).

## Not changed, recorded
- The solar-mass constant of another module (`index.html` line 4355).
- `PHI_ATLAS` (lengths only).
- The published S³ preset.

## Tests
- **Baseline (`0bf9765`):** `test:source` GREEN; selftest 1209/1209.
- **After this change:** the full release chain, `test:source` and selftest are re-run; the results are in the PR description.
