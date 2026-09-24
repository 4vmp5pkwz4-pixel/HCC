#!/usr/bin/env node
'use strict';
/* ══ EVERY LABORATORY KEEPS ITS INVARIANTS — AND THE ATLAS FINDS THEM ══════════════
 * The parameter space of every laboratory now carries an invariant finder: sample the
 * laboratory across its declared domain or along one input, and report which
 * combinations of its outputs never move. This file runs the finder's own code (it is
 * extracted into core/atlas/extracted.mjs) and checks that it DISCOVERS, without being
 * told, relations that physics already knows:
 *   1. from the atlas's own Jeans kernel, sampled across its domain: M_J = (π/6) ρ λ_J³,
 *      t_ff² ρ = 3π/(32 G), λ_J² ρ / c_s² = π/G — with the constants NAMED — and three
 *      independent relations, exactly the number of outputs minus the number of inputs;
 *      the two mass conventions come back as one quantity at the constant ratio
 *      √(3375/π⁶) = 3·5^{3/2}·√3/π³
 *   2. from a rigid body integrated HERE (RK4 on Euler's equations, nothing of the atlas
 *      in it), sampled along time: two independent quadratic invariants in ω², which are
 *      the energy and the angular momentum — and the finder's relations lie in their span
 *   3. it names nothing that is not there: random constants get no closed form
 *   4. the wiring: every laboratory's parameter space has the section, sampling goes
 *      through HCC_API.evaluate, a slow laboratory is capped at eight seconds, and a
 *      laboratory's own residuals are reported by size instead of being searched
 *   5. MUTATIONS: a closed-form reader with a loose tolerance, and a finder that keeps a
 *      relation with a zero coefficient, are each caught
 */
const fs = require('node:fs'), path = require('node:path');
const SRC = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
let pass = 0, fail = 0;
const ok = (n, c, d) => { if (c) { pass++; console.log('  PASS — ' + n + (d ? ' :: ' + d : '')); } else { fail++; console.log('  FAIL — ' + n + (d ? ' :: ' + d : '')); } };

(async () => {
  const K = await import(path.join(__dirname, '..', 'core', 'atlas', 'extracted.mjs'));
  const { invAnalyse, invClosedForm, invFind, invRational } = K;
  let seed = 7; const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };

  /* 1 · Jeans, across its domain */
  const rows = [];
  for (let t = 0; t < 40; t++) { const T = Math.exp(Math.log(1e-3) + rnd() * Math.log(1e12)), n = Math.exp(Math.log(1e2) + rnd() * Math.log(1e24)), mu = 0.5 + 3.5 * rnd();
    const M = K.jeansMass(T, n, mu), Mv = K.jeansMassVirial(T, n, mu);
    rows.push({ jeans_mass: M, jeans_mass_solar: M / K.JEANS_MSUN, jeans_mass_virial: Mv, convention_ratio: Mv / M, jeans_length: K.jeansLength(T, n, mu), sound_speed: K.jeansSound(T, mu), free_fall_time: K.jeansFreeFall(n, mu), density: K.jeansRho(n, mu) }); }
  const A = invAnalyse(rows);
  const has = (terms, exps, form) => A.products.some(r => { const m = {}; r.terms.forEach((t, i) => m[t] = r.a[i]); const s = Math.sign(m[terms[0]] / exps[0]);
    return r.terms.length === terms.length && terms.every((t, i) => m[t] === s * exps[i]) && (!form || r.form === form || (s < 0 && r.form)); });
  const law1 = has(['jeans_mass', 'jeans_length', 'density'], [-1, 3, 1], '6/π');
  const law2 = has(['free_fall_time', 'density'], [2, 1], '3π/32 · G⁻¹');
  const law3 = has(['jeans_length', 'sound_speed', 'density'], [2, -2, 1], 'π · G⁻¹');
  ok('from the Jeans kernel alone the finder recovers M_J = (π/6)ρλ³, t_ff²ρ = 3π/(32G) and λ_J²ρ/c_s² = π/G, constants named',
    law1 && law2 && law3, A.products.slice(0, 5).map(r => r.terms.map((t, i) => `${t}^${r.a[i]}`).join('·') + (r.form ? ' = ' + r.form : '')).join(' ; '));
  /* five distinct moving quantities from three inputs, yet three relations: rank TWO. The finder has
     exposed a symmetry — every output depends on T/μ and nμ only — checked here directly */
  const sym = [2, 10, 1e3].every(lam => { const T = 50, n = 1e9, mu = 2.33, a = K.jeansMass(T, n, mu), b = K.jeansMass(lam * T, n / lam, lam * mu), c = K.jeansLength(T, n, mu), d = K.jeansLength(lam * T, n / lam, lam * mu);
    return Math.abs(a / b - 1) < 1e-12 && Math.abs(c / d - 1) < 1e-12; });
  ok('three independent relations among five distinct moving quantities: rank two, so the laboratory hides a symmetry — (T, n, μ) → (λT, n/λ, λμ) changes nothing, checked directly',
    A.nullity === 3 && A.rank === 2 && A.moving - A.aliases.length === 5 && sym && /Hidden symmetry/.test(SRC), `nullity ${A.nullity}, rank ${A.rank}; M_J and λ_J unchanged under λ = 2, 10, 1000`);
  const conv = A.constants.find(c => c.name === 'convention_ratio');
  ok('the two Jeans conventions are one quantity at a constant ratio, named √(3375/π⁶) = 3·5^{3/2}·√3/π³',
    conv && conv.form === '√(3375/π⁶)' && Math.abs(conv.value - 3 * Math.pow(5, 1.5) * Math.sqrt(3) / Math.PI ** 3) < 1e-12 && A.aliases.some(x => x.name === 'jeans_mass_solar'),
    conv ? `${conv.value} = ${conv.form}` : 'missing');

  /* 2 · a rigid body, integrated here */
  const I = [1, 2, 3]; let w = [1, 0.3, 0.7]; const f = w => [(I[1] - I[2]) / I[0] * w[1] * w[2], (I[2] - I[0]) / I[1] * w[2] * w[0], (I[0] - I[1]) / I[2] * w[0] * w[1]];
  const traj = []; const h = 1e-3;
  for (let s = 0; s < 48000; s++) { const k1 = f(w), k2 = f(w.map((x, i) => x + h / 2 * k1[i])), k3 = f(w.map((x, i) => x + h / 2 * k2[i])), k4 = f(w.map((x, i) => x + h * k3[i]));
    w = w.map((x, i) => x + h / 6 * (k1[i] + 2 * k2[i] + 2 * k3[i] + k4[i])); if (s % 1000 === 0) traj.push({ omega1: w[0], omega2: w[1], omega3: w[2] }); }
  const B = invAnalyse(traj);
  const E = traj.map(r => I[0] * r.omega1 ** 2 + I[1] * r.omega2 ** 2 + I[2] * r.omega3 ** 2), L = traj.map(r => (I[0] * r.omega1) ** 2 + (I[1] * r.omega2) ** 2 + (I[2] * r.omega3) ** 2);
  /* every found relation must be a combination of energy and momentum: Σ a_i ω_i² with a in span{(1,2,3),(1,4,9)} */
  const inSpan = r => { const a = [0, 0, 0]; r.terms.forEach((t, i) => { const m = t.match(/^omega(\d)²$/); if (m) a[+m[1] - 1] = r.a[i]; });
    if (r.terms.some(t => !/²$/.test(t))) return false; const det = a[0] * (2 * 9 - 3 * 4) - a[1] * (1 * 9 - 3 * 1) + a[2] * (1 * 4 - 2 * 1); return Math.abs(det) < 1e-9 * Math.max(...a.map(Math.abs)); };
  ok('from a rigid body\'s ω(t) alone the finder recovers two independent quadratic invariants, both in the span of the energy and the angular momentum',
    B.sums.length >= 2 && B.sums.every(inSpan) && (Math.max(...E) - Math.min(...E)) < 1e-9 && (Math.max(...L) - Math.min(...L)) < 1e-9,
    B.sums.map(r => r.terms.map((t, i) => `${r.a[i]}·${t}`).join(' + ') + ' = ' + r.c.toFixed(6)).join(' ; ') + ` · E = ${(E[0] / 2).toFixed(6)}, L² = ${L[0].toFixed(6)}`);

  /* 3 · nothing named that is not there */
  let named = 0; for (let i = 0; i < 400; i++) if (invClosedForm(0.1 + 10 * rnd())) named++;
  ok('random constants get no closed form: of 400 random numbers, none is named', named === 0 && invClosedForm(Math.PI / 6) === 'π/6' && invClosedForm(Math.sqrt(3 / 32)) === '√(3/32)', `${named} named`);

  /* 4 · wiring */
  const wires = {
    section: /<b>∮ \$\{TT\('Invariants','Инварианты','Invarianten'\)\}<\/b>/.test(SRC) && /const ig=d\.querySelector\('#invGo'\); if\(ig\) ig\.onclick=\(\)=>invRun\(\);/.test(SRC),
    evaluate: /function invSample\(id,along,cb\)\{[\s\S]*?const r=pspEval\(id,inp\); if\(r\) rows\.push\(r\);/.test(SRC),
    cap: /performance\.now\(\)-t0>8000&&rows\.length>=12/.test(SRC),
    residuals: /if\(RES\.test\(k\)&&m<1e-3\)\{ out\.residuals\.push\(\{name:k,max:m\}\); continue; \}/.test(SRC),
    api: /globalThis\.HCC_INVARIANTS=Object\.freeze\(\{symmetries:[\s\S]{0,200}across:[\s\S]{0,400}find:/.test(SRC),
  };
  const miss = Object.entries(wires).filter(([, v]) => !v).map(([k]) => k);
  ok('the wiring: a section in every parameter space, answers through HCC_API.evaluate, an eight-second cap, residuals reported not searched', miss.length === 0, miss.join(', '));

  /* 4b · the phase portrait: the same contract read as motion, with an anti-alias window */
  const phase = /function pspPhaseSample\(cb\)\{/.test(SRC) && /data-pm="phase"/.test(SRC)
    && /best=\{lo,hi,w\}; if\(r1<0\.2&&r2!=null&&r2<0\.65\*r1\+1e-9\) return best;/.test(SRC);
  /* the criterion itself, on a signal that aliases: sin(2π·t·1000) sampled at 60 and 120 points over
     the whole of [0,1] is a stroboscope; over 1/1000 of it, it is one smooth period */
  const rough = (fn, lo, hi, n) => { const v = []; for (let k = 0; k < n; k++) v.push(fn(lo + (hi - lo) * k / (n - 1))); const rg = Math.max(...v) - Math.min(...v); const st = v.slice(1).map((x, i) => Math.abs(x - v[i])).sort((a, b) => a - b); return st[st.length >> 1] / rg; };
  const sig = t => Math.sin(2 * Math.PI * 1000.37 * t), accept = (lo, hi) => { const r1 = rough(sig, lo, hi, 60), r2 = rough(sig, lo, hi, 120); return r1 < 0.2 && r2 < 0.65 * r1; };
  ok('the phase portrait refuses a stroboscope: the window is accepted only when doubling the samples halves the step — the whole domain of a fast clock is rejected, a period-sized window accepted',
    phase && !accept(0, 1) && !accept(0, 0.1) && accept(0, 0.001), `whole: ${accept(0, 1)} · 1/10: ${accept(0, 0.1)} · 1/1000: ${accept(0, 0.001)}`);

  /* 4c · the symmetry itself: the right null space of the ln–ln Jacobian, by exact row reduction.
     The Jeans elasticities are written here from the formulas (M ∝ T^{3/2} n^{-1/2} μ^{-2},
     λ ∝ T^{1/2} n^{-1/2} μ^{-1}, c_s ∝ T^{1/2} μ^{-1/2}, t_ff ∝ n^{-1/2} μ^{-1/2}, ρ ∝ n μ) */
  const EJ = [[1.5, -0.5, -2], [0.5, -0.5, -1], [0.5, 0, -0.5], [0, -0.5, -0.5], [0, 1, 1]];
  const NB = K.invNullBasis(EJ, 1e-6);
  const nb = NB.length === 1 ? NB[0].map(x => x / NB[0][0]) : null;
  const symOk = nb && nb.every((x, i) => Math.abs(x - [1, -1, 1][i]) < 1e-12) && /function invSymmetries\(id,cur\)\{/.test(SRC) && /for\(const lam of \[2,0\.3\]\)/.test(SRC);
  ok('the symmetry is named, not only counted: the null space of the Jeans Jacobian is exactly (T, n, μ) → (λT, λ⁻¹n, λμ), and the page applies each symmetry at random points before it shows it',
    symOk, nb ? `null vector ${nb.join(', ')}` : `${NB.length} vectors`);

  /* 5 · mutations */
  ok('MUTATION — a null space taken with a loose tolerance finds symmetries that are not there', K.invNullBasis(EJ, 2).length > 1, `${K.invNullBasis(EJ, 2).length} vectors when pivots under 2 are discarded`);
  const acceptOne = (lo, hi) => rough(sig, lo, hi, 60) < 0.2;
  ok('MUTATION — a one-resolution smoothness test is fooled by the stroboscope and is caught', [0.1, 0.01].some(w => acceptOne(0, w)) || acceptOne(0, 1),
    `accepted at one resolution: ${[1, 0.1, 0.01].filter(w => acceptOne(0, w)).join(', ') || 'none'}`);
  const loose = x => { for (let q = 1; q <= 64; q++) { const p = Math.round(x * q); if (p >= 1 && Math.abs(p / q - x) < 1e-3 * x) return `${p}/${q}`; } return null; };
  seed = 11; let namedLoose = 0; for (let i = 0; i < 400; i++) if (loose(0.1 + 10 * rnd())) namedLoose++;
  ok('MUTATION — a closed-form reader with a loose tolerance names random numbers and is caught', namedLoose > 50, `${namedLoose} of 400 named at 1e-3`);
  const withZero = invRational([1, 1e-9, 2]);
  ok('MUTATION — a relation with a zero coefficient is refused by the finder', /aa\.some\(x=>x===0\)\|\|Math\.max\(\.\.\.aa\)\/Math\.min\(\.\.\.aa\)>1e4\) return;/.test(SRC) && (withZero === null || withZero.includes(0)));

  console.log('\n  ' + pass + ' passed, ' + fail + ' failed'); process.exit(fail ? 1 : 0);
})();
