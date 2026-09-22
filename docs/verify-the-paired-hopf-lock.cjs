#!/usr/bin/env node
'use strict';
/* ══ THE TERMINAL LOCK, AND THE FOUR THINGS THAT ARE NOT IT ══════════════════
 *
 * The monolithic manuscript of the S³ Navier–Stokes programme ends in one open
 * lock and a lattice of invariants around it. Its own summary:
 *
 *     No nonzero zeta-visible 𝒥-paired Hopf filament can carry phase-coherent
 *     vortex stretching.
 *
 * That sentence is NOT proved, there and not here. What the manuscript does
 * close is the accounting, and the accounting is a small number of statements
 * that are arithmetic in k and σ — which means they can be measured, and which
 * means a file like this one can exist at all.
 *
 * MEASURED HERE, against the operators rather than against the prose:
 *
 *   the three probes are a TIGHT frame       cond(A₃*A₃) = 1 to 2e-16,
 *                                             on shells of dimension 8, 15, 24,
 *                                             in both chiralities
 *   and its bound is the closed form          α = c²j(j+1)/(R²𝒱) to 1e-16
 *   the Casimir rigidity gap                  Δ = k(k+4)/(k+2), assembled from
 *                                             four weighted Casimirs, positive
 *   the involution                            𝒥∗X^L + X^R = 0 exactly
 *   the Gaudin chain is in involution         {H_i,H_j} = 0 to 3e-16
 *   the capacity threshold                    converges exactly above 9 + 4τ₀
 *
 * A TRACE WOULD HAVE PASSED THE FIRST OF THESE FOR THE WRONG REASON. The six
 * convective responses already sum to κ_k/(2𝒱), and that sum is the TRACE of
 * A₃*A₃ — equally happy with an operator whose eigenvalues are 0 and 2α. The
 * tight-frame claim is about the SPECTRUM, so the operator is built and
 * diagonalised and the condition number is reported as a number.
 *
 * AND THE CLOSED FORM WAS COMPARED AT THE WRONG RADIUS THE FIRST TIME, which is
 * how a factor of exactly 2π² can hide inside a residual of 0.949 and look like
 * a modelling disagreement. The operator is built on the unit sphere and α
 * scales as R⁻⁵; the comparison is made at R = 1 and the requested radius is
 * carried by the closed form alone.
 *
 * WHAT IS NOT CLAIMED, and is published as an output so that no reading of the
 * others can suggest otherwise: terminal_lock_open = 1, at every configuration.
 */
const fs = require('node:fs'), path = require('node:path');
const ROOT = path.join(__dirname, '..');
const src = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const manifest = JSON.parse(fs.readFileSync(path.join(ROOT, 'api', 'manifest.json'), 'utf8'));
let pass = 0, fail = 0;
const ok = (n, c, d) => { if (c) { pass++; console.log('  PASS — ' + n + (d ? ' :: ' + d : '')); }
  else { fail++; console.log('  FAIL — ' + n + (d ? ' :: ' + d : '')); } };

/* the kernel, evaluated rather than pattern-matched: these are numbers and the
   only honest way to check a number is to compute it */
const K = (() => {
  const a = src.indexOf('const S3NS_MONO=new Map();');
  const b = src.indexOf('const s3nsGrassmannDim=');
  const c = src.indexOf('\n', src.indexOf('function s3tcStretchParity(atoms){'));
  const d = src.indexOf('\n}', c) + 2;
  const extraA = src.indexOf('const s3nsDot4=');
  const extraB = src.indexOf('function s3nsTangentStep(');
  const mul = 'const mulberry=(a)=>{return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);'
    + 't=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;}};\n';
  const body = mul + src.slice(a, b) + '\n' + src.slice(extraA, extraB) + '\n'
    + src.slice(src.indexOf('const s3tcWeight='), d)
    + '\nreturn {s3tcWeight,s3tcSpin,s3tcStride,s3tcFrameBound,s3tcTomography,s3tcRigidityGap,'
    + 's3tcInvolutionResidual,s3tcTorusArea,s3tcTorusDim,s3tcCliffordCapacity,s3tcWinding,'
    + 's3tcGyroGap,s3tcCapacity,s3tcGaudin,s3tcPairing,s3tcStretchParity,s3tcJ};';
  return new Function(body)();
})();

{ /* 1. THE THREE PROBES ARE A TIGHT FRAME, AND THE SPECTRUM SAYS SO */
  const rows = [];
  let worstCond = 0, worstClosed = 0;
  for (const k of [1, 2, 3]) for (const sg of [1, -1]) for (const ta of [1, -1]) {
    const T = K.s3tcTomography(k, sg, ta, 1);
    worstCond = Math.max(worstCond, Math.abs(T.condition - 1));
    worstClosed = Math.max(worstClosed, T.closed_form_residual);
    rows.push(`k=${k}${sg > 0 ? '+' : '-'}/${ta > 0 ? '+' : '-'} d=${T.dimension}`);
  }
  ok('the three-probe Killing tomography is a TIGHT frame — the operator is built from the shell basis, diagonalised, and its condition number is exactly one',
    worstCond < 1e-12, `worst |cond − 1| = ${worstCond.toExponential(2)} over 12 states, shells of dimension 8, 15 and 24`);
  ok('and its frame bound is the closed form α = c²j(j+1)/(R²𝒱), compared at the radius the operator was actually built at',
    worstClosed < 1e-12, `worst relative residual ${worstClosed.toExponential(2)}`);
  ok('and the spectrum is what is tested, not the trace — a trace is equally happy with eigenvalues 0 and 2α, and the six convective responses already publish that trace',
    /A TIGHT FRAME OR NOT — measured|the claim "A₃\*A₃ = α·Id" is a claim about\s*\n\s+the SPECTRUM and a trace does not test it/.test(src)
    && /function s3tcJacobi\(Ain\)\{/.test(src),
    'the Jacobi sweep exists for exactly this reason and the source says so');
  ok('and the closed form is not compared across radii, which is how a factor of 2π² hides inside a residual that looks like disagreement',
    /THE OPERATOR IS BUILT ON THE UNIT SPHERE AND THE CLOSED FORM CARRIES THE\s*\n\s+RADIUS/.test(src)
    && /const closedUnit=s3tcFrameBound\(k,tau,sigma,1\);/.test(src),
    'measured at R = 1; the requested radius is published beside it as closed_form_at_R');
}

{ /* 2. THE WEIGHT IS BOUNDED AND THE STRIDE IS NOT */
  let lo = Infinity, hi = -Infinity;
  for (let k = 1; k <= 4000; k++) for (const t of [1, -1]) for (const s of [1, -1]) {
    const c = K.s3tcWeight(k, t, s); lo = Math.min(lo, c); hi = Math.max(hi, c);
  }
  ok('the precession weight c_τ(k,σ) = 1 − 2τσ/(k+2) stays inside [1/3, 5/3] for every shell',
    Math.abs(lo - 1 / 3) < 1e-15 && Math.abs(hi - 5 / 3) < 1e-15,
    `[${lo.toFixed(12)}, ${hi.toFixed(12)}] over 4000 shells and both signs — the extremes are attained at k = 1`);
  ok('AND THAT BOUND IS NOT A GAP, which is the whole small-divisor problem: neighbouring shells differ by 2/((k+2)(k+3)) and that goes to zero',
    Math.abs(K.s3tcStride(1) - 1 / 6) < 1e-15
    && K.s3tcStride(1000) < 2.01e-6 && K.s3tcStride(100000) < 2.1e-10
    && /A BOUND IS NOT A GAP/.test(src),
    `stride 1/6 at k = 1, ${K.s3tcStride(1000).toExponential(2)} at k = 1000 and ${K.s3tcStride(100000).toExponential(2)} at k = 100000`);
}

{ /* 3. THE RIGIDITY GAP IS POSITIVE AND IS THE CLOSED FORM */
  let worst = 0, minGap = Infinity;
  for (let k = 1; k <= 200; k++) for (const sg of [1, -1]) {
    const G = K.s3tcRigidityGap(k, sg);
    worst = Math.max(worst, G.residual); minGap = Math.min(minGap, G.built);
  }
  ok('the weighted Casimir rigidity gap assembled from four weighted Casimirs collapses to k(k+4)/(k+2)',
    worst < 1e-12, `worst relative residual ${worst.toExponential(2)} over 400 states`);
  ok('and it is POSITIVE at every shell, which is what kills the intertwiner block and gives δ_rig(W) = 0 for every finite multi-shell reduction',
    minGap > 0, `smallest gap ${minGap.toFixed(9)} at k = 1`);
}

{ /* 4. THE INVOLUTION, WHICH IS THE CORRECTION THE MANUSCRIPT MAKES TO ITSELF */
  ok('𝒥(g) = g⁻¹ carries the LEFT Hopf foliation to the RIGHT one — 𝒥∗X^L_ξ = −X^R_ξ — so the terminal object is a PAIR of filaments and not one',
    K.s3tcInvolutionResidual() < 1e-15,
    `residual ${K.s3tcInvolutionResidual().toExponential(2)} over four points and three frame directions`);
  ok('and the laboratory draws both circles rather than one, because the whole correction is that they are different circles',
    /const mf=s3lockTube\(fib,0x79cfb7/.test(src) && /const mj=s3lockTube\(jfib,0xe98291/.test(src),
    'Γ and 𝒥(Γ), as tubes, so a reader can see that the pair is linked');
}

{ /* 5. THE GAUDIN CHAIN IS IN INVOLUTION */
  let worst = 0;
  for (const n of [3, 4, 5, 7]) worst = Math.max(worst, K.s3tcGaudin(n, 20260922).involution_residual);
  ok('the Gaudin comparison chain, whose nodes ARE the precession weights, is in involution: {H_i, H_j} = 0',
    worst < 1e-12, `worst normalised bracket ${worst.toExponential(2)} over chains of 3, 4, 5 and 7 spins`);
}

{ /* 6. THE CAPACITY THRESHOLD, SHOWN RATHER THAN QUOTED
     A SINGLE TAIL RATIO DOES NOT SEPARATE THE TWO SIDES and the first form of
     this check thought it did. Below the threshold the sum diverges SLOWLY — at
     s = 12.5 the exponent is −½ and the tail/sum ratio settles at 0.414, which
     is under one and looks convergent to any test that only asks whether it is.
     What separates them is how that ratio behaves as the window grows: it holds
     at a constant for a divergent series and collapses like a power for a
     convergent one. So it is measured at two windows, and the threshold is the
     place where the behaviour changes rather than a number written down. */
  const r = (s2, N) => K.s3tcCapacity(s2, 1, N).tail_ratio;
  const bel1 = r(12.5, 5000), bel4 = r(12.5, 20000);
  const abo1 = r(13.5, 5000), abo4 = r(13.5, 20000);
  ok('the resonant capacity sum converges exactly above s = 9 + 4τ₀ and diverges below it, and BOTH sides are shown by widening the window rather than by quoting the threshold',
    K.s3tcCapacity(12.5, 1, 20000).converges === false
    && K.s3tcCapacity(13.5, 1, 20000).converges === true
    && Math.abs(bel4 / bel1 - 1) < 0.02 && abo4 / abo1 < 0.6,
    `τ₀ = 1 → threshold 13 · below it the tail ratio holds at ${bel1.toFixed(4)} → ${bel4.toFixed(4)} as the window quadruples; above it it collapses ${abo1.toExponential(2)} → ${abo4.toExponential(2)}`);
  /* AND THE NUMBER THE INSTRUMENT PUBLISHES HAS TO BE THE NUMBER IT FOUND.
     The first form bisected the convergence boundary and compared it against the
     literal 13 — which passes whatever the published threshold says, because
     `converges` is derived from the exponent and never reads the threshold field
     at all. Changing the published value from 9 + 4τ₀ to 8 + 4τ₀ left this check
     green, so it was checking the arithmetic against itself. The bisected
     boundary is now compared against what the instrument REPORTS, at three
     values of τ₀, which is the only comparison that can fail. */
  const bisect = t0 => { let lo = 1, hi = 40;
    for (let i = 0; i < 70; i++) { const m = (lo + hi) / 2;
      if (K.s3tcCapacity(m, t0, 4000).converges) hi = m; else lo = m; }
    return hi; };
  const agree = [0, 1, 2.5].map(t0 => ({ t0, found: bisect(t0), said: K.s3tcCapacity(20, t0, 16).threshold }));
  ok('and the threshold the instrument PUBLISHES is the boundary it actually has, located by bisection at three Diophantine exponents — not compared against a literal, which is a check testing the arithmetic against itself',
    agree.every(a => Math.abs(a.found - a.said) < 1e-9 && Math.abs(a.said - (9 + 4 * a.t0)) < 1e-12),
    agree.map(a => `τ₀=${a.t0}: boundary ${a.found.toFixed(6)}, published ${a.said}`).join(' · '));
}

{ /* 7. THE CLIFFORD SIEVE IS ONE INTEGER, AND IT DOES NOT REACH TWO CIRCLES */
  ok('the Clifford family is two-dimensional in its interior and ONE-dimensional at c = 0 and c = 1, which is exactly where the CKN dimension argument stops',
    K.s3tcTorusDim(0.5) === 2 && K.s3tcTorusDim(0) === 1 && K.s3tcTorusDim(1) === 1
    && Math.abs(K.s3tcTorusArea(0.5, 1) - 2 * Math.PI * Math.PI) < 1e-12
    && K.s3tcTorusArea(0, 1) === 0,
    'the regular torus has area 2π² at c = ½ and the two degenerate circles have none');
  ok('and the laboratory keeps drawing both degenerate circles whatever c is, because they are the residue the sieve leaves behind',
    /the two DEGENERATE circles, always drawn/.test(src),
    'a residue that is not on the screen is a residue a reader forgets');
}

{ /* 8. DENSE IS NOT HAAR */
  const phi = K.s3tcWinding((1 + Math.sqrt(5)) / 2, 1, 64, 360);
  const rat = K.s3tcWinding(1.5, 1, 64, 360);
  ok('an irrational drift ratio winds the Clifford torus densely and a rational one closes — measured as grid coverage rather than asserted as ergodicity',
    phi.coverage > 0.99 && phi.rational === false && rat.coverage < 0.25 && rat.rational === true,
    `φ reaches ${(100 * phi.coverage).toFixed(1)}% of a 48×48 grid and 3/2 reaches ${(100 * rat.coverage).toFixed(1)}%`);
  ok('and the source says that density is still not the drift-invariance the defect measure would need, which is a separate lock the manuscript names as one',
    /DENSE IS NOT HAAR/.test(src),
    'covering the torus and inheriting its invariance are two statements');
}

{ /* 9. THE GYROSCOPIC GAP IS A BAND STATEMENT AND THE BAND IS PUBLISHED */
  const g8 = K.s3tcGyroGap(3, 2, 8), g64 = K.s3tcGyroGap(3, 2, 64);
  ok('the same-k detuning between opposite helicities is 4|M₊ − M₋|/(k+2), so a wider band gives a SMALLER infimum and the tower gives zero',
    Math.abs(g8.gap - g8.closed) < 1e-12 && g64.gap < g8.gap && g8.tower_limit === 0,
    `${g8.gap.toFixed(6)} over 8 shells and ${g64.gap.toFixed(6)} over 64 — the infimum over the whole tower is 0 for every pair of momenta`);
}

{ /* 10. AND THE LOCK IS OPEN, AS AN OUTPUT */
  const inst = (manifest.instruments || []).find(i => i.id === 's3lock');
  ok('the terminal lock laboratory is registered as a typed instrument with the whole lattice as declared outputs',
    !!inst && inst.outputs.length >= 30 && inst.world === 's3',
    inst ? `${inst.inputs.length} inputs, ${inst.outputs.length} outputs` : 'ABSENT');
  ok('and terminal_lock_open is one of those outputs rather than a sentence in a comment, so no reading of the other numbers can suggest the lock has been closed',
    !!inst && inst.outputs.some(o => o.name === 'terminal_lock_open')
    && /terminal_lock_open:1\}/.test(src)
    && /THE TERMINAL LOCK IS OPEN/.test(src),
    'published as 1 at every configuration');
  ok('and the laboratory separates what it MEASURED from what it merely SCORED, because a lattice that does not is an invitation to read the second as the first',
    /FOUR OF THESE NUMBERS ARE MEASURED AND TWO ARE SCORED, AND THEY MUST NOT BE READ ALIKE/.test(src),
    'the pairing defect and the stretching parity are functionals of a limit nobody has produced');
}

console.log('\n  ' + pass + ' passed, ' + fail + ' failed');
process.exit(fail ? 1 : 0);
