#!/usr/bin/env node
/* API contract tests + the numeric benchmarks the acceptance criteria name.
   Runs entirely headless: no browser, no WebGL, no animation frame. */
import { readFileSync } from 'node:fs';
import { server } from '../server/server.mjs';
import { CORE, LABS } from '../core/index.mjs';

let pass = 0, fail = 0;
const ok = (t, c, d = '') => { c ? pass++ : fail++; console.log(`${c ? '  PASS' : '  FAIL'} — ${t}${d ? '\n         ' + d : ''}`); };

const PORT = 8977;
await new Promise(r => server.listen(PORT, r));
const B = `http://127.0.0.1:${PORT}`;
const get = async p => { const r = await fetch(B + p); return { code: r.status, body: await r.json().catch(() => null) }; };
const post = async (p, b) => { const r = await fetch(B + p, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(b) });
  return { code: r.status, body: await r.json().catch(() => null) }; };

console.log('\n=== 1. The service answers without a browser ===\n');
{
  const h = await get('/api/v1/health');
  ok('GET /api/v1/health reports the version, the commit and the code hash, and declares that it needs no WebGL',
    h.code === 200 && h.body.status === 'ok' && h.body.requires_webgl === false && !!h.body.git_commit,
    `core ${h.body.core_version} · commit ${String(h.body.git_commit).slice(0, 10)} · ${h.body.labs} labs, ${h.body.implemented} implemented`);
  const l = await get('/api/v1/labs');
  ok('GET /api/v1/labs enumerates the whole catalogue in one call',
    l.code === 200 && l.body.count === LABS.size && l.body.labs.length === LABS.size,
    `${l.body.count} laboratories, each with an id, a status and a cost hint`);
  const d = await get('/api/v1/labs/smith.fit_series_rlc');
  ok('GET /api/v1/labs/{id} returns NAMED outputs with types and units — the defect the audit found',
    d.code === 200 && d.body.outputs.every(o => o.name && o.unit !== undefined && !/^\d+$/.test(o.name)),
    `outputs: ${d.body.outputs.map(o => o.name + '[' + o.unit + ']').join(', ')}`);
  const r = await get('/openapi.json'), m = await get('/.well-known/mcp.json');
  ok('/openapi.json is OpenAPI 3.1 and /.well-known/mcp.json advertises the eight tools',
    r.code === 200 && r.body.openapi === '3.1.0' && m.code === 200 && m.body.tools.length === 8,
    `${Object.keys(r.body.paths).length} paths · tools: ${m.body.tools.map(t => t.name).join(', ')}`);
  const root = await fetch(B + '/', { redirect: 'manual' });
  ok('the root URL redirects to /HCC/', root.status === 302 && root.headers.get('location') === '/HCC/',
    `${root.status} → ${root.headers.get('location')}`);
}

console.log('\n=== 2. Statuses are load-bearing ===\n');
{
  const r = await post('/api/v1/labs/atlas.hopf/runs', { input: {} });
  ok('a catalogued but unimplemented laboratory returns 501 NOT_IMPLEMENTED and NO number',
    r.code === 501 && r.body.error.code === 'NOT_IMPLEMENTED' && !r.body.outputs,
    r.body.error.message.slice(0, 110));
  const bad = await post('/api/v1/labs/smith.mobius/runs', { input: { z_re: 0.5, z_im: 0.5, theta: 99 } });
  ok('an out-of-domain input is REFUSED with 422, never clamped',
    bad.code === 422 && bad.body.error.code === 'DOMAIN_ERROR', bad.body.error.message.slice(0, 100));
  const op = await get('/api/v1/open-problems');
  ok('every declared gap is machine-readable, including the named ones the atlas carried only in prose',
    op.code === 200 && op.body.count > 80 &&
    ['edge.H_boundary_q', 'capacity.selector', 'phi.physical_origin', 'desi.covariance'].every(id => op.body.problems.some(p => p.lab_id === id)),
    `${op.body.count} open problems · includes H_{∂,q}, the capacity selector, the physical origin of φ and DESI covariance`);
}

console.log('\n=== 3. The numbers the acceptance criteria name ===\n');
{
  const R = 32, L = 1.4e-6, Cc = 470e-12;
  const f = [], zr = [], zi = [];
  for (let k = 0; k < 201; k++) { const x = 4e6 + k * 0.02e6, w = 2 * Math.PI * x;
    f.push(x); zr.push(R); zi.push(w * L - 1 / (w * Cc)); }
  const r = await post('/api/v1/labs/smith.fit_series_rlc/runs', { input: { f_hz: f, z_re: zr, z_im: zi } });
  const o = r.body.outputs;
  ok('the noiseless RLC benchmark recovers R = 32 ohm, L = 1.4 uH, C = 470 pF, f0 = 6.204505656 MHz, Q = 1.705552572',
    Math.abs(o.R - 32) < 1e-9 && Math.abs(o.L - 1.4e-6) < 1e-17 && Math.abs(o.C - 470e-12) < 1e-21 &&
    Math.abs(o.f0 - 6204505.656) < 2 && Math.abs(o.Q - 1.705552572) < 1e-8,
    `R=${o.R.toFixed(9)} L=${(o.L * 1e6).toFixed(9)}uH C=${(o.C * 1e12).toFixed(6)}pF f0=${(o.f0 / 1e6).toFixed(9)}MHz Q=${o.Q.toFixed(9)}`);
  ok('and the result carries its provenance: commit, code hash, units, assumptions, domain of validity and verifiers',
    !!r.body.git_commit && !!r.body.code_sha256 && r.body.output_units.L === 'H' &&
    r.body.assumptions.length > 0 && r.body.domain_of_validity.length > 0,
    `${Object.keys(r.body).length} envelope fields · L is in ${r.body.output_units.L} · ${r.body.assumptions.length} assumptions declared`);
}

console.log('\n=== 4. Every implemented laboratory validates ===\n');
for (const id of ['smith.mobius', 'smith.fit_series_rlc', 'smith.identify_resonances', 'smith.wireless_transfer']) {
  const v = await get(`/api/v1/labs/${id}/validate`);
  ok(`${id} passes its own falsifiable self-tests`, v.code === 200 && v.body.all_pass,
    v.body.checks.map(c => `${c.pass ? '✓' : '✗'} ${c.name}`).join('\n         '));
}

console.log('\n=== 5. External-format ingestion ===\n');
{
  const s2p = readFileSync(new URL('./data/synthetic_two_resonance.s2p', import.meta.url), 'utf8');
  const r = await post('/api/v1/labs/smith.identify_resonances/runs', { input: { touchstone: s2p, order_max: 6 } });
  const o = r.body.outputs;
  ok('a Touchstone S2P file is parsed and its resolvable modes recovered, with the claim bounded in words',
    r.code === 200 && o.n_modes_resolvable === 2 &&
    Math.abs(o.modes[0].f0_hz - 5.0e6) / 5e6 < 1e-6 && Math.abs(o.modes[1].f0_hz - 7.5e6) / 7.5e6 < 1e-6 &&
    /NOT a claim that all resonances/.test(o.claim),
    `modes at ${(o.modes[0].f0_hz / 1e6).toFixed(6)} and ${(o.modes[1].f0_hz / 1e6).toFixed(6)} MHz · ` +
    `${o.calibration_state} · resolution ${(o.resolution_hz / 1e3).toFixed(2)} kHz`);
  ok('and it is labelled UNCALIBRATED, because no calibration was supplied and none is inferred',
    o.calibration_state === 'UNCALIBRATED' && r.body.warnings.some(w => /UNCALIBRATED/.test(w)),
    r.body.warnings[0].slice(0, 120));
}

console.log('\n=== 6. Jobs, cancellation and sweeps ===\n');
{
  const j = await post('/api/v1/labs/smith.wireless_transfer/runs', { async: true, input: { d_m: 0.2 } });
  ok('an async run returns 202 with a job id and an SSE link', j.code === 202 && !!j.body.run_id && !!j.body.links.events,
    `${j.body.run_id.slice(0, 8)} → ${j.body.links.events}`);
  await new Promise(r => setTimeout(r, 120));
  const g = await get(`/api/v1/runs/${j.body.run_id}`);
  ok('GET /api/v1/runs/{id} returns the finished result', g.code === 200 && g.body.state === 'succeeded' && !!g.body.result,
    `state ${g.body.state} · eta ${g.body.result.outputs.eta.toFixed(6)}`);
  const j2 = await post('/api/v1/labs/smith.wireless_transfer/runs', { async: true, input: { d_m: 0.3 } });
  const del = await fetch(`${B}/api/v1/runs/${j2.body.run_id}`, { method: 'DELETE' });
  ok('DELETE /api/v1/runs/{id} cancels', del.status === 200, `state ${(await del.json()).state}`);
  const sw = await post('/api/v1/labs/smith.wireless_transfer/sweep', { input: { parameter: 'd_m', values: [0.1, 0.2, 0.4, 0.8], f_hz: 1e6 } });
  ok('a sweep over physical distance returns one row per value, monotone in coupling',
    sw.code === 200 && sw.body.rows.length === 4 && sw.body.rows.every((r, i, a) => i === 0 || r.outputs.k <= a[i - 1].outputs.k),
    sw.body.rows.map(r => `d=${r.d_m}m k=${r.outputs.k.toExponential(3)} eta=${r.outputs.eta.toFixed(4)}`).join('\n         '));
}

console.log('\n=== 7. MCP over plain HTTP ===\n');
{
  const t = await post('/mcp/call', { tool: 'list_labs', arguments: {} });
  const d = await post('/mcp/call', { tool: 'describe_lab', arguments: { lab_id: 'smith.wireless_transfer' } });
  const r = await post('/mcp/call', { tool: 'run_lab', arguments: { lab_id: 'smith.mobius', input: { z_re: 0.5, z_im: 0.6, theta: 1.5707963267948966 } } });
  ok('an agent can list, describe and run through one MCP endpoint with no transport of its own',
    t.body.count === LABS.size && d.body.id === 'smith.wireless_transfer' && r.body.outputs.route_disagreement < 1e-12,
    `list ${t.body.count} · describe ${d.body.outputs.length} outputs · run route_disagreement ${r.body.outputs.route_disagreement.toExponential(2)}`);
  const np = await post('/mcp/call', { tool: 'run_lab', arguments: { lab_id: 'atlas.cmb', input: {} } });
  ok('and an unimplemented laboratory refuses through MCP too, with the same status',
    np.code === 501 && np.body.error.code === 'NOT_IMPLEMENTED', np.body.error.message.slice(0, 90));
}

console.log(`\n${pass}/${pass + fail} checks pass\n`);
server.close();
process.exit(fail ? 1 : 0);
