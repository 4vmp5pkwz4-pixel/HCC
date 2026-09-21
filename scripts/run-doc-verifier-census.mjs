#!/usr/bin/env node
/*
  Exhaustive dependency-free docs verifier census.

  This preserves the exact semantics of the historical:
      for f in docs/verify-*.cjs; do node "$f"; done
  but runs independent verifiers in a bounded worker pool. It is for explicit full
  audits, not the ordinary affected-system PR gate.
*/
import { availableParallelism } from 'node:os';
import { readdirSync } from 'node:fs';
import { spawn } from 'node:child_process';

const checks = readdirSync('docs')
  .filter(name => /^verify-.*\.cjs$/.test(name))
  .sort()
  .map(name => `docs/${name}`);

const requested = Number.parseInt(process.env.HCC_CI_WORKERS || '', 10);
const cpu = typeof availableParallelism === 'function' ? availableParallelism() : 4;
const concurrency = Math.max(1, Math.min(Number.isFinite(requested) ? requested : 4, cpu, checks.length));
const results = new Array(checks.length);
let cursor = 0;
const started = Date.now();

function runOne(file, index) {
  return new Promise(resolve => {
    const t0 = Date.now();
    const child = spawn(process.execPath, [file], {
      cwd: process.cwd(),
      env: process.env,
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    let out = '', err = '';
    child.stdout.on('data', chunk => { out += chunk; });
    child.stderr.on('data', chunk => { err += chunk; });
    child.on('error', error => {
      results[index] = { file, code: 1, ms: Date.now() - t0, output: err + '\n' + error.message };
      resolve();
    });
    child.on('close', code => {
      if (results[index]) return;
      results[index] = { file, code: code ?? 1, ms: Date.now() - t0, output: out + err };
      resolve();
    });
  });
}

async function worker() {
  while (true) {
    const index = cursor++;
    if (index >= checks.length) return;
    await runOne(checks[index], index);
  }
}

console.log(`Full docs verifier census: ${checks.length} checks · ${concurrency} workers`);
await Promise.all(Array.from({ length: concurrency }, worker));

let failed = 0;
for (const result of results) {
  const ok = result.code === 0;
  if (!ok) failed += 1;
  console.log(`${ok ? 'PASS' : 'FAIL'} · ${(result.ms / 1000).toFixed(2)}s · ${result.file}`);
  if (!ok) {
    const detail = result.output.trim();
    if (detail) console.log(detail.slice(-5000));
  }
}

console.log(`Full docs verifier wall time: ${((Date.now() - started) / 1000).toFixed(2)}s · ${failed ? failed + ' failed' : 'GREEN'}`);
if (failed) process.exit(1);
