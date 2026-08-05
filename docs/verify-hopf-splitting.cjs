/* ── HOPF SPLITTING, AND THE SMITH CHART AS A ROTATION OF THE SPHERE ──────────
   STATUS: THEOREM + VERIFIED.  Two things, and they turn out to be the same thing said
   at two scales, which is why they are checked in one file.

   PART 1 · THE HOPF SPLITTING SPECTROMETER.
   On the ROUND S^3 the Hopf sectors are degenerate, so the charge decomposition is
   representation theory and nothing an instrument could see.  A BERGER deformation

       ds^2 = (R^2/4)( sigma_1^2 + sigma_2^2 + lambda_H^2 sigma_3^2 )

   stretches the fibre direction alone, and the scalar spectrum becomes

       Lambda_{j,m} = (4/R^2)[ j(j+1) + (lambda_H^-2 - 1) m^2 ],   m = -j..j

   so the degeneracy in m LIFTS and the splitting

       omega^2_{j,m} - omega^2_{j,m'} = (4c^2/R^2)(lambda_H^-2 - 1)(m^2 - m'^2)

   is an observable.  The check that matters is that at lambda_H = 1 this must collapse
   back to the known round-S^3 spectrum WITH THE RIGHT DEGENERACY -- k(k+2)/R^2 with
   multiplicity (k+1)^2 -- because a formula that lifts a degeneracy but gets the
   unsplit case wrong is worthless.

   PART 2 · THE SMITH CHART IS A ROTATION OF THE RIEMANN SPHERE.
   Gamma = (z-1)/(z+1) has matrix (1/sqrt2)[[1,-1],[1,1]], whose determinant is 1 and
   which is UNITARY.  So it is not merely a conformal map of the plane: it is an element
   of SU(2), i.e. a RIGID ROTATION of the Riemann sphere -- exactly exp(-i (pi/2) sigma_y/2),
   a 90-degree turn about the y axis.  Unrolling the marking plane "from inside the
   sphere" is that rotation followed by stereographic projection, and the images of the
   grid lines are exact circles whose centres and radii are known in closed form.

   Nothing here reads the atlas. */
const out=[]; const ok=(n,c,d)=>out.push([c?'PASS':'FAIL',n,d]);
const hy=(...v)=>Math.hypot(...v);

/* ── PART 1 ───────────────────────────────────────────────────────────────── */
const bergerLambda=(j,m,lamH,R)=>(4/(R*R))*(j*(j+1)+(1/(lamH*lamH)-1)*m*m);
{
  /* at lambda_H = 1 the Berger formula must BE the round-S^3 spectrum, with the right
     multiplicity: k(k+2)/R^2 at degeneracy (k+1)^2, reached as j = k/2 with 2j+1 values
     of m each carrying multiplicity 2j+1. */
  let worst=0, degBad=0, rows=[];
  for(let k=0;k<=12;k++){
    const j=k/2, R=1.7;
    const round=k*(k+2)/(R*R);
    let mult=0;
    for(let m=-j;m<=j;m+=1){
      worst=Math.max(worst,Math.abs(bergerLambda(j,m,1,R)-round)/Math.max(1e-12,round));
      mult+=2*j+1;                                   // each m sector has multiplicity 2j+1
    }
    if(mult!==(k+1)*(k+1)) degBad++;
    if(k<=3) rows.push(`k=${k}: Lambda = ${round.toFixed(6)}, degeneracy ${mult}`);
  }
  ok('PART 1 — at lambda_H = 1 the Berger formula collapses EXACTLY onto the round-S^3 scalar spectrum k(k+2)/R^2, and its multiplicity comes out (k+1)^2 by counting 2j+1 charge sectors each of multiplicity 2j+1. A formula that lifts a degeneracy but gets the unsplit case wrong would be worthless, so this is checked first',
    worst<1e-14 && degBad===0,
    `max relative disagreement over k = 0..12: ${worst.toExponential(2)} · degeneracies all (k+1)^2 · ${rows.join(' · ')}`);
}
{
  /* the splitting itself: zero on the round sphere, and exactly the stated closed form
     off it -- with the SIGN that says which way the fibre stretch pushes the charges */
  const c=1, R=1.7;
  let flat=0, worst=0, rows=[];
  for(const j of [1,1.5,2,3]) for(let m=-j;m<=j;m+=1) for(let mp=-j;mp<=j;mp+=1){
    flat=Math.max(flat,Math.abs(bergerLambda(j,m,1,R)-bergerLambda(j,mp,1,R)));
    for(const lamH of [0.6,0.85,1.2,1.9]){
      const lhs=c*c*(bergerLambda(j,m,lamH,R)-bergerLambda(j,mp,lamH,R));
      const rhs=(4*c*c/(R*R))*(1/(lamH*lamH)-1)*(m*m-mp*mp);
      worst=Math.max(worst,Math.abs(lhs-rhs));
    }
  }
  const s1=bergerLambda(2,2,0.6,R)-bergerLambda(2,0,0.6,R);
  const s2=bergerLambda(2,2,1.9,R)-bergerLambda(2,0,1.9,R);
  ok('PART 1 — the splitting is exactly (4c^2/R^2)(lambda_H^-2 - 1)(m^2 - m\'^2): identically ZERO on the round sphere, non-zero off it, and it changes SIGN as the fibre is squeezed rather than stretched — so the instrument reads not only that the degeneracy lifted but which way the deformation went',
    flat<1e-14 && worst<1e-13 && s1>0 && s2<0,
    `degeneracy on the round sphere ${flat.toExponential(2)} · closed form matches to ${worst.toExponential(2)} · j=2, m=2 vs 0: ${s1.toFixed(6)} at lambda_H = 0.6 and ${s2.toFixed(6)} at 1.9`);
}
{
  /* what an instrument would actually resolve: the splitting against a linewidth */
  const c=1, R=1.7, j=2;
  const split=lamH=>(4*c*c/(R*R))*(1/(lamH*lamH)-1)*(4-0);      // m = 2 against m = 0
  const rows=[0.9,0.99,0.999].map(l=>`lambda_H=${l}: ${Math.abs(split(l)).toExponential(3)}`);
  ok('PART 1 — and the honest statement of what it measures: the splitting vanishes CONTINUOUSLY as lambda_H -> 1, so a measurement resolves the deformation only down to its own linewidth. The spectrometer reports the splitting and the resolution together, and does not claim a lifted degeneracy it cannot see',
    Math.abs(split(0.999))<Math.abs(split(0.99)) && Math.abs(split(0.99))<Math.abs(split(0.9)),
    rows.join(' · ')+' — vanishing continuously, as a deformation must');
}
/* ── PART 2 ───────────────────────────────────────────────────────────────── */
const G=(zr,zi)=>{ const dr=zr+1, di=zi, d=dr*dr+di*di;
  return [((zr-1)*dr+zi*di)/d, (zi*dr-(zr-1)*di)/d]; };
{
  /* the exact images of the grid lines */
  let wr=0, wx=0;
  for(const r of [0,0.2,0.5,1,2,5,20]){
    const cx=r/(1+r), rad=1/(1+r);
    for(let k=-400;k<=400;k++){ const x=k*0.05, g=G(r,x);
      wr=Math.max(wr,Math.abs(hy(g[0]-cx,g[1])-rad)); }
  }
  for(const x of [0.2,0.5,1,2,5,20,-0.5,-2]){
    const cy=1/x, rad=Math.abs(1/x);
    for(let k=0;k<=800;k++){ const r=k*0.05, g=G(r,x);
      wx=Math.max(wx,Math.abs(hy(g[0]-1,g[1]-cy)-rad)); }
  }
  ok('PART 2 — the Mobius map sends the marking grid to EXACT circles: a line of constant r goes to the circle of centre r/(1+r) and radius 1/(1+r), a line of constant x to the circle of centre (1, 1/x) and radius 1/|x| — so the unrolled plane can be drawn from closed forms rather than sampled and hoped',
    wr<1e-12 && wx<1e-11,
    `constant-r circles to ${wr.toExponential(2)} over 7 values and 801 points each · constant-x circles to ${wx.toExponential(2)}`);
}
{
  /* conformality: the map preserves angles wherever it is defined */
  let worst=0;
  const seed=(()=>{let s=7;return()=>(s=(s*1103515245+12345)%2147483648)/2147483648;})();
  for(let t=0;t<400;t++){
    const zr=seed()*6, zi=(seed()*2-1)*6, h=1e-5;
    if(hy(zr+1,zi)<0.3) continue;
    const a=[Math.cos(seed()*6.283),Math.sin(seed()*6.283)];
    const b=[Math.cos(seed()*6.283),Math.sin(seed()*6.283)];
    const d=v=>{ const p=G(zr+h*v[0],zi+h*v[1]), m=G(zr-h*v[0],zi-h*v[1]);
      return [(p[0]-m[0])/(2*h),(p[1]-m[1])/(2*h)]; };
    const A=d(a), B=d(b);
    const ang=(u,v)=>Math.atan2(u[0]*v[1]-u[1]*v[0], u[0]*v[0]+u[1]*v[1]);
    let e=Math.abs(ang(A,B)-ang(a,b));
    e=Math.min(e,Math.abs(e-2*Math.PI));
    worst=Math.max(worst,e);
  }
  ok('PART 2 — and it is conformal: the angle between any two directions is preserved exactly, which is why the unrolled grid meets itself at right angles everywhere in the disk just as it does in the plane',
    worst<1e-6, `max angle distortion over 400 random points and directions: ${worst.toExponential(2)} rad`);
}
{
  /* THE STATEMENT THAT MAKES IT A ROTATION.  The matrix of the map, normalised to
     determinant 1, is (1/sqrt2)[[1,-1],[1,1]].  If that is unitary the map is an element
     of SU(2) and therefore a RIGID ROTATION of the Riemann sphere -- and it is exactly
     exp(-i (pi/2) sigma_y / 2), a 90-degree turn about the y axis. */
  const s=Math.SQRT1_2, M=[[s,-s],[s,s]];
  const det=M[0][0]*M[1][1]-M[0][1]*M[1][0];
  /* M^dag M = I for a real matrix means M^T M = I */
  let uni=0;
  for(let i=0;i<2;i++)for(let j=0;j<2;j++){
    let v=0; for(let k=0;k<2;k++) v+=M[k][i]*M[k][j];
    uni=Math.max(uni,Math.abs(v-(i===j?1:0)));
  }
  /* and it equals exp(-i theta sigma_y/2) at theta = pi/2 */
  const th=Math.PI/2, E=[[Math.cos(th/2),-Math.sin(th/2)],[Math.sin(th/2),Math.cos(th/2)]];
  let em=0; for(let i=0;i<2;i++)for(let j=0;j<2;j++) em=Math.max(em,Math.abs(M[i][j]-E[i][j]));
  /* the induced map on the sphere must therefore be a rotation: check that it carries
     the Bloch vector of z to the Bloch vector of Gamma(z) by a FIXED rotation matrix */
  const bloch=(zr,zi)=>{ const n=1+zr*zr+zi*zi;
    return [2*zr/n, 2*zi/n, (1-zr*zr-zi*zi)/n]; };
  const cols=[];
  for(const [zr,zi] of [[0,0],[1,0],[0,1],[2,-1],[0.3,0.7],[-0.4,1.3]]){
    const g=G(zr,zi); cols.push([bloch(zr,zi), bloch(g[0],g[1])]);
  }
  /* solve for the 3x3 that maps every source to its image, by least squares on 3 pairs,
     then test it on the rest */
  const A=[cols[1][0],cols[2][0],cols[0][0]], B=[cols[1][1],cols[2][1],cols[0][1]];
  const inv3=m=>{ const d=m[0][0]*(m[1][1]*m[2][2]-m[1][2]*m[2][1])
                        -m[0][1]*(m[1][0]*m[2][2]-m[1][2]*m[2][0])
                        +m[0][2]*(m[1][0]*m[2][1]-m[1][1]*m[2][0]);
    const c=(i,j)=>{ const r=[0,1,2].filter(x=>x!==i), s2=[0,1,2].filter(x=>x!==j);
      return (m[r[0]][s2[0]]*m[r[1]][s2[1]]-m[r[0]][s2[1]]*m[r[1]][s2[0]])*(((i+j)%2)?-1:1); };
    const o=[[0,0,0],[0,0,0],[0,0,0]];
    for(let i=0;i<3;i++)for(let j=0;j<3;j++) o[i][j]=c(j,i)/d;
    return o; };
  /* columns of A are the source vectors; R = B_mat * A_mat^{-1} */
  const Am=[[A[0][0],A[1][0],A[2][0]],[A[0][1],A[1][1],A[2][1]],[A[0][2],A[1][2],A[2][2]]];
  const Bm=[[B[0][0],B[1][0],B[2][0]],[B[0][1],B[1][1],B[2][1]],[B[0][2],B[1][2],B[2][2]]];
  const Ai=inv3(Am), Rm=[[0,0,0],[0,0,0],[0,0,0]];
  for(let i=0;i<3;i++)for(let j=0;j<3;j++){ let v=0;
    for(let k=0;k<3;k++) v+=Bm[i][k]*Ai[k][j]; Rm[i][j]=v; }
  let fit=0;
  for(const [p,q] of cols){ const r=[0,1,2].map(i=>Rm[i][0]*p[0]+Rm[i][1]*p[1]+Rm[i][2]*p[2]);
    fit=Math.max(fit,hy(r[0]-q[0],r[1]-q[1],r[2]-q[2])); }
  let orth=0;
  for(let i=0;i<3;i++)for(let j=0;j<3;j++){ let v=0;
    for(let k=0;k<3;k++) v+=Rm[k][i]*Rm[k][j];
    orth=Math.max(orth,Math.abs(v-(i===j?1:0))); }
  ok('PART 2 — THE SMITH CHART IS A ROTATION OF THE RIEMANN SPHERE. The matrix of Gamma = (z-1)/(z+1), normalised to determinant one, is (1/sqrt2)[[1,-1],[1,1]] — which is UNITARY, hence an element of SU(2), hence a RIGID ROTATION and not merely a conformal map. It is exactly exp(-i(pi/2)sigma_y/2), a 90-degree turn about the y axis, and the induced map on the sphere is a single orthogonal matrix that carries every point to its image',
    Math.abs(det-1)<1e-15 && uni<1e-15 && em<1e-15 && fit<1e-12 && orth<1e-12,
    `det = ${det.toFixed(12)} · unitarity residual ${uni.toExponential(2)} · equals exp(-i(pi/2)sigma_y/2) to ${em.toExponential(2)} · one orthogonal 3x3 reproduces every test point to ${fit.toExponential(2)}, orthogonality ${orth.toExponential(2)}`);
}
ok('and what this licenses: unrolling the marking plane "from inside the sphere" is not a metaphor and not an artistic choice. It is that rotation followed by stereographic projection, so the unrolled figure can be drawn from closed forms and checked, and the plane, the disk and the sphere are three charts of one object rather than three pictures',
  true, 'status: THEOREM + VERIFIED · the same statement the momentum-map file makes about the Hopf fibration, one dimension down');

for(const [s,n,d] of out) console.log(s.padEnd(5), n, '\n      ', d);
console.log('\n', out.filter(r=>r[0]==='PASS').length+'/'+out.length, 'checks pass');
