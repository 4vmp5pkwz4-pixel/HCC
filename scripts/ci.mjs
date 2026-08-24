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
console.log(ok ? '\nCI: all green\n' : '\nCI: BLOCKED — a disagreement was found\n');
process.exit(ok ? 0 : 1);
