/* ── WORK PACKAGE C1 · FLOQUET GAP BENCHMARK ──────────────────────────────────
   STATUS: MODEL (the driven biaxial ansatz) + VERIFIED (everything below).

   This is a TECHNICAL BENCHMARK, not a cosmological model.  A biaxial anisotropy is
   driven periodically,

     a1 = abar[1 + eps cos(omega t)],  a2 = abar[1 - eps cos(omega t)],  a3 = bbar,
     A_i = a_i^-2,

   and in a fixed (J, M) block the Hamiltonian is

     H = (1/4)(A1+A2)[J(J+1) - K3^2] + (1/2) A3 K3^2 + (1/8)(A1-A2)(K+^2 + K-^2).

   The last term moves K by +-2 ONLY.  That selection rule splits the J = 2 block into

     even K : { |0>, |S2>, |A2> }   with |S2>,|A2> = (|2> +- |-2>)/sqrt2
     odd  K : { |S1>, |A1> }        which the drive only shifts, never mixes with |0>

   and inside the even sector the drive connects |0> to |S2> and NOT to |A2>:
   |A2> is a DARK STATE.  So the correct statement is that a gap opens in the BRIGHT
   parity sector span{|0>, |S2>} — never that the whole J = 2 block is gapped.

   Benchmark: J = 2, abar = 1, bbar = 0.5, giving E_0 = 3, E_{+-2} = 9, Delta E = 6 and
   a one-photon resonance at omega = 6.

   Nothing here reads the atlas. */
const out=[]; const ok=(n,c,d)=>out.push([c?'PASS':'FAIL',n,d]);

/* ── minimal complex dense linear algebra (5x5 is plenty) ─────────────────── */
const N=5, Ks=[-2,-1,0,1,2];                       // basis order
const zeros=()=>({re:new Float64Array(N*N),im:new Float64Array(N*N)});
const eye=()=>{const M=zeros();for(let i=0;i<N;i++)M.re[i*N+i]=1;return M;};
function mm(A,B){ const C=zeros();
  for(let i=0;i<N;i++)for(let k=0;k<N;k++){
    const ar=A.re[i*N+k], ai=A.im[i*N+k];
    if(ar===0&&ai===0) continue;
    for(let j=0;j<N;j++){
      C.re[i*N+j]+=ar*B.re[k*N+j]-ai*B.im[k*N+j];
      C.im[i*N+j]+=ar*B.im[k*N+j]+ai*B.re[k*N+j]; } }
  return C; }
const axpy=(C,a,A)=>{for(let i=0;i<N*N;i++){C.re[i]+=a*A.re[i];C.im[i]+=a*A.im[i];}return C;};
const copy=A=>({re:Float64Array.from(A.re),im:Float64Array.from(A.im)});
const scal=(A,a)=>{const B=copy(A);for(let i=0;i<N*N;i++){B.re[i]*=a;B.im[i]*=a;}return B;};

/* ── the Hamiltonian, built from the stated formula ───────────────────────── */
const J=2, JJ=J*(J+1), abar=1, bbar=0.5;
const Kp=(K)=>Math.sqrt(JJ-K*(K+1));               // <K+1|K+|K>
function Hof(t,eps,omega){
  const c=Math.cos(omega*t);
  const a1=abar*(1+eps*c), a2=abar*(1-eps*c), a3=bbar;
  const A1=1/(a1*a1), A2=1/(a2*a2), A3=1/(a3*a3);
  const H=zeros();
  for(let i=0;i<N;i++){ const K=Ks[i];
    H.re[i*N+i]=0.25*(A1+A2)*(JJ-K*K)+0.5*A3*K*K; }
  const g=0.125*(A1-A2);
  for(let i=0;i<N;i++){ const K=Ks[i];
    /* K+^2 : |K> -> |K+2>  with amplitude Kp(K)Kp(K+1) */
    const j=Ks.indexOf(K+2);
    if(j>=0){ const v=g*Kp(K)*Kp(K+1); H.re[j*N+i]+=v; H.re[i*N+j]+=v; }
  }
  return H;
}
/* ── U(T) by RK4 on dU/dt = -i H U ────────────────────────────────────────── */
function propagator(eps,omega,steps){
  const T=2*Math.PI/omega, h=T/steps;
  let U=eye();
  const f=(t,U)=>{ const H=Hof(t,eps,omega), P=mm(H,U), R=zeros();
    for(let i=0;i<N*N;i++){ R.re[i]=P.im[i]; R.im[i]=-P.re[i]; }   // -i H U
    return R; };
  for(let s=0;s<steps;s++){
    const t=s*h;
    const k1=f(t,U);
    const k2=f(t+h/2,axpy(copy(U),h/2,k1));
    const k3=f(t+h/2,axpy(copy(U),h/2,k2));
    const k4=f(t+h,  axpy(copy(U),h,  k3));
    const Un=copy(U);
    axpy(Un,h/6,k1); axpy(Un,h/3,k2); axpy(Un,h/3,k3); axpy(Un,h/6,k4);
    U=Un;
  }
  return {U,T};
}
const unitarityResidual=U=>{ let s=0;
  for(let i=0;i<N;i++)for(let j=0;j<N;j++){
    let cr=0,ci=0;
    for(let k=0;k<N;k++){ const ar=U.re[k*N+i], ai=-U.im[k*N+i];   // (U^dag)_{ik}
      cr+=ar*U.re[k*N+j]-ai*U.im[k*N+j]; ci+=ar*U.im[k*N+j]+ai*U.re[k*N+j]; }
    if(i===j) cr-=1;
    s+=cr*cr+ci*ci; }
  return Math.sqrt(s); };

/* ── eigen-decomposition of the unitary U by unshifted QR on the 2x2 bright block
      is not general enough, so use inverse iteration on (U - lambda) with lambdas
      found from the characteristic polynomial of the BRIGHT 2x2 subblock, plus a
      general power-free Jacobi-like sweep for the full matrix.  Simpler and exact
      enough here: U is unitary, so diagonalise the Hermitian pair (U+U^dag)/2 and
      (U-U^dag)/2i simultaneously via the Hermitian matrix G = (U+U^dag)/2 when its
      spectrum is non-degenerate, and read the phase from <v|U|v>. */
function hermitianEig(A){ /* cyclic Jacobi for a complex Hermitian NxN */
  let H={re:Float64Array.from(A.re),im:Float64Array.from(A.im)};
  let V=eye();
  for(let sweep=0;sweep<60;sweep++){
    let off=0;
    for(let p=0;p<N;p++)for(let q=p+1;q<N;q++) off+=H.re[p*N+q]**2+H.im[p*N+q]**2;
    if(off<1e-30) break;
    for(let p=0;p<N;p++)for(let q=p+1;q<N;q++){
      const ar=H.re[p*N+q], ai=H.im[p*N+q];
      const abs=Math.hypot(ar,ai); if(abs<1e-18) continue;
      const app=H.re[p*N+p], aqq=H.re[q*N+q];
      const theta=0.5*Math.atan2(2*abs,app-aqq);
      const cs=Math.cos(theta), sn=Math.sin(theta);
      const pr=ar/abs, pi=ai/abs;                     // phase of H_pq
      /* rotation:  p' = cs p + sn e^{i phase} q ;  q' = -sn e^{-i phase} p + cs q */
      for(let k=0;k<N;k++){
        const hpr=H.re[p*N+k], hpi=H.im[p*N+k], hqr=H.re[q*N+k], hqi=H.im[q*N+k];
        H.re[p*N+k]= cs*hpr+sn*(pr*hqr-pi*hqi); H.im[p*N+k]= cs*hpi+sn*(pr*hqi+pi*hqr);
        H.re[q*N+k]=-sn*(pr*hpr+pi*hpi)+cs*hqr; H.im[q*N+k]=-sn*(pr*hpi-pi*hpr)+cs*hqi;
      }
      for(let k=0;k<N;k++){
        const hkp=H.re[k*N+p], hkpi=H.im[k*N+p], hkq=H.re[k*N+q], hkqi=H.im[k*N+q];
        H.re[k*N+p]= cs*hkp+sn*(pr*hkq+pi*hkqi); H.im[k*N+p]= cs*hkpi+sn*(pr*hkqi-pi*hkq);
        H.re[k*N+q]=-sn*(pr*hkp-pi*hkpi)+cs*hkq; H.im[k*N+q]=-sn*(pr*hkpi+pi*hkp)+cs*hkqi;
        const vkp=V.re[k*N+p], vkpi=V.im[k*N+p], vkq=V.re[k*N+q], vkqi=V.im[k*N+q];
        V.re[k*N+p]= cs*vkp+sn*(pr*vkq+pi*vkqi); V.im[k*N+p]= cs*vkpi+sn*(pr*vkqi-pi*vkq);
        V.re[k*N+q]=-sn*(pr*vkp-pi*vkpi)+cs*vkq; V.im[k*N+q]=-sn*(pr*vkpi+pi*vkp)+cs*vkqi;
      }
    }
  }
  const w=[]; for(let i=0;i<N;i++) w.push(H.re[i*N+i]);
  return {w,V};
}
/* quasi-energies of U with their eigenvectors, via the Hermitian G = (U+U^dag)/2 */
function floquet(U,T){
  const G=zeros();
  for(let i=0;i<N;i++)for(let j=0;j<N;j++){
    G.re[i*N+j]=0.5*(U.re[i*N+j]+U.re[j*N+i]);
    G.im[i*N+j]=0.5*(U.im[i*N+j]-U.im[j*N+i]); }
  const {V}=hermitianEig(G);
  const res=[];
  for(let c=0;c<N;c++){
    const v={re:new Float64Array(N),im:new Float64Array(N)};
    for(let k=0;k<N;k++){ v.re[k]=V.re[k*N+c]; v.im[k]=V.im[k*N+c]; }
    /* <v|U|v> gives e^{-i eps T} for an eigenvector */
    let ur=0,ui=0;
    for(let i=0;i<N;i++){ let sr=0,si=0;
      for(let j=0;j<N;j++){ sr+=U.re[i*N+j]*v.re[j]-U.im[i*N+j]*v.im[j];
                            si+=U.re[i*N+j]*v.im[j]+U.im[i*N+j]*v.re[j]; }
      ur+=v.re[i]*sr+v.im[i]*si; ui+=v.re[i]*si-v.im[i]*sr; }
    const phase=Math.atan2(ui,ur);
    res.push({eps:-phase/T, v, weight:{}});
  }
  return res;
}
const overlap=(a,b)=>{ let r=0,i=0;
  for(let k=0;k<N;k++){ r+=a.re[k]*b.re[k]+a.im[k]*b.im[k]; i+=a.re[k]*b.im[k]-a.im[k]*b.re[k]; }
  return Math.hypot(r,i); };

/* the bright / dark basis vectors */
const ket=K=>{const v={re:new Float64Array(N),im:new Float64Array(N)};v.re[Ks.indexOf(K)]=1;return v;};
const mix=(a,b,s)=>{const v={re:new Float64Array(N),im:new Float64Array(N)};
  v.re[Ks.indexOf(a)]=Math.SQRT1_2; v.re[Ks.indexOf(b)]=s*Math.SQRT1_2; return v;};
const K0=ket(0), S2=mix(2,-2,+1), A2=mix(2,-2,-1);

/* ── 1 · the unperturbed spectrum and the selection rule ──────────────────── */
{
  const H=Hof(0,0,6);
  const e=[]; for(let i=0;i<N;i++) e.push(H.re[i*N+i]);
  let offd=0; for(let i=0;i<N;i++)for(let j=0;j<N;j++) if(i!==j) offd=Math.max(offd,Math.abs(H.re[i*N+j]));
  ok('the unperturbed benchmark spectrum is E_0 = 3 and E_{+-2} = 9, so Delta E = 6 and the one-photon resonance sits at omega = 6',
    Math.abs(e[Ks.indexOf(0)]-3)<1e-14 && Math.abs(e[Ks.indexOf(2)]-9)<1e-14 &&
    Math.abs(e[Ks.indexOf(-2)]-9)<1e-14 && offd<1e-15,
    `E(K=0) = ${e[Ks.indexOf(0)]} · E(K=+-2) = ${e[Ks.indexOf(2)]} · Delta E = ${e[Ks.indexOf(2)]-e[Ks.indexOf(0)]} · off-diagonal at eps = 0: ${offd}`);
}
/* ── 2 · the dark state, checked at the level of the coupling ─────────────── */
{
  let worstDark=0, brightMin=Infinity;
  for(const t of [0,0.13,0.41,0.77,1.31]){
    const H=Hof(t,0.05,6);
    const app=(M,v)=>{const w={re:new Float64Array(N),im:new Float64Array(N)};
      for(let i=0;i<N;i++)for(let j=0;j<N;j++){ w.re[i]+=M.re[i*N+j]*v.re[j]; w.im[i]+=M.re[i*N+j]*v.im[j]; }
      return w;};
    const HK0=app(H,K0);
    let dr=0,di=0,br=0;
    for(let k=0;k<N;k++){ dr+=A2.re[k]*HK0.re[k]; di+=A2.re[k]*HK0.im[k]; br+=S2.re[k]*HK0.re[k]; }
    worstDark=Math.max(worstDark,Math.hypot(dr,di));
    if(Math.abs(Math.cos(6*t))>0.2) brightMin=Math.min(brightMin,Math.abs(br));
  }
  ok('|A2> is a DARK state of the drive and |S2> is the bright one: the K+-2 selection rule connects |0> only to the SYMMETRIC combination, so <A2|H|0> vanishes identically while <S2|H|0> does not',
    worstDark<1e-12 && brightMin>1e-3,
    `max |<A2|H|0>| over five times = ${worstDark.toExponential(2)} · min |<S2|H|0>| away from the node = ${brightMin.toExponential(3)}`);
}
/* ── 3 · unitarity of the propagator ──────────────────────────────────────── */
{
  let worst=0, rows=[];
  for(const [eps,om,st] of [[0.02,6,4000],[0.08,6,6000],[0.05,5.7,6000],[0.05,6.3,6000]]){
    const {U}=propagator(eps,om,st);
    const r=unitarityResidual(U); worst=Math.max(worst,r);
    rows.push(`eps=${eps} omega=${om}: ${r.toExponential(2)}`);
  }
  ok('the one-period propagator is unitary to the stated tolerance, which is the precondition for calling its eigenphases quasi-energies at all',
    worst<1e-10, `max |U^dag U - I|_F = ${worst.toExponential(2)} · ${rows.join(' · ')}`);
}
/* ── 4 · the gap at resonance, and its small-amplitude law ────────────────── */
function brightGap(eps,omega,steps){
  const {U,T}=propagator(eps,omega,steps);
  const F=floquet(U,T);
  /* BRANCH TRACKING BY OVERLAP, not by sorting quasi-energies: pick the two Floquet
     states with the largest weight in the bright sector span{|0>,|S2>} */
  const scored=F.map(f=>({...f, w:overlap(f.v,K0)**2+overlap(f.v,S2)**2}));
  scored.sort((a,b)=>b.w-a.w);
  const [p,q]=scored;
  /* ZONE LIFTING: quasi-energies live on a circle of circumference omega, so the gap
     is the distance modulo omega, taken into the fundamental zone (-omega/2, omega/2] */
  let d=p.eps-q.eps;
  d=d-omega*Math.round(d/omega);
  return {gap:Math.abs(d), brightWeight:p.w+q.w, U};
}
{
  const th=eps=>2*Math.sqrt(3)*eps;
  let worst=0, rows=[];
  for(const eps of [0.005,0.01,0.02,0.04]){
    const g=brightGap(eps,6,8000).gap;
    worst=Math.max(worst,Math.abs(g-th(eps))/th(eps));
    rows.push(`eps=${eps}: gap ${g.toFixed(8)} vs 2sqrt3 eps = ${th(eps).toFixed(8)}`);
  }
  ok('at resonance the bright-sector gap follows the small-amplitude law Delta eps = 2 sqrt3 eps + O(eps^2), recovered from the propagator rather than from perturbation theory',
    worst<0.02, `worst relative deviation ${(100*worst).toFixed(2)}% · ${rows.join(' · ')}`);
}
/* ── 5 · the detuning scan and the hyperbolic law ─────────────────────────── */
{
  const eps=0.02, DE=6, rows=[], data=[];
  let gmin=Infinity, wmin=0;
  for(let i=0;i<=40;i++){
    const om=5.5+i*(1.0/40);
    const g=brightGap(eps,om,8000).gap;
    data.push([om,g]);
    if(g<gmin){gmin=g;wmin=om;}
  }
  /* fit Delta eps(omega) = sqrt((DE-omega)^2 + gmin^2) and compare */
  let worst=0;
  for(const [om,g] of data){
    const pred=Math.hypot(DE-om,gmin);
    worst=Math.max(worst,Math.abs(g-pred)/Math.max(pred,1e-9));
  }
  ok('the detuning scan shows a genuine AVOIDED CROSSING in the bright sector: the gap follows sqrt((Delta E - omega)^2 + Delta eps_min^2) across omega in [5.5, 6.5], with its minimum at the resonance and NOT at the edges — a crossing that is avoided, not a level ordering artefact',
    worst<0.05 && Math.abs(wmin-DE)<0.03 && gmin>0,
    `minimum gap ${gmin.toFixed(8)} at omega = ${wmin.toFixed(4)} (Delta E = 6) · worst deviation from the hyperbola ${(100*worst).toFixed(2)}% over 41 points`);
  /* and the minimum gap must itself be the resonant Rabi value */
  ok('… and the minimum of that hyperbola IS the resonant gap 2 sqrt3 eps, so the two independent measurements — the amplitude law and the detuning law — agree',
    Math.abs(gmin-2*Math.sqrt(3)*eps)/(2*Math.sqrt(3)*eps)<0.03,
    `gap_min = ${gmin.toFixed(8)} · 2 sqrt3 eps = ${(2*Math.sqrt(3)*eps).toFixed(8)}`);
  /* CSV for the atlas */
  const fs=require('fs'), path=require('path');
  const dir=path.join(__dirname,'data'); fs.mkdirSync(dir,{recursive:true});
  fs.writeFileSync(path.join(dir,'floquet-detuning-scan.csv'),
    'omega,gap,hyperbola_prediction\n'+data.map(([o,g])=>`${o.toFixed(6)},${g.toExponential(9)},${Math.hypot(DE-o,gmin).toExponential(9)}`).join('\n')+'\n');
}
/* ── 6 · the dark state stays dark in the FLOQUET spectrum ────────────────── */
{
  const {U,T}=propagator(0.04,6,8000);
  const F=floquet(U,T);
  let best=0;
  for(const f of F) best=Math.max(best,overlap(f.v,A2));
  /* one Floquet state must be the dark state to machine precision */
  ok('the dark state survives as an EXACT Floquet state: one eigenvector of the one-period propagator is |A2> itself, so the gap belongs to the bright sector and calling it a gap of the whole J = 2 block would be wrong',
    best>1-1e-9,
    `largest overlap of a Floquet state with |A2> = ${best.toFixed(12)}`);
}
for(const [s,n,d] of out) console.log(s.padEnd(5), n, '\n      ', d);
console.log('\n', out.filter(r=>r[0]==='PASS').length+'/'+out.length, 'checks pass');
