# Visual Kernel Implementation Plan

> **For agentic workers:** Use superpowers:executing-plans for inline execution.

**Goal:** Audit and implement the supplied modernization with correct mathematics,
persistent GPU resources and an explicit renderer compatibility boundary.
**Architecture:** Browser ESM compute modules under visual/gpu, pure geometry in
core/math, and narrow integration changes in index.html.
**Tech Stack:** JavaScript ESM, WGSL, GLSL, Node tests and Playwright.
**Spec:** docs/superpowers/specs/2026-10-01-visual-kernel-design.md

## Global Constraints

- Three.js 0.160 WebGL rendering and existing XR fallback remain supported.
- GPU Hadwiger covers V2/V3 only; CPU remains authoritative.
- Atlas orbit diagnostics use AU/yr; no mutual gravity.
- S³ radius is explicit and no cosmological topology detection is claimed.
- No unmeasured hardware speedup is reported as fact.

## Review Focus

Saturated staging rings reject explicitly. Pending mappings tolerate destruction.
Repeated dispatches observe their own uniforms. Pole clipping agrees across
rendering and picking. Disabled/unavailable GPU keeps the CPU/browser APIs usable.

### Task 1: Persistent compute engines

Files: visual/gpu/hadwiger-reduction.mjs, visual/gpu/asteroid-compute.mjs,
visual/gpu/asteroid-reference.mjs, test/visual-kernel.test.mjs,
test/visual-gpu.browser.mjs, index.html.
Produces: HadwigerReductionEngine.computeMesh(P,I)/reduce(data,count),
AsteroidComputeEngine.step(params)/snapshot(), packAsteroidUniforms and verletStep.

- [x] Write failing uniform/count and Verlet convergence tests; run node tests.
- [x] Implement persistent buffers, complete reduction, lifecycle and submission.
- [x] Connect Hadwiger and explicit asteroid diagnostics to FBS3R_QA.
- [x] Execute actual WGSL against large/shrinking/concurrent fixtures when supported.
- [x] Commit after node and available GPU checks pass.

### Task 2: S³ projection and shader correctness

Files: core/math/s3-geometry.mjs/.d.mts, visual/shaders/s3-multiview.mjs,
test/s3-geometry.test.mjs, index.html.
Produces: s3RotateSpin4(point,left,right), s3StereographicDifferential(point,tangent,R),
S3_MULTIVIEW_VERTEX and inspectS3Multiview(gl).

- [x] Write failing rotation/isometry/differential tests and run them.
- [x] Implement geometry functions and tangent-based multiview normals.
- [x] Connect compact/stereographic UI to labels, picking and shaders.
- [x] Check pure tests, trisphere verifier and browser states; commit.

### Task 3: Raymarching audit and completion

Files: index.html, package.json, docs/visual-kernel-audit.md.

- [x] Add browser coverage for horizon/degenerate rays and shader compilation.
- [x] Correct horizon guards, descending smoothstep and integrator descriptions.
- [x] Regenerate extracted kernels and run npm test, test:source, test:agent,
  new node tests and available GPU/browser tests.
- [x] Record measured results and migration boundaries; commit and review.
- [ ] Prepare GitHub PR with actual validation evidence.
