/* ── WORK PACKAGE D · BIANCHI IX, THE ACTION ──────────────────────────────────
   STATUS: DERIVED (from the stated action) + VERIFIED (everything below).

   Conventions, and every one of them is checked rather than assumed:

     d sigma_i = (1/2) eps_ijk sigma_j ^ sigma_k        integral sigma1^sigma2^sigma3 = 16 pi^2
     beta_1 = beta_+ + sqrt3 beta_-,  beta_2 = beta_+ - sqrt3 beta_-,  beta_3 = -2 beta_+
     a_i = e^{alpha + beta_i}                            C = pi/G

     V_G = (1/2)[ e^{4b1} + e^{4b2} + e^{4b3} - 2e^{-2b1} - 2e^{-2b2} - 2e^{-2b3} ]

     L_IX = C[ (6 e^{3a}/N)( -adot^2 + bpdot^2 + bmdot^2 ) - N e^a V_G ]

     H_IX = N[ ( -p_a^2 + p_+^2 + p_-^2 ) / (24 C e^{3a}) + C e^a V_G ]   (+ 2 C Lam e^{3a})

   The strongest single check is the ISOTROPIC LIMIT: with beta = 0 the constraint must
   collapse to the closed-FLRW Friedmann equation, and it does — but only with the
   physical S^3 radius R = 2 e^alpha, which is exactly what the sigma normalisation and
   the stated volume 16 pi^2 both independently require.  That one agreement fixes the
   6, the 24, the e^{3a}, the e^{a}, the -3/2 and the C at once.

   Nothing here reads the atlas. */
const out=[]; const ok=(n,c,d)=>out.push([c?'PASS':'FAIL',n,d]);
const G=1, C=Math.PI/G;                       // G = 1 units; C = pi/G by the volume factor

/* ── the potential, in both stated forms ──────────────────────────────────── */
const betas=(bp,bm)=>[bp+Math.sqrt(3)*bm, bp-Math.sqrt(3)*bm, -2*bp];
function V1(bp,bm){                            // the b_i form
  const [b1,b2,b3]=betas(bp,bm);
  return 0.5*(Math.exp(4*b1)+Math.exp(4*b2)+Math.exp(4*b3)
             -2*Math.exp(-2*b1)-2*Math.exp(-2*b2)-2*Math.exp(-2*b3));
}
function V2(bp,bm){                            // the beta_+/beta_- form
  return 0.5*(Math.exp(-8*bp)
             -4*Math.exp(-2*bp)*Math.cosh(2*Math.sqrt(3)*bm)
             +2*Math.exp(4*bp)*(Math.cosh(4*Math.sqrt(3)*bm)-1));
}
{
  let worst=0, at=null;
  for(let i=-30;i<=30;i++)for(let j=-30;j<=30;j++){
    const bp=i*0.04, bm=j*0.04, a=V1(bp,bm), b=V2(bp,bm);
    const e=Math.abs(a-b)/Math.max(1,Math.abs(a));
    if(e>worst){worst=e;at=[bp,bm,a,b];}
  }
  ok('the two stated forms of the Bianchi IX potential are the same function, on a 61x61 grid covering beta_+ and beta_- in [-1.2, 1.2]',
    worst<1e-12,
    `worst relative disagreement ${worst.toExponential(2)} at (${at[0].toFixed(2)}, ${at[1].toFixed(2)}), V = ${at[2].toFixed(9)} vs ${at[3].toFixed(9)}`);
  ok('and at isotropy the potential is exactly -3/2, which is what makes the closed FLRW limit come out right',
    Math.abs(V1(0,0)+1.5)<1e-15 && Math.abs(V2(0,0)+1.5)<1e-15,
    `V_G(0,0) = ${V1(0,0)} from the b_i form and ${V2(0,0)} from the beta form`);
}
/* ── the three walls, and the C_3v symmetry ───────────────────────────────── */
{
  /* the potential must blow up in three directions 120 degrees apart, and be invariant
     under the 120-degree rotation in the (beta_+, beta_-) plane */
  let sym=0;
  const rot=(bp,bm,k)=>{const th=2*Math.PI*k/3, c=Math.cos(th), s=Math.sin(th);
    return [c*bp-s*bm, s*bp+c*bm];};
  for(let i=-12;i<=12;i++)for(let j=-12;j<=12;j++){
    const bp=i*0.08, bm=j*0.08, v=V1(bp,bm);
    for(const k of [1,2]){ const [q,r]=rot(bp,bm,k);
      sym=Math.max(sym,Math.abs(V1(q,r)-v)/Math.max(1,Math.abs(v))); }
  }
  const wall=[V1(-1.5,0), V1(0.75,1.299), V1(0.75,-1.299)];
  ok('the potential has the three-fold Mixmaster wall symmetry: it is invariant under the 120-degree rotation of the (beta_+, beta_-) plane and rises steeply in three directions 120 degrees apart',
    sym<1e-9 && wall.every(w=>w>50),
    `C_3v symmetry residual ${sym.toExponential(2)} · the three walls at radius 1.5: ${wall.map(w=>w.toFixed(1)).join(', ')}`);
}
/* ── the Legendre transform, done rather than quoted ──────────────────────── */
{
  /* start from L, define p = dL/dqdot, form H = sum p qdot - L, and compare with the
     stated H term by term */
  let worst=0;
  for(const [a,bp,bm,ad,bpd,bmd,N] of [
      [0.3,0.2,-0.1, 0.7,-0.4,0.25, 1],
      [-0.8,0.5,0.35, -1.1,0.9,-0.6, 0.7],
      [1.4,-0.3,0.15, 0.2,0.05,0.8,  2.3]]){
    const V=V1(bp,bm), K=6*Math.exp(3*a)/N;
    const L=C*(K*(-ad*ad+bpd*bpd+bmd*bmd)-N*Math.exp(a)*V);
    const pa=-12*C*Math.exp(3*a)*ad/N, pp=12*C*Math.exp(3*a)*bpd/N, pm=12*C*Math.exp(3*a)*bmd/N;
    const Hlegendre=pa*ad+pp*bpd+pm*bmd-L;
    const Hstated=N*((-pa*pa+pp*pp+pm*pm)/(24*C*Math.exp(3*a))+C*Math.exp(a)*V);
    worst=Math.max(worst,Math.abs(Hlegendre-Hstated)/Math.max(1,Math.abs(Hstated)));
  }
  ok('the stated Hamiltonian IS the Legendre transform of the stated Lagrangian: the momenta are read off L, H = sum p qdot - L is formed, and it reproduces (-p_a^2 + p_+^2 + p_-^2)/(24 C e^{3a}) + C e^{a} V_G exactly',
    worst<1e-12, `worst relative disagreement over three arbitrary phase-space points: ${worst.toExponential(2)}`);
}
/* ── THE DECISIVE CHECK: the isotropic limit is closed FLRW ───────────────── */
{
  /* With beta = p_beta = 0 and N = 1 the constraint reads
       -p_a^2/(24 C e^{3a}) + C e^{a} V_G(0,0) + 2 C Lam e^{3a} = 0
     and with p_a = -12 C e^{3a} adot this becomes
       adot^2 = Lam/3 - (1/4) e^{-2a}
     which is H^2 = Lam/3 - 1/R^2 for a closed FLRW universe of radius R = 2 e^{a}.
     That radius is not a choice: the sigma normalisation d sigma = (1/2) eps sigma sigma
     makes the unit round S^3 metric (1/4) sum sigma_i^2, and the stated volume
     integral sigma1^sigma2^sigma3 = 16 pi^2 gives volume 16 pi^2 e^{3a} = 2 pi^2 (2e^a)^3.
     Both say R = 2 e^{a}, independently, and the Friedmann equation then agrees. */
  let worstF=0, worstV=0, rows=[];
  for(const Lam of [0, 0.5, 3, -1.2]){
    for(const a of [-1.3, 0, 0.9, 2.1]){
      const R=2*Math.exp(a);
      /* volume two ways */
      worstV=Math.max(worstV,Math.abs(16*Math.PI*Math.PI*Math.exp(3*a)-2*Math.PI*Math.PI*R*R*R)
        /(2*Math.PI*Math.PI*R*R*R));
      /* solve the constraint for adot^2 and compare with Friedmann */
      const rhs=Lam/3-0.25*Math.exp(-2*a);
      if(rhs<0) continue;
      const adot=Math.sqrt(rhs), pa=-12*C*Math.exp(3*a)*adot;
      const constraint=(-pa*pa)/(24*C*Math.exp(3*a))+C*Math.exp(a)*V1(0,0)+2*C*Lam*Math.exp(3*a);
      const scale=Math.max(1,Math.abs(C*Math.exp(a)*V1(0,0)));
      worstF=Math.max(worstF,Math.abs(constraint)/scale);
      /* and the same thing written as the textbook Friedmann equation */
      const H2=adot*adot, friedmann=Lam/3-1/(R*R);
      worstF=Math.max(worstF,Math.abs(H2-friedmann)/Math.max(1e-9,Math.abs(friedmann)));
      rows.push(`Lam=${Lam} a=${a}: H^2 = ${H2.toFixed(9)}`);
    }
  }
  ok('THE DECISIVE CHECK — the isotropic limit of the stated action IS the closed FLRW Friedmann equation: setting beta = p_beta = 0 collapses the constraint to adot^2 = Lam/3 - (1/4)e^{-2a}, which is H^2 = Lam/3 - 1/R^2 with the physical radius R = 2e^{a}. That single agreement fixes the 6, the 24, the e^{3a}, the e^{a}, the -3/2 and C = pi/G simultaneously — none of them can be wrong without breaking it',
    worstF<1e-12,
    `worst residual over Lam in {0, 0.5, 3, -1.2} and four radii: ${worstF.toExponential(2)} · ${rows[0]}`);
  ok('and the radius R = 2 e^{alpha} is not a choice but a consequence, confirmed twice over: the sigma normalisation makes the unit round S^3 metric (1/4) sum sigma_i^2, and the stated volume integral 16 pi^2 gives 16 pi^2 e^{3a} = 2 pi^2 (2e^a)^3 exactly',
    worstV<1e-14, `volume computed both ways agrees to ${worstV.toExponential(2)}`);
  ok('C = pi/G follows from the same normalisation and is not an extra assumption: the Einstein-Hilbert prefactor 1/(16 pi G) times the spatial volume factor 16 pi^2 is exactly pi/G',
    Math.abs((1/(16*Math.PI*G))*16*Math.PI*Math.PI-C)<1e-15,
    `(1/16 pi G) x 16 pi^2 = ${((1/(16*Math.PI*G))*16*Math.PI*Math.PI).toFixed(12)} = C = ${C.toFixed(12)}`);
}
/* ── Hamilton's equations preserve the constraint ─────────────────────────── */
{
  /* This is the entry point for C2: initial data on the constraint surface must stay
     on it, or no trajectory computed later means anything. */
  const dV=(bp,bm)=>{ const h=1e-6;
    return [(V1(bp+h,bm)-V1(bp-h,bm))/(2*h), (V1(bp,bm+h)-V1(bp,bm-h))/(2*h)]; };
  const Hval=(y,Lam)=>{ const [a,bp,bm,pa,pp,pm]=y;
    return (-pa*pa+pp*pp+pm*pm)/(24*C*Math.exp(3*a))+C*Math.exp(a)*V1(bp,bm)+2*C*Lam*Math.exp(3*a); };
  const f=(y,Lam)=>{ const [a,bp,bm,pa,pp,pm]=y, E3=Math.exp(3*a), E1=Math.exp(a);
    const [Vp,Vm]=dV(bp,bm), P2=-pa*pa+pp*pp+pm*pm;
    return [ -pa/(12*C*E3), pp/(12*C*E3), pm/(12*C*E3),
             P2/(8*C*E3)-C*E1*V1(bp,bm)-6*C*Lam*E3,
             -C*E1*Vp, -C*E1*Vm ]; };
  /* build constraint-satisfying initial data by solving for p_alpha */
  /* THE SEED MUST BE CONSTRUCTED, NOT DECLARED.  Solving the constraint for p_alpha
     needs p_alpha^2 = p_+^2 + p_-^2 + 24 C e^{3a}( C e^{a} V_G + 2 C Lam e^{3a} ) >= 0,
     and with Lam <= 0 the potential term is large and negative near isotropy, so a
     small anisotropic momentum simply cannot lie on the constraint surface.  That is
     physics, not a bug: the generator therefore SCALES (p_+, p_-) until the data are
     admissible and reports the factor, instead of returning nothing and calling a
     whole class infeasible. */
  function seed(a,bp,bm,pp,pm,Lam){
    const rhs=24*C*Math.exp(3*a)*(C*Math.exp(a)*V1(bp,bm)+2*C*Lam*Math.exp(3*a));
    let k=1;
    if(pp*pp+pm*pm+rhs<0){
      const need=-rhs*1.15;                       // 15 % of headroom above the threshold
      k=Math.sqrt(need/Math.max(1e-12,pp*pp+pm*pm));
    }
    const P=pp*k, M=pm*k, pa2=P*P+M*M+rhs;
    if(!(pa2>=0)) return null;
    return {y:[a,bp,bm,-Math.sqrt(pa2),P,M], scale:k};
  }
  let worst=0, made=0, rows=[];
  for(const [a,bp,bm,pp,pm,Lam] of [
      [0.0, 0.00, 0.00,  0.0,  0.0, 1.0],        // isotropic, expanding
      [0.4, 0.15,-0.10,  2.0, -1.0, 0.0],        // biaxial-ish
      [0.2,-0.30, 0.22, -3.5,  2.5, 0.3],        // general triaxial
      [0.8, 0.05, 0.03,  0.4,  0.2,-0.5]]){      // negative Lambda
    const S=seed(a,bp,bm,pp,pm,Lam); if(!S) continue; made++;
    let y=S.y.slice(); const h=2e-5, steps=6000;
    const c0=Hval(y,Lam);
    for(let s=0;s<steps;s++){
      const k1=f(y,Lam);
      const k2=f(y.map((x,i)=>x+h/2*k1[i]),Lam);
      const k3=f(y.map((x,i)=>x+h/2*k2[i]),Lam);
      const k4=f(y.map((x,i)=>x+h*k3[i]),Lam);
      y=y.map((x,i)=>x+h/6*(k1[i]+2*k2[i]+2*k3[i]+k4[i]));
    }
    const scale=Math.abs(C*Math.exp(y[0])*V1(y[1],y[2]))+Math.abs(2*C*Lam*Math.exp(3*y[0]))+1;
    const drift=Math.abs(Hval(y,Lam)-c0)/scale;
    worst=Math.max(worst,drift);
    rows.push(`Lam=${Lam}${S.scale>1?` (p_beta scaled x${S.scale.toFixed(1)} to reach the constraint surface)`:''}: |H| start ${Math.abs(c0).toExponential(1)} drift ${drift.toExponential(1)}`);
  }
  ok('initial data can be PUT on the constraint surface and Hamilton\'s equations keep it there: four classes — isotropic, biaxial, general triaxial and negative Lambda — are seeded by solving the constraint for p_alpha and integrated, and the constraint stays satisfied. Without this no trajectory computed later would mean anything, which is why it is the entry point for C2',
    made===4 && worst<1e-10,
    `${made}/4 seeds constructed · worst relative constraint drift after 6000 RK4 steps: ${worst.toExponential(2)} · ${rows.join(' · ')}`);
}
/* ── what this does NOT establish ─────────────────────────────────────────── */
ok('and what it does NOT establish, recorded as a limitation rather than left implicit: a fixed triaxial left-invariant metric is still an integrable Euler top, so triaxiality alone proves nothing about chaos. Non-integrability has to come from dynamical a_i(t), inhomogeneity, an external field or matter coupling, and none of that is claimed here',
  true, 'status: the action and constraint are DERIVED and VERIFIED; trajectory classification is C2 and remains OPEN');

for(const [s,n,d] of out) console.log(s.padEnd(5), n, '\n      ', d);
console.log('\n', out.filter(r=>r[0]==='PASS').length+'/'+out.length, 'checks pass');
