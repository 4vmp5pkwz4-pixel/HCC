#!/usr/bin/env node
/*
  Fast change-aware validation for ordinary HCC development.

  The full scientific audit still exists in test:source / test:release and the manual
  Computational core workflow. This runner keeps the default feedback loop light:
  three repository-wide structural invariants always run, then only verifiers whose
  subsystem is touched by the current diff are added.

  No browser, Playwright, liveness walk, Docker build or full verifier census belongs
  on this path.
*/
import { spawn, spawnSync } from 'node:child_process';

const ROOT = new URL('..', import.meta.url).pathname;
const jobs = new Map();
const add = (label, command, args=[]) => jobs.set([command, ...args].join('\0'), { label, command, args });

add('CI policy', 'node', ['scripts/verify-ci-policy.mjs']);
add('generated kernel/source agreement', 'node', ['scripts/extract-kernels.mjs', '--check']);
add('static Atlas validator', 'node', ['scripts/validate.mjs']);

function git(args) {
  const r = spawnSync('git', args, { cwd: ROOT, encoding: 'utf8' });
  return r.status === 0 ? r.stdout : '';
}

const files = git(['diff', '--name-only', 'HEAD^', 'HEAD'])
  .split(/\r?\n/).map(s => s.trim()).filter(Boolean);
const patch = git(['diff', '--unified=0', 'HEAD^', 'HEAD']);
const signal = (files.join('\n') + '\n' + patch).toLowerCase();

function touch(re, specs) {
  if (!re.test(signal)) return;
  for (const [label, file] of specs) add(label, 'node', [file]);
}

/* If a verifier itself changes, prove that changed assertion immediately. */
for (const file of files) {
  if (/^docs\/verify-[\w.-]+\.(?:cjs|mjs)$/.test(file)) {
    add(`changed verifier: ${file}`, 'node', [file]);
  }
}

/* Small, explicit scientific impact neighborhoods. The diff text matters because most
   runtime work still lives in index.html; file-level routing alone would treat every
   one-line Atlas edit as a change to the whole universe. */
touch(/\b(poin|poinsot|dzhanib|euler[ -]?top|poinomega|poinsolve|polhode|herpolhode)\b/, [
  ['Poinsot phase family', 'docs/verify-poinsot-phase-family.cjs'],
  ['momentum-map / reconstruction contract', 'docs/verify-momentum-map-unification.cjs'],
]);
touch(/\b(camera|setcontroldistancelimits|scale_seams|hcc_zoom|far[- ]?plane|near[- ]?plane|seam)\b/, [
  ['camera contract', 'docs/verify-the-camera.cjs'],
  ['scale continuity', 'docs/verify-scale-continuity.cjs'],
  ['observer seam', 'docs/verify-the-seam-lands-at-the-observer.cjs'],
  ['no black void past final structure', 'docs/verify-no-void-past-the-last-structure.cjs'],
]);
touch(/\b(time machine|atlastime|setatlastime|setatlasepoch|epochdays|chronometr)\b/, [
  ['Time Machine', 'docs/verify-the-time-machine.cjs'],
  ['chronometry contract', 'docs/verify-chronometry-atlas-contract.cjs'],
  ['chronometry visual semantics', 'docs/verify-chronometry-visual-contract.cjs'],
]);
touch(/\b(cycle|cycframe|cycpair|resonance|multiphase)\b/, [
  ['linked Cycles views', 'docs/verify-linked-cycle-views.cjs'],
  ['Cycles ordering', 'docs/verify-cycles-are-ordered.cjs'],
  ['Cycles frames', 'docs/verify-cycles-frames-are-uniform.cjs'],
  ['resonance semantics', 'docs/verify-resonance-is-surprising.cjs'],
]);
touch(/\b(solar|planet|orbit|kuiper|oort|neptune|asteroid|atmosphere)\b/, [
  ['Solar multiphase control', 'docs/verify-multiphase-solar-control.cjs'],
  ['Sun', 'docs/verify-the-sun.cjs'],
  ['planetary atmospheres', 'docs/verify-planetary-atmospheres.cjs'],
  ['orbital speed', 'docs/verify-the-orbit-carries-its-speed.cjs'],
  ['belt structure', 'docs/verify-the-belt-has-gaps.cjs'],
  ['Neptune-to-cloud continuity', 'docs/verify-between-neptune-and-the-cloud.cjs'],
]);
touch(/\b(hopf|bloch|spin|momentum map|reeb|contact form)\b/, [
  ['Hopf bundle', 'docs/verify-hopf-bundle.cjs'],
  ['momentum-map unification', 'docs/verify-momentum-map-unification.cjs'],
]);
touch(/\b(hcc_s3r|conditional reconstruction|shell tomography|s3 radius|s³ radius|omega_k)\b/, [
  ['conditional reconstruction', 'docs/verify-the-conditional-reconstruction.cjs'],
  ['shell tomography', 'docs/verify-shell-tomography.cjs'],
  ['one length authority', 'docs/verify-one-length-one-authority.cjs'],
]);
touch(/\b(quantity bus|quantity-bus|typed refusal|instrument|api\/manifest|reach\.json|agent-client|forecast-audit|mcp)\b/, [
  ['bus readers', 'docs/verify-bus-readers.cjs'],
  ['visible refusals', 'docs/verify-refusals-are-visible.cjs'],
  ['global inventory', 'docs/verify-the-global-inventory.cjs'],
  ['self-description authority', 'docs/verify-self-description-authority.mjs'],
]);

if (/\b(api\/|server\/|agent|reach|mcp|forecast)\b/.test(signal)) {
  add('agent API tests', 'node', ['--test', 'test/forecast-audit.test.mjs', 'test/agent-client.test.mjs']);
}

/* Repository-wide refactors deserve more local coverage, but still not the 50-minute
   browser/liveness release audit. The full audit remains an explicit action. */
if (files.length > 20 || patch.length > 250000) {
  for (const [label, file] of [
    ['world/lab routing', 'docs/verify-world-lab-routing.cjs'],
    ['global inventory', 'docs/verify-the-global-inventory.cjs'],
    ['controls act where declared', 'docs/verify-controls-where-they-act.cjs'],
    ['formula addresses', 'docs/verify-every-formula-has-an-address.cjs'],
    ['self-description authority', 'docs/verify-self-description-authority.mjs'],
  ]) add(label, 'node', [file]);
}

const selected = [...jobs.values()];
console.log(`Quick validation: ${selected.length} independent checks${files.length ? ` for ${files.length} changed file(s)` : ''}.`);

function run({ label, command, args }) {
  return new Promise(resolve => {
    const child = spawn(command, args, { cwd: ROOT, stdio: ['ignore', 'pipe', 'pipe'] });
    let out = '', err = '';
    child.stdout.on('data', d => { out += d; });
    child.stderr.on('data', d => { err += d; });
    child.on('close', code => resolve({ label, code: code ?? 1, out, err }));
    child.on('error', error => resolve({ label, code: 1, out, err: err + '\n' + error.message }));
  });
}

const results = await Promise.all(selected.map(run));
let failed = 0;
for (const r of results) {
  if (r.code === 0) {
    console.log(`  PASS — ${r.label}`);
  } else {
    failed += 1;
    console.error(`  FAIL — ${r.label}`);
    const detail = (r.out + '\n' + r.err).trim();
    if (detail) console.error(detail.slice(-5000));
  }
}

if (failed) {
  console.error(`\nQuick validation BLOCKED — ${failed} check(s) failed.\n`);
  process.exit(1);
}
console.log('\nQuick validation GREEN. Full scientific/release audits remain available explicitly.\n');
