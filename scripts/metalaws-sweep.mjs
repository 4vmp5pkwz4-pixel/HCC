/* worker for scripts/metalaws.mjs: sweeps one instrument at a time along each numeric input and posts the raw curves back.
   Runs in a worker thread so that one instrument that does not return can be stopped from outside without stopping the others. */
import { parentPort, workerData } from 'node:worker_threads';
const M = await import(workerData.module);
const { N, CAP_MS } = workerData;
const numeric = i => typeof i.default === 'number' && Number.isFinite(i.min) && Number.isFinite(i.max) && i.max > i.min;
const grid = i => { const lg = i.min > 0 && i.max / i.min >= 30, out = [];
  for (let k = 0; k < N; k++) { const f = k / (N - 1); out.push(lg ? i.min * Math.pow(i.max / i.min, f) : i.min + (i.max - i.min) * f); } return { xs: out, log: lg }; };
const flat = o => { const out = {}; for (const [k, v] of Object.entries(o || {})) if (typeof v === 'number' && Number.isFinite(v)) out[k] = v; return out; };
parentPort.on('message', msg => {
  if (msg && msg.joint) { /* a joint sweep: one instrument at the given values of one input, the others at their defaults */
    const meta = M.INSTRUMENT_META[msg.id], fn = M.INSTRUMENTS[msg.id], defs = Object.fromEntries(meta.inputs.map(i => [i.name, i.default]));
    const rows = msg.xs.map(x => { try { return flat(fn({ ...defs, ...(msg.extra || {}), [msg.input]: x })); } catch (e) { return null; } });
    parentPort.postMessage({ joint: true, key: msg.key, rows }); return; }
  const id = msg;
  const meta = M.INSTRUMENT_META[id], fn = M.INSTRUMENTS[id], defs = Object.fromEntries(meta.inputs.map(i => [i.name, i.default]));
  const t0 = Date.now(), curves = []; let slow = false;
  for (const inp of meta.inputs.filter(numeric)) { if (Date.now() - t0 > CAP_MS) { slow = true; break; }
    const G = grid(inp), rows = [];
    for (const x of G.xs) { if (Date.now() - t0 > CAP_MS) { slow = true; break; } let o = null; try { o = flat(fn({ ...defs, [inp.name]: x })); } catch (e) { o = null; } rows.push(o); }
    if (rows.length < N) break;
    const keys = new Set(); rows.forEach(r => r && Object.keys(r).forEach(k => keys.add(k)));
    for (const k of [...keys].sort()) { const xs = [], ys = []; rows.forEach((r, j) => { if (r && Number.isFinite(r[k])) { xs.push(G.xs[j]); ys.push(r[k]); } });
      if (xs.length >= Math.ceil(0.85 * N)) curves.push({ id, lab: meta.lab, input: inp.name, unitIn: inp.unit || null, output: k, log: G.log, xs, ys }); } }
  parentPort.postMessage({ id, curves, slow, ms: Date.now() - t0 });
});
