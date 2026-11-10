/* THE PRIMORDIAL QUANTUM (v4.416) — inflation, from one vacuum fluctuation to the sky. The laboratory's mathematics is one block
   of pure functions (INFLATE-MATH); it is lifted out of index.html and run here as it stands:
     1. the integrator against the one closed form — power-law inflation, V ∝ e^{−λφ}: tilt, tensor tilt, r and the amplitude
        with its Γ-function factor;
     2. the Wronskian of a mode (its uncertainty product) is conserved, and its squeezing grows by one e-fold per e-fold;
     3. the curvature perturbation freezes outside the horizon;
     4. the integration agrees with slow roll to second order for every potential, and not with the first-order formula;
     5. the textbook leading-order predictions of R² and φ² inflation;
     6. the tensor amplitude 2H²/π², the consistency relation and the energy scale V*^¼ = (3π²A_s r/2)^¼ M_pl;
     7. the verdicts of Planck 2018, ACT DR6 and BICEP/Keck 2021 on the models drawn;
     8. the Sachs–Wolfe plateau: A_s/25 at n_s = 1, and the closed form against a quadrature of ∫x^{n−2}j_ℓ²;
     9. the real spherical harmonics are orthonormal, and the sky's estimator Ĉ_ℓ is unbiased over many universes;
    10. the closed universe: when the lowest mode of S³ left the horizon;
    11. the laboratory reaches every registry of the atlas. */
import fs from 'node:fs'; import path from 'node:path';
const ROOT = path.join(path.dirname(new URL(import.meta.url).pathname), '..');
const src = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
let pass = 0, fail = 0;
const check = (ok, claim, nums) => { if (ok) pass++; else fail++; console.log(`${ok ? 'PASS' : 'FAIL'} — ${claim} :: ${nums}`); };
const cut = (a, b) => { const i = src.indexOf(a), j = src.indexOf(b, i + 1); if (i < 0 || j < 0) throw new Error('block not found: ' + a.slice(0, 50)); return src.slice(i, j); };
const MATH = cut('/* ═══ INFLATE-MATH-BEGIN ═══', '/* ═══ INFLATE-MATH-END ═══');
const names = ['INQ_AS', 'INQ_T0_UK', 'INQ_RSTAR_MPC', 'INQ_KPIV', 'INQ_MPL_GEV', 'INQ_DATA', 'INQ_MODELS', 'inqBackground', 'inqMode', 'inqPivot', 'inqObservables', 'inqFlow', 'inqSlowRoll',
  'inqPowerLawExact', 'inqLnGamma', 'inqSachsWolfe', 'inqYlm', 'inqSky', 'inqS3'];
const L = new Function(`${MATH}\nreturn {${names.join(',')}};`)();
const e = (v, d = 1) => v.toExponential(d);

{ let dns = 0, dnt = 0, dr = 0, da = 0;
  for (const lam of [0.1, 0.2, 0.4]) { const E = L.inqPowerLawExact(lam), O = L.inqObservables('exp', lam, 20);
    dns = Math.max(dns, Math.abs(O.ns - E.ns)); dnt = Math.max(dnt, Math.abs(O.nt - E.nt)); dr = Math.max(dr, Math.abs(O.r / E.r - 1)); da = Math.max(da, Math.abs(O.Pz1 / (O.srPz * E.factor) - 1)); }
  const g = Math.abs(L.inqLnGamma(1.5) - Math.log(Math.sqrt(Math.PI) / 2)) + Math.abs(L.inqLnGamma(0.3) - Math.log(2.99156898768759063));
  check(dns < 1e-9 && dnt < 1e-9 && dr < 1e-9 && da < 1e-4 && g < 1e-11, 'power-law inflation, the one closed form (λ = 0.1, 0.2, 0.4): the integrated n_s − 1 and n_t equal −2ε/(1 − ε), r equals 16ε, and the amplitude equals [2^{ν−3/2}Γ(ν)/Γ(3/2)]²(1 − ε)^{2ν−1}·H²/(8π²ε)',
    `|Δn_s| ≤ ${e(dns)} · |Δn_t| ≤ ${e(dnt)} · |Δr/r| ≤ ${e(dr)} · amplitude ≤ ${e(da)} · ln Γ to ${e(g)}`); }

const STAR = L.inqObservables('star', null, 55), TR = L.inqMode(STAR.B, STAR.ik, { trace: true }).trace;
{ let wd = 0, worst = 0;
  for (const [m, q] of [['star', null], ['quad', null], ['natural', 7]]) { const O = m === 'star' ? STAR : L.inqObservables(m, q, 55), T = m === 'star' ? TR : L.inqMode(O.B, O.ik, { trace: true }).trace;
    for (const w of T.wr) wd = Math.max(wd, Math.abs(Math.abs(w) - 0.5)); const n = T.N.length; worst = Math.max(worst, Math.abs(T.sq[n - 1] + Math.log(T.x[n - 1]))); }
  const n = TR.N.length, i0 = TR.sq[0];
  check(wd < 1e-5 && worst < 0.25 && i0 < 0.02 && TR.sq[n - 1] > 6.8, 'the mode stays a pure state — its Wronskian, the determinant of its covariance, is conserved — while it is squeezed: r starts at zero in the vacuum and ends at ln(aH/k), one e-fold of squeezing per e-fold of expansion',
    `|Im(Q*P)| − ½ ≤ ${e(wd)} · r: ${i0.toFixed(4)} → ${TR.sq[n - 1].toFixed(3)} · |r − ln(aH/k)| ≤ ${worst.toFixed(3)} at +7 e-folds`); }

{ const n = TR.N.length, at = d => { let i = 0; while (i < n - 1 && TR.N[i] < STAR.B.N[STAR.ik] + d) i++; return TR.P[i] / TR.P[n - 1]; };
  const c = at(0), a3 = at(3), a5 = at(5), early = at(-3);
  check(Math.abs(a5 - 1) < 1e-3 && Math.abs(a3 - 1) < 0.02 && c > 1.5 && c < 2.6 && early > 100, 'the curvature perturbation freezes: k³|ζ|²/2π² falls as a⁻² inside the horizon, is about twice its final value at k = aH, and is constant afterwards',
    `÷ final: ${early.toFixed(0)} at −3 e-folds · ${c.toFixed(3)} at crossing · ${a3.toFixed(5)} at +3 · ${a5.toFixed(6)} at +5`); }

const ALL = {};
{ let d2 = 0, r2 = 0, d1 = 0; const rows = [];
  for (const [m, q] of [['star', null], ['tmodel', 1], ['tmodel', 10], ['quad', null], ['lin', null], ['p23', null], ['natural', 7]]) for (const N of [50, 60]) { const O = L.inqObservables(m, q, N); ALL[m + q + N] = O;
    d2 = Math.max(d2, Math.abs(O.ns - O.sr.ns2)); r2 = Math.max(r2, Math.abs(O.r / O.sr.r2 - 1)); d1 = Math.max(d1, Math.abs(O.ns - O.sr.ns1)); if (N === 60) rows.push(`${m}${q ?? ''} ${O.ns.toFixed(4)}/${O.r.toExponential(2)}`); }
  const s1 = Math.abs(STAR.ns - STAR.sr.ns1), s2 = Math.abs(STAR.ns - STAR.sr.ns2);
  check(d2 < 5e-5 && r2 < 1e-3 && s1 > 3e-4 && s1 < 6e-4 && s2 < 3e-5, 'seven potentials at N* = 50 and 60: the integrated n_s agrees with second-order slow roll (Stewart–Lyth) to 5·10⁻⁵ and r to 10⁻³; for R² inflation at N* = 55 the first-order formula is off by 4.5·10⁻⁴',
    `|n_s − 2nd order| ≤ ${e(d2)} · |r/r₂ − 1| ≤ ${e(r2)} · |n_s − 1st order| ≤ ${e(d1)} · R² at 55: ${e(s1, 2)} vs ${e(s2, 2)} · at N* = 60: ${rows.join(', ')}`); }

{ const q = L.inqObservables('quad', null, 55), sN = Math.abs(STAR.ns - (1 - 2 / 55)), sR = STAR.r / (12 / 55 ** 2), qN = Math.abs(q.ns - (1 - 2 / 55.5)), qR = q.r / (8 / 55.5);
  check(Math.abs(STAR.ns - 0.96490) < 2e-5 && Math.abs(STAR.r - 0.00355) < 1e-5 && sN < 2e-3 && sR > 0.8 && sR < 1.1 && qN < 1e-3 && Math.abs(qR - 1) < 0.01, 'the textbook numbers, which are leading order in 1/N: R² inflation gives n_s ≈ 1 − 2/N and r ≈ 12/N² (integrated: 0.96490 and 0.00355 at N* = 55), φ² gives n_s ≈ 1 − 2/(N + ½) and r ≈ 8/(N + ½)',
    `R²: n_s = ${STAR.ns.toFixed(5)} (1 − 2/N = ${(1 - 2 / 55).toFixed(5)}), r = ${STAR.r.toFixed(5)} = ${sR.toFixed(3)}·12/N² · φ²: n_s = ${q.ns.toFixed(5)}, r = ${q.r.toFixed(4)} = ${qR.toFixed(4)}·8/(N + ½)`); }

{ let cons = 0, pt = 0, en = 0;
  for (const O of [STAR, ...Object.values(ALL)]) { cons = Math.max(cons, Math.abs(-8 * O.nt / O.r - 1)); pt = Math.max(pt, Math.abs(O.Pt1 / O.srPt - 1));
    en = Math.max(en, Math.abs(O.E_GeV / (Math.pow(1.5 * Math.PI ** 2 * L.INQ_AS * O.r, 0.25) * L.INQ_MPL_GEV) - 1)); }
  check(cons < 0.06 && pt < 0.03 && en < 0.01 && STAR.E_GeV > 7.5e15 && STAR.E_GeV < 8.3e15, 'gravitational waves: P_t = 2H²/π² at horizon crossing to within slow-roll corrections, r = −8n_t likewise, and the energy of inflation is V*^¼ = (3π²A_s r/2)^¼ M_pl — 7.9·10¹⁵ GeV for R² inflation',
    `|−8n_t/r − 1| ≤ ${cons.toFixed(4)} · |P_t/(2H²/π²) − 1| ≤ ${pt.toFixed(4)} · energy identity ≤ ${e(en)} · R²: ${e(STAR.E_GeV, 3)} GeV, H* = ${e(STAR.H_GeV, 2)} GeV`); }

{ const D = L.INQ_DATA, zP = (STAR.ns - D.planck.ns) / D.planck.sig, zA = (STAR.ns - D.act.ns) / D.act.sig, q60 = ALL['quadnull60'], l60 = ALL['linnull60'], p60 = ALL['p23null60'];
  check(D.planck.ns === 0.9649 && D.planck.sig === 0.0042 && D.act.ns === 0.9743 && D.act.sig === 0.0034 && D.bk18.r95 === 0.036 && Math.abs(L.INQ_AS - Math.exp(3.044) * 1e-10) < 1e-13
    && Math.abs(zP) < 0.05 && zA < -2.6 && zA > -2.9 && STAR.r < D.bk18.r95 && q60.r > D.bk18.r95 && l60.r > D.bk18.r95 && p60.r > D.bk18.r95 && Math.abs(q60.r - 0.132) < 1e-3,
    'what the sky has said: R² inflation at N* = 55 sits on Planck 2018’s n_s = 0.9649 ± 0.0042 and 2.8σ below ACT DR6’s 0.9743 ± 0.0034; BICEP/Keck’s r < 0.036 excludes φ², φ and φ^⅔ even at N* = 60',
    `R²: ${zP.toFixed(3)}σ (Planck), ${zA.toFixed(2)}σ (ACT) · r at N* = 60: φ² ${q60.r.toFixed(4)}, φ ${l60.r.toFixed(4)}, φ^⅔ ${p60.r.toFixed(4)}, R² ${ALL['starnull60'].r.toFixed(5)}`); }

{ const kr = L.INQ_KPIV * L.INQ_RSTAR_MPC; let flat = 0; for (let l = 2; l <= 20; l++) flat = Math.max(flat, Math.abs(L.inqSachsWolfe(l, 1, 1, kr) * 25 - 1));
  /* ∫₀^∞ x^{n−2} j₂(x)² dx by the midpoint rule to X, plus the tail ⟨j²⟩ = 1/2x² */
  const j2 = x => { const s = Math.sin(x), c = Math.cos(x); return (3 / (x * x) - 1) * s / x - 3 * c / (x * x); };
  let worst = 0; for (const ns of [0.965, 0.9743, 1]) { let sum = 0; const N = 800000, X = 3000, h = X / N; for (let i = 0; i < N; i++) { const x = (i + 0.5) * h; sum += Math.pow(x, ns - 2) * j2(x) ** 2 * h; } sum += Math.pow(X, ns - 3) / (2 * (3 - ns));
    worst = Math.max(worst, Math.abs(12 * sum / (L.inqSachsWolfe(2, ns, 25, 1)) - 1)); }
  const plateau = L.INQ_AS / 25 * L.INQ_T0_UK ** 2, d2 = L.inqSachsWolfe(2, STAR.ns, L.INQ_AS, kr) * L.INQ_T0_UK ** 2;
  check(flat < 1e-10 && worst < 1e-5 && Math.abs(plateau - 623.65) < 0.05 && d2 > plateau && d2 < 800, 'the Sachs–Wolfe plateau: ℓ(ℓ+1)C_ℓ/2π = A_s/25 exactly at n_s = 1 for ℓ = 2 … 20 — 624 µK² — and for a tilted spectrum the Γ-function closed form equals the quadrature of ∫x^{n−2}j₂(x)²dx',
    `flatness ≤ ${e(flat)} · closed form vs quadrature ≤ ${e(worst)} · A_s·T₀²/25 = ${plateau.toFixed(2)} µK² · D₂ at n_s = ${STAR.ns.toFixed(4)}: ${d2.toFixed(1)} µK²`); }

{ const Lm = 8, n = (Lm + 1) ** 2, G = Array.from({ length: n }, () => new Float64Array(n)), nt = 48, np = 64, Y = new Float64Array(n);
  /* Gauss–Legendre in cos θ, uniform in φ */
  const xs = [], ws = []; for (let i = 0; i < nt; i++) { let z = Math.cos(Math.PI * (i + 0.75) / (nt + 0.5)), pp = 1; for (let it = 0; it < 60; it++) { let p1 = 1, p2 = 0; for (let j = 1; j <= nt; j++) { const p3 = p2; p2 = p1; p1 = ((2 * j - 1) * z * p2 - (j - 1) * p3) / j; } pp = nt * (z * p1 - p2) / (z * z - 1); const z1 = z; z = z1 - p1 / pp; if (Math.abs(z - z1) < 1e-15) break; } xs.push(z); ws.push(2 / ((1 - z * z) * pp * pp)); }
  for (let i = 0; i < nt; i++) for (let j = 0; j < np; j++) { L.inqYlm(Lm, Math.acos(xs[i]), 2 * Math.PI * j / np, Y); const w = ws[i] * 2 * Math.PI / np; for (let a = 0; a < n; a++) for (let b = a; b < n; b++) G[a][b] += w * Y[a] * Y[b]; }
  let orth = 0; for (let a = 0; a < n; a++) for (let b = a; b < n; b++) orth = Math.max(orth, Math.abs(G[a][b] - (a === b ? 1 : 0)));
  const Cl = []; for (let l = 0; l <= 20; l++) Cl.push(l >= 2 ? 100 / (l * (l + 1)) : 0); const M = 600, mean = new Float64Array(21); for (let s = 1; s <= M; s++) { const S = L.inqSky(s, 20, Cl); for (let l = 2; l <= 20; l++) mean[l] += S.hat[l] / Cl[l] / M; }
  let z = 0; for (let l = 2; l <= 20; l++) z = Math.max(z, Math.abs(mean[l] - 1) / Math.sqrt(2 / (2 * l + 1) / M));
  const a = L.inqSky(7, 20, Cl), b = L.inqSky(7, 20, Cl), c = L.inqSky(8, 20, Cl);
  check(orth < 1e-10 && z < 4 && a.hat[2] === b.hat[2] && a.hat[2] !== c.hat[2], 'the sky: the real spherical harmonics it is built from are orthonormal (ℓ ≤ 8, by Gauss–Legendre quadrature), a seed always gives the same universe, and over 600 universes the estimator Ĉ_ℓ averages to the law within its cosmic variance √(2/(2ℓ+1))',
    `orthonormality ≤ ${e(orth)} · worst ⟨Ĉ_ℓ⟩/C_ℓ − 1 at ${z.toFixed(2)}σ of the mean`); }

{ const S = L.inqS3(0.001, 0.674, 3), S2 = L.inqS3(0.044, 0.674, 3), S5 = L.inqS3(0.001, 0.674, 5);
  check(Math.abs(S.efolds - 7.8186) < 1e-3 && Math.abs(S.ratio - 1 / Math.sqrt(0.001)) < 1e-9 && Math.abs(S.k_Mpc * S.R_Mpc - Math.sqrt(8)) < 1e-12 && S2.efolds < S.efolds && S5.efolds < S.efolds && Math.abs(S.R_Mpc - 140656.8) < 1,
    'the closed universe: on S³ the scalar modes are β ≥ 3 with k² = (β² − 1)/R², R = (c/H₀)/√|Ω_K|; for |Ω_K| = 0.001 and h = 0.674 the lowest left the horizon 7.82 e-folds before k = 0.05 Mpc⁻¹ — more curvature, or a higher mode, later',
    `R = ${(S.R_Mpc / 1000).toFixed(1)} Gpc = ${S.ratio.toFixed(2)} c/H₀ · β = 3: ${S.efolds.toFixed(4)} e-folds · β = 5: ${S5.efolds.toFixed(3)} · |Ω_K| = 0.044: ${S2.efolds.toFixed(3)}`); }

{ const need = [["{id:'inflate', category:'cosmo'", 'declaration'], ["ja:'原初の量子", 'Japanese title'], ['  inflate:{\n    native_space:', 'native contract'], ["id:'inflate', world:'s3', lab:'inflate'", 'instrument'],
    ["['inqAtlas','inflate',inqGroup,", 'catalogue'], ["  inflate:'первичный квант", 'Russian description'], ["  inflate:'das primordiale Quant", 'German description'], ["inqGroup.visible = (v==='inflate');", 'visibility'],
    ["if(v==='inflate'&&!inqObjs){ inqSetup(); }", 'setup'], ["else if(V==='inflate') body = inqPanelHTML();", 'panel'], ["if(V==='inflate'){ inqBind(ctl); }", 'bind'], ["} else if(state.s3view==='inflate'){\n      fbsAnimT+=labDt; updateInq(labDt);", 'update'],
    ["inflate:{speed:['inqSpeed',1], pause:['inqPaused','p']}", 'controls'], ["v==='inflate'?[0.4,2.0,9.6]", 'camera'], ["hccGo({worldId:'s3',labId:'inflate'})", 'navigator'], ["['✺','The primordial quantum'", 'journey'],
    ["{id:'inflateTested416', kind:'tested'", 'discovery'], ['globalThis.HCC_INFLATE=', 'agent handle'], ["ATLAS_BUS.pub('inflate.spectral_index'", 'bus: n_s'], ["ATLAS_BUS.pub('inflate.tensor_to_scalar'", 'bus: r'],
    ["hccGrip({ id:'inqScrubMode'", 'touch: the mode'], ["hccGrip({ id:'inqPullNstar'", 'touch: N*'], ["hccXrGrab({ id:'inflate'", 'the headset’s hand']];
  const miss = need.filter(([s]) => !src.includes(s)).map(([, n]) => n), rel = (src.match(/^  \['inflate','[a-z0-9]+','(exact|representation|invariant|contrast|analogy|coupling|causal|limit)',/gm) || []).length;
  const langs = (MATH.match(/TT\(/g) || []).length === 0;   /* the mathematics carries no prose and nothing from the page */
  check(!miss.length && rel >= 9 && langs && !/\b(document|window|THREE|state|renderer|camera)\s*[.\[(]/.test(MATH), 'the laboratory reaches every registry: the declaration in four languages, the native contract, the instrument, the catalogue and its descriptions, the scene’s dispatch, the navigator and the journeys, a discovery, the agent handle, two bus publications, two touch grips and a grab for the headset’s controller, nine relations — and its mathematics names nothing of the page',
    `${need.length - miss.length}/${need.length} sites · ${rel} relations${miss.length ? ' · MISSING ' + miss.join(', ') : ''}`); }
/* 12 · v4.417 — the scene fits the stage the cockpit leaves, and the dock stands on it. The free rectangle and the choice of
   arrangement are lifted from the atlas and run against the cockpits photographed on a desk and on phones. */
{ const FIT = cut('const INQ_BLOCK=Object.freeze(', 'const inqFitOff=');
  const run = (vw, vh, boxes) => { const doc = { getElementById: id => boxes[id] ? { getBoundingClientRect: () => { const [l, t, r, b] = boxes[id]; return { left: l, top: t, right: r, bottom: b, width: r - l, height: b - t }; } } : null };
    return new Function('document', 'getComputedStyle', 'innerWidth', 'innerHeight', 'window', `${FIT}\nconst F=inqFreeRect(); return {F, arr:(w,h)=>inqArrange(w,h), L:INQ_LAYOUT, B:INQ_BLOCK};`)(doc, () => ({ display: 'block', visibility: 'visible', opacity: '1' }), vw, vh, {}); };
  const desk = run(1440, 900, { topbar: [0, 0, 1440, 92], panelDock: [898, 101, 1426, 139], ctl: [14, 313, 350, 835], labPanel: [14, 159, 482, 305], hccCrumb: [14, 99, 414, 130], hccInspector: [424, 99, 714, 134], timeMachine: [0, 849, 1440, 900], labBar: [440, 793, 1000, 841], hud: [722, 633, 1201, 783], hierarchyLegend: [1214, 623, 1426, 835] });
  const up = run(390, 844, { topbar: [0, 0, 390, 84], hccTabs: [0, 788, 390, 844], timeMachine: [0, 733, 390, 788], labBar: [58, 90, 382, 134], hud: [8, 140, 382, 207] });
  const upSheet = run(390, 844, { topbar: [0, 0, 390, 84], ctl: [7, 496, 383, 723], hccTabs: [0, 788, 390, 844], timeMachine: [0, 733, 390, 788], labBar: [58, 90, 382, 134] });
  const side = run(852, 393, { hccTabs: [796, 0, 852, 393], timeMachine: [0, 342, 796, 393], labBar: [125, 4, 725, 48], hud: [8, 52, 400, 111] });
  const sideSheet = run(852, 393, { ctl: [415, 4, 790, 335], hccTabs: [796, 0, 852, 393], timeMachine: [0, 342, 796, 393], labBar: [58, 4, 407, 48] });
  const box = R => `${R.l},${R.t}–${R.r},${R.b}`, wh = R => [R.r - R.l, R.b - R.t], eq = (R, l, t, r, b) => R.l === l && R.t === t && R.r === r && R.b === b;
  const overlaps = (R, boxes) => Object.values(boxes).some(([l, t, r, b]) => l < R.r && r > R.l && t < R.b && b > R.t);
  const D = desk.F.withHud, okRects = eq(D, 482, 139, 1440, 623) && eq(desk.F.bare, 482, 139, 1214, 793) && eq(up.F.withHud, 0, 207, 390, 733) && eq(upSheet.F.bare, 0, 134, 390, 496) && eq(side.F.bare, 0, 48, 796, 342) && eq(sideSheet.F.bare, 0, 48, 415, 342);
  const arr = [desk.arr(...wh(D)), up.arr(...wh(up.F.withHud)), side.arr(690, 231), upSheet.arr(...wh(upSheet.F.bare))];
  const L = desk.L, B = desk.B, blocks = Math.abs(L.h.W - (B.sw + 0.3 + B.cW)) < 1e-9 && L.h.H === B.sh && L.v.W === B.sw && Math.abs(L.v.H - (B.sh + B.cH)) < 1e-9;
  const need = [['function inqFitSolve(O,R,key){', 'the fit through the camera’s projection'], ['.project(camera)', 'projection with the view offset'], ['function stageFitTick(H,O,dt){', 'solved on change'], ['const inqFitOff=()=>!!(renderer.xr&&renderer.xr.isPresenting)', 'no fit in a headset or the multiview'],
    ['<div id="inqDock" class="stageDock" role="toolbar"></div>', 'the dock'], ['@media (pointer:coarse){.stageDock button{min-width:44px;height:44px}}', '44-pixel targets'], ["d.classList.toggle('col',col);", 'a column on a phone held sideways'], ["if(document.body.classList.contains('panel-open')&&matchMedia('(max-width:900px),(pointer:coarse)').matches){ d.style.display='none'; return R; }", 'the dock steps aside for the sheet'],
    ['function inqSheetTick(){', 'the sheet opens on the laboratory’s controls'], ['id="inqTop"', 'its anchor'], ["hccGrip({ id:'inqSkyTurn'", 'the sky under the finger'], ["{id:'stageFit417', kind:'revises'", 'the ledger']];
  const miss = need.filter(([x]) => !src.includes(x)).map(([, n]) => n);
  check(okRects && !overlaps(D, { ctl: [14, 313, 350, 835], labPanel: [14, 159, 482, 305], hud: [722, 633, 1201, 783], labBar: [440, 793, 1000, 841], hierarchyLegend: [1214, 623, 1426, 835] }) && arr.join('') === 'hvhv' && blocks && !miss.length,
    'v4.417 — the scene fits the stage the cockpit leaves: the free rectangle is the largest one of the viewport on which no bar, panel, sheet or readout stands — found exactly, where a greedy cut gave a corner legend a fifth of a desk’s stage (run here on the cockpits of a desk and of a phone upright and sideways, sheet open and closed), the two blocks stand side by side or stacked, whichever is larger in it, and the dock, the sheet’s anchor and the sky’s grip are in place',
    `desk ${box(D)} → ${arr[0]} · upright ${box(up.F.withHud)} → ${arr[1]} · sideways ${box(side.F.bare)} → ${arr[2]} · upright with the sheet ${box(upSheet.F.bare)} → ${arr[3]} · sideways with the sheet ${box(sideSheet.F.bare)}${miss.length ? ' · MISSING ' + miss.join(', ') : ''}`); }
console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
