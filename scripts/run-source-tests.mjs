#!/usr/bin/env node
import { spawn } from 'node:child_process';
import { cpus } from 'node:os';
import { readFileSync } from 'node:fs';

const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
const serial = pkg.scripts?.['test:source:serial'];
if (!serial) throw new Error('package.json must retain test:source:serial as the canonical verifier list');

const commands = serial.split(/\s+&&\s+/).filter(Boolean);
const requiredPrefix = ['node scripts/verify-ci-policy.mjs', 'node scripts/validate.mjs'];
for (let i = 0; i < requiredPrefix.length; i += 1) {
  if (commands[i] !== requiredPrefix[i]) {
    throw new Error(`test:source:serial prefix drift: expected "${requiredPrefix[i]}", got "${commands[i] || 'missing'}"`);
  }
}

const run = (command, quiet = false) => new Promise((resolve) => {
  const child = spawn(command, {
    cwd: new URL('..', import.meta.url),
    shell: true,
    stdio: ['ignore', 'pipe', 'pipe'],
    env: process.env,
  });
  let stdout = '', stderr = '';
  child.stdout.on('data', (chunk) => { stdout += chunk; });
  child.stderr.on('data', (chunk) => { stderr += chunk; });
  child.on('close', (code, signal) => {
    if (!quiet || code !== 0) {
      process.stdout.write(`\n$ ${command}\n`);
      if (stdout) process.stdout.write(stdout);
      if (stderr) process.stderr.write(stderr);
    } else {
      process.stdout.write(`✓ ${command}\n`);
    }
    resolve({ command, code: code ?? 1, signal });
  });
});

for (const command of requiredPrefix) {
  const result = await run(command);
  if (result.code !== 0) process.exit(result.code);
}

const queue = commands.slice(requiredPrefix.length);
const requested = Number.parseInt(process.env.HCC_VERIFY_JOBS || '', 10);
const concurrency = Number.isFinite(requested) && requested > 0
  ? requested
  : Math.max(2, Math.min(6, cpus().length || 2));

console.log(`\nRunning ${queue.length} independent source verifiers with concurrency=${concurrency}.\n`);

let cursor = 0;
const failures = [];
const worker = async () => {
  while (true) {
    const index = cursor++;
    if (index >= queue.length) return;
    const result = await run(queue[index], true);
    if (result.code !== 0) failures.push(result);
  }
};

await Promise.all(Array.from({ length: Math.min(concurrency, queue.length) }, () => worker()));

if (failures.length) {
  console.error(`\nSOURCE VALIDATION FAILED: ${failures.length} task(s).\n`);
  for (const failure of failures) console.error(`- ${failure.command}`);
  process.exit(1);
}

console.log(`\nSOURCE VALIDATION GREEN: ${queue.length + requiredPrefix.length} commands; full verifier coverage preserved.\n`);
