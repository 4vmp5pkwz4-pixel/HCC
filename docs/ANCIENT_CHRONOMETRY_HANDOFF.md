# Ancient Chronometry Observatory — Parallel-Agent Handoff

## Why this branch exists

Another agent was actively modifying HCC while the Ancient Chronometry work was designed. To avoid overwriting or creating conflicts in the monolithic atlas UI and generated artifacts, this work is isolated on:

`agent/ancient-chronometry-observatory`

Branch base:

`f6e2e6fb98de89494d5aecad74f0094e6dd11c83`

That was `main` / HCC 4.147.0 when the branch was created. At the final Phase-A check on 2026-09-05, `main` was still at the same SHA.

## What is already implemented in Phase A

### Design and execution contract

- `docs/superpowers/specs/2026-09-05-ancient-chronometry-observatory-design.md`
- `docs/superpowers/plans/2026-09-05-ancient-chronometry-phase-a.md`

### Pure source-locked kernel

- `core/labs/chronometry.source_locked.mjs`

Implemented behavior:

- normalized BigInt rational arithmetic;
- exact decimal presentation without binary floating-point in the textual identity layer;
- exact day-based calibration transforms;
- validation of source-qualified unit records;
- same-name / different-definition conflict detection;
- exact source-chain multiplication;
- symbolic Jain avasarpini closure:
  - `4K`
  - `3K`
  - `2K`
  - `K - 42000 years`
  - `21000 years`
  - `21000 years`
  - exact sum `10K`;
- explicit dependency marker `42000 = 2 × 21000`, therefore not independent evidence;
- calendar profiles with explicit refusal of an unspecified year-to-SI conversion;
- bounded period-ratio scan with default cap 12;
- explicit opt-in required above harmonic 12;
- typed relation firewall that checks quantity/provenance before numerical residual;
- rejection of a numerical identity where a physical quantity identity is absent;
- phase-consistency cannot be awarded without an independent phase anchor.

### Source registries

- `docs/data/ancient-chronometry-sources.json`
  - Abhidharmakosa kṣaṇa source profile;
  - Bhagavata kṣaṇa source profile;
  - Arthasastra truṭi source profile;
  - Bhagavata truṭi source profile;
  - Siddhantasiromani truṭi source profile.

These records intentionally expose conflicts rather than averaging same-named units.

- `docs/data/ancient-astronomy-benchmarks.json`
  - Aryabhata sidereal rotation ratio;
  - Aryabhata sidereal lunar period;
  - Daming tropical-year rational;
  - Daming synodic-month rational;
  - Shoushi tropical-year rational;
  - Shoushi synodic-month rational.

Every astronomy record remains `PENDING_EPOCH_CORRECTION`. No J2000 proximity has been promoted to an epoch-corrected historical match.

### Independent verifiers

- `docs/verify-chronometry-source-locked.cjs`
- `docs/verify-chronometry-falsification.cjs`
- `docs/verify-ancient-astronomy-benchmarks.cjs`

The development sequence was test-first: each new behavior was first exercised against a missing function/file, then minimally implemented and rerun green.

## Phase-A verification commands

Run from repository root after checking out this branch:

```bash
node docs/verify-chronometry-source-locked.cjs
node docs/verify-chronometry-falsification.cjs
node docs/verify-ancient-astronomy-benchmarks.cjs
```

Expected terminal lines:

```text
PASS — exact rational/calibration and source conflict kernel
PASS — chronometry falsification firewall
PASS — 6 source-locked ancient astronomy benchmarks remain pending epoch correction
```

## Files intentionally NOT touched

Do not interpret their absence as unfinished accidental work. They are deliberately deferred until the concurrent agent lands:

- `index.html`
- `version.json`
- `api/manifest.json`
- `api/openapi.json`
- `api/open-problems.json`
- `api/reach.json`
- `api/sensitivity.json`
- `api/transfers.json`
- `api/liveness.json`
- generated agent reports
- global atlas navigation/registry entries
- `core/atlas/extracted.mjs`
- any release counts derived from the whole repository

The reason is conflict containment: these files are shared/global and many are generated from the current atlas state.

## Required Phase-B procedure after the concurrent agent lands

1. Read the new `main` HEAD. Do not assume the old registry/UI shape survived.
2. Compare `f6e2e6fb98de89494d5aecad74f0094e6dd11c83..NEW_MAIN` and identify every change to shared/global files.
3. Bring Phase A onto the new base by rebase/cherry-pick/merge as appropriate; resolve only new-file path collisions unless the other agent independently created an ancient-chronometry subsystem.
4. Run the three Phase-A verifiers before touching UI. If any fail, stop integration and fix the semantic conflict first.
5. Read the current `docs/AGENTS.md` and `SCIENTIFIC_CONTRACT.md` from NEW_MAIN; newer contracts override assumptions in this handoff.
6. Integrate a live route in the current Cycles architecture. Do not paste a stale registry fragment from 4.147.0.
7. Reuse the atlas's current continued-fraction / commensurability authority. The Phase-A bounded scanner is a falsification/test primitive, not permission to create a competing global engine.
8. Add the source-space / science-space visual station only after the scientific data path is wired and testable without rendering.
9. Register the laboratory at every current enforced site discovered from NEW_MAIN, not a hard-coded old count.
10. Re-run extraction only if the integrated UI introduces extractable authority in `index.html`; ensure `core/atlas/extracted.mjs` is generated from the final source, never hand-edited to imitate it.
11. Regenerate all repository artifacts from the final merged source using the current scripts.
12. Perform exactly one version bump after both agents' work is reconciled; do not bump this Phase-A branch independently.
13. Run every new verifier plus `node scripts/ci.mjs` and the repository's current test command.
14. Inspect resulting generated diffs for unexpected count/status changes.
15. Never resolve a scientific-content conflict by choosing the number with the smaller residual. Provenance, definition, epoch and uncertainty decide admissibility.

## Scientific non-negotiables for the integrator

- `kṣaṇa`, `truṭi`, `paramāṇu`, `yojana`, etc. are source-qualified terms, not universal units.
- SI values derived from a day, a body measure, a yojana, or another historical anchor must preserve the transformation and its uncertainty.
- Same-name conflicts remain visible.
- Ancient astronomy comparing the same observable may be evaluated for measurement accuracy; cross-domain numerical proximity is a weaker class.
- Aryabhata, Daming and Shoushi bootstrap values are not yet `EPOCH_CORRECTED_MATCH`.
- Jain `21000 years ↔ terrestrial climatic precession` remains a hypothesis until calendar, epoch, phase and look-elsewhere controls are applied.
- Jain `42000 ↔ obliquity` is dependent evidence because the Jain 42000 is structurally `2 × 21000` in the encoded closure.
- `paramāṇu ↔ atom/electron/Planck length`, `truṭi ↔ Planck/atomic time`, `kṣaṇa ↔ neural oscillation`, giant kalpa ↔ Earth/Universe age are not admitted identities on numerical proximity.

## Recommended Phase-B target

Provisional route (adapt to current navigation architecture):

`#/world/cyc/lab/chronometry`

Suggested stations:

- `source`
- `jain`
- `abhidharma`
- `indic`
- `kalachakra`
- `china`
- `astronomy`
- `scale`
- `correspondence`
- `falsification`

Do not create all stations merely to satisfy this list if the current atlas architecture has evolved. Preserve the scientific boundaries, not the historical UI sketch.

## Stop conditions

Pause Phase B rather than guessing if:

- NEW_MAIN introduces a competing chronometry/unit registry;
- the commensurability authority has changed semantics;
- a source datum cannot be traced to its cited textual definition;
- epoch correction requires a model not present or not defensibly implementable in HCC;
- a generated artifact disagrees with the source after regeneration;
- a candidate match only survives by tuning a historical anchor or expanding the harmonic search after seeing the result.

The correct outcome may be `UNKNOWN` or `REJECTED`. That is a successful scientific result.
