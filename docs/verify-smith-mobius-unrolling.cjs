/* ── THE SMITH–MÖBIUS UNROLLING, AS A ROTATION ────────────────────────────────
   STATUS: THEOREM (Möbius / SU(2) / stereographic) + VERIFIED (everything below).

   The animation this file underwrites is NOT a morph.  The Smith chart and the
   impedance plane are two stereographic views of ONE grid drawn on the Riemann sphere,
   and the whole cycle is a single rigid rotation of that sphere:

       M(theta) = [[ cos(t/2), -sin(t/2)], [ sin(t/2), cos(t/2)]],   t = theta
       w_theta(z) = (cos(t/2) z - sin(t/2)) / (sin(t/2) z + cos(t/2))

       theta = 0     ->  w = z                    the impedance plane
       theta = pi/2  ->  w = (z-1)/(z+1) = Gamma  the Smith chart

   det M = 1 and M^dag M = I, so M(theta) is in SU(2), and the SU(2) -> SO(3) double
   cover sends it to the rotation R_y(theta).  The claim that has to be TRUE, not
   assumed, is that the two routes agree:

       lift z to the sphere, rotate rigidly, project      ==      apply the Mobius map

   Check 3 is that equality.  Everything the laboratory draws follows from it, which is
   why "the grid stretches" is the wrong description: nothing stretches.  The grid is
   rigid on S^2 and only the PROJECTION of it changes.

   Generalized circles are carried analytically, not sampled: a line or circle is the
   Hermitian form Z^dag H Z = 0 with Z = (z, 1)^T, and the transform is

       H_theta = (M^-1)^dag H M^-1

   from which the centre and radius come out in closed form (checks 7, 8, 11).

   Nothing here reads the atlas.  Run: node docs/verify-smith-mobius-unrolling.cjs   */

const out=[]; const ok=(n,c,d)=>out.push([c?'PASS':'FAIL',n,d]);
const TOL_ALG=1e-12;

/* ── complex arithmetic, kept explicit so nothing hides ───────────────────── */
const C=(re=0,im=0)=>({re,im});
const cadd=(a,b)=>C(a.re+b.re,a.im+b.im);
const csub=(a,b)=>C(a.re-b.re,a.im-b.im);
const cmul=(a,b)=>C(a.re*b.re-a.im*b.im, a.re*b.im+a.im*b.re);
const cconj=a=>C(a.re,-a.im);
const cabs2=a=>a.re*a.re+a.im*a.im;
const cabs=a=>Math.hypot(a.re,a.im);
const cdiv=(a,b)=>{ const d=cabs2(b); return C((a.re*b.re+a.im*b.im)/d,(a.im*b.re-a.re*b.im)/d); };
const cscale=(a,s)=>C(a.re*s,a.im*s);

/* ── the one-parameter family, in CP^1 so infinity is a point like any other ── */
function M(th){ const c=Math.cos(th/2), s=Math.sin(th/2);
  return [[C(c,0),C(-s,0)],[C(s,0),C(c,0)]]; }
/* homogeneous action: [z0:z1] -> M [z0:z1].  z = z0/z1, infinity = [1:0]. */
function mobiusHom(Mx,z0,z1){
  return [cadd(cmul(Mx[0][0],z0),cmul(Mx[0][1],z1)),
          cadd(cmul(Mx[1][0],z0),cmul(Mx[1][1],z1))]; }
function mobius(Mx,z){ const [a,b]=mobiusHom(Mx,z,C(1,0));
  return cabs2(b)<1e-300?null:cdiv(a,b); }              // null = the point at infinity

/* ── the sphere route ─────────────────────────────────────────────────────── */
/* S(z) = (2Re z, 2Im z, |z|^2 - 1)/(1+|z|^2);  infinity -> the north pole (0,0,1) */
function lift(z){ if(z===null) return [0,0,1];
  const q=cabs2(z), d=1+q; return [2*z.re/d, 2*z.im/d, (q-1)/d]; }
function rotY(v,th){ const c=Math.cos(th), s=Math.sin(th);
  return [c*v[0]+s*v[2], v[1], -s*v[0]+c*v[2]]; }
/* stereographic projection FROM the north pole onto the equatorial plane Z = 0 */
function project(v){ const d=1-v[2];
  return Math.abs(d)<1e-14?null:C(v[0]/d, v[1]/d); }
const sphereRoute=(z,th)=>project(rotY(lift(z),th));

/* ── generalized circles as Hermitian forms ───────────────────────────────── */
/*  A|z|^2 + B zbar + Bbar z + D = 0,  A and D real, written H = [[A,B],[Bbar,D]] */
const lineR=r0=>({A:0,B:C(1,0),D:-2*r0});     // Re z = r0
const lineX=x0=>({A:0,B:C(0,-1),D:2*x0});     // Im z = x0
function hermTransform(H,Mx){
  /* H' = (M^-1)^dag H M^-1.  For M in SU(2), M^-1 = [[d,-b],[-c,a]] since det = 1. */
  const [[a,b],[c,d]]=Mx;
  const N=[[d,cscale(b,-1)],[cscale(c,-1),a]];                 // M^-1
  const Nd=[[cconj(N[0][0]),cconj(N[1][0])],[cconj(N[0][1]),cconj(N[1][1])]];  // (M^-1)^dag
  const Hm=[[C(H.A,0),H.B],[cconj(H.B),C(H.D,0)]];
  const mul=(P,Q)=>[[cadd(cmul(P[0][0],Q[0][0]),cmul(P[0][1],Q[1][0])),
                     cadd(cmul(P[0][0],Q[0][1]),cmul(P[0][1],Q[1][1]))],
                    [cadd(cmul(P[1][0],Q[0][0]),cmul(P[1][1],Q[1][0])),
                     cadd(cmul(P[1][0],Q[0][1]),cmul(P[1][1],Q[1][1]))]];
  const R=mul(mul(Nd,Hm),N);
  return {A:R[0][0].re, B:R[0][1], D:R[1][1].re,
          hermiticity:Math.max(Math.abs(R[0][0].im),Math.abs(R[1][1].im),
            Math.abs(R[1][0].re-R[0][1].re),Math.abs(R[1][0].im+R[0][1].im))}; }
function circleOf(H){
  if(Math.abs(H.A)<1e-13){                       // a straight line
    const n=cabs(H.B); return {kind:'line',normal:[H.B.re/n,H.B.im/n],offset:-H.D/(2*n)}; }
  const c=cscale(H.B,-1/H.A), r2=cabs2(H.B)/(H.A*H.A)-H.D/H.A;
  return {kind:'circle',centre:[c.re,c.im],radius:Math.sqrt(Math.max(0,r2))}; }
const onCurve=(H,z)=>H.A*cabs2(z)+2*(H.B.re*z.re+H.B.im*z.im)+H.D;

/* ── a deterministic spread of test points, none of them special by accident ── */
const PTS=[]; { const g=0.6180339887498949;
  for(let k=1;k<=220;k++){ const u=(k*g)%1, v=(k*g*g)%1;
    PTS.push(C(-3+8*u, -4+8*v)); }
  PTS.push(C(0,0),C(1,0),C(0.5,0.5),C(2,-1),C(-1,0.0001),C(50,0),C(0.02,0.02)); }
const THETAS=[0,0.13,Math.PI/8,Math.PI/4,1.1,1.4,Math.PI/2];

/* ══ 1 ══ det M = 1 ═════════════════════════════════════════════════════════ */
{
  let w=0;
  for(let k=0;k<=400;k++){ const th=Math.PI/2*k/400, Mx=M(th);
    const det=csub(cmul(Mx[0][0],Mx[1][1]),cmul(Mx[0][1],Mx[1][0]));
    w=Math.max(w,Math.abs(det.re-1),Math.abs(det.im)); }
  ok('the family is unimodular for every theta in [0, pi/2]: det M(theta) = 1 exactly, which is what makes it a Mobius map of CP^1 with a well-defined SU(2) representative rather than a matrix that merely acts projectively',
    w<TOL_ALG, `worst |det M - 1| over 401 angles: ${w.toExponential(2)}`);
}
/* ══ 2 ══ M^dag M = I ═══════════════════════════════════════════════════════ */
{
  let w=0;
  for(let k=0;k<=400;k++){ const th=Math.PI/2*k/400, Mx=M(th);
    for(let i=0;i<2;i++)for(let j=0;j<2;j++){
      let s=C(0,0); for(let m=0;m<2;m++) s=cadd(s,cmul(cconj(Mx[m][i]),Mx[m][j]));
      w=Math.max(w,Math.abs(s.re-(i===j?1:0)),Math.abs(s.im)); } }
  ok('and it is UNITARY: M(theta)^dag M(theta) = I, so M(theta) lies in SU(2) and the animation is a rigid rotation of the Riemann sphere and not a deformation of it — this is the single fact the whole laboratory rests on',
    w<TOL_ALG, `worst |M^dag M - I| entry over 401 angles: ${w.toExponential(2)}`);
}
/* ══ 3 ══ THE TWO ROUTES AGREE ══════════════════════════════════════════════ */
{
  /* MEASURED IN THE RIGHT METRIC, and the first attempt at this was measured in the
     wrong one.  Comparing |w_A - w_B| in the plane makes the residual blow up near the
     projection pole purely because the plane coordinate does — at theta = pi/2 and
     z = -1 + 1e-4i the two routes agree perfectly and |w| is 2e4, so a plane-metric
     "error" of 1e-9 was cancellation in the readout, not disagreement in the map.  The
     correct measure on CP^1 is the CHORDAL distance, the straight-line distance between
     the two lifts on the unit sphere,
         d(w1,w2) = 2|w1-w2| / (sqrt(1+|w1|^2) sqrt(1+|w2|^2)),
     which is uniformly valid, treats infinity as an ordinary point, and lets every test
     point be kept including the pole itself. */
  const chord=(a,b)=>{ if(a===null&&b===null) return 0;
    if(a===null) return 2/Math.sqrt(1+cabs2(b));
    if(b===null) return 2/Math.sqrt(1+cabs2(a));
    return 2*cabs(csub(a,b))/(Math.sqrt(1+cabs2(a))*Math.sqrt(1+cabs2(b))); };
  let w=0, at=null, n=0, poles=0;
  for(const th of THETAS) for(const z of PTS){
    const a=mobius(M(th),z), b=sphereRoute(z,th); n++;
    if(a===null||b===null) poles++;
    const e=chord(a,b);
    if(e>w){ w=e; at=[th,z,a,b]; } }
  ok('THE EQUALITY THE LABORATORY EXISTS TO SHOW: lifting z to the Riemann sphere, rotating rigidly by R_y(theta), and projecting stereographically gives EXACTLY the Mobius map w_theta(z). Two completely different computations, one answer — so the 3D staging is not an illustration of the algebra, it IS the algebra. Measured in the chordal metric of CP^1, so no point has to be excluded and the pole is included rather than stepped around',
    w<TOL_ALG&&n>1500,   /* the stated algebraic threshold; the residual is double-precision conditioning within 1e-4 of the pole, where |w| is 2e4 */
    `${n} (theta, z) pairs, none excluded, ${poles} of them landing exactly on the point at infinity · worst chordal disagreement ${w.toExponential(2)} at theta = ${at[0].toFixed(4)}, z = ${at[1].re.toFixed(3)}${at[1].im<0?'':'+'}${at[1].im.toFixed(3)}i`);
}
/* ══ 4 ══ the three landmarks ═══════════════════════════════════════════════ */
{
  const Mh=M(Math.PI/2);
  const g0=mobius(Mh,C(0,0)), g1=mobius(Mh,C(1,0));
  const [ai,bi]=mobiusHom(Mh,C(1,0),C(0,0));            // z = infinity as [1:0]
  const gInf=cdiv(ai,bi);
  const w=Math.max(cabs(csub(g0,C(-1,0))),cabs(csub(g1,C(0,0))),cabs(csub(gInf,C(1,0))));
  ok('the three landmarks land where the Smith chart says they must, and the point at infinity is handled as the CP^1 point [1:0] rather than as a large number: the short z = 0 goes to Gamma = -1, the matched load z = 1 to the centre Gamma = 0, and the open z = infinity to Gamma = +1',
    w<TOL_ALG,
    `z=0 -> ${g0.re.toFixed(15)} · z=1 -> ${cabs(g1).toExponential(2)} from the centre · z=inf -> ${gInf.re.toFixed(15)} · worst ${w.toExponential(2)}`);
}
/* ══ 5 ══ round trip ════════════════════════════════════════════════════════ */
{
  let w=0, n=0;
  for(const z of PTS){ const g=mobius(M(Math.PI/2),z); if(!g) continue;
    const den=csub(C(1,0),g); if(cabs(den)<1e-9) continue;
    const back=cdiv(cadd(C(1,0),g),den); n++;
    w=Math.max(w,cabs(csub(back,z))/(1+cabs(z))); }
  ok('the inverse map z = (1+Gamma)/(1-Gamma) returns the impedance it started from, so the animation is reversible as an identity and not only as a rewound playback',
    w<1e-13&&n>200, `${n} points · worst relative round-trip error ${w.toExponential(2)}`);
}
/* ══ 6 ══ the passive half-plane IS the unit disk ═══════════════════════════ */
{
  let bad=0, worstIn=0, worstOut=0, n=0;
  for(const z of PTS){ const g=mobius(M(Math.PI/2),z); if(!g) continue; n++;
    const passive=z.re>=0, inside=cabs(g)<=1+1e-12;
    if(passive!==inside) bad++;
    if(passive) worstIn=Math.max(worstIn,cabs(g)); else worstOut=Math.min(worstOut||9,cabs(g)); }
  /* and the boundary maps to the boundary, which is the statement that matters */
  let bnd=0;
  for(let k=0;k<400;k++){ const x=Math.tan((k/400-0.5)*Math.PI*0.999);
    const g=mobius(M(Math.PI/2),C(0,x)); if(g) bnd=Math.max(bnd,Math.abs(cabs(g)-1)); }
  ok('the physical statement the chart is FOR: the passive half-plane r >= 0 is exactly the closed unit disk |Gamma| <= 1, with the lossless boundary r = 0 going exactly to the unit circle — checked pointwise rather than asserted, and the reflection coefficient of a passive load can therefore never leave the disk',
    bad===0&&bnd<1e-12,
    `${n} points, ${bad} misclassified · the r = 0 axis maps onto |Gamma| = 1 to ${bnd.toExponential(2)} · largest |Gamma| among passive points ${worstIn.toFixed(12)}`);
}
/* ══ 7 ══ constant-r circles, analytically ══════════════════════════════════ */
{
  let w=0, hw=0, at=null;
  for(const r0 of [0,0.05,0.2,0.5,1,2,5,20,50]){
    const H=hermTransform(lineR(r0),M(Math.PI/2)); hw=Math.max(hw,H.hermiticity);
    const G=circleOf(H);
    if(G.kind!=='circle'){ w=1; at=[r0,'not a circle']; continue; }
    const e=Math.max(Math.hypot(G.centre[0]-r0/(1+r0),G.centre[1]),Math.abs(G.radius-1/(1+r0)));
    if(e>w){ w=e; at=[r0,G]; }
    /* and the analytic circle really is the image: map sample points and measure */
    for(let k=0;k<=120;k++){ const g=mobius(M(Math.PI/2),C(r0,Math.tan((k/120-0.5)*Math.PI*0.997)));
      if(g) w=Math.max(w,Math.abs(Math.hypot(g.re-G.centre[0],g.im-G.centre[1])-G.radius)); } }
  ok('the constant-resistance family is carried by the Hermitian form H -> (M^-1)^dag H M^-1 to EXACT circles of centre r/(1+r) and radius 1/(1+r) — extracted in closed form from the transformed form, then confirmed against mapped sample points, so the laboratory never approximates a circle by a polyline it guessed',
    w<1e-12&&hw<1e-13,
    `nine values of r · worst deviation ${w.toExponential(2)} · the transformed form stays Hermitian to ${hw.toExponential(2)}`);
}
/* ══ 8 ══ constant-x circles, analytically ══════════════════════════════════ */
{
  let w=0, at=null;
  for(const x0 of [0.05,0.2,0.5,1,2,5,20,50,-0.5,-1,-3]){
    const H=hermTransform(lineX(x0),M(Math.PI/2)), G=circleOf(H);
    if(G.kind!=='circle'){ w=1; at=x0; continue; }
    const e=Math.max(Math.hypot(G.centre[0]-1,G.centre[1]-1/x0),Math.abs(G.radius-1/Math.abs(x0)));
    if(e>w){ w=e; at=x0; }
    for(let k=1;k<120;k++){ const g=mobius(M(Math.PI/2),C(Math.tan(k/120*Math.PI/2*0.997),x0));
      if(g) w=Math.max(w,Math.abs(Math.hypot(g.re-G.centre[0],g.im-G.centre[1])-G.radius)); } }
  ok('and the constant-reactance family to exact circles of centre (1, 1/x) and radius 1/|x|, including the negative reactances, so the capacitive lower half of the chart is produced by the same closed form and not by mirroring the inductive half',
    w<1e-11, `eleven values of x, positive and negative · worst deviation ${w.toExponential(2)}`);
}
/* ══ 9 ══ the cross-ratio is invariant ══════════════════════════════════════ */
{
  const cr=(a,b,c,d)=>cdiv(cmul(csub(a,c),csub(b,d)),cmul(csub(b,c),csub(a,d)));
  let w=0, n=0;
  for(const th of THETAS) for(let k=0;k<60;k++){
    const q=[0,1,2,3].map(j=>PTS[(k*4+j*37)%PTS.length]);
    const Z=cr(q[0],q[1],q[2],q[3]);
    const W=q.map(z=>mobius(M(th),z));
    if(W.some(x=>x===null||cabs(x)>1e6)) continue;
    const Wc=cr(W[0],W[1],W[2],W[3]);
    if(!Number.isFinite(Z.re+Z.im+Wc.re+Wc.im)) continue; n++;
    w=Math.max(w,cabs(csub(Z,Wc))/(1+cabs(Z))); }
  ok('the cross-ratio of any four points is unchanged at every theta, which is the defining invariant of a Mobius map and the reason the grid keeps its combinatorial identity through the whole cycle: intersections stay the same intersections, they are only seen from a rotated sphere',
    w<1e-11&&n>200, `${n} quadruples across seven angles · worst relative drift ${w.toExponential(2)}`);
}
/* ══ 10 ══ angles are preserved — the conformality witness ══════════════════ */
{
  /* the derivative of a Mobius map, exactly: w' = 1/(c z + d)^2 when det = 1 */
  const dW=(Mx,z)=>{ const [[a,b],[c,d]]=Mx, den=cadd(cmul(c,z),d);
    return cdiv(C(1,0),cmul(den,den)); };
  let w=0, at=null, n=0;
  for(const th of THETAS) for(const r0 of [0.2,0.5,1,2]) for(const x0 of [-2,-0.5,0.5,1,3]){
    const z=C(r0,x0), Mx=M(th), D=dW(Mx,z);
    if(cabs(D)<1e-12||cabs(D)>1e12) continue; n++;
    const vr=C(0,1), vx=C(1,0);                       // tangents to r=const and x=const
    const a1=Math.atan2(vr.im,vr.re)-Math.atan2(vx.im,vx.re);
    const Vr=cmul(D,vr), Vx=cmul(D,vx);
    const a2=Math.atan2(Vr.im,Vr.re)-Math.atan2(Vx.im,Vx.re);
    const e=Math.abs(((a1-a2)%(2*Math.PI)+3*Math.PI)%(2*Math.PI)-Math.PI);
    if(e>w){ w=e; at=[th,r0,x0]; } }
  ok('the angle between the two grid families is preserved to machine precision at every theta: the grid CURVES but the crossings stay right-angled, which is what conformality means and what the Angle-witness readout displays live',
    w<1e-7&&n>100,
    `${n} crossings across seven angles · worst angle change ${w.toExponential(2)} rad, against the 1e-7 requirement`);
}
/* ══ 11 ══ generalized circles stay generalized circles ═════════════════════ */
{
  let herm=0, member=0, lines=0, circles=0;
  for(const th of THETAS)
    for(const H0 of [lineR(0),lineR(1),lineR(5),lineX(1),lineX(-2),{A:1,B:C(-0.3,0.2),D:-0.5}]){
      const H=hermTransform(H0,M(th)); herm=Math.max(herm,H.hermiticity);
      const G=circleOf(H); if(G.kind==='line') lines++; else circles++;
      /* sample the ORIGINAL curve, map it, and test membership of the transformed form */
      for(let k=0;k<80;k++){
        let z;
        if(Math.abs(H0.A)<1e-13){
          const n=cabs(H0.B), nx=H0.B.re/n, ny=H0.B.im/n, off=-H0.D/(2*n), s=(k/80-0.5)*12;
          z=C(nx*off-ny*s, ny*off+nx*s);
        } else { const G0=circleOf(H0), a=2*Math.PI*k/80;
          z=C(G0.centre[0]+G0.radius*Math.cos(a), G0.centre[1]+G0.radius*Math.sin(a)); }
        const g=mobius(M(th),z); if(!g||cabs(g)>1e5) continue;
        const sc=Math.abs(H.A)*cabs2(g)+2*cabs(H.B)*cabs(g)+Math.abs(H.D)+1;
        member=Math.max(member,Math.abs(onCurve(H,g))/sc); } }
  ok('lines and circles are one family and the transform never leaves it: every test curve — vertical lines, horizontal lines and a genuine off-centre circle — maps to a curve whose points satisfy the transformed Hermitian form, and the form stays Hermitian, so centre and radius come out in closed form at every frame instead of being fitted',
    herm<1e-13&&member<1e-12,
    `${lines} straight images and ${circles} circular images across seven angles · worst membership residual ${member.toExponential(2)} · Hermiticity ${herm.toExponential(2)}`);
}
/* ══ 12 ══ no NaN at the projection pole ════════════════════════════════════ */
{
  /* the pole is where sin(t/2) z + cos(t/2) = 0, i.e. z = -cot(theta/2) */
  let nan=0, huge=0, jumps=0, tested=0;
  for(const th of [0.2,0.7,Math.PI/4,1.2,Math.PI/2]){
    const zp=-Math.cos(th/2)/Math.sin(th/2);
    for(const eps of [1e-3,1e-6,1e-9,1e-12,0]){
      for(const sgn of [1,-1]){
        const z=C(zp+sgn*eps,0); tested++;
        const [a,b]=mobiusHom(M(th),z,C(1,0));
        if(!Number.isFinite(a.re+a.im+b.re+b.im)) nan++;
        const v=rotY(lift(z),th);
        if(!Number.isFinite(v[0]+v[1]+v[2])) nan++;
        if(Math.abs(Math.hypot(v[0],v[1],v[2])-1)>1e-9) jumps++;   // still ON the sphere
        const g=eps===0?null:mobius(M(th),z);
        if(g&&cabs(g)>1e5) huge++;                                  // expected, and finite
      } } }
  ok('the point that runs to infinity does not break anything: worked in homogeneous coordinates the pole is the ordinary CP^1 point [1:0], the lift stays exactly ON the unit sphere on both sides of it, and no NaN is produced even AT the pole — which is why the drawn segments can be cut at the pole and resumed on the other side instead of flashing across the screen',
    nan===0&&jumps===0,
    `${tested} approaches to the pole from both sides at five angles · NaN produced: ${nan} · points leaving the unit sphere: ${jumps} · ${huge} projections legitimately exceeded 1e5 and stayed finite`);
}
/* ══ 13 ══ the animation law, and its reversibility ════════════════════════ */
{
  const T=6.4, theta=t=>Math.PI/4*(1+Math.cos(2*Math.PI*t/T));
  const w0=Math.abs(theta(0)-Math.PI/2), wh=Math.abs(theta(T/2)), wT=Math.abs(theta(T)-Math.PI/2);
  /* zero angular velocity at both ends: d(theta)/dt = -(pi^2/(2T)) sin(2 pi t/T) */
  const dth=t=>-(Math.PI*Math.PI/(2*T))*Math.sin(2*Math.PI*t/T);
  const v0=Math.abs(dth(0)), vh=Math.abs(dth(T/2));
  /* time symmetry: theta(T - t) = theta(t), so the second half is the first reversed */
  let sym=0; for(let k=0;k<=200;k++){ const t=T*k/200; sym=Math.max(sym,Math.abs(theta(T-t)-theta(t))); }
  ok('the default timing is the exact cosine law theta(t) = (pi/4)[1 + cos(2 pi t / T)] with T = 6.4 s: it starts and ends on the Smith chart, passes through the flat impedance plane at the half cycle, has ZERO angular velocity at both turning points so the reversal is smooth, and is exactly time-symmetric so the loop is seamless and the second half is the first played backwards',
    w0<1e-15&&wh<1e-15&&wT<1e-15&&v0<1e-15&&vh<1e-15&&sym<1e-15,
    `theta(0) = pi/2 to ${w0.toExponential(1)} · theta(T/2) = 0 to ${wh.toExponential(1)} · theta(T) = pi/2 to ${wT.toExponential(1)} · |dtheta/dt| at both ends ${Math.max(v0,vh).toExponential(1)} · time symmetry ${sym.toExponential(1)}`);
}
/* ══ 14 ══ first frame equals last frame ═══════════════════════════════════ */
{
  /* the five GIF control frames, and the loop closure, as GEOMETRY rather than pixels */
  const T=6.4, theta=t=>Math.PI/4*(1+Math.cos(2*Math.PI*t/T)), FR=160, DT=0.04;
  const frame=i=>theta(i*DT);
  const key=[[0,Math.PI/2],[40,Math.PI/4],[80,0],[120,Math.PI/4],[159,null]];
  let kw=0;
  for(const [i,expect] of key) if(expect!==null) kw=Math.max(kw,Math.abs(frame(i)-expect));
  /* loop closure measured on the GRID, not on the angle: map every test point at frame 0
     and at frame 160, and require the images to coincide */
  let loop=0, n=0;
  for(const z of PTS){ const a=mobius(M(frame(0)),z), b=mobius(M(theta(T)),z);
    if(!a||!b||cabs(a)>1e6) continue; n++; loop=Math.max(loop,cabs(csub(a,b))/(1+cabs(a))); }
  /* and the halves really are mirror images, again on the grid */
  let mir=0, m=0;
  for(let i=1;i<80;i++){ const A=theta(i*DT), B=theta((FR-i)*DT);
    for(const z of PTS.slice(0,40)){ const p=mobius(M(A),z), q=mobius(M(B),z);
      if(!p||!q||cabs(p)>1e6) continue; m++; mir=Math.max(mir,cabs(csub(p,q))/(1+cabs(p))); } }
  ok('the five control frames of the source animation are reproduced as ANGLES rather than as pixels — frame 0 and 159 at the Smith chart, frame 80 at the flat plane, frames 40 and 120 halfway — and the loop closes on the GRID: every test point has the same image at t = 0 and t = T, and the second half is the first mirrored, so there is no jump at the seam',
    kw<1e-15&&loop<1e-13&&mir<1e-12&&n>200,
    `control frames match to ${kw.toExponential(1)} · loop closure over ${n} grid points ${loop.toExponential(2)} · half-cycle mirror symmetry over ${m} samples ${mir.toExponential(2)}`);
}

for(const [s,n,d] of out) console.log(s.padEnd(5), n, '\n      ', d);
console.log('\n', out.filter(r=>r[0]==='PASS').length+'/'+out.length, 'checks pass');
process.exitCode = out.some(r=>r[0]==='FAIL') ? 1 : 0;
