#!/usr/bin/env node
/* ============================================================================
   THE PIPELINE, RUN AS THE GRAPH IT IS

   Seven steps regenerate the artifacts, and they were run one after another
   because that is the order they were written in, not because each needed the
   one before it. Measured, the dependencies are these:

     build-manifest   walks the page                       port 8951
     build-api        reads core/index.mjs and the manifest   no browser
     transfers        walks the page                       port 8979
     sensitivity      walks the page                       port 8983
     liveness         walks the page                       port 8973
     reach            reads transfers.json and sensitivity.json  no browser
     demo-agent       reads the artifacts                  port 8979

   THREE OF THEM ARE INDEPENDENT PAGE WALKS ON THREE DIFFERENT PORTS. Nothing
   transfers writes is read by sensitivity or liveness; the ports do not
   collide; and reach is the only consumer of the first two. So the serial
   chain spends thirty-five minutes doing what fifteen would do, and the extra
   twenty are not caution — they are the order of a list.

   Run in the dependency order instead, the shape is:

     manifest -> api -> { transfers | sensitivity | liveness } -> reach -> agent

   NOTHING IS SKIPPED AND NO CHECK IS WEAKENED. Every step still runs, still
   writes the same file, and still fails the whole run if it fails. The only
   change is that three of them wait on each other for no reason and now do not.

   A step is retried ONCE if it dies on a bound port, because that is the one
   failure that is about the machine rather than the atlas — a previous run's
   browser still holding the socket. Any other failure is real and stops here.
   ========================================================================== */
import { spawn } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const t0 = Date.now();
const stamp = () => ((Date.now() - t0) / 1000).toFixed(0).padStart(4) + 's';

function run(step) {
  return new Promise((res, rej) => {
    const attempt = n => {
      const p = spawn(process.execPath, [join(ROOT, 'scripts', `${step}.mjs`)],
        { cwd: ROOT, stdio: ['ignore', 'pipe', 'pipe'] });
      let out = '';
      p.stdout.on('data', d => { out += d; });
      p.stderr.on('data', d => { out += d; });
      p.on('close', code => {
        if (code === 0) { console.log(`${stamp()}  ✔ ${step}`); return res({ step, out }); }
        if (n === 0 && /EADDRINUSE/.test(out)) {
          console.log(`${stamp()}  ↻ ${step} — port still held, one retry`);
          return setTimeout(() => attempt(1), 4000);
        }
        console.log(`${stamp()}  ✗ ${step} (exit ${code})`);
        console.log(out.split('\n').slice(-25).join('\n'));
        rej(new Error(step));
      });
    };
    console.log(`${stamp()}  · ${step}`);
    attempt(0);
  });
}

/* ── AND THE RUN THAT DID NOT NEED TO HAPPEN ─────────────────────────────────
   Running the graph in parallel took thirty-five minutes down to twenty-five.
   The larger waste was never the ORDER, it was running it at all: a fix to a
   display string, a comment, a resource hint — none of those can move a single
   number in transfers.json or sensitivity.json, and each one paid twenty-five
   minutes to confirm it.

   --if-needed decides that in about seventy-four seconds instead, and the
   argument is short enough to check. sensitivity evaluates instruments, which
   are kernel math plus declared contracts. transfers routes declared contracts.
   reach is pure arithmetic over those two. So if the extracted kernels are byte
   for byte in step with index.html AND the manifest still matches the atlas it
   was walked from, those three cannot have changed, and re-deriving them can
   only reproduce the file already on disk.

   TWO THINGS ARE NEVER SKIPPED. build-manifest and build-api are how we LEARN
   whether anything moved, so they always run. And liveness is never skipped on
   a release: it measures what each view recomputes per frame, which a rendering
   edit moves without touching a kernel or a contract, and docs/verify-liveness-
   artifact.cjs requires its release identity to equal version.json — so a
   measurement of one build must never be stamped with the name of another.
   It is skipped only when the release identity has not moved either.

   This is a skip of WORK, not of a CHECK: every artifact it leaves alone is one
   it has just proved current, and it says so by name. */
const IF_NEEDED = process.argv.includes('--if-needed');

function check(step, args) {
  return new Promise(res => {
    const p = spawn(process.execPath, [join(ROOT, 'scripts', `${step}.mjs`), ...args],
      { cwd: ROOT, stdio: ['ignore', 'pipe', 'pipe'] });
    let out = '';
    p.stdout.on('data', d => { out += d; });
    p.stderr.on('data', d => { out += d; });
    p.on('close', code => res({ ok: code === 0, out }));
  });
}

try {
  let skip = new Set();
  if (IF_NEEDED) {
    console.log(`${stamp()}  · deciding what is already current`);
    const [k, m] = await Promise.all([
      check('extract-kernels', ['--check']),
      check('build-manifest', ['--check']),
    ]);
    const { readFileSync } = await import('node:fs');
    const ver = JSON.parse(readFileSync(join(ROOT, 'version.json'), 'utf8'));
    const stamped = name => {
      try {
        const a = JSON.parse(readFileSync(join(ROOT, 'api', `${name}.json`), 'utf8'));
        return a.version === ver.version && a.build === ver.build;
      } catch { return false; }
    };
    if (k.ok && m.ok) {
      /* --check just walked the page and found the manifest in step; walking it
         again to write the identical bytes is the same seventy seconds twice */
      skip.add('build-manifest');
      const derived = ['transfers', 'sensitivity', 'reach'];
      if (derived.every(stamped)) {
        for (const d of derived) skip.add(d);
        console.log(`${stamp()}  — kernels byte for byte, manifest in step: transfers, sensitivity and reach cannot have moved`);
      } else {
        console.log(`${stamp()}  — kernels and manifest are in step, but a derived artifact carries another release: rebuilding`);
      }
      if (stamped('liveness')) {
        skip.add('liveness');
        console.log(`${stamp()}  — liveness already carries ${ver.version} / ${ver.build}`);
      } else {
        console.log(`${stamp()}  — liveness is stamped for another release and must be re-measured`);
      }
    } else {
      console.log(`${stamp()}  — ${!k.ok ? 'the kernels moved' : 'the manifest moved'}: full run`);
    }
  }
  const maybe = step => skip.has(step)
    ? Promise.resolve(console.log(`${stamp()}  ⊘ ${step} — proved current, not re-derived`))
    : run(step);

  await maybe('build-manifest');
  await run('build-api');
  await Promise.all([maybe('transfers'), maybe('sensitivity'), maybe('liveness')]);
  await maybe('reach');
  await run('demo-agent');
  console.log(`\n${stamp()}  pipeline complete${skip.size ? ` · ${skip.size} artifact(s) proved current` : ''}`);
} catch (e) {
  console.error(`\n${stamp()}  PIPELINE FAILED at ${e.message}`);
  process.exit(1);
}
