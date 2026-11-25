#!/usr/bin/env node
/* PREREGISTRATION II — φ and √5 on an independent sample (docs/scale-nexus/PREREGISTRATION_II.md), executed as written.
   Sample: TESS Objects of Interest, dispositions PC/APC, hosts of every confirmed planet excluded, 0.5–25 R⊕, finite errors.
   Models on x = log₁₀(R/R⊕), each convolved with the object's own σ_x: Gaussian mixtures M_mix(K), K by BIC; M_sel (× logistic
   detection efficiency); M_b = M_mix(K*)·[1 + ε cos(2πx/log₁₀b + θ)]/Z, b ∈ {φ, √5}, convolution exact for Gaussians.
   LR by parametric bootstrap (200, seed 4411), Bonferroni α = 0.025, ε CI from 200 TIC-block resamples.
   Usage: node scripts/golden-lattice-replication.mjs --selftest      (synthetic data only: the code checking itself)
          node scripts/golden-lattice-replication.mjs --toi [--out F] (the preregistered analysis) */
import fs from 'node:fs'; import path from 'node:path';
const ROOT = path.join(path.dirname(new URL(import.meta.url).pathname), '..');
export const LAMBDA = { phi: Math.log10((1 + Math.sqrt(5)) / 2), sqrt5: Math.log10(Math.sqrt(5)) };
export function rng(seed) { let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) | 0; let x = Math.imul(a ^ (a >>> 15), 1 | a); x = (x + Math.imul(x ^ (x >>> 7), 61 | x)) ^ x; return ((x ^ (x >>> 14)) >>> 0) / 4294967296; }; }
const gauss = r => { let u = 0, v = 0; while (!u) u = r(); while (!v) v = r(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); };
const LN2PI = Math.log(2 * Math.PI), FLOOR = 0.03;
export function parseCSV(txt) { const lines = txt.split('\n').filter(l => l.trim()), split = l => { const o = []; let c = '', q = false; for (const ch of l) { if (ch === '"') q = !q; else if (ch === ',' && !q) { o.push(c); c = ''; } else c += ch; } o.push(c); return o; };
  const h = split(lines[0]); return lines.slice(1).map(l => { const v = split(l), o = {}; h.forEach((k, i) => o[k] = v[i]); return o; }); }
/* the sample, exactly as preregistered */
export function loadTOI() { const raw = p => fs.readFileSync(path.join(ROOT, 'data/scale-nexus/raw', p), 'utf8');
  const excl = new Set(parseCSV(raw('pscomppars-tic.csv')).map(r => String(r.tic_id || '').replace(/^TIC\s*/, '')).filter(Boolean));
  const rows = parseCSV(raw('toi.csv')), out = [], why = { disp: 0, host: 0, radius: 0, error: 0 };
  for (const r of rows) { if (!['PC', 'APC'].includes(r.tfopwg_disp)) { why.disp++; continue; } if (excl.has(String(r.tid))) { why.host++; continue; }
    const R = +r.pl_rade, e1 = Math.abs(+r.pl_radeerr1), e2 = Math.abs(+r.pl_radeerr2); if (!(R >= 0.5 && R <= 25)) { why.radius++; continue; }
    if (!(Number.isFinite(e1) && Number.isFinite(e2) && e1 > 0 && e2 > 0) || r.pl_radeerr1 === '' || r.pl_radeerr2 === '') { why.error++; continue; }
    out.push({ y: Math.log10(R), s: (e1 + e2) / 2 / (R * Math.LN10), tic: String(r.tid) }); }
  return { data: out, excluded: why, toiRows: rows.length, excludedHosts: excl.size }; }
/* ── the mixture with heteroscedastic errors ── */
const npdf = (y, m, v) => Math.exp(-0.5 * ((y - m) ** 2) / v) / Math.sqrt(2 * Math.PI * v);
export function mixLogL(D, M) { let l = 0; for (const d of D) { let p = 0; for (let k = 0; k < M.w.length; k++) p += M.w[k] * npdf(d.y, M.mu[k], M.s2[k] + d.s * d.s); l += Math.log(Math.max(p, 1e-300)); } return l; }
export function fitMix(D, K, seed, iters) { const r = rng(seed), ys = D.map(d => d.y).sort((a, b) => a - b), n = D.length; let best = null;
  for (let st = 0; st < 8; st++) { let M = { w: Array(K).fill(1 / K), mu: Array.from({ length: K }, (_, k) => ys[Math.min(n - 1, Math.floor(n * ((k + 0.5) / K + (st ? (r() - 0.5) * 0.3 / K : 0))))]), s2: Array(K).fill(0.04) };
    const R = new Float64Array(n * K);
    for (let it = 0; it < (iters || 400); it++) {
      for (let i = 0; i < n; i++) { let t = 0; for (let k = 0; k < K; k++) { const v = M.w[k] * npdf(D[i].y, M.mu[k], M.s2[k] + D[i].s * D[i].s); R[i * K + k] = v; t += v; } for (let k = 0; k < K; k++) R[i * K + k] /= (t || 1e-300); }
      for (let k = 0; k < K; k++) { let sw = 0, sb = 0; for (let i = 0; i < n; i++) { const T = M.s2[k] + D[i].s * D[i].s, b = M.mu[k] + M.s2[k] * (D[i].y - M.mu[k]) / T; sw += R[i * K + k]; sb += R[i * K + k] * b; }
        const mu = sb / sw; let sv = 0; for (let i = 0; i < n; i++) { const T = M.s2[k] + D[i].s * D[i].s, b = M.mu[k] + M.s2[k] * (D[i].y - M.mu[k]) / T, B = M.s2[k] - M.s2[k] * M.s2[k] / T; sv += R[i * K + k] * ((mu - b) ** 2 + B); }
        M.w[k] = sw / n; M.mu[k] = mu; M.s2[k] = Math.max(FLOOR * FLOOR, sv / sw); } }
    const l = mixLogL(D, M); if (!best || l > best.l) best = { ...JSON.parse(JSON.stringify(M)), l }; }
  return { ...best, K, p: 3 * K - 1, bic: -2 * best.l + (3 * K - 1) * Math.log(n), aic: -2 * best.l + 2 * (3 * K - 1) }; }
/* ── the modulated model: exact convolution per component ── */
export function modLogL(D, M, lam, eps, th) { const w2 = 2 * Math.PI / lam; let Z = 1; let zc = 0; for (let k = 0; k < M.w.length; k++) zc += M.w[k] * Math.exp(-0.5 * w2 * w2 * M.s2[k]) * Math.cos(w2 * M.mu[k] + th); Z += eps * zc;
  let l = 0; for (const d of D) { let p = 0; const sg = d.s * d.s; for (let k = 0; k < M.w.length; k++) { const T = M.s2[k] + sg, v = M.s2[k] * sg / T, m = (M.mu[k] * sg + d.y * M.s2[k]) / T;
      p += M.w[k] * npdf(d.y, M.mu[k], T) * (1 + eps * Math.exp(-0.5 * w2 * w2 * v) * Math.cos(w2 * m + th)); } l += Math.log(Math.max(p / Z, 1e-300)); } return l; }
export function fitMod(D, M, lam) { let best = { l: -Infinity, eps: 0, th: 0 };
  for (let i = 0; i <= 20; i++) for (let j = 0; j < 24; j++) { const eps = i / 20, th = 2 * Math.PI * j / 24, l = modLogL(D, M, lam, eps, th); if (l > best.l) best = { l, eps, th }; }
  const gs = (f, a, b) => { const g = (Math.sqrt(5) - 1) / 2; let c = b - g * (b - a), d = a + g * (b - a), fc = f(c), fd = f(d); for (let t = 0; t < 30; t++) { if (fc > fd) { b = d; d = c; fd = fc; c = b - g * (b - a); fc = f(c); } else { a = c; c = d; fc = fd; d = a + g * (b - a); fd = f(d); } } return (a + b) / 2; };
  for (let r = 0; r < 40; r++) { best.th = gs(t => modLogL(D, M, lam, best.eps, t), best.th - 0.6, best.th + 0.6); best.eps = gs(e => modLogL(D, M, lam, e, best.th), Math.max(0, best.eps - 0.1), Math.min(1, best.eps + 0.1)); }
  best.l = modLogL(D, M, lam, best.eps, best.th); return best; }
/* a plain Nelder–Mead maximiser */
export function nmax(f, x0, steps, maxEval) { const n = x0.length; let S = [x0.slice()]; for (let i = 0; i < n; i++) { const y = x0.slice(); y[i] += steps[i]; S.push(y); } let F = S.map(f), ev = n + 1;
  while (ev < maxEval) { const o = F.map((v, i) => [v, i]).sort((a, b) => b[0] - a[0]); S = o.map(([, i]) => S[i]); F = o.map(([v]) => v); const c = Array(n).fill(0); for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) c[j] += S[i][j] / n;
    const rf = c.map((v, j) => v + (v - S[n][j])), fr = f(rf); ev++;
    if (fr > F[0]) { const ex = c.map((v, j) => v + 2 * (v - S[n][j])), fe = f(ex); ev++; if (fe > fr) { S[n] = ex; F[n] = fe; } else { S[n] = rf; F[n] = fr; } }
    else if (fr > F[n - 1]) { S[n] = rf; F[n] = fr; }
    else { const co = c.map((v, j) => v + 0.5 * (S[n][j] - v)), fc = f(co); ev++; if (fc > F[n]) { S[n] = co; F[n] = fc; } else { for (let i = 1; i <= n; i++) { S[i] = S[i].map((v, j) => S[0][j] + 0.5 * (v - S[0][j])); F[i] = f(S[i]); ev++; } } } }
  const i0 = F.indexOf(Math.max(...F)); return { x: S[i0], f: F[i0] }; }
/* the modulated model fitted jointly: the grid point, then every mixture parameter with ε and θ by Nelder–Mead */
export function fitModJoint(D, M, lam, maxEval) { const g = fitMod(D, M, lam), K = M.w.length;
  const pack = p => { const w = p.slice(0, K).map(Math.exp), sw = w.reduce((a, b) => a + b, 0); return { M: { w: w.map(x => x / sw), mu: p.slice(K, 2 * K), s2: p.slice(2 * K, 3 * K).map(x => Math.max(FLOOR * FLOOR, Math.exp(x))) }, eps: 1 / (1 + Math.exp(-p[3 * K])), th: p[3 * K + 1] }; };
  const f = p => { const P = pack(p); return modLogL(D, P.M, lam, P.eps, P.th); }, e0 = Math.min(0.98, Math.max(0.02, g.eps));
  const x0 = [...M.w.map(Math.log), ...M.mu, ...M.s2.map(Math.log), Math.log(e0 / (1 - e0)), g.th], st = [...Array(K).fill(0.2), ...Array(K).fill(0.03), ...Array(K).fill(0.2), 0.8, 0.5];
  const r = nmax(f, x0, st, maxEval || 1200), P = pack(r.x); return r.f >= g.l ? { l: r.f, eps: P.eps, th: P.th, M: P.M } : { ...g, M }; }
/* ── M_sel: mixture × logistic efficiency, normalised in σ bins ── */
export function fitSel(D, M) { const nb = 12, ss = D.map(d => d.s).sort((a, b) => a - b), edges = Array.from({ length: nb + 1 }, (_, i) => ss[Math.min(ss.length - 1, Math.floor(i * ss.length / nb))]), bin = s => { let b = 0; while (b < nb - 1 && s > edges[b + 1]) b++; return b; }, bs = Array.from({ length: nb }, (_, b) => (edges[b] + edges[b + 1]) / 2);
  const K = M.w.length, pack = p => { const w = p.slice(0, K).map(Math.exp), sw = w.reduce((a, b) => a + b, 0); return { w: w.map(x => x / sw), mu: p.slice(K, 2 * K), s2: p.slice(2 * K, 3 * K).map(x => Math.max(FLOOR * FLOOR, Math.exp(x))), x0: p[3 * K], lw: p[3 * K + 1] }; };
  const ll = p => { const P = pack(p), w = Math.exp(P.lw), S = x => 1 / (1 + Math.exp(-(x - P.x0) / w)), Z = bs.map(s => { let z = 0; for (let x = -1; x <= 2; x += 0.01) { let g = 0; for (let k = 0; k < K; k++) g += P.w[k] * npdf(x, P.mu[k], P.s2[k] + s * s); z += g * S(x) * 0.01; } return z; });
    let l = 0; for (const d of D) { let g = 0; for (let k = 0; k < K; k++) g += P.w[k] * npdf(d.y, P.mu[k], P.s2[k] + d.s * d.s); l += Math.log(Math.max(g * S(d.y) / Z[bin(d.s)], 1e-300)); } return l; };
  let x = [...M.w.map(Math.log), ...M.mu, ...M.s2.map(Math.log), -0.3, Math.log(0.1)], n = x.length, S = [x]; for (let i = 0; i < n; i++) { const y = x.slice(); y[i] += i < K ? 0.3 : i < 2 * K ? 0.05 : i < 3 * K ? 0.3 : 0.2; S.push(y); }
  let F = S.map(ll), evals = n + 1;
  while (evals < 6000) { const o = F.map((f, i) => [f, i]).sort((a, b) => b[0] - a[0]); S = o.map(([, i]) => S[i]); F = o.map(([f]) => f); const c = Array(n).fill(0); for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) c[j] += S[i][j] / n;
    const ref = c.map((v, j) => v + (v - S[n][j])), fr = ll(ref); evals++;
    if (fr > F[0]) { const ex = c.map((v, j) => v + 2 * (v - S[n][j])), fe = ll(ex); evals++; if (fe > fr) { S[n] = ex; F[n] = fe; } else { S[n] = ref; F[n] = fr; } }
    else if (fr > F[n - 1]) { S[n] = ref; F[n] = fr; }
    else { const co = c.map((v, j) => v + 0.5 * (S[n][j] - v)), fco = ll(co); evals++; if (fco > F[n]) { S[n] = co; F[n] = fco; } else { for (let i = 1; i <= n; i++) { S[i] = S[i].map((v, j) => S[0][j] + 0.5 * (v - S[0][j])); F[i] = ll(S[i]); evals++; } } } }
  const i0 = F.indexOf(Math.max(...F)), P = pack(S[i0]), p = 3 * K + 1; return { l: F[i0], x0: P.x0, w: Math.exp(P.lw), p, bic: -2 * F[i0] + p * Math.log(D.length), aic: -2 * F[i0] + 2 * p }; }
/* ── simulation from a fitted mixture (± modulation by rejection) with resampled σ ── */
export function simulate(M, sigmas, n, r, mod) { const out = []; while (out.length < n) { let u = r(), k = 0; while (k < M.w.length - 1 && (u -= M.w[k]) > 0) k++;
    const x = M.mu[k] + Math.sqrt(M.s2[k]) * gauss(r); if (mod && r() * (1 + mod.eps) > 1 + mod.eps * Math.cos(2 * Math.PI * x / mod.lam + mod.th)) continue;
    const s = sigmas[Math.floor(r() * sigmas.length)]; out.push({ y: x + s * gauss(r), s, tic: 'sim' + out.length }); } return out; }
export function rayleigh(D, lam) { let x = 0, y = 0; for (const d of D) { const t = 2 * Math.PI * d.y / lam; x += Math.cos(t); y += Math.sin(t); } return { R: Math.hypot(x, y) / D.length, Z: (x * x + y * y) / D.length }; }
export function analyse(D, opts) { const o = opts || {}, B = o.B ?? 200, seed = o.seed ?? 4411, fits = []; for (let K = 1; K <= 5; K++) fits.push(fitMix(D, K, seed + K));
  const star = fits.reduce((a, b) => b.bic < a.bic ? b : a), sel = o.noSel ? null : fitSel(D, star), sig = D.map(d => d.s), r = rng(seed), res = { n: D.length, Kstar: star.K, models: {} };
  fits.forEach(f => res.models['mix' + f.K] = { logL: f.l, params: f.p, bic: f.bic, aic: f.aic }); if (sel) res.models.sel = { logL: sel.l, params: sel.p, bic: sel.bic, aic: sel.aic, x0: sel.x0, width: sel.w };
  res.mixture = { w: star.w, mu: star.mu, sd: star.s2.map(Math.sqrt) };
  for (const [name, lam] of Object.entries(LAMBDA)) { const m = fitModJoint(D, star, lam), LR = 2 * (m.l - star.l), pb = 2, bic = -2 * m.l + (star.p + pb) * Math.log(D.length), aic = -2 * m.l + 2 * (star.p + pb);
    const LRs = [], epsNull = []; for (let b = 0; b < B; b++) { const S = simulate(star, sig, D.length, r), f = fitMix(S, star.K, seed + 100 + b, 150), mm = fitModJoint(S, f, lam, o.jointEval); LRs.push(2 * (mm.l - f.l)); epsNull.push(mm.eps); }
    epsNull.sort((a, b) => a - b); const epsNull95 = epsNull[Math.min(epsNull.length - 1, Math.floor(0.95 * epsNull.length))];
    const p = (1 + LRs.filter(x => x >= LR).length) / (1 + B);
    /* ε CI by TIC blocks */
    const blocks = new Map(); for (const d of D) { if (!blocks.has(d.tic)) blocks.set(d.tic, []); blocks.get(d.tic).push(d); } const BL = [...blocks.values()], eps = [];
    for (let b = 0; b < (o.Bci ?? B); b++) { const S = []; for (let i = 0; i < BL.length; i++) S.push(...BL[Math.floor(r() * BL.length)]); const f = fitMix(S, star.K, seed + 900 + b, 150); eps.push(fitModJoint(S, f, lam, o.jointEval).eps); }
    eps.sort((a, b) => a - b); const ci = [eps[Math.floor(0.025 * eps.length)], eps[Math.min(eps.length - 1, Math.floor(0.975 * eps.length))]];
    const passes = p < 0.025 && ci[0] > epsNull95 && bic < star.bic - 10;
    res.models[name] = { logL: m.l, params: star.p + pb, bic, aic, eps: m.eps, theta: m.th, LR, p, epsCI95: ci, epsNull95, rayleigh: rayleigh(D, lam), passes }; }
  /* specificity: a base is named only if it passes and its LR is not exceeded by the other base's */
  const names = Object.keys(LAMBDA); for (const nm of names) { const me = res.models[nm], other = res.models[names.find(x => x !== nm)];
    me.verdict = !me.passes ? 'not replicated' : (other.passes && other.LR > me.LR) ? 'a modulation is present but the base is not identified as this one' : 'replicated in this sample (a candidate feature, not a discovery)'; }
  return res; }
if (import.meta.url === `file://${process.argv[1]}`) { const args = process.argv.slice(2);
  if (args.includes('--selftest')) { /* synthetic only: a 3-population mixture, with and without a √5 modulation of ε = 0.3 */ const r = rng(7), M = { w: [0.35, 0.45, 0.2], mu: [0.12, 0.42, 1.05], s2: [0.07 ** 2, 0.09 ** 2, 0.1 ** 2] }, sig = Array.from({ length: 300 }, () => 0.02 + 0.04 * r());
    const out = {}; for (const [k, mod] of [['null', null], ['sqrt5_eps0.3', { eps: 0.3, lam: LAMBDA.sqrt5, th: 1 }]]) { const D = simulate(M, sig, 2500, r, mod); out[k] = analyse(D, { B: 20, Bci: 10, noSel: true, jointEval: 800 }); }
    console.log(JSON.stringify(Object.fromEntries(Object.entries(out).map(([k, v]) => [k, { K: v.Kstar, phi: { p: v.models.phi.p, eps: v.models.phi.eps, LR: v.models.phi.LR, v: v.models.phi.verdict }, sqrt5: { p: v.models.sqrt5.p, eps: v.models.sqrt5.eps, ci: v.models.sqrt5.epsCI95, n95: v.models.sqrt5.epsNull95, LR: v.models.sqrt5.LR, v: v.models.sqrt5.verdict } }])), null, 1)); }
  if (args.includes('--toi')) { const T = loadTOI(), res = { protocol: 'docs/scale-nexus/PREREGISTRATION_II.md', sample: { n: T.data.length, toiRows: T.toiRows, excluded: T.excluded, excludedHosts: T.excludedHosts, tics: new Set(T.data.map(d => d.tic)).size }, seed: 4411, bootstrap: 200, ...analyse(T.data, { B: 200, Bci: 100, jointEval: 800 }) };
    const o = args.indexOf('--out'), txt = JSON.stringify(res, null, 1); if (o >= 0) fs.writeFileSync(args[o + 1], txt + '\n'); console.log(txt); } }
