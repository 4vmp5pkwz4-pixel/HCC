# S³ Lyα Covariance Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a source-identified DESI DR2 distance-pair Gaussian score for conditional S³ background predictions.

**Architecture:** Keep one immutable observational record and a pure scoring function separate from the existing background solver. Wrap both in an agent lab that requires an explicit sound horizon and retains data-reuse caveats.

**Tech Stack:** Node ESM, built-in `node:test`, HCC core contract and generated static API artifacts.

**Spec:** `docs/superpowers/specs/2026-09-26-s3-lya-covariance-design.md`

## Global Constraints

- The pair order is `[D_M/r_d,D_H/r_d]` and covariance off-diagonal is `0.0049005`.
- The observational score is an approximation to Equation 26, with no independent significance or topology evidence.
- `r_d_Mpc` is required; existing thermal ratio retains `significance:null`.
- Pure ESM; no browser, no new runtime dependency; no invented independent data.

## Review Focus

- Zero or negative `r_d_Mpc`: refuse; test in Task 1.
- `NaN`/infinite distance or overflow: refuse; test in Task 1.
- Interchanging the two observations: test a hand-calculated off-diagonal residual in Task 1.
- Missing `r_d_Mpc` through agent contract: refuse; test in Task 2.
- Resuing DESI-fitted defaults: expose an in-sample caveat and null topology significance in Task 2.

---

### Task 1: Versioned distance pair and pure Gaussian score

**Files:** Create `core/cosmology/desi-dr2-lya.mjs`; test `test/s3-lya-distance-likelihood.test.mjs`.

**Interfaces:** Produces `DESI_DR2_LYA_EQ26` and `distancePairGaussian({D_M_Mpc,D_H_Mpc,r_d_Mpc})` returning `observation`, `predicted`, `residual`, `covariance`, `chi2`, `log_likelihood_relative`.

- [ ] Write tests: exact mean gives χ²=0; independent hand calculation for residual `[0.33,0.066]` gives χ²=`2/(1+0.225)`; covariance entry `0.0049005`; invalid finite/positive inputs refuse.
- [ ] Run `node --test test/s3-lya-distance-likelihood.test.mjs`; expect failure because module is missing.
- [ ] Implement the record and score with analytical 2×2 inverse, finite result checks and immutable record.
- [ ] Run focused tests; expect all green.
- [ ] Commit the self-contained observational kernel and test.

### Task 2: S³ lab, evidence metadata and machine access

**Files:** Create `core/labs/s3.lya_distance_likelihood.mjs`; modify `core/index.mjs`, `core/version.mjs`; extend `test/s3-lya-distance-likelihood.test.mjs`; regenerate `api/*` and `.well-known/mcp.json`.

**Interfaces:** Consumes Task 1 function plus `thermalConcordance({z:2.33,...})`; produces `CORE.run('s3.lya_distance_likelihood',{r_d_Mpc,...})` with typed vector output and flat scalar score.

- [ ] Write failing CORE tests: explicit ruler required, exact source ID and predicted vector, χ²≥0, positive Ω_K refused, sweep cap, the separate thermal ratio has null significance.
- [ ] Run focused tests; expect missing lab.
- [ ] Implement lab and registration, update hash inventory/version, regenerate static descriptions.
- [ ] Run focused tests and `node test/run-tests.mjs`; expect success.
- [ ] Commit the integrated lab and artifacts.

### Task 3: Documentation and final verification

**Files:** Modify `docs/S3_THERMAL_CONCORDANCE.md`, `docs/AGENTS.md`.

**Interfaces:** Link source, describe observable-to-model map, reuse caveat and boundary of the term.

- [ ] Add usage example and explain what χ² can and cannot support.
- [ ] Run `node --test test/s3-lya-distance-likelihood.test.mjs test/s3-thermal-concordance.test.mjs`, `node test/run-tests.mjs`, `npm test`, and `node scripts/extract-kernels.mjs --check`; inspect exit codes.
- [ ] Commit the documentation; review the full diff and publish updates to draft PR #426.
