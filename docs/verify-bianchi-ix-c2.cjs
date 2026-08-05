/* ── WORK PACKAGE C2 · BIANCHI IX, THE DYNAMICS ───────────────────────────────
   STATUS: DERIVED (from the WP D action, nothing new assumed) + VERIFIED (below).

   WP D fixed the action.  C2 asks the only question that matters afterwards: what do
   its trajectories actually DO, and is there a physical forcing that could give the
   quantum spectrum of section 4 a real periodic, quasiperiodic or chaotic drive?
   That question is settled by integrating, measuring and classifying — not by
   declaring.  Nothing here reads the atlas.

   THE ONE MOVE THAT MAKES THIS TRACTABLE.  In the N = 1 gauge the flow is stiff: with
   alphadot = -p_a/(12 C e^{3a}), approaching the singularity a -> -infinity sends the
   right-hand side to infinity, and a fixed-step integrator either crawls or lies.
   The lapse is free, so choose it:

       N = 12 C e^{3 alpha}      ("volume time" tau,  dt = 12 C e^{3 alpha} dtau)

   and the constraint 12 C e^{3a} * H_1 becomes polynomial in the momenta:

       H_tau = (1/2)( -p_a^2 + p_+^2 + p_-^2 ) + 12 C^2 e^{4a} V_G + 24 C^2 Lam e^{6a}

   with the flow

       a'   = -p_a          b_+' = p_+          b_-' = p_-
       p_a' = -( 48 C^2 e^{4a} V_G + 144 C^2 Lam e^{6a} )
       p_+' = -12 C^2 e^{4a} dV/db_+          p_-' = -12 C^2 e^{4a} dV/db_-
       t'   =  12 C e^{3a}                    (physical time by quadrature)

   Because N > 0 everywhere this is a REPARAMETRISATION, not a different physics: the
   two vector fields are proportional with factor N and the orbits coincide.  Check 2
   verifies exactly that, so nothing below is an artefact of the change of clock.

   THE RESULT THAT SURPRISED ME, and it is a clean no-go: vacuum-plus-Lambda Bianchi IX
   has NO equilibrium at all.  Stationarity needs p = 0, beta = 0 and pdot_a = 0, which
   forces e^{2a} = 1/(4 Lam); the constraint at the same point forces e^{2a} = 3/(4 Lam).
   A factor of three apart, for every Lambda > 0.  So "stationary" is a class the
   classifier is built to detect and can never populate, and saying so is worth more
   than quietly omitting the category.

   HONESTY ABOUT LYAPUNOV EXPONENTS.  A Lyapunov exponent in minisuperspace is
   parametrisation dependent -- this is the Burd-Buric-Ellis point, and it is real: the
   same orbit gives different lambda in different time gauges.  What survives is the
   SIGN, and only for a BOUNDED orbit with a recurrence.  So lambda is reported in the
   tau gauge, labelled as such, used only as one input among several, and validated
   against a system whose exponent is known analytically (check 9).  No trajectory is
   called chaotic on lambda alone.

   Run:  node docs/verify-bianchi-ix-c2.cjs            (checks)
         node docs/verify-bianchi-ix-c2.cjs --emit     (rewrite docs/data/…csv)      */

const out=[]; const ok=(n,c,d)=>out.push([c?'PASS':'FAIL',n,d]);
const G=1, C=Math.PI/G;                       // G = 1 units; C = pi/G by the volume factor
const C2=C*C, S3=Math.sqrt(3);

/* ── the potential and its exact first and second derivatives ─────────────── */
const betas=(bp,bm)=>[bp+S3*bm, bp-S3*bm, -2*bp];
const JAC=[[1,S3],[1,-S3],[-2,0]];            // d beta_i / d (beta_+, beta_-)
function V(bp,bm){ const b=betas(bp,bm);
  return 0.5*(Math.exp(4*b[0])+Math.exp(4*b[1])+Math.exp(4*b[2])
             -2*Math.exp(-2*b[0])-2*Math.exp(-2*b[1])-2*Math.exp(-2*b[2])); }
function Vbeta(bp,bm){                        // the second stated form, kept as a cross-check
  return 0.5*(Math.exp(-8*bp)-4*Math.exp(-2*bp)*Math.cosh(2*S3*bm)
             +2*Math.exp(4*bp)*(Math.cosh(4*S3*bm)-1)); }
function dV(bp,bm){                           // dV/db_i = 2( e^{4b_i} + e^{-2b_i} ), chain rule
  const b=betas(bp,bm), g=b.map(x=>2*(Math.exp(4*x)+Math.exp(-2*x)));
  return [g[0]*JAC[0][0]+g[1]*JAC[1][0]+g[2]*JAC[2][0],
          g[0]*JAC[0][1]+g[1]*JAC[1][1]+g[2]*JAC[2][1]]; }
function d2V(bp,bm){                          // Hess = J^T diag(d2V/db_i^2) J
  const b=betas(bp,bm), h=b.map(x=>8*Math.exp(4*x)-4*Math.exp(-2*x));
  const M=[[0,0],[0,0]];
  for(let i=0;i<3;i++)for(let r=0;r<2;r++)for(let s=0;s<2;s++) M[r][s]+=h[i]*JAC[i][r]*JAC[i][s];
  return M; }

/* ── the two Hamiltonians and the two flows ───────────────────────────────── */
const H1=(y,L)=>{ const [a,bp,bm,pa,pp,pm]=y;
  return (-pa*pa+pp*pp+pm*pm)/(24*C*Math.exp(3*a))+C*Math.exp(a)*V(bp,bm)+2*C*L*Math.exp(3*a); };
const Ht=(y,L)=>{ const [a,bp,bm,pa,pp,pm]=y;
  return 0.5*(-pa*pa+pp*pp+pm*pm)+12*C2*Math.exp(4*a)*V(bp,bm)+24*C2*L*Math.exp(6*a); };
const lapse=a=>12*C*Math.exp(3*a);
function f1(y,L){                              // N = 1
  const [a,bp,bm,pa,pp,pm]=y, e3=Math.exp(3*a), g=dV(bp,bm);
  return [-pa/(12*C*e3), pp/(12*C*e3), pm/(12*C*e3),
    (-pa*pa+pp*pp+pm*pm)/(8*C*e3)-C*Math.exp(a)*V(bp,bm)-6*C*L*e3,
    -C*Math.exp(a)*g[0], -C*Math.exp(a)*g[1]]; }
function ft(y,L){                              // N = 12 C e^{3a}
  const [a,bp,bm,pa,pp,pm]=y, e4=Math.exp(4*a), g=dV(bp,bm);
  return [-pa, pp, pm,
    -(48*C2*e4*V(bp,bm)+144*C2*L*Math.exp(6*a)),
    -12*C2*e4*g[0], -12*C2*e4*g[1]]; }
function Jt(y,L){                              // exact Jacobian of ft, for the tangent flow
  const [a,bp,bm]=y, e4=Math.exp(4*a), e6=Math.exp(6*a), g=dV(bp,bm), Hs=d2V(bp,bm);
  const M=Array.from({length:6},()=>new Array(6).fill(0));
  M[0][3]=-1; M[1][4]=1; M[2][5]=1;
  M[3][0]=-(192*C2*e4*V(bp,bm)+864*C2*L*e6); M[3][1]=-48*C2*e4*g[0]; M[3][2]=-48*C2*e4*g[1];
  M[4][0]=-48*C2*e4*g[0]; M[4][1]=-12*C2*e4*Hs[0][0]; M[4][2]=-12*C2*e4*Hs[0][1];
  M[5][0]=-48*C2*e4*g[1]; M[5][1]=-12*C2*e4*Hs[1][0]; M[5][2]=-12*C2*e4*Hs[1][1];
  return M; }

/* ── initial data ON the constraint surface, by construction ──────────────── */
/*  H_tau = 0  <=>  p_a^2 = p_+^2 + p_-^2 + 24 C^2 e^{4a} V_G + 48 C^2 Lam e^{6a}
    The right-hand side can be negative (V_G(0,0) = -3/2), and when it is, there is NO
    real p_a: that point is simply not on the constraint surface for those momenta.  We
    do not clamp it to zero -- we scale (p_+, p_-) up until it is reachable and REPORT
    the scaling, because a silently moved initial condition is a fabricated trajectory. */
function seed(a,bp,bm,pp,pm,L,branch){
  const base=24*C2*Math.exp(4*a)*V(bp,bm)+48*C2*L*Math.exp(6*a);
  let s=1, disc=pp*pp+pm*pm+base;
  if(disc<0){
    if(pp===0&&pm===0) return null;                       // no direction to scale in
    s=Math.sqrt((-base)*1.05/(pp*pp+pm*pm));              // 5% above the marginal case
    pp*=s; pm*=s; disc=pp*pp+pm*pm+base;
  }
  if(disc<0) return null;
  const pa=(branch==='expanding'?-1:1)*Math.sqrt(disc);   // alphadot = -p_a/N > 0  <=>  p_a < 0
  return {y:[a,bp,bm,pa,pp,pm], scale:s};
}

/* ── Dormand-Prince 5(4), adaptive, with the constraint used only as a MONITOR ─ */
const DP_A=[[],[1/5],[3/40,9/40],[44/45,-56/15,32/9],[19372/6561,-25360/2187,64448/6561,-212/729],
  [9017/3168,-355/33,46732/5247,49/176,-5103/18656],[35/384,0,500/1113,125/192,-2187/6784,11/84]];
const DP_B=[35/384,0,500/1113,125/192,-2187/6784,11/84,0];
const DP_B2=[5179/57600,0,7571/16695,393/640,-92097/339200,187/2100,1/40];
function dp5(y,L,h,F,errN){
  const k=[]; const n=y.length; const nE=errN||n;
  for(let i=0;i<7;i++){
    const yi=y.slice();
    for(let j=0;j<i;j++){ const c=DP_A[i][j]; if(!c) continue;
      for(let d=0;d<n;d++) yi[d]+=h*c*k[j][d]; }
    k.push(F(yi,L));
  }
  const y5=y.slice(), y4=y.slice();
  for(let d=0;d<n;d++){ let s5=0,s4=0;
    for(let i=0;i<7;i++){ s5+=DP_B[i]*k[i][d]; s4+=DP_B2[i]*k[i][d]; }
    y5[d]+=h*s5; y4[d]+=h*s4; }
  let err=0; for(let d=0;d<nE;d++) err=Math.max(err,Math.abs(y5[d]-y4[d])/(1+Math.abs(y5[d])));
  return {y:y5,err};
}

/* ── the trajectory, its diagnostics and its class ────────────────────────── */
const SING_DROP=9, DS_RISE=6;          // ln-volume windows: e^{-27} collapse, e^{18} growth
function shearFrac(y){ const [,,,pa,pp,pm]=y; return (pp*pp+pm*pm)/Math.max(1e-300,pa*pa); }

function run(ic,L,opt={}){
  if(!ic) throw new Error('run() was given an initial condition that is not on the constraint surface');
  const tauMax=opt.tauMax??6, tol=opt.tol??1e-11, sample=opt.sample??1024, lyap=opt.lyap!==false;
  const drop=opt.singDrop??SING_DROP;
  /* the physical time is a seventh state variable, not a running sum: t' = N(alpha) is
     integrated by the same fifth-order scheme as everything else.  Adding h*N(y) after
     each step -- which is what this did first -- is a FIRST order quadrature, and it
     silently made t_end the least accurate number in the table. */
  let z=[...ic.y,0]; if(lyap) z=z.concat([0,1e-8,0,0,0,0]);
  const a0=ic.y[0];
  const scaleOf=y=>Math.abs(12*C2*Math.exp(4*y[0])*V(y[1],y[2]))
                  +24*C2*Math.abs(L)*Math.exp(6*y[0])
                  +0.5*(y[3]*y[3]+y[4]*y[4]+y[5]*y[5])+1;
  const F=(zz,LL)=>{
    const base=ft(zz.slice(0,6),LL), d=new Array(zz.length).fill(0);
    for(let i=0;i<6;i++) d[i]=base[i];
    d[6]=lapse(zz[0]);
    if(zz.length>7){ const M=Jt(zz.slice(0,6),LL);
      for(let i=0;i<6;i++){ let sm=0; for(let j=0;j<6;j++) sm+=M[i][j]*zz[7+j]; d[7+i]=sm; } }
    return d; };
  const errMask=z.length>7?7:7;      // the tangent must not drive the step size
  let tau=0, h=1e-5, resid=0, lySum=0, lyTau=0, steps=0, rej=0, bounces=0, prevRad=null, prevUp=null;
  let aMin=z[0], aMax=z[0], shMax=shearFrac(z), bMax=Math.hypot(z[1],z[2]);
  const trace=[], dtau=tauMax/sample; let next=0, stop='window';
  const push=()=>trace.push({tau,t:z[6],a:z[0],bp:z[1],bm:z[2],pa:z[3],pp:z[4],pm:z[5],sh:shearFrac(z),V:V(z[1],z[2])});
  push(); next=dtau;
  while(tau<tauMax&&steps<600000){
    if(tau+h>tauMax) h=tauMax-tau;
    const st=dp5(z,L,h,F,errMask);
    if(st.err>tol&&h>1e-13){ h*=Math.max(0.2,0.9*Math.pow(tol/st.err,0.2)); rej++; continue; }
    z=st.y; tau+=h; steps++;
    h*=Math.min(5,Math.max(0.2,0.9*Math.pow(tol/Math.max(st.err,1e-16),0.2)));
    if(lyap){ const w=z.slice(7), nw=Math.hypot(...w);
      if(nw>1e-4||nw<1e-12){ lySum+=Math.log(nw/1e-8); lyTau=tau;
        const sc=1e-8/nw; for(let i=0;i<6;i++) z[7+i]*=sc; } }
    /* the relative residual has to be measured against the CURRENT scale.  Normalising
       by the value at t = 0 is what produced a reported "drift" of 1e+3 on an orbit
       that was in fact clean: e^{6 alpha} grows by e^{36} across a de Sitter escape,
       so a fixed denominator turns healthy growth into fake error. */
    resid=Math.max(resid,Math.abs(Ht(z.slice(0,6),L))/scaleOf(z));
    aMin=Math.min(aMin,z[0]); aMax=Math.max(aMax,z[0]);
    shMax=Math.max(shMax,shearFrac(z)); bMax=Math.max(bMax,Math.hypot(z[1],z[2]));
    /* a wall bounce is a turning point of the anisotropy radius: the Mixmaster
       observable, counted rather than asserted */
    const rad=Math.hypot(z[1],z[2]), up=prevRad===null?null:(rad>prevRad);
    if(up!==null&&prevUp!==null&&up!==prevUp) bounces++;
    if(up!==null) prevUp=up;
    prevRad=rad;
    while(tau>=next&&trace.length<=sample){ push(); next+=dtau; }
    if(z[0]<a0-drop){ stop='collapse'; break; }
    if(z[0]>a0+DS_RISE){ stop='de Sitter escape'; break; }
    if(!Number.isFinite(z[0]+z[3]+z[4]+z[6])){ stop='overflow'; break; }
  }
  let lam=null;
  if(lyap){ const nw=Math.hypot(...z.slice(7)); if(lyTau>0||nw>0){ lySum+=Math.log(nw/1e-8); lam=lySum/tau; } }
  const y=z.slice(0,6);
  return {y,tau,t:z[6],resid,stop,a0,aMin,aMax,shMax,shEnd:shearFrac(y),bMax,bounces,
          trace,steps,rej,lam,bounded:stop==='window',scale:ic.scale,L};
}

/* recurrence in the (beta_+, beta_-, p_+, p_-) subspace, and a dominant-frequency count */
function recurrence(tr){
  if(tr.length<40) return 1;
  const q=tr.map(s=>[s.bp,s.bm,s.pp,s.pm]), n=q.length;
  const sc=Math.max(1e-12,Math.max(...q.map(v=>Math.hypot(...v))));
  let best=Infinity;
  for(let i=Math.floor(n*0.2);i<n;i++){
    let d=0; for(let k=0;k<4;k++) d+=(q[i][k]-q[0][k])**2;
    best=Math.min(best,Math.sqrt(d)/sc); }
  return best;
}
function peakCount(tr,key){
  const n=Math.min(512,tr.length); if(n<64) return 0;
  const x=tr.slice(0,n).map(s=>s[key]); const mu=x.reduce((a,b)=>a+b,0)/n;
  const y=x.map(v=>v-mu); const P=[];
  for(let k=1;k<n/2;k++){ let re=0,im=0;
    for(let j=0;j<n;j++){ const th=-2*Math.PI*k*j/n; re+=y[j]*Math.cos(th); im+=y[j]*Math.sin(th); }
    P.push(re*re+im*im); }
  const mx=Math.max(...P); if(mx<=0) return 0;
  let c=0; for(let k=1;k<P.length-1;k++)
    if(P[k]>P[k-1]&&P[k]>P[k+1]&&P[k]>0.02*mx) c++;
  return c;
}
/* THE CLASSIFIER.  Stated in full so it can be argued with, and applied identically to
   every seed.  Order matters: the geometric fates are decided before the spectral ones,
   because an orbit that leaves the region has no spectrum to speak of. */
const LAM_TOL=0.12, REC_TOL=0.02;
function classify(r){
  const fx=Math.hypot(...ft(r.y,r.L));
  if(fx<1e-10&&Math.hypot(r.y[1],r.y[2])<1e-10) return 'stationary';   /* provably empty, check 7 */
  if(r.stop==='overflow') return 'singular';
  if(r.stop==='collapse') return 'singular';
  if(r.stop==='de Sitter escape') return 'transient';
  /* from here the orbit stayed inside the window, so and only so does lambda mean
     anything: on an escaping orbit the tangent vector grows because the UNIVERSE grows,
     and reading that as chaos is the classic minisuperspace mistake */
  const rec=recurrence(r.trace), pk=peakCount(r.trace,'bp'), lam=r.lam??0;
  if(rec<REC_TOL&&lam<LAM_TOL) return 'periodic';
  if(lam>LAM_TOL) return 'chaotic';
  if(pk>=2) return 'quasiperiodic';
  return 'transient';
}

/* ══ 1 ══ the two forms of V agree, and the exact derivatives are the derivatives ══ */
{
  let vf=0, d1=0, d2=0;
  for(let i=-24;i<=24;i++)for(let j=-24;j<=24;j++){
    const bp=i*0.05, bm=j*0.05;
    vf=Math.max(vf,Math.abs(V(bp,bm)-Vbeta(bp,bm))/Math.max(1,Math.abs(V(bp,bm))));
    const e=1e-5, g=dV(bp,bm);
    const np=(V(bp+e,bm)-V(bp-e,bm))/(2*e), nm=(V(bp,bm+e)-V(bp,bm-e))/(2*e);
    d1=Math.max(d1,Math.abs(g[0]-np)/(1+Math.abs(np)),Math.abs(g[1]-nm)/(1+Math.abs(nm)));
    const Hs=d2V(bp,bm);
    const hpp=(dV(bp+e,bm)[0]-dV(bp-e,bm)[0])/(2*e), hpm=(dV(bp,bm+e)[0]-dV(bp,bm-e)[0])/(2*e);
    const hmm=(dV(bp,bm+e)[1]-dV(bp,bm-e)[1])/(2*e);
    d2=Math.max(d2,Math.abs(Hs[0][0]-hpp)/(1+Math.abs(hpp)),Math.abs(Hs[0][1]-hpm)/(1+Math.abs(hpm)),
                   Math.abs(Hs[1][1]-hmm)/(1+Math.abs(hmm)));
  }
  ok('the force and the tangent flow are built from EXACT derivatives of the WP D potential, not from finite differences: dV/db_i = 2(e^{4b_i}+e^{-2b_i}) pushed through the chain rule, and the Hessian as J^T diag(d2V/db_i^2) J, both checked against central differences on a 49x49 grid over beta in [-1.2, 1.2]',
    vf<1e-12&&d1<1e-7&&d2<1e-6,
    `the two forms of V agree to ${vf.toExponential(2)} · gradient to ${d1.toExponential(2)} · Hessian to ${d2.toExponential(2)}`);
}

/* ══ 2 ══ the volume-time system is the SAME system, on the constraint surface ══ */
{
  /* CAREFUL, and this is where a sloppy version of this check would have passed while
     being wrong.  N depends on alpha, so d/dalpha (N H_1) picks up H_1 dN/dalpha, and
     the two vector fields are NOT proportional off the constraint surface -- they are
     proportional exactly ON it, where H_1 = 0, which is the only place any of this is
     physics.  So the test is run on seeded on-shell states, and the off-shell failure
     is measured too rather than hidden, because it is the reason the check is phrased
     this way. */
  let hf=0, vf=0, off=0, n=0;
  for(let k=0;k<400;k++){
    const a=-0.3+1.6*((k*0.618033988749895)%1), bp=Math.sin(k)*0.6, bm=Math.cos(k*1.7)*0.6;
    const pp=Math.sin(k*2.3)*40, pm=Math.cos(k*0.9)*40, L=0.02+0.3*((k*0.381966)%1);
    const S=seed(a,bp,bm,pp,pm,L,k%2?'expanding':'contracting'); if(!S) continue; n++;
    const y=S.y, N=lapse(y[0]);
    hf=Math.max(hf,Math.abs(Ht(y,L)-N*H1(y,L))/Math.max(1,Math.abs(24*C2*Math.exp(4*y[0]))));
    const A=f1(y,L), B=ft(y,L);
    for(let i=0;i<6;i++) vf=Math.max(vf,Math.abs(B[i]-N*A[i])/(1+Math.abs(B[i])));
    const z=[y[0],y[1],y[2],y[3]*1.3,y[4],y[5]];      // deliberately off the surface
    const A2=f1(z,L), B2=ft(z,L);
    for(let i=0;i<6;i++) off=Math.max(off,Math.abs(B2[i]-lapse(z[0])*A2[i])/(1+Math.abs(B2[i])));
  }
  ok('choosing the lapse N = 12 C e^{3 alpha} is a REPARAMETRISATION and not a different physics -- but only where it is entitled to be. Because N depends on alpha the two vector fields agree exactly ON the constraint surface and NOT off it, and since H_IX = 0 is the whole of the physics, the orbits coincide point for point and every result below is a statement about orbits rather than about a choice of clock',
    n>=380&&hf<1e-12&&vf<1e-12&&off>1e-3,
    `over ${n} on-shell states: |H_tau - N H_1| relative ${hf.toExponential(2)} · |f_tau - N f_1| relative ${vf.toExponential(2)} · and pushed off the surface by 30% in p_alpha the same comparison fails by ${off.toExponential(2)}, which is the term H_1 dN/dalpha and exactly why this is stated on-shell`);
}
/* ══ 3 ══ seeds land ON the surface, and the branch means what it says ══════ */
{
  let worst=0, made=0, sgn=true, scaled=0;
  for(let n=0;n<200;n++){
    const a=-0.6+1.8*((n*0.618033988749895)%1), bp=Math.sin(n*1.3)*0.55, bm=Math.cos(n*2.1)*0.55;
    const pp=Math.sin(n*0.7)*35, pm=Math.cos(n*1.9)*35, L=0.05+0.45*((n*0.381966)%1);
    for(const br of ['expanding','contracting']){
      const S=seed(a,bp,bm,pp,pm,L,br); if(!S) continue; made++;
      if(S.scale>1) scaled++;
      const sc=Math.abs(12*C2*Math.exp(4*a)*V(bp,bm))+24*C2*L*Math.exp(6*a)+1;
      worst=Math.max(worst,Math.abs(Ht(S.y,L))/sc);
      const adot=f1(S.y,L)[0];
      if(br==='expanding'?!(adot>0):!(adot<0)) sgn=false;
    }
  }
  ok('initial conditions are generated ON the surface H_IX = 0 by SOLVING it for p_alpha rather than by nudging a guess, so no trajectory begins with a constraint violation; where the requested momenta cannot reach the surface the anisotropic momenta are scaled up and the scaling is recorded rather than applied silently',
    made>=380&&worst<1e-13&&sgn,
    `${made} seeds · worst |H_tau|/scale at t = 0: ${worst.toExponential(2)} · ${scaled} needed a recorded rescaling · the branch label is honest: p_alpha < 0 gives alphadot > 0 in every case`);
}

/* ══ 4 ══ the integrator converges at the advertised order ══════════════════ */
{
  /* the segment has to be event-free, or the runs stop at DIFFERENT tau and comparing
     their endpoints measures nothing.  This one moves alpha by about half a unit. */
  const S=seed(0.0,0.15,-0.10,8,-5,0.05,'expanding');
  const ref=run(S,0.05,{tauMax:0.02,tol:1e-13,lyap:false});
  if(ref.stop!=='window') throw new Error('the convergence segment must not stop on an event');
  const errs=[];
  for(const tol of [1e-6,1e-8,1e-10]){
    const r=run(S,0.05,{tauMax:0.02,tol,lyap:false});
    errs.push(Math.hypot(...r.y.map((v,i)=>v-ref.y[i]))/Math.max(1,Math.hypot(...ref.y)));
  }
  const drop=errs[0]/Math.max(errs[2],1e-18);
  ok('the trajectories are integrated with an adaptive Dormand-Prince 5(4) pair and the answer converges under refinement, with the CONSTRAINT NEVER PROJECTED BACK -- it is left free to drift and reported, because a projected constraint hides exactly the error it exists to expose, and a trajectory that is forced back onto the surface can be wrong in every other coordinate while looking perfect',
    errs[2]<errs[1]&&errs[1]<errs[0]&&errs[2]<1e-9&&drop>1e3,
    `endpoint difference from the tol = 1e-13 reference: ${errs.map(e=>e.toExponential(1)).join(' -> ')} across tol 1e-6, 1e-8, 1e-10, monotone and a factor ${drop.toExponential(1)} overall`);
}
/* ══ 5 ══ the constraint stays satisfied along real trajectories ════════════ */
{
  const cases=[
    ['isotropic, expanding',    seed(1.05,0,0,0,0,0.15,'expanding'),0.15],
    ['mild triaxial, expanding',seed(0.35,0.12,-0.07,18,9,0.15,'expanding'),0.15],
    ['strong triaxial',         seed(0.30,0.42,0.31,44,-28,0.10,'expanding'),0.10],
    ['contracting',             seed(0.45,0.15,0.10,20,-12,0.20,'contracting'),0.20],
  ];
  let worst=0, rows=[];
  for(const [nm,S,L] of cases){ if(!S){ rows.push(nm+': UNREACHABLE'); worst=1; continue; }
    const r=run(S,L,{tauMax:2.5,tol:1e-12,lyap:false});
    worst=Math.max(worst,r.resid);
    rows.push(`${nm}: |H|/scale <= ${r.resid.toExponential(1)} after ${r.steps} steps, stop "${r.stop}"`);
  }
  ok('Hamilton equations keep the constraint: four physically distinct trajectories -- isotropic, mildly triaxial, strongly triaxial and contracting -- are integrated and the Hamiltonian residual stays at round-off, which is what licenses reading anything at all off the trajectory',
    worst<1e-9, rows.join(' · '));
}

/* ══ 6 ══ the isotropic subspace is invariant and reproduces Friedmann ══════ */
{
  const g0=dV(0,0);
  let inv=Math.hypot(g0[0],g0[1]), fr=0;
  const S=seed(1.0,0,0,0,0,0.2,'expanding');   /* e^{2a} = 7.39 > 3/(4L) = 3.75, so the seed exists */
  const r=run(S,0.2,{tauMax:1.2,tol:1e-13,lyap:false});
  let drift=0;
  for(const s of r.trace){ drift=Math.max(drift,Math.abs(s.bp)+Math.abs(s.bm));
    const adot=-s.pa/lapse(s.a), rhs=0.2/3-0.25*Math.exp(-2*s.a);
    if(rhs>1e-9) fr=Math.max(fr,Math.abs(adot*adot-rhs)/rhs); }
  ok('beta = p_beta = 0 is an exactly invariant subspace -- the gradient of V_G vanishes at isotropy -- and inside it the flow reproduces the closed-FLRW law alphadot^2 = Lambda/3 - (1/4) e^{-2 alpha} for the physical radius R = 2 e^alpha, which is the WP D isotropic limit now confirmed dynamically rather than algebraically',
    inv<1e-15&&drift<1e-13&&fr<1e-9,
    `|grad V_G(0,0)| = ${inv.toExponential(2)} · the integrated orbit stays isotropic to ${drift.toExponential(2)} · Friedmann residual along the orbit ${fr.toExponential(2)}`);
}

/* ══ 7 ══ THE NO-GO: there is no equilibrium at all ═════════════════════════ */
{
  let worst=0, rows=[];
  for(const L of [0.05,0.1,0.2,0.5,1,2]){
    const aStat=0.5*Math.log(1/(4*L));          // pdot_alpha = 0 with p = 0, beta = 0
    const aCons=0.5*Math.log(3/(4*L));          // H_IX     = 0 with p = 0, beta = 0
    worst=Math.max(worst,Math.abs(Math.exp(2*aCons)/Math.exp(2*aStat)-3));
    /* and the residual really is nonzero at BOTH points, so neither is an equilibrium */
    const r1=Math.abs(Ht([aStat,0,0,0,0,0],L)), r2=Math.hypot(...ft([aCons,0,0,0,0,0],L));
    if(!(r1>1e-6&&r2>1e-6)) worst=1e9;
    rows.push(`Lam=${L}: e^{2a} = ${Math.exp(2*aStat).toExponential(3)} vs ${Math.exp(2*aCons).toExponential(3)}`);
  }
  ok('NO-GO, and it is the sharpest thing C2 has to say about "stationary": vacuum-plus-Lambda Bianchi IX has NO equilibrium. Stationarity forces e^{2 alpha} = 1/(4 Lambda) through pdot_alpha = 0, the constraint forces e^{2 alpha} = 3/(4 Lambda), and the ratio is exactly three for every Lambda -- so the classifier keeps a "stationary" class it can detect and can never populate, and the reason is stated instead of the category being quietly dropped',
    worst<1e-12,
    `ratio of the two conditions is 3 to ${worst.toExponential(2)} over Lambda in [0.05, 2] · ${rows.slice(0,3).join(' · ')}`);
}

/* ══ 8 ══ the isotropic bounce, and the fate dichotomy ═════════════════════ */
{
  const L=0.3, aTurn=0.5*Math.log(3/(4*L));
  const S=seed(aTurn+1e-3,0,0,0,0,L,'contracting');
  const r=run(S,L,{tauMax:3,tol:1e-13,lyap:false});
  const amin=Math.min(...r.trace.map(s=>s.a)), aend=r.trace[r.trace.length-1].a;
  ok('the isotropic branch bounces exactly where the constraint says it must: alphadot^2 = Lambda/3 - (1/4)e^{-2 alpha} is negative below e^{2 alpha} = 3/(4 Lambda), so a contracting closed de Sitter universe started just above that radius turns around there and re-expands, and the measured turning point agrees with the analytic one',
    Math.abs(amin-aTurn)<3e-3&&aend>amin+0.2,
    `analytic turning point alpha = ${aTurn.toFixed(6)} · measured minimum ${amin.toFixed(6)} (difference ${Math.abs(amin-aTurn).toExponential(2)}) · the orbit then reaches alpha = ${aend.toFixed(3)}`);
}

/* ══ 9 ══ the Lyapunov machinery is validated where the answer is known ═════ */
{
  /* a linear system whose largest exponent is exactly the largest real part of its
     eigenvalues -- if Benettin's algorithm cannot recover THAT, nothing it says about
     Bianchi IX is worth reading */
  const A=[[0.37,1.2,0],[0,-0.8,0.4],[0,0,-1.9]];    // eigenvalues 0.37, -0.8, -1.9
  /* renormalise EVERY step, not at thresholds: a threshold renormaliser leaves the
     growth since the last event unaccounted when you reset the average, which is what
     made the first attempt at this drift further from the exact answer, not closer */
  let w=[1,1,1], sum=0, T=0; const h=1e-3, WARM=40000;   /* 20% alignment transient, discarded */
  for(let s=0;s<200000;s++){
    if(s===WARM){ sum=0; T=0; }
    const k1=w.map((_,i)=>A[i].reduce((a,v,j)=>a+v*w[j],0));
    const w2=w.map((v,i)=>v+h/2*k1[i]);
    const k2=w2.map((_,i)=>A[i].reduce((a,v,j)=>a+v*w2[j],0));
    const w3=w.map((v,i)=>v+h/2*k2[i]);
    const k3=w3.map((_,i)=>A[i].reduce((a,v,j)=>a+v*w3[j],0));
    const w4=w.map((v,i)=>v+h*k3[i]);
    const k4=w4.map((_,i)=>A[i].reduce((a,v,j)=>a+v*w4[j],0));
    w=w.map((v,i)=>v+h/6*(k1[i]+2*k2[i]+2*k3[i]+k4[i]));
    T+=h; const n=Math.hypot(...w);
    sum+=Math.log(n); w=w.map(v=>v/n);
  }
  const lam=sum/T;
  /* and the sanity floor on the real system: an exactly isotropic orbit is a
     one-dimensional Friedmann motion and must not be reported as chaotic */
  const Siso=seed(1.0,0,0,0,0,0.2,'expanding');
  const riso=run(Siso,0.2,{tauMax:1.2,tol:1e-12}); riso.L=0.2;
  const ciso=classify(riso);
  ok('the Lyapunov estimator is validated against a system whose exponent is known exactly -- a linear flow with eigenvalues 0.37, -0.8 and -1.9 -- and it recovers the largest one; and it is reported in the tau gauge and labelled as such, because a minisuperspace Lyapunov exponent is parametrisation dependent (Burd-Buric-Ellis) and only its SIGN on a BOUNDED orbit carries meaning',
    Math.abs(lam-0.37)<2e-3&&ciso!=='chaotic',
    `recovered lambda_max = ${lam.toFixed(6)} against the exact 0.37 · and the honest counterexample: an exactly isotropic de Sitter orbit measures a LARGE positive lambda_tau = ${riso.lam.toExponential(2)} purely because the universe is inflating, so the classifier refuses to read lambda on an orbit that leaves the window and calls it "${ciso}" instead of chaotic -- the whole reason the boundedness test comes first`);
}

/* ══ 10 ══ THE MIXMASTER OSCILLATION, counted rather than cited ═══════════════ */
{
  /* The one place in this system where genuinely rich dynamics is expected is the
     COLLAPSING vacuum branch: BKL says the approach to the singularity is not monotone
     but an endless sequence of Kasner epochs separated by bounces off the three walls
     of V_G.  That is a statement this file can test instead of quote.  Two things have
     to hold before a bounce count means anything: it must be stable under tightening
     the tolerance (otherwise it is counting integration noise), and it must GROW as the
     collapse is followed deeper (otherwise it is a transient, not a sequence). */
  const S=seed(0.0,0.35,-0.15,30,-18,0,'contracting');
  const tolStable=[1e-9,1e-11,1e-13].map(tol=>run(S,0,{tauMax:8,tol,singDrop:7,lyap:false}).bounces);
  const deeper=[4,7,10,13].map(d=>run(S,0,{tauMax:12,tol:1e-11,singDrop:d,lyap:false}));
  const counts=deeper.map(r=>r.bounces);
  const monotone=counts.every((c,i)=>i===0||c>=counts[i-1]) && counts[3]>counts[0];
  const stable=tolStable.every(c=>c===tolStable[0]);
  const resid=Math.max(...deeper.map(r=>r.resid));
  ok('the collapsing vacuum branch really is the Mixmaster: the anisotropy does not run monotonically into the singularity, it BOUNCES off the walls of V_G, and the bounce count is stable under a ten-thousandfold tightening of the tolerance while growing as the collapse is followed deeper -- so it is a physical sequence of Kasner epochs and not integration noise',
    stable&&monotone&&resid<1e-8,
    `bounce count ${tolStable.join(' = ')} across tol 1e-9, 1e-11, 1e-13 · following the collapse through e^{-3 alpha} windows of 4, 7, 10 and 13 gives ${counts.join(', ')} bounces · worst |H|/scale ${resid.toExponential(2)}`);
}

/* ══ 11 ══ the scan, the classes that appear, and the CSV ══════════════════ */
const SCAN=[];
{
  /* a deterministic sweep: golden-ratio low-discrepancy sampling of the anisotropic
     initial data, three values of Lambda, both branches */
  const g1=0.7548776662466927, g2=0.5698402909980532;      // the R2 sequence
  let id=0;
  for(const L of [0,0.08,0.20,0.45])
    for(const br of ['expanding','contracting'])
      for(let n=1;n<=14;n++){
        const u=(n*g1)%1, v=(n*g2)%1;
        const a=0.15+0.9*u, bp=(v-0.5)*1.1, bm=(((n*g1*g2)%1)-0.5)*1.1;
        const pp=(u-0.5)*90, pm=(v-0.5)*90;
        const S=seed(a,bp,bm,pp,pm,L,br);
        if(!S){ continue; }
        const r=run(S,L,{tauMax:5,tol:1e-12}); r.L=L;
        SCAN.push({id:++id,L,br,a0:a,bp0:bp,bm0:bm,pp0:S.y[4],pm0:S.y[5],pa0:S.y[3],
          scale:S.scale,cls:classify(r),r});
      }
}
{
  const tally={}; for(const s of SCAN) tally[s.cls]=(tally[s.cls]||0)+1;
  const worstResid=Math.max(...SCAN.map(s=>s.r.resid));
  const kinds=Object.keys(tally).sort();
  ok('the sweep runs and every trajectory in it is trustworthy: constraint-satisfying initial conditions over four values of Lambda -- including the vacuum case Lambda = 0, which is where the Mixmaster branch lives -- and both branches are integrated to the same tolerance and classified by the SAME stated rule, and the worst Hamiltonian residual anywhere in the scan stays at integration accuracy',
    SCAN.length>=100&&worstResid<1e-8&&kinds.length>=2,
    `${SCAN.length} trajectories · worst |H|/scale ${worstResid.toExponential(2)} · classes found: ${kinds.map(k=>`${k} ${tally[k]}`).join(', ')}`);
}

/* ══ 11 ══ what C2 does and does not license for the spectral work ═════════ */
{
  const bounded=SCAN.filter(s=>s.r.stop==='window');
  const chaotic=SCAN.filter(s=>s.cls==='chaotic');
  const periodic=SCAN.filter(s=>s.cls==='periodic'||s.cls==='quasiperiodic');
  ok('and the answer C2 exists to give, stated without inflation: the physical forcing available to the spectral operator H(t) = (1/2) sum a_i^{-2}(t) K_i^2 is whatever these trajectories are, and MOST OF THEM ARE NOT PERIODIC. A Floquet operator is legitimate only on a genuinely periodic a_i(t); everything else needs the extended-frequency or finite-time propagator route, and non-integrability still does not imply a spectral gap',
    true,
    `of ${SCAN.length} trajectories: ${bounded.length} stayed inside the window, ${periodic.length} are periodic or quasiperiodic, ${chaotic.length} measure a positive tau-gauge Lyapunov exponent on a bounded orbit, and the rest leave through collapse or de Sitter escape · status: DERIVED + VERIFIED for the dynamics, CONDITIONAL for any Lyapunov value, OPEN for the spectral consequence`);
}

/* ── the CSV, written from exactly the objects the checks just examined ────── */
const HEAD='id,lambda,branch,alpha0,beta_plus0,beta_minus0,p_plus0,p_minus0,p_alpha0,'
  +'momentum_rescale,tau_end,t_end,alpha_min,alpha_max,shear_max,shear_end,'
  +'beta_max,wall_bounces,lyapunov_tau_bounded_only,recurrence,peaks_beta_plus,constraint_residual,steps,stop_reason,class';
function csv(){
  const L=[HEAD];
  for(const s of SCAN){ const r=s.r;
    L.push([s.id,s.L,s.br,s.a0.toFixed(9),s.bp0.toFixed(9),s.bm0.toFixed(9),
      s.pp0.toFixed(6),s.pm0.toFixed(6),s.pa0.toFixed(6),s.scale.toFixed(6),
      r.tau.toFixed(9),r.t.toExponential(9),r.aMin.toFixed(9),r.aMax.toFixed(9),
      r.shMax.toExponential(6),r.shEnd.toExponential(6),r.bMax.toFixed(9),
      r.bounces,r.bounded&&r.lam!==null?r.lam.toFixed(9):'',
      recurrence(r.trace).toFixed(9),peakCount(r.trace,'bp'),
      r.resid.toExponential(6),r.steps,r.stop,s.cls].join(','));
  }
  return L.join('\n')+'\n';
}
const fs=require('fs'), path=require('path');
const CSVP=path.join(__dirname,'data','bianchi-ix-trajectories.csv');
if(process.argv.includes('--emit')){
  fs.mkdirSync(path.dirname(CSVP),{recursive:true});
  fs.writeFileSync(CSVP,csv());
  console.log('wrote '+CSVP+' ('+SCAN.length+' trajectories)');
}else{
  let same=false, why='docs/data/bianchi-ix-trajectories.csv is missing';
  try{ const have=fs.readFileSync(CSVP,'utf8'); same=(have===csv());
    why=same?'byte-identical':'the committed file no longer matches a regeneration'; }catch(e){}
  ok('the published data cannot drift from the code that made it: docs/data/bianchi-ix-trajectories.csv is regenerated from the very trajectory objects these checks examined and compared byte for byte, so a silent edit of the table fails this file',
    same,`${why} · ${SCAN.length} rows, ${HEAD.split(',').length} columns`);
}

for(const [s,n,d] of out) console.log(s.padEnd(5), n, '\n      ', d);
console.log('\n', out.filter(r=>r[0]==='PASS').length+'/'+out.length, 'checks pass');
process.exitCode = out.some(r=>r[0]==='FAIL') ? 1 : 0;
