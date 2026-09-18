import { readdirSync, readFileSync } from 'node:fs';

const workflowDirectory = new URL('../.github/workflows/', import.meta.url);
const workflowNames = readdirSync(workflowDirectory)
  .filter((name) => /\.ya?ml$/.test(name))
  .sort();
const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));

const failures = [];
const requirePolicy = (condition, message) => {
  if (!condition) failures.push(message);
};

const readWorkflow = (name) => readFileSync(new URL(name, workflowDirectory), 'utf8');

const topLevelBlock = (source, key) => {
  const lines = source.split(/\r?\n/);
  const start = lines.findIndex((line) => line === `${key}:`);
  if (start === -1) return '';

  const block = [];
  for (let index = start + 1; index < lines.length; index += 1) {
    const line = lines[index];
    if (/^[A-Za-z0-9_-]+:/.test(line)) break;
    block.push(line);
  }
  return block.join('\n');
};

const keysAtIndent = (source, spaces) => {
  const prefix = ' '.repeat(spaces);
  return source
    .split(/\r?\n/)
    .map((line) => line.match(new RegExp(`^${prefix}([A-Za-z0-9_-]+):`))?.[1])
    .filter(Boolean);
};

requirePolicy(
  JSON.stringify(workflowNames) === JSON.stringify(['core.yml', 'validate.yml']),
  `only core.yml and validate.yml may be persistent workflows; found: ${workflowNames.join(', ')}`,
);

/* The default command is intentionally NOT the full source census. This is a permanent
   architectural guard: ordinary edits get fast, targeted feedback; exhaustive science
   remains explicit in test:source / test:release and the manual Computational core. */
requirePolicy(pkg.scripts?.test === 'npm run test:quick',
  `npm test must stay on test:quick, found: ${pkg.scripts?.test || 'missing'}`);
requirePolicy(pkg.scripts?.['test:quick'] === 'node scripts/verify-quick.mjs',
  'test:quick must use the change-aware verifier router');
requirePolicy(typeof pkg.scripts?.['test:source'] === 'string' && pkg.scripts['test:source'].length > 100,
  'the full source audit must remain available explicitly');
requirePolicy(typeof pkg.scripts?.['test:release'] === 'string' && pkg.scripts['test:release'].includes('test:source'),
  'release validation must retain the full source audit');

if (workflowNames.includes('core.yml')) {
  const core = readWorkflow('core.yml');
  const events = keysAtIndent(topLevelBlock(core, 'on'), 2);
  requirePolicy(
    JSON.stringify(events) === JSON.stringify(['workflow_dispatch']),
    `Computational core must be manual-only; found events: ${events.join(', ') || 'none'}`,
  );
  requirePolicy(
    core.includes('node scripts/liveness.mjs'),
    'manual Computational core must retain the full laboratory liveness audit',
  );
}

if (workflowNames.includes('validate.yml')) {
  const validate = readWorkflow('validate.yml');
  const events = keysAtIndent(topLevelBlock(validate, 'on'), 2).sort();
  requirePolicy(
    JSON.stringify(events) === JSON.stringify(['pull_request', 'push']),
    `Validate atlas must run only for pull requests and pushes to main; found events: ${events.join(', ') || 'none'}`,
  );
  requirePolicy(
    /^\s{4}branches:\s*\n\s{6}- main\s*$/m.test(topLevelBlock(validate, 'on')),
    'Validate atlas push trigger must be restricted to main',
  );

  const concurrency = topLevelBlock(validate, 'concurrency');
  requirePolicy(
    /^\s{2}cancel-in-progress:\s*true\s*$/m.test(concurrency),
    'Validate atlas must cancel superseded runs',
  );
  requirePolicy(validate.includes('fetch-depth: 2'),
    'Validate atlas must fetch only enough history for the one-change impact diff');
  requirePolicy(validate.includes('run: npm test'),
    'Validate atlas must run the lightweight default test command');
  requirePolicy((validate.match(/^\s*run:/gm) || []).length === 1,
    'Validate atlas must keep exactly one command step; subsystem checks belong in verify-quick.mjs');

  for (const forbidden of [
    'test:source', 'test:release', 'docs/verify-', 'scripts/liveness.mjs',
    'scripts/selftest.mjs', 'playwright', 'docker build',
  ]) {
    requirePolicy(!validate.includes(forbidden), `Validate atlas contains heavy/direct command: ${forbidden}`);
  }
}

for (const name of workflowNames) {
  const source = readWorkflow(name);
  requirePolicy(!/:\s*write\s*$/m.test(source), `${name} grants write permission`);
}

if (failures.length) {
  console.error('CI policy violations:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('CI policy verified: automatic validation is lightweight/change-aware; exhaustive audits remain explicit and manual.');
