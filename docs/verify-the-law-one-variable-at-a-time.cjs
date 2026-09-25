#!/usr/bin/env node
'use strict';
/* ══ ∂ THE LAW, ONE VARIABLE AT A TIME ═════════════════════════════════════════════════
 * The atlas's first law finder looks for one closed form in all the inputs at once (a power
 * law, or ≤ 3 library terms), and seven laboratories came back without a law. invSeparable
 * does what a physicist does instead: hold every input but one, find the law in that one —
 * the smallest exact basis subset (polynomials, roots, logs, parity (−1)^n for integers) or an
 * exact rational function P/Q — and then the law of each of its coefficients in a second input.
 * The laboratory is the oracle: it is evaluated at chosen points. This file runs the extracted
 * kernel (core/atlas/extracted.mjs) on functions written HERE:
 *   1. the Bethe–Weizsäcker mass formula with its pairing term, from numbers alone:
 *      B = (aV−aA)A − aS A^{2/3} + (aC A^{−1/3} + 4aA) Z − (aC A^{−1/3} + 4aA/A) Z² ± aP A^{−1/2}(−1)^Z
 *      for even A — every coefficient recovered and the pairing's parity structure named
 *   2. a Lorentz oscillator's absorption χ″(ω) = γ ω_p² ω / ((ω0² − ω²)² + γ²ω²): an exact
 *      rational function of degrees (1, 4) in ω, and the laws of its coefficients in ω_p and in
 *      ω0 — including the two-term (γ² − 2ω0²)/ω0⁴ of the ω² term
 *   3. it finds nothing where there is nothing: noise, and sin(xy), which separates into no
 *      finite basis
 *   4. the first finder gained the negative fractional powers the coefficients need (A^{−1/3})
 *   5. the wiring: HCC_INVARIANTS.separable, the ∂ button in every parameter space, the census
 *   6. MUTATIONS: without the parity basis the mass formula is not found; with the rows
 *      normalised inconsistently the ω0 series stop being laws
 */
const fs = require('node:fs'), path = require('node:path');
const SRC = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
let pass = 0, fail = 0;
const ok = (n, c, d) => { if (c) { pass++; console.log('  PASS — ' + n + (d ? ' :: ' + d : '')); } else { fail++; console.log('  FAIL — ' + n + (d ? ' :: ' + d : '')); } };

(async () => {
  const K = await import(path.join(__dirname, '..', 'core', 'atlas', 'extracted.mjs'));
  const { invSeparable, invSepText } = K;

  /* 1 · Bethe–Weizsäcker */
  const aV = 15.75, aS = 17.8, aC = 0.711, aA = 23.7, aP = 11.18;
  const BE = (A, Z) => { if (!(Z >= 1 && Z < A)) throw 0; let d = 0; if (A % 2 === 0) d = (Z % 2 === 0) ? aP / Math.sqrt(A) : -aP / Math.sqrt(A); return aV * A - aS * Math.pow(A, 2 / 3) - aC * Z * (Z - 1) / Math.pow(A, 1 / 3) - aA * (A - 2 * Z) ** 2 / A + d; };
  const S1 = invSeparable(BE, { name: 'Z', min: 1, max: 299, integer: true }, { name: 'A', min: 2, max: 300, integer: true });
  const t1 = invSepText(S1, 'B');
  ok('the Bethe–Weizsäcker formula from numbers alone: inner basis 1, Z, Z², (−1)^Z; coefficients (aV−aA)A − aS A^{2/3}, aC A^{−1/3} + 4aA, −aC A^{−1/3} − 4aA/A, and aP A^{−1/2} for even A, 0 for odd',
    S1 && S1.complete && S1.terms.map(t => t.basis).join() === '1,y,y²,(−1)^y' && /−159\/20·A − 89\/5·A\^\{2\/3\}/.test(t1) && /0\.711·A\^\{-1\/3\} \+ 474\/5/.test(t1) && /-0\.711·A\^\{-1\/3\} − 474\/5·1\/A/.test(t1) && /A even: 11\.18 · A\^-1\/2 · odd: 0/.test(t1),
    t1);

  /* 2 · the Lorentz oscillator */
  const g = 0.2, chiWp = (wp, w) => wp * wp * g * w / ((1 - w * w) ** 2 + g * g * w * w), chiW0 = (w0, w) => g * w / ((w0 * w0 - w * w) ** 2 + g * g * w * w);
  const S2 = invSeparable(chiWp, { name: 'omega', min: 0.005, max: 29.99 }, { name: 'omega_p', min: 0.01, max: 20 }), S3 = invSeparable(chiW0, { name: 'omega', min: 0.005, max: 29.99 }, { name: 'omega0', min: 0.05, max: 20 });
  const t2 = invSepText(S2, 'χ″'), t3 = invSepText(S3, 'χ″');
  ok('a Lorentz oscillator\'s absorption is recognised as an exact rational function of ω of degrees (1, 4), with the laws of its coefficients in ω_p (γω_p²/ω0⁴) and in ω0 (γ/ω0⁴, (γ² − 2ω0²)/ω0⁴, 1/ω0⁴)',
    S2 && S2.mode === 'rational' && S2.p === 1 && S2.q === 4 && S2.complete && /\(1\/5 · omega_p\^2\)·omega/.test(t2) && /\(−49\/25\)·omega\^2/.test(t2)
    && S3 && S3.complete && /\(1\/5 · omega0\^-4\)·omega/.test(t3) && /\(−2·1\/omega0² \+ 1\/25·1\/omega0⁴\)·omega\^2/.test(t3) && /\(omega0\^-4\)·omega\^4/.test(t3), t2 + '   |   ' + t3);

  /* 3 · nothing where there is nothing */
  let seed = 5; const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
  const N1 = invSeparable((x, y) => Math.sin(7 * x * y) + Math.cos(3 * y * y * x), { name: 'y', min: 0.1, max: 5 }, { name: 'x', min: 0.1, max: 5 });
  const N2 = invSeparable((x, y) => rnd(), { name: 'y', min: 0.1, max: 5 }, { name: 'x', min: 0.1, max: 5 });
  ok('it finds nothing where there is nothing: sin(xy) has no finite separable form, noise has none', N1 === null && N2 === null);

  /* 4 · the first finder's library */
  ok('the first finder gained the negative fractional powers these coefficients need (x^{−1/3}, x^{−2/3}, x^{−1/2}, x^{−3/2}, 1/x³, 1/x⁴)',
    /add\(n\+'\^\{-1\/3\}',-1\/3,x=>1\/Math\.cbrt\(x\)\)/.test(SRC) && /add\('1\/'\+n\+'⁴',-4,/.test(SRC));

  /* 5 · wiring */
  ok('the wiring: HCC_INVARIANTS.separable, the ∂ button in every parameter space, the census and the atlas rows',
    /separable:\(id,outs,o\)=>invSeparableFor\(id\|\|PSP\.id,outs,o\)/.test(SRC) && /id="invSep"/.test(SRC) && /function invSepHTML\(R\)\{/.test(SRC)
    && /row\.separable = await race/.test(fs.readFileSync(path.join(__dirname, '..', 'scripts', 'invariants.mjs'), 'utf8')) && /const seps=\(Array\.isArray\(L\.separable\)/.test(SRC));

  /* 6 · mutations */
  { const src = invSeparable.toString(); const noPar = new Function('invSepBasis', 'invSepSubsets', 'invSepRational', 'invSepCoefLaw', 'invLsq', 'invLaws', 'invClosedFormPhys', 'return ' + src)(
      (i, p) => K.invSepBasis(false, p), K.invSepSubsets, K.invSepRational, K.invSepCoefLaw, K.invLsq, K.invLaws, K.invClosedFormPhys);
    const M = noPar(BE, { name: 'Z', min: 1, max: 299, integer: true }, { name: 'A', min: 2, max: 300, integer: true });
    ok('MUTATION — without the parity basis (−1)^n the mass formula is not found, caught', !(M && M.complete), M ? (M.mode + ' ' + M.complete) : 'no law'); }
  { const xs = [], per = []; for (const w0 of [0.05, 0.1, 0.3, 1, 3, 10, 20]) { const ys = [], ws = []; for (let k = 0; k < 26; k++) { const w = 0.005 * Math.pow(29.99 / 0.005, (k + .5) / 26); ws.push(w); ys.push(chiW0(w0, w)); }
      const r = K.invSepRational(ws, ys, 1e-9), k = xs.length % 2 ? 4 : 0; per.push(r.B[2] / r.B[k]); xs.push(w0); }
    const law = K.invLaws(per.map(c => ({ c })), xs.map(x => ({ x })), { tol: 1e-9 }).find(l => l.out === 'c');
    ok('MUTATION — rows normalised inconsistently (alternately on the constant and on the ω⁴ term of the denominator) give an ω² series with no law in ω0, caught — the kernel uses ONE normalisation for all rows', !law || !law.exact, law ? law.text : 'no law'); }

  console.log('\n  ' + pass + ' passed, ' + fail + ' failed'); process.exit(fail ? 1 : 0);
})();
