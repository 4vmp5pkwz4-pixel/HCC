#!/usr/bin/env node
/* ============================================================================
   ONE COMMAND, ONE LINE PER CHECK, FAST THINGS FIRST

   The gates were run as four separate background jobs whose progress lived in a
   log file nobody watching the conversation could see. That is not rigour, it
   is opacity: the same checks, arranged so that nobody can tell whether they
   are running, how far along they are, or what is left.

   This runs them in ONE place, prints ONE line each as it finishes, and orders
   them by how long they take. The parse check answers in a second. The
   verifiers answer in two minutes. The self-test, which walks the page in a
   browser, takes eight. Nothing here is slower than that.

   `node scripts/gate.mjs`        parse + validate + 96 verifiers   ~2 min
   `node scripts/gate.mjs --full` the above plus the self-test      ~10 min

   THE ARTIFACT PIPELINE IS NOT PART OF THIS and should not be. It REGENERATES
   files rather than checking them, it takes twenty-five minutes, and it is only
   needed when the source has changed in a way the artifacts describe. Run it
   with scripts/pipeline.mjs when that is true, which is less often than every
   time.

   Any failure stops the run and prints what failed. A gate that keeps going
   after a red is a gate that makes you read to the bottom to find out.
   ========================================================================== */
import { execFileSync, execSync } from 'node:child_process';
import { readFileSync, writeFileSync, readdirSync, unlinkSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
/* ── WHAT CI's FAST WORKFLOW RUNS, RUN HERE FIRST ────────────────────────────
   A commit went to main red because the local loop ran scripts/validate.mjs and
   the CI `validate` workflow runs two verifiers BESIDE it — and one of them, the
   linked-cycles contract, failed. It failed for a reason worth keeping: it
   required cycFrame==='linked' within 1500 characters of the start of
   applyCycFrameView, and two new frames given their own camera framing above it
   pushed the branch past that budget. A proximity assertion, red for a feature it
   has no opinion on.
   The gap that let it ship is the one addressed here: `--quick` now runs exactly
   what the fast CI workflow runs, in the same order, so a green quick gate means
   the same thing locally as it does there. It costs about a second. */
const CI_FAST_VERIFIERS = ['verify-multiphase-solar-control.cjs', 'verify-linked-cycle-views.cjs'];
const FULL = process.argv.includes('--full');
if (FULL) process.env.HCC_WALK = 'full';   /* the exhaustive walks are part of --full, not of every run */;
const t0 = Date.now();
const el = () => ((Date.now() - t0) / 1000).toFixed(0).padStart(4) + 's';
let failed = 0;

function step(name, fn) {
  process.stdout.write(`${el()}  · ${name} … `);
  try { const note = fn(); console.log(`ok${note ? '  ' + note : ''}`); }
  catch (e) {
    console.log('FAILED');
    console.log(String(e.stdout || e.message || e).split('\n').slice(-20).join('\n'));
    failed = 1; throw e;
  }
}

try {
  step('the module parses', () => {
    const h = readFileSync(join(ROOT, 'index.html'), 'utf8');
    const m = h.match(/<script type="module">([\s\S]*?)<\/script>/);
    if (!m) throw new Error('no inline module');
    const tmp = join(ROOT, '.gate-parse.mjs');
    writeFileSync(tmp, m[1]);
    try { execFileSync(process.execPath, ['--check', tmp], { stdio: 'pipe' }); }
    finally { try { unlinkSync(tmp); } catch {} }
    return `${(m[1].length / 1024).toFixed(0)} KB`;
  });

  step('the kernels are in step with the source', () => {
    const before = readFileSync(join(ROOT, 'core/atlas/extracted.mjs'), 'utf8');
    execFileSync(process.execPath, [join(ROOT, 'scripts/extract-kernels.mjs')], { stdio: 'pipe' });
    const after = readFileSync(join(ROOT, 'core/atlas/extracted.mjs'), 'utf8');
    if (before !== after) throw new Error('the extracted module was stale — it has been rewritten, commit it');
    return 'byte for byte';
  });

  step('validate', () => {
    execFileSync(process.execPath, [join(ROOT, 'scripts/validate.mjs')], { stdio: 'pipe' });
    return '';
  });

  /* the two verifiers CI's fast workflow runs beside validate — a green quick
     gate has to mean the same thing here as it does there */
  step("what CI's fast workflow runs", () => {
    for (const f of CI_FAST_VERIFIERS) {
      execFileSync(process.execPath, [join(ROOT, 'docs', f)], { stdio: 'pipe' });
    }
    return `${CI_FAST_VERIFIERS.length} contracts`;
  });

  step('96 verifiers', () => {
    const files = readdirSync(join(ROOT, 'docs')).filter(f => /^verify-.*\.cjs$/.test(f)).sort();
    const bad = [];
    for (const f of files) {
      try { execFileSync(process.execPath, [join(ROOT, 'docs', f)], { stdio: 'pipe' }); }
      catch { bad.push(f); }
    }
    if (bad.length) throw new Error('failed: ' + bad.join(' '));
    return `${files.length} files, every one exit 0`;
  });

  if (FULL) step('the atlas self-test, seven arrivals', () => {
    const out = execSync(`${process.execPath} ${join(ROOT, 'scripts/selftest.mjs')}`,
      { cwd: ROOT, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
    const m = out.match(/self-tests: (\d+) assertions, (\d+) failures/);
    if (!m) throw new Error(out.split('\n').slice(-25).join('\n'));
    if (m[2] !== '0') throw new Error(out.split('\n').slice(-40).join('\n'));
    return `${m[1]} assertions, 0 failures`;
  });

  console.log(`\n${el()}  GREEN${FULL ? '' : '  — browser walks SAMPLED; --full walks every laboratory and adds the self-test'}`);
} catch { console.log(`\n${el()}  RED`); process.exit(1); }
