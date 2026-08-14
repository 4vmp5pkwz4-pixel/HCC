#!/usr/bin/env node
/* API contract tests + the numeric benchmarks the acceptance criteria name.
   Runs entirely headless: no browser, no WebGL, no animation frame. */
import { readFileSync } from 'node:fs';
import { server, shutdown } from '../server/server.mjs';
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
  ok('and it declares its own bounds, so an agent knows what it may ask for before it is refused',
    h.body.jobs.execution === 'worker_threads' && h.body.jobs.max_active >= 1 && h.body.jobs.max_retained >= h.body.jobs.max_active,
    `jobs run on ${h.body.jobs.execution} · at most ${h.body.jobs.max_active} active (HCC_MAX_ACTIVE_JOBS), ` +
    `${h.body.jobs.max_retained} retained (HCC_MAX_RETAINED_RUNS)`);
  const l = await get('/api/v1/labs');
  ok('GET /api/v1/labs enumerates the whole catalogue in one call',
    l.code === 200 && l.body.count === LABS.size && l.body.labs.length === LABS.size,
    `${l.body.count} laboratories, each with an id, a status and a cost hint`);
  const d = await get('/api/v1/labs/smith.fit_series_rlc');
  ok('GET /api/v1/labs/{id} returns NAMED outputs with types and units — the defect the audit found',
    d.code === 200 && d.body.outputs.every(o => o.name && o.unit !== undefined && !/^\d+$/.test(o.name)),
    `outputs: ${d.body.outputs.map(o => o.name + '[' + o.unit + ']').join(', ')}`);
  const r = await get('/openapi.json'), m = await get('/.well-known/mcp.json');
  ok('/openapi.json is OpenAPI 3.1 and /.well-known/mcp.json advertises the nine tools over Streamable HTTP',
    r.code === 200 && r.body.openapi === '3.1.0' && m.code === 200 && m.body.tools.length === 9 &&
    m.body.transport.jsonrpc === '2.0' && m.body.transport.endpoint === '/mcp' && m.body.transport.legacy.deprecated === true,
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
const IMPLEMENTED = CORE.list().filter(l => l.status !== 'NOT_IMPLEMENTED').map(l => l.id);
for (const id of IMPLEMENTED) {
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
  /* a fixed sleep was enough when jobs ran on setImmediate; a worker thread takes longer to
     start than that, and a test that waits a constant is testing the machine it runs on */
  const settle = async id => { for (let k = 0; k < 100; k++) {
      const r = await get(`/api/v1/runs/${id}`);
      if (r.body.state !== 'running' && r.body.state !== 'queued') return r;
      await new Promise(z => setTimeout(z, 50)); }
    return get(`/api/v1/runs/${id}`); };
  const g = await settle(j.body.run_id);
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


console.log('\n=== 8. The eight kernels extracted from the atlas, not retyped from it ===\n');
{
  const EXTRACTED = ['fbs.zero_point_ladder', 'fibonacci.anyons', 'capacity.conditional_selector',
    'edge.admissibility_no_go', 's3.spectral_operator', 'bianchi_ix.evolution',
    's3.particle_creation', 's3.ebk_quantisation'];
  const missing = EXTRACTED.filter(id => !LABS.has(id));
  ok('all eight are registered, and every one is a kernel rather than a catalogue stub',
    missing.length === 0 && EXTRACTED.every(id => CORE.describe(id).status !== 'NOT_IMPLEMENTED'),
    missing.length ? `absent: ${missing.join(', ')}` : EXTRACTED.map(id => `${id} [${CORE.describe(id).status}]`).join('\n         '));

  /* the whole point of extracting rather than retyping: the number the API returns is
     produced by the SAME code the atlas draws with. If these ever disagree, the extractor
     has silently gone stale and this is where it shows. */
  const A = await import('../core/atlas/extracted.mjs');
  const r = await post('/api/v1/labs/edge.admissibility_no_go/runs', { input: {} });
  ok('the API number and the atlas function are the same number, because they are the same code',
    Math.abs(r.body.outputs.n_naive - A.edgeNaiveRoot(1)) === 0 &&
    Math.abs(r.body.outputs.zeta_eff_needed - A.edgeZetaEff(292, 1)) === 0,
    `naive root ${r.body.outputs.n_naive} · ζ_eff(0) needed ${r.body.outputs.zeta_eff_needed} · identical to the atlas closure, bit for bit`);

  const no = await post('/api/v1/labs/edge.admissibility_no_go/runs', { input: {} });
  ok('the recursion operator reports the manuscript\'s own NO-GO and NEVER returns 292 as a result',
    no.body.outputs.selects_292 === false && no.body.outputs.n_shell === 292 &&
    Math.abs(no.body.outputs.n_naive - 9.286) < 0.01 && no.body.outputs.C_needed > 1e60,
    `root ${no.body.outputs.n_naive.toFixed(6)} · shell 292 is QUOTED, not produced · C_APS would have to be ${no.body.outputs.C_needed.toExponential(2)}`);

  const cap = await post('/api/v1/labs/capacity.conditional_selector/runs', { input: {} });
  ok('the capacity selector is CONDITIONAL and says in a field that N_phi is not derived here',
    cap.body.status === 'CONDITIONAL' && cap.body.outputs.N_phi_derived === false &&
    no.body.outputs.Z_edge_computed === false,
    `N_phi = ${cap.body.outputs.n_phi.toFixed(6)} with N_phi_derived = false; Z_edge_computed = false`);

  const iso = await post('/api/v1/labs/s3.particle_creation/runs',
    { input: { alpha: 0.5, beta_plus: 0, beta_minus: 0, Lambda: 0.5, tauMax: 3 } });
  ok('an isotropic universe creates EXACTLY zero while expanding by six e-folds, and the limit that bounds the claim travels with it',
    iso.body.outputs.n === 0 && iso.body.outputs.alpha_growth > 3 &&
    iso.body.warnings.some(w => /CONFORMALLY COUPLED/.test(w)),
    `n = ${iso.body.outputs.n} after ${iso.body.outputs.alpha_growth.toFixed(4)} e-folds · ` +
    `the warning names the field this holds for`);

  const stub = await get('/api/v1/labs/atlas.sec');
  ok('a visual laboratory with no kernel of its own POINTS at the kernels extracted from it instead of looking empty',
    stub.body.status === 'NOT_IMPLEMENTED' && stub.body.covered_by.length === 4,
    `atlas.sec → ${stub.body.covered_by.join(', ')}`);
}

console.log('\n=== 9. MCP over Streamable HTTP, JSON-RPC 2.0 ===\n');
{
  const rpc = async (method, params, id = 1) => post('/mcp', { jsonrpc: '2.0', id, method, params });
  const init = await rpc('initialize', {});
  ok('initialize returns the protocol version, the server identity and instructions an agent can act on',
    init.body.jsonrpc === '2.0' && !!init.body.result.protocolVersion &&
    init.body.result.serverInfo.name === 'hcc-core' && /refused rather than clamped/.test(init.body.result.instructions),
    `${init.body.result.serverInfo.name} ${init.body.result.serverInfo.version} · protocol ${init.body.result.protocolVersion}`);

  const list = await rpc('tools/list', {}, 2);
  const names = list.body.result.tools.map(t => t.name);
  ok('tools/list advertises nine tools, including the sweep the first transport never had',
    names.length === 9 && names.includes('sweep_lab') && list.body.result.tools.every(t => t.inputSchema.type === 'object'),
    names.join(', '));

  const sw = await rpc('tools/call', { name: 'sweep_lab',
    arguments: { lab_id: 'fibonacci.anyons', parameter: 'n', values: [1, 2, 3, 4, 5, 6, 7, 8] } }, 3);
  const dims = sw.body.result.structuredContent.rows.map(r => r.outputs.dim_total);
  ok('sweep_lab drives a laboratory over a whole parameter range in one call, and the Fibonacci numbers come back',
    !sw.body.result.isError && dims.join(',') === '1,2,3,5,8,13,21,34',
    `dim Fus(n) for n = 1…8 → ${dims.join(', ')}`);

  const refused = await rpc('tools/call', { name: 'run_lab',
    arguments: { lab_id: 'smith.mobius', input: { z_re: 0.5, z_im: 0.5, theta: 99 } } }, 4);
  ok('a REFUSAL comes back as a tool result with isError, not as a transport failure — the agent asked a well-formed question and the honest answer is "no number"',
    refused.code === 200 && refused.body.result.isError === true &&
    refused.body.result.structuredContent.error.code === 'DOMAIN_ERROR',
    refused.body.result.structuredContent.error.message.slice(0, 100));

  const unknown = await rpc('tools/call', { name: 'no_such_tool', arguments: {} }, 5);
  ok('an unknown tool is a JSON-RPC error with the available names attached',
    unknown.body.error.code === -32602 && unknown.body.error.data.available.length === 9,
    unknown.body.error.message);

  const notify = await fetch(B + '/mcp', { method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ jsonrpc: '2.0', method: 'notifications/initialized' }) });
  ok('a notification gets 202 and no body, so a client that sends one does not hang waiting for a reply',
    notify.status === 202 && (await notify.text()) === '', `status ${notify.status}, empty body`);

  const batch = await post('/mcp', [{ jsonrpc: '2.0', id: 'a', method: 'ping' },
    { jsonrpc: '2.0', id: 'b', method: 'tools/list' }]);
  ok('a batch returns one response per request, in order',
    Array.isArray(batch.body) && batch.body.length === 2 && batch.body[0].id === 'a' && batch.body[1].id === 'b',
    `${batch.body.length} responses for 2 requests`);

  const legacy = await fetch(B + '/mcp/call', { method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ tool: 'list_labs', arguments: {} }) });
  ok('the first transport still works and says on the wire that it is superseded, rather than being deleted under an agent that depends on it',
    legacy.status === 200 && legacy.headers.get('deprecation') === 'true' &&
    /rel="successor-version"/.test(legacy.headers.get('link') || ''),
    `Deprecation: ${legacy.headers.get('deprecation')} · Link: ${legacy.headers.get('link')}`);
}

console.log('\n=== 10. Jobs run on worker threads, and the bounds are real ===\n');
{
  const j = await post('/api/v1/labs/bianchi_ix.evolution/runs',
    { async: true, input: { alpha: -0.8, p_minus: 0.7, tauMax: 40 } });
  ok('an async run reports the WORKER THREAD it is on, so it is visibly not blocking the event loop',
    j.code === 202 && Number.isInteger(j.body.thread) && j.body.thread > 0,
    `run ${j.body.run_id.slice(0, 8)} on thread ${j.body.thread}`);

  /* the check that matters: the main thread must still answer while the job runs */
  const t0 = Date.now();
  const h = await get('/api/v1/health');
  const dt = Date.now() - t0;
  ok('the service answers a health check WHILE a job is running — the defect worker threads exist to fix',
    h.code === 200 && dt < 500, `health returned in ${dt} ms with ${h.body.jobs.active} job(s) active`);

  for (let k = 0; k < 40 && (await get(`/api/v1/runs/${j.body.run_id}`)).body.state === 'running'; k++)
    await new Promise(r => setTimeout(r, 100));
  const done = await get(`/api/v1/runs/${j.body.run_id}`);
  ok('and the worker returns a full result envelope through the same contract as the synchronous path',
    done.body.state === 'succeeded' && done.body.result.schema === 'hcc.result/2' && !!done.body.result.git_commit,
    `state ${done.body.state} · class ${done.body.result.outputs.class} · ${Object.keys(done.body.result).length} envelope fields`);

  const started = [];
  for (let k = 0; k < h.body.jobs.max_active + 2; k++)
    started.push(await post('/api/v1/labs/s3.ebk_quantisation/runs',
      { async: true, input: { j: 78, quadrature: 200000, levels: 12 } }));
  const rejected = started.filter(r => r.code === 429);
  ok('past HCC_MAX_ACTIVE_JOBS the service returns 429 BUSY naming the limit, instead of accepting work it cannot do',
    rejected.length > 0 && rejected.every(r => r.body.error.code === 'BUSY' && r.body.error.detail.max_active === h.body.jobs.max_active),
    `${started.filter(r => r.code === 202).length} accepted, ${rejected.length} refused · ${rejected[0].body.error.message.slice(0, 90)}`);

  for (const r of started) if (r.code === 202) await fetch(`${B}/api/v1/runs/${r.body.run_id}`, { method: 'DELETE' });
  const after = await get('/api/v1/runs');
  ok('cancelling releases the slots, and the run index reports the bounds it is holding',
    after.body.active < after.body.max_active && after.body.count <= after.body.max_retained,
    `${after.body.count} runs retained (max ${after.body.max_retained}) · ${after.body.active} active (max ${after.body.max_active})`);
}

console.log(`\n${pass}/${pass + fail} checks pass\n`);
shutdown();
server.close();
process.exit(fail ? 1 : 0);
