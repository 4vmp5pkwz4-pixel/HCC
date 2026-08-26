#!/usr/bin/env node
/* One command that rebuilds every generated artifact from scratch and refuses to pass if
   anything disagrees: contracts, verifiers, API tests, headless walk. */
import { execSync } from 'node:child_process';
import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const RAN = [];
const run = (label, cmd) => {
  RAN.push(cmd);
  process.stdout.write(`· ${label} … `);
  try { execSync(cmd, { cwd: ROOT, stdio: ['ignore', 'pipe', 'pipe'] }); console.log('ok'); return true; }
  catch (e) { console.log('FAILED'); console.log(String(e.stdout || '').slice(-1200)); console.log(String(e.stderr || '').slice(-600)); return false; }
};
let ok = true;
ok = run('the extracted kernels are in step with index.html', 'node scripts/extract-kernels.mjs --check') && ok;
ok = run('regenerate the API contracts from the core', 'node scripts/build-api.mjs') && ok;
/* ── AND THE MANIFEST IS COMPARED AGAINST THE ATLAS, WHICH IT NEVER WAS ─────
   scripts/build-manifest.mjs has had a --check mode since it was written and
   nothing ever ran it, because it could not pass: it compared its own output
   against the committed file, and the committed file is not its output —
   build-api.mjs enriches it afterwards. So it reported the manifest stale on a
   clean tree, and was left out of CI instead of being fixed. It compares the
   fields it actually writes now, and runs here. This matters beyond tidiness:
   docs/verify-transfers.cjs fingerprints the instrument declarations FROM the
   manifest to catch a stale influence map, and a stale manifest would have made
   that fingerprint agree with itself. */
ok = run('the manifest still matches the atlas it was walked from', 'node scripts/build-manifest.mjs --check') && ok;
ok = run('static validator', 'node scripts/validate.mjs') && ok;
for (const f of readdirSync(join(ROOT, 'docs')).filter(f => /^verify-.*\.cjs$/.test(f)).sort())
  ok = run(`verifier ${f}`, `node docs/${f}`) && ok;
ok = run('API contract + benchmark suite', 'node test/run-tests.mjs') && ok;
ok = run('headless agent scenario', 'node scripts/demo-agent.mjs') && ok;
/* ── AND THE ATLAS'S OWN EIGHT HUNDRED ASSERTIONS, WHICH NOTHING RAN ────────
   validate.mjs checked that the string "runSelfTests" appeared in index.html — that the
   suite EXISTED, not that it passed. Eight hundred checks, a green pipeline, and no
   connection between the two. A failing assertion shipped for every release since the
   seventy-second laboratory and nobody could have seen it.

   It runs from two arrivals, because a world-gated clause is only a check in the world
   that gates it, and every harness ever pointed at this page arrived in the same one. */
ok = run("the atlas's own self-tests, from every arrival", 'node scripts/selftest.mjs') && ok;
/* ── AND WHETHER THE LABORATORIES ARE STILL ALIVE ───────────────────────────
   Three laboratories shipped as pictures that looked like systems, and the only thing
   that caught it was a person saying so. The difference is measurable — how much
   geometry is rebuilt and how many bodies move between one frame and the next — and
   this walk measures every laboratory with RENDERING ON, which is why it cannot ride
   along with the manifest walk that deliberately runs without a GPU. It reports two
   numbers per laboratory and gates on one thing only: that the atlas as a whole has
   not gone quiet. */
ok = run('every laboratory measured for what it recomputes per frame', 'node scripts/liveness.mjs') && ok;
/* ── AND THE OTHER LIST OF THESE STEPS, WHICH HAD DRIFTED AGAIN ─────────────
   .github/workflows/core.yml hand-enumerates the same checks this file runs, and says
   so in its own comment, and says that a duplicated list drifts — because it had already
   drifted once, when the self-test gate existed here and the workflow knew nothing about
   it. It drifted again: two gates were added here, a liveness walk and a manifest
   comparison, and the workflow that decides whether a release ships ran neither. A gate
   on the developer's machine and not on the shipping one is not a gate.

   Rather than write the observation down a second time, the two lists are now compared.
   Every script this file invokes has to appear in that workflow. It does not check the
   reverse — the workflow legitimately does more, starting the service and building the
   image — and it compares SCRIPT PATHS rather than command lines, because the verifier
   sweep is a shell loop there and a JavaScript loop here and those will never be the
   same string. */
{
  const WF = join(ROOT, '.github', 'workflows', 'core.yml');
  if (!existsSync(WF)) {
    console.log('· the shipping workflow is not in this checkout, so the two lists cannot be compared … skipped');
  } else {
    const yml = readFileSync(WF, 'utf8');
    const scripts = [...new Set(RAN.flatMap(c => [...c.matchAll(/(?:scripts|test|docs)\/[\w.-]+\.(?:mjs|cjs)/g)].map(m => m[0])))]
      .filter(s => !s.startsWith('docs/verify-'));   /* the verifier sweep is a loop on both sides */
    const missing = scripts.filter(s => !yml.includes(s));
    const okWf = missing.length === 0;
    process.stdout.write('· every gate here is also a gate in the shipping workflow … ');
    console.log(okWf ? 'ok' : 'FAILED');
    if (!okWf) {
      console.log(`  .github/workflows/core.yml never runs: ${missing.join(', ')}`);
      console.log('  a gate on this machine and not on the one that decides whether a release ships is not a gate.');
    } else {
      console.log(`  ${scripts.length} scripts, every one of them named in .github/workflows/core.yml`);
    }
    ok = okWf && ok;
  }
}
console.log(ok ? '\nCI: all green\n' : '\nCI: BLOCKED — a disagreement was found\n');
process.exit(ok ? 0 : 1);
