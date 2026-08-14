import { createServer } from 'node:http';
import { randomUUID } from 'node:crypto';
import { readFileSync, existsSync } from 'node:fs';
import { dirname, join, extname, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';
import { CORE, LABS } from '../core/index.mjs';
import { CORE_VERSION } from '../core/version.mjs';
import { STATUS, STATUS_DOC } from '../core/status.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const PORT = Number(process.env.PORT || 8974);
const started = Date.now();

/* ── JOBS ────────────────────────────────────────────────────────────────────
   Short computations answer inline. Anything the laboratory declares as slow becomes a
   job with progress and an SSE stream, and can be cancelled. No animation frame, no click,
   no WebGL anywhere in this path. */
const RUNS = new Map();
const listeners = new Map();
function emit(id, ev) { for (const res of listeners.get(id) || []) res.write(`data: ${JSON.stringify(ev)}\n\n`); }

function startJob(labId, input) {
  const id = randomUUID();
  const rec = { run_id: id, lab_id: labId, state: 'queued', progress: 0, created_at: new Date().toISOString(),
    cancelled: false, result: null, error: null };
  RUNS.set(id, rec);
  setImmediate(() => {
    if (rec.cancelled) return;
    rec.state = 'running'; emit(id, { state: 'running', progress: 0 });
    try {
      const r = CORE.run(labId, input, { onProgress: p => { rec.progress = p; emit(id, { state: 'running', progress: p }); },
        isCancelled: () => rec.cancelled });
      if (rec.cancelled) { rec.state = 'cancelled'; emit(id, { state: 'cancelled' }); return; }
      rec.result = r; rec.state = 'succeeded'; rec.progress = 1;
      emit(id, { state: 'succeeded', progress: 1, run_id: r.run_id });
    } catch (e) {
      rec.error = { code: e.code || 'ERROR', message: e.message, detail: e.detail || null };
      rec.state = 'failed'; emit(id, { state: 'failed', error: rec.error });
    }
  });
  return rec;
}

const json = (res, code, body) => { const s = JSON.stringify(body, null, 2);
  res.writeHead(code, { 'content-type': 'application/json; charset=utf-8',
    'access-control-allow-origin': '*', 'access-control-allow-headers': '*',
    'access-control-allow-methods': 'GET,POST,DELETE,OPTIONS', 'content-length': Buffer.byteLength(s) });
  res.end(s); };
const errBody = e => ({ error: { code: e.code || 'ERROR', message: e.message, detail: e.detail || null } });

async function readBody(req) {
  const chunks = []; for await (const c of req) chunks.push(c);
  if (!chunks.length) return {};
  try { return JSON.parse(Buffer.concat(chunks).toString('utf8')); }
  catch { throw Object.assign(new Error('request body is not valid JSON'), { code: 'BAD_REQUEST' }); }
}

const MIME = { '.html':'text/html', '.js':'text/javascript', '.mjs':'text/javascript', '.json':'application/json',
  '.css':'text/css', '.png':'image/png', '.svg':'image/svg+xml', '.wasm':'application/wasm', '.s2p':'text/plain' };

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
      statuses: STATUS_DOC, headless: true, requires_webgl: false });

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
        catch (e) { return json(res, e.code === 'NOT_IMPLEMENTED' ? 501 : 422, errBody(e)); } }
      const rec = startJob(id, body.input || body);
      return json(res, 202, { run_id: rec.run_id, state: rec.state,
        links: { self: `/api/v1/runs/${rec.run_id}`, events: `/api/v1/runs/${rec.run_id}/events` } });
    }
    m = p.match(/^\/api\/v1\/labs\/([^/]+)\/sweep$/);
    if (m && req.method === 'POST') { const body = await readBody(req);
      try { return json(res, 200, CORE.sweep(decodeURIComponent(m[1]), body.input || body)); }
      catch (e) { return json(res, 422, errBody(e)); } }
    m = p.match(/^\/api\/v1\/labs\/([^/]+)\/validate$/);
    if (m) { try { return json(res, 200, CORE.validate(decodeURIComponent(m[1]))); }
      catch (e) { return json(res, 422, errBody(e)); } }

    m = p.match(/^\/api\/v1\/runs\/([^/]+)\/events$/);
    if (m) { const id = m[1]; if (!RUNS.has(id)) return json(res, 404, errBody({ code: 'NOT_FOUND', message: 'no such run' }));
      res.writeHead(200, { 'content-type': 'text/event-stream', 'cache-control': 'no-cache',
        connection: 'keep-alive', 'access-control-allow-origin': '*' });
      const arr = listeners.get(id) || []; arr.push(res); listeners.set(id, arr);
      const r = RUNS.get(id); res.write(`data: ${JSON.stringify({ state: r.state, progress: r.progress })}\n\n`);
      req.on('close', () => listeners.set(id, (listeners.get(id) || []).filter(x => x !== res)));
      return; }
    m = p.match(/^\/api\/v1\/runs\/([^/]+)$/);
    if (m) { const id = m[1], rec = RUNS.get(id);
      if (!rec) return json(res, 404, errBody({ code: 'NOT_FOUND', message: 'no such run' }));
      if (req.method === 'DELETE') { rec.cancelled = true; if (rec.state === 'queued' || rec.state === 'running') rec.state = 'cancelled';
        return json(res, 200, { run_id: id, state: rec.state }); }
      return json(res, 200, rec); }

    if (p === '/api/v1/open-problems' || p === '/api/open-problems.json')
      return json(res, 200, CORE.openProblems());

    if (p === '/openapi.json') return json(res, 200, JSON.parse(readFileSync(join(ROOT, 'api/openapi.json'), 'utf8')));
    if (p === '/.well-known/mcp.json') return json(res, 200, JSON.parse(readFileSync(join(ROOT, '.well-known/mcp.json'), 'utf8')));

    /* MCP tool invocation over plain HTTP, so an agent needs no transport of its own */
    if (p === '/mcp/call' && req.method === 'POST') {
      const { tool, arguments: a = {} } = await readBody(req);
      try {
        switch (tool) {
          case 'list_labs':         return json(res, 200, { count: LABS.size, labs: CORE.list() });
          case 'describe_lab':      return json(res, 200, CORE.describe(a.lab_id) || {});
          case 'run_lab':           return json(res, 200, CORE.run(a.lab_id, a.input || {}, {}));
          case 'get_run':           return json(res, 200, RUNS.get(a.run_id) || {});
          case 'cancel_run':        { const r = RUNS.get(a.run_id); if (r) { r.cancelled = true; r.state = 'cancelled'; }
                                      return json(res, 200, r || {}); }
          case 'validate_run':      return json(res, 200, CORE.validate(a.lab_id));
          case 'export_artifact':   return json(res, 200, CORE.export(a.lab_id, a.result, a.format || 'json'));
          case 'list_open_problems':return json(res, 200, CORE.openProblems());
          default: return json(res, 400, errBody({ code: 'UNKNOWN_TOOL', message: `no MCP tool "${tool}"` }));
        }
      } catch (e) { return json(res, e.code === 'NOT_IMPLEMENTED' ? 501 : 422, errBody(e)); }
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

if (process.argv[1] && process.argv[1].endsWith('server.mjs'))
  server.listen(PORT, () => console.log(`HCC compute service on http://127.0.0.1:${PORT}`));
