#!/usr/bin/env node
/* Generates every machine-facing artifact FROM THE CORE, so none of them can drift:
   api/openapi.json, .well-known/mcp.json, api/open-problems.json, and the instrument half
   of api/manifest.json with NAMED outputs, types, units, ranges and JSON Schema. */
import { writeFileSync, mkdirSync, readFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { CORE, LABS } from '../core/index.mjs';
import { CORE_VERSION } from '../core/version.mjs';
import { STATUS_DOC } from '../core/status.mjs';
/* the tool table is IMPORTED from the server, not restated here. It used to be written out
   twice — once for the descriptor and once for the endpoint — and two copies of a contract
   means the older one is wrong and nothing says which. Importing server.mjs starts no
   listener: it only calls listen() when it is the entry point. */
import { TOOLS } from '../server/server.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
mkdirSync(join(ROOT, 'api'), { recursive: true });
mkdirSync(join(ROOT, '.well-known'), { recursive: true });

const described = [...LABS.keys()].map(id => CORE.describe(id));

/* ── OpenAPI 3.1 ─────────────────────────────────────────────────────────── */
const openapi = {
  openapi: '3.1.0',
  info: { title: 'HCC computational core', version: CORE_VERSION,
    description: 'Every laboratory behind one contract: describe, run, sweep, validate, export, cancel. ' +
      'No browser, no WebGL, no animation frame. Statuses are load-bearing: NOT_IMPLEMENTED is returned ' +
      'in place of a plausible number, and a synthetic self-test is never reported as an empirical result.' },
  servers: [{ url: '/' }],
  paths: {
    '/api/v1/health': { get: { summary: 'liveness, version, commit and code hash',
      responses: { 200: { description: 'ok' } } } },
    '/api/v1/labs': { get: { summary: 'every laboratory in the catalogue', responses: { 200: { description: 'ok' } } } },
    '/api/v1/labs/{id}': { get: { summary: 'the full contract of one laboratory',
      parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
      responses: { 200: { description: 'ok' }, 404: { description: 'no such laboratory' } } } },
    '/api/v1/labs/{id}/runs': { post: { summary: 'run it; short work answers inline, slow work returns a job',
      parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
      requestBody: { content: { 'application/json': { schema: { type: 'object',
        properties: { input: { type: 'object' }, async: { type: 'boolean' } } } } } },
      responses: { 200: { description: 'result' },
        202: { description: 'job accepted; it runs on a worker thread' },
        422: { description: 'DOMAIN_ERROR — inputs are refused, never clamped' },
        429: { description: 'BUSY — HCC_MAX_ACTIVE_JOBS slots are all in use; the limit is named in the error' },
        501: { description: 'NOT_IMPLEMENTED — no number is invented' } } } },
    '/api/v1/labs/{id}/sweep': { post: { summary: 'one parameter over many values',
      parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
      responses: { 200: { description: 'rows' } } } },
    '/api/v1/labs/{id}/validate': { get: { summary: 'run the laboratory\'s own self-tests',
      parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
      responses: { 200: { description: 'checks' } } } },
    '/api/v1/runs/{id}': {
      get: { summary: 'job state and result', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'ok' }, 404: { description: 'no such run' } } },
      delete: { summary: 'cancel', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'cancelled' } } } },
    '/api/v1/runs/{id}/events': { get: { summary: 'server-sent progress events',
      parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
      responses: { 200: { description: 'text/event-stream' } } } },
    '/api/v1/open-problems': { get: { summary: 'every declared gap, machine-readable',
      responses: { 200: { description: 'ok' } } } },
    '/api/v1/runs': { get: { summary: 'every retained job, with the active and retained bounds',
      responses: { 200: { description: 'ok' } } } },
    '/mcp': { post: { summary: 'MCP over Streamable HTTP, JSON-RPC 2.0: initialize, ping, tools/list, tools/call',
      requestBody: { content: { 'application/json': { schema: { type: 'object',
        required: ['jsonrpc', 'method'],
        properties: { jsonrpc: { const: '2.0' }, id: { type: ['string', 'number', 'null'] },
          method: { type: 'string' }, params: { type: 'object' } } } } } },
      responses: { 200: { description: 'a JSON-RPC response, or text/event-stream if the client asked for one' },
        202: { description: 'a notification was accepted and has no response' },
        405: { description: 'this server opens no server-initiated stream' } } } },
    '/mcp/call': { post: { summary: 'DEPRECATED — the first MCP transport, plain POST {tool, arguments}',
      deprecated: true,
      description: 'Superseded by JSON-RPC 2.0 at POST /mcp. Kept working, and every response carries ' +
        'a Deprecation header and a Link to the successor, so a client that already depends on it ' +
        'learns that from the wire rather than from a changelog.',
      responses: { 200: { description: 'ok' }, 400: { description: 'unknown tool' } } } }
  },
  components: { schemas: {
    Status: { type: 'string', enum: Object.keys(STATUS_DOC), description: Object.entries(STATUS_DOC).map(([k, v]) => `${k}: ${v}`).join(' | ') },
    Result: { type: 'object', description: 'the run envelope', required: ['schema','run_id','lab_id','status','outputs'],
      properties: {
        schema: { type: 'string' }, run_id: { type: 'string' }, lab_id: { type: 'string' },
        model_id: { type: 'string' }, equation_ids: { type: 'array', items: { type: 'string' } },
        status: { $ref: '#/components/schemas/Status' },
        core_version: { type: 'string' }, git_commit: { type: ['string','null'] },
        code_sha256: { type: 'string' }, data_sha256: { type: ['string','null'] },
        inputs: { type: 'object' }, input_units: { type: 'object' },
        seed: { type: ['number','null'] }, precision: { type: 'string' },
        assumptions: { type: 'array', items: { type: 'string' } },
        domain_of_validity: { type: 'array', items: { type: 'string' } },
        outputs: { type: 'object' }, output_units: { type: 'object' },
        uncertainty: { type: 'object' }, covariance: { type: ['object','null'] },
        residuals: { type: ['object','null'] }, diagnostics: { type: 'object' },
        warnings: { type: 'array', items: { type: 'string' } },
        verifiers: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array', items: { type: 'object' } },
        started_at: { type: 'string' }, finished_at: { type: 'string' }, duration_ms: { type: 'number' } } },
    ...Object.fromEntries(described.filter(d => d.inputs.length).flatMap(d => [
      [`${d.id}.input`, d.input_schema], [`${d.id}.output`, d.output_schema]]))
  } }
};
writeFileSync(join(ROOT, 'api/openapi.json'), JSON.stringify(openapi, null, 2) + '\n');

/* ── MCP descriptor ──────────────────────────────────────────────────────── */
const mcp = {
  schema: 'mcp/1', name: 'hcc', version: CORE_VERSION,
  description: `HCC computational core: ${LABS.size} laboratories behind one contract ` +
    `(describe · run · sweep · validate · export · cancel), ` +
    `${described.filter(d => d.status !== 'NOT_IMPLEMENTED').length} of them with a computational kernel. ` +
    'No browser, no WebGL, no animation frame.',
  transport: { type: 'streamable-http', endpoint: '/mcp', method: 'POST', jsonrpc: '2.0',
    protocolVersion: '2025-06-18',
    legacy: { endpoint: '/mcp/call', method: 'POST', deprecated: true,
      note: 'plain POST {tool, arguments}; superseded by JSON-RPC 2.0 at /mcp and kept working for clients that already depend on it' } },
  tools: TOOLS.map(t => ({ name: t.name, description: t.description, inputSchema: t.inputSchema })),
  statuses: STATUS_DOC
};
writeFileSync(join(ROOT, '.well-known/mcp.json'), JSON.stringify(mcp, null, 2) + '\n');

/* ── open problems ───────────────────────────────────────────────────────── */
const op = CORE.openProblems();
/* the named gaps now come FROM THE CORE, so this file and the live endpoint agree.

   The COMMIT is the one thing that cannot come along. core/index.mjs reads it at call time
   precisely so the served answer names the commit it is running, and that is right there —
   but a file that is generated and then committed is written BEFORE the commit it would have
   to name, so the snapshot can only ever record its own parent. That is not a stamp that goes
   stale eventually; it is one that is false the instant it is written, and CI asking whether
   the committed contract equals a fresh build could never be satisfied while it was there.

   So the live endpoint keeps the commit, where it is true, and the snapshot drops it, where
   it never can be. What identifies the snapshot is code_sha256 — derived from the core's
   bytes rather than from the history around them, and therefore checkable by anyone holding
   the file. */
const { git_commit: _live, ...opSnapshot } = op;
writeFileSync(join(ROOT, 'api/open-problems.json'), JSON.stringify(opSnapshot, null, 2) + '\n');

/* ── the instrument half of the manifest, with NAMED outputs ─────────────── */
const mpath = join(ROOT, 'api/manifest.json');
if (existsSync(mpath)) {
  const man = JSON.parse(readFileSync(mpath, 'utf8'));
  /* no git_commit here either, and for the same reason: this file is written before the
     commit it would name. The health endpoint reports the commit live; the manifest reports
     the code hash, which is true of the bytes it was built from and stays true. */
  man.core = { version: CORE_VERSION, code_sha256: CORE.provenance.code_sha256 };
  man.contracts = { openapi: '/openapi.json', mcp: '/.well-known/mcp.json', open_problems: '/api/open-problems.json' };
  man.instruments_v2 = described.filter(d => d.inputs.length || d.outputs.length).map(d => ({
    id: d.id, title: d.title, status: d.status, model_id: d.model_id,
    inputs: d.inputs, outputs: d.outputs,
    input_schema: d.input_schema, output_schema: d.output_schema,
    assumptions: d.assumptions, domain_of_validity: d.domain_of_validity,
    falsifiers: d.falsifiers, verifiers: d.verifiers, open_problems: d.open_problems }));
  man.counts.core_labs = LABS.size;
  man.counts.core_implemented = described.filter(d => d.status !== 'NOT_IMPLEMENTED').length;
  writeFileSync(mpath, JSON.stringify(man, null, 2) + '\n');
}
console.log(`openapi ${Object.keys(openapi.paths).length} paths · mcp ${mcp.tools.length} tools · ` +
  `open problems ${op.count} · manifest instruments_v2 ${described.filter(d => d.inputs.length).length}`);
