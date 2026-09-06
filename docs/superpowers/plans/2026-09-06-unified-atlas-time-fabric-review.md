# Unified Atlas Time Fabric Plan Review

The approved implementation plan at `docs/superpowers/plans/2026-09-06-unified-atlas-time-fabric.md` was reviewed against `docs/superpowers/specs/2026-09-06-unified-atlas-time-fabric-design.md` before execution.

## Coverage

The plan covers the single AtlasTime authority, split epoch arithmetic, one-frame/one-snapshot semantics, typed time domains, explicit clock adapters and `NO_EXCHANGE`, persistent GLOBAL_PHYSICS/SHARED_PHYSICS/LAB_LOCAL/VIEW_ONLY scopes, navigation persistence, Unified/Isolated compatibility, scientific snapshot/restore, deep-time precision, UI diagnostics, API/manifest export, refresh-rate/XR separation, release identity, PR review and post-merge Pages verification.

## Execution clarifications

1. The existing integration bus currently derives a universal shared time as `state.epochDays * 86400` and can synchronize same-dimension time quantities. v4.152 must remove this dimensional-equality shortcut. Only explicitly declared clock adapters may exchange time-like values.
2. `core/version.mjs` remains independently versioned at the current computational-core version unless the computational contract itself changes; the visual Atlas release bump to 4.152.0 does not automatically bump core version.
3. Because this execution environment has no local repository checkout/worktree, implementation is isolated on a dedicated GitHub feature branch. Verification evidence must come from repository tests executed by GitHub Actions for the exact feature SHA; no local-test claim is permitted.
4. Generated files such as `core/atlas/extracted.mjs` are never hand-edited. If source changes require regeneration, only repository builders may produce them.
5. The plan's abbreviated code-shape comments are interface sketches, not permission to leave partial implementations. Production commits must contain complete functions and must satisfy the RED/GREEN gates defined by the plan.

## Type consistency

Canonical names used throughout execution are:

- service: `createAtlasTime`
- split epoch: `{ day, fraction }`
- frame mutation: `advanceFrame(realDtSeconds, meta)`
- compatibility projection: `epochDaysOf(snapshot)`
- domain lookup: `domainById(id)`
- adapter lookup: `findClockAdapter(sourceId, targetId)`
- promotion guard: `canPromoteToAtlasEpoch(domainId)`
- isolation: `isolateLabTime`, `rejoinUnifiedTime`, `activeTimeForLab`, `promoteIsolatedEpoch`
- time-domain failure: `NO_EXCHANGE`

No alternative names should be introduced during implementation without updating the plan and verifiers together.
