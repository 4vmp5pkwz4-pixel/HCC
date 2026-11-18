#!/usr/bin/env node
/* ============================================================================
   WHAT DO THE LABORATORIES HAVE IN COMMON THAT NOBODY WROTE DOWN?

   The atlas declares 505 typed relations between its laboratories by hand, and
   api/invariants.json finds the relations INSIDE each laboratory. This asks the
   question between them, with no declaration to lean on: every instrument that runs
   without a browser (core/atlas/instruments.mjs, the page's own evaluate() lifted
   verbatim) is swept along every numeric input, and three detectors look across
   laboratories for what their laws share:

     EXPONENT   both contain an EXACT power law y ∝ x^p with the same rational p
                (exact: the local log–log slope constant to 1e-7 over the whole sweep)
     CONSTANT   both keep the same exact closed-form constant (api/invariants.json)
     SHAPE      a response of one, swept over its declared range, is the same curve
                as a response of the other once both are rescaled to the unit square
                (correlation ≥ 0.99999, and neither is a power law, an exponential or
                a straight line, which would match anything of their kind)

   Each detector is then scored against what the atlas already declares: how often
   does a pair it links appear among the hand-written relations, against how often a
   random pair of laboratories does? The pairs it links that are NOT declared are
   written out as candidates — for a reader or an agent to examine, not as findings.

   Usage:  node scripts/metalaws.mjs        (writes api/metalaws.json)
           node scripts/metalaws.mjs --check (fails if the file is stale)
   ========================================================================= */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..'), OUT = join(ROOT, 'api', 'metalaws.json');
const M = await import(join(ROOT, 'core/atlas/instruments.mjs'));
const { CORE } = await import(join(ROOT, 'core/index.mjs'));
const N = 33, CAP_MS = 6000, FP = 48;

/* ── the sweep: a pool of worker threads, one task at a time each, every task stopped from outside after HARD_MS ── */
const { Worker } = await import('node:worker_threads'), os = await import('node:os');
const HARD_MS = 20000, ids = Object.keys(M.INSTRUMENTS).sort(), skipped = [];
const pool = (tasks, label) => new Promise(done => { const out = new Array(tasks.length).fill(null); let next = 0, live = 0; if (!tasks.length) return done(out);
  const spawn = () => { const w = new Worker(new URL('./metalaws-sweep.mjs', import.meta.url), { workerData: { module: join(ROOT, 'core/atlas/instruments.mjs'), N, CAP_MS } });
    let timer = null, cur = -1; const feed = () => { if (next >= tasks.length) { w.terminate(); live--; if (!live) done(out); return; } cur = next++;
      timer = setTimeout(() => { process.stderr.write(`  ${label(tasks[cur])}: stopped after ${HARD_MS / 1000} s\n`); w.terminate(); live--; spawn(); }, HARD_MS); w.postMessage(tasks[cur]); };
    w.on('message', m => { clearTimeout(timer); out[cur] = m; feed(); });
    w.on('error', e => { clearTimeout(timer); process.stderr.write(`  ${label(tasks[cur])}: worker error ${e.message}\n`); live--; spawn(); });
    live++; feed(); };
  for (let k = 0; k < Math.min(os.cpus().length, 4); k++) spawn(); });
const swept = await pool(ids, t => t);
const curves = [];
swept.forEach((m, k) => { if (!m) { skipped.push(ids[k]); return; } curves.push(...m.curves); if (m.slow) skipped.push(m.id); if (process.env.METALAWS_VERBOSE) process.stderr.write(`  ${m.id}: ${m.curves.length} curves, ${m.ms} ms\n`); });
skipped.sort();

/* ── each curve: which exact law is it? ──
   A curve is called by a form only if that form reproduces all of its points to 1e-9 of its range: each form below is linear in its
   coefficients after a change of variable, so the test is one least-squares solve and a check of the largest residual — no fitting
   by eye, no tolerance tuned per law. Forms are tried from the fewest coefficients up; the first that holds is the law. */
const TOL = 1e-9;
const lsq = (cols, y) => { /* modified Gram–Schmidt on unit-scaled columns: well conditioned for sweeps over many decades */
  const n = y.length, m = cols.length, sc = cols.map(c => Math.sqrt(c.reduce((a, v) => a + v * v, 0)) || 1), Q = cols.map((c, k) => c.map(v => v / sc[k])), R = Array.from({ length: m }, () => new Array(m).fill(0));
  for (let k = 0; k < m; k++) { for (let i = 0; i < k; i++) { let d = 0; for (let j = 0; j < n; j++) d += Q[i][j] * Q[k][j]; R[i][k] = d; for (let j = 0; j < n; j++) Q[k][j] -= d * Q[i][j]; }
    let nr = 0; for (let j = 0; j < n; j++) nr += Q[k][j] * Q[k][j]; nr = Math.sqrt(nr); if (!(nr > 1e-13)) return null; R[k][k] = nr; for (let j = 0; j < n; j++) Q[k][j] /= nr; }
  const qy = Q.map(q => q.reduce((a, v, j) => a + v * y[j], 0)), c = new Array(m).fill(0);
  for (let k = m - 1; k >= 0; k--) { let v = qy[k]; for (let i = k + 1; i < m; i++) v -= R[k][i] * c[i]; c[k] = v / R[k][k]; }
  return c.map((v, k) => v / sc[k]); };
const maxRes = (y, f) => { let r = 0; for (let j = 0; j < y.length; j++) r = Math.max(r, Math.abs(y[j] - f[j])); return r; };
const RATS = []; for (let d = 1; d <= 6; d++) for (let n = -8 * d; n <= 8 * d; n++) { const p = n / d; if (p && p !== 1 && !RATS.some(q => Math.abs(q.p - p) < 1e-12)) RATS.push({ p, s: d === 1 ? String(n) : `${n}/${d}`, w: Math.abs(n) + d }); }
RATS.sort((a, b) => a.w - b.w || a.p - b.p);
const rat = p => { for (let b = 1; b <= 12; b++) { const a = Math.round(p * b); if (Math.abs(p - a / b) < 1e-7) { const g = (x, y) => y ? g(y, x % y) : Math.abs(x), d = g(a, b); return `${a / d}${b / d === 1 ? '' : '/' + b / d}`; } } return null; };
const ANGLE = new Set(['deg', 'rad']);
function lawOf(c) { const { xs, ys } = c, n = xs.length, lo = Math.min(...ys), hi = Math.max(...ys), span = hi - lo, tol = TOL * Math.max(span, 1e-300);
  if (!(span > 1e-12 * Math.max(Math.abs(hi), Math.abs(lo), 1e-300))) return { kind: 'constant', form: 'constant' };
  const pos = xs.every(x => x > 0), same = ys.every(y => y > 0) || ys.every(y => y < 0), one = xs.map(() => 1);
  const fits = (cols, y = ys, back = null) => { const k = lsq(cols, y); if (!k) return null; let f = y.map((_, j) => cols.reduce((a, col, i) => a + k[i] * col[j], 0)); if (back) f = f.map(back); return maxRes(ys, f) <= tol ? k : null; };
  if (pos && same) { const s = []; for (let j = 1; j < n; j++) s.push(Math.log(Math.abs(ys[j] / ys[j - 1])) / Math.log(xs[j] / xs[j - 1])); const m = s.reduce((a, b) => a + b, 0) / s.length;
    if (Math.max(...s.map(v => Math.abs(v - m))) < 1e-7 * Math.max(1, Math.abs(m))) { const r = rat(m); return { kind: 'power', form: r ? `x^${r}` : 'x^p', p: m, rational: r }; } }
  if (same) { const s = []; for (let j = 1; j < n; j++) s.push(Math.log(Math.abs(ys[j] / ys[j - 1])) / (xs[j] - xs[j - 1])); const m = s.reduce((a, b) => a + b, 0) / s.length;
    if (Math.max(...s.map(v => Math.abs(v - m))) < 1e-7 * Math.max(1e-12, Math.abs(m))) return { kind: 'exponential', form: 'e^{cx}' }; }
  if (fits([one, xs])) return { kind: 'affine', form: 'a+bx' };
  if (pos && fits([one, xs.map(Math.log)])) return { kind: 'law', form: 'a+b·ln x' };
  if (pos) for (const R of RATS) if (fits([one, xs.map(x => Math.pow(x, R.p))])) return { kind: 'law', form: `a+b·x^${R.s}`, p: R.p };
  /* a + b·Rᵗ on a uniform grid t: the ratio of successive differences is constant — an offset exponential in x, or an offset power in ln x */
  { const t = c.log ? xs.map(Math.log) : xs, h = t[1] - t[0]; if (t.every((v, j) => !j || Math.abs((v - t[j - 1]) - h) < 1e-9 * Math.abs(h))) { const r = []; for (let j = 2; j < n; j++) { const d0 = ys[j - 1] - ys[j - 2]; if (Math.abs(d0) < 1e-300) { r.length = 0; break; } r.push((ys[j] - ys[j - 1]) / d0); }
    if (r.length === n - 2 && r.every(v => v > 0)) { const m = r.reduce((a, b) => a + b, 0) / r.length; if (Math.abs(m - 1) > 1e-9 && fits([one, t.map(v => Math.pow(m, (v - t[0]) / h))])) { const q = Math.log(m) / h, rq = rat(q);
      return c.log ? { kind: 'law', form: rq ? `a+b·x^${rq}` : 'a+b·x^p', p: q } : { kind: 'law', form: 'a+b·e^{cx}' }; } } } }
  if (fits([one, xs, xs.map(x => x * x)])) return { kind: 'law', form: 'quadratic' };
  if (fits([one, xs, ys.map((y, j) => -xs[j] * y)], ys, null) && (() => { const k = lsq([one, xs, ys.map((y, j) => -xs[j] * y)], ys); return maxRes(ys, xs.map(x => (k[0] + k[1] * x) / (1 + k[2] * x))) <= tol; })()) return { kind: 'law', form: '(a+bx)/(1+cx)' };
  if (same && fits([one, xs, xs.map(x => x * x)], ys.map(y => y * y), v => Math.sign(ys[0]) * Math.sqrt(Math.max(0, v)))) return { kind: 'law', form: '√(a+bx+cx²)' };
  if (ys.every(y => y !== 0) && fits([one, xs, xs.map(x => x * x)], ys.map(y => 1 / y), v => 1 / v)) return { kind: 'law', form: '1/(a+bx+cx²)' };
  if (same && fits([one, xs, xs.map(x => x * x)], ys.map(y => Math.log(Math.abs(y))), v => Math.sign(ys[0]) * Math.exp(v))) return { kind: 'law', form: 'e^{a+bx+cx²}' };
  if (fits([one, xs, xs.map(x => x * x), xs.map(x => x * x * x)])) return { kind: 'law', form: 'cubic' };
  if (ANGLE.has(c.unitIn)) { const u = xs.map(x => c.unitIn === 'deg' ? x * Math.PI / 180 : x);
    for (const [k, s] of [[1, 'x'], [2, '2x'], [0.5, 'x/2'], [3, '3x'], [4, '4x']]) if (fits([one, u.map(v => Math.cos(k * v)), u.map(v => Math.sin(k * v))])) return { kind: 'law', form: `a+b·cos ${s}+c·sin ${s}` };
    for (const [k, s] of [[1, 'x'], [2, '2x']]) if (u.every(v => Math.abs(Math.sin(k * v)) > 1e-12) && fits([one, u.map(v => 1 / Math.sin(k * v)), u.map(v => Math.cos(k * v) / Math.sin(k * v))])) return { kind: 'law', form: `a+b/sin ${s}+c·cot ${s}` }; }
  if (fits([one, xs, xs.map(x => x * x), xs.map(x => x * x * x), xs.map(x => x ** 4)])) return { kind: 'law', form: 'quartic' };
  if (pos && fits([one, xs.map(Math.log), xs.map(x => Math.log(x) ** 2)])) return { kind: 'law', form: 'a+b·ln x+c·ln²x' };
  if (pos && fits([one, xs.map(Math.log), xs])) return { kind: 'law', form: 'a+b·ln x+cx' };
  if (pos && fits([one, xs, xs.map(x => x * Math.log(x))])) return { kind: 'law', form: 'a+bx+cx·ln x' };
  if (pos && fits([one, xs.map(x => 1 / x), xs.map(x => 1 / (x * x))])) return { kind: 'law', form: 'a+b/x+c/x²' };
  if (pos && fits([one, xs, xs.map(x => 1 / x)])) return { kind: 'law', form: 'a+bx+c/x' };
  return { kind: 'shaped', form: null }; }
for (const c of curves) Object.assign(c, lawOf(c));
for (const c of curves) if (c.kind === 'shaped') { const { xs, ys } = c, n = xs.length, lo = Math.min(...ys), hi = Math.max(...ys);
  /* the fingerprint: the curve on the unit square — x as swept (log or linear) to [0, 1], y min–max to [0, 1], resampled */
  const tx = xs.map(x => c.log ? Math.log(x / xs[0]) / Math.log(xs[n - 1] / xs[0]) : (x - xs[0]) / (xs[n - 1] - xs[0])), fp = [];
  for (let q = 0; q < FP; q++) { const t = q / (FP - 1); let j = 1; while (j < n - 1 && tx[j] < t) j++; const w = (t - tx[j - 1]) / ((tx[j] - tx[j - 1]) || 1); fp.push(((ys[j - 1] + w * (ys[j] - ys[j - 1])) - lo) / (hi - lo)); }
  c.fp = fp; let ext = 0; for (let q = 1; q < FP - 1; q++) if ((fp[q] - fp[q - 1]) * (fp[q + 1] - fp[q]) < 0) ext++; c.extrema = ext;
  /* a step (a boolean, a count, a branch switch) is not a shape: more than a third of the range in one step of 48 */
  c.step = fp.some((v, q) => q && Math.abs(v - fp[q - 1]) > 0.34) || ys.every(y => Number.isInteger(y)); }

/* ── laboratories, and what the atlas already declares between them ── */
const MAN = JSON.parse(readFileSync(join(ROOT, 'api/manifest.json'), 'utf8')), LABINFO = Object.fromEntries(MAN.labs.map(l => [l.id, { title: l.title, world: l.world, category: l.category }]));
const REG = JSON.parse(readFileSync(join(ROOT, 'api/instruments.json'), 'utf8')), LABOF = Object.fromEntries(REG.instruments.map(i => [i.id, i.lab]));
const key = (a, b) => a < b ? a + '|' + b : b + '|' + a;
const typed = CORE.connections({ kind: 'typed' }).connections, declared = new Set(typed.filter(c => c.from !== c.to).map(c => key(c.from, c.to)));
const labs = [...new Set(Object.values(M.INSTRUMENT_META).map(m => m.lab))].sort(), LABSET = new Set(labs), nPairs = labs.length * (labs.length - 1) / 2;
const declaredHere = [...declared].filter(k => { const [a, b] = k.split('|'); return LABSET.has(a) && LABSET.has(b); }), base = declaredHere.length / nPairs;

/* ── the detectors: each puts weight on a pair of laboratories; a class shared by k laboratories gives each of its pairs 1/(k − 1),
      so that a law everybody has binds nobody in particular (the resource-allocation weight of link prediction) ── */
const links = new Map(), classes = [];
const addLink = (a, b, det, w, why) => { if (a === b) return; const k = key(a, b); if (!links.has(k)) links.set(k, { a: k.split('|')[0], b: k.split('|')[1], weight: 0, detectors: {}, why: [] });
  const L = links.get(k); L.detectors[det] = +((L.detectors[det] || 0) + w).toFixed(6); L.weight += w; if (L.why.length < 8 && !L.why.some(x => x.det === det && x.text === why)) L.why.push({ det, text: why }); };
const bind = (det, label, members) => { /* members: [{lab, where}] — one per laboratory */ const by = new Map(); for (const m of members) if (LABSET.has(m.lab) && !by.has(m.lab)) by.set(m.lab, m);
  const L = [...by.values()].sort((a, b) => a.lab.localeCompare(b.lab)); if (L.length < 2) return; classes.push({ detector: det, label, labs: L.map(m => m.lab), where: L.map(m => m.where) });
  const w = 1 / (L.length - 1); for (let i = 0; i < L.length; i++) for (let j = i + 1; j < L.length; j++) addLink(L[i].lab, L[j].lab, det, w, `${label}: ${L[i].where} · ${L[j].where}`); };
const at = c => `${c.id}.${c.output}(${c.input})`;
/* EXPONENT — the same exact power law y ∝ x^p, p rational and not 0 or ±1 (proportionality binds nothing) */
{ const g = new Map(); for (const c of curves) if (c.kind === 'power' && c.rational && !['0', '1', '-1'].includes(c.rational)) { if (!g.has(c.rational)) g.set(c.rational, []); g.get(c.rational).push({ lab: c.lab, where: at(c) }); }
  for (const [p, m] of [...g.entries()].sort()) bind('exponent', `y ∝ x^${p}`, m); }
/* FORM — the same exact law beyond a power: an offset power, a logarithm, a Möbius map, a root of a quadratic, a Lorentzian, a Gaussian, a harmonic */
{ const g = new Map(); for (const c of curves) if (c.kind === 'law') { if (!g.has(c.form)) g.set(c.form, []); g.get(c.form).push({ lab: c.lab, where: at(c) }); }
  for (const [f, m] of [...g.entries()].sort()) bind('form', `y = ${f}`, m); }
/* CONSTANT — the same exact irrational closed form (api/invariants.json): two laboratories that return the same irrational number to twelve digits compute the same mathematics */
const INV = JSON.parse(readFileSync(join(ROOT, 'api/invariants.json'), 'utf8'));
{ const g = new Map(); for (const L of INV.laboratories) for (const side of ['across', 'clock']) for (const k of ((L[side] || {}).constants || [])) { const f = k.form; if (!f || /^[−-]?\d+(\/\d+)?$/.test(f.trim())) continue; /* integers and plain fractions coincide too easily to bind anything: only irrational closed forms */
    if (!g.has(f)) g.set(f, []); g.get(f).push({ lab: LABOF[L.id] || L.id, where: `${L.id}.${k.name}` }); }
  for (const [f, m] of [...g.entries()].sort()) bind('constant', `keeps ${f}`, m); }
/* SHAPE — the same curve that no form above names, under the four reflections of the unit square; it must bend, and not be a step */
const corr = (u, v) => { let su = 0, sv = 0; for (let q = 0; q < FP; q++) { su += u[q]; sv += v[q]; } su /= FP; sv /= FP; let a = 0, b = 0, c2 = 0; for (let q = 0; q < FP; q++) { const x = u[q] - su, y = v[q] - sv; a += x * y; b += x * x; c2 += y * y; } return a / Math.sqrt(b * c2 || 1e-300); };
const variants = fp => [fp, fp.slice().reverse(), fp.map(v => 1 - v), fp.slice().reverse().map(v => 1 - v)], shapes = [];
const bent = fp => { let m = 0; for (let q = 0; q < FP; q++) m = Math.max(m, Math.abs(fp[q] - (fp[0] + (fp[FP - 1] - fp[0]) * q / (FP - 1)))); return m; };
const cand = curves.filter(c => c.kind === 'shaped' && !c.step && bent(c.fp) > 0.08);
for (let i = 0; i < cand.length; i++) for (let j = i + 1; j < cand.length; j++) { const A = cand[i], B = cand[j]; if (A.lab === B.lab) continue;
  let best = -2, how = 0; variants(B.fp).forEach((v, k) => { const r = corr(A.fp, v); if (r > best) { best = r; how = k; } });
  if (best >= 0.99999) shapes.push({ a: A, b: B, corr: best, transform: ['as is', 'x reversed', 'y reversed', 'both reversed'][how] }); }
/* shapes are grouped into families by single linkage: a family shared by k laboratories binds each pair by 1/(k − 1), like the others */
{ const id = new Map(), up = new Map(), find = x => { while (up.get(x) !== x) { up.set(x, up.get(up.get(x))); x = up.get(x); } return x; };
  for (const S of shapes) for (const c of [S.a, S.b]) if (!up.has(c)) up.set(c, c); for (const S of shapes) { const a = find(S.a), b = find(S.b); if (a !== b) up.set(a, b); }
  const fam = new Map(); for (const c of up.keys()) { const r = find(c); if (!fam.has(r)) fam.set(r, []); fam.get(r).push(c); }
  [...fam.values()].map(cs => cs.sort((a, b) => at(a).localeCompare(at(b)))).sort((a, b) => at(a[0]).localeCompare(at(b[0]))).forEach((cs, k) => { cs.forEach(c => id.set(c, k)); bind('shape', `shape family ${k + 1}`, cs.map(c => ({ lab: c.lab, where: at(c) }))); }); }

/* BRIDGE — two laboratories that take the same physical input (same name, same unit) are swept TOGETHER over the overlap of their
   ranges, and every pair of their outputs is tested for an exact algebraic tie, y_B = a + b·y_A or y_B = k·y_A^q with q rational: x
   eliminated, what is left is a law joining the two laboratories. A tie that follows from both curves being powers of x (or both
   straight lines in x) is implied by the exponents and is not counted; what remains means both outputs carry the same hidden function
   of the shared input. */
const GENERIC = new Set(['seed', 'step', 'grid', 'dt', 'time', 'segments', 'shell', 'degree', 'dimension', 'a', 'b', 'v0', 'v1', 'v2', 'alpha', 'beta', 'tau', 'omega', 'lambda', 'coupling', 'rho', 'p', 'n', 'nu', 'sigma', 'k', 'eta', 'h', 'B', 'spin', 'epoch_days', 'epoch_year', 't']);
const isNum = i => typeof i.default === 'number' && Number.isFinite(i.min) && Number.isFinite(i.max) && i.max > i.min;
const shared = new Map(); for (const id of ids) for (const i of M.INSTRUMENT_META[id].inputs) if (isNum(i) && !GENERIC.has(i.name)) { const k = `${i.name} [${i.unit || ''}]`; if (!shared.has(k)) shared.set(k, []); shared.get(k).push({ id, lab: M.INSTRUMENT_META[id].lab, inp: i }); }
const jointTasks = [], jointPairs = [];
for (const [k, list] of [...shared.entries()].sort()) for (let i = 0; i < list.length; i++) for (let j = i + 1; j < list.length; j++) { const A = list[i], B = list[j]; if (A.lab === B.lab || skipped.includes(A.id) || skipped.includes(B.id)) continue;
  const lo = Math.max(A.inp.min, B.inp.min), hi = Math.min(A.inp.max, B.inp.max); if (!(hi > lo)) continue; const lg = lo > 0 && hi / lo >= 30;
  const xs = Array.from({ length: N }, (_, q) => lg ? lo * Math.pow(hi / lo, q / (N - 1)) : lo + (hi - lo) * q / (N - 1));
  const pk = jointPairs.length; jointPairs.push({ key: k, A, B, xs, log: lg }); jointTasks.push({ joint: true, key: pk + 'A', id: A.id, input: A.inp.name, xs }, { joint: true, key: pk + 'B', id: B.id, input: B.inp.name, xs }); }
const jointOut = await pool(jointTasks, t => `${t.id}(${t.input}) joint`), bridges = [];
const powerIn = (xs, ys) => { if (!xs.every(x => x > 0) || !(ys.every(y => y > 0) || ys.every(y => y < 0))) return false; const s = []; for (let j = 1; j < xs.length; j++) s.push(Math.log(ys[j] / ys[j - 1]) / Math.log(xs[j] / xs[j - 1])); const m = s.reduce((a, b) => a + b, 0) / s.length; return Math.max(...s.map(v => Math.abs(v - m))) < 1e-7 * Math.max(1, Math.abs(m)); };
const affineIn = (xs, ys) => { const k = lsq([xs.map(() => 1), xs], ys); if (!k) return false; const lo = Math.min(...ys), hi = Math.max(...ys); return maxRes(ys, xs.map(x => k[0] + k[1] * x)) <= TOL * Math.max(hi - lo, 1e-300); };
const recognise = k => { /* k as r·π^a·√s with r a fraction of denominator ≤ 24 — to 1e-9 — or null */ if (!Number.isFinite(k) || k === 0) return null;
  for (const [a, as] of [[0, ''], [1, 'π'], [-1, '/π'], [2, 'π²'], [-2, '/π²'], [0.5, '√π'], [-0.5, '/√π']]) for (const [sq, ss] of [[1, ''], [2, '√2'], [3, '√3'], [5, '√5'], [0.5, '/√2'], [1 / 3, '/√3']]) {
    const r = k / (Math.pow(Math.PI, a) * Math.sqrt(sq)); for (let d = 1; d <= 24; d++) { const nn = Math.round(r * d); if (nn && Math.abs(nn / d - r) <= 1e-9 * Math.abs(r) && Math.abs(nn) < 10000) { const g = (x, y) => y ? g(y, x % y) : Math.abs(x), gg = g(nn, d), fr = d / gg === 1 ? String(nn / gg) : `${nn / gg}/${d / gg}`;
      return (fr === '1' && (as || ss) ? '' : fr) + (as.startsWith('/') ? '' : as ? '·' + as : '') + (ss && !ss.startsWith('/') ? '·' + ss : '') + (as.startsWith('/') ? as : '') + (ss.startsWith('/') ? ss : ''); } } }
  return null; };
jointPairs.forEach((P, pk) => { const RA = jointOut[2 * pk], RB = jointOut[2 * pk + 1]; if (!RA || !RB) return; const keysA = new Set(), keysB = new Set(); RA.rows.forEach(r => r && Object.keys(r).forEach(k => keysA.add(k))); RB.rows.forEach(r => r && Object.keys(r).forEach(k => keysB.add(k)));
  const col = (R, k) => R.rows.map(r => r && Number.isFinite(r[k]) ? r[k] : NaN), found = [];
  for (const ka of [...keysA].sort()) { const ya0 = col(RA, ka); for (const kb of [...keysB].sort()) { const yb0 = col(RB, kb), ok = P.xs.map((_, q) => Number.isFinite(ya0[q]) && Number.isFinite(yb0[q]));
    if (ok.filter(Boolean).length < Math.ceil(0.85 * N)) continue; const xs = P.xs.filter((_, q) => ok[q]), ya = ya0.filter((_, q) => ok[q]), yb = yb0.filter((_, q) => ok[q]);
    const span = v => Math.max(...v) - Math.min(...v); if (!(span(ya) > 1e-9 * Math.max(...ya.map(Math.abs))) || !(span(yb) > 1e-9 * Math.max(...yb.map(Math.abs)))) continue;
    if ((powerIn(xs, ya) && powerIn(xs, yb)) || (affineIn(xs, ya) && affineIn(xs, yb))) continue; /* implied by the exponents */
    if (ya.every(v => Number.isInteger(v)) || yb.every(v => Number.isInteger(v))) continue; /* counts tie to anything monotone in steps */
    let rel = null; { const k = lsq([ya.map(() => 1), ya], yb); if (k && maxRes(yb, ya.map(v => k[0] + k[1] * v)) <= TOL * span(yb)) rel = { law: Math.abs(k[0]) <= 1e-12 * Math.max(...yb.map(Math.abs)) ? (Math.abs(k[1] - 1) < 1e-9 ? 'equal' : 'proportional') : 'affine', a: k[0], b: k[1] }; }
    if (!rel && (ya.every(v => v > 0) || ya.every(v => v < 0)) && (yb.every(v => v > 0) || yb.every(v => v < 0))) { const la = ya.map(v => Math.log(Math.abs(v))), lb = yb.map(v => Math.log(Math.abs(v))), k = lsq([la.map(() => 1), la], lb);
      if (k && maxRes(lb, la.map(v => k[0] + k[1] * v)) <= 1e-9 * Math.max(span(lb), 1)) { const q = rat(k[1]); if (q && q !== '0') rel = { law: 'power', q, k: Math.sign(yb[0]) * Math.exp(k[0]) * (q === '1' ? 1 : 1) }; } }
    if (!rel) continue; const kk = rel.law === 'power' ? rel.k : rel.b, nm = recognise(kk);
    found.push({ a: `${P.A.id}.${ka}`, b: `${P.B.id}.${kb}`, law: rel.law, q: rel.q || null, constant: kk, closed_form: nm, offset: rel.law === 'affine' ? rel.a : 0, offset_form: rel.law === 'affine' ? recognise(rel.a) : null }); } }
  const RANK = { equal: 0, proportional: 1, power: 2, affine: 3 }; found.sort((x, y) => RANK[x.law] - RANK[y.law] || x.b.localeCompare(y.b) || x.a.localeCompare(y.a));
  const dflt = id => Object.fromEntries(M.INSTRUMENT_META[id].inputs.filter(i => i.default !== undefined).map(i => [i.name, i.default]));
  if (found.length) bridges.push({ input: P.key, labs: [P.A.lab, P.B.lab], instruments: [P.A.id, P.B.id], range: [P.xs[0], P.xs[N - 1]], log: P.log, defaults: [dflt(P.A.id), dflt(P.B.id)], ties: found.length, examples: found.slice(0, 6) }); });
const tieText = e => { const k = v => v.closed_form || (+v.constant).toPrecision(6), neg = e.law === 'affine' && e.constant < 0, kk = neg ? (e.closed_form ? e.closed_form.replace(/^-/, '') : (-e.constant).toPrecision(6)) : k(e), unit = kk === '1' || kk === '';
  return e.law === 'power' ? `${e.b} = ${unit ? '' : kk + ' · '}${e.a}^${e.q}` : e.law === 'affine' ? `${e.b} = ${e.offset_form || (+e.offset).toPrecision(6)} ${neg ? '−' : '+'} ${unit ? '' : kk + ' · '}${e.a}` : e.law === 'equal' ? `${e.b} = ${e.a}` : `${e.b} = ${kk.startsWith('-') ? '−' + kk.slice(1) : kk} · ${e.a}`; };
for (const B of bridges) { const e = B.examples[0], txt = tieText(e);
  addLink(B.labs[0], B.labs[1], 'bridge', 1, `along ${B.input}, ${B.ties} exact tie${B.ties > 1 ? 's' : ''}: ${txt}`); }

/* ── how much each detector agrees with what was declared by hand: rate, lift, and the hypergeometric tail ──
   (draw as many pairs as the detector links out of all pairs of laboratories, of which the declared are marked; how likely is it to
   catch at least as many marked ones by chance?) */
/* ln Γ by Lanczos (g = 7, nine terms) — the same function as the page's mlwLnGamma, so the two agree to the last digits */
const LZ = [0.99999999999980993, 676.5203681218851, -1259.1392167224028, 771.32342877765313, -176.61502916214059, 12.507343278686905, -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7];
const lgam = x => { if (x < 0.5) return Math.log(Math.PI / Math.abs(Math.sin(Math.PI * x))) - lgam(1 - x); x -= 1; let a = LZ[0]; const t = x + 7.5; for (let i = 1; i < 9; i++) a += LZ[i] / (x + i); return 0.5 * Math.log(2 * Math.PI) + (x + 0.5) * Math.log(t) - t + Math.log(a); };
const lchoose = (n, k) => lgam(n + 1) - lgam(k + 1) - lgam(n - k + 1);
const hyperTail = (N, K, n, k) => { /* the page's mlwHyperTail, line for line: the shorter tail summed until a term no longer changes it */
  const lo = Math.max(0, n - (N - K)), hi = Math.min(n, K); if (k <= lo) return 1; if (k > hi) return 0;
  const l0 = lchoose(N, n), term = i => Math.exp(lchoose(K, i) + lchoose(N - K, n - i) - l0), mode = Math.floor((n + 1) * (K + 1) / (N + 2));
  if (k > mode) { let p = 0; for (let i = k; i <= hi; i++) { const t = term(i); p += t; if (t <= p * 1e-17) break; } return Math.min(1, p); }
  let q = 0; for (let i = k - 1; i >= lo; i--) { const t = term(i); q += t; if (t <= q * 1e-17) break; } return Math.min(1, Math.max(0, 1 - q)); };
const validation = { base_rate: base, declared_pairs: declaredHere.length, all_pairs: nPairs };
for (const det of ['exponent', 'form', 'constant', 'shape', 'bridge', 'any']) { const L = [...links.values()].filter(l => det === 'any' || l.detectors[det]); const d = L.filter(l => declared.has(key(l.a, l.b))).length;
  /* the same, counted only over the pairs a detector binds with weight ≥ 1/3 — the ones not drowned in a big class */
  const S = L.filter(l => (det === 'any' ? l.weight : l.detectors[det]) >= 1 / 3 - 1e-9), ds = S.filter(l => declared.has(key(l.a, l.b))).length;
  validation[det] = { pairs: L.length, declared: d, lift: L.length ? +((d / L.length) / base).toFixed(3) : null, p_value: L.length ? hyperTail(nPairs, declaredHere.length, L.length, d) : null,
    strong_pairs: S.length, strong_declared: ds, strong_lift: S.length ? +((ds / S.length) / base).toFixed(3) : null, strong_p_value: S.length ? hyperTail(nPairs, declaredHere.length, S.length, ds) : null }; }

/* the engine audits its own detectors: one whose links are not declared more often than chance (p ≥ 0.01) is kept in the data but does
   not rank candidates — except CONSTANT and BRIDGE, whose links are exact identities (the same irrational number; an exact algebraic tie
   along a shared input) and need no agreement with a human to hold */
const trusted = ['exponent', 'form', 'constant', 'shape', 'bridge'].filter(d => d === 'constant' || d === 'bridge' || (validation[d].p_value != null && validation[d].p_value < 0.01));
for (const l of links.values()) l.evidence = trusted.reduce((a, d) => a + (l.detectors[d] || 0), 0);

/* ── the declared graph on its own predicts its own missing links: Adamic–Adar, checked by holding out each declared edge in turn
      (AUC against every undeclared pair); then each detected candidate is placed on that same scale ── */
const nb = new Map(labs.map(l => [l, new Set()])); for (const k of declaredHere) { const [a, b] = k.split('|'); nb.get(a).add(b); nb.get(b).add(a); }
const aa = (u, v, skip) => { let s = 0; for (const w of nb.get(u)) if (w !== v && nb.get(v).has(w)) { let d = nb.get(w).size; if (skip && (w === skip[0] || w === skip[1])) d--; if (d > 1) s += 1 / Math.log(d); } return s; };
const nonEdges = []; for (let i = 0; i < labs.length; i++) for (let j = i + 1; j < labs.length; j++) if (!declared.has(key(labs[i], labs[j]))) nonEdges.push([labs[i], labs[j]]);
const neScores = nonEdges.map(([u, v]) => aa(u, v)).sort((a, b) => a - b);
let auc = 0; { let tot = 0; for (const k of declaredHere) { const [u, v] = k.split('|'); nb.get(u).delete(v); nb.get(v).delete(u); const s = aa(u, v); nb.get(u).add(v); nb.get(v).add(u);
    let lo2 = 0, hi2 = neScores.length; while (lo2 < hi2) { const m = (lo2 + hi2) >> 1; if (neScores[m] < s) lo2 = m + 1; else hi2 = m; } let eq = lo2; while (eq < neScores.length && neScores[eq] === s) eq++; tot += (lo2 + 0.5 * (eq - lo2)) / neScores.length; } auc = tot / declaredHere.length; }
const pct = s => { let lo2 = 0, hi2 = neScores.length; while (lo2 < hi2) { const m = (lo2 + hi2) >> 1; if (neScores[m] <= s) lo2 = m + 1; else hi2 = m; } return lo2 / neScores.length; };

/* ── communities of the detected graph (greedy modularity, Clauset–Newman–Moore, deterministic) and how they sit against the worlds ── */
const W = new Map(labs.map(l => [l, new Map()])); for (const l of links.values()) { W.get(l.a).set(l.b, l.weight); W.get(l.b).set(l.a, l.weight); }
const deg = new Map(labs.map(l => [l, [...W.get(l).values()].reduce((a, b) => a + b, 0)])), m2 = [...deg.values()].reduce((a, b) => a + b, 0);
let comm = new Map(labs.map((l, i) => [l, i])); { const cw = new Map(), ca = new Map(); labs.forEach((l, i) => ca.set(i, deg.get(l) / m2));
  const between = () => { cw.clear(); for (const l of links.values()) { const a = comm.get(l.a), b = comm.get(l.b); if (a === b) continue; const k = a < b ? a + ',' + b : b + ',' + a; cw.set(k, (cw.get(k) || 0) + l.weight / m2); } };
  for (;;) { between(); let best = 0, pick = null; for (const [k, e] of cw) { const [a, b] = k.split(',').map(Number), dq = 2 * (e - ca.get(a) * ca.get(b)); if (dq > best + 1e-15 || (Math.abs(dq - best) <= 1e-15 && pick && k < pick)) { best = dq; pick = k; } }
    if (!pick) break; const [a, b] = pick.split(',').map(Number); for (const [l, c] of comm) if (c === b) comm.set(l, a); ca.set(a, ca.get(a) + ca.get(b)); ca.delete(b); } }
const Q = (() => { let q = 0; for (const l of links.values()) if (comm.get(l.a) === comm.get(l.b)) q += 2 * l.weight / m2; const tot = new Map(); for (const l of labs) tot.set(comm.get(l), (tot.get(comm.get(l)) || 0) + deg.get(l) / m2); for (const t of tot.values()) q -= t * t; return q; })();
const nmi = (A0, B0) => { const A = A0.map(String), B = B0.map(String), n = A.length, ca2 = new Map(), cb = new Map(), cab = new Map(); A.forEach((a, i) => { ca2.set(a, (ca2.get(a) || 0) + 1); cb.set(B[i], (cb.get(B[i]) || 0) + 1); const k = a + '\u0000' + B[i]; cab.set(k, (cab.get(k) || 0) + 1); });
  const H = c => -[...c.values()].reduce((s, v) => s + v / n * Math.log(v / n), 0); let I = 0; for (const [k, v] of cab) { const [a, b] = k.split('\u0000'); I += v / n * Math.log(v * n / (ca2.get(a) * cb.get(b))); } const h = (H(ca2) + H(cb)) / 2; return h > 0 ? I / h : 0; };
const linked = labs.filter(l => deg.get(l) > 0), groups = [...new Set(linked.map(l => comm.get(l)))].map(c => linked.filter(l => comm.get(l) === c)).filter(g => g.length >= 2).sort((a, b) => b.length - a.length || a[0].localeCompare(b[0]));
const commOf = new Map(); groups.forEach((g, k) => g.forEach(l => commOf.set(l, k)));
const nmiWorld = nmi(linked.map(l => commOf.has(l) ? commOf.get(l) : -1 - labs.indexOf(l)), linked.map(l => (LABINFO[l] || {}).world || '?')), nmiCat = nmi(linked.map(l => commOf.has(l) ? commOf.get(l) : -1 - labs.indexOf(l)), linked.map(l => (LABINFO[l] || {}).category || '?'));

/* ── a place for each laboratory: the spectral embedding of declared ∪ detected (eigenvectors 2–4 of the normalised Laplacian,
      Jacobi, with a weak uniform coupling so that no laboratory is left at the origin) — a picture in which distance means "shares laws" ── */
const n0 = labs.length, A = Array.from({ length: n0 }, () => new Float64Array(n0)), idx = new Map(labs.map((l, i) => [l, i]));
for (const k of declaredHere) { const [a, b] = k.split('|').map(x => idx.get(x)); A[a][b] += 0.5; A[b][a] += 0.5; } for (const l of links.values()) { const a = idx.get(l.a), b = idx.get(l.b); A[a][b] += l.weight; A[b][a] += l.weight; }
for (let i = 0; i < n0; i++) for (let j = 0; j < n0; j++) if (i !== j) A[i][j] += 0.02 / n0;
const dg = A.map(r => r.reduce((a, b) => a + b, 0)), S2 = A.map((r, i) => Array.from(r, (v, j) => (i === j ? 1 : 0) - v / Math.sqrt(dg[i] * dg[j])));
const jacobi = Mx => { const n = Mx.length, a = Mx.map(r => r.slice()), V = Array.from({ length: n }, (_, i) => Array.from({ length: n }, (_, j) => +(i === j)));
  for (let sweep = 0; sweep < 60; sweep++) { let off = 0; for (let p = 0; p < n; p++) for (let q = p + 1; q < n; q++) off += a[p][q] * a[p][q]; if (off < 1e-22) break;
    for (let p = 0; p < n; p++) for (let q = p + 1; q < n; q++) { if (Math.abs(a[p][q]) < 1e-300) continue; const th = (a[q][q] - a[p][p]) / (2 * a[p][q]), t = Math.sign(th || 1) / (Math.abs(th) + Math.sqrt(th * th + 1)), c = 1 / Math.sqrt(t * t + 1), s = t * c;
      for (let k = 0; k < n; k++) { const x = a[k][p], y = a[k][q]; a[k][p] = c * x - s * y; a[k][q] = s * x + c * y; } for (let k = 0; k < n; k++) { const x = a[p][k], y = a[q][k]; a[p][k] = c * x - s * y; a[q][k] = s * x + c * y; }
      for (let k = 0; k < n; k++) { const x = V[k][p], y = V[k][q]; V[k][p] = c * x - s * y; V[k][q] = s * x + c * y; } } }
  return { values: a.map((r, i) => r[i]), V }; };
const E = jacobi(S2), order = E.values.map((v, i) => [v, i]).sort((a, b) => a[0] - b[0]).map(x => x[1]);
const emb = labs.map((l, i) => [1, 2, 3].map(k => { const col = order[k]; let sg = 0; for (let j = 0; j < n0; j++) sg += E.V[j][col] * (j + 1); return E.V[i][col] / Math.sqrt(dg[i]) * Math.sign(sg || 1); }));
/* the spectral picture crowds most laboratories near the centre (its radii are dominated by a few); it is used as the START of a
   deterministic force layout (Fruchterman–Reingold in 3D, 400 cooling steps, the same weights), whose result is what is drawn */
const pos = (() => { const r0 = emb.map(p => Math.hypot(...p)), ordr = r0.map((v, i) => [v, i]).sort((a, b) => a[0] - b[0] || a[1] - b[1]), rk = new Array(n0); ordr.forEach(([v, i], k) => rk[i] = (k + 0.5) / n0);
  const X = emb.map((p, i) => { const d = r0[i] > 1e-12 ? p.map(v => v / r0[i]) : [0, 1, 0]; return d.map(v => v * Math.cbrt(rk[i])); });
  const kk = 1.4 / Math.cbrt(n0), E2 = []; for (let i = 0; i < n0; i++) for (let j = i + 1; j < n0; j++) { const w = A[i][j] - 0.02 / n0; if (w > 1e-9) E2.push([i, j, w]); }
  for (let it = 0; it < 400; it++) { const T = 0.08 * (1 - it / 400) + 0.002, F = X.map(() => [0, 0, 0]);
    for (let i = 0; i < n0; i++) for (let j = i + 1; j < n0; j++) { const d = [0, 1, 2].map(q => X[i][q] - X[j][q]), l = Math.hypot(...d) || 1e-6, f = kk * kk / l; for (let q = 0; q < 3; q++) { F[i][q] += d[q] / l * f; F[j][q] -= d[q] / l * f; } }
    for (const [i, j, w] of E2) { const d = [0, 1, 2].map(q => X[i][q] - X[j][q]), l = Math.hypot(...d) || 1e-6, f = Math.min(4, w) * l * l / kk; for (let q = 0; q < 3; q++) { F[i][q] -= d[q] / l * f; F[j][q] += d[q] / l * f; } }
    for (let i = 0; i < n0; i++) { for (let q = 0; q < 3; q++) F[i][q] -= n0 * kk * kk * X[i][q]; const l = Math.hypot(...F[i]) || 1e-12, st = Math.min(l, T); for (let q = 0; q < 3; q++) X[i][q] += F[i][q] / l * st; } }
  const c = [0, 1, 2].map(q => X.reduce((a, p) => a + p[q], 0) / n0); return X.map(p => p.map((v, q) => v - c[q])); })();
const rad = Math.max(...pos.map(p => Math.hypot(...p))) || 1;

/* ── the report ── */
const all = [...links.values()].map(l => ({ a: l.a, b: l.b, weight: +l.weight.toFixed(6), evidence: +l.evidence.toFixed(6), detectors: l.detectors, declared: declared.has(key(l.a, l.b)), topology: +pct(aa(l.a, l.b)).toFixed(4), why: l.why }))
  .sort((x, y) => y.evidence - x.evidence || y.weight - x.weight || x.a.localeCompare(y.a) || x.b.localeCompare(y.b));
const kinds = {}; for (const c of curves) kinds[c.kind] = (kinds[c.kind] || 0) + 1;
const forms = {}; for (const c of curves) if (c.kind === 'law' || c.kind === 'power' || c.kind === 'exponential' || c.kind === 'affine') { const f = c.kind === 'power' ? 'x^p' : c.form; forms[f] = forms[f] || { curves: 0, labs: new Set() }; forms[f].curves++; forms[f].labs.add(c.lab); }
const exps = {}; for (const c of curves) if (c.kind === 'power' && c.rational) exps[c.rational] = (exps[c.rational] || 0) + 1;
const dens = {}; for (const c of curves) if (c.kind === 'power') { const r = c.rational; const d = r ? (r.includes('/') ? +r.split('/')[1] : 1) : 'irrational'; dens[d] = (dens[d] || 0) + 1; }
const src = createHash('sha256').update(readFileSync(join(ROOT, 'core/atlas/instruments.mjs'))).digest('hex').slice(0, 16);
const V = JSON.parse(readFileSync(join(ROOT, 'version.json'), 'utf8'));
const out = { schema: 'hcc.metalaws/1', version: V.version, build: V.build, instruments_sha16: src,
  method: { sweep: `${N} points per numeric input over its declared range (logarithmic when it spans 30× or more), the others at their defaults; ${CAP_MS / 1000} s per instrument, ${HARD_MS / 1000} s hard stop`,
    laws: `a form names a curve only if it reproduces every point to ${TOL} of its range; forms are linear in their coefficients after a change of variable and are tried from the fewest coefficients up`,
    rational: 'p within 1e-7 of a/b with b ≤ 12 for a pure power; b ≤ 6, |p| ≤ 8 for an offset power',
    shape: `${FP}-point fingerprint on the unit square of a curve no form names; correlation ≥ 0.99999 under the four reflections; it must bend (≥ 0.08 from its chord) and not jump (no step over a third of its range); families by single linkage`,
    constants: 'api/invariants.json named closed forms that are irrational (a surd, φ, π, a logarithm …) — integers and plain fractions coincide too easily to bind anything',
    weight: 'a class shared by k laboratories gives each of its pairs 1/(k − 1); a bridge weighs 1',
    bridge: 'two laboratories with the same physical input (name and unit; counters, seeds and generic symbols left out) swept together over the overlap of their ranges; an exact tie y_B = a + b·y_A or y_B = k·y_A^q (q rational) to 1e-9, not implied by both being powers or straight lines in the input; the constant named as r·π^a·√s when it is one to 1e-9',
    validation: 'declared = the atlas’s typed relations join the two laboratories; hypergeometric tail of catching that many declared pairs by chance; strong = pairs bound with weight ≥ 1/3',
    topology: 'Adamic–Adar on the declared graph; a candidate’s value is the share of undeclared pairs it outranks; the score’s own AUC by leaving each declared edge out',
    communities: 'greedy modularity on the detected graph; NMI against the worlds and categories the atlas assigns',
    layout: 'eigenvectors 2–4 of the normalised Laplacian of declared (½) ∪ detected, with a weak uniform coupling 0.02/n, radii by rank, then 400 cooling steps of a 3D Fruchterman–Reingold layout with the same weights and a gravity n·k²·x that holds the unconnected in' },
  counts: { instruments: Object.keys(M.INSTRUMENTS).length, slow: skipped.length, curves: curves.length, by_kind: kinds, classes: classes.length, shape_matches: shapes.length, links: all.length, undeclared: all.filter(l => !l.declared).length, laboratories: labs.length },
  forms: Object.entries(forms).map(([f, v]) => ({ form: f, curves: v.curves, labs: v.labs.size })).sort((a, b) => b.labs - a.labs || a.form.localeCompare(b.form)),
  exponent_spectrum: Object.entries(exps).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).map(([p, n]) => ({ p, laws: n })), exponent_denominators: dens,
  validation, trusted_detectors: trusted, link_prediction: { score: 'Adamic–Adar', auc_leave_one_out: +auc.toFixed(4) },
  communities: { modularity: +Q.toFixed(4), nmi_world: +nmiWorld.toFixed(4), nmi_category: +nmiCat.toFixed(4), groups: groups.map(g => ({ labs: g, worlds: [...new Set(g.map(l => (LABINFO[l] || {}).world))].sort() })) },
  labs: labs.map((l, i) => ({ id: l, title: (LABINFO[l] || {}).title || l, world: (LABINFO[l] || {}).world || null, category: (LABINFO[l] || {}).category || null, community: commOf.has(l) ? commOf.get(l) : null,
    degree_declared: nb.get(l).size, degree_detected: +deg.get(l).toFixed(4), xyz: pos[i].map(v => +(v / rad).toFixed(5)) })),
  declared: declaredHere.slice().sort(),
  classes: classes.map(c => ({ ...c, weight: +(1 / (c.labs.length - 1)).toFixed(6) })),
  bridges: { shared_inputs: [...shared.entries()].filter(([k, l]) => new Set(l.map(x => x.lab)).size >= 2).map(([k, l]) => ({ input: k, labs: [...new Set(l.map(x => x.lab))].sort() })), pairs_swept: jointPairs.length, found: bridges },
  shape_examples: shapes.sort((x, y) => y.corr - x.corr).slice(0, 60).map(S => ({ a: { lab: S.a.lab, at: at(S.a), log: S.a.log, fp: S.a.fp.map(v => +v.toFixed(4)) }, b: { lab: S.b.lab, at: at(S.b), log: S.b.log, fp: S.b.fp.map(v => +v.toFixed(4)) }, corr: +S.corr.toFixed(8), transform: S.transform })),
  links: all, skipped };
const text = JSON.stringify(out) + '\n';
if (process.argv.includes('--check')) { let old = null; try { old = JSON.parse(readFileSync(OUT, 'utf8')); } catch (e) {}
  if (!old || old.instruments_sha16 !== src) { console.error('STALE: api/metalaws.json was not made from this core/atlas/instruments.mjs — run node scripts/metalaws.mjs'); process.exit(1); } console.log('api/metalaws.json is in step with the instruments'); process.exit(0); }
writeFileSync(OUT, text);
const v = validation; console.log(`metalaws: ${curves.length} curves (${Object.entries(kinds).map(([k, x]) => k + ' ' + x).join(', ')}) · ${classes.length} classes · ${all.length} links, ${all.filter(l => !l.declared).length} undeclared · lift ${['exponent', 'form', 'constant', 'shape', 'bridge', 'any'].map(k => `${k} ${v[k].lift}/${v[k].strong_lift} p=${v[k].p_value && v[k].p_value.toExponential(1)}`).join(', ')} · bridges ${bridges.length} of ${jointPairs.length} · AA AUC ${auc.toFixed(3)} · Q ${Q.toFixed(3)} NMI world ${nmiWorld.toFixed(3)} cat ${nmiCat.toFixed(3)} · ${skipped.length} slow · ${text.length} bytes`);
