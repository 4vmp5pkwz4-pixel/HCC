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

try {
  await run('build-manifest');
  await run('build-api');
  await Promise.all([run('transfers'), run('sensitivity'), run('liveness')]);
  await run('reach');
  await run('demo-agent');
  console.log(`\n${stamp()}  pipeline complete`);
} catch (e) {
  console.error(`\n${stamp()}  PIPELINE FAILED at ${e.message}`);
  process.exit(1);
}
