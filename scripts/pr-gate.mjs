#!/usr/bin/env node
import { existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';

const run = (label, cmd, args=[]) => {
  process.stdout.write(`· ${label} … `);
  try {
    execFileSync(cmd, args, { stdio: ['ignore','pipe','pipe'], encoding:'utf8' });
    console.log('ok');
  } catch (e) {
    console.log('FAILED');
    const out = String(e.stdout || '').trim();
    const err = String(e.stderr || '').trim();
    if (out) console.log(out.slice(-3000));
    if (err) console.log(err.slice(-3000));
    process.exit(1);
  }
};

const git = (...args) => execFileSync('git', args, { encoding:'utf8' }).trim();
const base = process.env.HCC_BASE_SHA || git('rev-parse','HEAD^');
const range = `${base}...HEAD`;
const changed = git('diff','--name-only',range).split(/\r?\n/).filter(Boolean);
const indexDiff = changed.includes('index.html')
  ? git('diff','--unified=0',range,'--','index.html')
  : '';

console.log(`PR fast gate · ${changed.length} changed file(s) · base ${base.slice(0,12)}`);

run('CI policy', 'node', ['scripts/verify-ci-policy.mjs']);
try {
  execFileSync('node', ['scripts/extract-kernels.mjs','--check'], { stdio: ['ignore','pipe','pipe'], encoding:'utf8' });
  console.log('· physics extraction drift guard … ok');
} catch (e) {
  console.log('· physics extraction drift guard … FAILED');
  console.log(String(e.stderr || e.stdout || '').trim());
  execFileSync('node', ['scripts/extract-kernels.mjs'], { stdio: ['ignore','pipe','pipe'], encoding:'utf8' });
  const delta = git('diff','--','core/atlas/extracted.mjs');
  console.log('Generated delta that must be committed:\n' + delta.slice(0,12000));
  process.exit(1);
}
run('static validator', 'node', ['scripts/validate.mjs']);
run('self-description authority', 'node', ['docs/verify-self-description-authority.mjs']);

const verifierRe = /^docs\/verify-.*\.(?:cjs|mjs)$/;
const changedVerifiers = [...new Set(changed.filter(f => verifierRe.test(f) && existsSync(f)))];

const required = new Set(changedVerifiers);
const sentinels = [
  {
    name: 'Poinsot / Euler top',
    pattern: /\bpoin(?:Setup|Solve|Omega|T|Speed|L2|Group|Objs)?\b|POINSOT|DZHANIBEKOV/i,
    verifiers: ['docs/verify-poinsot-phase-family.cjs','docs/verify-momentum-map-unification.cjs'],
  },
  {
    name: 'camera / scale seams',
    pattern: /setControlDistanceLimits|SCALE_SEAMS|HCC_ZOOM|hccObserverOnCarrier|zoom(?:Floor|Ceil)|camera\.near|camera\.far/,
    verifiers: ['docs/verify-the-camera.cjs','docs/verify-scale-continuity.cjs','docs/verify-the-seam-lands-at-the-observer.cjs','docs/verify-no-void-past-the-last-structure.cjs'],
  },
  {
    name: 'Atlas time',
    pattern: /setAtlasTime|atlasTimeSnapshot|hccNowEpochDays|TIME MACHINE|Time Machine|tm(?:Bar|Rate|Unit|Play|Epoch)/,
    verifiers: ['docs/verify-the-time-machine.cjs','docs/verify-chronometry-atlas-contract.cjs','docs/verify-chronometry-visual-contract.cjs'],
  },
  {
    name: 'Solar multiphase controls',
    pattern: /multi(?:phase|Phase).*solar|solar.*multi(?:phase|Phase)|SOLAR_PHASE|sunPhase/i,
    verifiers: ['docs/verify-multiphase-solar-control.cjs'],
  },
  {
    name: 'linked cycles',
    pattern: /linked.?cycle|cycleLink|CYCLES|cyc[A-Z]/,
    verifiers: ['docs/verify-linked-cycle-views.cjs'],
  },
];

if (changed.includes('index.html')) {
  if (!changedVerifiers.length) {
    console.error('FAST-GATE REFUSAL: index.html changed without any changed docs/verify-* contract.');
    console.error('Add or update the verifier that states what this change must preserve.');
    process.exit(1);
  }
  for (const s of sentinels) {
    if (s.pattern.test(indexDiff)) {
      console.log(`  affected subsystem: ${s.name}`);
      for (const f of s.verifiers) if (existsSync(f)) required.add(f);
    }
  }
}

for (const f of [...required].sort()) run(f, 'node', [f]);

const agentTouched = changed.some(f =>
  /^(?:api|server|core\/prediction|test)\//.test(f) ||
  ['scripts/reach.mjs','api/agent-client.mjs'].includes(f)
);
if (agentTouched) run('agent/API regression tests', 'npm', ['run','test:agent']);

const ciInfraTouched = changed.some(f =>
  f === 'package.json' ||
  f === 'scripts/pr-gate.mjs' ||
  f === 'scripts/verify-ci-policy.mjs' ||
  f.startsWith('.github/workflows/')
);
if (ciInfraTouched && process.env.HCC_PR_GATE_SELF !== '1') {
  console.log('  CI infrastructure changed: running the existing full source suite once.');
  run('full source suite for CI-infrastructure change', 'npm', ['run','test:source'],);
}

console.log(`\nPR fast gate: green · ran ${required.size} targeted verifier(s)`);
