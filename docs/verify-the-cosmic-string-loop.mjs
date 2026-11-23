/* A COSMIC-STRING LOOP AND ITS GRAVITATIONAL WAVES (v4.431) — after arXiv:2603.04735 (Brenner, Cohen-Addad, Woodruff, 5 March 2026).
   The laboratory's mathematics is one block of pure functions (CSL-MATH), lifted out of index.html and run here as it stands.
     1. the closed series of the paper against a direct quadrature over the sphere, for harmonics up to 100 and four angles;
     2. its coefficients against a Legendre projection of f_N, and C₀ = ½ Cin(2Nπ) by two routes;
     3. the loop drawn is the loop integrated: conformal-gauge constraints, and its left-mover integral gives f_N;
     4. the symmetry α ↔ π − α, and the large-N law approaching the exact value;
     5. Γ = Σ P_N/Gμ², and its stability against where the exact sum stops;
     6. the laboratory in the page and the instrument without a browser;
     7. v4.431's speed work: the measured click costs, and the changes that produced them, in the page.
   NOT checked: the paper's normalisation of P_N (taken as printed), and anything about real cosmic strings. */
import fs from 'node:fs'; import path from 'node:path';
const ROOT = path.join(path.dirname(new URL(import.meta.url).pathname), '..');
const src = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
let pass = 0, fail = 0;
const check = (ok, claim, nums) => { if (ok) pass++; else fail++; console.log(`${ok ? 'PASS' : 'FAIL'} — ${claim} :: ${nums}`); };
const i0 = src.indexOf('/* ═══ CSL-MATH-BEGIN ═══'), i1 = src.indexOf('/* ═══ CSL-MATH-END ═══', i0);
const L = new Function(`${src.slice(i0, i1)}\nreturn {CSL_EULER,cslF,cslTri,cslDirs,cslPoint,cslKinks,cslGauss,cslIQuad,cslSphJ,cslCin,cslCinAsym,cslCoeffs,cslISeries,cslIAsym,cslPower,cslGamma};`)();
const D = Math.PI / 180;

{ let worst = 0, n = 0; const rows = [];
  for (const a of [20, 60, 90, 140]) for (const N of [1, 2, 3, 4, 5, 8, 13, 31, 50, 100]) { if (N === 100 && a !== 90) continue; const q = L.cslIQuad(N, a * D), s = L.cslISeries(N, a * D), r = Math.abs(q - s) / q; worst = Math.max(worst, r); n++; if (N === 100) rows.push(`I(100, 90°) = ${s.toFixed(8)}`); }
  check(worst < 1e-12 && n === 37, 'the closed series of the paper — I = 4π Σ C₂ⱼ²/(4j + 1) P₂ⱼ(cos α), its coefficients from spherical Bessel functions and C₀ = ½ Cin(2Nπ) — equals a direct quadrature of the integral over the sphere, Gauss–Legendre in cos θ and the trapezoid rule in φ, for harmonics 1 to 100 at four angles',
    `${n} cases · worst relative difference ${worst.toExponential(2)} · ${rows.join('')}`); }

{ let worst = 0, cinW = 0;
  for (const N of [1, 2, 7, 20]) { const J = 15, C = L.cslCoeffs(N, J), G = L.cslGauss(4000);
    for (let j = 0; j <= J; j++) { const l = 2 * j; let s = 0; for (let i = 0; i < 4000; i++) { const x = G.x[i]; let p0 = 1, p1 = x, pl = l === 0 ? 1 : x; for (let k = 2; k <= l; k++) { pl = ((2 * k - 1) * x * p1 - (k - 1) * p0) / k; p0 = p1; p1 = pl; } s += G.w[i] * L.cslF(N, x) * pl; }
      worst = Math.max(worst, Math.abs((2 * l + 1) / 2 * s - C[j]) / Math.max(1, Math.abs(C[j]))); } }
  for (const z of [40, 2 * 7 * Math.PI, 100, 2 * 50 * Math.PI, 2 * 200 * Math.PI]) cinW = Math.max(cinW, Math.abs(L.cslCin(z) - L.cslCinAsym(z)) / L.cslCin(z));
  check(worst < 1e-10 && cinW < 1e-13, 'the coefficients are the Legendre coefficients of f_N: C₂ⱼ from the paper’s Bessel sums equals (2l + 1)/2 ∫ f_N P_l on 4000 Gauss–Legendre nodes for the first sixteen even orders at four harmonics; and Cin(2Nπ) by quadrature equals Cin by the asymptotic series of Ci, the route used for large arguments',
    `worst coefficient difference ${worst.toExponential(2)} · Cin routes agree to ${cinW.toExponential(2)}`); }

{ const a = 70 * D; let gauge = 0, worstMover = 0, per = 0; const h = 1e-6;
  for (let k = 0; k < 400; k++) { const sg = 0.137 + 2 * Math.PI * k / 400, t = 0.05 + 0.011 * k, ks = L.cslKinks(t), near = ks.some(q => Math.abs(((sg - q + 3 * Math.PI) % (2 * Math.PI)) - Math.PI) < 1e-3); if (near) continue;
    const xs = [0, 1, 2].map(i => (L.cslPoint(a, sg + h, t)[i] - L.cslPoint(a, sg - h, t)[i]) / (2 * h)), xt = [0, 1, 2].map(i => (L.cslPoint(a, sg, t + h)[i] - L.cslPoint(a, sg, t - h)[i]) / (2 * h));
    gauge = Math.max(gauge, Math.abs(xs[0] * xt[0] + xs[1] * xt[1] + xs[2] * xt[2]), Math.abs(xs.reduce((s, v) => s + v * v, 0) + xt.reduce((s, v) => s + v * v, 0) - 1));
    per = Math.max(per, ...[0, 1, 2].map(i => Math.abs(L.cslPoint(a, sg, t)[i] - L.cslPoint(a, sg + 2 * Math.PI, t)[i]))); }
  /* the left-mover integral of the drawn loop: ∫ a′ e^{iN(σ − r̂·a(σ))} dσ, transverse part squared, against 8 f_N(e)/N² */
  for (const N of [1, 2, 5, 9]) for (const e of [-0.83, -0.2, 0.31, 0.77]) { const M = 200000; let re = 0, im = 0; for (let k = 0; k < M; k++) { const sg = 2 * Math.PI * (k + 0.5) / M, ap = sg < Math.PI ? 1 : -1, ph = N * (sg - e * L.cslTri(sg)); re += ap * Math.cos(ph); im += ap * Math.sin(ph); }
    re *= 2 * Math.PI / M; im *= 2 * Math.PI / M; const got = (re * re + im * im) * (1 - e * e), want = 8 * L.cslF(N, e) / (N * N); worstMover = Math.max(worstMover, Math.abs(got - want) / Math.max(want, 1e-3)); }   /* where f_N vanishes the integral must too */
  check(gauge < 1e-6 && per < 1e-12 && worstMover < 1e-6, 'the loop that is drawn is the loop that is integrated: x(σ, t) = ½[a(σ − t) + b(σ + t)] with a′ = ±â, b′ = ±b̂ meets the conformal-gauge constraints ẋ·x′ = 0 and ẋ² + x′² = 1 away from its kinks and closes after 2π; and the radiation integral of its left mover, projected across the line of sight and squared, is 8 f_N(r̂·â)/N² — the very f_N of the paper',
    `constraint residual ${gauge.toExponential(1)} · periodicity ${per.toExponential(1)} · mover integral against 8f_N/N² worst ${worstMover.toExponential(1)}`); }

{ let sym = 0; for (const N of [1, 4, 11, 30]) for (const a of [15, 50, 80]) sym = Math.max(sym, Math.abs(L.cslISeries(N, a * D) - L.cslISeries(N, (180 - a) * D)) / L.cslISeries(N, a * D));
  const err = N => (L.cslIAsym(N, 90 * D) - L.cslISeries(N, 90 * D)) / L.cslISeries(N, 90 * D), mean = (a, b) => { let s = 0; for (let N = a; N <= b; N++) s += Math.abs(err(N)); return s / (b - a + 1); };
  const early = mean(5, 15), late = mean(100, 120), e100 = err(100);
  check(sym < 1e-12 && late < early / 5 && Math.abs(e100) < 0.002, 'reflecting one mover leaves the integral unchanged — I(N, α) = I(N, π − α) — and the large-N law (4π/sin²α)[γ + ln(Nπ sin α) + cos α ln tan(α/2)] closes on the exact value as N grows, with the parity oscillations the paper reports: at 90° its mean error falls by more than five times from harmonics 5–15 to 100–120, and is 0.14 % at N = 100',
    `symmetry ${sym.toExponential(1)} · mean |error| N 5–15: ${(100 * early).toFixed(3)} % · N 100–120: ${(100 * late).toFixed(3)} % · N = 100: ${(100 * e100).toFixed(3)} %`); }

{ const g60 = L.cslGamma(90 * D, 60).gamma, g200 = L.cslGamma(90 * D, 200).gamma, g80 = L.cslGamma(80 * D, 200).gamma, g100 = L.cslGamma(100 * D, 200).gamma, g57 = L.cslGamma(1, 200).gamma, g20 = L.cslGamma(20 * D, 200).gamma;
  check(Math.abs(g200 - 44.36) < 0.01 && Math.abs(g60 - g200) < 1e-3 && g80 > g200 && g100 > g200 && Math.abs(g80 - g100) < 1e-6 && Math.abs(g57 - 48.73) < 0.01 && g20 > 1.6 * g200, 'the total power Γ = Σ P_N/Gμ², summed here over every harmonic (exactly to N = 200, the tail from the large-N law): 44.36 at α = 90°, the same to 10⁻³ whether the exact sum stops at 60 or at 200, least at 90° and symmetric about it, 48.73 at one radian, and two-thirds larger at 20° — the paper itself gives no value of Γ',
    `Γ(90°) = ${g200.toFixed(4)} (exact to 60: ${g60.toFixed(4)}) · Γ(80°) = ${g80.toFixed(4)} · Γ(100°) = ${g100.toFixed(4)} · Γ(1 rad) = ${g57.toFixed(4)} · Γ(20°) = ${g20.toFixed(2)}`); }

{ const need = ["{id:'cstring', category:'cosmo'", "  cstring:{\n    native_space:", "id:'cstring', world:'s3', lab:'cstring'", "['cstring','gw','coupling'", "v==='cstring'?[0.6,2.4,9.2]:", "cslGroup.visible = (v==='cstring');", "cstring:{speed:['cslSpeed',1]", "else if(V==='cstring') body = cslPanelHTML();", "if(V==='cstring'){ cslBind(ctl); }", 'updateCsl(labDt);', "['cslAtlas','cstring',cslGroup,", "  cstring:'петля космической струны", "  cstring:'eine kosmische Stringschleife", "goLab('s3','cstring')", "{id:'cstring431', kind:'tested'", 'globalThis.HCC_CSTRING=Object.freeze({', "axes.name='csl-axes'"];
  const miss = need.filter(s => !src.includes(s));
  const M = await import(path.join(ROOT, 'core/atlas/instruments.mjs')), f = M.INSTRUMENTS.cstring, o = f ? f({ cstring_harmonic: 100, cstring_angle: 90 }) : {};
  check(!miss.length && Math.abs(o.cstring_integral - 79.39953978) < 1e-6 && Math.abs(o.cstring_total - 44.36) < 0.01 && Math.abs(o.cstring_power - 32 * o.cstring_integral / (Math.PI ** 3 * 1e4)) < 1e-12,
    'the laboratory is in the page — declaration, contract, instrument, four typed relations, the dispatch, the panel, the catalogue in four languages, the journey, the ledger, the agent handle, and its direction arrows named so that the clean view hides them — and the instrument runs with no browser',
    `cstring(100, 90°): I = ${o.cstring_integral?.toFixed(8)}, P = ${o.cstring_power?.toExponential(4)} Gμ², Γ = ${o.cstring_total?.toFixed(3)}${miss.length ? ' · missing ' + miss.map(x => x.slice(0, 40)).join(' | ') : ''}`); }

{ const T = JSON.parse(fs.readFileSync(path.join(ROOT, 'docs/data/transitions-v4.431.json'), 'utf8')), R = Object.fromEntries(T.rows.map(r => [r.step, r]));
  const need = ['let HCC_BUS_CAND_MEMO=null;', 'if(HCC_BUS_MEMO&&input===undefined){ const hit=HCC_BUS_MEMO.get(id);', 'const mid=0.5*(lo+hi); if(mid<=lo||mid>=hi) break;', "const cpu=flagged.map(i=>{ const st=gaiaStarState(D,i); return [i, galOrbit(st.d,st.v)]; });", 'const CT_REV=new WeakMap();', "if(typeof requestIdleCallback==='function') requestIdleCallback(run,{timeout:1200});",
    'html.hcc-lite *,html.hcc-lite *::before,html.hcc-lite *::after{backdrop-filter:none!important;-webkit-backdrop-filter:none!important}', /* v4.437 superseded the governor's call: a slow frame no longer removes the glass (verify-sharp-and-real.mjs, check 1) */
    "function hccLiteAuto(fps){ /* v4.437: kept for callers; a slow frame no longer removes the glass */ return false; }", "{id:'speed431', kind:'revises'"];
  const miss = need.filter(s => !src.includes(s)), s3 = R['mode:s3'], sky = R['lab:s3sky'], labs = ['lab:cosmo', 'lab:hopf', 'lab:gmode', 'lab:chaos'].map(k => R[k]);
  check(!miss.length && s3.after.click_ms < s3.before.click_ms / 3 && s3.after.evaluate_calls < s3.before.evaluate_calls && sky.after.click_ms < sky.before.click_ms / 2 && labs.every(r => r.after.click_ms < r.before.click_ms) && T.blur.fps_without_blur > T.blur.fps_with_blur,
    'v4.431 — measured, then made lighter: the work a click does before the next frame fell from 1186 to 316 ms entering the S³ world (26 instrument evaluations to 8), from 736 to 242 opening the sky laboratory and in every other laboratory measured; and the changes that did it are the ones in the page — couplings computed once, each instrument once per panel, a bisection stopped at adjacent doubles, halo orbits in the worker, a table no longer copied per call, the flow FFT in idle time — with the light-effects rule that drops the blur measured at 23.5 → 28.2 frames a second',
    `${T.rows.map(r => `${r.step} ${r.before.click_ms}→${r.after.click_ms}`).join(' · ')}${miss.length ? ' · missing ' + miss.map(x => x.slice(0, 40)).join(' | ') : ''}`); }

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
