/* golden-lattice-exploration-sel.mjs — POST-HOC EXPLORATION, a declared deviation from PREREGISTRATION_II.md
   Replication II found p = 0.005 for a √5 modulation of the TOI radii against the preregistered null M_mix(K*), and
   "not replicated" by the preregistered rule. The same run showed the selection model M_sel to be far better than
   M_mix (ΔBIC ≈ −162): the null of the primary test omitted the detection edge. This script asks one diagnostic
   question that was NOT preregistered: does the modulation survive when the null contains the selection?
     null:        M_sel  = mixture(K*) ⊗ errors × logistic efficiency S(y), normalised per σ bin;
     alternative: M_sel,b = the same with the latent mixture modulated by 1 + ε cos(2πx/log₁₀b + θ).
   LR calibrated by a parametric bootstrap under the fitted M_sel (seed 4415). Whatever comes out, this is
   exploration: it cannot confirm anything, because the data, the bases and the question were all seen first. */
import fs from 'node:fs'; import path from 'node:path';
import { loadTOI, fitMix, nmax, rng } from './golden-lattice-replication.mjs';
const ROOT = path.join(path.dirname(new URL(import.meta.url).pathname), '..');
const LAMBDA = { phi: Math.log10((1 + Math.sqrt(5)) / 2), sqrt5: Math.log10(Math.sqrt(5)) }, FLOOR = 0.03, NB = 12;
const gauss = r => { let u = 0, v = 0; while (!u) u = r(); while (!v) v = r(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); };
const npdf = (y, m, v) => Math.exp(-0.5 * (y - m) ** 2 / v) / Math.sqrt(2 * Math.PI * v);

function prep(D) { const ss = D.map(d => d.s).sort((a, b) => a - b), edges = Array.from({ length: NB + 1 }, (_, i) => ss[Math.min(ss.length - 1, Math.floor(i * ss.length / NB))]);
  const bin = s => { let b = 0; while (b < NB - 1 && s > edges[b + 1]) b++; return b; };
  return { D, bins: D.map(d => bin(d.s)), bs: Array.from({ length: NB }, (_, b) => (edges[b] + edges[b + 1]) / 2) }; }
/* the exact convolution of the modulated mixture at y with error s (as in replication II), unnormalised */
function hmod(y, s, M, lam, eps, th) { const w2 = 2 * Math.PI / lam, sg = s * s; let p = 0;
  for (let k = 0; k < M.w.length; k++) { const T = M.s2[k] + sg, v = M.s2[k] * sg / T, m = (M.mu[k] * sg + y * M.s2[k]) / T;
    p += M.w[k] * npdf(y, M.mu[k], T) * (eps ? 1 + eps * Math.exp(-0.5 * w2 * w2 * v) * Math.cos(w2 * m + th) : 1); } return p; }
function ll(P, X, lam) { const { M, x0, w, eps, th } = P, S = y => 1 / (1 + Math.exp(-(y - x0) / w));
  const Z = X.bs.map(s => { let z = 0; for (let x = -1; x <= 2.0001; x += 0.01) z += hmod(x, s, M, lam, eps, th) * S(x) * 0.01; return z; });
  let l = 0; X.D.forEach((d, i) => { l += Math.log(Math.max(hmod(d.y, d.s, M, lam, eps, th) * S(d.y) / Z[X.bins[i]], 1e-300)); }); return l; }
const K = 2;
const pack = (p, withMod) => { const w = p.slice(0, K).map(Math.exp), sw = w.reduce((a, b) => a + b, 0);
  return { M: { w: w.map(x => x / sw), mu: p.slice(K, 2 * K), s2: p.slice(2 * K, 3 * K).map(x => Math.max(FLOOR * FLOOR, Math.exp(x))) }, x0: p[3 * K], w: Math.exp(p[3 * K + 1]),
    eps: withMod ? 1 / (1 + Math.exp(-p[3 * K + 2])) : 0, th: withMod ? p[3 * K + 3] : 0 }; };
const unpack = P => [...P.M.w.map(Math.log), ...P.M.mu, ...P.M.s2.map(Math.log), P.x0, Math.log(P.w)];
function fitSelP(X, start, evals, st = [0.3, 0.3, 0.05, 0.05, 0.3, 0.3, 0.2, 0.2]) {
  const r = nmax(p => ll(pack(p, false), X, 1), unpack(start), st, evals); return { l: r.f, P: pack(r.x, false) }; }
function fitSelMod(X, sel, lam, evals) { let best = { l: -Infinity };
  for (const e of [0.05, 0.15, 0.3]) for (let j = 0; j < 12; j++) { const P = { ...sel.P, eps: e, th: 2 * Math.PI * j / 12 }, l = ll(P, X, lam); if (l > best.l) best = { l, P }; }
  const e0 = Math.min(0.95, Math.max(0.02, best.P.eps)), x0 = [...unpack(best.P), Math.log(e0 / (1 - e0)), best.P.th];
  const r = nmax(p => ll(pack(p, true), X, lam), x0, [0.2, 0.2, 0.03, 0.03, 0.2, 0.2, 0.05, 0.2, 0.8, 0.5], evals);
  return r.f >= best.l ? { l: r.f, P: pack(r.x, true) } : best; }
function simulateSel(P, sigmas, n, r) { const out = [], S = y => 1 / (1 + Math.exp(-(y - P.x0) / P.w));
  while (out.length < n) { let u = r(), k = 0; while (k < K - 1 && (u -= P.M.w[k]) > 0) k++; const x = P.M.mu[k] + Math.sqrt(P.M.s2[k]) * gauss(r), s = sigmas[Math.floor(r() * sigmas.length)], y = x + s * gauss(r);
    if (r() < S(y)) out.push({ y, s, tic: 'sim' + out.length }); } return out; }

const B = +(process.argv.find(a => a.startsWith('--B=')) || '--B=100').slice(4), seed = 4415, r = rng(seed);
const { data: D } = loadTOI(), X = prep(D);
const mix = fitMix(D, K, 4411 + K), start = { M: { w: mix.w, mu: mix.mu, s2: mix.s2 }, x0: -0.3, w: 0.1 };
let sel = null; for (const x0 of [-0.3, -0.1, 0]) for (const w of [0.05, 0.1]) { const f = fitSelP(X, { ...start, x0, w }, 6000); if (!sel || f.l > sel.l) sel = f; } for (let k = 0; k < 3; k++) { const again = fitSelP(X, sel.P, 4000); if (again.l > sel.l + 1e-9) sel = again; else break; }
const sig = D.map(d => d.s), res = { protocol: 'POST-HOC EXPLORATION — deviation from docs/scale-nexus/PREREGISTRATION_II.md (selection-aware null not preregistered)', seed, B, n: D.length,
  sel: { logL: sel.l, x0: sel.P.x0, width: sel.P.w, mixture: { w: sel.P.M.w, mu: sel.P.M.mu, sd: sel.P.M.s2.map(Math.sqrt) } }, models: {} };
const alt = {};
for (const [name, lam] of Object.entries(LAMBDA)) {
  let m = fitSelMod(X, sel, lam, 2500); for (let k = 0; k < 2; k++) { const x0 = [...unpack(m.P), Math.log(m.P.eps / (1 - m.P.eps)), m.P.th], rr = nmax(q => ll(pack(q, true), X, lam), x0, [0.1, 0.1, 0.02, 0.02, 0.1, 0.1, 0.03, 0.1, 0.4, 0.3], 2500); if (rr.f > m.l + 1e-9) m = { l: rr.f, P: pack(rr.x, true) }; else break; }
  alt[name] = m;
  /* the null refitted from the alternative's shared parameters too, so that no LR is inflated by an underfitted null */
  const s2 = fitSelP(X, { ...m.P, eps: 0, th: 0 }, 4000); if (s2.l > sel.l) { sel = s2; res.sel = { logL: sel.l, x0: sel.P.x0, width: sel.P.w, mixture: { w: sel.P.M.w, mu: sel.P.M.mu, sd: sel.P.M.s2.map(Math.sqrt) }, refitFrom: name }; } }
for (const [name, lam] of Object.entries(LAMBDA)) {
  const m = alt[name], LR = 2 * (m.l - sel.l), LRs = [];
  for (let b = 0; b < B; b++) { const S = simulateSel(sel.P, sig, D.length, r), XS = prep(S), s0 = fitSelP(XS, sel.P, 1500), mm = fitSelMod(XS, s0, lam, 1200); LRs.push(2 * (mm.l - s0.l)); }
  const p = (1 + LRs.filter(x => x >= LR).length) / (1 + B), sorted = [...LRs].sort((a, b) => a - b);
  res.models[name] = { logL: m.l, eps: m.P.eps, theta: m.P.th, LR, p, LRnull95: B ? sorted[Math.floor(0.95 * (sorted.length - 1))] : null, dBIC_vs_sel: -2 * m.l + 2 * Math.log(D.length) - (-2 * sel.l), bonferroni_alpha: 0.025 };
  console.error(name, JSON.stringify(res.models[name])); }
res.reading = 'exploratory only. A small p here would say the feature is not the detection edge of this model; it would not make it a lattice, and it would not replicate anything.';
fs.writeFileSync(path.join(ROOT, 'docs/scale-nexus/exploration-selection-null.json'), JSON.stringify(res, null, 1));
console.log(JSON.stringify(res.models));
