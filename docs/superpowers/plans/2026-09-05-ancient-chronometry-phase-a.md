# Ancient Chronometry Observatory — Phase A Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the branch-safe, source-locked computational foundation and independent verification for ancient chronometry without touching HCC shared UI, generated artifacts, versioning, or global registries while another agent is active.

**Architecture:** Phase A creates only new files. A pure ESM kernel provides exact rational arithmetic, source-qualified unit graphs, calendar calibration, source conflict detection, Jain-cycle closure and bounded cross-period comparison. Independent CommonJS verifiers import the kernel directly and reproduce expected results without sharing implementation helpers. Phase B later wires this into the live atlas after rebasing onto the then-current `main`.

**Tech Stack:** Node.js ESM, CommonJS verifier scripts, BigInt rational arithmetic, JSON source registry, existing HCC scientific-status conventions.

**Spec:** `docs/superpowers/specs/2026-09-05-ancient-chronometry-observatory-design.md`

## Global Constraints

- Do not modify `index.html`, `version.json`, generated API/manifest artifacts, global navigation registries, or extracted-kernel artifacts during Phase A.
- Do not create a second commensurability engine for final atlas integration; Phase A comparison functions are self-contained validation primitives and Phase B must delegate to the existing HCC continued-fraction engine where compatible.
- Never merge same-named units across source profiles.
- Exact textual identities use BigInt rational arithmetic; binary64 appears only in explicitly approximate presentation/comparison functions.
- Every candidate cross-domain match preserves epistemic status and rejection reason.
- No ancient micro-unit may be promoted to a modern physical identity from numerical proximity alone.

---

### Task 1: Exact rational and calibration kernel

**Files:**
- Create: `core/labs/chronometry.source_locked.mjs`
- Test: `docs/verify-chronometry-source-locked.cjs`

**Interfaces:**
- Produces: `makeRational(n,d)`, `mul(a,b)`, `div(a,b)`, `add(a,b)`, `sub(a,b)`, `toNumber(r)`, `toDecimal(r,digits)`, `calibrateFromDay(partsPerDay, secondsPerDay)`.

- [ ] **Step 1: Write the failing verifier**

```js
'use strict';
const assert = require('assert');
(async () => {
  const M = await import('../core/labs/chronometry.source_locked.mjs');
  const a = M.makeRational(2n, 4n);
  assert.equal(a.n, 1n);
  assert.equal(a.d, 2n);
  assert.equal(M.toDecimal(M.makeRational(1n, 3n), 12), '0.333333333333');
  const ksana = M.calibrateFromDay(6480000n, 86400n);
  assert.equal(M.toDecimal(ksana, 12), '0.013333333333');
  console.log('PASS — exact rational/calibration kernel');
})().catch(e => { console.error(e); process.exit(1); });
```

- [ ] **Step 2: Run the verifier and confirm RED**

Run: `node docs/verify-chronometry-source-locked.cjs`

Expected: failure because `core/labs/chronometry.source_locked.mjs` does not exist.

- [ ] **Step 3: Implement minimal exact arithmetic**

```js
const abs = x => x < 0n ? -x : x;
function gcd(a,b){ a=abs(a); b=abs(b); while(b){ const t=a%b; a=b; b=t; } return a || 1n; }
export function makeRational(n,d=1n){
  n=BigInt(n); d=BigInt(d); if(d===0n) throw new RangeError('zero denominator');
  if(d<0n){ n=-n; d=-d; }
  const g=gcd(n,d); return Object.freeze({n:n/g,d:d/g});
}
export const mul=(a,b)=>makeRational(a.n*b.n,a.d*b.d);
export const div=(a,b)=>makeRational(a.n*b.d,a.d*b.n);
export const add=(a,b)=>makeRational(a.n*b.d+b.n*a.d,a.d*b.d);
export const sub=(a,b)=>makeRational(a.n*b.d-b.n*a.d,a.d*b.d);
export const toNumber=r=>Number(r.n)/Number(r.d);
export function toDecimal(r,digits=12){
  const neg=r.n<0n; let n=neg?-r.n:r.n; const q=n/r.d; let rem=n%r.d, s='';
  for(let i=0;i<digits;i++){ rem*=10n; s+=(rem/r.d).toString(); rem%=r.d; }
  return `${neg?'-':''}${q}.${s}`;
}
export const calibrateFromDay=(partsPerDay,secondsPerDay=86400n)=>makeRational(secondsPerDay,partsPerDay);
```

- [ ] **Step 4: Run verifier GREEN**

Run: `node docs/verify-chronometry-source-locked.cjs`

Expected: `PASS — exact rational/calibration kernel`.

- [ ] **Step 5: Commit**

Commit message: `feat: add exact source-locked chronometry kernel`.

---

### Task 2: Source registry and same-term conflict detection

**Files:**
- Create: `docs/data/ancient-chronometry-sources.json`
- Modify: `core/labs/chronometry.source_locked.mjs`
- Modify test: `docs/verify-chronometry-source-locked.cjs`

**Interfaces:**
- Produces: `validateSourceRecord(record)`, `groupDefinitionConflicts(records)`, `derivePartsPerDay(record)`.

- [ ] **Step 1: Add failing tests**

Test records must include at least source-qualified definitions for `abhidharmakosa.ksana`, `bhagavata.ksana`, `arthasastra.truti`, `bhagavata.truti`, and `siddhantasiromani.truti`. Assert that `groupDefinitionConflicts` returns separate conflict groups for normalized names `ksana` and `truti`, never a merged calibrated value.

- [ ] **Step 2: Run and confirm RED**

Run: `node docs/verify-chronometry-source-locked.cjs`

Expected: missing function failure.

- [ ] **Step 3: Implement validation and conflict grouping**

`validateSourceRecord` must require `id`, `normalized_term`, `quantity_kind`, `tradition`, `text`, `operational_definition`, `epistemic_status`, and `citation`.

`groupDefinitionConflicts` groups only by normalized lexical term and returns source IDs plus definition signatures; it never computes an average.

- [ ] **Step 4: Run GREEN**

Expected: all Task 1 tests plus conflict tests pass.

- [ ] **Step 5: Commit**

Commit message: `feat: add source-qualified ancient unit registry`.

---

### Task 3: Jain exact cycle closure and calendar profiles

**Files:**
- Modify: `core/labs/chronometry.source_locked.mjs`
- Modify: `docs/verify-chronometry-source-locked.cjs`

**Interfaces:**
- Produces: `jainAvasarpini(K)`, `calendarYearSeconds(profile)`, `convertYears(years, profile)`.

- [ ] **Step 1: Add failing exact-closure tests**

Use a symbolic pair `{k: bigint, years: bigint}` for durations of form `a*K + b years`. Assert:

```text
A1 = 4K
A2 = 3K
A3 = 2K
A4 = K - 42000 y
A5 = 21000 y
A6 = 21000 y
sum = 10K + 0 y
```

Also assert `42000 = 2 * 21000` is returned as an explicit dependency fact.

- [ ] **Step 2: Run RED**

Expected: missing Jain/calendar functions.

- [ ] **Step 3: Implement minimal symbolic closure and profiles**

Required profiles:

```text
canonical-unspecified -> no SI conversion, explicit refusal
360-day-traditional -> 31,104,000 seconds
Julian-year -> 31,557,600 seconds
tropical-year-j2000 -> declared decimal presentation constant, not exact ancient identity
sidereal-year-j2000 -> declared decimal presentation constant, not exact ancient identity
```

- [ ] **Step 4: Run GREEN**

Expected: exact closure passes with no floating-point arithmetic.

- [ ] **Step 5: Commit**

Commit message: `feat: encode Jain cycle closure and calendar profiles`.

---

### Task 4: Typed period comparison and rejection firewall

**Files:**
- Modify: `core/labs/chronometry.source_locked.mjs`
- Create: `docs/verify-chronometry-falsification.cjs`

**Interfaces:**
- Produces: `comparePeriods(candidate)`, `boundedRationalScan(A,B,maxHarmonic)`, `classifyCandidate(candidate)`.

- [ ] **Step 1: Write RED verifier**

Tests must assert:

1. Same quantity kind + same frame class can be considered for historical-measurement comparison.
2. `paramanu` vs electron Compton wavelength is rejected as `quantity_identity_missing` before numerical residual is used.
3. Harmonic search refuses `maxHarmonic > 12` unless `explicitExpandedSearch === true`.
4. Jain `42000` candidate reports dependency on `2 × 21000` and is not independent evidence.
5. A period-only Jain 21 kyr candidate cannot reach `PHASE_CONSISTENT` without an independent phase anchor.

- [ ] **Step 2: Run RED**

Run: `node docs/verify-chronometry-falsification.cjs`

Expected: missing comparison functions.

- [ ] **Step 3: Implement minimal typed firewall**

Classification order must check provenance/quantity identity before residual size. Returned objects include `status`, `reasons`, `relative_residual`, `harmonic`, `independent`, and `phase_tested`.

- [ ] **Step 4: Run GREEN**

Expected: all five negative/positive-control assertions pass.

- [ ] **Step 5: Commit**

Commit message: `feat: add chronometry falsification firewall`.

---

### Task 5: Historical astronomy benchmark schema

**Files:**
- Create: `docs/data/ancient-astronomy-benchmarks.json`
- Create: `docs/verify-ancient-astronomy-benchmarks.cjs`

**Interfaces:**
- Data records produce no final `EPOCH_CORRECTED_MATCH` until Phase B supplies or integrates an epoch-aware modern reference model.

- [ ] **Step 1: Write RED verifier against absent data file**

Assert every record has `id`, `culture`, `text`, `source_epoch`, `quantity_kind`, `ancient_value`, `unit`, `derivation`, `citation`, `comparison_status`.

Assert `comparison_status` is initially one of `HISTORICAL_MEASUREMENT`, `DERIVED_TEXTUAL`, or `PENDING_EPOCH_CORRECTION`, never `EPOCH_CORRECTED_MATCH`.

- [ ] **Step 2: Run RED**

Run: `node docs/verify-ancient-astronomy-benchmarks.cjs`

Expected: file-not-found.

- [ ] **Step 3: Add initial source-locked records**

Include only records whose primary/critical citations have been checked. Initial target families: Aryabhata sidereal rotation and lunar month; Huainanzi synodic month; Daming lunar/year constants; Shoushi lunar/year constants; Vedanga Jyotisa benchmark relations.

- [ ] **Step 4: Run GREEN**

Expected: schema/provenance verifier passes.

- [ ] **Step 5: Commit**

Commit message: `data: add source-locked ancient astronomy benchmarks`.

---

### Task 6: Parallel-agent handoff

**Files:**
- Create: `docs/ANCIENT_CHRONOMETRY_HANDOFF.md`

**Interfaces:**
- Produces a deterministic Phase B checklist for the agent or maintainer integrating after `main` advances.

- [ ] **Step 1: Record branch base and forbidden shared files**

Record base commit `f6e2e6fb98de89494d5aecad74f0094e6dd11c83` and branch `agent/ancient-chronometry-observatory`.

- [ ] **Step 2: Record integration procedure**

The integrator must:

1. fetch the new `main` head;
2. compare `f6e2e6f..new-main` to identify shared-file changes;
3. run all Phase A verifiers before modifying UI;
4. wire the new laboratory into the current, not historical, navigation/registry architecture;
5. reuse the current commensurability engine;
6. regenerate extracted kernels and API artifacts only after UI integration;
7. bump version exactly once after all merges;
8. run `node scripts/ci.mjs` and all new verifiers;
9. never resolve a scientific-content conflict by choosing the prettier number.

- [ ] **Step 3: Commit**

Commit message: `docs: add ancient chronometry parallel-agent handoff`.

---

### Phase B — intentionally deferred until the other agent lands

Phase B will be planned against the new `main`, not against `f6e2e6f`, and will cover live route/UI integration, global registry/API contract wiring, reuse of the existing commensurability engine, generated artifacts, version bump and full CI. No Phase B file should be edited from the stale base merely to make the branch look complete.
