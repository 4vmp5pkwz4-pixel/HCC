# HCC Integrity Closure + Evidence-Time Foundation

Date: 2026-09-15
Status: proposed implementation design
Branch: `chatgpt/integrity-closure-evidence-time`

## Purpose

Raise HCC's trust boundary before adding more scientific or visual capability. The change must preserve existing laboratory physics and visual semantics while making machine-facing predictions, measurements, release evidence, and time-domain behavior fail closed when their provenance is stale or inconsistent.

This design intentionally does **not** alter scientific formulas, constants, solver algorithms, laboratory statuses, or visual geometry. It strengthens the contracts around them.

## Scope decomposition

The full long-term direction has several layers. This implementation covers the first coherent foundation only:

1. **Integrity Closure** — remove known drift between current MCP/API surfaces, generated contracts, release gates, and measured artifacts.
2. **Evidence provenance** — make every derived predictive artifact carry and validate the identity of the evidence it was composed from.
3. **Evidence-Time foundation** — expose one typed, read-only description of how a laboratory relates to Atlas epoch and other time domains, without redesigning the visual Time Machine yet.

The later empirical-observatory, global uncertainty engine, renderer migration, and laboratory-by-laboratory scientific re-audit remain separate projects.

## Non-goals

- No changes to equations or numerical methods inside existing laboratories.
- No reinterpretation of `EXACT`, `NUMERICALLY_VERIFIED`, `CONDITIONAL`, `REFERENCE_MODEL`, `SYNTHETIC_ONLY`, `OPEN`, or `NOT_IMPLEMENTED`.
- No claim that stale measurements are wrong; they remain historical evidence.
- No automatic promotion of synthetic validation to empirical validation.
- No WebGPU migration.
- No replacement of Three.js or WebXR architecture.
- No destructive rewrite of `index.html`.

## Design principles

### 1. Freshness is typed evidence, not a boolean decoration

A derived result is current only if every evidence dependency it names is current for the release identity against which it is being used.

A stale artifact remains readable, but operations that require current evidence must refuse with a structured reason rather than silently use it.

### 2. Provenance is transitive

`reach.json` is not current merely because its own header says the current version. Its provenance includes the `sensitivity.json` and `transfers.json` identities from which it was composed. The validator must inspect those nested identities as part of the contract.

### 3. Generated facts must not be retyped by hand

Counts such as MCP tool count must be derived from the actual tool registry or generated contract. Release gates must test correspondence, not hard-coded cardinality.

### 4. Historical measurements stay first-class

The agent surface may serve dated liveness/sensitivity/transfers data, but it must expose the date/release clearly and distinguish historical evidence from current evidence.

### 5. Time domains remain fail closed

Only domains explicitly promotable to Atlas epoch may be treated as Atlas epoch. Statistical, model-dependent, iteration, spatial, render, and parametrization clocks retain their current typed boundaries.

## Component changes

### A. Evidence identity module

Add a small pure module under `core/evidence/` that defines and validates an evidence identity record.

Minimal record:

```text
schema
artifact
version
build
code_sha256? / fingerprint?
measured_at? (when present)
source_dependencies[]
```

The module must provide pure functions only; no DOM, network, filesystem, renderer, or mutable global state.

Required operations:

- validate record shape;
- compare an artifact identity with a target Atlas release;
- recursively validate declared dependencies;
- classify evidence as `CURRENT`, `DATED`, or `INCONSISTENT`;
- return machine-readable refusal details without inventing replacement values.

`DATED` means internally coherent but measured on another release. `INCONSISTENT` means the artifact claims one release while its declared source dependencies describe another incompatible state.

### B. Reach artifact contract

Extend `api/reach.json` generation so its provenance is explicit and machine-verifiable rather than prose-only.

`composed_from` must include structured source identities for sensitivity and transfers, not only strings. `scripts/reach.mjs` must continue refusing composition when its two immediate inputs disagree with each other.

`validateReachArtifact()` must additionally verify:

- the reach header identity;
- the identities of both composed source artifacts;
- dependency coherence;
- currentness relative to a supplied Atlas identity when forecast use requires current evidence.

The validator should support two modes:

- **read mode**: dated but coherent artifacts are readable;
- **forecast mode**: dated or inconsistent dependencies cause refusal.

### C. Static SDK fail-closed forecast

`api/agent-client.mjs` must continue to allow discovery and inspection when measurements are dated.

However `forecast(control, delta)` must not return a current predictive scenario if its reach dependencies are dated relative to `version.json`.

Refusal shape should be explicit, e.g. an error with a stable code such as `STALE_EVIDENCE` and details naming each dated dependency and its release identity.

The SDK must never silently regenerate evidence in the browser and must never relabel a dated artifact as current.

### D. Core measurement surface

`CORE.measurements()` and MCP `list_measurements` keep serving historical artifacts. Their metadata must expose, for every artifact:

- artifact release;
- current Atlas release;
- `measured_on_this_release`;
- dependency coherence where applicable;
- usable purposes (`inspect`, `forecast`, etc.).

A caller should be able to distinguish:

- historical but coherent measurement;
- current measurement;
- inconsistent derived artifact.

### E. MCP and generated contract drift closure

Remove hard-coded assumptions that the MCP registry contains exactly nine tools.

The full workflow must compare the served tool list to the generated `.well-known/mcp.json` list, including order or normalized set as appropriate. The source of truth is the current `TOOLS` registry / generated contract, not a literal count.

Update machine-facing documentation that currently states nine tools so that it is generated or at minimum checked against the generated MCP contract. Prefer deriving displayed tool lists/counts from `.well-known/mcp.json` during generation rather than duplicating them.

Acceptance rule: adding or removing a tool in the future must require no hand-edit of a numeric MCP count in a release gate.

### F. Measurement freshness closure

Regenerate, on the implementation branch, the measured artifacts that are required for predictive currentness:

- `api/sensitivity.json`
- `api/transfers.json`
- `api/reach.json`
- `api/liveness.json`

The generators remain authoritative. Do not edit generated JSON by hand.

All four must end with a coherent current-release identity before the branch is considered release-ready.

If the current repository design intentionally permits liveness to remain dated for normal development, the release gate must still make that policy explicit: dated liveness is allowed for inspection but cannot be presented as measured on this release.

### G. Evidence-Time registry foundation

Extend the existing typed time registry rather than create a competing clock system.

Add a read-only query surface that can answer, for a laboratory/instrument:

- which declared time domains it uses;
- which domain, if any, is driven directly by `atlas.epoch`;
- which adapter relates them;
- adapter status (`EXACT`, `MODEL_DEPENDENT`, `STATISTICAL`, `NO_EXCHANGE`);
- invertibility;
- validity statement;
- state scope (`GLOBAL_PHYSICS`, `SHARED_PHYSICS`, `LAB_LOCAL`, `VIEW_ONLY`).

This first implementation does not redesign the Time Machine UI. It creates the machine-readable contract needed to do so safely later.

A laboratory with no declared time relation must report that absence explicitly; no inferred connection is allowed.

## Data flow

### Predictive path

```text
version.json
   |
   +--> sensitivity.json ----+
   |                         |
   +--> transfers.json ------+--> reach.json --> validateReachArtifact(..., forecast mode)
                                             --> static SDK forecast
                                             --> current scenario OR STALE_EVIDENCE refusal
```

### Measurement inspection path

```text
api/*.json --> CORE.measurements() --> HTTP/MCP list_measurements
             historical evidence remains visible with explicit freshness metadata
```

### Time path

```text
AtlasTime --> typed TIME_DOMAINS/CLOCK_ADAPTERS/STATE_SCOPES
          --> read-only lab-time relation query
          --> future Time Machine / agent consumers
```

## Error handling

Stable refusal classes should distinguish:

- `STALE_EVIDENCE`: internally coherent evidence from an older release;
- `INCONSISTENT_EVIDENCE`: derived artifact header/dependency identities disagree;
- existing `DOMAIN_ERROR`: invalid scientific input;
- existing `NOT_IMPLEMENTED`: no computational contract.

No refusal may be converted into a plausible numeric substitute.

Error details should include the exact artifact names and release/build identities involved.

## Compatibility

- Existing consumers that only inspect artifacts continue to receive them.
- Existing numerical laboratory outputs do not change.
- Existing MCP tool names remain unchanged.
- Static SDK discovery/search/describe/audit remain available even when predictive evidence is dated.
- `forecast()` becomes stricter by design; callers relying on stale reach data must handle the new refusal.
- Existing time-domain semantics remain unchanged; the new query surface is additive.

## Verification strategy

### Unit tests

Add tests for evidence identity classification:

1. all current -> `CURRENT`;
2. coherent old artifact -> `DATED`;
3. current reach header + old dependency -> `INCONSISTENT` for forecast use;
4. missing required dependency -> refusal;
5. malformed dependency identity -> refusal;
6. read mode still permits coherent historical inspection.

Add reach-validator tests proving that changing only the top-level reach version cannot make old dependencies current.

Add static SDK tests asserting `forecast()` refuses stale evidence while `discover()` and `describe()` still work.

Add time-registry tests for exact/model/statistical/no-exchange examples and for explicit absence.

### Contract tests

- MCP tools served by the server equal tools declared in `.well-known/mcp.json`.
- No workflow contains a hard-coded expected MCP tool count.
- Machine docs no longer advertise an obsolete tool list/count.
- Measurement metadata reports freshness truthfully.

### Existing gates

The implementation must pass the repository's existing quick gate and test suite before any claim of completion.

Release readiness additionally requires the exhaustive browser/core pipeline available to this repository, including regenerated measurement artifacts and the manual Computational Core workflow or an equivalent full local run.

## Rollout order

1. Add failing tests for stale nested reach provenance and MCP registry drift.
2. Add evidence identity module and wire it into reach validation.
3. Make static SDK forecast fail closed.
4. Expose richer freshness metadata through core/MCP.
5. Remove hard-coded MCP count/list drift from workflow/docs generation.
6. Add Evidence-Time query foundation and tests.
7. Regenerate measured artifacts from their generators.
8. Run quick and exhaustive verification.
9. Only after evidence closure is green, consider visual Time Machine redesign as a separate change.

## Success criteria

The branch is complete only when all are true:

- A current `reach.json` cannot successfully forecast from old sensitivity/transfers without an explicit refusal.
- Historical measurement artifacts remain inspectable and honestly labeled.
- MCP tool registry, generated MCP contract, workflow verification, and machine docs agree without a hand-maintained numeric count.
- Predictive measurement artifacts are coherently regenerated for the same release before release-ready status.
- Laboratory time relations are queryable without collapsing incompatible time domains into Atlas epoch.
- No existing laboratory formula, solver, status, or visual geometry has been changed as part of this foundation.
