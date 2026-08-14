#!/usr/bin/env node
/* THE DEMONSTRATION SCENARIO, done entirely over HTTP with no browser:
   load an S2P → check the data → identify the resolvable poles → put uncertainty on them →
   compute transfer as a function of PHYSICAL DISTANCE → export a reproducible report.
   Every claim it prints is one the service will stand behind, and the ones it will not make
   are printed as refusals. */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { server } from '../server/server.mjs';
const PORT = 8979, B = `http://127.0.0.1:${PORT}`;
await new Promise(r => server.listen(PORT, r));
const post = (p, b) => fetch(B + p, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(b) }).then(r => r.json());
const get = p => fetch(B + p).then(r => r.json());
const say = (n, s) => console.log(`\n${n}. ${s}`);

const report = { generated_at: new Date().toISOString(), steps: [] };
const step = (name, data) => { report.steps.push({ name, data }); return data; };

say(1, 'ask the service what it is, and what it refuses to be');
const health = step('health', await get('/api/v1/health'));
console.log(`   core ${health.core_version} · commit ${health.git_commit.slice(0, 10)} · ` +
  `${health.labs} laboratories, ${health.implemented} with a computational contract · requires WebGL: ${health.requires_webgl}`);

say(2, 'load a Touchstone S2P and check the data before believing anything about it');
const s2p = readFileSync(new URL('../test/data/synthetic_two_resonance.s2p', import.meta.url), 'utf8');
console.log(`   ${s2p.split('\n').length} lines · header: ${s2p.split('\n')[2]}`);
console.log('   NOTE: this fixture is SYNTHETIC and says so in its own comments. No measured data exists in this repository.');

say(3, 'identify the RESOLVABLE poles — with a blocked hold-out choosing the order');
const ident = step('identify', await post('/api/v1/labs/smith.identify_resonances/runs',
  { input: { touchstone: s2p, order_max: 8, detection_threshold: 0.01 } }));
for (const m of ident.outputs.modes)
  console.log(`   mode: f0 = ${(m.f0_hz / 1e6).toFixed(6)} MHz · Q = ${m.Q.toFixed(2)} · linewidth = ${(m.linewidth_hz / 1e3).toFixed(2)} kHz`);
console.log(`   order ${ident.outputs.order_selected} by hold-out · train ${ident.outputs.rms_residual_train.toExponential(2)} · ` +
  `holdout ${ident.outputs.rms_residual_holdout.toExponential(2)} · stable: ${ident.outputs.stable}`);
console.log(`   CLAIM: ${ident.outputs.claim}`);

say(4, 'put an interval on each pole by resampling the residuals');
const boot = step('bootstrap', await post('/api/v1/labs/smith.identify_resonances/runs',
  { input: { touchstone: s2p, order_max: 8, bootstrap: 120, seed: 11 } }));
for (const iv of boot.outputs.bootstrap_intervals || [])
  console.log(`   f0 = ${(iv.f0_hz / 1e6).toFixed(6)} MHz · 95% [${(iv.ci95[0] / 1e6).toFixed(6)}, ${(iv.ci95[1] / 1e6).toFixed(6)}] MHz · ${iv.n} resamples`);

say(5, 'transfer as a function of PHYSICAL DISTANCE — geometry in, efficiency out');
const sweep = step('transfer_vs_distance', await post('/api/v1/labs/smith.wireless_transfer/sweep',
  { input: { parameter: 'd_m', values: [0.05, 0.1, 0.2, 0.35, 0.5, 0.8, 1.2],
      r1_m: 0.15, r2_m: 0.15, N1: 10, N2: 10, f_hz: 1e6, R1_ohm: 0.5, R2_ohm: 0.5 } }));
for (const r of sweep.rows)
  console.log(`   d = ${String(r.d_m).padStart(4)} m · M = ${r.outputs.M_H.toExponential(3)} H · k = ${r.outputs.k.toExponential(3)} · ` +
    `eta = ${(100 * r.outputs.eta).toFixed(3)} % · near field: ${r.outputs.near_field_ok}`);
const one = await post('/api/v1/labs/smith.wireless_transfer/runs', { input: { d_m: 0.2, f_hz: 1e6 } });
console.log(`   power balance closes to ${one.outputs.power_balance_residual.toExponential(2)} W`);
console.log(`   the abstract coupled-mode figure U = k sqrt(Q1 Q2) = ${one.outputs.U_cmt.toFixed(4)} is reported as a BENCHMARK, not a distance calculation`);

say(6, 'ask what the service will NOT do, and get a straight answer');
const np = await post('/mcp/call', { tool: 'run_lab', arguments: { lab_id: 'atlas.cmb', input: {} } });
console.log(`   atlas.cmb → ${np.error.code}: ${np.error.message.slice(0, 96)}`);
const op = step('open_problems', await get('/api/v1/open-problems'));
console.log(`   ${op.count} declared open problems, including:`);
for (const p of op.problems.slice(0, 4)) console.log(`     · ${p.lab_id}: ${p.problem.slice(0, 92)}`);

say(7, 'export a report that another machine can check');
mkdirSync(new URL('../artifacts/', import.meta.url), { recursive: true });
report.provenance = { core_version: health.core_version, git_commit: health.git_commit, code_sha256: health.code_sha256 };
const out = new URL('../artifacts/agent-demo-report.json', import.meta.url);
writeFileSync(out, JSON.stringify(report, null, 2) + '\n');
console.log(`   wrote artifacts/agent-demo-report.json · ${report.steps.length} steps · ` +
  `every result carries commit ${health.git_commit.slice(0, 10)} and code hash ${health.code_sha256.slice(0, 12)}`);
console.log('\ndone — no browser was opened at any point.\n');
server.close();
