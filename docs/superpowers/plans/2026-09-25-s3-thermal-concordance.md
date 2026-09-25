# S³ Thermal Concordance Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Provide a sourced conditional S³ forward model linking photon thermodynamics, expansion, and distances, callable by HCC's agents.

**Architecture:** A pure ESM forward solver consumes the existing HCC S³ inputs from the extracted atlas. A small `defineLab` wrapper exposes its results through the existing core and machine contracts. The instrument distinguishes measured inputs, model conditions, derived values, and the absent topology likelihood.

**Tech Stack:** JavaScript ESM, built-in `node:test`, HCC `defineLab`, existing generator `scripts/build-api.mjs`.

**Spec:** `docs/superpowers/specs/2026-09-25-s3-thermal-concordance-design.md`

## Global Constraints

- The DESI reference is arXiv:2607.27410v3 Table 3: H₀=68.43±0.30, Ω_m=0.3050±0.0032, 10³Ω_K=+2.20±1.00.
- Use existing `HCC_S3C`, `HCC_S3R` and `S3R`; do not introduce independent default constants or treat the Gaussian 1.39% tail as topology probability.
- Photon thermodynamics: `Qγ=c³ħ³/k_B⁴`, `uγ=π²T⁴/(15Qγ)`, `pγ=uγ/3`.
- Only Ω_K<0 is admitted to this round-S³ model; refuse impossible closure, E²<=0 and paths beyond the first antipode.
- DESI `D_H/D_M` comparison at z=2.33 has no σ or χ² without a joint likelihood and cross-covariance with DESI-fitted inputs; the measured distance-pair correlation is 0.225 and the sound horizon cancels.

## Review Focus

1. Passing Ω_K=0 or >0 must be refused, because the round-S³ model demands negative curvature parameter.
2. An Ω_m below the current massive-neutrino fraction must be refused, avoiding negative cold matter.
3. A w₀,wₐ combination producing negative E² at the queried redshift must be refused with a domain error.
4. At z=0, every component of E² must sum to one, even when H₀ or T₀ changes.
5. Without DESI cross-covariance with reused fitted inputs the comparison has a numeric difference and no significance claim.

---

### Task 1: Thermal and density-budget kernel

**Files:** Create `core/cosmology/s3-thermal-concordance.mjs`; create `test/s3-thermal-concordance.test.mjs`.

**Interfaces:** Export `thermalConcordance(options={})` returning `{inputs, densities, thermal, background, distances, comparison, caveats}`; export `fermiEnergyIntegral(y)` for limiting tests. Import `HCC_S3C`, `HCC_S3R`, `S3R` from `../atlas/extracted.mjs`.

- [x] Write tests with `node:test` asserting `Qγ≈8.6967595e14 K⁴/Pa`, `uγ(2T)/uγ(T)=16`, `pγ=uγ/3`, `η_T(z)=η_T(0)`, `fermiEnergyIntegral(0)=7π⁴/120`, nonrelativistic mass density scaling and E(0)=1.
- [x] Run `node --test test/s3-thermal-concordance.test.mjs` and confirm failures come from missing exports.
- [x] Implement input validation and the neutrino integral by even-panel composite Simpson on `[0,40]` with `Math.exp(-q)` tail-safe evaluation; include one massive species of 0.06 eV and `N_eff-1` effectively massless species.
- [x] Derive Ω_γ, Ω_ν, Ω_cb and Ω_de, normalize E(0)=1 by exact closure, and return the thermal observables and provenance/status; reject non-finite or impossible inputs instead of clamping.
- [x] Run the focused test until green, then `git add core/cosmology/s3-thermal-concordance.mjs test/s3-thermal-concordance.test.mjs && git commit -m "feat: calculate sourced S3 thermal density budget"`.

### Task 2: Distances and the observational ratio

**Files:** Modify `core/cosmology/s3-thermal-concordance.mjs`; extend `test/s3-thermal-concordance.test.mjs`.

**Interfaces:** Task 1's `thermalConcordance(options)` gains `background.H_km_s_Mpc`, `distances.{D_H_Mpc,D_C_Mpc,D_M_Mpc,D_A_Mpc,D_L_Mpc}`, `comparison.{z,observed_ratio,model_ratio,difference,significance}`.

- [x] Add failing tests for `D_C(0)=0`, for `dD_C/dz|0=c/H0`, for Etherington `D_L=(1+z)²D_A`, and for `D_M=R sin(D_C/R)` and its small-curvature limit. Verify model ratio at z=2.33 is finite and comparison significance is `null`.
- [x] Run the focused test and read the expected assertion failures.
- [x] Compute `E(z)` from the Task 1 budget and CPL factor, numerically integrate `D_C` using Simpson, then calculate round-S³ distances, angular arc, thermal ratio and the observational ratio. Refuse distance calculations beyond the first antipode.
- [x] Re-run the focused suite and check `R0` agrees with `S3R.Rc` at canonical inputs within 1e-12 relative.
- [x] Commit the focused implementation and tests with `git commit -am "feat: link S3 expansion to observed distance ratios"`.

### Task 3: Agent contract, documentation and generated artifacts

**Files:** Create `core/labs/s3.thermal_concordance.mjs` and `docs/S3_THERMAL_CONCORDANCE.md`; modify `core/index.mjs`, `test/run-tests.mjs`; regenerate `api/openapi.json`, `api/manifest.json`, `api/open-problems.json`, `.well-known/mcp.json`, `api/agent.json` as needed by `scripts/build-api.mjs`.

**Interfaces:** `CORE.describe('s3.thermal_concordance')`, `CORE.run('s3.thermal_concordance',{z:2.33})`, `CORE.validate('s3.thermal_concordance')` use existing `defineLab` and provenance.

- [x] Write a failing core test for `CORE.describe/run/validate` and for an open-geometry request returning `DOMAIN_ERROR`, plus output status CONDITIONAL and `comparison.significance===null`.
- [x] Run the focused tests to confirm failure from missing lab registration.
- [x] Implement the lab contract with finite input bounds, equations, units, source links, caveats and independent self-tests; register it in `IMPLEMENTED`, add its file to `coreHash`, and mention its machine ID in the `sec` coverage notes if scientifically relevant.
- [x] Document the primary sources, Gaussian-marginal caveat, neutrino convention, DESI comparison without covariance, and unsolved layers in `docs/S3_THERMAL_CONCORDANCE.md`.
- [x] Run `node scripts/build-api.mjs`, `node --test test/s3-thermal-concordance.test.mjs`, `npm test`, `node test/run-tests.mjs`, and `node scripts/extract-kernels.mjs --check`; inspect generated diffs for unrelated changes.
- [x] Commit the lab, docs, tests and necessary generated artifacts with `git commit -m "feat: expose S3 thermal concordance to agents"`.

## Final verification

- [ ] Inspect `git diff main...HEAD`, run all focused and repository quick checks afresh, and check status/working tree.
- [ ] Push the branch and open a draft PR describing mathematical identities, observed inputs, conditional steps, test evidence and known omissions; leave release and merge decisions to the repository's normal review path.
