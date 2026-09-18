#!/usr/bin/env node
import { availableParallelism } from 'node:os';
import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';

const checks = [
  "docs/verify-linked-cycle-views.cjs",
  "docs/verify-multiphase-solar-control.cjs",
  "docs/verify-scale-continuity.cjs",
  "docs/verify-semantic-reconciliation-stage1.cjs",
  "docs/verify-semantic-reconciliation-stage2.cjs",
  "docs/verify-world-lab-routing.cjs",
  "docs/verify-chronometry-atlas-contract.cjs",
  "docs/verify-chronometry-visual-contract.cjs",
  "docs/verify-bus-readers.cjs",
  "docs/verify-galactic-butterfly-explorer.cjs",
  "docs/verify-agent-connections.cjs",
  "docs/verify-refusals-are-visible.cjs",
  "docs/verify-agent-measurements.cjs",
  "docs/verify-nexus-carries-every-kind.cjs",
  "docs/verify-source-reader.cjs",
  "docs/verify-wheels-of-time.cjs",
  "docs/verify-cycles-are-ordered.cjs",
  "docs/verify-cycles-frames-are-uniform.cjs",
  "docs/verify-resonance-is-surprising.cjs",
  "docs/verify-bus-publications-are-routable.cjs",
  "docs/verify-quantity-kinds-are-counted.cjs",
  "docs/verify-unit-fields-hold-units.cjs",
  "docs/verify-galaxies-are-placed.cjs",
  "docs/verify-one-length-one-authority.cjs",
  "docs/verify-local-group-timing.cjs",
  "docs/verify-local-flow.cjs",
  "docs/verify-shell-tomography.cjs",
  "docs/verify-unit-vocabulary.cjs",
  "docs/verify-one-coordinate-one-spelling.cjs",
  "docs/verify-starlight.cjs",
  "docs/verify-no-void-past-the-last-structure.cjs",
  "docs/verify-hopf-bundle.cjs",
  "docs/verify-the-sun.cjs",
  "docs/verify-planetary-atmospheres.cjs",
  "docs/verify-the-camera.cjs",
  "docs/verify-riding-the-photon.cjs",
  "docs/verify-harmonices-mundi.cjs",
  "docs/verify-the-ladder-is-not-a-law.cjs",
  "docs/verify-the-galaxy-is-an-integral.cjs",
  "docs/verify-the-seam-lands-at-the-observer.cjs",
  "docs/verify-the-orbit-carries-its-speed.cjs",
  "docs/verify-free-flight.cjs",
  "docs/verify-the-holographic-palette.cjs",
  "docs/verify-dimension-space.cjs",
  "docs/verify-twenty-nine-directions.cjs",
  "docs/verify-the-blast-wave.cjs",
  "docs/verify-the-solvers-own-diffusion.cjs",
  "docs/verify-the-scaling-bench.cjs",
  "docs/verify-the-conditional-reconstruction.cjs",
  "docs/verify-the-global-inventory.cjs",
  "docs/verify-controls-where-they-act.cjs",
  "docs/verify-every-formula-has-an-address.cjs",
  "docs/verify-one-galaxy-one-model.cjs",
  "docs/verify-a-stage-that-shows-everything.cjs",
  "docs/verify-a-framing-is-not-a-gesture.cjs",
  "docs/verify-the-time-machine.cjs",
  "docs/verify-poinsot-phase-family.cjs",
  "docs/verify-the-belt-has-gaps.cjs",
  "docs/verify-every-object-can-be-asked.cjs",
  "docs/verify-a-touch-target-is-two-dimensional.cjs",
  "docs/verify-between-neptune-and-the-cloud.cjs",
  "docs/verify-self-description-authority.mjs"
];
checks.push({ args: ['--test', 'test/forecast-audit.test.mjs', 'test/agent-client.test.mjs'], label: 'agent unit tests' });

const jobs = checks.map((entry) => typeof entry === 'string'
  ? { args: [entry], label: entry }
  : entry);

const missing = jobs
  .filter((job) => job.args.length === 1 && !existsSync(job.args[0]))
  .map((job) => job.args[0]);
if (missing.length) {
  console.error('Quick verifier list contains missing files:', missing.join(', '));
  process.exit(1);
}

const requested = Number.parseInt(process.env.HCC_CI_WORKERS || '', 10);
const cpu = typeof availableParallelism === 'function' ? availableParallelism() : 4;
const concurrency = Math.max(1, Math.min(Number.isFinite(requested) ? requested : 8, cpu, jobs.length));
const started = Date.now();
let cursor = 0;
const results = new Array(jobs.length);

function runOne(job, index) {
  return new Promise((resolve) => {
    const t0 = Date.now();
    const child = spawn(process.execPath, job.args, {
      cwd: process.cwd(),
      env: process.env,
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    let out = '', err = '';
    child.stdout.on('data', (chunk) => { out += chunk; });
    child.stderr.on('data', (chunk) => { err += chunk; });
    child.on('close', (code, signal) => {
      results[index] = {
        ...job,
        code: code ?? 1,
        signal,
        ms: Date.now() - t0,
        output: out + err,
      };
      resolve();
    });
  });
}

async function worker() {
  while (true) {
    const index = cursor++;
    if (index >= jobs.length) return;
    await runOne(jobs[index], index);
  }
}

await Promise.all(Array.from({ length: concurrency }, worker));

let failed = 0;
for (const result of results) {
  const ok = result.code === 0;
  if (!ok) failed += 1;
  console.log(`${ok ? 'PASS' : 'FAIL'} · ${(result.ms / 1000).toFixed(2)}s · ${result.label}`);
  if (!ok) {
    const text = result.output.trim();
    if (text) console.log(text);
  }
}

console.log(`Quick verifier pool: ${jobs.length} checks · ${concurrency} workers · ${((Date.now()-started)/1000).toFixed(2)}s wall time`);
if (failed) process.exit(1);
