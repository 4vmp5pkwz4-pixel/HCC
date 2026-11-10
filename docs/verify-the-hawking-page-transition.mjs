/* THE HAWKING–PAGE TRANSITION AT WEAK COUPLING (v4.418) — after «The Hawking–Page transition at weak coupling» (hexagon
   2611.00175v1, 7 November 2026). The laboratory's mathematics is one block of pure functions (HPAGE-MATH), lifted out of
   index.html and run here as it stands. What is checked is what the atlas computes; the manuscript's three-loop coefficient b
   is NOT recomputed, here or there, and check 6 only re-runs its arithmetic.
     1. the letters of the theory are sums over the harmonics of S³;
     2. the Hagedorn point: 7 − 4√3 and 2 − √3, slopes 3/2 and 3, the manuscript's β₀ and A₂;
     3. the Gross–Witten–Wadia potential: twice differentiable at u = ½, third derivative jumping by 8, (4/3)ε³ beyond;
     4. the eigenvalue density is normalised and has first moment u on both sides of the gap;
     5. the saddles, solved: leading-order limits |b|/4, |b|/2, ½ + √|b|/4 and ⅜ as b → 0, and the size of what lies beyond;
     6. the manuscript's arithmetic: −4β₀²I + β₀q₄, the four pieces, the threshold, the coefficients of the three temperatures;
     7. the three saddles in order: confined, barrier, deconfined — and which one wins on each side of T_c;
     8. the AdS₅ black hole: T_min, T_HP, the first law, the latent heat, and the two ends of the coupling set side by side;
     9. the laboratory reaches every registry of the atlas, and the shared stage fit and dock serve two laboratories. */
import fs from 'node:fs'; import path from 'node:path';
const ROOT = path.join(path.dirname(new URL(import.meta.url).pathname), '..');
const src = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
let pass = 0, fail = 0;
const check = (ok, claim, nums) => { if (ok) pass++; else fail++; console.log(`${ok ? 'PASS' : 'FAIL'} — ${claim} :: ${nums}`); };
const cut = (a, b) => { const i = src.indexOf(a), j = src.indexOf(b, i + 1); if (i < 0 || j < 0) throw new Error('block not found: ' + a.slice(0, 50)); return src.slice(i, j); };
const MATH = cut('/* ═══ HPAGE-MATH-BEGIN ═══', '/* ═══ HPAGE-MATH-END ═══');
const names = ['HPG_PAPER', 'HPG_CONTENT', 'HPG_ADS', 'hpgLetterSum', 'hpgLetter', 'hpgZn', 'hpgHagedorn', 'hpgV', 'hpgS', 'hpgDS', 'hpgRho', 'hpgSaddles', 'hpgCritical', 'hpgG2', 'hpgB', 'hpgTemps', 'hpgAdS', 'hpgAdSRoots'];
const L = new Function(`${MATH}\nreturn {${names.join(',')}};`)();
const e = (v, d = 1) => v.toExponential(d), P = L.HPG_PAPER;

{ let worst = 0; for (const x of [0.02, 0.0718, 0.2, 0.268]) for (const k of 'svf') worst = Math.max(worst, Math.abs(L.hpgLetterSum(k, x, 600) / L.hpgLetter(k, x) - 1));
  const first = [L.hpgLetter('s', 1e-4) / 1e-4, L.hpgLetter('v', 1e-4) / 1e-8, L.hpgLetter('f', 1e-4) / 1e-6];
  check(worst < 1e-12 && Math.abs(first[0] - 1) < 1e-3 && Math.abs(first[1] - 6) < 1e-2 && Math.abs(first[2] - 4) < 1e-2,
    'the letters are sums over the harmonics of S³: (j + 1)² scalars at j + 1, 2j(j + 2) vectors at j + 1, 2j(j + 1) Weyl fermions at j + ½ sum to (x + x²)/(1 − x)³, (6x² − 2x³)/(1 − x)³ and 4x^{3/2}/(1 − x)³ — the lowest: one scalar at 1/R, six vectors at 2/R, four fermions at 3/2R',
    `sum ÷ closed form − 1 ≤ ${e(worst)} · leading coefficients ${first.map(v => v.toFixed(3)).join(', ')}`); }

const H = L.hpgHagedorn('n4'), Y = L.hpgHagedorn('ym');
check(Math.abs(H.x - (7 - 4 * Math.sqrt(3))) < 1e-13 && Math.abs(Y.x - (2 - Math.sqrt(3))) < 1e-13 && Math.abs(H.slope - 1.5) < 1e-7 && Math.abs(Y.slope - 3) < 1e-7 && Math.abs(H.beta0 - 2.6339158) < 5e-8 && Math.abs(1 - H.z2 - 0.9742786) < 5e-8 && Math.abs(Math.sqrt(H.x) - Y.x) < 1e-13,
  'the Hagedorn point z(x_H) = 1: x_H = 7 − 4√3 for N = 4 super-Yang–Mills and 2 − √3 for pure glue (its square root), with x z′ = 3/2 and 3; β₀ = 2.6339158 and 1 − z₂ = 0.9742786 are the manuscript’s β₀ and A₂',
  `x_H = ${H.x.toFixed(12)}, ${Y.x.toFixed(12)} · slopes ${H.slope.toFixed(8)}, ${Y.slope.toFixed(8)} · β₀ = ${H.beta0.toFixed(8)} · 1 − z₂ = ${(1 - H.z2).toFixed(8)} · T_H⁰R = ${H.TR.toFixed(5)}, ${Y.TR.toFixed(5)}`);

{ const h = 2e-4, f = L.hpgV, c0 = Math.abs(f(0.5 + 1e-9) - f(0.5 - 1e-9)), d1 = (f(0.5 + h) - f(0.5)) / h - (f(0.5) - f(0.5 - h)) / h, d2r = (f(0.5 + 2 * h) - 2 * f(0.5 + h) + f(0.5)) / (h * h), d2l = (f(0.5) - 2 * f(0.5 - h) + f(0.5 - 2 * h)) / (h * h),
    d3r = (-f(0.5) + 3 * f(0.5 + h) - 3 * f(0.5 + 2 * h) + f(0.5 + 3 * h)) / h ** 3, d3l = (f(0.5) - 3 * f(0.5 - h) + 3 * f(0.5 - 2 * h) - f(0.5 - 3 * h)) / h ** 3, eps = 0.01, cubic = (f(0.5 + eps) - (0.5 + eps) ** 2) / ((4 / 3) * eps ** 3);
  check(c0 < 1e-8 && Math.abs(d1) < 1e-3 && Math.abs(d2r - d2l) < 0.02 && Math.abs(d3r - d3l - 8) < 0.05 && Math.abs(cubic - 1) < 0.02,
    'the Gross–Witten–Wadia potential — u² while the eigenvalues cover the circle, ¼ − ½ ln[2(1 − u)] once a gap has opened — is twice differentiable at u = ½, its third derivative jumps by 8, and V − u² = (4/3)ε³ just beyond: a third-order transition of its own',
    `jump in V ${e(c0)} · in V′ ${e(Math.abs(d1))} · in V″ ${e(Math.abs(d2r - d2l))} · in V‴ ${(d3r - d3l).toFixed(4)} · (V − u²)/(4ε³/3) at ε = 0.01: ${cubic.toFixed(4)}`); }

{ let worst = 0, gap = 0; for (const u of [0.1, 0.35, 0.5, 0.6, 0.8, 0.97]) { let n = 0, m = 0; const N = 200000; for (let i = 0; i < N; i++) { const th = -Math.PI + 2 * Math.PI * (i + 0.5) / N, r = L.hpgRho(th, u); n += r * 2 * Math.PI / N; m += r * Math.cos(th) * 2 * Math.PI / N; } worst = Math.max(worst, Math.abs(n - 1), Math.abs(m - u)); }
  gap = L.hpgRho(Math.PI, 0.4) > 0 && Math.abs(L.hpgRho(Math.PI, 0.5)) < 1e-12 && L.hpgRho(2.5, 0.8) === 0;
  check(worst < 1e-5 && gap, 'the eigenvalues of the Polyakov loop: the density integrates to one and its first moment is u on both sides of the transition; it touches zero at θ = π exactly at u = ½ and is zero on an arc beyond', `|∫ρ − 1|, |∫ρ cos θ − u| ≤ ${e(worst)} over six values of u`); }

{ const rows = [], lim = [];
  for (const b of [-1e-6, -1e-4, -1.4813e-3, -0.037]) { const K = L.hpgCritical(b); rows.push(`${e(-b)}: ${(K.mc / K.lead.mc).toFixed(5)}, ${(K.ms / K.lead.ms).toFixed(5)}, ${(K.uc - K.lead.uc).toExponential(1)}`); lim.push([K.mc / K.lead.mc - 1, K.ms / K.lead.ms - 1, K.uc - K.lead.uc, Math.sqrt(-b)]); }
  const T1 = L.hpgTemps(1, 'n4'), sc = lim.map(r => r[0] / r[3]);   /* the correction to m_c scales as √|b| */
  check(Math.abs(lim[0][0]) < 2e-3 && Math.abs(lim[0][1]) < 1e-4 && lim.every((r, i) => !i || r[0] > lim[i - 1][0]) && Math.abs(sc[1] / sc[2] - 1) < 0.2 && Math.abs(T1.tc - 9.62e-5) < 2e-7 && Math.abs(T1.lead.tc - 9.3736e-5) < 2e-9 && Math.abs(T1.K.uc - 0.50987) < 2e-5 && Math.abs(T1.latent - 0.390) < 1e-3 && Math.abs(L.hpgTemps(0.01, 'n4').latent - 0.375) < 1e-3,
    'the saddles of the matrix model, solved by scan and bisection: as b → 0 the transition is at m² = |b|/4, the deconfined phase first exists at |b|/2, the loop is ½ + √|b|/4 and the latent heat ⅜ N²/R — the manuscript’s formulas — and at λ = 1 the solved transition is at 9.62·10⁻⁵, 2.6 % above the leading-order 9.37·10⁻⁵, a relative correction that grows as √|b|',
    `|b| : m_c²/(|b|/4), m_s²/(|b|/2), u_c − (½ + √|b|/4) → ${rows.join(' · ')} · λ = 1: ${e(T1.tc, 3)} vs ${e(T1.lead.tc, 3)}, |u| = ${T1.K.uc.toFixed(5)}, latent ${T1.latent.toFixed(4)}`); }

{ const b0 = H.beta0, id = -4 * b0 * b0 * P.I + b0 * P.q4, sum = P.pieces.reduce((a, b) => a + b, 0), thr = 4 * b0 * P.I, g4 = 1 / (256 * Math.PI ** 4), c = -P.b_g4 / (6 * b0);
  check(Math.abs(id - P.b_g4) < 0.01 && Math.abs(sum - P.b_g4) < 0.011 && Math.abs(P.q4a + P.q4b - P.q4) < 1e-9 && Math.abs(thr - 11.79) < 0.01 && Math.abs(P.b_g4 * g4 + 1.4813e-3) < 2e-7 && Math.abs(c - 2.337) < 1e-3 && Math.abs(P.hw2 + c - 13.84) < 0.01 && Math.abs(P.hw2 + 2 * c - 16.18) < 0.01 && Math.abs(c * g4 - 9.37e-5) < 1e-7 && Math.abs(L.hpgB(1, 'n4') - P.b_g4 * g4) < 1e-12,
    'the manuscript’s arithmetic, re-run from its own inputs (its three-loop numbers are not recomputed): −4β₀²I + β₀q₄ = −36.94 = the sum of its four pieces; q₄ = q₄⁽ᵃ⁾ + q₄⁽ᵇ⁾; b > 0 would need q₄ > 11.79; b = −1.4813·10⁻³ λ²; |b|/6β₀ = 2.337 g⁴ = 9.37·10⁻⁵ λ², and T_c, T_min at −13.84 g⁴ and −16.18 g⁴',
    `−4β₀²I + β₀q₄ = ${id.toFixed(4)} · Σ pieces = ${sum.toFixed(2)} · threshold ${thr.toFixed(3)} · b/λ² = ${e(P.b_g4 * g4, 4)} · ${c.toFixed(4)} g⁴ → ${(P.hw2 + c).toFixed(3)}, ${(P.hw2 + 2 * c).toFixed(3)}`); }

{ const b = L.hpgB(5, 'n4'), K = L.hpgCritical(b), at = t => L.hpgSaddles(t * K.mc, b), below = at(1.3), above = at(0.7), none = at(K.ms / K.mc * 1.05), hot = at(-0.5);
  const ok3 = below.length === 2 && !below[0].min && below[1].min && below[0].u < 0.5 && below[1].u > 0.5 && below[1].S > 0 && above.length === 2 && above[1].S < 0 && none.length === 0 && hot.length === 1 && hot[0].min && hot[0].S < 0;
  check(ok3 && Math.abs(at(1)[1].S) < 1e-9 * Math.abs(b) + 1e-12, 'three saddles, as on the gravity side: the confined one at u = 0, a barrier below the gap and a deconfined minimum beyond it; the deconfined one is the higher just below T_c and the lower just above, degenerate at T_c; below T_min there is only confinement, above T_H only deconfinement',
    `λ = 5: at 1.3·m_c² u = ${below.map(s => s.u.toFixed(4)).join(', ')} (S_dec = ${e(below[1].S)}) · at 0.7·m_c² S_dec = ${e(above[1].S)} · at T_c S_dec = ${e(Math.abs(at(1)[1].S))} · past the spinodal ${none.length} saddles · above T_H ${hot.length}`); }

{ const A = L.HPG_ADS, a1 = L.hpgAdS(1), am = L.hpgAdS(A.rhoMin), h = 1e-5; let fl = 0, tmin = 1e9;
  for (const r of [0.3, 0.7071, 1, 1.6]) fl = Math.max(fl, Math.abs((L.hpgAdS(r + h).E - L.hpgAdS(r - h).E) / (L.hpgAdS(r + h).S - L.hpgAdS(r - h).S) / L.hpgAdS(r).T - 1), Math.abs(L.hpgAdS(r).E - L.hpgAdS(r).T * L.hpgAdS(r).S - L.hpgAdS(r).F));
  for (let i = 1; i < 4000; i++) tmin = Math.min(tmin, L.hpgAdS(i / 1000).T); const R = L.hpgAdSRoots(0.5);
  check(Math.abs(a1.T - 3 / (2 * Math.PI)) < 1e-14 && Math.abs(a1.F) < 1e-15 && Math.abs(am.T - Math.SQRT2 / Math.PI) < 1e-14 && Math.abs(tmin - A.Tmin) < 1e-6 && fl < 1e-8 && Math.abs(a1.E - 1.5) < 1e-14 && Math.abs(L.hpgAdS(R.small).T - 0.5) < 1e-12 && Math.abs(L.hpgAdS(R.large).T - 0.5) < 1e-12 && R.small < A.rhoMin && R.large > 1
    && Math.abs(A.THP / H.TR - 1.2576) < 1e-3 && Math.abs(a1.E / 0.375 - 4) < 1e-12,
    'the other end of the coupling, AdS₅–Schwarzschild: no black hole below T_min·L = √2/π, the large one dominates above T_HP·L = 3/2π where F = 0; E = F + TS and dE = T dS; its latent heat 3N²/2L is four times the weak-coupling ⅜ N²/R, and T_HP is 1.258 times the free Hagedorn temperature',
    `T_min·L = ${am.T.toFixed(6)} (scan ${tmin.toFixed(6)}) · T_HP·L = ${a1.T.toFixed(6)} · first law ≤ ${e(fl)} · at T·L = 0.5: ρ = ${R.small.toFixed(4)}, ${R.large.toFixed(4)} · T_HP/T_H⁰ = ${(A.THP / H.TR).toFixed(4)} · latent ratio ${(a1.E / 0.375).toFixed(1)}`); }

{ const need = [["{id:'hpage', category:'quant'", 'declaration'], ["ja:'弱結合でのホーキング・ペイジ転移", 'Japanese title'], ['  hpage:{\n    native_space:', 'native contract'], ["id:'hpage', world:'s3', lab:'hpage'", 'instrument'], ["['hpgAtlas','hpage',hpgGroup,", 'catalogue'],
    ["  hpage:'переход Хокинга–Пейджа", 'Russian description'], ["  hpage:'der Hawking-Page-Übergang", 'German description'], ["hpgGroup.visible = (v==='hpage');", 'visibility'], ["if(v==='hpage'&&!hpgObjs){ hpgSetup(); }", 'setup'], ["else if(V==='hpage') body = hpgPanelHTML();", 'panel'], ["if(V==='hpage'){ hpgBind(ctl); }", 'bind'],
    ["} else if(state.s3view==='hpage'){\n      fbsAnimT+=labDt; updateHpg(labDt);", 'update'], ["hpage:{speed:['hpgSpeed',1], pause:['hpgPaused','p']}", 'controls'], ["v==='hpage'?[0.4,2.0,9.6]", 'camera'], ["hccGo({worldId:'s3',labId:'hpage'})", 'navigator'], ["['◒','The Hawking–Page transition at weak coupling'", 'journey'],
    ["{id:'hpageTested418', kind:'tested'", 'discovery'], ['globalThis.HCC_HPAGE=', 'agent handle'], ["hccGrip({ id:'hpgTemperature'", 'touch: the temperature'], ["hccXrGrab({ id:'hpage'", 'the headset’s hand'], ["ymPanelHTML()+hpgCrossHTML('ymgap')", 'the Yang–Mills laboratory’s way here'], ["body = hpgCrossHTML('bht')+`", 'the black-hole laboratory’s way here'],
    ['function stageFitTick(H,O,dt){', 'the shared stage fit'], ['function stageDockMake(id,html){', 'the shared dock'], ['const HPG_FIT={', 'this laboratory on the shared fit'], ['const INQ_FIT={', 'the inflation laboratory on the shared fit'], ["stageSheetTick(HPG_SHEET,'hpgTop')", 'the sheet opens on its controls']];
  const miss = need.filter(([s]) => !src.includes(s)).map(([, n]) => n), rel = (src.match(/^  \['hpage','[a-z0-9]+','(exact|representation|invariant|contrast|analogy|coupling|causal|limit)',/gm) || []).length;
  check(!miss.length && rel >= 8 && !/\b(document|window|THREE|state|renderer|camera)\s*[.\[(]/.test(MATH), 'the laboratory reaches every registry — declaration in four languages, native contract, instrument, catalogue, dispatch, navigator, journey, discovery, agent handle, a touch grip and a headset grab, eight relations — the Yang–Mills and the black-hole laboratories each say what their subject becomes here and lead across; and the stage fit, the dock and the sheet anchor are shared helpers that two laboratories now stand on',
    `${need.length - miss.length}/${need.length} sites · ${rel} relations${miss.length ? ' · MISSING ' + miss.join(', ') : ''}`); }
console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
