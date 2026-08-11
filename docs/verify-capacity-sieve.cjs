/* ── THE INVARIANT CAPACITY SIEVE ─────────────────────────────────────────────
   STATUS: DERIVED (from the stated manuscript) + VERIFIED (everything below).

   An independent check of the mathematics in "Invariant Capacity Sieve and the Terminal
   Boundary-Selector Problem" (Preece & Batenin).  Nothing here reads the atlas, and
   nothing here is taken on the manuscript's word: every identity is recomputed.

   WHAT THE PAPER CLAIMS, AND WHAT THAT MEANS FOR A MODEL OF THE UNIVERSE.  The paper is
   emphatic about its own boundary, and any model built from it must be equally so:

       it does not compute Lambda; it REDUCES Lambda to a boundary selector.

   So the honest visualisation is not "here is the cosmological constant".  It is a
   sieve with a hole in it, and the hole is the last missing Hamiltonian H_{d,q}.  The
   checks below establish exactly which parts are closed, so the hole can be drawn in
   the right place and at the right size.

   Run: node docs/verify-capacity-sieve.cjs                                            */

const out=[]; const ok=(n,c,d)=>out.push([c?'PASS':'FAIL',n,d]);
const TOL=1e-12;

/* ══ 1 ══ the trace-free projector annihilates a constant vacuum shift ══════ */
{
  /* P_tf(X)_{mu nu} = X_{mu nu} - (1/4) X g_{mu nu} in four dimensions.  Applied to
     X = -rho0 g, whose trace is -4 rho0, this must vanish identically -- that is the
     precise part of the cosmological-constant problem trace-freeness DOES solve. */
  const g=[[-1,0,0,0],[0,1,0,0],[0,0,1,0],[0,0,0,1]];          // Minkowski, signature -+++
  const ginv=g;                                                 // its own inverse here
  let worst=0;
  for(const rho0 of [1,-3.5,1e12,6.02e23,1e-30]){
    const X=g.map(r=>r.map(v=>-rho0*v));
    let tr=0; for(let a=0;a<4;a++)for(let b=0;b<4;b++) tr+=ginv[a][b]*X[a][b];
    for(let m=0;m<4;m++)for(let n=0;n<4;n++)
      worst=Math.max(worst,Math.abs(X[m][n]-0.25*tr*g[m][n])/Math.max(1,Math.abs(rho0)));
  }
  ok('the trace-free projector is exactly blind to a constant vacuum-stress shift: P_tf(-rho0 g) = 0 for every rho0, over thirty orders of magnitude. This is the part of the cosmological-constant problem that trace-freeness genuinely removes, and it is the reason the remaining ambiguity is an INTEGRATION CONSTANT rather than a sum over vacuum modes',
    worst<TOL, `worst |P_tf(-rho0 g)| / |rho0| over five shifts spanning 1e-30 to 6e23: ${worst.toExponential(2)}`);
}

/* ══ 2 ══ the work map and the equation of state ════════════════════════════ */
{
  /* eps(A) = E4/V3 with V3 = 2 pi^2 A^3;  p = -dE4/dV3;  D = A d/dA.
     The claim is p = -eps - (1/3) D eps, hence w_s = -1 - s/3 on a pure branch. */
  const V3=A=>2*Math.PI*Math.PI*A*A*A;
  let worstW=0, worstMap=0;
  for(const s of [1,0,-1,-2,-3,2.5,-4.7]){
    const eps=A=>Math.pow(A,s), E4=A=>eps(A)*V3(A);
    for(const A of [0.3,1,2.7,11]){
      const h=A*1e-6;
      /* p = -dE4/dV3 = -(dE4/dA)/(dV3/dA), by central differences */
      const dE=(E4(A+h)-E4(A-h))/(2*h), dV=(V3(A+h)-V3(A-h))/(2*h);
      const p=-dE/dV;
      const De=(eps(A+h)-eps(A-h))/(2*h)*A;
      /* normalised by eps, NOT by p: at s = -3 the pressure is exactly zero (w = 0,
         dust), so a relative residual against p divides by nothing and reports 2.7e+1
         for an identity that holds perfectly.  The scale of the statement is eps. */
      worstMap=Math.max(worstMap,Math.abs(p-(-eps(A)-De/3))/eps(A));
      worstW=Math.max(worstW,Math.abs(p/eps(A)-(-1-s/3)));
    }
  }
  /* and the five valuation roots give the five stated equations of state */
  const wOf=s=>-1-s/3;
  const table=[[1,-4/3],[0,-1],[-1,-2/3],[-2,-1/3],[-3,0]];
  const tw=Math.max(...table.map(([s,w])=>Math.abs(wOf(s)-w)));
  ok('the work map p = -eps - (D eps)/3 is an identity of the round filling, not an ansatz: computed from E4 and V3 = 2 pi^2 A^3 by differentiation it reproduces itself, and a pure branch eps ~ A^s therefore has w = -1 - s/3 exactly. The five valuation roots {1,0,-1,-2,-3} give w = {-4/3, -1, -2/3, -1/3, 0}',
    worstMap<1e-6 && worstW<1e-6 && tw<TOL,
    `work map residual ${worstMap.toExponential(2)} · w_s residual ${worstW.toExponential(2)} over seven exponents and four radii · the five stated equations of state agree to ${tw.toExponential(2)}`);
}

/* ══ 3 ══ the valuation annihilator and its solution space ══════════════════ */
{
  /* P_val(z) = (z-1) z (z+1) (z+2) (z+3).  In x = ln A the operator D is d/dx, so the
     solution space of P_val(D) eps = 0 is spanned by A^s for s in the root set. */
  const Pval=z=>(z-1)*z*(z+1)*(z+2)*(z+3);
  const roots=[1,0,-1,-2,-3];
  const rootRes=Math.max(...roots.map(r=>Math.abs(Pval(r))));
  /* the polynomial expanded: z^5 + 5z^4 + 5z^3 - 5z^2 - 6z */
  let coeffRes=0;
  for(const z of [-4,-2.5,0.3,1.7,4]){
    const expanded=z**5+5*z**4+5*z**3-5*z**2-6*z;
    coeffRes=Math.max(coeffRes,Math.abs(Pval(z)-expanded)/Math.max(1,Math.abs(expanded)));
  }
  /* apply the operator numerically to each claimed solution and to a non-solution */
  /* THE OPERATOR ACTS EXACTLY ON AN EXPONENTIAL, so that is how it is applied.  The
     first version used fifth-order central differences with h = 1e-3, whose denominator
     is h^5 = 1e-15 -- it reported a residual of 0.34 for branches the operator
     annihilates identically.  A numerical scheme that cannot resolve the quantity it
     measures is not a check, it is noise with a pass threshold. */
  const applyExact=s=>s**5+5*s**4+5*s**3-5*s**2-6*s;      /* P_val(D) on A^s is P_val(s) */
  let solRes=0;
  for(const s of roots) solRes=Math.max(solRes,Math.abs(applyExact(s)));
  const nonSol=Math.abs(applyExact(2));                   /* A^2 is NOT a valuation branch */
  ok('the homogeneous valuation density is exactly the kernel of P_val(D) = (D-1)D(D+1)(D+2)(D+3): the five roots annihilate it, the expanded quintic z^5+5z^4+5z^3-5z^2-6z is the same polynomial, and the operator acting on A^s reduces to the number P_val(s), which vanishes on every branch and is large on A^2 -- a power the valuation does NOT supply',
    rootRes<TOL && coeffRes<1e-13 && solRes<TOL && nonSol>1,
    `roots annihilate to ${rootRes.toExponential(2)} · expansion agrees to ${coeffRes.toExponential(2)} · P_val(s) vanishes on all five branches to ${solRes.toExponential(2)} · the non-branch A^2 gives P_val(2) = ${nonSol}`);
}

/* ══ 4 ══ the dimension count, and why n = 3 is not a preference ════════════ */
{
  /* S_val^(n) = {1,0,-1,...,-n};  the boundary-local face drops the bulk branch, giving
     S_d^(n) = {0,-1,...,-n} with n+1 elements.  Quotient by vacuum (0), curvature (-2)
     and dust (-n) and the dimension is (n+1) - 3 = n - 2, which is 1 exactly at n = 3. */
  const rows=[]; let survivors=[], degenerate=[];
  for(let n=2;n<=8;n++){
    const boundary=[]; for(let s=0;s>=-n;s--) boundary.push(s);
    const excluded=new Set([0,-2,-n]);
    const quotient=boundary.filter(s=>!excluded.has(s));
    /* THE HYPOTHESIS THE COUNT NEEDS, and the manuscript states the count without it:
       (n+1) - 3 = n - 2 assumes vacuum (0), curvature (-2) and dust (-n) are three
       DISTINCT weights.  At n = 2 dust and curvature are the same weight, only two are
       removed, and the actual survivor count is 1 while the formula says 0. */
    const distinct=excluded.size===3;
    if(!distinct) degenerate.push(n);
    rows.push(`n=${n}: ${boundary.length} boundary weights, ${excluded.size} excluded, ${quotient.length} left${distinct?'':' (dust = curvature)'}`);
    if(distinct && quotient.length===1) survivors.push([n,quotient[0]]);
    if(distinct && quotient.length!==n-2) survivors.push(['MISMATCH',n]);
  }
  const only3 = survivors.length===1 && survivors[0][0]===3 && survivors[0][1]===-1;
  const wX = -1-(-1)/3;
  ok('exactly one nonstandard boundary direction survives if and only if n = 3, and it is s = -1 with w = -2/3 -- but the count needs a hypothesis the manuscript leaves implicit, and this check found it: (n+1)-3 = n-2 assumes vacuum (0), curvature (-2) and dust (-n) are three DISTINCT weights, which fails at n = 2 where dust and curvature coincide. Stated with that hypothesis, three-dimensional space is picked out by the valuation algebra rather than assumed',
    only3 && Math.abs(wX+2/3)<TOL,
    `${rows.join(' · ')} · under the stated hypothesis the unique survivor is s = ${only3?survivors[0][1]:'—'}, giving w = ${wX.toFixed(12)} = -2/3 · n = ${degenerate.join(',')} is excluded from the count because there dust and curvature are the SAME weight, so only two exclusions apply and the formula (n+1)-3 does not describe the filtering`);
}

/* ══ 5 ══ Fisher monotonicity of positive mixtures ══════════════════════════ */
{
  /* For eps = sum_s C_s A^s with C_s > 0, the fractions pi_s form an exponential family
     in x = ln A, and D w = -Var_pi(s)/3 <= 0.  Checked by direct differentiation. */
  const G=0.6180339887498949;
  let worst=0, worstFisher=0, sign=true, n=0;
  for(let k=1;k<=40;k++){
    const S=[1,0,-1,-2,-3], C=S.map((_,i)=>0.2+2*((k*G*(i+1))%1));
    const eps=A=>S.reduce((a,s,i)=>a+C[i]*Math.pow(A,s),0);
    for(const A of [0.4,1,3.3]){
      const h=A*1e-5;
      const D=f=>(f(A+h)-f(A-h))/(2*h)*A;
      const k1=D(eps)/eps(A);
      const w=-1-k1/3;
      const wOf=a=>{ const hh=a*1e-5;
        const d=((S.reduce((x,s,i)=>x+C[i]*Math.pow(a+hh,s),0))-(S.reduce((x,s,i)=>x+C[i]*Math.pow(a-hh,s),0)))/(2*hh)*a;
        return -1-(d/S.reduce((x,s,i)=>x+C[i]*Math.pow(a,s),0))/3; };
      const Dw=(wOf(A+h)-wOf(A-h))/(2*h)*A;
      const pi=S.map((s,i)=>C[i]*Math.pow(A,s)/eps(A));
      const mean=S.reduce((a,s,i)=>a+s*pi[i],0);
      const varr=S.reduce((a,s,i)=>a+(s-mean)*(s-mean)*pi[i],0);
      n++;
      worst=Math.max(worst,Math.abs(Dw+varr/3)/Math.max(1e-9,Math.abs(Dw)));
      worstFisher=Math.max(worstFisher,Math.abs(varr-(-3*Dw))/Math.max(1e-9,varr));
      if(Dw>1e-9) sign=false;
    }
  }
  ok('every positive noninteracting mixture obeys D w = -Var_pi(s)/3, so w can only DECREASE with scale, and the Fisher information of the spectral family equals -3 D w. This is falsifiable rather than decorative: a reconstructed epoch with D w > 0 rules out a positive fixed-support mixture outright',
    worst<1e-4 && worstFisher<1e-4 && sign,
    `${n} random positive mixtures over the five roots · |D w + Var/3| relative ${worst.toExponential(2)} · Fisher identity ${worstFisher.toExponential(2)} · D w <= 0 in every case: ${sign}`);
}

/* ══ 6 ══ the coefficient projectors are an identity, not a fit ═════════════ */
{
  /* C_s[F] = A^{-s} prod_{t != s} (D - t)/(s - t) applied to F = sum Omega_t a^t must
     return Omega_s exactly.  Verified by building the operator explicitly on the
     five-power alphabet {0,-1,-2,-3,-4}. */
  const S=[0,-1,-2,-3,-4];
  const G=0.6180339887498949;
  let worst=0;
  for(let k=1;k<=30;k++){
    const Om=S.map((_,i)=>-1+3*((k*G*(i+1.3))%1));
    const F=a=>S.reduce((x,t,i)=>x+Om[i]*Math.pow(a,t),0);
    for(const a of [0.7,1,2.2]){
      for(let si=0;si<S.length;si++){
        const s=S[si];
        /* apply prod_{t != s} (D - t)/(s - t) to F at a, term by term: on a^t the
           operator D acts as multiplication by t, so the projector is exact */
        let val=0;
        for(let i=0;i<S.length;i++){
          let c=1;
          for(const t of S) if(t!==s) c*=(S[i]-t)/(s-t);
          val+=Om[i]*c*Math.pow(a,S[i]);
        }
        val*=Math.pow(a,-s);
        worst=Math.max(worst,Math.abs(val-Om[si]));
      }
    }
  }
  ok('the coefficient projectors are an algebraic identity: C_s[F] returns Omega_s exactly for every coefficient of every expansion on the finite alphabet, at every radius. This is what separates a physical a^{-2} stress from geometric curvature without fitting anything',
    worst<1e-11,
    `30 random five-coefficient ledgers x 3 radii x 5 projectors · worst |C_s[F] - Omega_s| = ${worst.toExponential(2)}`);
}

/* ══ 7 ══ the capacity dictionary closes on the observed sector ═════════════ */
{
  /* q = S_dS = A/(4 l_P^2) = 3 pi / (Lambda l_P^2), so u = ln q.  With the Planck-
     normalised late-time value of Lambda this must land on the paper's u_obs. */
  const lP=1.616255e-35;                       // m, CODATA 2022
  const Lam=1.1056e-52;                        // m^-2, Planck 2018 late-time ledger
  const q=3*Math.PI/(Lam*lP*lP);
  const u=Math.log(q);
  const phi=(1+Math.sqrt(5))/2;
  const Nphi=Math.log(q/Math.PI)/(2*Math.log(phi));
  /* the scheme coordinate: u = 16 pi^2 / (b g^2) at one loop with Xi = 1 */
  const bg2=16*Math.PI*Math.PI/u;
  ok('the capacity dictionary is arithmetic, and it lands where the paper says: q = 3 pi/(Lambda l_P^2) from the Gibbons-Hawking entropy gives u = ln q close to the quoted 282.111, the golden-shell coordinate N_phi = ln(q/pi)/(2 ln phi) lands near the quoted 292, and the one-loop scheme coordinate 16 pi^2/u reproduces the quoted 0.55976. None of this SELECTS the sector -- it is the dictionary that turns an amplitude problem into an integer-sector problem',
    Math.abs(u-282.111)<0.05 && Math.abs(Nphi-292)<0.2 && Math.abs(bg2-0.55976)<2e-4,
    `q = ${q.toExponential(4)} · u = ln q = ${u.toFixed(3)} against the quoted 282.111 +/- 0.015 · N_phi = ${Nphi.toFixed(2)} against the quoted 292 · b g^2 = 16 pi^2/u = ${bg2.toFixed(5)} against the quoted 0.55976`);
}

/* ══ 8 ══ THE NO-GO, exercised rather than quoted ═══════════════════════════ */
{
  /* The claim: a free energy built from finitely many O(1) admissibility terms --
     constants, bounded phases, walls, logarithms, bounded oscillatory registry terms --
     cannot produce a stable isolated minimum at u ~ 282.  This is not a proof, but it
     IS testable: build such a Gamma from every ingredient the paper lists, scan the
     logarithmic axis, and see where its minima actually fall. */
  const phi=(1+Math.sqrt(5))/2, G=0.6180339887498949;
  let trials=0, isolated=0, onTarget=0, degenSum=0;
  for(let k=1;k<=200;k++){
    /* O(1) coefficients, deterministic and reproducible */
    const c=(i)=>-1+2*((k*G*(i+1.7))%1);
    const Gam=u=>
        c(0)                                   // a constant on the sector
      + c(1)*Math.log(1+u)                     // an index / logarithmic term
      + c(2)*Math.cos(2*Math.PI*u/Math.log(phi))   // a bounded registry oscillation
      + c(3)*Math.cos(u/2+c(4))                // an APS / determinant phase
      + c(5)*Math.tanh(u-c(6))                 // a Schwinger wall
      + c(7)*Math.log(1+Math.abs(Math.sin(u))) ;   // a bounded admissibility term
    /* scan the logarithmic axis and find the global minimum */
    /* THE NO-GO IS ABOUT A STABLE ISOLATED CENTRE, not about where a periodic
       function's numerically-global minimum happens to fall.  Bounded oscillations have
       many near-degenerate minima across the whole axis; counting only the global one
       measured an artefact of the scan.  What the theorem actually forbids is a minimum
       that is BOTH deep relative to its neighbours AND located at u ~ 282, so both are
       measured. */
    const U=[], V=[];
    for(let i=0;i<=40000;i++){ const u=0.05+i*(400/40000); U.push(u); V.push(Gam(u)); }
    let best=Infinity, at=0;
    for(let i=0;i<V.length;i++) if(V[i]<best){ best=V[i]; at=U[i]; }
    /* how many local minima come within 5% of the global depth?  a genuine selector has
       exactly one; bounded admissibility data has many */
    const span=Math.max(...V)-best||1;
    let degen=0;
    for(let i=1;i<V.length-1;i++)
      if(V[i]<=V[i-1]&&V[i]<=V[i+1]&&(V[i]-best)/span<0.05) degen++;
    trials++;
    if(degen<=1) isolated++;
    if(Math.abs(at-282.111)<1) onTarget++;
    degenSum+=degen;
  }
  ok('THE NO-GO, exercised rather than quoted: two hundred free energies were built from exactly the ingredients the paper lists -- a sector constant, an index logarithm, a golden-registry oscillation, an APS phase, a Schwinger wall and a bounded admissibility term, all with O(1) coefficients -- and the logarithmic axis was scanned from 0 to 400 for BOTH properties the theorem forbids together: a minimum at u ~ 282, and a minimum that is isolated rather than one of many near-degenerate ones. Not one landed on the target, and most carried a whole family of equally deep minima -- which is exactly the shape of the failure the theorem describes. The missing object is a nonconformal edge Hamiltonian with a genuine running coupling',
    onTarget===0 && isolated<trials*0.5 && trials===200,
    `${trials} admissibility-only free energies scanned over u in [0.05, 400] · reaching u = 282.111 +/- 1: ${onTarget} · possessing an ISOLATED global minimum: ${isolated}/${trials} · mean number of near-degenerate minima: ${(degenSum/trials).toFixed(1)}`);
}

/* ══ 9 ══ what the sieve does NOT close ════════════════════════════════════ */
{
  ok('and the boundary of the claim, recorded as a check so it cannot be quietly dropped: the paper does not compute Lambda. It removes constant vacuum shifts by the trace-free projector, reconstructs an integration constant by the Bianchi identity, converts the value of Lambda into an INTEGER-SECTOR problem through horizon capacity, and forces the five valuation weights -- but the selector Gamma(q) = -ln Tr exp(-beta H) requires a nonconformal edge Hamiltonian that does not yet exist. Any model of the universe built on this must draw the hole, not paper over it',
    true,
    'status: DERIVED + VERIFIED for the sieve (checks 1-7), VERIFIED as a negative result for the no-go (check 8), OPEN for H_{d,q} and therefore OPEN for the value of Lambda');
}

for(const [s,n,d] of out) console.log(s.padEnd(5), n, '\n      ', d);
console.log('\n', out.filter(r=>r[0]==='PASS').length+'/'+out.length, 'checks pass');
process.exitCode = out.some(r=>r[0]==='FAIL') ? 1 : 0;
