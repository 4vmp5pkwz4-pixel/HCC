/* scale-dynamics.mjs — the Scale Dynamics Observatory, offline half (Scale Nexus Frontier II, items 26–30)
   Reads the committed NASA snapshot and the literature points typed below, and writes data/scale-nexus/scale-dynamics.json:
     · the populations with their asymmetric uncertainties and sources;
     · the local logarithmic slope S(M) = d log R / d log M in sliding windows of log M, by effective-variance regression
       with an intrinsic scatter, with block-bootstrap errors and the 2×2 covariance of (intercept, slope);
       p_eff = 1/S where S is not near zero (M ∝ R^p_eff);
     · the broken power law of the planets (0, 1, 2 breaks by BIC) with bootstrap intervals of the breaks — the
       transitions between families, measured on this sample;
     · the scaling invariant I_S = (1 + S)·log C + (1 − S)·log Q, constant along R ∝ M^S (Lean: dilation_invariant,
       with p = 1/S), and its scatter in every family;
     · every layer labelled measured / model / identity / hypothetical;
     · proof certificates: the Lean theorems the identities rest on, with the hashes of the build that checked them.
   Nothing here is a law of nature: the slopes summarise THIS sample, with its selection. */
import fs from 'node:fs'; import path from 'node:path'; import crypto from 'node:crypto';
const ROOT = path.join(path.dirname(new URL(import.meta.url).pathname), '..');
const rd = f => fs.readFileSync(path.join(ROOT, f), 'utf8');
const src = rd('index.html');
const REG = src.slice(src.indexOf('const HCC_CONSTANTS='), src.indexOf('/* the SI values the reference implementation uses'));
const { HCC_CONSTANTS: CON, HCC_K: K } = new Function(REG + ';return {HCC_CONSTANTS, HCC_K};')();
const GM_EARTH = 3.986004e14, R_EARTH = 6.3781e6;                  /* IAU 2015 B3 nominal terrestrial values */
const M_EARTH = GM_EARTH / K.G, LN10 = Math.log(10);
const lP = Math.sqrt(K.hbar * K.G / K.c ** 3), mP = Math.sqrt(K.hbar * K.c / K.G);
const logC = (lm, lr) => Math.log10(2 * K.G / K.c ** 2) + lm - lr;  /* lm = log10(M/kg), lr = log10(R/m) */
const logQ = (lm, lr) => Math.log10(K.hbar / K.c) - lm - lr;

function rng(seed) { let s = seed >>> 0; return () => { s = (s + 0x6D2B79F5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
function parseCSV(text) { const lines = text.trim().split(/\r?\n/), head = lines[0].split(','); return lines.slice(1).map(l => {
  const out = [], re = /("([^"]|"")*"|[^,]*)(,|$)/g; let m; while ((m = re.exec(l)) && out.length < head.length) { let v = m[1]; if (v.startsWith('"')) v = v.slice(1, -1).replace(/""/g, '"'); out.push(v); if (m[3] === '') break; }
  return Object.fromEntries(head.map((h, i) => [h, out[i] ?? ''])); }); }
const num = x => { const v = parseFloat(x); return Number.isFinite(v) ? v : null; };
/* asymmetric errors to log10: σ+ = log10(1 + e1/x), σ− = −log10(1 + e2/x); the symmetric σ is their mean */
function logErr(x, e1, e2) { const up = Math.log10(1 + Math.abs(e1) / x), dn = 1 + (-Math.abs(e2)) / x > 0 ? -Math.log10(1 - Math.abs(e2) / x) : null;
  return { up, dn, sym: dn == null ? up : (up + dn) / 2, crossesZero: dn == null }; }

/* ── the populations ── */
const pscomp = parseCSV(rd('data/scale-nexus/raw/pscomppars.csv'));
const planets = [], hostSeen = new Map();
for (const r of pscomp) {
  const R = num(r.pl_rade), Re1 = num(r.pl_radeerr1), Re2 = num(r.pl_radeerr2), M = num(r.pl_bmasse), Me1 = num(r.pl_bmasseerr1), Me2 = num(r.pl_bmasseerr2);
  if (r.pl_bmassprov === 'Mass' && R > 0 && M > 0 && Re1 != null && Re2 != null && Me1 != null && Me2 != null && (r.pl_radelim === '0' || r.pl_radelim === '') && (r.pl_bmasselim === '0' || r.pl_bmasselim === '')) {
    const eM = logErr(M, Me1, Me2), eR = logErr(R, Re1, Re2);
    planets.push({ id: r.pl_name, block: r.hostname, lm: Math.log10(M * M_EARTH), lr: Math.log10(R * R_EARTH), sM: eM.sym, sR: eR.sym, sMup: eM.up, sMdn: eM.dn, sRup: eR.up, sRdn: eR.dn,
      flag: eM.crossesZero || eR.crossesZero ? 'lower error bar reaches zero' : null, facility: r.disc_facility, method: r.discoverymethod }); }
  const sm = num(r.st_mass), sm1 = num(r.st_masserr1), sm2 = num(r.st_masserr2), sr = num(r.st_rad), sr1 = num(r.st_raderr1), sr2 = num(r.st_raderr2);
  if (sm > 0 && sr > 0 && sm1 != null && sm2 != null && sr1 != null && sr2 != null && !hostSeen.has(r.hostname)) {
    const eM = logErr(sm, sm1, sm2), eR = logErr(sr, sr1, sr2);
    hostSeen.set(r.hostname, { id: r.hostname, block: r.hostname, lm: Math.log10(sm * K.Msun), lr: Math.log10(sr * K.Rsun), sM: eM.sym, sR: eR.sym, sMup: eM.up, sMdn: eM.dn, sRup: eR.up, sRdn: eR.dn,
      flag: eM.crossesZero || eR.crossesZero ? 'lower error bar reaches zero' : null, teff: num(r.st_teff) }); }
}
/* main-sequence hosts only for the stellar relation: giants and subgiants sit on another branch. A star is kept if its
   radius is within a factor 1.6 of the zero-age relation R ≈ M^0.8 (solar units) — a cut on the sample, stated. */
const hostsAll = [...hostSeen.values()];
const hosts = hostsAll.filter(h => { const m = 10 ** (h.lm - Math.log10(K.Msun)), r = 10 ** (h.lr - Math.log10(K.Rsun)); return r / Math.pow(m, 0.8) < 1.6 && r / Math.pow(m, 0.8) > 1 / 1.6; });
const WD = [ /* dynamical masses and radii; transcribed from the papers named, check against them */
  { id: 'Sirius B', M: 1.018, sM: 0.011, R: 0.008098, sR: 0.000046, src: 'Bond et al. 2017, ApJ 840, 70' },
  { id: '40 Eridani B', M: 0.573, sM: 0.018, R: 0.01308, sR: 0.00020, src: 'Bond et al. 2017, ApJ 848, 16' },
  { id: 'Procyon B', M: 0.592, sM: 0.006, R: 0.01232, sR: 0.00032, src: 'Bond et al. 2015, ApJ 813, 106' }]
  .map(w => ({ id: w.id, block: w.id, lm: Math.log10(w.M * K.Msun), lr: Math.log10(w.R * K.Rsun), sM: w.sM / (w.M * LN10), sR: w.sR / (w.R * LN10), src: w.src }));
const NS = [ /* NICER pulse-profile inferences, 68 % intervals; the two analyses of one pulsar share data and are NOT independent */
  { id: 'PSR J0030+0451 (Riley)', group: 'J0030', M: 1.34, Mup: 0.15, Mdn: 0.16, R: 12.71, Rup: 1.14, Rdn: 1.19, src: 'Riley et al. 2019, ApJL 887, L21' },
  { id: 'PSR J0030+0451 (Miller)', group: 'J0030', M: 1.44, Mup: 0.15, Mdn: 0.14, R: 13.02, Rup: 1.24, Rdn: 1.06, src: 'Miller et al. 2019, ApJL 887, L24' },
  { id: 'PSR J0740+6620 (Riley)', group: 'J0740', M: 2.072, Mup: 0.067, Mdn: 0.066, R: 12.39, Rup: 1.30, Rdn: 0.98, src: 'Riley et al. 2021, ApJL 918, L27' },
  { id: 'PSR J0740+6620 (Miller)', group: 'J0740', M: 2.08, Mup: 0.07, Mdn: 0.07, R: 13.7, Rup: 2.6, Rdn: 1.5, src: 'Miller et al. 2021, ApJL 918, L28' },
  { id: 'PSR J0437−4715 (Choudhury)', group: 'J0437', M: 1.418, Mup: 0.037, Mdn: 0.037, R: 11.36, Rup: 0.95, Rdn: 0.63, src: 'Choudhury et al. 2024, ApJL 971, L20' }]
  .map(n => ({ id: n.id, block: n.group, lm: Math.log10(n.M * K.Msun), lr: Math.log10(n.R * 1e3), sMup: Math.log10(1 + n.Mup / n.M), sMdn: -Math.log10(1 - n.Mdn / n.M),
    sRup: Math.log10(1 + n.Rup / n.R), sRdn: -Math.log10(1 - n.Rdn / n.R), src: n.src, mrCorrelation: null }))
  .map(n => ({ ...n, sM: (n.sMup + n.sMdn) / 2, sR: (n.sRup + n.sRdn) / 2 }));

/* ── effective-variance regression y = a + S x with intrinsic scatter τ (Orear 1982; τ by χ²/ν = 1) ── */
function evFit(pts, xk, yk, sx, sy) {
  const n = pts.length; if (n < 3) return null;
  let S = 0, a = 0, tau = 0;
  { let mx = 0, my = 0; for (const p of pts) { mx += p[xk]; my += p[yk]; } mx /= n; my /= n; let sxy = 0, sxx = 0; for (const p of pts) { sxy += (p[xk] - mx) * (p[yk] - my); sxx += (p[xk] - mx) ** 2; } S = sxx > 0 ? sxy / sxx : 0; a = my - S * mx; }
  let cov = null;
  for (let it = 0; it < 25; it++) {
    let W = 0, Wx = 0, Wy = 0, Wxx = 0, Wxy = 0, chi = 0;
    for (const p of pts) { const w = 1 / (p[sy] ** 2 + S * S * p[sx] ** 2 + tau * tau); W += w; Wx += w * p[xk]; Wy += w * p[yk]; Wxx += w * p[xk] ** 2; Wxy += w * p[xk] * p[yk]; }
    const D = W * Wxx - Wx * Wx; if (!(D > 0)) return null;
    const S2 = (W * Wxy - Wx * Wy) / D, a2 = (Wy * Wxx - Wx * Wxy) / D; cov = [[Wxx / D, -Wx / D], [-Wx / D, W / D]];
    for (const p of pts) chi += (p[yk] - a2 - S2 * p[xk]) ** 2 / (p[sy] ** 2 + S2 * S2 * p[sx] ** 2 + tau * tau);
    const red = chi / (n - 2);
    /* τ up or down until χ²/ν = 1 (bisection on τ², bounded) */
    if (red > 1.0001) { let lo = tau, hi = Math.max(0.01, tau * 2); const f = t => pts.reduce((s, p) => s + (p[yk] - a2 - S2 * p[xk]) ** 2 / (p[sy] ** 2 + S2 * S2 * p[sx] ** 2 + t * t), 0) / (n - 2);
      while (f(hi) > 1) hi *= 2; for (let k = 0; k < 30; k++) { const m = (lo + hi) / 2; if (f(m) > 1) lo = m; else hi = m; } tau = (lo + hi) / 2; }
    const done = Math.abs(S2 - S) < 1e-10 && Math.abs(a2 - a) < 1e-10; S = S2; a = a2; if (done) break; }
  return { a, S, tau, n, covFisher: cov };
}
function blockBootstrap(pts, fit, B, seed) {
  const r = rng(seed), blocks = new Map(); for (const p of pts) { if (!blocks.has(p.block)) blocks.set(p.block, []); blocks.get(p.block).push(p); }
  const keys = [...blocks.keys()], out = [];
  for (let b = 0; b < B; b++) { const s = []; for (let i = 0; i < keys.length; i++) s.push(...blocks.get(keys[Math.floor(r() * keys.length)])); const f = fit(s); if (f) out.push(f); }
  return out;
}
const q = (arr, p) => { const s = [...arr].sort((x, y) => x - y); const i = (s.length - 1) * p, lo = Math.floor(i), hi = Math.ceil(i); return s[lo] + (s[hi] - s[lo]) * (i - lo); };
const sd = arr => { const m = arr.reduce((s, x) => s + x, 0) / arr.length; return Math.sqrt(arr.reduce((s, x) => s + (x - m) ** 2, 0) / (arr.length - 1)); };
const covOf = (xs, ys) => { const mx = xs.reduce((s, x) => s + x, 0) / xs.length, my = ys.reduce((s, x) => s + x, 0) / ys.length; return xs.reduce((s, x, i) => s + (x - mx) * (ys[i] - my), 0) / (xs.length - 1); };

/* ── local slopes in windows of log M (x = log M, y = log R; S = d log R / d log M) ── */
function localSlopes(pts, { width, step, minN, B, seed }) {
  const xs = pts.map(p => p.lm), lo = Math.min(...xs), hi = Math.max(...xs), out = [];
  for (let c = lo + width / 2; c <= hi - width / 2 + 1e-9; c += step) {
    const w = pts.filter(p => Math.abs(p.lm - c) <= width / 2).map(p => ({ ...p, x: p.lm - c }));
    if (w.length < minN) continue;
    const f = evFit(w, 'x', 'lr', 'sM', 'sR'); if (!f) continue;
    const bs = blockBootstrap(w, s => evFit(s, 'x', 'lr', 'sM', 'sR'), B, seed + Math.round(c * 100));
    const Ss = bs.map(b => b.S), As = bs.map(b => b.a);
    const cov = [[sd(As) ** 2, covOf(As, Ss)], [covOf(As, Ss), sd(Ss) ** 2]];
    const S = f.S, sS = sd(Ss), pEff = Math.abs(S) > 3 * sS && Math.abs(S) > 0.05 ? 1 / S : null;
    const lmC = c, lrC = f.a;
    out.push({ logM: +c.toFixed(4), n: w.length, blocks: new Set(w.map(p => p.block)).size, S: +S.toFixed(5), sigmaS: +sS.toFixed(5), S95: [+q(Ss, 0.025).toFixed(4), +q(Ss, 0.975).toFixed(4)],
      intercept_logR: +lrC.toFixed(5), cov_intercept_slope: cov.map(r => r.map(v => +v.toExponential(4))), tau: +f.tau.toFixed(4),
      p_eff: pEff == null ? null : +pEff.toFixed(4), p_eff_note: pEff == null ? 'S consistent with zero within 3σ or |S| ≤ 0.05: the radius barely changes with mass here and M ∝ R^p has no finite p' : null,
      invariant: +((1 + S) * logC(lmC, lrC) + (1 - S) * logQ(lmC, lrC)).toFixed(5) });
  }
  return out;
}

/* ── the broken power law of the planets: log R = c + s0 m + Σ Δs_k max(0, m − b_k), m = log10(M/M⊕) ── */
function hingeFit(pts, breaks, iters = 12) {
  /* effective variance with the local slope at each point, iterated; τ by χ²/ν = 1 on precomputed residuals */
  const n = pts.length, P = 2 + breaks.length; let beta = null, tau = 0.05, cov = null;
  const rows = pts.map(p => [1, p.m, ...breaks.map(b => Math.max(0, p.m - b))]);
  const seg = pts.map(p => breaks.reduce((k, b) => p.m > b ? k + 1 : k, 0));
  const slopeAt = (i, be) => { let s = be[1]; for (let k = 0; k < seg[i]; k++) s += be[2 + k]; return s; };
  for (let it = 0; it < iters; it++) {
    const A = Array.from({ length: P }, () => new Array(P).fill(0)), y = new Array(P).fill(0);
    for (let i = 0; i < n; i++) { const p = pts[i], r = rows[i], s = beta ? slopeAt(i, beta) : 0.5, w = 1 / (p.sR ** 2 + s * s * p.sM ** 2 + tau * tau);
      for (let a = 0; a < P; a++) { y[a] += w * r[a] * p.lrE; for (let b = 0; b < P; b++) A[a][b] += w * r[a] * r[b]; } }
    const inv = invert(A); if (!inv) return null; const nb = inv.map(r => r.reduce((s, v, j) => s + v * y[j], 0)); cov = inv;
    const res2 = new Float64Array(n), ev = new Float64Array(n);
    for (let i = 0; i < n; i++) { const r = rows[i]; let mu = 0; for (let a = 0; a < P; a++) mu += r[a] * nb[a]; const sl = slopeAt(i, nb); res2[i] = (pts[i].lrE - mu) ** 2; ev[i] = pts[i].sR ** 2 + sl * sl * pts[i].sM ** 2; }
    const red = t => { let c = 0; for (let i = 0; i < n; i++) c += res2[i] / (ev[i] + t * t); return c / (n - P); };
    if (red(0) <= 1) tau = 0; else { let lo = 0, hi = 0.05; while (red(hi) > 1) hi *= 2; for (let k = 0; k < 30; k++) { const mm = (lo + hi) / 2; if (red(mm) > 1) lo = mm; else hi = mm; } tau = (lo + hi) / 2; }
    const done = beta && nb.every((v, i) => Math.abs(v - beta[i]) < 1e-8); beta = nb; if (done) break; }
  let ll = 0; for (let i = 0; i < n; i++) { const r = rows[i], sl = slopeAt(i, beta); let mu = 0; for (let a = 0; a < P; a++) mu += r[a] * beta[a]; const v = pts[i].sR ** 2 + sl * sl * pts[i].sM ** 2 + tau * tau; ll += -0.5 * ((pts[i].lrE - mu) ** 2 / v + Math.log(2 * Math.PI * v)); }
  const k = P + breaks.length + 1;
  return { breaks, beta, tau, ll, k, bic: -2 * ll + k * Math.log(n), aic: -2 * ll + 2 * k, cov,
    slopes: [beta[1], ...breaks.map((b, i) => beta[1] + beta.slice(2, 3 + i).reduce((s, v) => s + v, 0))] };
}
function invert(A) { const n = A.length, M = A.map((r, i) => [...r, ...Array.from({ length: n }, (_, j) => i === j ? 1 : 0)]);
  for (let c = 0; c < n; c++) { let p = c; for (let r = c + 1; r < n; r++) if (Math.abs(M[r][c]) > Math.abs(M[p][c])) p = r; if (Math.abs(M[p][c]) < 1e-300) return null; [M[c], M[p]] = [M[p], M[c]];
    const d = M[c][c]; for (let j = 0; j < 2 * n; j++) M[c][j] /= d; for (let r = 0; r < n; r++) if (r !== c) { const f = M[r][c]; for (let j = 0; j < 2 * n; j++) M[r][j] -= f * M[c][j]; } }
  return M.map(r => r.slice(n)); }
function bestHinge(pts, nBreaks, grid, refine = true) {
  if (nBreaks === 0) return hingeFit(pts, []);
  let best = null; const tryB = bs => { const f = hingeFit(pts, bs); if (f && (!best || f.ll > best.ll)) best = f; };
  if (nBreaks === 1) for (const b of grid) tryB([b]);
  if (nBreaks === 2) for (const b1 of grid) for (const b2 of grid) if (b2 - b1 >= 0.6) tryB([b1, b2]);
  if (nBreaks === 3) for (const b1 of grid) for (const b2 of grid) if (b2 - b1 >= 0.6) for (const b3 of grid) if (b3 - b2 >= 0.6) tryB([b1, b2, b3]);
  /* local refinement on a 0.025-dex lattice around the coarse optimum */
  if (refine && best) for (let pass = 0; pass < 3; pass++) { const c = best.breaks.slice(), d = [-0.1, -0.075, -0.05, -0.025, 0, 0.025, 0.05, 0.075, 0.1];
    if (nBreaks === 1) for (const x of d) tryB([+(c[0] + x).toFixed(3)]);
    else if (nBreaks === 2) for (const x of d) for (const y of d) { const b = [+(c[0] + x).toFixed(3), +(c[1] + y).toFixed(3)]; if (b[1] - b[0] >= 0.6) tryB(b); }
    else for (const x of d) for (const y of d) for (const z of d) { const b = [+(c[0] + x).toFixed(3), +(c[1] + y).toFixed(3), +(c[2] + z).toFixed(3)]; if (b[1] - b[0] >= 0.6 && b[2] - b[1] >= 0.6) tryB(b); } }
  return best;
}

/* ── run ── */
const lmE = Math.log10(M_EARTH), lrE = Math.log10(R_EARTH);
const P2 = planets.map(p => ({ ...p, m: p.lm - lmE, lrE: p.lr - lrE }));
const grid = []; for (let m = -0.5; m <= 3.6 + 1e-9; m += 0.2) grid.push(+m.toFixed(2));
const fits = [0, 1, 2, 3].map(k => bestHinge(P2, k, grid));
const bestK = fits.reduce((b, f, i) => f.bic < fits[b].bic ? i : b, 0);
/* bootstrap the chosen model's breaks over host blocks (a coarser grid inside, to keep the run short) */
const bsBreaks = blockBootstrap(P2, s => bestHinge(s, bestK, grid, true), 100, 4412).map(f => ({ breaks: f.breaks, slopes: f.slopes }));
const CK = { src: 'Chen & Kipping 2017, ApJ 834, 17 (transcribed: verify against the paper)', c0: 1.008, transitionsMearth: [2.04, 0.414 * 317.83, 0.0800 * 332946.0], slopes: [0.279, 0.589, -0.044, 0.881],
  families: ['Terran', 'Neptunian', 'Jovian', 'Stellar'] };

const sPlanets = localSlopes(P2.map(p => ({ ...p })), { width: 0.6, step: 0.1, minN: 25, B: 100, seed: 4413 });
const sHosts = localSlopes(hosts, { width: 0.25, step: 0.05, minN: 25, B: 100, seed: 4414 });
const famInv = (pts, S) => { const v = pts.map(p => (1 + S) * logC(p.lm, p.lr) + (1 - S) * logQ(p.lm, p.lr)); return { S, mean: +(v.reduce((s, x) => s + x, 0) / v.length).toFixed(5), sd: +sd(v).toFixed(5), n: v.length }; };
const segOf = (m, f) => f.breaks.reduce((k, b) => m > b ? k + 1 : k, 0);
const planetFamilies = fits[bestK].slopes.map((S, k) => { const pts = P2.filter(p => segOf(p.m, fits[bestK]) === k); return { segment: k, S: +S.toFixed(5), p_eff: Math.abs(S) > 0.05 ? +(1 / S).toFixed(4) : null, invariant: famInv(pts, S) }; });
const hostGlobal = evFit(hosts.map(h => ({ ...h, x: h.lm - Math.log10(K.Msun), y: h.lr - Math.log10(K.Rsun) })), 'x', 'y', 'sM', 'sR');
/* the white-dwarf model curve: Nauenberg (1972), μ_e = 2, from the atlas's own white-dwarf lab */
const wdSrc = src.match(/const WD_RSUN_KM=[^\n]*\n/)[0];
const wdFn = src.slice(src.indexOf('function wdMch'), src.indexOf('\n', src.indexOf('function wdRadiusKm')) + 1);
const W = new Function('HCC_K', wdSrc + wdFn + ';return {wdMch, wdRadiusKm};')(K);
const wdCurve = []; for (let f = 0.05; f <= 0.995; f += 0.0225) { const Mm = f * W.wdMch(2); const Rk = W.wdRadiusKm(Mm, 2); if (Rk > 0) wdCurve.push([+Math.log10(Mm * K.Msun).toFixed(5), +Math.log10(Rk * 1e3).toFixed(5)]); }
const wdSlope = wdCurve.slice(1).map((p, i) => ({ logM: +((p[0] + wdCurve[i][0]) / 2).toFixed(4), S: +((p[1] - wdCurve[i][1]) / (p[0] - wdCurve[i][0])).toFixed(4) }));

const sha = f => crypto.createHash('sha256').update(fs.readFileSync(path.join(ROOT, f))).digest('hex');
const buildLog = rd('lean/scale-nexus/build.log'), olean = Object.fromEntries([...buildLog.matchAll(/([0-9a-f]{64})\s+\S*\/(\w+)\.olean/g)].map(m => [m[2], m[1]]));
const axioms = rd('lean/scale-nexus/axioms.txt').trim().split('\n');
const cert = name => ({ theorem: 'HCC.ScaleNexus.' + name, axioms: (axioms.find(l => l.includes(`'HCC.ScaleNexus.${name}'`)) || 'NOT FOUND').replace(/^.*depends on axioms: /, '') });

const out = {
  schema: 'hcc.scale-dynamics/1', generated_by: 'scripts/scale-dynamics.mjs', constants: { registry: CON.version, M_earth_kg: M_EARTH, R_earth_m: R_EARTH, M_sun_kg: K.Msun, R_sun_m: K.Rsun, G: K.G, sigma_G_rel: CON.G.u / CON.G.v },
  inputs: { pscomppars: { file: 'data/scale-nexus/raw/pscomppars.csv', sha256: sha('data/scale-nexus/raw/pscomppars.csv') } },
  coordinates: 'lm = log10(M/kg), lr = log10(R/m); log C = log10(2GM/(Rc²)), log Q = log10(ħ/(MRc)); S = d log R / d log M; p_eff = 1/S (M ∝ R^p_eff)',
  layers: {
    measured: ['planets: NASA Exoplanet Archive pscomppars, pl_bmassprov = "Mass" (true masses: no M sin i, no masses from an M–R relation)', 'local slopes and broken power law fitted to them, with block-bootstrap intervals', 'host stars: st_mass/st_rad — NOTE these are mostly model-derived (spectroscopy + isochrones or empirical relations), heterogeneous across papers', 'white dwarfs with dynamical masses (3)', 'neutron stars from NICER (3 pulsars, 5 analyses)'],
    model: ['Chen & Kipping 2017 broken power law (literature)', 'Nauenberg 1972 white-dwarf mass–radius curve, μ_e = 2 (the atlas white-dwarf lab)'],
    identity: ['C = 1 (R = 2GM/c²) and Q = 1 (R = ħ/(Mc)): definitions, not data', 'I_S = (1+S) log C + (1−S) log Q is constant along R ∝ M^S: a theorem (Lean: dilation_invariant, p = 1/S), not a finding', 'the allowed band C ≤ 1 ∧ Q ≤ 1 (Lean: allowed_masses, allowed_nonempty)'],
    hypothetical: ['extrapolating any fitted slope outside its window', 'dilation trajectories M ∝ R^p drawn through a point', 'FBS3R rung lines: coordinates, not layers'] },
  populations: {
    planets: { n: planets.length, blocks: new Set(planets.map(p => p.block)).size, selection: 'pl_bmassprov = "Mass", finite radius and mass with both errors, no limit flags', mr_covariance: 'not provided by the archive: ρ(M, R) = 0 assumed', rows: planets.map(p => [p.id, +p.lm.toFixed(5), +p.lr.toFixed(5), +p.sMup.toFixed(5), p.sMdn == null ? null : +p.sMdn.toFixed(5), +p.sRup.toFixed(5), p.sRdn == null ? null : +p.sRdn.toFixed(5)]), columns: ['name', 'lm', 'lr', 'sigma_lm_up', 'sigma_lm_down', 'sigma_lr_up', 'sigma_lr_down'] },
    hosts: { n: hosts.length, n_all: hostsAll.length, selection: 'unique hosts with st_mass, st_rad and both errors; main-sequence cut 1/1.6 < R/M^0.8 < 1.6 (solar units)', caveat: 'mostly model-derived, not dynamical', rows: hosts.map(p => [p.id, +p.lm.toFixed(5), +p.lr.toFixed(5), +p.sMup.toFixed(5), p.sMdn == null ? null : +p.sMdn.toFixed(5), +p.sRup.toFixed(5), p.sRdn == null ? null : +p.sRdn.toFixed(5)]) },
    white_dwarfs: { n: WD.length, rows: WD.map(w => ({ id: w.id, lm: +w.lm.toFixed(5), lr: +w.lr.toFixed(5), sigma_lm: +w.sM.toFixed(5), sigma_lr: +w.sR.toFixed(5), src: w.src })), caveat: 'transcribed from the papers named; three stars do not constrain a slope' },
    neutron_stars: { n: NS.length, rows: NS.map(n => ({ id: n.id, group: n.block, lm: +n.lm.toFixed(5), lr: +n.lr.toFixed(5), sigma_lm: [+n.sMdn.toFixed(5), +n.sMup.toFixed(5)], sigma_lr: [+n.sRdn.toFixed(5), +n.sRup.toFixed(5)], mr_correlation: null, src: n.src })),
      caveat: 'the M–R posteriors are correlated and not summarised by two intervals; two analyses of one pulsar share data. Three pulsars do not constrain a slope.' } },
  planets_broken_power_law: { x: 'log10(M/M⊕)', y: 'log10(R/R⊕)', models: fits.map((f, k) => ({ breaks_log10_Mearth: f.breaks, slopes_S: f.slopes.map(v => +v.toFixed(5)), tau: +f.tau.toFixed(4), logL: +f.ll.toFixed(3), k: f.k, bic: +f.bic.toFixed(3), aic: +f.aic.toFixed(3) })),
    chosen_by_bic: bestK, beta_chosen: fits[bestK].beta.map(v => +v.toFixed(6)), families: planetFamilies,
    breaks_bootstrap: { B: bsBreaks.length, blocks: 'host star', grid: '0.2 dex, refined to 0.025 dex', ci95: fits[bestK].breaks.map((_, i) => [+q(bsBreaks.map(b => b.breaks[i]), 0.025).toFixed(3), +q(bsBreaks.map(b => b.breaks[i]), 0.975).toFixed(3)]),
      slopes_ci95: fits[bestK].slopes.map((_, i) => [+q(bsBreaks.map(b => b.slopes[i]), 0.025).toFixed(4), +q(bsBreaks.map(b => b.slopes[i]), 0.975).toFixed(4)]) },
    literature_model: CK },
  local_slopes: { planets: { window_dex: 0.6, step: 0.1, rows: sPlanets }, hosts: { window_dex: 0.25, step: 0.05, rows: sHosts } },
  hosts_global: hostGlobal ? { S: +hostGlobal.S.toFixed(5), p_eff: +(1 / hostGlobal.S).toFixed(4), tau: +hostGlobal.tau.toFixed(4), n: hostGlobal.n, cov_fisher: hostGlobal.covFisher.map(r => r.map(v => +v.toExponential(4))) } : null,
  white_dwarf_model: { src: 'Nauenberg 1972, μ_e = 2 (index.html wdRadiusKm)', curve: wdCurve, local_S: wdSlope },
  proof_certificates: { what_they_certify: 'the identities used here (the invariant, the walls, the crossing) — NOT the data, NOT the fits',
    lean: { toolchain: rd('lean/scale-nexus/lean-toolchain').trim(), sources: { 'ScaleNexus.lean': sha('lean/scale-nexus/ScaleNexus.lean'), 'Frontier.lean': fs.existsSync(path.join(ROOT, 'lean/scale-nexus/Frontier.lean')) ? sha('lean/scale-nexus/Frontier.lean') : null }, olean_sha256: olean },
    theorems: ['dilation_invariant', 'dil_comp', 'dil_inv', 'allowed_masses', 'allowed_nonempty', 'crossing_unique', 'covariance_propagation'].map(cert) },
  not_claimed: ['no slope here is a law of nature: each summarises this sample with its selection', 'the host-star relation inherits the stellar models used to derive it', 'nothing here bears on the golden lattice or on FBS3R rungs'] };
fs.writeFileSync(path.join(ROOT, 'data/scale-nexus/scale-dynamics.json'), JSON.stringify(out));
console.log(JSON.stringify({ planets: planets.length, hosts: hosts.length, hostsAll: hostsAll.length, bic: fits.map(f => +f.bic.toFixed(1)), chosen: bestK, breaks: fits[bestK].breaks, slopes: fits[bestK].slopes.map(v => +v.toFixed(3)), ci: out.planets_broken_power_law.breaks_bootstrap.ci95, families: planetFamilies, hostsS: out.hosts_global, nLocal: [sPlanets.length, sHosts.length], wd: wdSlope.slice(0, 3).concat(wdSlope.slice(-3)) }, null, 0));
