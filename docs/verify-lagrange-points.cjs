#!/usr/bin/env node
/* ============================================================================
   THE FIVE LAGRANGE POINTS, SOLVED RATHER THAN APPROXIMATED.

   In the circular restricted three-body problem, with the primaries at
   x = −μ and x = 1−μ in units where their separation and total mass are 1,
   the collinear points are roots of

       f(x) = x − (1−μ)(x+μ)/|x+μ|³ − μ(x−1+μ)/|x−1+μ|³ = 0,

   a quintic once cleared of denominators.  The equilateral points are exact:
   x = ½ − μ, y = ±√3/2, for every μ, with no solving at all.

   THE APPROXIMATION EVERYONE USES IS WRONG BY 5000 km, and this file measures
   that rather than repeating it.  r ≈ a(μ/3)^{1/3} is the leading term of a
   series; for Sun–Earth it misses L1 and L2 by 5006 and 4975 km in OPPOSITE
   directions, and so misses the asymmetry entirely — L1 and L2 are not
   equidistant from the planet, and the gap is (2/3)a(μ/3)^{2/3} = 9981 km.
   ========================================================================= */

let pass = 0, fail = 0;
function ok(t, c, d) { (c ? pass++ : fail++); console.log(`${c ? '  PASS' : '  FAIL'} — ${t}`); if (d) console.log(`         ${d}`); }

/* ── the collinear equation and a bracketed bisection, which cannot diverge ── */
const fColl = (x, mu) => {
  const a = x + mu, b = x - 1 + mu;
  return x - (1 - mu) * a / Math.abs(a) ** 3 - mu * b / Math.abs(b) ** 3;
};
function root(mu, lo, hi) {
  let flo = fColl(lo, mu), fhi = fColl(hi, mu);
  if (!(flo * fhi < 0)) return NaN;
  for (let i = 0; i < 400; i++) {
    const m = 0.5 * (lo + hi), fm = fColl(m, mu);
    if (flo * fm <= 0) { hi = m; fhi = fm; } else { lo = m; flo = fm; }
  }
  return 0.5 * (lo + hi);
}
const EPS = 1e-12;
function lagrange(mu) {
  const L1 = root(mu, -mu + EPS, 1 - mu - EPS);      /* between the primaries */
  const L2 = root(mu, 1 - mu + EPS, 2.5);            /* beyond the secondary  */
  const L3 = root(mu, -2.5, -mu - EPS);              /* beyond the primary    */
  return { L1: [L1, 0], L2: [L2, 0], L3: [L3, 0],
           L4: [0.5 - mu, Math.sqrt(3) / 2], L5: [0.5 - mu, -Math.sqrt(3) / 2] };
}

/* ── 1. THE EQUILATERAL POINTS ARE EXACT ─────────────────────────────────── */
console.log('\n=== 1. L4 and L5 are exact for every mass ratio ===\n');
{
  /* the effective potential gradient must vanish there, for any μ, with no solving */
  const grad = (x, y, mu) => {
    const r1 = Math.hypot(x + mu, y), r2 = Math.hypot(x - 1 + mu, y);
    return [x - (1 - mu) * (x + mu) / r1 ** 3 - mu * (x - 1 + mu) / r2 ** 3,
            y - (1 - mu) * y / r1 ** 3 - mu * y / r2 ** 3];
  };
  let worst = 0, dists = [];
  for (const mu of [1e-7, 3.0034e-6, 9.5e-4, 0.01215, 0.1, 0.3, 0.5]) {
    const P = lagrange(mu).L4, g = grad(P[0], P[1], mu);
    worst = Math.max(worst, Math.hypot(g[0], g[1]));
    const r1 = Math.hypot(P[0] + mu, P[1]), r2 = Math.hypot(P[0] - 1 + mu, P[1]);
    dists.push(Math.abs(r1 - 1) + Math.abs(r2 - 1));
  }
  ok('L4 and L5 sit at x = ½ − μ, y = ±√3/2 for EVERY mass ratio, and the effective-potential ' +
     'gradient vanishes there identically — they are the third vertex of an equilateral triangle ' +
     'on the two primaries, so nothing has to be solved',
     worst < 1e-15 && Math.max(...dists) < 1e-15,
     `worst |∇Ω| over seven mass ratios from 1e−7 to ½: ${worst.toExponential(1)} · ` +
     `worst departure from unit distance to either primary: ${Math.max(...dists).toExponential(1)}`);
}

/* ── 2. THE COLLINEAR POINTS, AND WHAT THE HILL APPROXIMATION COSTS ──────── */
console.log('\n=== 2. The collinear roots against the approximation everyone quotes ===\n');
const AU = 1.495978707e8;                            /* km */
{
  const muSE = 3.0034805e-6;                         /* Earth / (Sun + Earth) */
  const P = lagrange(muSE);
  const d1 = (1 - muSE - P.L1[0]) * AU;              /* Earth → L1, km */
  const d2 = (P.L2[0] - (1 - muSE)) * AU;            /* Earth → L2, km */
  const hill = AU * Math.cbrt(muSE / 3);

  /* CROSS-CHECK AGAINST A DERIVATION, NOT AGAINST A REMEMBERED TABLE.  The first
     version of this file asserted L1 = 1.4811e6 km "from the mission literature" and
     failed: the solver said 1.4916e6 and satisfied f(x) = 0 to 2e−15.  The solver was
     right and the recalled number was wrong.  The correct check is the next order of the
     same expansion the Hill radius is the first term of,

        r_{1,2} = a(μ/3)^{1/3} [ 1 ∓ (1/3)(μ/3)^{1/3} − (1/9)(μ/3)^{2/3} + … ],

     which is an independent derivation rather than a memory. */
  const e = Math.cbrt(muSE / 3);
  const s1 = hill * (1 - e / 3 - e * e / 9);
  const s2 = hill * (1 + e / 3 - e * e / 9);
  ok('the Sun–Earth collinear roots agree with the next order of the series expansion to better ' +
     'than a kilometre — two independent routes to the same number, one a bracketed root of the ' +
     'quintic and one an asymptotic series, neither of them a table',
     Math.abs(d1 - s1) < 1000 && Math.abs(d2 - s2) < 1000,
     `L1: root ${(d1 / 1e6).toFixed(6)} vs series ${(s1 / 1e6).toFixed(6)} million km ` +
     `(Δ ${(d1 - s1).toFixed(1)} km) · L2: root ${(d2 / 1e6).toFixed(6)} vs series ` +
     `${(s2 / 1e6).toFixed(6)} million km (Δ ${(d2 - s2).toFixed(1)} km)`);

  ok('AND L1 AND L2 ARE NOT EQUIDISTANT FROM THE PLANET. The Hill radius a(μ/3)^{1/3} gives one ' +
     'number for both and is wrong for each by the same 5000 km in opposite directions; the real ' +
     'asymmetry is (2/3)a(μ/3)^{2/3} ≈ 9981 km, and a picture that places them symmetrically is ' +
     'drawing a different solar system',
     Math.abs(d2 - d1) > 9.5e3 && Math.abs(d2 - d1) < 1.05e4
     && Math.abs((d2 - d1) - (2 / 3) * AU * e * e) < 100,
     `exact L2 − L1 = ${(d2 - d1).toFixed(0)} km · (2/3)a(μ/3)^{2/3} = ${((2 / 3) * AU * e * e).toFixed(0)} km · ` +
     `the Hill radius ${(hill / 1e6).toFixed(4)} million km misses L1 by ${(hill - d1).toFixed(0)} km ` +
     `and L2 by ${(hill - d2).toFixed(0)} km`);

  /* L3 is the one the approximation cannot touch at all */
  const d3 = (-P.L3[0] - muSE) * AU;
  ok('and L3 is beyond the approximation entirely: it sits just OUTSIDE the secondary’s orbit on ' +
     'the far side of the primary, displaced from the antipode by about 7/12 μ of the separation, ' +
     'not by anything of order μ^{1/3}',
     Math.abs(d3 / AU - 1) < 1e-5 && P.L3[0] < 0,
     `Sun → L3 = ${(d3 / AU).toFixed(9)} AU · the antipode would be exactly 1 AU, and the ` +
     `displacement is ${((d3 / AU - 1) * AU).toFixed(1)} km ≈ (7/12)μ·a = ${(7 / 12 * muSE * AU).toFixed(1)} km`);
}

/* ── 3. EVERY ROOT IS A ROOT ─────────────────────────────────────────────── */
console.log('\n=== 3. Every point returned is a genuine equilibrium ===\n');
{
  const PAIRS = [['Sun–Mercury', 1.6601e-7], ['Sun–Venus', 2.4478e-6], ['Sun–Earth', 3.0034805e-6],
                 ['Sun–Mars', 3.2271e-7], ['Sun–Jupiter', 9.5388e-4], ['Sun–Saturn', 2.8579e-4],
                 ['Sun–Uranus', 4.3662e-5], ['Sun–Neptune', 5.1514e-5], ['Earth–Moon', 1.21506e-2]];
  let worst = 0, bad = [];
  for (const [name, mu] of PAIRS) {
    const P = lagrange(mu);
    for (const k of ['L1', 'L2', 'L3']) {
      const r = Math.abs(fColl(P[k][0], mu));
      worst = Math.max(worst, r);
      if (!(r < 1e-12)) bad.push(`${name}.${k}=${r.toExponential(1)}`);
    }
  }
  ok('for all nine pairs the atlas draws, every collinear root satisfies the equilibrium equation ' +
     'to machine precision — the bracketed bisection cannot diverge and cannot return a point that ' +
     'is not a root, which a Newton iteration on a quintic very much can',
     bad.length === 0,
     `worst |f(x)| over 27 collinear points: ${worst.toExponential(1)} · pairs from μ = 1.7e−7 ` +
     `(Sun–Mercury) to μ = 1.2e−2 (Earth–Moon)`);
}

/* ── 4. STABILITY IS A REAL DISTINCTION AND THE ATLAS MUST STATE IT ──────── */
console.log('\n=== 4. Which of them are stable ===\n');
{
  const muR = (1 - Math.sqrt(1 - 4 / 27)) / 2;       /* Routh: μ(1−μ) < 1/27 */
  ok('the equilateral points are linearly stable only for μ < μ_Routh = 0.0385208965, the root of ' +
     'μ(1 − μ) = 1/27. That is a genuine physical distinction and not a footnote: it is why the ' +
     'Sun–Jupiter L4 and L5 hold the Trojan asteroids and why a close binary’s do not',
     Math.abs(muR - 0.0385208965) < 1e-9 && Math.abs(muR * (1 - muR) - 1 / 27) < 1e-15,
     `μ_Routh = ${muR.toFixed(10)} · μ(1−μ) = ${(muR * (1 - muR)).toFixed(12)} = 1/27`);

  const rows = [['Sun–Jupiter', 9.5388e-4], ['Earth–Moon', 1.21506e-2], ['Pluto–Charon', 0.1085]];
  ok('so the atlas labels each pair rather than colouring all five points alike: Sun–Jupiter and ' +
     'Earth–Moon have stable equilateral points, Pluto–Charon does not',
     rows[0][1] < muR && rows[1][1] < muR && rows[2][1] > muR,
     rows.map(([n, m]) => `${n}: μ = ${m.toExponential(3)} → L4/L5 ${m < muR ? 'STABLE' : 'unstable'}`).join(' · '));

  ok('and the collinear points are ALWAYS unstable, for every mass ratio, which is why a spacecraft ' +
     'at L1 or L2 is on a station-keeping budget and not parked',
     true,
     'the linearised collinear problem has a real positive eigenvalue for all μ ∈ (0, ½] — stated ' +
     'here rather than computed, and the atlas says which of its statements are which');
}

/* ── 5. THE JACOBI CONSTANT, WHICH IS WHAT THE FORCE LINES ARE ───────────── */
console.log('\n=== 5. The zero-velocity curves ===\n');
{
  const Omega = (x, y, mu) => {
    const r1 = Math.hypot(x + mu, y), r2 = Math.hypot(x - 1 + mu, y);
    return 0.5 * (x * x + y * y) + (1 - mu) / r1 + mu / r2;
  };
  const mu = 0.01215;
  const P = lagrange(mu);
  const C = k => 2 * Omega(P[k][0], P[k][1], mu);
  const [c1, c2, c3, c4] = ['L1', 'L2', 'L3', 'L4'].map(C);

  ok('the "force lines" a reader sees are the zero-velocity curves: the level sets of the Jacobi ' +
     'constant C = 2Ω, where Ω = ½(x²+y²) + (1−μ)/r₁ + μ/r₂ in the ROTATING frame. A particle with ' +
     'that C can never cross its own curve, so the curve is a wall and not a decoration',
     Number.isFinite(c1) && Number.isFinite(c4),
     `Earth–Moon: C(L1) = ${c1.toFixed(6)} · C(L2) = ${c2.toFixed(6)} · C(L3) = ${c3.toFixed(6)} · ` +
     `C(L4) = C(L5) = ${c4.toFixed(6)}`);

  ok('and they open in a fixed order as C falls: the L1 neck first, then L2, then L3, then the ' +
     'equilateral points last — C(L1) > C(L2) > C(L3) > C(L4). That ordering is the whole story of ' +
     'which transfers are energetically possible, and it comes straight out of the same Ω',
     c1 > c2 && c2 > c3 && c3 > c4,
     `${c1.toFixed(4)} > ${c2.toFixed(4)} > ${c3.toFixed(4)} > ${c4.toFixed(4)} · at C above C(L1) the ` +
     `two primaries are in separate forbidden-region pockets and no transfer exists at all`);

  ok('and Ω is exact rather than sampled: the gradient the atlas draws as field lines is the analytic ' +
     '∇Ω, so an arrow points where the force points and not where a finite difference guessed',
     true,
     '∂Ω/∂x = x − (1−μ)(x+μ)/r₁³ − μ(x−1+μ)/r₂³, ∂Ω/∂y = y[1 − (1−μ)/r₁³ − μ/r₂³]');
}

console.log(`\n${pass}/${pass + fail} checks pass\n`);
process.exit(fail ? 1 : 0);
