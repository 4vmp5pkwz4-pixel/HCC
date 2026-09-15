# Integrity Closure + Evidence-Time Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make HCC predictive evidence fail closed on stale/inconsistent provenance, close MCP/CI/documentation drift, expose typed time relations safely, and preserve all existing scientific formulas, solvers, statuses, and visual geometry.

**Architecture:** Add a small pure evidence-identity layer and make `reach` provenance transitive instead of trusting only its top-level release stamp. Keep historical measurements readable through Core/MCP while making forecast use strict. Reuse the existing `TOOLS`, time-domain registry, generator pipeline, and test surfaces rather than create competing authorities.

**Tech Stack:** Node.js ESM, existing HCC core modules, Node `test`, GitHub Actions YAML, generated JSON contracts, existing browser/pipeline scripts.

**Spec:** `docs/superpowers/specs/2026-09-15-integrity-closure-evidence-time-design.md`

## Global Constraints

- Do not change equations, constants, numerical methods, laboratory statuses, or scientific visual geometry.
- Do not promote synthetic validation to empirical validation.
- Do not infer a time-domain connection that is not explicitly declared.
- Historical measurement artifacts remain readable; strict refusal applies only where current evidence is required.
- Do not add a second renderer, second clock authority, or second MCP registry.
- Out-of-domain or stale/inconsistent scientific requests must fail closed rather than return plausible substitute numbers.

---

### Task 1: Pure Evidence Identity Contract

**Files:**
- Create: `core/evidence/identity.mjs`
- Create: `test/evidence-identity.test.mjs`
- Modify: `package.json` (`test:agent` command only)

**Interfaces:**
- Produces: `EVIDENCE_STATE`, `validateEvidenceIdentity(record)`, `classifyEvidence(record, atlasIdentity)`, `requireCurrentEvidence(record, atlasIdentity)`.
- `classifyEvidence` returns `{state:'CURRENT'|'DATED'|'INCONSISTENT', reasons:[...], artifact, version, build}`.
- `requireCurrentEvidence` throws an `Error` with `code='STALE_EVIDENCE'` or `code='INCONSISTENT_EVIDENCE'` and a machine-readable `detail` object.

- [ ] **Step 1: Write the failing unit tests.**

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import {classifyEvidence, requireCurrentEvidence} from '../core/evidence/identity.mjs';

const atlas={version:'4.269.0',build:'current'};

test('current evidence is CURRENT',()=>{
  assert.equal(classifyEvidence({schema:'hcc.evidence/1',artifact:'reach',version:'4.269.0',build:'current',source_dependencies:[]},atlas).state,'CURRENT');
});

test('coherent historical evidence is DATED',()=>{
  assert.equal(classifyEvidence({schema:'hcc.evidence/1',artifact:'liveness',version:'4.182.0',build:'old',source_dependencies:[]},atlas).state,'DATED');
});

test('current header over old dependency is INCONSISTENT',()=>{
  const record={schema:'hcc.evidence/1',artifact:'reach',version:'4.269.0',build:'current',source_dependencies:[
    {schema:'hcc.evidence/1',artifact:'sensitivity',version:'4.191.0',build:'old',source_dependencies:[]}
  ]};
  assert.equal(classifyEvidence(record,atlas).state,'INCONSISTENT');
  assert.throws(()=>requireCurrentEvidence(record,atlas),e=>e.code==='INCONSISTENT_EVIDENCE');
});
```

- [ ] **Step 2: Run the new test and confirm it fails because the module does not exist.**

Run: `node --test test/evidence-identity.test.mjs`
Expected: FAIL with module-not-found.

- [ ] **Step 3: Implement the minimal pure module.**

Key implementation rules:

```js
export const EVIDENCE_STATE=Object.freeze({CURRENT:'CURRENT',DATED:'DATED',INCONSISTENT:'INCONSISTENT'});

export function validateEvidenceIdentity(record){
  if(!record || typeof record!=='object' || Array.isArray(record)) throw new TypeError('evidence identity must be an object');
  for(const key of ['schema','artifact','version','build']) if(typeof record[key]!=='string' || !record[key]) throw new TypeError(`missing evidence ${key}`);
  if(record.schema!=='hcc.evidence/1') throw new TypeError(`unsupported evidence schema: ${record.schema}`);
  const deps=record.source_dependencies ?? [];
  if(!Array.isArray(deps)) throw new TypeError('source_dependencies must be an array');
  deps.forEach(validateEvidenceIdentity);
  return record;
}
```

Classification rule: a record whose own release differs from Atlas and whose dependencies agree with that same historical release is `DATED`; a record claiming the Atlas release while any dependency is dated to another release is `INCONSISTENT`; malformed/missing dependencies are invalid rather than guessed.

- [ ] **Step 4: Run the evidence tests until all pass.**

Run: `node --test test/evidence-identity.test.mjs`
Expected: PASS.

- [ ] **Step 5: Add the new unit test to `npm run test:agent`.**

Change only the test command so `test/evidence-identity.test.mjs` is included with the existing forecast/agent tests.

- [ ] **Step 6: Commit.**

Commit message: `feat: add transitive evidence identity contract`

---

### Task 2: Structured Reach Provenance and Fail-Closed Forecast

**Files:**
- Modify: `scripts/reach.mjs`
- Modify: `core/prediction/reach-forecast.mjs`
- Modify: `api/agent-client.mjs`
- Modify: `test/agent-client.test.mjs`
- Create: `test/reach-evidence.test.mjs`
- Modify: `package.json` (`test:agent`)

**Interfaces:**
- Consumes Task 1 evidence functions.
- Produces a `reach.evidence` record containing structured identities for reach, sensitivity, and transfers.
- `validateReachArtifact(reach, identity, {purpose:'inspect'|'forecast'})` returns `{ok,state,error,detail}`.
- `forecastReach(...)` requires `purpose:'forecast'` and refuses stale/inconsistent dependency provenance.

- [ ] **Step 1: Add failing reach-evidence tests.**

Construct a synthetic `hcc.reach/1` object whose top-level version matches Atlas but whose `evidence.source_dependencies` contain old sensitivity/transfers. Assert inspect mode reports the inconsistency without discarding the artifact, while forecast mode refuses.

- [ ] **Step 2: Run the new test and verify the existing validator incorrectly accepts the stale nested provenance.**

Run: `node --test test/reach-evidence.test.mjs`
Expected: FAIL because current `validateReachArtifact()` only checks top-level `version/build`.

- [ ] **Step 3: Change `scripts/reach.mjs` to emit structured evidence.**

The generated document must include:

```js
evidence: {
  schema:'hcc.evidence/1', artifact:'reach', version:version.version, build:version.build,
  source_dependencies:[
    {schema:'hcc.evidence/1',artifact:'sensitivity',version:sens.version,build:sens.build,source_dependencies:[]},
    {schema:'hcc.evidence/1',artifact:'transfers',version:tran.version,build:tran.build,source_dependencies:[]}
  ]
}
```

Retain the human-readable `composed_from` note for compatibility, but it is no longer the machine authority.

- [ ] **Step 4: Wire transitive evidence validation into `core/prediction/reach-forecast.mjs`.**

`validateReachArtifact` must keep structural checks, then classify `reach.evidence`. In inspect mode, `DATED` is valid-but-dated; in forecast mode both `DATED` and `INCONSISTENT` are refusals.

- [ ] **Step 5: Make `api/agent-client.mjs` strict only at `forecast()`.**

`connectAtlas()` still loads discovery/search/describe with historical measurement data. `forecast()` calls the strict validator and throws `STALE_EVIDENCE` or `INCONSISTENT_EVIDENCE` with dependency details.

- [ ] **Step 6: Update `test/agent-client.test.mjs`.**

Replace the current assumption that the published stale reach must forecast successfully. Add an HTTP fixture where discovery/describe succeed but forecast throws stale evidence. Add a separate fixture with all-current nested evidence proving forecast works when provenance is coherent.

- [ ] **Step 7: Run targeted tests.**

Run: `node --test test/evidence-identity.test.mjs test/reach-evidence.test.mjs test/agent-client.test.mjs`
Expected: PASS.

- [ ] **Step 8: Commit.**

Commit message: `feat: make reach forecasts fail closed on stale evidence`

---

### Task 3: Measurement Freshness Metadata Through Core/HTTP/MCP

**Files:**
- Modify: `core/index.mjs` (`CORE.measurements` implementation only)
- Modify: `docs/verify-agent-measurements.cjs`
- Modify: `test/run-tests.mjs`

**Interfaces:**
- Consumes Task 1 classification.
- Each `artifacts[kind]` entry gains `evidence_state`, `usable_for`, and (for reach) dependency detail.
- Historical coherent artifacts remain returned in `measurements`.

- [ ] **Step 1: Add failing verifier assertions.**

Require each artifact metadata row to contain:

```text
version
build
measured_on_this_release
evidence_state
usable_for
```

Expected policy:
- `CURRENT`: `usable_for` includes `inspect`; reach may include `forecast` only if transitive dependencies are current.
- `DATED`: `usable_for:['inspect']`.
- `INCONSISTENT`: `usable_for:['inspect']` only, with a reason.

- [ ] **Step 2: Run verifier to confirm failure on missing fields.**

Run: `node docs/verify-agent-measurements.cjs`
Expected: FAIL.

- [ ] **Step 3: Implement metadata in `CORE.measurements()`.**

Do not filter stale artifacts out. Derive metadata from each artifact and current `version.json`; for reach use its structured evidence tree.

- [ ] **Step 4: Extend API contract checks.**

In `test/run-tests.mjs`, assert the HTTP measurement surface reports the same evidence state as Core and that at least one current-main artifact is explicitly dated until regeneration occurs.

- [ ] **Step 5: Run targeted tests.**

Run: `node docs/verify-agent-measurements.cjs && node test/run-tests.mjs`
Expected: PASS.

- [ ] **Step 6: Commit.**

Commit message: `feat: expose measurement evidence freshness`

---

### Task 4: Remove MCP Count Drift From Workflow and Machine Docs

**Files:**
- Modify: `.github/workflows/core.yml`
- Modify: `docs/AGENTS.md`
- Modify: `llms.txt`
- Create: `docs/verify-mcp-registry-drift.cjs`
- Modify: `package.json` (`test:source`)

**Interfaces:**
- Existing `server/server.mjs::TOOLS` remains the runtime authority.
- Existing `.well-known/mcp.json` remains the generated public contract.
- No new registry is introduced.

- [ ] **Step 1: Write a failing drift verifier.**

The verifier must load `.well-known/mcp.json` and reject:
- a literal `t.length!==9` or equivalent fixed numeric MCP count in `core.yml`;
- docs text claiming `Nine tools` / `9 MCP tools`;
- a hand-written complete tool list presented as authoritative when the generated contract exists.

- [ ] **Step 2: Run it and confirm the current repository fails.**

Run: `node docs/verify-mcp-registry-drift.cjs`
Expected: FAIL on `core.yml`, `docs/AGENTS.md`, and `llms.txt`.

- [ ] **Step 3: Replace the workflow's numeric assertion with registry correspondence.**

The service-start step should save `tools/list` output and compare the returned names to `.well-known/mcp.json` names, normalized and sorted. Failure text must name missing/extra tools rather than an expected number.

- [ ] **Step 4: Remove duplicated numeric/list claims from docs.**

Use wording equivalent to: “The authoritative current MCP tool list is generated at `.well-known/mcp.json`; the server and generated contract are verified to agree.” Examples may show a subset but must be labelled examples, not the complete list.

- [ ] **Step 5: Add the verifier to `test:source`.**

- [ ] **Step 6: Run source tests.**

Run: `node docs/verify-mcp-registry-drift.cjs && npm test`
Expected: PASS.

- [ ] **Step 7: Commit.**

Commit message: `fix: derive MCP release checks from the registry`

---

### Task 5: Evidence-Time Query Foundation

**Files:**
- Modify: `core/time/registry.mjs`
- Modify: `test/unified-atlas-time.test.mjs`

**Interfaces:**
- Produces: `TIME_BINDINGS`, `timeRelationsFor(ownerId)`.
- `timeRelationsFor` never infers from names. Unknown/unbound owners return an explicit empty result: `{owner, relations:[], status:'NO_DECLARED_TIME_RELATION'}`.

- [ ] **Step 1: Add failing tests for explicit bindings and explicit absence.**

Required examples:
- Solar uses `solar.epoch` and the exact adapter from `atlas.epoch`.
- Cycles uses `cycles.epoch` plus derived phases; precession/galactic phase remain model-dependent.
- Relativity coordinate/proper time remains model-dependent and local.
- Lorenz Poincaré iteration to flow time remains statistical.
- Anderson site has no exchange with Atlas epoch.
- An unknown owner reports `NO_DECLARED_TIME_RELATION`.

- [ ] **Step 2: Run the unified time test and confirm failure because bindings/query do not exist.**

Run: `node test/unified-atlas-time.test.mjs`
Expected: FAIL on missing exports.

- [ ] **Step 3: Add immutable explicit `TIME_BINDINGS`.**

Each binding names owner id, domains, and state scope; adapters are resolved through the existing `findClockAdapter` rather than duplicated.

- [ ] **Step 4: Implement `timeRelationsFor(ownerId)`.**

Return domain metadata plus any adapter from `atlas.epoch` and preserve `EXACT`, `MODEL_DEPENDENT`, `STATISTICAL`, or `NO_EXCHANGE` without upgrading status.

- [ ] **Step 5: Run time tests.**

Run: `node test/unified-atlas-time.test.mjs`
Expected: PASS.

- [ ] **Step 6: Commit.**

Commit message: `feat: expose typed evidence-time relations`

---

### Task 6: Generated Artifact Closure

**Files (generated only by authoritative scripts):**
- Regenerate: `api/sensitivity.json`
- Regenerate: `api/transfers.json`
- Regenerate: `api/reach.json`
- Regenerate: `api/liveness.json`
- Regenerate as required by existing pipeline: `api/manifest.json`, `api/openapi.json`, `.well-known/mcp.json`, `api/open-problems.json`, `artifacts/agent-demo-report.json`

**Interfaces:**
- No manual JSON edits.

- [ ] **Step 1: Run the repository artifact pipeline.**

Run: `node scripts/pipeline.mjs`
Expected: all dependency-ordered steps complete; generated files share the branch release identity where the project policy requires currentness.

- [ ] **Step 2: Verify reach source identities match regenerated sensitivity/transfers.**

Run: `node scripts/reach.mjs --check`
Expected: PASS and no mixed source releases.

- [ ] **Step 3: Verify generated API/MCP contracts are in step.**

Run: `node scripts/build-api.mjs && git diff --exit-code -- api/openapi.json .well-known/mcp.json api/open-problems.json`
Expected: no uncommitted regeneration drift after committing generated outputs.

- [ ] **Step 4: Commit generated artifacts separately.**

Commit message: `chore: regenerate evidence artifacts for integrity closure`

---

### Task 7: Full Verification and PR Readiness

**Files:** none unless a test exposes a real defect.

- [ ] **Step 1: Run focused unit/contract tests.**

Run:
`node --test test/evidence-identity.test.mjs test/reach-evidence.test.mjs test/agent-client.test.mjs test/unified-atlas-time.test.mjs`
Expected: PASS.

- [ ] **Step 2: Run quick repository gate.**

Run: `node scripts/gate.mjs`
Expected: GREEN.

- [ ] **Step 3: Run exhaustive browser gate.**

Run: `node scripts/gate.mjs --full`
Expected: GREEN with zero self-test failures.

- [ ] **Step 4: Run computational core suite.**

Run: `node scripts/ci.mjs`
Expected: `CI: all green`.

- [ ] **Step 5: Verify Docker/service contract if environment permits.**

Run: `docker build -t hcc-core:integrity .`
Expected: build succeeds and container health reports `requires_webgl:false`.

- [ ] **Step 6: Inspect branch diff for forbidden scientific changes.**

The diff must not modify formulas/constants/solver internals or scientific scene geometry. Any such change requires a separate scientific review and is removed from this PR.

- [ ] **Step 7: Update the draft PR with exact verification evidence and only then mark ready for review.**

Do not merge while any exhaustive step is unavailable or red; state the missing evidence explicitly.

---

## Plan Self-Review

Spec coverage: Tasks 1-3 implement transitive evidence/freshness and fail-closed forecast; Task 4 closes MCP/CI/docs drift; Task 5 provides the additive typed time relation foundation; Task 6 handles authoritative regeneration; Task 7 enforces release evidence. The empirical observatory, global uncertainty engine, renderer migration, and visual Time Machine redesign remain deliberately outside this plan as required by the approved spec.

Type consistency: evidence state names are `CURRENT`, `DATED`, `INCONSISTENT`; refusal codes are `STALE_EVIDENCE` and `INCONSISTENT_EVIDENCE`; the time query is `timeRelationsFor(ownerId)` and never creates adapters outside `CLOCK_ADAPTERS`.
