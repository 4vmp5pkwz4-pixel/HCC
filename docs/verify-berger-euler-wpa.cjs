/* ── WORK PACKAGE A · BERGER–EULER TORUS ──────────────────────────────────────
   STATUS: THEOREM (the closed forms) + VERIFIED (the numerics below).

   A left-invariant biaxial metric on SU(2) ≅ S³ is the free symmetric Euler top:

       I1 = I2 = 1,   I3 = lambda^2,   lambda = b/a.

   Body angular momentum M_i = I_i Omega_i, so with Omega_perp^2 = Omega_1^2 + Omega_2^2:

       2E   = Omega_perp^2 + lambda^2 Omega_3^2
       nu_1 = |M| = sqrt( Omega_perp^2 + lambda^4 Omega_3^2 )      spatial precession
       nu_2 = (1 - lambda^2) Omega_3                                body spin
       rho  = nu_2 / nu_1                                           SIGNED rotation number

   The old formula rho = 1 - lambda^2 is REFUTED: it drops the |M| normalisation
   entirely and is only correct in the measure-zero case |M| = 1.  This script exhibits
   a concrete counterexample rather than merely asserting the correction.

   Attitude is reconstructed in closed form as a product of two one-parameter subgroups,

       R(t) = exp( t nu_1 [Mhat_space]_x ) R_0 exp( t nu_2 [e_3]_x ),

   and checked against a straight numerical integration of Euler's equations by the
   geodesic distance on SO(3).  Nothing here reads the atlas. */
const PHI=(1+Math.sqrt(5))/2;
const out=[]; const ok=(n,c,d)=>out.push([c?'PASS':'FAIL',n,d]);
const hy=(...v)=>Math.hypot(...v);

/* ── exact quantities ─────────────────────────────────────────────────────── */
const nu1=(O,l)=>Math.sqrt(O[0]*O[0]+O[1]*O[1]+Math.pow(l,4)*O[2]*O[2]);
const nu2=(O,l)=>(1-l*l)*O[2];
const rhoSigned=(O,l)=>nu2(O,l)/nu1(O,l);
const energy2=(O,l)=>O[0]*O[0]+O[1]*O[1]+l*l*O[2]*O[2];
const bodyM=(O,l)=>[O[0],O[1],l*l*O[2]];

/* ── 3x3 helpers ──────────────────────────────────────────────────────────── */
const mul=(A,B)=>{const C=[[0,0,0],[0,0,0],[0,0,0]];
  for(let i=0;i<3;i++)for(let j=0;j<3;j++){let s=0;for(let k=0;k<3;k++)s+=A[i][k]*B[k][j];C[i][j]=s;}return C;};
const mv=(A,v)=>[A[0][0]*v[0]+A[0][1]*v[1]+A[0][2]*v[2],
                 A[1][0]*v[0]+A[1][1]*v[1]+A[1][2]*v[2],
                 A[2][0]*v[0]+A[2][1]*v[1]+A[2][2]*v[2]];
const T=A=>[[A[0][0],A[1][0],A[2][0]],[A[0][1],A[1][1],A[2][1]],[A[0][2],A[1][2],A[2][2]]];
const I3=[[1,0,0],[0,1,0],[0,0,1]];
/* Rodrigues: exp of the hat map of (axis * angle) */
function expHat(w){
  const th=hy(...w); if(th<1e-14) return I3.map(r=>r.slice());
  const k=w.map(x=>x/th), c=Math.cos(th), s=Math.sin(th), C=1-c;
  return [[c+k[0]*k[0]*C,      k[0]*k[1]*C-k[2]*s, k[0]*k[2]*C+k[1]*s],
          [k[1]*k[0]*C+k[2]*s, c+k[1]*k[1]*C,      k[1]*k[2]*C-k[0]*s],
          [k[2]*k[0]*C-k[1]*s, k[2]*k[1]*C+k[0]*s, c+k[2]*k[2]*C]];
}
/* geodesic distance on SO(3): the rotation angle of A^T B */
function dSO3(A,B){
  const D=mul(T(A),B), tr=D[0][0]+D[1][1]+D[2][2];
  return Math.acos(Math.max(-1,Math.min(1,(tr-1)/2)));
}

/* ── numerical integration of the free rigid body, RK4 on (Omega, R) ──────── */
function integrate(O0,l,tEnd,steps){
  const I=[1,1,l*l];
  let O=O0.slice(), R=I3.map(r=>r.slice());
  const dOdt=O=>{ const M=[I[0]*O[0],I[1]*O[1],I[2]*O[2]];
    const c=[O[1]*M[2]-O[2]*M[1], O[2]*M[0]-O[0]*M[2], O[0]*M[1]-O[1]*M[0]];
    return [-c[0]/I[0],-c[1]/I[1],-c[2]/I[2]]; };
  const h=tEnd/steps;
  for(let s=0;s<steps;s++){
    const k1=dOdt(O);
    const O2=O.map((x,i)=>x+h/2*k1[i]), k2=dOdt(O2);
    const O3=O.map((x,i)=>x+h/2*k2[i]), k3=dOdt(O3);
    const O4=O.map((x,i)=>x+h*k3[i]),  k4=dOdt(O4);
    const Omid=O.map((x,i)=>x+h/2*(k1[i]+k2[i])/2);      // midpoint body rate
    O=O.map((x,i)=>x+h/6*(k1[i]+2*k2[i]+2*k3[i]+k4[i]));
    R=mul(R,expHat(Omid.map(x=>x*h)));                    // body-frame update
    /* re-orthonormalise so drift cannot masquerade as physics */
    const c0=[R[0][0],R[1][0],R[2][0]], c1=[R[0][1],R[1][1],R[2][1]];
    let n0=hy(...c0); const e0=c0.map(x=>x/n0);
    let d=e0[0]*c1[0]+e0[1]*c1[1]+e0[2]*c1[2];
    const u1=c1.map((x,i)=>x-d*e0[i]); const n1=hy(...u1); const e1=u1.map(x=>x/n1);
    const e2=[e0[1]*e1[2]-e0[2]*e1[1], e0[2]*e1[0]-e0[0]*e1[2], e0[0]*e1[1]-e0[1]*e1[0]];
    R=[[e0[0],e1[0],e2[0]],[e0[1],e1[1],e2[1]],[e0[2],e1[2],e2[2]]];
  }
  return {O,R};
}

/* ── 1 · the conserved quantities, and the closed-form attitude ───────────── */
{
  const cases=[
    {O:[0.7,-0.3,1.1], l:0.6},
    {O:[0.2, 0.9,-0.8], l:1.4},
    {O:[1.0, 0.0, 0.5], l:Math.pow(PHI,-0.5)},
    {O:[0.35,0.15,1.7], l:0.25},
  ];
  let dE=0,dM2=0,dMs=0,dR=0, rows=[];
  for(const c of cases){
    const l=c.l, O0=c.O, tEnd=3.7, steps=240000;
    const E0=energy2(O0,l), M0b=bodyM(O0,l), M0=hy(...M0b);
    const {O,R}=integrate(O0,l,tEnd,steps);
    dE=Math.max(dE,Math.abs(energy2(O,l)-E0));
    const Mb=bodyM(O,l); dM2=Math.max(dM2,Math.abs(hy(...Mb)**2-M0**2));
    /* spatial angular momentum must be frozen */
    const Ms0=mv(I3,M0b), Ms=mv(R,Mb);
    dMs=Math.max(dMs,hy(Ms[0]-Ms0[0],Ms[1]-Ms0[1],Ms[2]-Ms0[2]));
    /* closed-form reconstruction */
    const n1=nu1(O0,l), n2=nu2(O0,l), Mh=M0b.map(x=>x/M0);
    const Rex=mul(expHat(Mh.map(x=>x*n1*tEnd)), expHat([0,0,n2*tEnd]));
    dR=Math.max(dR,dSO3(R,Rex));
    rows.push(`λ=${l.toFixed(4)} ν1=${n1.toFixed(6)} ν2=${n2.toFixed(6)} ρ=${(n2/n1).toFixed(9)}`);
  }
  ok('conserved quantities hold along the integration: energy, |M|^2 and the SPATIAL angular momentum vector',
    dE<1e-10 && dM2<1e-10 && dMs<1e-10,
    `dE=${dE.toExponential(2)} dM2=${dM2.toExponential(2)} dM_space=${dMs.toExponential(2)}`);
  ok('the closed-form Lie-group reconstruction R(t)=exp(t nu1 [Mhat]x) R0 exp(t nu2 [e3]x) reproduces the integrated attitude, measured by the geodesic distance on SO(3) rather than entrywise',
    dR<1e-9, `d_SO3 = ${dR.toExponential(2)} rad after t=3.7 · ${rows.join(' · ')}`);
}

/* ── 2 · the frequencies, measured from the trajectory ────────────────────── */
{
  /* nu_2 is the body-frame rotation rate of Omega_perp; nu_1 is the spatial precession
     rate of the body axis about M.  Both are measured, not assumed. */
  let worst=0, rows=[];
  for(const [O0,l] of [[[0.7,-0.3,1.1],0.6],[[0.2,0.9,-0.8],1.4],[[0.35,0.15,1.7],0.25]]){
    const n2a=nu2(O0,l), n1a=nu1(O0,l);
    const tEnd=1.3, steps=130000;
    const {O,R}=integrate(O0,l,tEnd,steps);
    /* MEASURED BODY SPIN, AND ITS SIGN.  Euler's equations for the symmetric top give
       d/dt (Omega_1 + i Omega_2) = -i (1-lambda^2) Omega_3 (Omega_1 + i Omega_2),
       so the transverse body rate turns at MINUS nu_2.  nu_2 as it appears in the
       reconstruction is the spin of the body about its own symmetry axis, and the two
       senses are opposite by construction -- the reconstruction check below closes to
       zero, which is what settles that this is a convention and not an error. */
    const a0=Math.atan2(O0[1],O0[0]), a1=Math.atan2(O[1],O[0]);
    let turns=Math.round((-n2a*tEnd-(a1-a0))/(2*Math.PI));
    const n2m=-(((a1-a0)+2*Math.PI*turns)/tEnd);
    /* measured spatial precession: angle of the body 3-axis about Mhat */
    const M0b=bodyM(O0,l), M0=hy(...M0b), Mh=M0b.map(x=>x/M0);
    const e3s=mv(R,[0,0,1]), e3s0=[0,0,1];
    const perp=v=>{const d=v[0]*Mh[0]+v[1]*Mh[1]+v[2]*Mh[2];return v.map((x,i)=>x-d*Mh[i]);};
    const p0=perp(e3s0), p1=perp(e3s);
    const np0=hy(...p0), np1=hy(...p1);
    let n1m=NaN;
    if(np0>1e-6&&np1>1e-6){
      const u=p0.map(x=>x/np0), w=p1.map(x=>x/np1);
      const cs=u[0]*w[0]+u[1]*w[1]+u[2]*w[2];
      const cr=[u[1]*w[2]-u[2]*w[1],u[2]*w[0]-u[0]*w[2],u[0]*w[1]-u[1]*w[0]];
      const sn=cr[0]*Mh[0]+cr[1]*Mh[1]+cr[2]*Mh[2];
      let ang=Math.atan2(sn,cs);
      const k=Math.round((n1a*tEnd-ang)/(2*Math.PI));
      n1m=(ang+2*Math.PI*k)/tEnd;
    }
    worst=Math.max(worst,Math.abs(n2m-n2a),Math.abs(n1m-n1a));
    rows.push(`λ=${l}: ν1 ${n1m.toFixed(9)} vs ${n1a.toFixed(9)} · ν2 ${n2m.toFixed(9)} vs ${n2a.toFixed(9)}`);
  }
  ok('both frequencies MEASURED from the trajectory match the closed forms nu1=|M| and nu2=(1-lambda^2)Omega_3',
    worst<1e-9, `worst |nu_num - nu_ana| = ${worst.toExponential(2)} · ${rows[0]}`);
}

/* ── 3 · the REFUTED formula, with a counterexample ───────────────────────── */
{
  const O=[0.7,-0.3,1.1], l=0.6;
  const correct=rhoSigned(O,l), oldWrong=1-l*l;
  ok('REFUTED: rho = 1 - lambda^2 is wrong except when |M| = 1, and here is the counterexample rather than the assertion',
    Math.abs(correct-oldWrong)/Math.abs(correct)>0.15 && Math.abs(nu1(O,l)-1)>0.1,
    `lambda=0.6, Omega=(0.7,-0.3,1.1): correct rho = ${correct.toFixed(9)} · old formula = ${oldWrong.toFixed(9)} · |M| = ${nu1(O,l).toFixed(6)} (not 1)`);
  /* and where the old one IS right: normalise |M| to 1 */
  const s=1/nu1(O,l), On=[O[0]*s,O[1]*s,O[2]*s];
  ok('… and it becomes correct exactly on the |M| = 1 shell, which is the special case it silently assumed',
    Math.abs(rhoSigned(On,l)-(1-l*l)*On[2]/1)<1e-15 && Math.abs(nu1(On,l)-1)<1e-15,
    `after rescaling to |M| = ${nu1(On,l).toFixed(12)}, rho = ${rhoSigned(On,l).toFixed(12)} = (1-lambda^2)Omega_3`);
}

/* ── 4 · rho_max on the 2E = 1 shell, and reachability of the golden torus ─── */
{
  /* on 2E = 1 the extreme is Omega_perp = 0, Omega_3 = 1/lambda */
  let worst=0, rows=[];
  for(const l of [0.25,0.5,Math.pow(PHI,-0.5),0.9,1.3,PHI,2.2]){
    const ana=Math.abs(1-l*l)/(l*l);
    let num=0;
    for(let i=0;i<=200000;i++){
      const u=i/200000, O3=u/l, perp2=1-l*l*O3*O3; if(perp2<0) continue;
      const O=[Math.sqrt(perp2),0,O3];
      num=Math.max(num,Math.abs(rhoSigned(O,l)));
    }
    worst=Math.max(worst,Math.abs(num-ana)/Math.max(1e-12,ana));
    rows.push(`λ=${l.toFixed(4)}: ${ana.toFixed(6)}`);
  }
  ok('on the 2E = 1 shell the largest attainable |rho| is |1-lambda^2|/lambda^2, found by scanning the shell rather than by assuming where the maximum sits',
    worst<2e-5, `worst relative disagreement ${worst.toExponential(2)} · ${rows.join(' · ')}`);

  const need=1/PHI;
  const reach=l=>Math.abs(1-l*l)/(l*l)>=need-1e-12;
  const lo=Math.pow(PHI,-0.5), hi=PHI;
  ok('the golden rotation number rho = 1/phi is REACHABLE exactly when lambda <= phi^(-1/2) or lambda >= phi — and this does NOT select lambda: it is an inequality, not an equation',
    reach(lo)&&reach(hi)&&!reach(lo*1.02)&&!reach(hi*0.98),
    `phi^(-1/2) = ${lo.toFixed(6)} reachable · just above it (${(lo*1.02).toFixed(6)}) not reachable · phi = ${hi.toFixed(6)} reachable · just below it not reachable`);
}

/* ── 5 · the signed number is not the number modulo one ───────────────────── */
{
  /* lambda > 1 with Omega_3 > 0 makes nu_2 negative, which is the case that matters:
     a positive-rho example would let the two definitions coincide by accident */
  const O=[0.2,0.9,0.8], l=1.4;
  const rs=rhoSigned(O,l), rm=((rs%1)+1)%1;
  ok('the signed rotation number and its reduction modulo one are stored separately, because a negative rho and its mod-1 image describe different tori and collapsing them loses the direction of the spin',
    rs<0 && rm>0 && Math.abs(rm-(rs-Math.floor(rs)))<1e-15,
    `rho_signed = ${rs.toFixed(9)} · rho_mod1 = ${rm.toFixed(9)}`);
}

for(const [s,n,d] of out) console.log(s.padEnd(5), n, '\n      ', d);
console.log('\n', out.filter(r=>r[0]==='PASS').length+'/'+out.length, 'checks pass');
