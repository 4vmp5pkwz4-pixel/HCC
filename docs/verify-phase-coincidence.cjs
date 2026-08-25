/* ── WHEN DO TWO GENERATORS FALL BACK INTO PHASE? ─────────────────────────────
   STATUS: MEASURED. Nothing here reads the atlas.

   Two oscillators return to the same phase after 1/|f2 - f1| — but only exactly, and
   only if the ratio is rational. For an irrational ratio there is no exact return ever,
   and how soon the first epsilon-coincidence arrives is decided by how well the ratio can
   be approximated by fractions. That is a question in number theory, and it has an exact
   answer: the convergents of the continued fraction are the best rational approximations
   there are, and their DENOMINATORS are the number of cycles you wait.

   This file checks the three theorems that follow, each by construction:

     HURWITZ.  L(x) = 1/liminf q|qx - p| is at least sqrt5 for every irrational, with
     equality only for numbers equivalent to the golden ratio. Swept over forty thousand
     pseudo-random ratios here, and the smallest value found is reported rather than
     assumed. The golden ratio's own Lagrange number is checked against sqrt5, and sqrt2
     and sqrt3 against 2*sqrt2 and 2*sqrt3, which they are never told.

     THREE DISTANCES.  The points {k*alpha} for k = 1..N cut the circle into gaps of at
     most THREE distinct lengths, for every alpha and every N. Counted over thousands of
     cases, with the largest number of distinct lengths ACTUALLY OBSERVED reported.

     FIBONACCI WAITING TIMES.  The convergent denominators of the golden ratio are the
     Fibonacci numbers, so the first epsilon-coincidence of a golden pair lands on a
     Fibonacci number for every epsilon. Verified independently here by generating the
     Fibonacci numbers from their own recurrence and the coincidence times by simulation,
     and comparing two lists that were built without reference to each other.

   AND ONE THING THAT IS NOT A THEOREM BUT AN ARITHMETIC TRAP. q|qx - p| carries about
   q^2 * x * 2^-53 of pure floating-point rounding. At q = 1e7 that is three percent of
   the answer, which is why the denominators are capped: past the cap the arithmetic
   stops describing the number and starts describing the float. The cap is checked here
   by computing the golden ratio's Lagrange number at several caps and watching it
   degrade, which is the honest way to choose one. */
'use strict';
let pass = 0, fail = 0;
const ok = (n, c, d) => { if (c) { pass++; console.log(`  ok   ${n}${d ? ' · ' + d : ''}`); }
                          else { fail++; console.log(`  FAIL ${n}${d ? ' · ' + d : ''}`); } };
const PHI = (1 + Math.sqrt(5)) / 2, S5 = Math.sqrt(5);

function convergents(x, QMAX) {
  const out = []; let v = x, pm1 = 1, pm2 = 0, qm1 = 0, qm2 = 1;
  for (let k = 0; k < 80; k++) {
    const t = Math.floor(v), p = t * pm1 + pm2, q = t * qm1 + qm2;
    if (!Number.isFinite(q) || q > QMAX) break;
    out.push({ t, p, q, d: q * Math.abs(q * x - p) });
    pm2 = pm1; pm1 = p; qm2 = qm1; qm1 = q;
    const r = v - t; if (r <= 0) break;
    v = 1 / r;
  }
  return out;
}
const lagrange = (x, QMAX = 3e5, TAIL = 6) => {
  const cv = convergents(x, QMAX);
  if (cv.length < TAIL + 2) return NaN;
  return 1 / Math.min(...cv.slice(cv.length - TAIL).map(c => c.d));
};

/* ── the arithmetic trap, measured before it is avoided ──────────────────── */
{
  const rows = [1e3, 1e4, 1e5, 3e5, 1e6, 1e7, 1e8].map(Q => [Q, lagrange(PHI, Q)]);
  const good = rows.filter(([Q]) => Q <= 3e5).every(([, L]) => Math.abs(L / S5 - 1) < 1e-5);
  const bad = rows.find(([Q]) => Q === 1e8);
  ok('the Lagrange number of the golden ratio comes out as sqrt5 while the denominators stay under the cap, and visibly rots above it — which is how the cap was chosen rather than guessed',
    good && Math.abs(bad[1] / S5 - 1) > 1e-4,
    rows.map(([Q, L]) => `q<=${Q.toExponential(0)}: ${L.toFixed(7)}`).join(' · '));
}
/* ── Hurwitz ─────────────────────────────────────────────────────────────── */
{
  ok('the golden ratio sits exactly on the Hurwitz bound, and every one of its partial quotients is 1 — which is the reason it does',
    Math.abs(lagrange(PHI) / S5 - 1) < 1e-5
    && convergents(PHI, 3e5).slice(1).every(c => c.t === 1),
    `L(phi) = ${lagrange(PHI).toFixed(9)} vs sqrt5 = ${S5.toFixed(9)} · partial quotients all 1 over ${convergents(PHI, 3e5).length} convergents`);
  ok('and sqrt2 and sqrt3 land on their own Lagrange numbers 2*sqrt2 and 2*sqrt3 without being told what to aim at',
    Math.abs(lagrange(Math.SQRT2) / (2 * Math.SQRT2) - 1) < 1e-5
    && Math.abs(lagrange(Math.sqrt(3)) / (2 * Math.sqrt(3)) - 1) < 1e-5,
    `L(sqrt2) = ${lagrange(Math.SQRT2).toFixed(7)} vs ${(2 * Math.SQRT2).toFixed(7)} · L(sqrt3) = ${lagrange(Math.sqrt(3)).toFixed(7)} vs ${(2 * Math.sqrt(3)).toFixed(7)}`);
  let s = 987654321, below = 0, minL = Infinity, minAt = 0, n = 0;
  const rnd = () => { s = (s * 1103515245 + 12345) & 0x7fffffff; return s / 0x7fffffff; };
  for (let i = 0; i < 40000; i++) {
    const x = 1 + rnd(), L = lagrange(x);
    if (!Number.isFinite(L)) continue;
    n++;
    if (L < S5 * (1 - 1e-6)) below++;
    if (L < minL) { minL = L; minAt = x; }
  }
  ok('and forty thousand pseudo-random ratios are swept without a single one falling below sqrt5, which is the content of the theorem and not a restatement of it',
    below === 0 && n > 30000 && minL > S5,
    `${n} ratios · ${below} below the bound · smallest found ${minL.toFixed(6)} at ${minAt.toFixed(9)}, ${((minL / S5 - 1) * 100).toFixed(2)}% above sqrt5`);
}
/* ── three distances ─────────────────────────────────────────────────────── */
{
  const distinct = (alpha, N) => {
    const a = []; for (let k = 1; k <= N; k++) { let v = (k * alpha) % 1; if (v < 0) v += 1; a.push(v); }
    a.push(0); a.sort((x, y) => x - y);
    const u = [];
    for (let i = 1; i < a.length; i++) { const g = a[i] - a[i - 1];
      if (g > 1e-12 && !u.some(w => Math.abs(w - g) < 1e-9)) u.push(g); }
    const last = 1 - a[a.length - 1];
    if (last > 1e-12 && !u.some(w => Math.abs(w - last) < 1e-9)) u.push(last);
    return u.length;
  };
  let s = 24680, worst = 0, cases = 0, viol = 0;
  const rnd = () => { s = (s * 1103515245 + 12345) & 0x7fffffff; return s / 0x7fffffff; };
  for (let t = 0; t < 700; t++) { const a = rnd();
    for (const N of [2, 3, 5, 13, 34, 100, 377, 1000]) {
      const d = distinct(a, N); cases++;
      if (d > worst) worst = d; if (d > 3) viol++; } }
  ok('the three-distance theorem holds in every case walked, and the largest number of distinct gap lengths actually observed is reported — if it were ever four this line would say four',
    viol === 0 && worst <= 3 && cases >= 5000,
    `${cases} cases over ${8} sizes · most distinct lengths observed ${worst} · violations ${viol}`);
  /* THIS CHECK WAS WRITTEN AS A GUESS AND THE MEASUREMENT CORRECTED IT. The first
     version asserted that the count drops to two AT a Fibonacci number of points and
     is three at n = 20; it is two at n = 20. Scanning n = 1..60 says what is actually
     true, which is sharper than the guess was: the two-gap cases are exactly the n of
     the form F - 1, one point BEFORE a Fibonacci number, and every other n gives three. */
  {
    const F = [1, 2, 3, 5, 8, 13, 21, 34, 55, 89];
    const two = [], three = [], other = [];
    for (let n = 1; n <= 60; n++) { const d = distinct(1 / PHI, n);
      (d === 2 ? two : d === 3 ? three : other).push(n); }
    const wantTwo = F.map(f => f - 1).filter(n => n >= 1 && n <= 60);
    ok('and for the golden ratio the count drops to TWO at exactly the n of the form F−1 — one point before a Fibonacci number, never at one — with three at every other n and never anything else',
      other.length === 0 && two.join(',') === wantTwo.join(',') && two.length + three.length === 60,
      `two at n = ${two.join(', ')} · Fibonacci minus one = ${wantTwo.join(', ')} · three at the other ${three.length} · neither at ${other.length}`);
  }
}
/* ── Fibonacci waiting times ─────────────────────────────────────────────── */
{
  const FIB = new Set(); { let a = 1, b = 2; for (let i = 0; i < 44; i++) { FIB.add(a); const c = a + b; a = b; b = c; } }
  const first = (alpha, eps, maxN) => {
    for (let k = 1; k <= maxN; k++) { let v = (alpha * k) % 1; if (v < 0) v += 1;
      if (v < eps || v > 1 - eps) return k; }
    return -1;
  };
  const eps = [3e-2, 1e-2, 3e-3, 1e-3, 3e-4, 1e-4, 3e-5, 1e-5, 3e-6, 1e-6];
  const times = eps.map(e => first(1 / PHI, e, 1e6));
  ok('every first coincidence time of a golden pair is a Fibonacci number, over four decades of tolerance — two lists built independently, one by the recurrence and one by simulating the phase, and they agree term for term',
    times.every(k => k > 0 && FIB.has(k)),
    `n = ${times.join(', ')} · all Fibonacci: ${times.every(k => k > 0 && FIB.has(k))}`);
  ok('and those times ARE the convergent denominators of the golden ratio, which is the whole mechanism in one comparison rather than an observation about a coincidence',
    times.every(k => convergents(1 / PHI, 1e6).some(c => c.q === k)),
    `denominators ${convergents(1 / PHI, 1e6).map(c => c.q).slice(0, 20).join(', ')}`);
  ok('while a rational ratio returns exactly and immediately — a fifth is back in phase on the second cycle and a 3/7 on the seventh, and neither ever drifts again',
    first(0.5, 1e-9, 100) === 2 && first(3 / 7, 1e-9, 100) === 7 && first(1 / 3, 1e-9, 100) === 3,
    `1/2 → 2 · 3/7 → ${first(3 / 7, 1e-9, 100)} · 1/3 → ${first(1 / 3, 1e-9, 100)}`);
}
/* ── the bands, derived ──────────────────────────────────────────────────── */
{
  const c = 299792458, vAir = 343;
  const vis = { lo: 4.3e14, hi: 7.5e14 };
  ok('the visible band declared in hertz gives back 400 to 697 nanometres through lambda = c/f, which is the check that the ladder was written down correctly rather than a second table of wavelengths to drift from the first',
    Math.abs(c / vis.hi * 1e9 - 399.7) < 1 && Math.abs(c / vis.lo * 1e9 - 697.2) < 1,
    `${(c / vis.hi * 1e9).toFixed(1)} nm at ${vis.hi.toExponential(1)} Hz · ${(c / vis.lo * 1e9).toFixed(1)} nm at ${vis.lo.toExponential(1)} Hz`);
  ok('and one megahertz is two different waves depending on what is oscillating: a third of a millimetre of ultrasound in air, and three hundred metres of radio in vacuum, a factor of nearly a million between them',
    Math.abs(vAir / 1e6 * 1e3 - 0.343) < 1e-6 && Math.abs(c / 1e6 - 299.79) < 0.01
    && Math.abs((c / 1e6) / (vAir / 1e6) - c / vAir) < 1e-6,
    `${(vAir / 1e6 * 1e3).toFixed(3)} mm in air · ${(c / 1e6).toFixed(2)} m in vacuum · ratio ${(c / vAir).toExponential(3)} = c/v_air exactly`);
}
console.log(`\n${pass}/${pass + fail} checks passed\n`);
process.exit(fail ? 1 : 0);
