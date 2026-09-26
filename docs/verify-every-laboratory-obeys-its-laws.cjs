#!/usr/bin/env node
'use strict';
/* ══ EVERY LABORATORY OBEYS ITS LAWS — AND THE ATLAS FINDS THEM FROM THE INPUTS ════
 * The invariant finder asks which combinations of a laboratory's OUTPUTS never move. It
 * never asked what an output IS as a function of the inputs — so fourteen laboratories
 * came back silent although every one of them computes a law. The law finder asks that
 * question: a power law over every positive input at once, else the smallest sum of at
 * most three library terms plus a constant, for the output and — where that is not exact —
 * for its square and reciprocal. This file runs the finder's own code (extracted into
 * core/atlas/extracted.mjs) on physics computed HERE, with nothing of the atlas in it:
 *   1. two KdV solitons integrated on a grid: I₁ = 2√c₁ + 2√c₂ and I₂ = ⅔(c₁^{3/2} + c₂^{3/2})
 *   2. Planck's spectrum integrated numerically: the exitance is σ_SB T⁴, σ NAMED
 *   3. an SU(2) rotation built from Pauli matrices: w = cos(θ/2) — the half angle, the reason
 *      a spinor needs 4π
 *   4. a square root that only LOOKS like √ZT on a wide domain: the transform rule returns
 *      the exact M² = ZT + 1 instead of the approximate M ≈ √ZT
 *   5. it finds nothing in noise, and nothing it cannot count: an input with three values
 *      cannot carry a three-term law
 *   6. the census: every law it records is recomputed from its own text at its own inputs'
 *      sampled values where the atlas knows the closed form (the f-sum rule, 2l + 1, the
 *      half angle, Stefan–Boltzmann, M² = 1 + ZT), and the counts match the rows
 *   7. an approximate law must be a SIMPLE one — every exponent rational, every coefficient
 *      named: a free fit that holds to 1e-6 on a domain six decades wide describes the domain
 *   8. and what it found wrong: the KdV laboratory took I₃ by a central difference on a spectral
 *      grid, 2–5 % from ⅕Σc^{5/2}; it now takes it on its own modes, to 1e-5
 *   9. MUTATIONS: a finder that accepts at 5 % finds a law in a wobble; a finder without the
 *      transform loses M² = ZT + 1 — each caught
 */
const fs = require('node:fs'), path = require('node:path');
const SRC = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
let pass = 0, fail = 0;
const ok = (n, c, d) => { if (c) { pass++; console.log('  PASS — ' + n + (d ? ' :: ' + d : '')); } else { fail++; console.log('  FAIL — ' + n + (d ? ' :: ' + d : '')); } };

(async () => {
  const K = await import(path.join(__dirname, '..', 'core', 'atlas', 'extracted.mjs'));
  const { invLaws, invLawText } = K;
  let seed = 11; const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
  const find = (L, out) => L.find(l => l.out === out);

  /* 1 · KdV: u = Σ (c/2) sech²(√c (x − x₀)/2), far apart, integrated by the trapezoid rule */
  { const X = [], Y = [];
    for (let s = 0; s < 24; s++) { const c1 = 0.3 + 12 * rnd(), c2 = 0.3 + 12 * rnd(); let I1 = 0, I2 = 0; const h = 0.004;
      for (let x = -120; x <= 120; x += h) { const u = c1 / 2 / Math.cosh(Math.sqrt(c1) * (x + 50) / 2) ** 2 + c2 / 2 / Math.cosh(Math.sqrt(c2) * (x - 50) / 2) ** 2; I1 += u * h; I2 += u * u * h; }
      X.push({ c1, c2 }); Y.push({ I1, I2 }); }
    const L = invLaws(Y, X), a = find(L, 'I1'), b = find(L, 'I2');
    ok('from two solitons integrated here the finder recovers I₁ = 2√c₁ + 2√c₂ and I₂ = ⅔(c₁^{3/2} + c₂^{3/2}) — the conserved mass and momentum of KdV, coefficients named',
      a && b && a.exact && b.exact && a.text === 'I1 = 2·√c1 + 2·√c2' && b.text === 'I2 = 2/3·c1^{3/2} + 2/3·c2^{3/2}', L.map(l => l.text).join(' ; ')); }

  /* 2 · Planck: M(T) = ∫ 2πhc²/λ⁵ /(e^{hc/λkT} − 1) dλ, in x = hc/λkT, Simpson on [0, 80] */
  { const h = 6.62607015e-34, c = 299792458, k = 1.380649e-23, X = [], Y = [];
    const I = (() => { const n = 160000, dx = 80 / n; let s = 0; for (let i = 0; i <= n; i++) { const x = i * dx, f = x === 0 ? 0 : x ** 3 / Math.expm1(x); s += f * (i === 0 || i === n ? 1 : i % 2 ? 4 : 2); } return s * dx / 3; })();
    for (let s = 0; s < 20; s++) { const T = Math.exp(Math.log(3) + rnd() * Math.log(1e5)); X.push({ T }); Y.push({ exitance: 2 * Math.PI * k ** 4 * T ** 4 / (h ** 3 * c ** 2) * I }); }
    const L = invLaws(Y, X), e = find(L, 'exitance');
    ok('from Planck\'s spectrum integrated here the exitance comes back as σ_SB · T⁴ — the constant NAMED, not fitted', e && e.exact && e.text === 'exitance = σ_SB · T^4',
      `∫x³/(eˣ−1) = ${I.toFixed(12)} (π⁴/15 = ${(Math.PI ** 4 / 15).toFixed(12)}) · ${e && e.text}`); }

  /* 3 · SU(2): U = cos(θ/2) 1 − i sin(θ/2) n·σ, built from Pauli products by the exponential series */
  { const X = [], Y = [];
    for (let s = 0; s < 20; s++) { const th = 4 * Math.PI * rnd();
      /* exp(−iθσ_z/2) by 40 terms of the series on the 2×2 diagonal: the real part of its (0,0) entry */
      let re = 0, im = 0, tr = 1, ti = 0; for (let n = 0; n < 60; n++) { re += tr; im += ti; const a = -th / 2 / (n + 1); [tr, ti] = [-ti * a, tr * a]; }
      X.push({ theta: th }); Y.push({ w: re }); }
    const L = invLaws(Y, X, { units: { theta: 'rad' } }), w = find(L, 'w');
    ok('from an SU(2) exponential summed here the finder reads w = cos(θ/2): the half angle, which is why a spinor returns only after 4π', w && w.exact && w.text === 'w = cos(theta/2)', w && w.text); }

  /* 4 · the transform rule */
  const ztRows = () => { const X = [], Y = []; for (let s = 0; s < 30; s++) { const ZT = 1e6 * rnd(); X.push({ ZT }); Y.push({ M: Math.sqrt(1 + ZT) }); } return [Y, X]; };
  { const [Y, X] = ztRows(), L = invLaws(Y, X), m = find(L, 'M');
    ok('on ZT ∈ [0, 10⁶] √(1+ZT) is within 10⁻⁵ of √ZT — the finder returns the EXACT M² = ZT + 1, because an exact law in a transform beats an approximate one', m && m.exact && m.of === '²' && m.text === 'M² = ZT + 1', m && m.text); }

  /* 5 · nothing in noise, nothing it cannot count */
  { const X = [], Y = []; for (let s = 0; s < 40; s++) { const a = 1 + rnd(), b = 1 + rnd(); X.push({ a, b }); Y.push({ n: Math.sin(97 * a * b) + rnd() }); }
    const L = invLaws(Y, X);
    const X3 = [], Y3 = []; for (let s = 0; s < 30; s++) { const q = [1, 2, 3][s % 3]; X3.push({ q }); Y3.push({ y: Math.sin(q) + 7 }); }
    const L3 = invLaws(Y3, X3);
    ok('no law in noise; and an input that takes three values cannot carry a law of three parameters — the fit would be exact by counting', L.length === 0 && L3.length === 0, `noise → ${L.length} · three-valued input → ${L3.length}`); }

  /* 6 · the census */
  const C = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'api', 'invariants.json'), 'utf8'));
  const lab = id => C.laboratories.find(r => r.id === id), lawOf = (id, o) => ((lab(id) || {}).across || {}).laws && lab(id).across.laws.find(l => l.output === o);
  const known = [['cau', 'f_sum_exact', 'f_sum_exact = π/2 · omega_p^2'], ['sh', 'multiplicity', 'multiplicity = 2·l + 1'], ['su2', 'w', 'w = cos(theta/2)'], ['bb', 'exitance', 'exitance = σ_SB · T^4'], ['te', 'M', 'M² = ZT + 1'], ['te', 'carnot', 'carnot = 1 − tau'], ['atom', 'electrons', 'electrons = Z']];
  const hits = known.map(([id, o, t]) => { const l = lawOf(id, o); return [id + '.' + o, !!(l && l.exact && l.law === t), l ? l.law : 'missing']; });
  ok('the census records, from the laboratories themselves, the f-sum rule π/2·ω_p², the multiplicity 2l + 1, the spinor half angle, Stefan–Boltzmann, M² = 1 + ZT, Carnot 1 − τ and electrons = Z — each exact',
    hits.every(h => h[1]), hits.filter(h => !h[1]).map(h => h[0] + ' → ' + h[2]).join(' ; ') || hits.map(h => h[2]).join(' ; '));
  const n = C.counts, rows = C.laboratories;
  const exact = rows.reduce((a, r) => a + ((r.across || {}).laws || []).filter(l => l.exact).length, 0), withLaw = rows.filter(r => ((r.across || {}).laws || []).length).length;
  /* a silent laboratory speaks through either finder: a law in all its inputs, or one found a variable at a time */
  const sep = r => Array.isArray(r.separable) && r.separable.length, speak = rows.filter(r => r.across && r.across.verdict === 'NONE' && ((r.across.laws || []).length || sep(r))).map(r => r.id);
  const sepLaws = rows.reduce((a, r) => a + (sep(r) ? r.separable.length : 0), 0), sepLabs = rows.filter(sep).length;
  ok('the counts are the rows: exact laws, laboratories with a law, and the silent laboratories that now speak', n.laws_exact === exact && n.laboratories_with_a_law === withLaw && n.silent_laboratories_that_now_speak === speak.length && exact > 100 && n.separable_laws === sepLaws && n.laboratories_with_a_separable_law === sepLabs,
    `${exact} exact laws in ${withLaw} of ${rows.length} laboratories · ${n.laws_holding} holding · ${n.laws_named} with every coefficient named · the silent that speak: ${speak.join(', ')} · a variable at a time: ${sepLaws} laws in ${sepLabs}`);

  /* 7 · wiring */
  ok('the wiring: sampling keeps the inputs of every answer, the analysis asks for laws when it has them, the panel shows them first',
    /rows\.push\(r\); X\.push\(Object\.fromEntries\(vary\.map\(f=>\[f\.name,inp\[f\.name\]\]\)\)\);/.test(SRC) && /if\(opts\.X\) out\.laws=invLaws\(rows,opts\.X,\{units:opts\.units\}\);/.test(SRC)
    && /Laws — what each output IS, found from the inputs/.test(SRC) && /invAnalyse\(rows,\{X:meta\.X,units:meta\.units\}\)/.test(SRC));

  /* 7b · what the law finder found wrong in a laboratory: the KdV laboratory evolved its field on
     256 Fourier modes and took I₃'s derivative by a central difference at dx = 0.23. The finder read
     I₁ = 2Σ√c to 1e-9 there and nothing for I₃; the continuum value is ⅕Σc^{5/2}, derived HERE:
     ∫u³ = (4/15)c^{5/2}, ∫u_x² = (2/15)c^{5/2}, so ∫(u³ − ½u_x²) = ⅕ c^{5/2} per soliton */
  { const pairs = [[5, 2], [6, 5.5], [9, 4], [12, 7], [14.8, 11]], I3c = (a, b) => 0.2 * (a ** 2.5 + b ** 2.5);
    const spec = pairs.map(([a, b]) => Math.abs(K.kdvInvariants(K.kdvTwoSoliton(a, b, -20, -8)).I3 / I3c(a, b) - 1));
    const N = 256, L = 60, dx = L / N, fd = pairs.map(([a, b]) => { const u = K.kdvTwoSoliton(a, b, -20, -8); let I3 = 0;
      for (let i = 0; i < N; i++) { const ux = (u[(i + 1) % N] - u[(i - 1 + N) % N]) / (2 * dx); I3 += (u[i] ** 3 - 0.5 * ux * ux) * dx; } return Math.abs(I3 / I3c(a, b) - 1); });
    ok('the KdV laboratory now takes I₃ on its own 256 modes: I₃ = ⅕Σc^{5/2} to 1e-5 for separated solitons up to c = 15 — and the central difference it replaced (MUTATION) is off by more than one per cent, caught',
      Math.max(...spec) < 1e-5 && Math.max(...fd) > 1e-2 && /u_x on the SAME 256 modes the evolution uses/.test(SRC),
      `spectral worst ${Math.max(...spec).toExponential(1)} · central difference worst ${(100 * Math.max(...fd)).toFixed(1)} %`); }

  /* 8 · mutations */
  { const X = [], Y = []; for (let s = 0; s < 40; s++) { const a = 1 + rnd(); X.push({ a }); Y.push({ n: a * (1 + 0.02 * Math.sin(50 * a)) }); }
    ok('MUTATION — a finder that accepts at 5 % finds a "law" in a 2 % wobble, and is caught', invLaws(Y, X, { loose: 0.05 }).length > 0 && invLaws(Y, X).length === 0); }
  { const [Y, X] = ztRows(), src = invLaws.toString(), cut = "const TR=[{tag:'',f:v=>v},{tag:'²',f:v=>v*v},{tag:'⁻¹',f:v=>1/v}];";
    const mut = new Function('invLsq', 'invRat1', 'invLawLib', 'invLawText', 'invClosedFormPhys', 'return ' + src.replace(cut, "const TR=[{tag:'',f:v=>v}];"))(K.invLsq, K.invRat1, K.invLawLib, K.invLawText, K.invClosedFormPhys);
    const m = mut(Y, X)[0], good = invLaws(Y, X)[0];
    ok('MUTATION — a finder without the transform loses the exact law: what is left is √ZT with free coefficients, which is not offered as a law at all — caught', src.includes(cut) && good && good.exact && good.of === '²' && !(m && m.exact), m ? m.text + ' (holds to ' + m.spread.toExponential(1) + ')' : 'no law offered for M'); }

  console.log('\n  ' + pass + ' passed, ' + fail + ' failed'); process.exit(fail ? 1 : 0);
})();
