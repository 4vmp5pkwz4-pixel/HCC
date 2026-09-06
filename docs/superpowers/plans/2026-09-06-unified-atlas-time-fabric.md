# HCC v4.152.0 Unified Atlas Time Fabric Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship HCC 4.152.0 as one persistent scientific machine: one authoritative absolute Atlas epoch for every physically epoch-linked model, explicit typed local/model clocks where absolute-time conversion is not justified, persistent global/shared state across navigation, and a controlled per-lab Isolated compatibility route that can never become a second global clock.

**Architecture:** Add a DOM-free `core/time/` kernel for split-epoch arithmetic, authoritative mutation and typed clock/state registries. Keep `index.html` as the browser runtime authority and integrate the kernel through one deterministic v4.152 patcher, following existing HCC release conventions. The root animation loop advances `AtlasTime` exactly once per frame and distributes one immutable snapshot. Existing `state.epochDays`, `state.daysPerSec` and `state.paused` become compatibility projections, not independent stores. Navigation owns only view history; GLOBAL_PHYSICS and SHARED_PHYSICS live above worlds/labs. Runtime and static verifiers fail closed on undeclared clocks, forbidden private epochs and unjustified clock exchange.

**Tech Stack:** Node.js 18+, vanilla ES modules/HTML/CSS, Three.js r160, Playwright 1.49, CommonJS deterministic verifiers, GitHub Actions/GitHub Pages, existing HCC manifest/API builders.

**Spec:** `docs/superpowers/specs/2026-09-06-unified-atlas-time-fabric-design.md`

**Base:** `main@41b83887f5d4a57466b297ee3d0f0d84ae073f15` (`4.151.1`)

## Global constraints

- Target version: `4.152.0`.
- Target build: `unified-atlas-time-2026.09.06.1`.
- Exactly one absolute simulation epoch authority exists in Unified mode.
- A mode/lab may derive time from AtlasTime but may not independently integrate an absolute date.
- `Date.now()`/`performance.now()` may drive wall/render diagnostics, not continuing scientific epoch after initialization.
- Proper time, coordinate time, KS `s`, Mixmaster `tau`, map iterations and spatial indices remain distinct typed domains.
- Missing clock conversion is `NO_EXCHANGE`; never infer conversion from symbol spelling or dimensional resemblance.
- One animation frame gets one immutable scientific time snapshot regardless of 60 Hz, 120 Hz or XR refresh rate.
- Navigation never restores an older GLOBAL_PHYSICS state implicitly.
- `Reset Motion` does not rewind AtlasTime. Only explicit snapshot restore may do so.
- Isolated compatibility mode is local to one laboratory and cannot mutate AtlasTime unless an explicit, type-safe promotion action is invoked for an ABSOLUTE_EPOCH domain.
- Periodic scientific phase calculations use modulo/reduction before angle construction.
- Mobile/XR adaptations may change rendering density only, never scientific state/time semantics.
- Generated `core/atlas/extracted.mjs` is never hand-edited.
- Every production change is preceded by a failing test/verifier.
- Do not implement release identity until scientific/runtime gates pass.

---

### Task 1: RED gate and pure split-epoch kernel

**Files:**
- Create: `test/unified-atlas-time.test.mjs`
- Create: `core/time/atlas-time.mjs`

**Interfaces:**
- Produces `normalizeEpoch`, `splitEpochDays`, `epochDaysOf`, `reduceEpochModulo`, `createAtlasTime`.
- No DOM, Three.js, Date, performance or browser dependency.

- [ ] **Step 1: Write failing unit tests first**

Cover at minimum:

```js
import assert from 'node:assert/strict';
import {
  normalizeEpoch, splitEpochDays, epochDaysOf,
  reduceEpochModulo, createAtlasTime
} from '../core/time/atlas-time.mjs';

assert.deepEqual(normalizeEpoch(1, 1.25), {day:2, fraction:0.25});
assert.deepEqual(normalizeEpoch(1, -0.25), {day:0, fraction:0.75});
assert.deepEqual(normalizeEpoch(-2, -0.75), {day:-3, fraction:0.25});

const t=createAtlasTime({epochDays:0.5, rateDaysPerSecond:10, paused:false});
const r0=t.snapshot().revision;
const s1=t.advanceFrame(0.1, {source:'test.frame'});
assert.equal(epochDaysOf(s1),1.5);
assert.equal(s1.revision,r0+1);

t.setPaused(true,{source:'test.pause'});
const frozen=t.snapshot();
t.advanceFrame(10,{source:'test.frame.paused'});
assert.equal(epochDaysOf(t.snapshot()),epochDaysOf(frozen));

const backward=createAtlasTime({epochDays:10,rateDaysPerSecond:-2});
backward.advanceFrame(2,{source:'test.reverse'});
assert.equal(epochDaysOf(backward.snapshot()),6);
```

Also test:
- fractional normalization at exactly `1`, `-1`, near-boundaries;
- `day` remains a safe integer or throws;
- snapshot objects are frozen/immutable;
- one public mutation increments revision exactly once;
- a no-op read does not increment revision;
- transaction changing epoch/rate/pause is atomic and increments revision once;
- restore normalizes input;
- invalid/non-finite rate/delta throws;
- deep positive/negative epochs remain reducible without constructing huge angles.

- [ ] **Step 2: Run RED**

Command:

```bash
node test/unified-atlas-time.test.mjs
```

Expected: `ERR_MODULE_NOT_FOUND` for `core/time/atlas-time.mjs`. Any unrelated failure does not count.

- [ ] **Step 3: Implement minimal kernel**

Required shape:

```js
export const DAY_SECONDS=86400;

export function normalizeEpoch(day,fraction){ /* canonical [0,1) fraction */ }
export function splitEpochDays(epochDays){ /* finite Number -> split */ }
export function epochDaysOf(s){ return s.day+s.fraction; }
export function reduceEpochModulo(s,periodDays,anchorDays=0){ /* modulo-first */ }

export function createAtlasTime(initial={}) {
  let state=/* normalized private state */;
  const commit=(patch,meta)=>/* one normalized revision increment */;
  return Object.freeze({
    snapshot:()=>Object.freeze({...state}),
    setEpoch:(epoch,meta)=>commit({epoch},meta),
    setRate:(rateDaysPerSecond,meta)=>commit({rateDaysPerSecond},meta),
    setPaused:(paused,meta)=>commit({paused:!!paused},meta),
    transact:(patch,meta)=>commit(patch,meta),
    advanceFrame:(realDtSeconds,meta)=>/* advance once unless paused */,
    restore:(snapshot,meta)=>/* explicit authoritative restore */
  });
}
```

Store the authoritative epoch as `day + fraction`; `epochDaysOf` is compatibility only. `advanceFrame` must use `rateDaysPerSecond * realDtSeconds` and normalize. Preserve `source` provenance in snapshots.

- [ ] **Step 4: Run GREEN**

```bash
node test/unified-atlas-time.test.mjs
```

Expected: all assertions PASS with one final `PASS — AtlasTime split-epoch kernel` line.

- [ ] **Step 5: Commit**

Commit message: `feat(time): add split-epoch AtlasTime kernel`.

---

### Task 2: Typed time-domain, adapter and state-scope registries

**Files:**
- Create: `core/time/registry.mjs`
- Modify: `test/unified-atlas-time.test.mjs`

**Interfaces:**
- Produces `TIME_DOMAIN_KIND`, `STATE_SCOPE`, `CLOCK_STATUS`, `TIME_DOMAINS`, `CLOCK_ADAPTERS`, `STATE_SCOPES`, `domainById`, `findClockAdapter`, `canPromoteToAtlasEpoch`, `validateTimeRegistry`.

- [ ] **Step 1: Extend tests before implementation**

Assert exact classification for required reference cases:

```js
assert.equal(domainById('atlas.epoch').kind,'ABSOLUTE_EPOCH');
assert.equal(domainById('relativity.proper_time').kind,'PHYSICAL_LOCAL_TIME');
assert.equal(domainById('ks.regularizer_s').kind,'PARAMETRIZATION_TIME');
assert.equal(domainById('mixmaster.tau').kind,'PARAMETRIZATION_TIME');
assert.equal(domainById('standard_map.iteration').kind,'ITERATION_INDEX');
assert.equal(domainById('anderson.site').kind,'SPATIAL_INDEX');
assert.equal(domainById('render.monotonic').kind,'RENDER_TIME');
assert.equal(canPromoteToAtlasEpoch('atlas.epoch'),true);
assert.equal(canPromoteToAtlasEpoch('relativity.proper_time'),false);
assert.equal(canPromoteToAtlasEpoch('standard_map.iteration'),false);
assert.equal(findClockAdapter('anderson.site','atlas.epoch').status,'NO_EXCHANGE');
```

Include the historically measured Lorenz/Poincare exchange as `STATISTICAL` with explicit mean-return-time provenance; it must not be represented as exact one-iteration = one-fixed-duration.

- [ ] **Step 2: Run RED**

```bash
node test/unified-atlas-time.test.mjs
```

Expected: missing registry module/exports.

- [ ] **Step 3: Implement frozen registries**

Kinds are exactly:
- `ABSOLUTE_EPOCH`
- `DERIVED_PERIODIC_PHASE`
- `PHYSICAL_LOCAL_TIME`
- `PARAMETRIZATION_TIME`
- `ITERATION_INDEX`
- `SPATIAL_INDEX`
- `RENDER_TIME`

State scopes are exactly:
- `GLOBAL_PHYSICS`
- `SHARED_PHYSICS`
- `LAB_LOCAL`
- `VIEW_ONLY`

Every adapter declares source, target, units, mapping kind (`EXACT`, `NUMERICAL`, `MODEL_DEPENDENT`, `STATISTICAL`, `NO_EXCHANGE`), validity, invertibility and provenance. `findClockAdapter` must fail closed with a stable `NO_EXCHANGE` object.

- [ ] **Step 4: Validate registry self-consistency**

`validateTimeRegistry()` rejects duplicate ids, undeclared endpoint ids, illegal promotion flags and adapters with missing units/provenance.

- [ ] **Step 5: Run GREEN and commit**

```bash
node test/unified-atlas-time.test.mjs
```

Commit: `feat(time): type Atlas clocks and state scopes`.

---

### Task 3: Repository-level RED verifier for browser integration

**Files:**
- Create: `docs/verify-unified-atlas-time.cjs`
- Modify: `package.json`

**Interfaces:**
- Reads `index.html`, `version.json`, `core/time/*.mjs`, browser/API artifacts.
- Produces deterministic CI failure until the Time Fabric runtime is integrated.

- [ ] **Step 1: Create failing verifier**

Initial assertions:
1. Browser imports/uses `createAtlasTime` and the time registry.
2. Runtime contains one stable marker `HCC_TIME_FABRIC_SCHEMA='hcc.time-fabric/1'`.
3. `atlasTime` is instantiated exactly once.
4. Root frame loop contains exactly one authoritative `advanceFrame` call.
5. Existing compatibility values are projected from the authority, not independently advanced.
6. `updateCyc`/Saros/galactic/linked-cycle consumers are tied to the shared frame snapshot or Atlas epoch projection.
7. Navigation history does not restore epoch/rate/pause.
8. Isolated compatibility functions exist and promotion calls `canPromoteToAtlasEpoch`.
9. `Reset Motion` does not write epoch/rate/pause.
10. Runtime exposes a read-only Time Fabric diagnostic surface.
11. `api/time-fabric.json` exists and declares all seven time-domain kinds and all four state scopes.
12. v4.152 release identity is eventually required only in the final release task; keep those assertions disabled until Task 10.

Static forbidden-pattern scan must classify or reject:
- direct `state.epochDays +=`;
- direct authoritative `state.epochDays =` outside compatibility initialization/adapter;
- direct `state.daysPerSec =` and `state.paused =` outside the adapter;
- scientific private absolute-date accumulators;
- `Date.now()` as a continuing simulation driver;
- navigation payload keys `epochDays`, `daysPerSec`, `paused`.

Do not use anonymous regex exclusions. Every accepted occurrence must have a named classification/allowlist reason.

- [ ] **Step 2: Add verifier to local source test path**

Append `&& node docs/verify-unified-atlas-time.cjs` to `test:source`. `scripts/ci.mjs` already auto-runs all `docs/verify-*.cjs`; keep both paths.

- [ ] **Step 3: Run RED**

```bash
node docs/verify-unified-atlas-time.cjs
```

Expected: failure specifically because browser Time Fabric markers/integration do not yet exist.

- [ ] **Step 4: Commit RED gate**

Commit: `test(time): define unified Atlas time integration gate`.

---

### Task 4: Deterministic browser patcher and authoritative compatibility bridge

**Files:**
- Create: `scripts/patch-v41520-time-fabric.cjs`
- Modify via patcher: `index.html`
- Modify: `docs/verify-unified-atlas-time.cjs`

**Interfaces:**
- Consumes existing `state.epochDays`, `state.daysPerSec`, `state.paused`, root animation loop and existing mode handlers.
- Produces one browser-owned `atlasTime`, one frame snapshot, mutation wrappers and compatibility projections.

- [ ] **Step 1: Encode idempotent patcher before touching index manually**

Follow `scripts/patch-v41511-linked-cycles.cjs` conventions:

```js
function replaceExact(before,after,label){ /* require exactly one */ }
function replaceOrRequire(before,after,required,label){ /* idempotent */ }
```

Use a permanent marker `// HCC v4.152 Unified Atlas Time Fabric`. Running the patcher twice must either make no change on the second pass or verify the already-patched state and exit 0.

- [ ] **Step 2: Add browser imports/initialization**

At the module runtime boundary import the pure kernel/registry. Instantiate from the existing initial epoch/rate/pause once:

```js
const atlasTime=createAtlasTime({
  epochDays: initialEpochDays,
  rateDaysPerSecond: initialDaysPerSec,
  paused: initialPaused,
  source:'atlas.init'
});
let atlasFrameTime=atlasTime.snapshot();
```

The real UTC header may continue using wall time for display. It must not feed `atlasTime` after init.

- [ ] **Step 3: Add narrow mutation bridge**

Browser handlers call only stable wrappers such as:

```js
function setAtlasEpoch(epochDays,source){ return atlasTime.setEpoch(epochDays,{source}); }
function setAtlasRate(rate,source){ return atlasTime.setRate(rate,{source}); }
function setAtlasPaused(paused,source){ return atlasTime.setPaused(paused,{source}); }
function atlasTimeSnapshot(){ return atlasFrameTime; }
```

Expose compatibility getters for existing read paths. Do not leave mutable duplicate storage once all writes are migrated.

- [ ] **Step 4: Advance exactly once at root frame boundary**

Use measured/clamped render `dt` once:

```js
atlasFrameTime=atlasTime.advanceFrame(dt,{source:'frame.root'});
```

All world/lab updates in that frame read `atlasFrameTime`; none calls `advanceFrame` itself. Camera/XR/render easing retains monotonic frame time separately.

- [ ] **Step 5: Apply patch and run focused checks**

```bash
node scripts/patch-v41520-time-fabric.cjs
node test/unified-atlas-time.test.mjs
node docs/verify-unified-atlas-time.cjs
```

Expected: pure tests PASS; verifier advances but may remain RED for navigation/isolation/API clauses scheduled later. It must no longer fail on single-authority/root-frame clauses.

- [ ] **Step 6: Commit**

Commit: `feat(time): install browser AtlasTime authority`.

---

### Task 5: Migrate all global time mutations and cross-model epoch consumers

**Files:**
- Modify via patcher: `index.html`
- Modify: `scripts/patch-v41520-time-fabric.cjs`
- Modify: `docs/verify-unified-atlas-time.cjs`

**Interfaces:**
- Converts every absolute date/rate/pause control into a transaction against the shared authority.
- Preserves local model clocks that are not absolute epoch.

- [ ] **Step 1: Expand verifier to inventory all time writes before migration**

Audit exact current occurrences in the checkout using:

```bash
rg -n "epochDays|daysPerSec|paused|Date\.now\(|performance\.now\(|\+=\s*dt|setInterval|requestAnimationFrame" index.html
```

Classify every occurrence as one of:
- AtlasTime authority/mutation;
- absolute-epoch consumer;
- typed local/model clock;
- render-only clock;
- wall UTC display;
- forbidden/unclassified.

The verifier fails on every `forbidden/unclassified` occurrence.

- [ ] **Step 2: Migrate authoritative controls**

Redirect at minimum:
- Solar date/time picker;
- Cycles date/time picker;
- event/eclipses jump-to-time actions;
- global speed/tempo controls that alter physical days per second;
- pause/resume controls;
- phase-lock actions that deliberately move global epoch;
- restore/reset paths that currently write epoch.

Use atomic `atlasTime.transact(...)` for multi-field operations so one user action increments revision once.

- [ ] **Step 3: Migrate known cross-model consumers**

Make these derive from the same Atlas revision:
- planetary/solar ephemeris;
- Moon and Earth display epoch;
- Cycles;
- Saros;
- Antikythera cycle pointers;
- precession/seasonal orientation where epoch anchored;
- galactic-year phase;
- eclipse/prediction observatory;
- v4.151 linked cycle resonance.

Periodic consumers call `reduceEpochModulo` or an equivalent split/reduced helper before angle construction.

- [ ] **Step 4: Preserve scientifically distinct clocks**

Do **not** migrate KS `s`, Mixmaster `tau`, standard-map iteration, Lorenz flow parameter, proper time or Anderson site into AtlasTime. Register/label them and connect only through declared adapters.

- [ ] **Step 5: Verify one revision feeds all consumers**

Add a runtime diagnostic object that publishes each registered epoch-linked consumer's last observed `revision`. A self-test must assert all active epoch-linked consumers report the current frame revision after update.

- [ ] **Step 6: Run GREEN for authority/write audit**

```bash
node test/unified-atlas-time.test.mjs
node docs/verify-unified-atlas-time.cjs
```

Commit: `feat(time): phase-lock Atlas models to one epoch`.

---

### Task 6: Persistent state scopes and navigation that never rewinds physics

**Files:**
- Modify: `core/time/registry.mjs`
- Modify via patcher: `index.html`
- Modify: `scripts/patch-v41520-time-fabric.cjs`
- Modify: `docs/verify-unified-atlas-time.cjs`

**Interfaces:**
- Adds root-owned GLOBAL_PHYSICS/SHARED_PHYSICS state persistence, per-lab LAB_LOCAL persistence, and VIEW_ONLY navigation history.

- [ ] **Step 1: Write failing navigation/state-scope tests first**

Add pure registry tests and browser/source assertions for:
- epoch/rate/pause are `GLOBAL_PHYSICS`;
- declared linked physical parameters are `SHARED_PHYSICS`;
- lab experiment state can be `LAB_LOCAL`;
- camera/selection/panel layout are `VIEW_ONLY`;
- navigation history payloads contain no GLOBAL_PHYSICS keys;
- mutable physical controls without a scope are rejected.

- [ ] **Step 2: Build the state-scope resolver from existing metadata**

Reuse current first-principles parameter role/link registries where possible. Add explicit overrides for mode-level controls. There must be no catch-all that silently labels unknown physics as `VIEW_ONLY`; unknown mutable physical state fails closed as `UNDECLARED_SCOPE` during audit.

- [ ] **Step 3: Move navigation history to view-only semantics**

World/lab entry/Back logic may preserve:
- camera position/quaternion/target;
- selection;
- panel/layout/render state;
- route context.

It must not capture/restore:
- epoch;
- rate/direction;
- pause;
- globally linked physical parameter values.

- [ ] **Step 4: Persist LAB_LOCAL across leaving/re-entering**

Use a stable per-lab store keyed by lab id. Leaving a lab captures only declared LAB_LOCAL state. Re-entry restores it without publishing to unrelated labs.

- [ ] **Step 5: Fix Reset Motion semantics**

Retain existing `STATE0`-driven animation reset for local/presentation motion but explicitly exclude GLOBAL_PHYSICS and SHARED_PHYSICS unless the UI action is an explicit scientific snapshot restore.

- [ ] **Step 6: Runtime self-test**

Sequence:
1. Set non-default epoch/rate.
2. Enter Cycles.
3. Enter an S3 lab.
4. Mutate LAB_LOCAL state.
5. Back/enter another world.
6. Return.

Assert global epoch/rate/revision remained continuous and LAB_LOCAL restored only in its owner lab.

- [ ] **Step 7: Commit**

Commit: `feat(state): persist Atlas physics across navigation`.

---

### Task 7: Unified / Isolated compatibility mode

**Files:**
- Modify via patcher: `index.html`
- Modify: `scripts/patch-v41520-time-fabric.cjs`
- Modify: `docs/verify-unified-atlas-time.cjs`
- Modify: `test/unified-atlas-time.test.mjs`

**Interfaces:**
- Produces `isolateLabTime`, `rejoinUnifiedTime`, `activeTimeForLab`, `promoteIsolatedEpoch` and per-lab isolation state.

- [ ] **Step 1: Write RED tests**

Required behavior:
- entering Isolated snapshots mapped local time/state;
- local isolated progression does not increment global revision;
- global AtlasTime may continue independently;
- leaving and returning to an isolated lab preserves its local isolated state;
- Rejoin Unified discards local epoch authority and snaps to current Atlas revision;
- promotion is allowed only for ABSOLUTE_EPOCH domains;
- proper time, parameterization time, iteration and spatial index promotion throws/rejects;
- isolation cannot mutate SHARED_PHYSICS outside that lab.

- [ ] **Step 2: Implement per-lab isolation store**

Keep isolation outside AtlasTime:

```js
const timeIsolation=new Map();
// labId -> {active, domainId, localSnapshot, localRate, revisionAtFork}
```

`activeTimeForLab` returns the global frame snapshot in Unified mode and the local snapshot in Isolated mode. There is never a second global authority.

- [ ] **Step 3: Implement explicit promotion safely**

`promoteIsolatedEpoch(labId)` must:
1. validate active isolated state;
2. validate `canPromoteToAtlasEpoch(domainId)`;
3. perform one `atlasTime.setEpoch(...,{source:'isolation.promote:<lab>'})`;
4. rejoin or remain isolated according to the UI contract, but never silently merge two progressing clocks.

- [ ] **Step 4: Add compatibility UI control only to time-aware labs**

Compact `Unified / Isolated` status/control; clearly mark local state. Do not duplicate global date/speed controls.

- [ ] **Step 5: Run tests and commit**

```bash
node test/unified-atlas-time.test.mjs
node docs/verify-unified-atlas-time.cjs
```

Commit: `feat(time): add isolated legacy compatibility mode`.

---

### Task 8: Scientific snapshot/restore and Time Fabric inspector

**Files:**
- Modify via patcher: `index.html`
- Modify: `scripts/patch-v41520-time-fabric.cjs`
- Modify: `docs/verify-unified-atlas-time.cjs`

**Interfaces:**
- Produces explicit scientific snapshot capture/restore and compact Time Fabric status surface.

- [ ] **Step 1: Write RED verifier assertions**

Assert the runtime has distinct operations for:
- Pause Atlas;
- Reset Motion;
- Capture scientific snapshot;
- Restore scientific snapshot.

Restore must be provenance-labelled and increment AtlasTime revision exactly once.

- [ ] **Step 2: Implement scientific snapshots**

Snapshot payload:

```js
{
  schema:'hcc.atlas-snapshot/1',
  globalPhysics:{...},
  sharedPhysics:{...},
  labLocal: includeLabLocal ? {...} : undefined,
  capturedAt:{epoch,revision}
}
```

Keep VIEW_ONLY state separate. `restoreAtlasSnapshot` validates schema, applies scientific scopes atomically, records `snapshot.restore` provenance, then all consumers recompute from the restored revision.

- [ ] **Step 3: Add compact Time Fabric status surface**

Display only:
- shared simulation date/J2000-relative epoch;
- signed rate;
- pause;
- revision;
- active lab `Unified`/`Isolated`;
- active time-domain kind;
- active adapter status or `NO EXCHANGE`.

Use existing premium Atlas typography/panel grammar. No heavy dashboard and no extra permanent animation.

- [ ] **Step 4: Verify reduced motion/mobile/XR**

Inspector must be safe-area aware, not allocate per-frame DOM, and not affect XR pose/camera updates while physical time is paused.

- [ ] **Step 5: Commit**

Commit: `feat(time): add scientific snapshots and time inspector`.

---

### Task 9: Agent/API Time Fabric contract

**Files:**
- Create: `scripts/build-time-fabric-manifest.mjs`
- Create/generated: `api/time-fabric.json`
- Modify: `scripts/build-api.mjs` and/or `scripts/build-manifest.mjs` at the established extension point
- Modify: `api/index.html`
- Modify: `api/openapi.json` if current static endpoint documentation is generated there
- Modify: `docs/verify-unified-atlas-time.cjs`

**Interfaces:**
- Static endpoint documents the clock/state schema.
- Live browser HCC API exposes current epoch/revision/rate/pause/isolation and supported mutation operations.

- [ ] **Step 1: Write RED API assertions**

Assert `api/time-fabric.json` contains:
- schema/version;
- seven time-domain kinds;
- four state scopes;
- registered domains/adapters;
- explicit `NO_EXCHANGE` semantics;
- promotion eligibility;
- source/provenance fields;
- static-vs-live distinction.

- [ ] **Step 2: Build static manifest deterministically from `core/time/registry.mjs`**

Do not duplicate registry data by hand. The static JSON describes contracts, not the current runtime date of an arbitrary user's browser session.

- [ ] **Step 3: Expose live runtime surface**

Through the existing `HCC_API`/diagnostic ecosystem expose read-only current:
- Atlas epoch and revision;
- rate/pause;
- active lab isolation;
- active time-domain/adapter;
- supported authoritative mutations with required provenance.

Mutation methods must route through AtlasTime; no API direct state assignment.

- [ ] **Step 4: Determinism test**

Run builder twice and compare bytes:

```bash
node scripts/build-time-fabric-manifest.mjs
cp api/time-fabric.json /tmp/time-fabric-1.json
node scripts/build-time-fabric-manifest.mjs
cmp /tmp/time-fabric-1.json api/time-fabric.json
```

Expected: byte-identical.

- [ ] **Step 5: Commit**

Commit: `feat(api): publish Atlas Time Fabric contract`.

---

### Task 10: Deep-time, refresh-rate and cross-model regression matrix

**Files:**
- Modify: `test/unified-atlas-time.test.mjs`
- Modify: `docs/verify-unified-atlas-time.cjs`
- Modify via patcher: `index.html` self-tests if needed

**Interfaces:**
- Proves the architecture rather than only checking markers.

- [ ] **Step 1: Add deterministic refresh-rate equivalence**

From identical initial state/rate:
- advance 60 frames at `1/60 s`;
- advance 120 frames at `1/120 s`.

Compare split epoch; expected equal to numerical tolerance defined by the split arithmetic, with identical derived periodic phase.

Repeat for reverse time.

- [ ] **Step 2: Add deep-time tests**

Test at least ±1 Myr and ±1 Gyr J2000-relative equivalents for periodic reduction. Compare a phase computed by split/modulo helper against an independently reduced reference. Do not claim the underlying physical model is empirically valid at those epochs; this test is numerical stability only.

- [ ] **Step 3: Add cross-model revision test**

At a selected epoch, query/inspect Solar, Cycles/Saros, Antikythera/chronometry projection, precession/galactic consumer and linked-cycle view. Every epoch-linked consumer must report the same Atlas revision.

- [ ] **Step 4: Add pause/XR/render separation test**

When AtlasTime is paused:
- epoch is invariant;
- render monotonic time may advance;
- camera/XR input path remains live;
- no scientific consumer revision changes from frame passage alone.

- [ ] **Step 5: Add navigation/isolation matrix**

Exercise Unified -> switch worlds -> isolate lab -> global continues -> return -> rejoin -> snapshot -> restore. Assert no implicit epoch restore and no untyped promotion.

- [ ] **Step 6: Run full non-release suite**

```bash
node test/unified-atlas-time.test.mjs
node docs/verify-unified-atlas-time.cjs
npm run test:source
node scripts/ci.mjs
```

Expected: all existing and new verifiers PASS before version bump.

- [ ] **Step 7: Commit**

Commit: `test(time): prove global synchronization invariants`.

---

### Task 11: Release identity, generated artifacts and release notes

**Files:**
- Modify: `version.json`
- Modify via patcher: `index.html` version/build constants and document build markers
- Modify: `package.json` only if final test wiring changed
- Create: `docs/RELEASE_4.152.md`
- Regenerate as required: `core/atlas/extracted.mjs`, `core/atlas/extracted.manifest.json`, `api/manifest.json`, `api/fingerprint.json`, `api/openapi.json`, `api/time-fabric.json`
- Modify: `docs/verify-unified-atlas-time.cjs` to enable final identity assertions

- [ ] **Step 1: Enable release identity assertions first**

Require exact agreement:
- `4.152.0`;
- `unified-atlas-time-2026.09.06.1`;
- `version.json`, HTML build marker/meta and JS release constants agree;
- validator's anti-drift rules still pass.

Expected: RED while repo still identifies as 4.151.1.

- [ ] **Step 2: Apply release identity**

Update only after Tasks 1–10 are green.

- [ ] **Step 3: Write release notes**

`docs/RELEASE_4.152.md` must state precisely:
- one authoritative Atlas epoch;
- persistent physics across navigation;
- typed non-exchangeable clocks;
- Isolated compatibility semantics;
- split-epoch/deep-time hardening;
- scientific snapshot/restore;
- Time Fabric inspector/API;
- verification coverage and any explicit limitations.

Do not claim all local model parameters are synchronized to calendar time; state the typed-clock rule.

- [ ] **Step 4: Regenerate established artifacts**

Use existing project scripts rather than hand-edit generated outputs. At minimum run the builders required by current release workflow; if `scripts/ci.mjs` or Actions regenerates an artifact, compare generated diff rather than editing it manually.

- [ ] **Step 5: Run final local verification**

```bash
node scripts/patch-v41520-time-fabric.cjs
node test/unified-atlas-time.test.mjs
node docs/verify-unified-atlas-time.cjs
npm run test:release
node scripts/ci.mjs
git diff --check
```

Expected: all PASS; second patcher run is idempotent; no whitespace errors.

- [ ] **Step 6: Commit release candidate**

Commit: `release: HCC 4.152.0 unified Atlas time fabric`.

---

### Task 12: PR, independent review, merge and GitHub Pages verification

**Files:** none unless review discovers defects.

- [ ] **Step 1: Execute implementation on a feature branch**

Create `feat/unified-atlas-time-4.152` from the approved design/plan tip. Do not implement on `main` and do not rewrite the design branch after implementation begins.

- [ ] **Step 2: Compare against current main before PR**

Verify main has not moved unexpectedly. If it has, rebase/merge current main deliberately and rerun the complete suite; never overwrite concurrent agent work.

- [ ] **Step 3: Open PR to `main`**

PR body must enumerate:
- architecture and state ownership;
- exact time-domain types;
- migrated consumers;
- isolation semantics;
- deep-time/refresh-rate evidence;
- commands/checks run;
- release identity.

- [ ] **Step 4: Independent diff review**

Inspect changed-file list and full diff. Explicitly search for:
- accidental second epoch authorities;
- direct mutable compatibility fields;
- global time hidden in navigation snapshots;
- frame-time/physical-time mixing;
- Isolated code capable of changing global state without promotion guard;
- generated artifact drift;
- visual/mobile/XR regression risks.

Fix findings, rerun full verification and update PR.

- [ ] **Step 5: Require green GitHub Actions**

At minimum require the repository's current Validate atlas/computational checks and Pages build/deploy path to succeed for the PR/head SHA. Do not infer success from an older SHA.

- [ ] **Step 6: Merge only the verified head SHA**

Merge without force-moving `main`. Record resulting main SHA.

- [ ] **Step 7: Verify post-merge deployment**

Check workflows attached to the merge SHA and confirm GitHub Pages serves the new build/version. Re-fetch `version.json` from `main` and confirm `4.152.0 / unified-atlas-time-2026.09.06.1`.

- [ ] **Step 8: Final scientific smoke audit**

On deployed Atlas verify:
1. Change date/rate in Solar.
2. Enter Cycles/Saros and confirm same time/revision.
3. Enter S3/lab and return; time did not rewind.
4. Pause Atlas; camera/UI remain responsive.
5. Isolate one time-aware lab; global time is unaffected.
6. Rejoin; lab snaps to current global epoch.
7. A non-exchangeable local clock displays `NO EXCHANGE`, not a fabricated calendar conversion.

Only after these checks may v4.152.0 be called released.

---

## Completion definition

The release is complete only when all of the following are true simultaneously:

- `AtlasTime` is the sole absolute simulation epoch authority in Unified mode.
- Every absolute-time mutation enters through its mutation API.
- One root frame advances it exactly once.
- Solar/Cycles/Saros/Antikythera-facing cycles/precession/galactic/prediction/linked-cycle consumers are demonstrably tied to one Atlas revision where physically applicable.
- Typed local/model clocks remain distinct and return `NO_EXCHANGE` where no justified mapping exists.
- GLOBAL_PHYSICS and SHARED_PHYSICS survive world/lab navigation.
- LAB_LOCAL survives returning to its owner without leaking globally.
- VIEW_ONLY history cannot rewind scientific state.
- Isolated compatibility cannot become a second global authority.
- Reset Motion cannot rewind AtlasTime; explicit snapshot restore can.
- Split/modulo-first arithmetic passes deep-time numerical tests.
- 60/120 Hz integration equivalence and pause/render separation pass.
- Static and live API surfaces expose the same time-domain/state-scope contract.
- All existing tests/verifiers remain green.
- PR head, merge SHA and Pages deployment are independently verified.
