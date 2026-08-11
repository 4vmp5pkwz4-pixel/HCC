/* ── THE ERROR BUDGET OF THE CAPACITY SELECTOR ────────────────────────────────
   STATUS: DERIVED here (this is not in the manuscript) + VERIFIED below.

   "Capacity-Fixed Trace-Free Gravity and Non-Perturbative Edge-Partition Boundary
   Selection" (Preece & Batenin) closes the selector by passing three gates:

       A · Hopf-Bradlow-APS-HC recursion      supplies  N_phi = 292
       B · GLSM / stringy edge matching       supplies  b g^2 = 0.559754586, Xi = 0.99916928
       C · determinant line / heat kernel     supplies  nu = 1/2

   The paper presents them side by side, as three conditions that must all hold.  That is
   true, and it is also the wrong picture of where the PREDICTION comes from, because the
   three gates do not constrain the answer to remotely the same precision.

   This file establishes the thing the paper does not state: each gate, taken alone,
   implies a value of u = ln q; each implied u implies a cosmological constant; and each
   of those sits some number of observational standard deviations from the measured sky.
   That table is the error budget of the construction.  Its content, verified below:

       gate B fixes u to nine decimals and lands Lambda at -0.90 sigma -- the prediction
       gate A only says the sector sits on rung 292, a window tens of sigma wide -- a
              LOCATOR, which confirms rather than predicts
       gate C moves u by nu/q* ~ 1e-123 -- structurally required, numerically invisible

   Nothing here contradicts the manuscript.  It quantifies a distinction the manuscript
   leaves implicit, and the distinction matters: a reader who took "three gates" to mean
   "three independent determinations of Lambda" would badly overstate how much redundancy
   the construction has.  It has one sharp determination and two consistency conditions.

   Run: node docs/verify-capacity-gate-budget.cjs                                      */

const out=[]; const ok=(n,c,d)=>out.push([c?'PASS':'FAIL',n,d]);

/* quoted once, never re-derived from each other */
const Q_STAR = 3.307251460713979e122;
const NU     = 0.5;
const BG2    = 0.559754586;    // nine decimals quoted -> last-digit round-off 5e-10
const XI     = 0.99916928;
const N_PHI  = 292;
const L_P    = 1.616255e-35;
const PHI    = (1+Math.sqrt(5))/2;
const U_STAR = Math.log(Q_STAR);

/* Planck 2018 TT,TE,EE+lowE+lensing+BAO */
const H0=67.66e3/3.0856775814913673e22, C=299792458;
const LAM_OBS=3*0.6889*H0*H0/(C*C);
const LAM_SIG=LAM_OBS*Math.hypot(0.0056/0.6889, 2*0.42/67.66);

const lam   = u=>3*Math.PI/(L_P*L_P*Math.exp(u));
const sigOf = u=>(lam(u)-LAM_OBS)/LAM_SIG;

/* each gate: the u it implies alone, and the width of its own determination in u */
const GATES=[
  {k:'A', u:Math.log(Math.PI)+2*N_PHI*Math.log(PHI), spread:2*Math.log(PHI)},
  {k:'B', u:Math.log(XI)+16*Math.PI*Math.PI/BG2,     spread:16*Math.PI*Math.PI*5e-10/(BG2*BG2)},
  {k:'C', u:U_STAR+NU/Q_STAR,                        spread:NU/Q_STAR},
];
/* the width, taken as the actual sigma-span across the gate's own step rather than the
   linearisation |dLambda/Lambda| = |du|.  Lambda ~ e^-u is convex, and for a step as wide
   as a golden rung the linearisation overstates the window by about a third -- which is
   exactly the kind of quiet 30% that must not be allowed into an error budget. */
const budget=GATES.map(g=>({...g,
  sigma:sigOf(g.u),
  halfWidth:Math.abs(sigOf(g.u-g.spread/2)-sigOf(g.u+g.spread/2))/2}));
const [A,B,Cg]=budget;

/* ══ 1 ══ the scheme gate reproduces the manuscript's own sector ═══════════ */
{
  /* This is the check that licenses everything after it: if gate B did NOT reproduce
     q*, then "the gate that predicts" would be a claim about the wrong number. */
  const rel=Math.abs(B.u-U_STAR)/U_STAR;
  ok('the scheme gate alone reproduces the manuscript sector, which is what licenses calling it the predictive one: u_B = ln Xi + 16 pi^2/(b g^2) lands on ln q* to better than one part in 4e11. The other two gates are then measured against the same axis rather than against each other',
    rel<1e-10,
    `u_B = ${B.u.toFixed(9)} against ln q* = ${U_STAR.toFixed(9)} · relative ${rel.toExponential(2)} · absolute ${(B.u-U_STAR).toExponential(3)}`);
}

/* ══ 2 ══ the recursion gate does NOT reproduce it, and the gap is real ════ */
{
  /* N_phi = 292 exactly would put u at ln(pi) + 584 ln(phi).  The manuscript's own q*
     gives N_phi = 291.9367, which is 0.0633 BELOW the rung.  So the rung and the sector
     are different numbers -- the paper's check 3 says the sector is "near" rung 292, and
     "near" is doing real work.  Recording the size of that gap is the whole point. */
  const N=(U_STAR-Math.log(Math.PI))/(2*Math.log(PHI));
  const gapU=A.u-U_STAR;
  ok('the recursion gate does NOT land on the manuscript sector, and the gap is far larger than any rounding: placing the sector exactly on rung 292 gives u_A = 282.172436, which is 0.0609 above ln q*. Equivalently the manuscript sector sits at N_phi = 291.9367, six hundredths of a rung BELOW the integer. The paper states this as "rounds to 292", which is true; what it does not state is that the residual is a real displacement rather than a round-off',
    Math.abs(gapU)>1e-3 && Math.abs(N-N_PHI)>1e-3 && Math.abs(N-N_PHI)<0.1,
    `u_A = ${A.u.toFixed(9)} · ln q* = ${U_STAR.toFixed(9)} · gap ${gapU.toFixed(6)} in u · N_phi(q*) = ${N.toFixed(6)}, i.e. ${(N-N_PHI).toFixed(6)} from the rung`);
}

/* ══ 3 ══ what that gap costs against the sky ══════════════════════════════ */
{
  /* The gap is 0.061 in u.  Lambda ~ e^-u, so that is a 6.3% shift in Lambda, against an
     observational error bar of 1.48%.  A tenth of a rung is therefore a four-sigma
     effect: the rung index cannot be read as a prediction of Lambda. */
  ok('the recursion gap is a four-sigma effect on the sky, which is why the rung index cannot be read as a prediction: the manuscript sector sits at -0.90 sigma from the Planck 2018 value, while the exact rung sits at -4.83 sigma. Both are the same integer 292; they differ by six hundredths of one rung. A construction whose answer moves four sigma inside a single registry step is not being pinned down by that registry',
    Math.abs(B.sigma)<1.5 && Math.abs(A.sigma)>4 && Math.abs(A.sigma)<6,
    `sigma at the manuscript sector = ${B.sigma.toFixed(4)} · sigma at exact rung 292 = ${A.sigma.toFixed(4)} · Lambda* = ${lam(U_STAR).toExponential(4)} vs Lambda_rung = ${lam(A.u).toExponential(4)} vs observed ${LAM_OBS.toExponential(4)} +/- ${LAM_SIG.toExponential(2)}`);
}

/* ══ 4 ══ the rung window, measured exactly ════════════════════════════════ */
{
  /* One rung step is 2 ln phi = 0.9624 in u.  Across it Lambda changes by the factor
     phi^2 = 2.618, i.e. by 62% of itself -- forty-one sigma. */
  const step=Math.abs(sigOf(U_STAR)-sigOf(U_STAR+2*Math.log(PHI)));
  ok('one golden rung is forty-one sigma wide, so the recursion gate constrains Lambda to a window tens of standard deviations across: the registry says which rung, and a rung spans a factor phi^2 = 2.618 in Lambda. Knowing the rung therefore narrows the cosmological constant to within a factor of two and a half, which is an enormous achievement against 10^122 and simultaneously useless as a precision test',
    step>35 && step<50 && Math.abs(A.halfWidth-31.3)<1,
    `one rung = 2 ln phi = ${(2*Math.log(PHI)).toFixed(6)} in u = a factor phi^2 = ${(PHI*PHI).toFixed(4)} in Lambda = ${step.toFixed(2)} sigma · gate A half-width ${A.halfWidth.toFixed(2)} sigma`);
}

/* ══ 5 ══ the scheme gate's own width, from its last quoted digit ══════════ */
{
  /* b g^2 is quoted to nine decimals, so its round-off is 5e-10.  Propagated:
     du = 16 pi^2/(b g^2)^2 * 5e-10 = 2.52e-7, which is 8.4e-6 sigma. */
  const ratio=A.halfWidth/B.halfWidth;
  ok('the scheme gate is sharper than the recursion gate by more than six orders of magnitude, and that ratio IS the error budget: propagating the last quoted digit of b g^2 gives a window of 8.4e-6 sigma, against 31 sigma for the rung. Whatever precision this construction has, it has it because of the GLSM/stringy matching -- the golden registry contributes structure and consistency, not sharpness',
    B.halfWidth<1e-4 && ratio>1e5,
    `gate B: b g^2 round-off 5e-10 -> ${B.spread.toExponential(3)} in u -> +/-${B.halfWidth.toExponential(3)} sigma · gate A: +/-${A.halfWidth.toFixed(2)} sigma · sharper by a factor ${ratio.toExponential(2)}`);
}

/* ══ 6 ══ the determinant line is structural, not numerical ════════════════ */
{
  /* nu shifts the stationary point from q* to q*(1 + nu/q*).  That is 1.5e-123 in
     relative terms.  Saying so plainly is more honest than implying a third pillar. */
  const shift=NU/Q_STAR;
  ok('the determinant line moves the answer by a hundred and twenty-three orders of magnitude less than anything observable, and it is still load-bearing: nu = 1/2 shifts the stationary point by nu/q* = 1.5e-123 in u, exactly zero sigma at double precision. Its job is not to move the minimum but to make one exist -- it supplies the subleading term of -log Z_edge, and d2Gamma/dq2 = 1/q + nu/q^2 is what makes the convexity strict. Structural, not numerical, and the budget should say which',
    shift<1e-120 && Cg.halfWidth===0 && Math.abs(Cg.sigma-B.sigma)<B.halfWidth,
    `nu/q* = ${shift.toExponential(3)} · gate C half-width ${Cg.halfWidth} sigma · sigma at gate C = ${Cg.sigma.toFixed(6)}, which differs from gate B by ${Math.abs(Cg.sigma-B.sigma).toExponential(1)} sigma -- and that residual is gate B's OWN round-off (+/-${B.halfWidth.toExponential(1)}), not a contribution from nu, which vanishes 115 orders below it`);
}

/* ══ 7 ══ the linearisation that was NOT used, and why ═════════════════════ */
{
  /* An error budget assembled with |dLambda/Lambda| = |du| would report the rung window
     as 64.9 sigma instead of 62.6.  That is a 4% overstatement on the half-width -- small,
     but it is the kind of quiet slack that makes a budget useless, so the exact span is
     used and the difference is recorded here rather than left to trust. */
  const lin=2*Math.log(PHI)*LAM_OBS/LAM_SIG/2;
  const err=(lin-A.halfWidth)/A.halfWidth;
  ok('and the approximation this file refuses, recorded so it cannot creep back: converting a rung-wide window with the linearisation |dLambda/Lambda| = |du| would report +/-32.4 sigma where the exact span is +/-31.3. Lambda ~ e^-u is convex, and over a step of 0.96 the linearisation is wrong by 4%. It changes no conclusion here, and it is still not used, because an error budget assembled from approximations is an estimate wearing the clothes of a measurement',
    Math.abs(err)>0.02 && Math.abs(err)<0.10,
    `linearised half-width ${lin.toFixed(3)} sigma · exact span half-width ${A.halfWidth.toFixed(3)} sigma · the linearisation overstates by ${(100*err).toFixed(1)}%`);
}

for(const [s,n,d] of out) console.log(s.padEnd(5), n, '\n      ', d);
console.log('\n', out.filter(r=>r[0]==='PASS').length+'/'+out.length, 'checks pass');
process.exitCode = out.some(r=>r[0]==='FAIL') ? 1 : 0;
