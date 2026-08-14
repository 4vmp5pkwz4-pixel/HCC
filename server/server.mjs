import { createServer } from 'node:http';
import { randomUUID } from 'node:crypto';
import { Worker } from 'node:worker_threads';
import { readFileSync, existsSync } from 'node:fs';
import { dirname, join, extname, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';
import { CORE, LABS } from '../core/index.mjs';
import { CORE_VERSION } from '../core/version.mjs';
import { STATUS, STATUS_DOC } from '../core/status.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const PORT = Number(process.env.PORT || 8974);
const started = Date.now();

/* ── BOUNDS, DECLARED AND ENFORCED ───────────────────────────────────────────
   A service with an unbounded job map is a service with an unbounded memory leak, and one
   with unbounded concurrency is a fork bomb an agent can trigger by accident. Both limits
   are read from the environment, reported in /api/v1/health, and enforced with a 429 that
   NAMES the limit it hit — so a client that is being throttled can tell that from a client
   that is broken. */
const MAX_ACTIVE = Math.max(1, Number(process.env.HCC_MAX_ACTIVE_JOBS || 4));
const MAX_RETAINED = Math.max(MAX_ACTIVE, Number(process.env.HCC_MAX_RETAINED_RUNS || 256));

const RUNS = new Map();          // run_id -> record, insertion-ordered
const listeners = new Map();     // run_id -> [res]
const workers = new Map();       // run_id -> Worker
let active = 0;

function emit(id, ev) { for (const res of listeners.get(id) || []) res.write(`data: ${JSON.stringify(ev)}\n\n`); }
function closeStream(id) { for (const res of listeners.get(id) || []) res.end(); listeners.delete(id); }

/* the oldest FINISHED run is evicted first; a running job is never evicted, because a
   client holding its id would then be told the job never existed */
function retain() {
  if (RUNS.size <= MAX_RETAINED) return;
  for (const [id, rec] of RUNS) {
    if (RUNS.size <= MAX_RETAINED) break;
    if (rec.state === 'running' || rec.state === 'queued') continue;
    RUNS.delete(id); listeners.delete(id);
  }
}

function startJob(labId, input) {
  const id = randomUUID();
  const rec = { run_id: id, lab_id: labId, state: 'queued', progress: 0,
    created_at: new Date().toISOString(), cancelled: false, result: null, error: null,
    thread: null, settled: false };
  RUNS.set(id, rec); retain();

  const w = new Worker(join(ROOT, 'server/worker.mjs'), { workerData: { lab_id: labId, input } });
  workers.set(id, w); active++;
  rec.state = 'running'; rec.thread = w.threadId;
  emit(id, { state: 'running', progress: 0, thread: w.threadId });

  /* THE SLOT MUST BE RELEASED EXACTLY ONCE, and from every path out of the job. The first
     version released it only from the worker's own message and exit handlers, and cancel
     set the state to 'cancelled' first — so the exit handler's "was it still running?"
     guard was false, finish never ran, and every cancelled job leaked a slot until the
     service returned 429 for work it was not doing. */
  const finish = () => { if (rec.settled) return; rec.settled = true;
    active = Math.max(0, active - 1); workers.delete(id); w.terminate().catch(() => {}); closeStream(id); };
  rec.finish = finish;
  w.on('message', m => {
    if (m.type === 'progress') { rec.progress = m.progress; emit(id, { state: 'running', progress: m.progress }); return; }
    if (m.type === 'result') { rec.result = m.result; rec.state = 'succeeded'; rec.progress = 1;
      emit(id, { state: 'succeeded', progress: 1, run_id: m.result.run_id }); }
    else if (m.type === 'cancelled') { rec.state = 'cancelled'; emit(id, { state: 'cancelled' }); }
    else if (m.type === 'error') { rec.error = m.error; rec.state = 'failed'; emit(id, { state: 'failed', error: m.error }); }
    finish();
  });
  w.on('error', e => { rec.error = { code: 'WORKER_ERROR', message: e.message, detail: null };
    rec.state = 'failed'; emit(id, { state: 'failed', error: rec.error }); finish(); });
  w.on('exit', () => { if (rec.state === 'running' || rec.state === 'queued') {
    rec.state = rec.cancelled ? 'cancelled' : 'failed';
    if (!rec.cancelled && !rec.error) rec.error = { code: 'WORKER_EXIT', message: 'the worker exited before returning a result', detail: null };
    emit(id, { state: rec.state, error: rec.error }); finish(); } });
  return rec;
}
function cancelJob(rec) {
  rec.cancelled = true;
  const w = workers.get(rec.run_id);
  if (w) w.postMessage({ cancel: true });
  if (rec.state === 'queued' || rec.state === 'running') { rec.state = 'cancelled'; emit(rec.run_id, { state: 'cancelled' }); }
  if (rec.finish) rec.finish();
  return rec;
}
const busy = () => active >= MAX_ACTIVE;
const busyError = () => Object.assign(
  new Error(`${active} of ${MAX_ACTIVE} job slots are in use (HCC_MAX_ACTIVE_JOBS). ` +
    `Retry, or call the laboratory synchronously if it is cheap enough.`),
  { code: 'BUSY', detail: { active, max_active: MAX_ACTIVE, max_retained: MAX_RETAINED } });

const json = (res, code, body, extra = {}) => { const s = JSON.stringify(body, null, 2);
  res.writeHead(code, { 'content-type': 'application/json; charset=utf-8',
    'access-control-allow-origin': '*', 'access-control-allow-headers': '*',
    'access-control-expose-headers': 'deprecation, sunset, link, mcp-session-id',
    'access-control-allow-methods': 'GET,POST,DELETE,OPTIONS', 'content-length': Buffer.byteLength(s), ...extra });
  res.end(s); };
const errBody = e => ({ error: { code: e.code || 'ERROR', message: e.message, detail: e.detail || null } });
const httpCodeFor = e => e.code === 'NOT_IMPLEMENTED' ? 501 : e.code === 'NOT_FOUND' ? 404 : e.code === 'BUSY' ? 429 : 422;

async function readBody(req) {
  const chunks = []; for await (const c of req) chunks.push(c);
  if (!chunks.length) return {};
  try { return JSON.parse(Buffer.concat(chunks).toString('utf8')); }
  catch { throw Object.assign(new Error('request body is not valid JSON'), { code: 'BAD_REQUEST' }); }
}

const MIME = { '.html':'text/html', '.js':'text/javascript', '.mjs':'text/javascript', '.json':'application/json',
  '.css':'text/css', '.png':'image/png', '.svg':'image/svg+xml', '.wasm':'application/wasm', '.s2p':'text/plain' };

/* ── THE MCP TOOLS ───────────────────────────────────────────────────────────
   One table, used by BOTH transports: the JSON-RPC endpoint and the deprecated plain-POST
   one. Two tables would be two contracts, and the older one would rot first. */
export const TOOLS = [
  { name: 'list_labs', description: 'Enumerate every laboratory with its id, title, status and cost hint.',
    inputSchema: { type: 'object', properties: {}, additionalProperties: false },
    call: () => ({ count: LABS.size, labs: CORE.list() }) },
  { name: 'describe_lab', description: 'Full contract of one laboratory: inputs with units and domains, outputs, assumptions, domain of validity, falsifiers, verifiers and open problems.',
    inputSchema: { type: 'object', required: ['lab_id'], properties: { lab_id: { type: 'string' } }, additionalProperties: false },
    call: a => { const d = CORE.describe(a.lab_id);
      if (!d) throw Object.assign(new Error(`no laboratory "${a.lab_id}"`), { code: 'NOT_FOUND' }); return d; } },
  { name: 'run_lab', description: 'Run one laboratory and return the full 28-field provenance envelope. Out-of-domain inputs are REFUSED, never clamped.',
    inputSchema: { type: 'object', required: ['lab_id'], properties: { lab_id: { type: 'string' }, input: { type: 'object' } }, additionalProperties: false },
    call: a => CORE.run(a.lab_id, a.input || {}, {}) },
  { name: 'sweep_lab', description: 'Run one laboratory over an array of values of a single named parameter. Each row reports its own success or refusal; a refused point does not abort the sweep.',
    inputSchema: { type: 'object', required: ['lab_id', 'parameter', 'values'],
      properties: { lab_id: { type: 'string' }, parameter: { type: 'string' },
        values: { type: 'array', items: {} }, input: { type: 'object' } }, additionalProperties: false },
    call: a => CORE.sweep(a.lab_id, { ...(a.input || {}), parameter: a.parameter, values: a.values }) },
  { name: 'get_run', description: 'State, progress and result of an asynchronous run.',
    inputSchema: { type: 'object', required: ['run_id'], properties: { run_id: { type: 'string' } }, additionalProperties: false },
    call: a => { const r = RUNS.get(a.run_id);
      if (!r) throw Object.assign(new Error('no such run'), { code: 'NOT_FOUND' }); return r; } },
  { name: 'cancel_run', description: 'Cancel an asynchronous run; the worker thread is terminated.',
    inputSchema: { type: 'object', required: ['run_id'], properties: { run_id: { type: 'string' } }, additionalProperties: false },
    call: a => { const r = RUNS.get(a.run_id);
      if (!r) throw Object.assign(new Error('no such run'), { code: 'NOT_FOUND' }); return cancelJob(r); } },
  { name: 'validate_run', description: 'Execute a laboratory\'s own falsifiable self-tests and report each one.',
    inputSchema: { type: 'object', required: ['lab_id'], properties: { lab_id: { type: 'string' } }, additionalProperties: false },
    call: a => CORE.validate(a.lab_id) },
  { name: 'export_artifact', description: 'Serialise a result envelope as json or csv.',
    inputSchema: { type: 'object', required: ['lab_id', 'result'],
      properties: { lab_id: { type: 'string' }, result: { type: 'object' }, format: { type: 'string', enum: ['json', 'csv'] } }, additionalProperties: false },
    call: a => CORE.export(a.lab_id, a.result, a.format || 'json') },
  { name: 'list_open_problems', description: 'Every declared gap in the atlas, machine-readable, including the ones it carried only in prose.',
    inputSchema: { type: 'object', properties: {}, additionalProperties: false },
    call: () => CORE.openProblems() }
];
const TOOL = new Map(TOOLS.map(t => [t.name, t]));

/* ── JSON-RPC 2.0 ────────────────────────────────────────────────────────────
   The MCP Streamable HTTP transport. A notification (no id) gets 202 and no body, which is
   what the specification requires and what a client that sends notifications/initialized
   will otherwise hang waiting for. */
const RPC_INVALID_PARAMS = -32602, RPC_METHOD_NOT_FOUND = -32601, RPC_INTERNAL = -32603, RPC_PARSE = -32700;
function rpcHandle(msg) {
  const { id = null, method, params = {} } = msg || {};
  const ok = result => ({ jsonrpc: '2.0', id, result });
  const err = (code, message, data) => ({ jsonrpc: '2.0', id, error: { code, message, ...(data ? { data } : {}) } });
  switch (method) {
    case 'initialize':
      return ok({ protocolVersion: params.protocolVersion || '2025-06-18',
        capabilities: { tools: { listChanged: false } },
        serverInfo: { name: 'hcc-core', version: CORE_VERSION },
        instructions: 'Every result carries its provenance: the commit, the code hash, the units, the ' +
          'assumptions, the domain of validity and a status from a seven-value taxonomy. NOT_IMPLEMENTED ' +
          'and OPEN return no number at all rather than a plausible one, and an out-of-domain input is ' +
          'refused rather than clamped. Nothing in this service is an empirical measurement.' });
    case 'notifications/initialized': return null;              // a notification: no response
    case 'ping': return ok({});
    case 'tools/list':
      return ok({ tools: TOOLS.map(t => ({ name: t.name, description: t.description, inputSchema: t.inputSchema })) });
    case 'tools/call': {
      const t = TOOL.get(params.name);
      if (!t) return err(RPC_INVALID_PARAMS, `no MCP tool "${params.name}"`, { available: TOOLS.map(x => x.name) });
      try {
        const out = t.call(params.arguments || {});
        return ok({ content: [{ type: 'text', text: JSON.stringify(out, null, 2) }], structuredContent: out, isError: false });
      } catch (e) {
        /* a refusal is a RESULT, not a transport failure: the agent asked a well-formed
           question and the honest answer is "no number". isError says so without pretending
           the call never happened. */
        return ok({ content: [{ type: 'text', text: JSON.stringify(errBody(e), null, 2) }],
          structuredContent: errBody(e), isError: true });
      }
    }
    default: return err(RPC_METHOD_NOT_FOUND, `unknown method "${method}"`);
  }
}

export const server = createServer(async (req, res) => {
  const url = new URL(req.url, 'http://x');
  const p = url.pathname;
  if (req.method === 'OPTIONS') return json(res, 204, {});
  try {
    /* the root redirects to the atlas, which is served under /HCC/ */
    if (p === '/') { res.writeHead(302, { location: '/HCC/' }); return res.end(); }

    if (p === '/api/v1/health') return json(res, 200, {
      status: 'ok', core_version: CORE_VERSION, git_commit: CORE.provenance.commit,
      code_sha256: CORE.provenance.code_sha256, uptime_s: (Date.now() - started) / 1000,
      labs: LABS.size, implemented: CORE.list().filter(l => l.status !== STATUS.NOT_IMPLEMENTED).length,
      statuses: STATUS_DOC, headless: true, requires_webgl: false,
      jobs: { active, max_active: MAX_ACTIVE, retained: RUNS.size, max_retained: MAX_RETAINED,
        execution: 'worker_threads' },
      mcp: { jsonrpc: '/mcp', deprecated: '/mcp/call', tools: TOOLS.length } });

    if (p === '/api/v1/labs') return json(res, 200, { schema: 'hcc.labs/1', count: LABS.size, labs: CORE.list() });

    let m = p.match(/^\/api\/v1\/labs\/([^/]+)$/);
    if (m) { const d = CORE.describe(decodeURIComponent(m[1]));
      return d ? json(res, 200, d) : json(res, 404, errBody({ code: 'NOT_FOUND', message: `no laboratory "${m[1]}"` })); }

    m = p.match(/^\/api\/v1\/labs\/([^/]+)\/runs$/);
    if (m && req.method === 'POST') {
      const id = decodeURIComponent(m[1]), body = await readBody(req);
      const lab = LABS.get(id);
      if (!lab) return json(res, 404, errBody({ code: 'NOT_FOUND', message: `no laboratory "${id}"` }));
      const heavy = (lab.describe().cost_hint === 'slow') || body.async === true;
      if (!heavy) { try { return json(res, 200, CORE.run(id, body.input || body, {})); }
        catch (e) { return json(res, httpCodeFor(e), errBody(e)); } }
      if (busy()) return json(res, 429, errBody(busyError()), { 'retry-after': '1' });
      const rec = startJob(id, body.input || body);
      return json(res, 202, { run_id: rec.run_id, state: rec.state, thread: rec.thread,
        links: { self: `/api/v1/runs/${rec.run_id}`, events: `/api/v1/runs/${rec.run_id}/events` } });
    }
    m = p.match(/^\/api\/v1\/labs\/([^/]+)\/sweep$/);
    if (m && req.method === 'POST') { const body = await readBody(req);
      try { return json(res, 200, CORE.sweep(decodeURIComponent(m[1]), body.input || body)); }
      catch (e) { return json(res, httpCodeFor(e), errBody(e)); } }
    m = p.match(/^\/api\/v1\/labs\/([^/]+)\/validate$/);
    if (m) { try { return json(res, 200, CORE.validate(decodeURIComponent(m[1]))); }
      catch (e) { return json(res, httpCodeFor(e), errBody(e)); } }

    m = p.match(/^\/api\/v1\/runs\/([^/]+)\/events$/);
    if (m) { const id = m[1]; if (!RUNS.has(id)) return json(res, 404, errBody({ code: 'NOT_FOUND', message: 'no such run' }));
      res.writeHead(200, { 'content-type': 'text/event-stream', 'cache-control': 'no-cache',
        connection: 'keep-alive', 'access-control-allow-origin': '*' });
      const arr = listeners.get(id) || []; arr.push(res); listeners.set(id, arr);
      const r = RUNS.get(id); res.write(`data: ${JSON.stringify({ state: r.state, progress: r.progress })}\n\n`);
      if (r.state !== 'running' && r.state !== 'queued') res.end();
      req.on('close', () => listeners.set(id, (listeners.get(id) || []).filter(x => x !== res)));
      return; }
    m = p.match(/^\/api\/v1\/runs\/([^/]+)$/);
    if (m) { const id = m[1], rec = RUNS.get(id);
      if (!rec) return json(res, 404, errBody({ code: 'NOT_FOUND', message: 'no such run' }));
      if (req.method === 'DELETE') return json(res, 200, { run_id: id, state: cancelJob(rec).state });
      return json(res, 200, rec); }
    if (p === '/api/v1/runs') return json(res, 200, { schema: 'hcc.runs/1', count: RUNS.size,
      active, max_active: MAX_ACTIVE, max_retained: MAX_RETAINED,
      runs: [...RUNS.values()].map(r => ({ run_id: r.run_id, lab_id: r.lab_id, state: r.state,
        progress: r.progress, created_at: r.created_at })) });

    if (p === '/api/v1/open-problems' || p === '/api/open-problems.json')
      return json(res, 200, CORE.openProblems());

    if (p === '/openapi.json') return json(res, 200, JSON.parse(readFileSync(join(ROOT, 'api/openapi.json'), 'utf8')));
    if (p === '/.well-known/mcp.json') return json(res, 200, JSON.parse(readFileSync(join(ROOT, '.well-known/mcp.json'), 'utf8')));

    /* MCP over Streamable HTTP, JSON-RPC 2.0 */
    if (p === '/mcp') {
      if (req.method === 'GET')   // no server-initiated stream in this build; say so rather than hang
        return json(res, 405, { jsonrpc: '2.0', id: null,
          error: { code: RPC_METHOD_NOT_FOUND, message: 'this server opens no server-initiated SSE stream; POST JSON-RPC to /mcp' } });
      if (req.method !== 'POST') return json(res, 405, errBody({ code: 'METHOD_NOT_ALLOWED', message: req.method }));
      let body;
      try { body = await readBody(req); }
      catch { return json(res, 400, { jsonrpc: '2.0', id: null, error: { code: RPC_PARSE, message: 'parse error' } }); }
      const batch = Array.isArray(body);
      const msgs = batch ? body : [body];
      const out = [];
      for (const msg of msgs) {
        try { const r = rpcHandle(msg); if (r) out.push(r); }
        catch (e) { out.push({ jsonrpc: '2.0', id: msg?.id ?? null, error: { code: RPC_INTERNAL, message: e.message } }); }
      }
      if (!out.length) { res.writeHead(202, { 'access-control-allow-origin': '*' }); return res.end(); }
      /* Streamable HTTP: a client that asked for a stream gets one, otherwise plain JSON */
      const accept = String(req.headers.accept || '');
      if (/text\/event-stream/.test(accept) && !/application\/json/.test(accept)) {
        res.writeHead(200, { 'content-type': 'text/event-stream', 'cache-control': 'no-cache',
          connection: 'keep-alive', 'access-control-allow-origin': '*' });
        for (const r of out) res.write(`data: ${JSON.stringify(r)}\n\n`);
        return res.end();
      }
      return json(res, 200, batch ? out : out[0]);
    }

    /* the first transport, kept working and marked for removal rather than deleted under
       an agent that already depends on it */
    if (p === '/mcp/call' && req.method === 'POST') {
      const { tool, arguments: a = {} } = await readBody(req);
      const dep = { deprecation: 'true', link: '</mcp>; rel="successor-version"',
        warning: '299 - "POST /mcp/call is superseded by JSON-RPC 2.0 at POST /mcp"' };
      const t = TOOL.get(tool);
      if (!t) return json(res, 400, errBody({ code: 'UNKNOWN_TOOL', message: `no MCP tool "${tool}"`,
        detail: { available: TOOLS.map(x => x.name) } }), dep);
      try { return json(res, 200, t.call(a), dep); }
      catch (e) { return json(res, httpCodeFor(e), errBody(e), dep); }
    }

    /* everything else is the static atlas, served under /HCC/ */
    const rel = p.replace(/^\/HCC\/?/, '') || 'index.html';
    const file = join(ROOT, normalize(rel).replace(/^(\.\.[/\\])+/, ''));
    if (existsSync(file) && !file.endsWith('/')) {
      res.writeHead(200, { 'content-type': MIME[extname(file)] || 'application/octet-stream' });
      return res.end(readFileSync(file));
    }
    return json(res, 404, errBody({ code: 'NOT_FOUND', message: p }));
  } catch (e) { return json(res, 500, errBody(e)); }
});

export function shutdown() { for (const w of workers.values()) w.terminate().catch(() => {}); }

if (process.argv[1] && process.argv[1].endsWith('server.mjs'))
  server.listen(PORT, () => console.log(`HCC compute service on http://127.0.0.1:${PORT} · ` +
    `${LABS.size} laboratories, ${CORE.list().filter(l => l.status !== STATUS.NOT_IMPLEMENTED).length} implemented · ` +
    `jobs on worker threads, max ${MAX_ACTIVE} active / ${MAX_RETAINED} retained`));
