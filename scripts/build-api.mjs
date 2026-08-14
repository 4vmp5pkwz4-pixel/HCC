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
      responses: { 200: { description: 'result' }, 202: { description: 'job accepted' },
        422: { description: 'DOMAIN_ERROR — inputs are refused, never clamped' },
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
    '/mcp/call': { post: { summary: 'invoke an MCP tool over plain HTTP',
      responses: { 200: { description: 'ok' } } } }
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
  description: 'HCC computational core: 77 laboratories behind one contract, no browser required.',
  transport: { type: 'http', endpoint: '/mcp/call', method: 'POST' },
  tools: [
    { name: 'list_labs', description: 'every laboratory with its id, title, status and cost hint', inputSchema: { type: 'object', properties: {} } },
    { name: 'describe_lab', description: 'the full contract: inputs, outputs, units, assumptions, domain of validity, falsifiers, verifiers',
      inputSchema: { type: 'object', required: ['lab_id'], properties: { lab_id: { type: 'string' } } } },
    { name: 'run_lab', description: 'run a laboratory and get the full result envelope',
      inputSchema: { type: 'object', required: ['lab_id'], properties: { lab_id: { type: 'string' }, input: { type: 'object' } } } },
    { name: 'get_run', description: 'state and result of a job',
      inputSchema: { type: 'object', required: ['run_id'], properties: { run_id: { type: 'string' } } } },
    { name: 'cancel_run', description: 'cancel a job',
      inputSchema: { type: 'object', required: ['run_id'], properties: { run_id: { type: 'string' } } } },
    { name: 'validate_run', description: 'run a laboratory\'s own self-tests and return each check',
      inputSchema: { type: 'object', required: ['lab_id'], properties: { lab_id: { type: 'string' } } } },
    { name: 'export_artifact', description: 'serialise a result as json or csv',
      inputSchema: { type: 'object', required: ['lab_id','result'], properties: { lab_id: { type: 'string' }, result: { type: 'object' }, format: { type: 'string', enum: ['json','csv'] } } } },
    { name: 'list_open_problems', description: 'every declared gap in the atlas, machine-readable',
      inputSchema: { type: 'object', properties: {} } }
  ],
  statuses: STATUS_DOC
};
writeFileSync(join(ROOT, '.well-known/mcp.json'), JSON.stringify(mcp, null, 2) + '\n');

/* ── open problems ───────────────────────────────────────────────────────── */
const op = CORE.openProblems();
/* the named gaps now come FROM THE CORE, so this file and the live endpoint agree */
writeFileSync(join(ROOT, 'api/open-problems.json'), JSON.stringify(op, null, 2) + '\n');

/* ── the instrument half of the manifest, with NAMED outputs ─────────────── */
const mpath = join(ROOT, 'api/manifest.json');
if (existsSync(mpath)) {
  const man = JSON.parse(readFileSync(mpath, 'utf8'));
  man.core = { version: CORE_VERSION, git_commit: CORE.provenance.commit, code_sha256: CORE.provenance.code_sha256 };
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
