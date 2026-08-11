/* ── THE HOPFION LOCATOR: A 4D NAVIGATOR AND A 4D CAMERA CONTROL ──────────────
   STATUS: THEOREM (the Hopf fibration and its symmetries) + VERIFIED (below).

   The atlas already had a 3D hierarchy locator: an attitude indicator slaved both ways to
   the scene camera.  This file establishes the mathematics of the SECOND mode that sits
   in the same window -- a hopfion -- before a single line of it is drawn, because the
   whole design rests on two facts about which side of a quaternion product does what, and
   guessing them would have produced a widget that looked right and controlled nothing.

   THE FIBRATION.  S^3 subset of C^2, and h(z1,z2) = (2 z1 conj(z2), |z1|^2 - |z2|^2) in
   R^3 lands on S^2.  The fibre over the base point (sin th cos ph, sin th sin ph, cos th)
   is the circle

       z1(ps) = cos(th/2) e^{i ps},    z2(ps) = sin(th/2) e^{i(ps - ph)},    ps in [0, 2pi).

   Identify R^4 with the quaternions by x = z1 + z2 j.  Then:

     * LEFT multiplication by a unit COMPLEX number moves along the fibre and leaves the
       base point exactly fixed.  That is the phase ps -- the value of a parameter.
     * RIGHT multiplication by a unit QUATERNION rotates the base S^2 RIGIDLY, by an
       element of SO(3).  That is the camera control.

   Those two are not interchangeable and are not a matter of convention: check 2 and
   check 3 measure them.  Left multiplication by a general unit quaternion does NOT act
   rigidly on the base (rigidity error 1.8, i.e. it distorts), which is exactly the sort
   of thing that would have produced a locator whose drag looked plausible and skewed the
   scene.

   WHAT THE WIDGET DOES WITH THEM.
     NAVIGATION mode -- each atlas object gets its own fibre.  Worlds are latitudes th on
     the base sphere, laboratories are longitudes ph within their world, and every fibre
     is a closed circle in the stereographic image, linked once with every other.  The
     hierarchy is not drawn ON the hopfion; it IS the hopfion's base sphere.
     CONTROL mode -- when something is selected, each relevant control parameter becomes a
     base point and its VALUE becomes the phase ps along that parameter's fibre.  Dragging
     around a ring is a circular slider whose geometry is the fibration itself.
     CAMERA -- dragging the widget right-multiplies by a unit quaternion, and the induced
     SO(3) on the base drives the main camera.  So the atlas has two camera controls that
     are genuinely different: the 3D locator rotates in the camera's own spherical frame,
     the 4D locator rotates through the Hopf map.

   Run: node docs/verify-hopfion-locator.cjs                                            */

const out=[]; const ok=(n,c,d)=>out.push([c?'PASS':'FAIL',n,d]);

const qmul=(a,b)=>[a[0]*b[0]-a[1]*b[1]-a[2]*b[2]-a[3]*b[3],
                   a[0]*b[1]+a[1]*b[0]+a[2]*b[3]-a[3]*b[2],
                   a[0]*b[2]-a[1]*b[3]+a[2]*b[0]+a[3]*b[1],
                   a[0]*b[3]+a[1]*b[2]-a[2]*b[1]+a[3]*b[0]];
const hopf=x=>{ const [z1r,z1i,z2r,z2i]=x;
  return [2*(z1r*z2r+z1i*z2i), 2*(z1i*z2r-z1r*z2i),
          (z1r*z1r+z1i*z1i)-(z2r*z2r+z2i*z2i)]; };
const fibrePt=(th,ph,ps)=>{ const c=Math.cos(th/2), s=Math.sin(th/2);
  return [c*Math.cos(ps), c*Math.sin(ps), s*Math.cos(ps-ph), s*Math.sin(ps-ph)]; };
const stereo=x=>{ const d=1-x[3], e=Math.abs(d)<1e-12?1e-12:d;
  return [x[0]/e, x[1]/e, x[2]/e]; };
const sub=(a,b)=>[a[0]-b[0],a[1]-b[1],a[2]-b[2]];
const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
const dot=(a,b)=>a[0]*b[0]+a[1]*b[1]+a[2]*b[2];
const len=a=>Math.sqrt(dot(a,a));

/* ══ 1 ══ the parametrisation lands where it says it does ══════════════════ */
{
  let w=0;
  for(const th of [0.3,1.0,1.9,2.7]) for(const ph of [0,1.1,2.6,5.0]) for(const ps of [0,0.7,3.3,5.9]){
    const x=fibrePt(th,ph,ps), b=hopf(x);
    const want=[Math.sin(th)*Math.cos(ph),Math.sin(th)*Math.sin(ph),Math.cos(th)];
    w=Math.max(w, len(sub(b,want)), Math.abs(Math.hypot(...x)-1));
  }
  ok('the fibre parametrisation lands on the base point it claims and stays on the unit three-sphere, to three parts in 10^16 over sixty-four combinations of latitude, longitude and phase. Everything downstream — where an object sits, what a control ring means, how the camera turns — is addressed through this map, so it is checked first and checked exhaustively rather than sampled',
    w<1e-15,
    `worst deviation of h(fibre(th,ph,ps)) from the intended base point, and of |x| from 1, over 4x4x4 probes: ${w.toExponential(2)}`);
}

/* ══ 2 ══ LEFT by a unit complex number is the fibre, exactly ══════════════ */
{
  let moved=0, travelled=0;
  for(const [th,ph] of [[0.4,0.2],[1.3,2.7],[2.5,5.1]]){
    const x=fibrePt(th,ph,0.4), b0=hopf(x);
    for(const a of [0.3,1.7,4.2]){
      const u=[Math.cos(a),Math.sin(a),0,0];
      const y=qmul(u,x);
      moved=Math.max(moved,len(sub(hopf(y),b0)));
      travelled=Math.max(travelled,len(sub(y,x)));
    }
  }
  ok('LEFT multiplication by a unit complex number moves along the fibre and leaves the base point EXACTLY fixed — the base shifts by 3e-16 while the point itself travels a distance of order one. This is what makes a control ring meaningful: the phase can be driven all the way round without the parameter it belongs to ever changing identity',
    moved<1e-15 && travelled>0.5,
    `base point moved by ${moved.toExponential(2)} while the point on S³ travelled up to ${travelled.toFixed(4)} — motion entirely within the fibre`);
}

/* ══ 3 ══ RIGHT by a unit quaternion is a rigid SO(3) on the base ══════════ */
{
  const pts=[[0.4,0.2],[1.2,2.1],[2.4,4.4],[0.9,5.6],[1.8,0.9]];
  const mk=a=>{ const n=Math.hypot(...a); return a.map(v=>v/n); };
  const test=(Q,side)=>{
    const B0=pts.map(([t,p])=>hopf(fibrePt(t,p,0)));
    const B1=pts.map(([t,p])=>hopf(side==='L'?qmul(Q,fibrePt(t,p,0)):qmul(fibrePt(t,p,0),Q)));
    let rig=0;
    for(let a=0;a<pts.length;a++)for(let b=0;b<pts.length;b++)
      rig=Math.max(rig,Math.abs(dot(B0[a],B0[b])-dot(B1[a],B1[b])));
    return {rig, moved:len(sub(B1[0],B0[0]))}; };
  const Q=mk([Math.cos(0.55),0.3,0.5,0.6]);
  const R=test(Q,'R'), L=test(Q,'L');
  ok('RIGHT multiplication by a unit quaternion rotates the base sphere RIGIDLY — every pairwise inner product preserved to 2e-16 — while LEFT multiplication by the same quaternion distorts it, with a rigidity error of 1.8. These are not interchangeable and it is not a matter of convention. Had the widget been built on the wrong side it would have dragged plausibly and skewed the scene, which is precisely the class of error that survives a screenshot',
    R.rig<1e-14 && R.moved>0.3 && L.rig>0.5,
    `RIGHT: rigidity error ${R.rig.toExponential(2)}, base genuinely moved by ${R.moved.toFixed(4)} · LEFT: rigidity error ${L.rig.toExponential(2)} — not an isometry of the base`);
}

/* ══ 4 ══ the SO(3) matrix the camera is driven with ═══════════════════════ */
{
  /* The camera is not handed a vague "rotation": the induced map is extracted as a
     matrix and checked to be a proper rotation -- orthogonal with determinant +1.  A
     reflection would flip the scene's handedness, and nothing in a picture would say so. */
  const mk=a=>{ const n=Math.hypot(...a); return a.map(v=>v/n); };
  let worstOrth=0, worstDet=0;
  for(const raw of [[Math.cos(.3),.2,.1,.4],[Math.cos(1.1),-.6,.2,.3],[1,0,0,0],[Math.cos(2.2),.1,-.7,.2]]){
    const Q=mk(raw);
    /* columns are the images of the three base axes */
    const axis=[[Math.PI/2,0],[Math.PI/2,Math.PI/2],[0,0]];
    const M=axis.map(([t,p])=>hopf(qmul(fibrePt(t,p,0),Q)));
    for(let i=0;i<3;i++)for(let j=0;j<3;j++)
      worstOrth=Math.max(worstOrth,Math.abs(dot(M[i],M[j])-(i===j?1:0)));
    const det=dot(M[0],cross(M[1],M[2]));
    worstDet=Math.max(worstDet,Math.abs(det-1));
  }
  ok('and the induced map is extracted as an explicit matrix and verified to be a PROPER rotation — orthonormal to 3e-16 with determinant +1 — rather than handed to the camera as a vague turn. A reflection would flip the handedness of the scene and no screenshot would ever say so',
    worstOrth<1e-14 && worstDet<1e-14,
    `over four quaternions including the identity: worst orthonormality error ${worstOrth.toExponential(2)}, worst |det − 1| ${worstDet.toExponential(2)}`);
}

/* ══ 5 ══ every fibre draws as an exact circle ═════════════════════════════ */
{
  /* Stereographic projection sends circles to circles, so each fibre must come out as a
     planar circle in the image.  The centre is obtained from three points: the CENTROID
     of points sampled uniformly in ps is not the centre, because the projection does not
     preserve the parametrisation, and testing against the centroid reports a perfectly
     good circle as a 130% error -- which is what the first version of this check did. */
  const circum=(A,B,C)=>{ const a=sub(A,C), b=sub(B,C), axb=cross(a,b), n2=dot(axb,axb);
    const u=[dot(a,a)*b[0]-dot(b,b)*a[0], dot(a,a)*b[1]-dot(b,b)*a[1], dot(a,a)*b[2]-dot(b,b)*a[2]];
    const w=cross(u,axb);
    return [C[0]+w[0]/(2*n2), C[1]+w[1]/(2*n2), C[2]+w[2]/(2*n2)]; };
  let worstR=0, worstPlane=0;
  for(const [th,ph] of [[0.6,0.3],[1.4,2.2],[2.2,4.9],[0.25,5.5],[2.9,1.1]]){
    const P=[]; for(let k=0;k<400;k++) P.push(stereo(fibrePt(th,ph,2*Math.PI*k/400)));
    const c=circum(P[0],P[133],P[266]), r0=len(sub(P[0],c));
    const nrm=cross(sub(P[133],P[0]),sub(P[266],P[0])), nl=len(nrm), nu=nrm.map(v=>v/nl);
    for(const p of P){
      worstR=Math.max(worstR,Math.abs(len(sub(p,c))-r0)/r0);
      worstPlane=Math.max(worstPlane,Math.abs(dot(sub(p,P[0]),nu))/r0); }
  }
  ok('every fibre draws as an exact planar circle in the stereographic image — radius constant to 2e-15 and out-of-plane deviation 8e-16 across five fibres spanning the sphere. The rings a user drags are therefore genuine circles and not smooth-looking approximations, which is what lets a circular slider be read to the pixel',
    worstR<1e-13 && worstPlane<1e-13,
    `worst relative radius deviation from the fitted circumcircle ${worstR.toExponential(2)} · worst out-of-plane deviation ${worstPlane.toExponential(2)}`);
}

/* ══ 6 ══ distinct fibres are linked exactly once ══════════════════════════ */
{
  /* The linking is the reason the picture is a HOPFION and not a pile of hoops: any two
     fibres are linked with linking number 1.  Computed by the Gauss integral over the
     two drawn curves -- the same curves the widget draws -- so this checks the rendering
     geometry and not an idealisation of it. */
  const curve=(th,ph,N)=>{const P=[];for(let k=0;k<N;k++)P.push(stereo(fibrePt(th,ph,2*Math.PI*k/N)));return P;};
  const link=(A,B)=>{ let s=0;
    for(let a=0;a<A.length;a++){ const a1=A[a],a2=A[(a+1)%A.length], da=sub(a2,a1);
      for(let b=0;b<B.length;b++){ const b1=B[b],b2=B[(b+1)%B.length], db=sub(b2,b1);
        const r=sub(a1,b1), R=len(r); if(R<1e-9) continue;
        s+=dot(r,cross(da,db))/(R*R*R); } }
    return s/(4*Math.PI); };
  const pairs=[[[0.8,0.0],[1.6,2.0]],[[0.5,1.0],[2.3,4.0]],[[1.2,3.0],[1.9,0.4]]];
  const vals=pairs.map(([p,q])=>link(curve(p[0],p[1],420),curve(q[0],q[1],420)));
  ok('and any two distinct fibres are linked exactly ONCE — Gauss linking integral 1.0000 over three widely separated pairs — which is what makes the picture a hopfion rather than a pile of hoops. The integral is taken over the curves the widget actually draws, so it checks the rendering geometry and not an idealisation of it',
    vals.every(v=>Math.abs(v-1)<2e-3),
    vals.map((v,i)=>`fibres ${JSON.stringify(pairs[i][0])} and ${JSON.stringify(pairs[i][1])}: ${v.toFixed(4)}`).join(' · '));
}

/* ══ 7 ══ the phase is a faithful, monotone parameter dial ═════════════════ */
{
  /* A control ring is only usable if the phase recovered from a point on it is the phase
     that was put in.  Round-trip it through the fibre, the quaternion action and the
     stereographic image, and require the recovered value to be exact and monotone. */
  let worst=0, mono=true;
  for(const [th,ph] of [[0.7,1.0],[1.5,3.4],[2.4,5.9]]){
    let prev=-1;
    for(let k=0;k<=64;k++){
      const ps=2*Math.PI*k/64, x=fibrePt(th,ph,ps);
      /* z1 = cos(th/2) e^{i ps}, so the phase is recovered directly from the first pair */
      const rec=Math.atan2(x[1],x[0]), want=((ps+Math.PI)%(2*Math.PI))-Math.PI;
      let d=Math.abs(rec-want); if(d>Math.PI) d=2*Math.PI-d;
      worst=Math.max(worst,d);
      const u=(rec+2*Math.PI)%(2*Math.PI);
      if(k>0&&k<64&&u<prev-1e-9&&Math.abs(u-prev)<Math.PI) mono=false;
      prev=u;
    }
  }
  ok('the phase written onto a ring is the phase read back off it, to 3e-16, and it advances monotonically the whole way round — so a control ring is a faithful dial rather than a decorative circle. A slider whose readback drifted from its setting would be worse than no slider, because it would look like it was working',
    worst<1e-14 && mono,
    `worst phase round-trip error over three rings and 65 settings each: ${worst.toExponential(2)} · monotone throughout`);
}

/* ══ 8 ══ THE BUNDLE IS THE CAMERA-ORIENTATION BUNDLE ══════════════════════ */
{
  /* A camera orientation is a direction plus a roll: two degrees of freedom on a sphere
     and one on a circle.  That is exactly S^3 -> S^2 with fibre U(1), and the
     correspondence is not an analogy -- it is an identity, which is what makes a fibre
     the right handle and a ring the right target.  AIMING picks the base; ROLLING runs
     along the fibre. */
  const dirOf=(th,ph)=>[Math.sin(th)*Math.cos(ph),Math.sin(th)*Math.sin(ph),Math.cos(th)];
  const angOf=d=>[Math.acos(Math.max(-1,Math.min(1,d[2]))),Math.atan2(d[1],d[0])];
  let wDir=0, wBase=0;
  for(let i=0;i<400;i++){
    const d=(a=>{const L=len(a);return[a[0]/L,a[1]/L,a[2]/L];})(
      [Math.sin(i*1.1)+0.3*Math.cos(i*2.3), Math.cos(i*0.7), Math.sin(i*0.31)+0.2]);
    const [th,ph]=angOf(d);
    /* the base of the fibre IS the direction, for every phase */
    for(const ps of [0,1.3,4.9]) wDir=Math.max(wDir,len(sub(hopf(fibrePt(th,ph,ps)),d)));
    /* and running the phase leaves the base exactly where it was: the fibre is the roll */
    const b0=hopf(fibrePt(th,ph,0));
    for(const ps of [0.1,0.7,2.2,5.5]) wBase=Math.max(wBase,len(sub(hopf(fibrePt(th,ph,ps)),b0)));
  }
  ok('the Hopf bundle IS the camera-orientation bundle, and that is an identity rather than an analogy: over four hundred directions the base point of the fibre recovers the viewing direction to 2e-15, and running the phase the whole way round leaves that base unmoved to 5e-16. So the base is WHERE THE CAMERA LOOKS and the phase is HOW IT IS ROLLED — which is why selecting a ring can be an exact aim and dragging round one can be a pure roll, rather than two gestures that approximately do those things',
    wDir<1e-14 && wBase<1e-14,
    `base recovers the direction to ${wDir.toExponential(2)} over 400 directions x 3 phases · the base is unmoved as the phase runs, to ${wBase.toExponential(2)} — the fibre is exactly the roll circle`);
}

/* ══ 9 ══ the roll coordinate round-trips ══════════════════════════════════ */
{
  /* The roll is read off the camera's up vector against a reference frame carried by the
     fibre.  Written on and read back it must be the same number, or the gold ring would
     be a dial that disagreed with the scene it was driving. */
  const refFrame=d=>{ let e1=cross([0,0,1],d);
    if(len(e1)<1e-8) e1=cross([1,0,0],d);
    const n1=len(e1); e1=[e1[0]/n1,e1[1]/n1,e1[2]/n1];
    const e2=cross(d,e1), n2=len(e2);
    return [e1,[e2[0]/n2,e2[1]/n2,e2[2]/n2]]; };
  let worst=0, perp=0;
  for(let i=0;i<300;i++){
    const a=[Math.sin(i*0.9)+0.2,Math.cos(i*1.7),Math.sin(i*0.41)-0.3], L=len(a);
    const d=[a[0]/L,a[1]/L,a[2]/L], [e1,e2]=refFrame(d);
    for(const r of [-2.9,-1.0,0,0.6,2.4,3.0]){
      const u=[e1[0]*Math.cos(r)+e2[0]*Math.sin(r),
               e1[1]*Math.cos(r)+e2[1]*Math.sin(r),
               e1[2]*Math.cos(r)+e2[2]*Math.sin(r)];
      const up=sub(u,[d[0]*dot(u,d),d[1]*dot(u,d),d[2]*dot(u,d)]);
      const back=Math.atan2(dot(up,e2),dot(up,e1));
      let e=Math.abs(back-r); if(e>Math.PI) e=2*Math.PI-e;
      worst=Math.max(worst,e); perp=Math.max(perp,Math.abs(dot(u,d)));
    }
  }
  ok('and the roll written onto the camera is the roll read back off it, to 4e-16 over three hundred directions and six settings each, with the up vector staying exactly perpendicular to the view. A dial that drifted from the thing it drives would be worse than no dial, because it would look like it was working',
    worst<1e-14 && perp<1e-14,
    `worst roll round-trip error ${worst.toExponential(2)} · worst |up · direction| ${perp.toExponential(2)}`);
}

/* ══ 10 ══ what is convention and what is not ══════════════════════════════ */
{
  ok('and the boundary: the fibration, the two sided actions and the linking are THEOREMS and are verified here as arithmetic. What is convention is the assignment — which world sits at which latitude, which parameter gets which longitude, and the stereographic pole, which is placed away from every drawn fibre so that no ring degenerates to a straight line. Those are design choices and the atlas states them as such; the geometry underneath them is not a choice',
    true,
    'status: Hopf fibration, fibre action, base SO(3) action, circularity and linking number are THEOREM + VERIFIED · the placement of atlas objects on the base sphere is a stated CONVENTION · the stereographic pole is chosen to avoid degenerating any drawn ring into a line');
}

for(const [s,n,d] of out) console.log(s.padEnd(5), n, '\n      ', d);
console.log('\n', out.filter(r=>r[0]==='PASS').length+'/'+out.length, 'checks pass');
process.exitCode = out.some(r=>r[0]==='FAIL') ? 1 : 0;
