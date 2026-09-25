#!/usr/bin/env node
/*
  HCC verifier router.

  Default mode is change-aware: keep ordinary development fast by running a small
  permanent smoke set plus only the scientific/structural verifiers implicated by
  the current diff. Set HCC_VERIFY_ALL=1 for the complete source verifier census.

  Heavy rendered self-tests, liveness and Docker remain in the manual Computational
  core workflow; they are deliberately not part of either path here.
*/
import { availableParallelism } from 'node:os';
import { spawn, spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';

const allChecks = [
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
  "docs/verify-camera-limit-authority.cjs",
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
  "docs/verify-time-domain-passport.cjs",
  "docs/verify-poinsot-phase-family.cjs",
  "docs/verify-the-belt-has-gaps.cjs",
  "docs/verify-every-object-can-be-asked.cjs",
  "docs/verify-everything-says-what-it-is.cjs",
  "docs/verify-a-touch-target-is-two-dimensional.cjs",
  "docs/verify-the-phone-is-one-stack.cjs",
  "docs/verify-between-neptune-and-the-cloud.cjs",
  "docs/verify-the-curl-shells-of-the-round-sphere.cjs",
  "docs/verify-the-torus-that-solves-completely.cjs",
  "docs/verify-where-the-curvature-enters.cjs",
  "docs/verify-no-finite-sector-can-hold-it.cjs",
  "docs/verify-the-sphere-had-only-half-a-spectrum.cjs",
  "docs/verify-the-chiral-law.cjs",
  "docs/verify-the-paired-hopf-lock.cjs",
  "docs/verify-the-zodiac-has-depth.cjs",
  "docs/verify-a-star-is-a-point.cjs",
  "docs/verify-no-star-in-the-oort-cloud.cjs",
  "docs/verify-the-phone-keeps-its-scene.cjs",
  "docs/verify-the-arms-have-their-stars.cjs",
  "docs/verify-every-object-opens-its-pictures.cjs",
  "docs/verify-the-giant-structures-are-made-of-galaxies.cjs",
  "docs/verify-the-earth-stands-true.cjs",
  "docs/verify-the-sky-turns-with-the-day.cjs",
  "docs/verify-the-light-has-its-sources.cjs",
  "docs/verify-the-measured-universe-on-the-ladder.cjs",
  "docs/verify-every-object-has-its-rung.cjs",
  "docs/verify-the-labs-read-the-atlas.cjs",
  "docs/verify-what-the-catalogues-say.cjs",
  "docs/verify-every-laboratory-has-its-parameter-space.cjs",
  "docs/verify-every-laboratory-keeps-its-invariants.cjs",
  "docs/verify-the-atlas-of-invariants.cjs",
  "docs/verify-the-nexus-is-a-structure.cjs",
  "docs/verify-the-hierarchy-of-every-invariant.cjs",
  "docs/verify-the-endpoint-on-trial.cjs",
  "docs/verify-every-laboratory-obeys-its-laws.cjs",
  "docs/verify-the-shape-of-a-field.cjs",
  "docs/verify-the-laws-of-a-field.cjs",
  "docs/verify-every-word-in-three-languages.cjs",
  "docs/verify-self-description-authority.mjs"
];

const agentJob = { args: ['--test', 'test/forecast-audit.test.mjs', 'test/agent-client.test.mjs'], label: 'agent unit tests' };
const known = new Set(allChecks);
const selected = new Set();

const add = (...paths) => paths.forEach(path => {
  if (known.has(path)) selected.add(path);
});

const smoke = [
  'docs/verify-scale-continuity.cjs',
  'docs/verify-world-lab-routing.cjs',
  'docs/verify-the-global-inventory.cjs',
  'docs/verify-self-description-authority.mjs',
];
add(...smoke);

const fullMode = process.env.HCC_VERIFY_ALL === '1';
let includeAgent = fullMode;

function git(args) {
  const r = spawnSync('git', args, { encoding: 'utf8' });
  return r.status === 0 ? r.stdout : '';
}

const files = git(['diff', '--name-only', 'HEAD^', 'HEAD'])
  .split(/\r?\n/).map(s => s.trim()).filter(Boolean);
const patch = git(['diff', '--unified=0', 'HEAD^', 'HEAD']);
const signal = (files.join('\n') + '\n' + patch).toLowerCase();
let domainMatches = 0;

function route(re, paths) {
  if (!re.test(signal)) return;
  domainMatches += 1;
  add(...paths);
}

if (fullMode) {
  add(...allChecks);
} else {
  /* A verifier that is edited must prove its own assertions. */
  for (const file of files) if (/^docs\/verify-[\w.-]+\.(?:cjs|mjs)$/.test(file)) add(file);

  /* The S³ Navier–Stokes half of the atlas: the curl shells, the torus sector,
     the geodesic-axis chart, the escape bounds and the half-spectrum application
     all read ONE construction, so a change to any of its names has to prove all
     five. Their own file names are routed by the rule above; these are the
     SUBJECT words, which is what a change to the laboratories looks like. */
  route(/\b(s3ns|s3shell|s3torus|s3tube|s3escape|s3kb|curl shell|beltrami|killing|chiral|casimir|grassmann|band rank|clebsch|jacobi|frobenius|ebin|deformation tensor)\b/, [
    'docs/verify-the-curl-shells-of-the-round-sphere.cjs',
    'docs/verify-the-torus-that-solves-completely.cjs',
    'docs/verify-where-the-curvature-enters.cjs',
    'docs/verify-no-finite-sector-can-hold-it.cjs',
    'docs/verify-the-sphere-had-only-half-a-spectrum.cjs',
    'docs/verify-the-chiral-law.cjs',
    'docs/verify-the-paired-hopf-lock.cjs',
    'docs/verify-hopf-bundle.cjs',
  ]);

  route(/\b(poin|poinsot|dzhanib|euler[ -]?top|poinomega|poinsolve|polhode|herpolhode)\b/, [
    'docs/verify-poinsot-phase-family.cjs',
    'docs/verify-hopf-bundle.cjs',
  ]);

  route(/\b(camera|setcontroldistancelimits|scale_seams|hcc_zoom|far[- ]?plane|near[- ]?plane|observer seam|black void)\b/, [
    'docs/verify-the-camera.cjs',
    'docs/verify-camera-limit-authority.cjs',
    'docs/verify-scale-continuity.cjs',
    'docs/verify-the-seam-lands-at-the-observer.cjs',
    'docs/verify-no-void-past-the-last-structure.cjs',
    'docs/verify-a-framing-is-not-a-gesture.cjs',
    'docs/verify-wheels-of-time.cjs',
    'docs/verify-cycles-frames-are-uniform.cjs',
  ]);

  route(/\b(time machine|time passport|time-domain|atlastime|setatlastime|setatlasepoch|epochdays|chronometr|j2000|cosmic age|lookback|phi-time)\b/, [
    'docs/verify-the-time-machine.cjs',
    'docs/verify-time-domain-passport.cjs',
    'docs/verify-chronometry-atlas-contract.cjs',
    'docs/verify-chronometry-visual-contract.cjs',
  ]);

  route(/\b(cycle|cycframe|cycpair|resonance|multiphase|metonic|rabjung)\b/, [
    'docs/verify-linked-cycle-views.cjs',
    'docs/verify-multiphase-solar-control.cjs',
    'docs/verify-wheels-of-time.cjs',
    'docs/verify-cycles-are-ordered.cjs',
    'docs/verify-cycles-frames-are-uniform.cjs',
    'docs/verify-resonance-is-surprising.cjs',
  ]);

  route(/\b(solar|planet|orbit|kuiper|oort|neptune|asteroid|atmosphere|ephemeris)\b/, [
    'docs/verify-multiphase-solar-control.cjs',
    'docs/verify-the-sun.cjs',
    'docs/verify-planetary-atmospheres.cjs',
    'docs/verify-the-orbit-carries-its-speed.cjs',
    'docs/verify-the-belt-has-gaps.cjs',
    'docs/verify-between-neptune-and-the-cloud.cjs',
  ]);

  route(/\b(hopf|bloch|spin|reeb|contact form|momentum map)\b/, [
    'docs/verify-hopf-bundle.cjs',
  ]);

  route(/\b(hcc_s3r|conditional reconstruction|shell tomography|s3 radius|s³ radius|omega_k|curvature radius)\b/, [
    'docs/verify-the-conditional-reconstruction.cjs',
    'docs/verify-shell-tomography.cjs',
    'docs/verify-one-length-one-authority.cjs',
  ]);

  route(/\b(galaxy|galactic|local group|hubble|starlight)\b/, [
    'docs/verify-galactic-butterfly-explorer.cjs',
    'docs/verify-galaxies-are-placed.cjs',
    'docs/verify-one-galaxy-one-model.cjs',
    'docs/verify-the-galaxy-is-an-integral.cjs',
    'docs/verify-local-group-timing.cjs',
    'docs/verify-local-flow.cjs',
    'docs/verify-starlight.cjs',
  ]);

  route(/\b(quantity bus|quantity-bus|typed refusal|instrument|manifest|reach\.json|source reader|mcp)\b/, [
    'docs/verify-bus-readers.cjs',
    'docs/verify-refusals-are-visible.cjs',
    'docs/verify-bus-publications-are-routable.cjs',
    'docs/verify-quantity-kinds-are-counted.cjs',
    'docs/verify-the-global-inventory.cjs',
    'docs/verify-every-object-can-be-asked.cjs',
    'docs/verify-everything-says-what-it-is.cjs',
    'docs/verify-self-description-authority.mjs',
  ]);

  route(/\b(css|portrait|landscape|touch target|coarse pointer|mobile|panel|viewport|overflow)\b/, [
    'docs/verify-a-touch-target-is-two-dimensional.cjs',
    'docs/verify-a-framing-is-not-a-gesture.cjs',
    'docs/verify-the-time-machine.cjs',
    'docs/verify-the-phone-is-one-stack.cjs',
    'docs/verify-the-phone-keeps-its-scene.cjs',
  ]);

  route(/\b(zodiac|constellation|constellations|parallax|proper motion|gaia|hipparcos|simbad|starpm|space motion|ecliptic|star|stars|psf|point.spread|twinkle|scintillation|airmass|glow|bloom|oort|milky way|starfield|sky)\b/, [
    'docs/verify-the-zodiac-has-depth.cjs',
    'docs/verify-a-star-is-a-point.cjs',
    'docs/verify-colour-temperature.cjs',
    'docs/verify-no-star-in-the-oort-cloud.cjs',
    'docs/verify-the-arms-have-their-stars.cjs',
    'docs/verify-every-object-opens-its-pictures.cjs',
    'docs/verify-the-giant-structures-are-made-of-galaxies.cjs',
    'docs/verify-the-earth-stands-true.cjs',
    'docs/verify-the-sky-turns-with-the-day.cjs',
    'docs/verify-the-light-has-its-sources.cjs',
    'docs/verify-the-measured-universe-on-the-ladder.cjs',
    'docs/verify-every-object-has-its-rung.cjs',
    'docs/verify-the-labs-read-the-atlas.cjs',
    'docs/verify-what-the-catalogues-say.cjs',
    'docs/verify-every-laboratory-has-its-parameter-space.cjs',
    'docs/verify-every-laboratory-keeps-its-invariants.cjs',
    'docs/verify-the-atlas-of-invariants.cjs',
    'docs/verify-the-nexus-is-a-structure.cjs',
    'docs/verify-the-hierarchy-of-every-invariant.cjs',
    'docs/verify-the-endpoint-on-trial.cjs',
    'docs/verify-every-laboratory-obeys-its-laws.cjs',
    'docs/verify-the-shape-of-a-field.cjs',
    'docs/verify-the-laws-of-a-field.cjs',
  ]);

  route(/\b(i18n|translation|translate|language|languages|russian|german|trilingual|caption|captions|label|labels)\b/, [
    'docs/verify-every-word-in-three-languages.cjs',
  ]);

  route(/\b(description|describes|doc|docs|world|worlds|says what)\b/, [
    'docs/verify-everything-says-what-it-is.cjs',
  ]);

  route(/\b(free flight|riding the photon|holographic|dimension space|blast wave|diffusion|scaling bench)\b/, [
    'docs/verify-free-flight.cjs',
    'docs/verify-riding-the-photon.cjs',
    'docs/verify-the-holographic-palette.cjs',
    'docs/verify-dimension-space.cjs',
    'docs/verify-the-blast-wave.cjs',
    'docs/verify-the-solvers-own-diffusion.cjs',
    'docs/verify-the-scaling-bench.cjs',
  ]);

  route(/\b(phi|φ|ladder|fibonacci|harmonices)\b/, [
    'docs/verify-the-ladder-is-not-a-law.cjs',
    'docs/verify-harmonices-mundi.cjs',
  ]);

  if (/\b(api\/|server\/|agent|reach|mcp|forecast)\b/.test(signal)) includeAgent = true;

  /* index.html is the shared runtime. Unknown edits there receive a compact generic
     safety neighborhood instead of silently receiving no subsystem check. */
  if (files.includes('index.html') && domainMatches === 0) {
    add(
      'docs/verify-controls-where-they-act.cjs',
      'docs/verify-every-formula-has-an-address.cjs',
      'docs/verify-every-object-can-be-asked.cjs',
      'docs/verify-everything-says-what-it-is.cjs',
      'docs/verify-a-stage-that-shows-everything.cjs',
      'docs/verify-a-framing-is-not-a-gesture.cjs',
      'docs/verify-a-touch-target-is-two-dimensional.cjs',
    );
  }

  /* Broad refactors still stay far below the complete census. The complete census is
     explicit via HCC_VERIFY_ALL=1 / test:source. */
  if (files.length > 20 || patch.length > 250000) {
    add(
      'docs/verify-semantic-reconciliation-stage1.cjs',
      'docs/verify-semantic-reconciliation-stage2.cjs',
      'docs/verify-controls-where-they-act.cjs',
      'docs/verify-every-formula-has-an-address.cjs',
      'docs/verify-every-object-can-be-asked.cjs',
      'docs/verify-everything-says-what-it-is.cjs',
      'docs/verify-a-stage-that-shows-everything.cjs',
      'docs/verify-a-framing-is-not-a-gesture.cjs',
      'docs/verify-unit-vocabulary.cjs',
      'docs/verify-one-coordinate-one-spelling.cjs',
    );
  }
}

const selectedChecks = fullMode ? allChecks : [...selected];
const jobs = selectedChecks.map(path => ({ args: [path], label: path }));
if (includeAgent) jobs.push(agentJob);

const missing = allChecks.filter(path => !existsSync(path));
if (missing.length) {
  console.error('Verifier registry contains missing files:', missing.join(', '));
  process.exit(1);
}

const requested = Number.parseInt(process.env.HCC_CI_WORKERS || '', 10);
const cpu = typeof availableParallelism === 'function' ? availableParallelism() : 4;
const concurrency = Math.max(1, Math.min(Number.isFinite(requested) ? requested : 4, cpu, jobs.length));
const started = Date.now();
let cursor = 0;
const results = new Array(jobs.length);

console.log(`${fullMode ? 'Full' : 'Change-aware'} verifier pool: ${jobs.length} of ${allChecks.length + 1} checks · ${concurrency} workers${files.length ? ` · ${files.length} changed file(s)` : ''}`);

function runOne(job, index) {
  return new Promise((resolve) => {
    const t0 = Date.now();
    const child = spawn(process.execPath, job.args, {
      cwd: process.cwd(),
      env: process.env,
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    let out = '', err = '';
    child.stdout.on('data', chunk => { out += chunk; });
    child.stderr.on('data', chunk => { err += chunk; });
    child.on('error', error => {
      results[index] = { ...job, code: 1, ms: Date.now() - t0, output: err + '\n' + error.message };
      resolve();
    });
    child.on('close', (code, signal) => {
      if (results[index]) return;
      results[index] = { ...job, code: code ?? 1, signal, ms: Date.now() - t0, output: out + err };
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
    if (text) console.log(text.slice(-5000));
  }
}

console.log(`Verifier wall time: ${((Date.now()-started)/1000).toFixed(2)}s · ${failed ? failed + ' failed' : 'GREEN'}`);
if (failed) process.exit(1);
