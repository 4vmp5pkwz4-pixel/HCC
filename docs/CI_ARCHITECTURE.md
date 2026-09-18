# CI architecture

HCC validation has three intentionally different costs.

## 1. Pull-request fast gate

Purpose: answer quickly whether the changed subsystem is coherent enough to merge.

Always checks:
- CI policy;
- generated-physics drift against `index.html`;
- static validation;
- self-description authority.

Then it runs:
- every verifier changed by the PR;
- invariant sentinels for high-risk shared subsystems detected in the `index.html` diff (camera/seams, Atlas time, Poinsot/Euler top, linked cycles, multiphase Solar);
- agent/API tests only when those paths change.

An `index.html` change without a changed `docs/verify-*` contract is refused. This makes the author name the invariant being preserved instead of paying for every unrelated laboratory.

## 2. Main-branch source audit

Every push to `main` runs the complete existing source suite. It is no longer a prerequisite that every small PR wait for all unrelated laboratory contracts before merging.

## 3. Manual computational-core audit

`.github/workflows/core.yml` remains manual-only. It contains the expensive browser/liveness/container work and is for release-level or deliberate deep audits, not ordinary editing.

## Principle

Do not weaken a scientific check to make CI faster. Reduce latency by scoping when a check runs, while keeping the deep audit available and preserving fail-closed source-of-truth guards.
