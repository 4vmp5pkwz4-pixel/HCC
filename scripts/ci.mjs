#!/usr/bin/env node
/* One command that rebuilds every generated artifact from scratch and refuses to pass if
   anything disagrees: contracts, verifiers, API tests, headless walk. */
import { execSync } from 'node:child_process';
import { readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const run = (label, cmd) => {
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
console.log(ok ? '\nCI: all green\n' : '\nCI: BLOCKED — a disagreement was found\n');
process.exit(ok ? 0 : 1);
