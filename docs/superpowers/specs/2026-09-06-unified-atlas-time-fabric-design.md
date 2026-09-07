# HCC v4.152.0 — Unified Atlas Time Fabric

## Goal
Turn the Atlas from a collection of partially linked clocks into one persistent scientific machine with a single authoritative absolute simulation epoch wherever an absolute epoch is physically meaningful, while preserving mathematically distinct local time parameters as explicitly typed clocks rather than falsely identifying them with calendar time.

The user-visible invariant is simple: if the reader changes the epoch, direction, rate, pause state, reference frame or another declared global/shared physical parameter in one world, then navigates to another world or laboratory, the change is still in force. Navigation changes the view; it does not silently rewind the machine.

## Release identity
- Target: `4.152.0`
- Build: `unified-atlas-time-2026.09.06.1`
- Base: `main@41b83887f5d4a57466b297ee3d0f0d84ae073f15` (`4.151.1`)
- Release class: architectural state/time unification

## Existing evidence this design must preserve
The present Atlas already contains several correct pieces of the intended architecture:

1. `state.epochDays` is already the shared epoch for major Solar/Cycles paths.
2. Galactic motion is driven from the same simulated epoch as planetary motion.
3. The Saros engine was corrected in v4.149.1 to derive from the shared Atlas epoch instead of accumulating an independent pulse.
4. Linked Cycle Views in v4.151.1 derive linked visual phases from the shared epoch rather than a private `+= dt` accumulator.
5. `STATE0` already defines a startup snapshot across animated state, and the shared Tempo instrument already reaches mode-level clocks outside S³.
6. Prior frame-lock fixes established the rule that overlays, cameras and rendered bodies must consume one displayed epoch rather than independently sampling time.

This release generalizes those successful local fixes into an enforced global contract.

## Non-negotiable scientific rules
1. There is exactly one authority for absolute simulation epoch in Unified mode.
2. A laboratory may not create a second absolute epoch by integrating `dt`, reading `Date.now()` after initialization, or retaining a private date accumulator.
3. Proper time, coordinate time, regularization parameters, map iterations, lattice indices and other model parameters are not relabelled as calendar time merely because they are commonly denoted by `t`, `τ` or `s`.
4. A conversion between two clocks exists only when the model declares a physically or mathematically justified map. Unknown exchange rates fail closed as `NO_EXCHANGE`.
5. Rendering/frame time is not scientific time. Camera easing, XR pose updates, inertial interaction and cosmetic animation continue to use monotonic wall/frame time and never advance physical epoch.
6. Navigation restores view state only. It must never implicitly restore a historical global epoch, pause state, rate, direction or shared physical parameter.
7. Reset/restore operations that change global physics are explicit, named and inspectable.
8. Deep-time phase calculations reduce arguments before trigonometric evaluation; no scientific phase is computed from a huge unreduced angle.
9. Mobile/XR performance adaptations may reduce visual density but cannot change the Time Fabric semantics, solver time, event ordering or exported epoch.
10. Legacy behavior remains available only as an isolated compatibility mode; it is never a second global source of truth.

## 1. AtlasTime: the single absolute-time authority
Introduce one first-class `AtlasTime` service owned above all worlds and laboratories.

Its authoritative state is:

- `day`: exact safe integer number of simulation days relative to J2000;
- `fraction`: normalized fractional day in `[0,1)`;
- `rateDaysPerSecond`: signed physical simulation rate;
- `paused`: global physical pause flag;
- `revision`: monotonic integer incremented on every authoritative mutation;
- `source`: stable mutation provenance such as `solar.date-picker`, `cycles.jump`, `api.setEpoch`, `snapshot.restore`;
- `mode`: `unified` globally; per-laboratory isolation is tracked separately and never changes the global authority.

The split `day + fraction` representation replaces a single ever-growing floating-point accumulator as the authority. A compatibility getter may expose `epochDays = day + fraction` where existing formulas require a Number, but consumers that need high deep-time precision must use reduced-period or split-time helpers.

J2000-relative simulation days are a model coordinate, not an overclaim about historical UTC/TT outside the interval where those civil/atomic standards are defined. Civil-calendar controls are adapters onto this coordinate. The real UTC clock in the header remains a display of wall time and is never the continuing source of simulation time after initialization.

## 2. One frame, one time snapshot
At the start of each animation frame, the root loop samples one immutable Time Fabric snapshot:

- authoritative epoch;
- elapsed physical delta for this frame;
- rate/pause/revision;
- a monotonic rendering timestamp kept separately.

Every world and laboratory updated during that frame receives the same snapshot. No subsystem is allowed to call the authoritative advance function a second time inside the frame.

This eliminates refresh-rate-dependent double advancement and guarantees that a 60 Hz display, a 120 Hz iPhone and an XR headset see the same physical state at the same Atlas revision.

## 3. Time-domain registry
Every time-like variable relevant to the Atlas is classified in a registry. The registry is machine-readable and exported for agents.

### A. `ABSOLUTE_EPOCH`
A date on the shared Atlas timeline. Examples: Solar-system ephemeris epoch, Cycles epoch, eclipse predictor epoch, Saros/Antikythera pointers, precession orientation, galactic phase when it is explicitly referenced to the same epoch.

Rule: consumes `AtlasTime`; never integrates privately.

### B. `DERIVED_PERIODIC_PHASE`
A phase determined by the absolute epoch and a declared period/anchor:

`phase = reduce(epoch - anchor, period) / period`.

Examples: synodic phase, Saros phase, Metonic phase, seasons, galactic year, Carrington rotation where modeled from epoch.

Rule: phase is derived, not stored as an independent scientific clock.

### C. `PHYSICAL_LOCAL_TIME`
A genuine model time that is not globally identical to the Atlas epoch. Examples include coordinate time and proper time in relativity, or another physically defined local clock.

Rule: a typed adapter may expose `AtlasTime -> local time` or a relation between two local clocks only when the model declares the transformation and its domain.

### D. `PARAMETRIZATION_TIME`
An evolution parameter whose numerical value depends on a gauge/regularization/parameterization choice. Examples: Mixmaster volume time `τ` and KS regularization parameter `s`.

Rule: never displayed as the same quantity as the global epoch. If a model supplies `dt/dτ` or `dt/ds`, the adapter declares it and the UI labels the relation as parameterization-dependent.

### E. `ITERATION_INDEX`
A discrete map step, kick count, solver iteration or similar index.

Rule: not a physical duration unless a separately declared exchange rate exists. Standard-map `iteration` therefore cannot be silently compared to seconds.

### F. `SPATIAL_INDEX`
A lattice/site/transfer index that may share rate-like notation with a time exponent but is not time at all.

Rule: `NO_EXCHANGE` with physical clocks unless the model explicitly introduces a propagation law.

### G. `RENDER_TIME`
Monotonic browser/XR frame time used for camera easing, pointer dynamics, decorative breathing/pulsing and other non-scientific animation.

Rule: cannot publish onto the scientific time bus and cannot change `AtlasTime`.

The registry must make these distinctions visible in the inspector and API so an agent cannot infer equivalence from symbol spelling alone.

## 4. Typed clock adapters and `NO_EXCHANGE`
A clock adapter is a declaration, not a heuristic. Each adapter states:

- source time-domain id;
- target time-domain id;
- transformation or derivative/exchange rule;
- units;
- validity domain;
- whether the transformation is exact, numerical, model-dependent or externally calibrated;
- invertibility, if any;
- source/provenance;
- residual or verification method when measurable.

If no adapter exists, the Atlas returns `NO_EXCHANGE` rather than guessing.

Examples:
- Atlas epoch -> Saros phase: exact modulo of the derived Saros period used by the Cycles mechanism.
- Atlas epoch -> galactic orbital phase: epoch reduced modulo the declared galactic year before angle construction.
- coordinate time -> proper time: model-defined relation in the relativity laboratory, not a global identity.
- Lorenz flow time <-> Poincaré-map iteration: exchangeable through the measured mean return time already established by the clock-exchange work, explicitly statistical rather than one-to-one per iteration.
- Anderson lattice site -> seconds: `NO_EXCHANGE`.

## 5. Persistent state scopes
Time unification is only useful if navigation no longer erases the machine state. Every mutable value receives one of four scopes.

### `GLOBAL_PHYSICS`
Owned by the Atlas root and persistent across every world/laboratory transition.

Required members include:
- Atlas epoch;
- global rate, direction and pause;
- declared global reference-frame choices where the same physical interpretation is intended across connected models;
- future global physical controls explicitly registered at this scope.

### `SHARED_PHYSICS`
A physical parameter intentionally shared by a declared subset of laboratories through the existing linked-parameter/quantity infrastructure.

A change survives navigation and is seen by all registered consumers. A value is not promoted to this scope merely because two labs use the same symbol or unit.

### `LAB_LOCAL`
A laboratory's experiment-specific state. It persists when leaving and returning to that laboratory during the session, but it does not silently drive unrelated models.

### `VIEW_ONLY`
Camera, selected object, panel layout, rendering toggles and other presentation state. Navigation history may restore this scope without changing physics.

The registry is authoritative. Any mutable control without an explicit scope fails the new state-scope audit.

## 6. Navigation semantics
Navigation is redefined as a view transition over one continuing machine.

### Enter another world/laboratory
Preserve `GLOBAL_PHYSICS` and `SHARED_PHYSICS` exactly. Load the target's persisted `LAB_LOCAL` state and its view state.

### Back / Return to Atlas
Restore prior camera, selection and presentation context only. Do not restore the epoch captured when the prior view was opened.

This intentionally changes the older “return to exact camera, scale and epoch” behavior: exact camera/scale remains valid, but epoch restoration is removed from ordinary navigation because it contradicts a unified machine.

### Explicit historical restore
If the reader wants an older physical state, they invoke `Restore snapshot`, which is visibly a physics mutation and increments `AtlasTime.revision`.

## 7. Unified / Isolated compatibility switch
Preserve a compatibility route without maintaining two global architectures.

Each time-aware laboratory exposes a status:
- `Unified` — default. Absolute-time inputs read/write `AtlasTime` and all declared shared state remains connected.
- `Isolated` — diagnostic compatibility mode. On entry, the laboratory receives a local snapshot of the mapped time/state it needs. Local legacy progression may then operate without mutating the global Time Fabric.

Isolation rules:
1. Global Atlas time may continue running independently unless globally paused.
2. Isolated changes are visually marked as local.
3. Leaving and returning to the isolated lab preserves its isolated local state for the session.
4. `Rejoin Unified` discards the isolated clock as authority and immediately resynchronizes the laboratory to the current Atlas revision.
5. For an `ABSOLUTE_EPOCH` laboratory only, an explicit `Set Atlas to isolated epoch` action may promote that local absolute epoch to the global authority. This is never automatic and is unavailable for proper time, parameterization time or iteration indices.
6. Isolation cannot change shared parameters outside the isolated laboratory unless the reader explicitly exits isolation.

This provides a controlled A/B diagnostic of legacy behavior without reintroducing clock drift into the live Atlas.

## 8. Snapshot and reset semantics
Separate four operations that were previously easy to conflate.

### `Pause Atlas`
Stops only physical Atlas time advancement. Render/XR/camera time continues.

### `Reset Motion`
Retains the existing broad animated-state reset behavior for local oscillators and presentation motion. It must not silently set a historical global epoch unless the UI explicitly says so.

### `Snapshot`
Captures:
- `GLOBAL_PHYSICS`;
- `SHARED_PHYSICS`;
- optionally all `LAB_LOCAL` states;
- metadata containing Atlas revision and capture epoch.

View state is stored separately so scientific snapshots remain meaningful without a camera.

### `Restore snapshot`
An explicit global mutation. It restores the selected scientific scopes, increments revision and records provenance. All open/next-entered models then recompute from that restored state.

## 9. Mutation API and transaction discipline
All authoritative global mutations pass through one narrow API rather than direct property writes.

Conceptual operations:
- set absolute epoch;
- advance by physical delta;
- set rate;
- set paused state;
- apply a global/shared transaction;
- restore a snapshot.

A multi-field operation such as “jump to eclipse, slow rate, pause/unpause policy” commits atomically under one revision so consumers never observe a half-updated state.

The mutation record contains source and revision for diagnostics. This is not intended as an unbounded event log; only a small recent diagnostic ring is needed.

## 10. Compatibility surface
During migration, existing consumers may continue reading compatibility values such as `state.epochDays`, `state.daysPerSec` and `state.paused`, but these become projections of `AtlasTime`, not independent storage.

Direct writes to compatibility fields are forbidden after migration. Existing handlers are redirected to Time Fabric mutation methods.

A build-time audit searches for forbidden patterns including:
- private absolute epoch `+= dt` accumulation;
- direct authoritative `state.epochDays = ...` outside the Time Fabric adapter;
- `Date.now()` used as a continuing simulation driver outside wall-clock/init code;
- mode/lab entry code resetting global epoch/rate/pause;
- navigation stack objects restoring global epoch implicitly;
- scientific phase accumulators that can be derived from epoch and a declared period.

False positives may be resolved only by classifying the variable in the time-domain registry, not by adding anonymous exclusions.

## 11. Deep-time numerical precision
The release must preserve the Atlas's existing deep-time hardening and extend it.

Rules:
1. Store epoch as integer day plus fractional day.
2. Normalize after every mutation.
3. For periodic phenomena, reduce integer/fractional epoch against the period before converting to an angle.
4. Do not subtract two huge floating values when a reduced or split representation can be used.
5. Keep existing model validity windows separate from numerical stability. A numerically stable extrapolation is still labelled outside the empirical model domain.
6. Tests cover forward and reverse rates, deep positive and negative epochs, and transitions across the fractional-day normalization boundary.

## 12. UI and inspector
Add one compact Time Fabric status surface rather than duplicating controls in every mode.

It shows:
- current shared simulation date/epoch;
- signed rate and pause state;
- Time Fabric revision;
- `Unified` or `Isolated` status for the active lab;
- active time-domain classification;
- adapter/exchange relation when the active laboratory uses a local clock;
- `NO EXCHANGE` when no justified mapping exists.

Existing per-world date/rate controls remain useful, but in Unified mode they are alternate controls for the same global authority. Changing the Solar date picker must update the Cycles/Saros/chronometry state immediately, and vice versa.

The UI must never suggest that changing camera motion changes physical time.

## 13. Agent/API surface
Expose a machine-readable time contract through the existing HCC API/manifest ecosystem.

Minimum exported information:
- current Atlas epoch and revision;
- rate/pause;
- time-domain registry;
- state-scope registry;
- clock adapters and `NO_EXCHANGE` relationships;
- active laboratory isolation status;
- supported authoritative mutations with provenance fields.

Agents can therefore ask “what clock does this output use?” and “can this clock be converted to the Atlas epoch?” without reverse-engineering UI code.

## 14. Verification strategy
Add an independent verifier `docs/verify-unified-atlas-time.cjs` and browser/runtime assertions. The release is not complete unless all of the following classes pass.

### Authority tests
- exactly one absolute epoch authority exists in Unified mode;
- forbidden direct global epoch writes are absent;
- a single frame advances the epoch exactly once;
- pause and signed rate are globally consistent.

### Navigation persistence tests
- set epoch/rate in Solar -> enter Cycles -> enter S³ lab -> return: epoch/rate/revision remain continuous;
- Back restores camera/selection but not an earlier epoch;
- shared physical parameter mutations survive world/lab changes;
- `LAB_LOCAL` values survive leaving and returning without leaking to unrelated labs.

### Cross-model synchronization tests
At one chosen epoch, independently query at least Solar, Cycles/Saros, Antikythera/chronometry-facing projections and the galactic-phase consumer. Each must report a value derived from the same Atlas revision.

### Compatibility/isolation tests
- entering Isolated snapshots local time without moving global time;
- isolated progression cannot mutate Atlas revision;
- rejoining snaps to the current global epoch;
- explicit promotion is allowed only for absolute-epoch labs;
- proper/parameterization/iteration clocks cannot be promoted as global epoch.

### Type-safety tests
- proper time is not classified as absolute epoch;
- KS `s`, Mixmaster `τ`, standard-map iteration and lattice site are not silently exchangeable with seconds;
- declared clock adapters include units, domain and provenance;
- missing adapters return `NO_EXCHANGE`.

### Deep-time tests
- periodic phase continuity at extreme positive/negative epochs;
- no non-finite positions/phases produced solely by time representation;
- forward then reverse by an equal duration returns to the same split epoch within fractional normalization tolerance;
- 60/120 Hz frame schedules produce the same physical epoch for the same elapsed wall duration and rate.

### XR/render separation tests
- XR/camera frame updates continue while Atlas physical time is paused;
- render-time animation cannot increment Atlas revision;
- entering/exiting XR does not change epoch, rate or pause.

### Existing release gates
The final implementation must keep all current gates green:
- `npm test`
- `npm run test:release`
- `npm run validate`
- the in-browser self-test suite and zero-page-error walk used by current releases
- generated artifact consistency, version/build consistency and GitHub Pages deployment verification.

The new verifier is added to the standard/release gate so later work cannot reintroduce private clocks unnoticed.

## 15. Expected implementation surface
The implementation plan should remain focused on the Time Fabric and avoid unrelated refactoring. Expected files/components are:

- `index.html` — root Time Fabric, adapters, navigation semantics, UI projection, migration of existing handlers/consumers;
- `docs/verify-unified-atlas-time.cjs` — independent structural/numerical contract verifier;
- `package.json` — release-gate registration;
- manifest/API generation inputs or scripts only where needed to expose the time-domain/state-scope contracts;
- generated API/manifest artifacts regenerated by the existing pipeline;
- `version.json` and document build/version markers at release time;
- release notes describing the behavioral change in Back/Return and isolation mode.

No broad laboratory rewrite is permitted unless the audit proves that a laboratory contains an unauthorized absolute-time accumulator or navigation reset.

## 16. Acceptance criteria
v4.152.0 is accepted only when all of the following are true:

1. One authoritative Atlas epoch controls every absolute-time model in Unified mode.
2. Changing time in any Unified absolute-time view is immediately observable from all other absolute-time views without manual resynchronization.
3. World/laboratory navigation never resets global scientific state.
4. Back/Return restores view context but does not rewind physics.
5. Every time-like variable encountered by the audit has a declared time-domain class.
6. Every mutable control encountered by the audit has a declared state scope.
7. Distinct local clocks remain scientifically distinct and expose only justified conversions.
8. `NO_EXCHANGE` is explicit wherever a conversion is not available.
9. Isolated compatibility mode can reproduce/debug local behavior without becoming a second global clock.
10. Deep-time phase precision is at least as strong as 4.151.1 and does not depend on display refresh rate.
11. XR/camera/render animation remains responsive under global physical pause without modifying scientific time.
12. Existing scientific validators, release validators, browser self-tests and Pages deployment remain green.
13. The published `version.json`, document build marker and deployed Pages SHA all identify the same 4.152.0 release.

## 17. Failure policy
If a laboratory cannot be safely mapped to the global epoch, the release does not fake a mapping. It remains typed as local/parameterized/iterative and reports `NO_EXCHANGE` until a defensible adapter is supplied.

If a legacy local absolute-time path disagrees with the unified result, the discrepancy is treated as a defect to investigate, not averaged or hidden behind interpolation.

If unification reveals that a current navigation feature depends on restoring historical global epoch, that feature is rewritten to restore view state only. Preserving machine continuity has priority over preserving an accidental reset behavior.
