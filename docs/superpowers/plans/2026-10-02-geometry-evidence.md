# Geometry evidence implementation plan

> Execute inline with superpowers:executing-plans; user has authorized integration.

**Goal:** Make verified weekly research actionable throughout HCC.
**Architecture:** Shared pure ESM numerical kernel and catalogue; a global dialog calls the same functions as the API and server kernel.
**Tech stack:** Native ESM, SVG, Node test runner, Playwright.
**Spec:** docs/superpowers/specs/2026-10-02-geometry-evidence-design.md

## Global constraints
Explicit units, covariance and assumptions; no automatic global radius/clock mutation; no duplicated likelihood terms; no invented data or confidence. EN/RU/DE UI. No additional dependencies.

## Review focus
Near-flat numerical cancellation; closed antipodes; overlapping DESI results; missing or singular covariance; mobile keyboard and focus restoration.

### Task 1: Numerical evidence
- [x] Write and run failing tests in test/geometry-evidence.test.mjs.
- [x] Implement core/research/geometry.mjs: flrw, geometryAudit, curvatureDiagnostic, constantCurvatureFit, scalarMode, lensingKernel, delensingResidual.
- [x] Implement core/research/catalog.mjs with verified sources, published summaries and seven world mappings.
- [x] Run node --test test/geometry-evidence.test.mjs; expect all passing.

### Task 2: Interactive integration
- [x] Implement visual/geometry-evidence.mjs and CSS: geometry chart, DESI covariance contours, null-test import, modes, lensing, source filters, live links and JSON export.
- [x] Import/mount in index.html; expose HCC_API.research and a contextual control link.
- [x] Add cosmology.geometry_audit server lab using shared kernel, hash all new scientific files.
- [x] Add browser behavior tests; run desktop and narrow portrait with local pinned Three.js.

### Task 3: Release
- [x] Bump synchronized release identities, regenerate API discovery/manifest, add catalogue to static SDK documentation.
- [x] Run numerical/browser tests, npm test, extraction guard and affected verifiers.
- [ ] Review diff, commit, push PR; merge under existing user authorization when checks pass; verify Pages publication.

Verification: 13 numerical/SDK tests; real atlas desktop 1280 and portrait 390, both WebGL and render=0; npm test GREEN; regenerated extraction guard. Independent review fixes: isolate comparison/lensing refusals, preserve focus, refuse numerically singular GLS outputs.
