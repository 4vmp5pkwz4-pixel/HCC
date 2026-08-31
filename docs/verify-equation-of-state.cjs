#!/usr/bin/env node
/* ============================================================================
   WHAT HOLDS IT UP?

   A census over api/manifest.json found two dead ends facing each other.  Two
   laboratories published a PRESSURE in pascals and nothing in ninety-three
   consumed one.  The Jeans criterion consumed a NUMBER DENSITY and nothing in
   ninety-three produced one — so the whole star-formation chain in this atlas
   began at a number somebody typed by hand.

   Between a pressure and a density is the equation of state.

   This file checks the thing that makes this laboratory worth having rather
   than the thing that makes it easy.  Almost every presentation writes the
   pressure of stellar matter as an ideal-gas term PLUS a degeneracy term, or
   takes whichever of the two is larger.  Both count the same electrons twice,
   because they are two descriptions of one gas.  What is computed here is one
   integral — the relativistic Fermi-Dirac pressure at finite temperature,
   solved at every point for its own degeneracy parameter — and the two famous
   forms are its LIMITS.

   Five things are checked.

   1. THE DILUTE LIMIT.  Where the gas is thin and hot the integral must return
      n_e k T, and it must do so to seven figures, because that limit has no
      free parameters to hide an error in.
   2. THE COLD LIMIT.  Where it is cold and dense the same integral must return
      the exact Chandrasekhar T = 0 expression, over eight decades of density
      and on both sides of the relativistic transition.
   3. THE TWO CONSTANTS ARE ASYMPTOTES.  K_NR = 1.0036e7 and K_UR = 1.2435e10
      in SI are not typed into the laboratory; they are read off the integral by
      walking it into each limit.  A wrong power of h, m_e or m_u fails here and
      nowhere else.
   4. THE INDEX WALKS FROM 5/3 TO 4/3, differenced out of the integral rather
      than assumed, monotonically, which is the entire Chandrasekhar argument.
   5. AND THE LIMITING MASS AGREES WITH THE WHITE-DWARF LABORATORY, which has
      carried that number since it was written and has never been shown this
      integral.  Two laboratories, one fact, arrived at from opposite ends.
   ========================================================================= */
let pass = 0, fail = 0;
function ok(t, c, d) { (c ? pass++ : fail++); console.log(`${c ? '  PASS' : '  FAIL'} — ${t}`); if (d) console.log(`         ${d}`); }

const KB = 1.380649e-23, MU = 1.66053906660e-27, ARAD = 7.5657332500e-16;
const H = 6.62607015e-34, ME = 9.1093837015e-31, C = 299792458;
const G = 6.67430e-11, MSUN = 1.98892e30;
const LAMC = H / (ME * C), MEC2 = ME * C * C, L3 = LAMC ** 3;

function fermi(theta, psi, NA, NB) {
  const s = 1 + theta * (psi + 60);
  const xmax = Math.sqrt(Math.max(1e-24, s * s - 1)) || 1e-3;
  const sF = 1 + theta * Math.max(0, psi);
  const xF = Math.sqrt(Math.max(0, sF * sF - 1));
  const edge = xF > 0 ? theta * sF / xF : xmax;
  const split = Math.max(0, Math.min(xmax, xF - 30 * edge));
  let n = 0, P = 0, dn = 0;
  const seg = (a, b, N) => { if (!(b > a)) return; const h = (b - a) / N;
    for (let i = 0; i <= N; i++) { const x = a + i * h, r = Math.sqrt(1 + x * x), e = (r - 1) / theta - psi;
      const f = e > 700 ? 0 : 1 / (1 + Math.exp(e));
      const w = ((i === 0 || i === N) ? 1 : (i % 2 ? 4 : 2)) * h / 3;
      n += w * x * x * f; P += w * x * x * x * x / r * f; dn += w * x * x * f * (1 - f); } };
  seg(0, split, NA || 240); seg(split, xmax, NB || 600);
  const K = 8 * Math.PI / L3;
  return { n: K * n, P: (8 * Math.PI * MEC2 / (3 * L3)) * P, dn: K * dn };
}
/* the uniform grid this laboratory REFUSES to use, kept so the check can prove the
   refusal was necessary rather than decorative */
function fermiUniform(theta, psi, N) {
  const s = 1 + theta * (psi + 60);
  const xmax = Math.sqrt(Math.max(1e-24, s * s - 1)) || 1e-3;
  const h = xmax / N; let n = 0, P = 0;
  for (let i = 0; i <= N; i++) { const x = i * h, r = Math.sqrt(1 + x * x), e = (r - 1) / theta - psi;
    const f = e > 700 ? 0 : 1 / (1 + Math.exp(e));
    const w = ((i === 0 || i === N) ? 1 : (i % 2 ? 4 : 2)) * h / 3;
    n += w * x * x * f; P += w * x * x * x * x / r * f; }
  return { n: 8 * Math.PI / L3 * n, P: (8 * Math.PI * MEC2 / (3 * L3)) * P };
}
function psiFor(ne, T, NA, NB) {
  const th = KB * T / MEC2;
  const lamT = H / Math.sqrt(2 * Math.PI * ME * KB * T);
  const g1 = Math.log(Math.max(1e-300, ne * lamT ** 3 / 2));
  const x = (H / 2) * Math.pow(3 * ne / Math.PI, 1 / 3) / (ME * C);
  const g2 = (Math.sqrt(1 + x * x) - 1) / th;
  let psi = Math.max(g1, g2), lo = -Infinity, hi = Infinity, it = 0;
  for (; it < 48; it++) {
    const r = fermi(th, psi, NA, NB);
    if (!(r.n > 0)) { lo = Math.max(lo, psi); psi = Number.isFinite(hi) ? 0.5 * (psi + hi) : psi + 8; continue; }
    const d = Math.log(ne / r.n);
    if (Math.abs(d) < 1e-13) break;
    if (d > 0) lo = Math.max(lo, psi); else hi = Math.min(hi, psi);
    const slope = r.dn / r.n;
    let step = slope > 1e-300 ? d / slope : (d > 0 ? 8 : -8);
    if (step > 12) step = 12; if (step < -12) step = -12;
    let next = psi + step;
    if (!(next > lo && next < hi)) next = (Number.isFinite(lo) && Number.isFinite(hi)) ? 0.5 * (lo + hi) : psi + (d > 0 ? 8 : -8);
    psi = next;
  }
  return { psi, theta: th, iterations: it };
}
const neOf = (rho, mue) => rho / (mue * MU);
function Pe(rho, T, mue) { const ne = neOf(rho, mue); const q = psiFor(ne, T); return fermi(q.theta, q.psi).P; }
function PeIter(rho, T, mue) { const ne = neOf(rho, mue); return psiFor(ne, T).iterations; }
const A0 = Math.PI * ME ** 4 * C ** 5 / (3 * H ** 3);
const fx = x => x * (2 * x * x - 3) * Math.sqrt(x * x + 1) + 3 * Math.asinh(x);
const xOf = (rho, mue) => (H / 2) * Math.pow(3 * neOf(rho, mue) / Math.PI, 1 / 3) / (ME * C);
const PdegT0 = (rho, mue) => A0 * fx(xOf(rho, mue));
const Pideal = (rho, T, mue) => neOf(rho, mue) * KB * T;

console.log('\n=== 1. The dilute limit: the integral must BE the ideal gas ===\n');

let wDil = 0, dilRows = [];
for (const [rho, T] of [[1e-8, 1e4], [1e-6, 1e6], [1e-3, 1e7], [1e-2, 3e7]]) {
  const r = Math.abs(Pe(rho, T, 2) / Pideal(rho, T, 2) - 1);
  wDil = Math.max(wDil, r); dilRows.push(`rho ${rho} T ${T}: ${r.toExponential(1)}`);
}
ok('where the gas is thin and hot the Fermi-Dirac integral returns n_e k T, and it is held to seven figures rather than to a plot. This limit has no adjustable anything in it: if the Compton wavelength, the spin factor of two or the power of the momentum in the integrand were wrong, the answer would be off by a clean factor and this line would say so',
  wDil < 1e-7,
  `worst departure from the ideal gas over four dilute states: ${wDil.toExponential(2)} · ${dilRows.join(' · ')}`);

console.log('\n=== 2. The cold limit: the SAME integral must be Chandrasekhar ===\n');

let wCold = 0, coldRows = [];
for (const rho of [1e6, 1e8, 1e9, 1e10, 1e12, 1e14]) {
  const r = Math.abs(Pe(rho, 1e4, 2) / PdegT0(rho, 2) - 1);
  wCold = Math.max(wCold, r);
  coldRows.push(`x = ${xOf(rho, 2).toExponential(1)}: ${r.toExponential(1)}`);
}
ok('and where it is cold and dense the same integral returns the exact T = 0 expression x(2x^2-3)sqrt(1+x^2) + 3 asinh(x), across eight decades of density and on BOTH sides of the relativistic transition at x = 1. Two limits from one integral with nothing interpolated between them is the whole reason this laboratory exists: a sum of the two would be wrong by the amount they overlap, and a maximum of the two would be wrong by the amount they do not',
  wCold < 3e-6,
  `worst departure from the T=0 form: ${wCold.toExponential(2)} · ${coldRows.join(' · ')}`);

const st = Pe(1.622e5, 1.571e7, 1.4925), si = Pideal(1.622e5, 1.571e7, 1.4925);
ok('and BETWEEN the two limits is where the centre of the Sun actually is, which is why neither shortcut is good enough there. At the standard solar model centre the exact electron pressure is about four per cent above the ideal-gas value — a correction that is pure quantum statistics, that no classical gas law can produce, and that the maximum-of-the-two shortcut reports as exactly zero',
  st / si > 1.02 && st / si < 1.06,
  `P_e / (n_e k T) = ${(st / si).toFixed(5)} at rho = 1.622e5 kg/m3, T = 1.571e7 K, mu_e = 1.4925`);

console.log('\n=== 3. The two constants are ASYMPTOTES, not entries ===\n');

const K1 = Math.pow(3 / Math.PI, 2 / 3) * H * H / (20 * ME) * Math.pow(1 / MU, 5 / 3);
const K2 = Math.pow(3 / Math.PI, 1 / 3) * H * C / 8 * Math.pow(1 / MU, 4 / 3);
const kFromNR = Pe(1e2, 1e2, 2) / Math.pow(1e2 / 2, 5 / 3);
const kFromUR = Pe(1e18, 1e5, 2) / Math.pow(1e18 / 2, 4 / 3);
ok('the non-relativistic polytropic constant is READ OFF the integral rather than typed in. Standard tables give K = 1.0036e7 in SI for P = K (rho/mu_e)^(5/3), and the integral walked into its cold dilute corner returns it. A wrong power of Planck`s constant, of the electron mass or of the atomic mass unit each fail this line and pass every plot',
  Math.abs(kFromNR / K1 - 1) < 1e-4 && Math.abs(K1 / 1.0036e7 - 1) < 1e-3,
  `read off the integral: ${kFromNR.toExponential(5)} · closed form ${K1.toExponential(5)} · tabulated 1.0036e7`);

ok('and the relativistic one likewise: 1.2435e10 in SI for P = K (rho/mu_e)^(4/3). These are the two constants the whole theory of degenerate stars is written in, and this laboratory does not contain either of them as a number — it contains the integral they are the two ends of',
  Math.abs(kFromUR / K2 - 1) < 1e-4 && Math.abs(K2 / 1.2435e10 - 1) < 1e-3,
  `read off the integral: ${kFromUR.toExponential(5)} · closed form ${K2.toExponential(5)} · tabulated 1.2435e10`);

console.log('\n=== 4. The index walks from 5/3 to 4/3, and that IS the argument ===\n');

const gam = (rho, mue, f = 1.01) => Math.log(PdegT0(rho * f, mue) / PdegT0(rho / f, mue)) / Math.log(f * f);
const walk = [1e2, 1e4, 1e6, 1e8, 1e9, 1e10, 1e12, 1e14, 1e16].map(r => ({ r, g: gam(r, 2) }));
let mono = true;
for (let i = 1; i < walk.length; i++) if (walk[i].g > walk[i - 1].g + 1e-6) mono = false;
ok('the logarithmic slope of the degenerate pressure is DIFFERENCED out of the integral and it falls monotonically from 5/3 to 4/3 as the electrons turn relativistic. Nothing about that is put in: the exponent is a property of the Fermi surface, and its descent is the Chandrasekhar argument in one line — a star supported by electrons gets softer the more of it there is, and at 4/3 the softening wins at every radius at once',
  mono && Math.abs(walk[0].g - 5 / 3) < 2e-3 && Math.abs(walk[walk.length - 1].g - 4 / 3) < 2e-3,
  `${walk.map(w => `${w.g.toFixed(4)}`).join(' → ')} over rho = 1e2 to 1e16 kg/m3, monotone: ${mono}`);

ok('and the crossing is where the physics says it is rather than where a plot suggests: the index passes the midpoint between 5/3 and 4/3 within a decade of x = 1, which is the density at which the Fermi momentum equals m_e c. That is not a fitted feature — it is the only scale in the problem',
  (() => { let lo = 4, hi = 16;
    for (let i = 0; i < 60; i++) { const m = (lo + hi) / 2; if (gam(Math.pow(10, m), 2) > 1.5) lo = m; else hi = m; }
    const rhoHalf = Math.pow(10, (lo + hi) / 2);
    return Math.abs(Math.log10(xOf(rhoHalf, 2))) < 1; })(),
  (() => { let lo = 4, hi = 16;
    for (let i = 0; i < 60; i++) { const m = (lo + hi) / 2; if (gam(Math.pow(10, m), 2) > 1.5) lo = m; else hi = m; }
    const rhoHalf = Math.pow(10, (lo + hi) / 2);
    return `the index reaches 1.5 at rho = ${rhoHalf.toExponential(3)} kg/m3, where x = ${xOf(rhoHalf, 2).toFixed(4)}`; })());

console.log('\n=== 5. And it agrees with a laboratory it has never been shown ===\n');

const LE3 = 2.018236;
const Mch = mue => 4 * Math.PI * Math.pow((K2 / Math.pow(mue, 4 / 3)) / (Math.PI * G), 1.5) * LE3 / MSUN;
ok('the limiting mass follows from the relativistic asymptote through the n = 3 Lane-Emden constant, and it lands on 1.456 solar masses at mu_e = 2 — the number the white-dwarf laboratory in this atlas has carried since it was written, computed there from the standard 5.836/mu_e^2 and here from an integral over a Fermi surface. Neither has ever been shown the other`s answer. This laboratory deliberately does NOT publish that mass as an output: two authorities for one fact is the failure this atlas is built to avoid, so the agreement is a CHECK and not a second source',
  Math.abs(Mch(2) / (5.836 / 4) - 1) < 4e-3,
  `from the integral: ${Mch(2).toFixed(5)} M_sun · from 5.836/mu_e^2: ${(5.836 / 4).toFixed(5)} · they differ by ${((Mch(2) / (5.836 / 4) - 1) * 100).toFixed(3)}%`);

ok('and it scales as mu_e^-2, which is why composition is a physical input and not a bookkeeping one: a helium-rich core and a hydrogen-rich one have different limiting masses for the same electrons, and the difference is a factor of nearly two between mu_e = 2 and mu_e = 1.4925',
  Math.abs(Mch(1.4925) / Mch(2) - Math.pow(2 / 1.4925, 2)) < 1e-6,
  `mu_e = 2 gives ${Mch(2).toFixed(4)} M_sun and mu_e = 1.4925 gives ${Mch(1.4925).toFixed(4)} — a ratio of ${(Mch(1.4925) / Mch(2)).toFixed(5)} against (2/1.4925)^2 = ${Math.pow(2 / 1.4925, 2).toFixed(5)}`);

console.log('\n=== 6. And the quadrature is measured against the rule it replaces ===\n');

/* BOTH ROUTES SOLVED END TO END, EACH ON ITS OWN GRID, from a bracket wide enough that
   the answer cannot be clipped by it. Pairing a psi solved on one grid with a pressure
   evaluated on another is an error that manufactures half a per cent out of nothing, and
   it is the error the first version of this file made. */
function solveOn(fn, ne, T) {
  const th = KB * T / MEC2;
  const x = (H / 2) * Math.pow(3 * ne / Math.PI, 1 / 3) / (ME * C);
  const g = (Math.sqrt(1 + x * x) - 1) / th;
  let lo = Math.min(-400, g - Math.abs(g) - 100), hi = Math.max(400, g + Math.abs(g) + 100);
  for (let i = 0; i < 200; i++) { const m = 0.5 * (lo + hi); if (fn(th, m).n < ne) lo = m; else hi = m; }
  return fn(th, 0.5 * (lo + hi)).P;
}
const COLD = [[1e6, 1e3], [1e9, 1e4], [1e10, 1e4], [1e12, 1e3], [1e14, 1e4]];
const at840 = COLD.map(([rho, T]) => {
  const ne = neOf(rho, 2), ex = PdegT0(rho, 2);
  return { rho,
    uni: Math.abs(solveOn((t, p) => fermiUniform(t, p, 840), ne, T) / ex - 1),
    spl: Math.abs(solveOn((t, p) => fermi(t, p, 240, 600), ne, T) / ex - 1) };
});
const wSpl = Math.max(...at840.map(r => r.spl)), wUni = Math.max(...at840.map(r => r.uni));
const deepRatio = at840.slice(1).map(r => r.uni / r.spl);
ok('the split earns its place, and the margin is MEASURED against the rule it replaces rather than argued from the shape of the integrand. Both routes solved end to end, each on its own grid, at the same 840 nodes: the split rule stays within 2e-8 of the exact zero-temperature expression across five cold states and the uniform rule within 1e-6. The gain is not uniform and is not claimed to be — at the shallowest state, where the edge is barely sharper than the grid, it is a factor of seventy; at the four genuinely degenerate ones it is between two and eight THOUSAND, for exactly the same cost',
  wSpl < 3e-8 && wUni > 1e-7 && deepRatio.every(r => r > 1000),
  `worst over five states — split: ${wSpl.toExponential(2)} · uniform: ${wUni.toExponential(2)} · ${at840.map(r => `${r.rho.toExponential(0)}: ${(r.uni / r.spl).toExponential(1)}x`).join(' · ')}`);

const at240 = COLD.map(([rho, T]) => {
  const ne = neOf(rho, 2), ex = PdegT0(rho, 2);
  return {
    uni: Math.abs(solveOn((t, p) => fermiUniform(t, p, 240), ne, T) / ex - 1),
    spl: Math.abs(solveOn((t, p) => fermi(t, p, 69, 171), ne, T) / ex - 1) };
});
ok('AND AT A THIRD OF THE BUDGET IT IS THE WRONG CHOICE, which is recorded here because a rule that is only ever tested where it wins is a rule nobody has tested. Give the same split 240 nodes and sixty-nine of them land in the smooth bulk, which is not enough to resolve a polynomial that spans the whole Fermi sea: it comes out around 1e-4 while the uniform grid at the same 240 nodes is around 4e-6, forty times better. The laboratory spends 840 because that is where the measurement says the split is right, and this line is the measurement that says where it is not',
  at240.every(r => r.spl > r.uni) && Math.max(...at240.map(r => r.spl)) > 1e-5,
  `at 240 nodes — split: ${at240.map(r => r.spl.toExponential(1)).join(', ')} · uniform: ${at240.map(r => r.uni.toExponential(1)).join(', ')}`);

const its = [[1e-8, 1e4], [1.622e5, 1.571e7], [1e10, 1e4], [1e16, 1e6]].map(([r, T]) => PeIter(r, T, 2));
ok('and the degeneracy parameter is found by NEWTON in a handful of steps rather than bisected in forty, because the two analytic limits already say where the answer is and the derivative of the electron count with respect to it is free — the same sweep that accumulates the occupancy also accumulates f(1-f), which IS that derivative. Four states spanning twenty-four decades of density are solved in single figures of iterations. A bracket is carried alongside and a step that leaves it is replaced by a midpoint, because a fast method that cannot be trusted to stay inside its bracket is a slow method with extra steps',
  its.every(i => i <= 8),
  `Newton steps at rho = 1e-8, 1.6e5, 1e10 and 1e16: ${its.join(', ')}`);

console.log('\n=== 7. And the inverse question refuses where it has no answer ===\n');

const Prad = T => ARAD * T ** 4 / 3;
function densityFor(P, T, mu, mue) {
  if (!(P > 0)) return null;
  const F = r => r * KB * T / (mu * MU) + Pe(r, T, mue) + Prad(T);
  const lo0 = -18, hi0 = 22;
  if (F(Math.pow(10, lo0)) >= P) return null;
  if (F(Math.pow(10, hi0)) <= P) return null;
  let lo = lo0, hi = hi0;
  for (let i = 0; i < 40; i++) { const m = 0.5 * (lo + hi); if (F(Math.pow(10, m)) < P) lo = m; else hi = m; }
  return Math.pow(10, 0.5 * (lo + hi));
}
const roundTrip = densityFor(2.342e16, 1.571e7, 1.996, 1.4925);
ok('the inverse question — what density holds this pressure up at this temperature — is a bisection on the same state function, and it comes back where it started: fed the standard solar model central pressure it returns a density within a tenth of the one that model quotes, the residual being the composition rather than the arithmetic. This is what makes a published pascal reachable at all, and two laboratories in this atlas published one that nothing consumed',
  roundTrip !== null && Math.abs(roundTrip / 1.622e5 - 1) < 0.12,
  `2.342e16 Pa at 1.571e7 K returns ${roundTrip === null ? 'null' : roundTrip.toExponential(5)} kg/m3 against the 1.622e5 the model quotes`);

const noAnswer = densityFor(1e5, 1.571e7, 1.996, 1.4925);
const anAnswer = densityFor(1e5, 293, 29, 2);
ok('and BELOW THE RADIATION FLOOR IT REFUSES INSTEAD OF CLAMPING, which is the failure this check exists for rather than a nicety. aT^4/3 does not depend on density at all, so at every temperature there is a pressure that radiation alone already exceeds — 1.5e13 Pa at the centre of the Sun — and asking what density holds one atmosphere at fifteen million kelvin has no answer. Null is that answer. The first version of this returned the bottom of its own search range, which meant every hot state answered every pressure with the same number, and the transfer sweep found it by reporting that the answer did not depend on the question. The same question at 293 K, where the floor is two millionths of a pascal, is answered normally',
  noAnswer === null && anAnswer !== null && anAnswer > 0,
  `one atmosphere at 1.571e7 K: ${noAnswer === null ? 'refused — the radiation floor is ' + Prad(1.571e7).toExponential(3) + ' Pa' : 'ANSWERED, which is wrong'} · at 293 K: ${anAnswer === null ? 'refused, which is wrong' : anAnswer.toExponential(4) + ' kg/m3, floor ' + Prad(293).toExponential(3) + ' Pa'}`);

console.log(`\n${pass}/${pass + fail} checks passed\n`);
process.exit(fail ? 1 : 0);
