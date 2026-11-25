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

## Changed
- **Sun's mass:** now GM☉(IAU 2015)/G(CODATA 2022) = 1.988410·10³⁰ kg. It was 1.98847·10³⁰, which used the 2014 G.
- **Electron mass:** now 0.51099895069 MeV (CODATA 2022). It was 0.51099895.

## Not changed, recorded
- The solar-mass constant of another module (`index.html` line 4355).
- `PHI_ATLAS` (lengths only).
- The published S³ preset.

## Tests
- **Baseline (`0bf9765`):** `test:source` GREEN; selftest 1209/1209.
- **After this change:** the full release chain, `test:source` and selftest are re-run; the results are in the PR description.
