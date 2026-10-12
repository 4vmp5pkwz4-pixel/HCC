/* THE MAHLER VOLUME PRODUCT (v4.380) — family 087 of openai/math — repository verifier on the page's own kernels (core/atlas/extracted.mjs, sliced from index.html). */
/* The Mahler volume product (family 087 of openai/math) — checks on the laboratory's own kernels, fixed seeds.
   Exact values are classical (Γ at 1/2, 1/3, 1/4; ball volumes; 32/3, 64/9, (4π/3)², (4/3)m² sin²(π/m) for prisms);
   the random surveys are measured and reported, asserted only against theorems in ℝ³ (Iriyeh–Shibata, Blaschke–Santaló)
   and, for general polytopes, against the bound 64/9 that the collection claims. */
const K=await import(new URL('../core/atlas/extracted.mjs',import.meta.url));
let pass=0, fail=0; const t00=performance.now();
const ok=(claim,cond,nums)=>{ if(cond){ pass++; console.log('PASS — '+claim+' :: '+nums); } else { fail++; console.log('FAIL — '+claim+' :: '+nums); } };
const ms=t=>(performance.now()-t).toFixed(1)+' ms';
const rel=(a,b)=>Math.abs(a/b-1), e2=x=>x.toExponential(2), f6=x=>x.toFixed(6);
const M32=32/3, M64=64/9, SANT=(4*Math.PI/3)**2;
const vtx=P=>P.verts.map(v=>P.pts[v]);
const sameSet=(A,B,tol)=>{ if(A.length!==B.length) return false; const used=new Uint8Array(B.length);
  for(const a of A){ let j=-1; for(let k=0;k<B.length;k++){ if(!used[k]&&Math.abs(a[0]-B[k][0])<=tol&&Math.abs(a[1]-B[k][1])<=tol&&Math.abs(a[2]-B[k][2])<=tol){ j=k; break; } } if(j<0) return false; used[j]=1; } return true; };
const affine=(pts,A,b)=>pts.map(p=>[A[0]*p[0]+A[1]*p[1]+A[2]*p[2]+b[0],A[3]*p[0]+A[4]*p[1]+A[5]*p[2]+b[1],A[6]*p[0]+A[7]*p[1]+A[8]*p[2]+b[2]]);
const randMat=r=>{ for(;;){ const A=Array.from({length:9},()=>K.mhGauss(r)), d=A[0]*(A[4]*A[8]-A[5]*A[7])-A[1]*(A[3]*A[8]-A[5]*A[6])+A[2]*(A[3]*A[7]-A[4]*A[6]); if(Math.abs(d)>0.3) return A; } };
/* hull validity: closed oriented triangulation (every directed edge once, its twin present), Euler V − E + F = 2,
   every input point on the inner side of every face within 10⁻⁹ of the size, nothing skipped */
const hullCheck=pts=>{ const H=K.mhHull(pts); if(!H) return {good:false, why:'null'}; const N=H.N, T=H.tris.length/3, E=new Set(); let dup=false;
  for(let t=0;t<T;t++) for(let e=0;e<3;e++){ const k=H.tris[3*t+e]*N+H.tris[3*t+(e+1)%3]; if(E.has(k)) dup=true; E.add(k); }
  let closed=true; for(const k of E){ const u=Math.floor(k/N), v=k%N; if(!E.has(v*N+u)) closed=false; }
  const V=new Set(H.tris).size, euler=V-E.size/2+T; let out=-Infinity;
  for(let i=0;i<N;i++) for(let t=0;t<T;t++) out=Math.max(out,H.nrm[3*t]*H.X[i]+H.nrm[3*t+1]*H.Y[i]+H.nrm[3*t+2]*H.Z[i]-H.off[t]);
  return {good:!dup&&closed&&euler===2&&out<=1e-9*H.scale&&H.skipped===0, V, T, euler, out:out/H.scale, skipped:H.skipped}; };

/* 1 · Lanczos Γ against classical values */
{ const G=[[0.5,Math.sqrt(Math.PI)],[1.5,Math.sqrt(Math.PI)/2],[5,24],[1/3,2.6789385347077476337],[0.25,3.6256099082219083119],[7.5,1871.2543057977883]]; let mx=0; for(const [x,v] of G) mx=Math.max(mx,rel(K.mhGamma(x),v));
  ok('Lanczos Γ: Γ(1/2) = √π, Γ(3/2) = √π/2, Γ(5) = 24, Γ(1/3) = 2.6789385347…, Γ(1/4) = 3.6256099082…, Γ(15/2) = 135135√π/128', mx<1e-13, 'max relative error '+e2(mx)); }
/* 2 · ℓ_p ball volumes */
{ const v=K.mhLpVol(3,2); ok('|B₂³| = 4π/3', rel(v,4*Math.PI/3)<1e-14, v.toFixed(15)+' vs '+(4*Math.PI/3).toFixed(15));
  const ball=[2,Math.PI,4*Math.PI/3,Math.PI**2/2,8*Math.PI**2/15,Math.PI**3/6,16*Math.PI**3/105,Math.PI**4/24]; let m1=0, m2=0, m3=0;
  for(let n=1;n<=8;n++){ m1=Math.max(m1,rel(K.mhLpVol(n,1),2**n/K.mhFact(n))); m2=Math.max(m2,rel(K.mhLpVol(n,Infinity),2**n)); m3=Math.max(m3,rel(K.mhLpVol(n,2),ball[n-1])); }
  ok('|B₁ⁿ| = 2ⁿ/n!, |B_∞ⁿ| = 2ⁿ, |B₂ⁿ| = π^{n/2}/Γ(n/2+1) (2, π, 4π/3, π²/2, 8π²/15, π³/6, 16π³/105, π⁴/24), n = 1…8', Math.max(m1,m2,m3)<1e-13, 'max rel err '+[m1,m2,m3].map(e2).join(' · '));
  let mc=0; for(const p of [1.1,1.5,3,7.25]) mc=Math.max(mc,rel(K.mhLpVol(3,1e9*p)/8,1)); ok('|B_pⁿ| → 2ⁿ as p → ∞ (continuity at the cube)', mc<1e-8, 'max rel gap at p ~ 10⁹: '+e2(mc)); }
/* 3 · the ℓ_p volume product */
{ const P=K.mhPlp(3,2); ok('mhPlp(3, 2) = |B₂³|² = (4π/3)² — the Blaschke–Santaló maximum', rel(P,SANT)<1e-13, P.toFixed(12)+' vs '+SANT.toFixed(12));
  let mx=0; const rows=[]; for(let n=2;n<=8;n++){ const a=K.mhPlp(n,1), b=K.mhPlp(n,Infinity), w=K.mhMahlerSym(n); mx=Math.max(mx,Math.abs(a-w),Math.abs(b-w)); rows.push('n='+n+': '+a.toFixed(10)); }
  ok('mhPlp(n, 1) = mhPlp(n, ∞) = 4ⁿ/n! for n = 2…8 (cube and cross-polytope, Hanner)', mx<1e-10, rows.join(' · ')+' · max |err| '+e2(mx));
  let lo=Infinity, hi=-Infinity, sym=0, arg=true; const peaks=[];
  for(let n=2;n<=8;n++){ const w=K.mhMahlerSym(n), S=K.mhSantaloMax(n); let best=-1, bi=-1;
    for(let k=0;k<=400;k++){ const u=k/400, p=K.mhPofU(u), v=K.mhPlp(n,p); lo=Math.min(lo,v/w); hi=Math.max(hi,v/S); if(v>best){ best=v; bi=k; } sym=Math.max(sym,rel(v,K.mhPlp(n,K.mhPofU(1-u)))); }
    if(bi!==200) arg=false; peaks.push('n='+n+': '+(best/w).toFixed(4)); }
  ok('4ⁿ/n! ≤ mhPlp(n, p) ≤ |Bⁿ|² on 401 values of u = 1 − 1/p ∈ [0, 1], n = 2…8 (unconditional bodies: Saint-Raymond; Blaschke–Santaló)', lo>=1-1e-12&&hi<=1+1e-12, 'min P/(4ⁿ/n!) = '+lo.toFixed(12)+' · max P/|Bⁿ|² = '+hi.toFixed(12));
  ok('the ℓ_p product is symmetric under p ↔ q (u ↔ 1 − u) and peaks exactly at p = 2 (the only ellipsoid among ℓ_p balls)', sym<1e-12&&arg, 'max asymmetry '+e2(sym)+' · peaks P/(4ⁿ/n!): '+peaks.join(' · '));
  ok('n = 3: (4π/3)²/(32/3) = π²/6', rel(SANT/M32,Math.PI**2/6)<1e-14, (SANT/M32).toFixed(12)+' vs '+(Math.PI**2/6).toFixed(12)); }
/* 4 · the hull itself */
{ const r=K.mhRng(4242), clouds=[], t=performance.now();
  const cube=[]; for(let i=0;i<400;i++) cube.push([2*r()-1,2*r()-1,2*r()-1]); clouds.push(['400 uniform in a cube',cube]);
  const gs=[]; for(let i=0;i<400;i++) gs.push([K.mhGauss(r),K.mhGauss(r),K.mhGauss(r)]); clouds.push(['400 Gaussian',gs]);
  clouds.push(['400 on a sphere (all extreme)',gs.map(p=>{ const l=Math.hypot(...p); return [p[0]/l,p[1]/l,p[2]/l]; })]);
  const lat=[]; for(let i=0;i<5;i++) for(let j=0;j<5;j++) for(let k=0;k<5;k++) lat.push([i/2-1,j/2-1,k/2-1]); clouds.push(['5³ lattice (coplanar, collinear)',lat]);
  clouds.push(['the lattice, every point three times',[...lat,...lat,...lat]]);
  for(const p of [1,1.0001,1.5,2,4,1e4,Infinity]) clouds.push(['ℓ_p sampling p = '+p+' (866 points)',K.mhLpPts(p,6)]);
  clouds.push(['random symmetric, 40 points',K.mhRandSymPts(9,20)]);
  const res=clouds.map(([n,c])=>[n,hullCheck(c)]); const bad=res.filter(x=>!x[1].good);
  ok('convex hull: closed oriented triangulation, Euler V − E + F = 2, every point inside within 10⁻⁹, nothing skipped — '+res.length+' clouds incl. coplanar lattices, duplicates, ℓ_p at p = 1, 1.0001, ∞', bad.length===0,
    res.map(([n,h])=>n+': V '+h.V+' T '+h.T+' out '+e2(h.out)).join(' · ')+(bad.length?' · BAD: '+bad.map(x=>x[0]+' '+JSON.stringify(x[1])).join(' | '):'')+' · '+ms(t));
  const L=K.mhPolytope(lat), Q=K.mhPolar(L);
  ok('the 5³ lattice hull is the cube: 8 vertices, 12 edges, 6 facets, volume 8, polar volume 4/3', L.verts.length===8&&L.edges.length/4===12&&L.F===6&&rel(L.vol,8)<1e-14&&rel(Q.vol,4/3)<1e-14, 'V '+L.verts.length+' E '+L.edges.length/4+' F '+L.F+' vol '+L.vol+' polar '+Q.vol); }
/* 5 · cube and octahedron — the Hanner pair of ℝ³ */
{ const t=performance.now(), C=K.mhPolytope(K.mhCubePts()), O=K.mhPolytope(K.mhOctaPts()), Cp=K.mhPolar(C), Op=K.mhPolar(O), pc=C.vol*Cp.vol, po=O.vol*Op.vol;
  ok('|cube|·|cube°| = |octahedron|·|octahedron°| = 32/3 = 4³/3!', Math.abs(pc-M32)<1e-12&&Math.abs(po-M32)<1e-12, pc.toFixed(15)+' · '+po.toFixed(15)+' · '+ms(t));
  ok('the polar of the cube is the octahedron and the polar of the octahedron is the cube (vertex sets)', sameSet(vtx(Cp),K.mhOctaPts(),1e-12)&&sameSet(vtx(Op),K.mhCubePts(),1e-12), 'cube° '+Cp.verts.length+' vertices · octahedron° '+Op.verts.length+' vertices');
  const r=K.mhRng(77); let mx=0; for(let k=0;k<20;k++){ const A=randMat(r), P=K.mhPolytope(affine(K.mhCubePts(),A,[0,0,0])), Q=K.mhPolar(P); mx=Math.max(mx,Math.abs(P.vol*Q.vol-M32)); }
  ok('linear invariance: 20 random linear images of the cube (parallelepipeds) give 32/3', mx<1e-11, 'max |P − 32/3| = '+e2(mx)); }
/* 6 · prisms and double cones over regular m-gons: (A × B)° = A° ⊕ B°, |A ⊕ B| = (a!b!/(a+b)!)|A||B| */
{ const t=performance.now(); let mx=0, ms0=0; const rows=[];
  for(let m=3;m<=24;m++){ const w=K.mhPrismProduct(m), P=K.mhPolytope(K.mhPrismPts(m,0.8)), C=K.mhPolytope(K.mhConePts(m,1.7)), a=K.mhSantalo(P,[0.05,-0.03,0.04]), b=K.mhSantalo(C,[-0.02,0.04,0.03]);
    mx=Math.max(mx,rel(a.prod,w),rel(b.prod,w)); ms0=Math.max(ms0,Math.hypot(...a.s),Math.hypot(...b.s)); if(m<=8||m===24) rows.push('m='+m+': '+a.prod.toFixed(9)); }
  ok('prism and double cone over the regular m-gon, m = 3…24, polar about the Santaló point: (4/3)·m²·sin²(π/m) (9 at m = 3, 32/3 at m = 4, 12 at m = 6)', mx<1e-10&&ms0<1e-9, rows.join(' · ')+' · max rel err '+e2(mx)+' · Santaló point found at the centre to '+e2(ms0)+' · '+ms(t));
  ok('m → ∞: the cylinder and the double cone over the disc, (4/3)π² < (4π/3)²', rel(K.mhPrismProduct(1e6),4*Math.PI**2/3)<1e-10, 'm = 10⁶: '+K.mhPrismProduct(1e6).toFixed(9)+' vs (4/3)π² = '+(4*Math.PI**2/3).toFixed(9)); }
/* 7 · the regular simplex: Santaló point = centroid, product 64/9 = (n+1)^{n+1}/(n!)² */
{ const t=performance.now(), P=K.mhPolytope(K.mhSimplexPts()), S=K.mhSantalo(P,[0.31,-0.22,0.17]);
  ok('regular simplex: Newton from (0.31, −0.22, 0.17) finds the centroid, product 4⁴/36 = 64/9', Math.hypot(...S.s)<1e-9&&Math.abs(S.prod-M64)<1e-9&&rel(K.mhMahlerGen(3),M64)<1e-15, 'product '+S.prod.toFixed(12)+' vs '+M64.toFixed(12)+' · |s| = '+e2(Math.hypot(...S.s))+' · '+S.iters+' Newton steps · '+ms(t));
  const r=K.mhRng(31); let mx=0, mxs=0;
  for(let k=0;k<20;k++){ const A=randMat(r), b=[K.mhGauss(r),K.mhGauss(r),K.mhGauss(r)], Q=K.mhPolytope(affine(K.mhSimplexPts(),A,b)), R=K.mhSantalo(Q); mx=Math.max(mx,Math.abs(R.prod-M64)); mxs=Math.max(mxs,Math.hypot(R.s[0]-b[0],R.s[1]-b[1],R.s[2]-b[2])/Q.scale); }
  ok('affine invariance: 20 random affine images of the simplex give 64/9, the Santaló point is the image of the centroid', mx<1e-9&&mxs<1e-9, 'max |P − 64/9| = '+e2(mx)+' · max |s − Ab|/size = '+e2(mxs));
  let mt=0; for(let seed=1;seed<=20;seed++){ const Q=K.mhPolytope(K.mhRandGenPts(seed,4)); mt=Math.max(mt,Math.abs(K.mhSantalo(Q).prod-M64)); }
  ok('20 random tetrahedra (every tetrahedron is an affine simplex) give 64/9 — the general equality case', mt<1e-9, 'max |P − 64/9| = '+e2(mt)); }
/* 8 · Santaló machinery: dual triangulation, exact gradient and Hessian */
{ const P=K.mhPolytope(K.mhRandGenPts(5,25)), c=P.cen, s=[c[0]+0.05*P.scale,c[1]-0.03*P.scale,c[2]+0.02*P.scale], R=K.mhPolarAt(P,s,true), Q=K.mhPolar(P,s);
  ok('F(s) = |(K − s)°| on the dual triangulation equals the hull volume of the polar points', rel(R.F,Q.vol)<1e-12, R.F.toFixed(12)+' vs '+Q.vol.toFixed(12));
  const h=1e-6*P.scale; let eg=0, eh=0; const gn=Math.hypot(...R.g), Hn=Math.hypot(...R.H);
  for(let i=0;i<3;i++){ const sp=s.slice(), sm=s.slice(); sp[i]+=h; sm[i]-=h; const A=K.mhPolarAt(P,sp,true), B=K.mhPolarAt(P,sm,true); eg=Math.max(eg,Math.abs((A.F-B.F)/(2*h)-R.g[i])/gn);
    for(let j=0;j<3;j++) eh=Math.max(eh,Math.abs((A.g[j]-B.g[j])/(2*h)-R.H[3*i+j])/Hn); }
  ok('∇F = Σ_T vol(T)(a+b+c) and ∇²F = Σ_T vol(T)[(a+b+c)(a+b+c)ᵀ + aaᵀ + bbᵀ + ccᵀ] against central differences', eg<1e-6&&eh<1e-6, 'gradient rel err '+e2(eg)+' · Hessian rel err '+e2(eh)); }
/* 8b · centre of mass and whitening */
{ const r=K.mhRng(55); let mc=0; for(let k=0;k<10;k++){ const A=randMat(r), b=[K.mhGauss(r),K.mhGauss(r),K.mhGauss(r)];
    for(const base of [K.mhCubePts(),K.mhSimplexPts(),K.mhPrismPts(5,0.7)]){ const P=K.mhPolytope(affine(base,A,b)), g=K.mhCentroid(P); mc=Math.max(mc,Math.hypot(g[0]-b[0],g[1]-b[1],g[2]-b[2])/P.scale); } }
  ok('centre of mass: 10 random affine images x ↦ Ax + b of the cube, the simplex and the pentagonal prism (all centred at 0) have centroid b', mc<1e-12, 'max |g − b|/size = '+e2(mc));
  const ds=[]; let wErr=0, sErr=0, iErr=0;
  for(let seed=1;seed<=40;seed++){ const pts=K.mhRandGenPts(seed), P=K.mhPolytope(pts), S=K.mhSantalo(P), g=K.mhCentroid(P); ds.push(Math.hypot(S.s[0]-g[0],S.s[1]-g[1],S.s[2]-g[2])/P.scale);
    const map=K.mhWhitenMap(vtx(P),S.s), W=K.mhPolytope(pts.map(map)), S2=K.mhSantalo(W), M=[0,0,0,0,0,0,0,0,0], Wv=vtx(P).map(map);
    for(const w of Wv) for(let i=0;i<3;i++) for(let j=0;j<3;j++) M[3*i+j]+=w[i]*w[j]/Wv.length;
    for(let i=0;i<3;i++) for(let j=0;j<3;j++) iErr=Math.max(iErr,Math.abs(M[3*i+j]-(i===j?1:0)));
    wErr=Math.max(wErr,rel(S2.prod,S.prod)); sErr=Math.max(sErr,Math.hypot(...S2.s)/W.scale); }
  ds.sort((a,b)=>a-b);
  ok('whitening x ↦ L⁻¹(x − s) (vertex second moments → I) keeps the product and sends the Santaló point to 0 — 40 random general polytopes; there the Santaló point is not the centroid', wErr<1e-10&&sErr<1e-9&&iErr<1e-12&&ds[20]>1e-4,
    'max rel change of the product '+e2(wErr)+' · max |s′|/size '+e2(sErr)+' · max |M − I| '+e2(iErr)+' · |s − g|/size: median '+ds[20].toFixed(4)+', max '+ds[39].toFixed(4)); }
/* 9 · polar of the polar */
{ let good=0; const r=[]; for(let seed=1;seed<=5;seed++){ const P=K.mhPolytope(K.mhRandSymPts(seed)), R=K.mhPolar(K.mhPolar(P)); if(sameSet(vtx(P),vtx(R),1e-9*P.scale)) good++; r.push(P.verts.length);
    const G=K.mhPolytope(K.mhRandGenPts(seed)), c=G.cen, R2=K.mhPolar(K.mhPolar(G,c)); if(sameSet(vtx(G).map(p=>[p[0]-c[0],p[1]-c[1],p[2]-c[2]]),vtx(R2),1e-9*G.scale)) good++; r.push(G.verts.length); }
  ok('(K°)° = K: vertex sets agree to 10⁻⁹ for 5 random symmetric polytopes (about 0) and 5 random general ones (about their centroid)', good===10, good+'/10 · vertex counts '+r.join(',')); }
/* 10 · ℓ_p spheres sampled on the octahedral mirror triangles */
{ let okm=true; for(let m=1;m<=8;m++){ const M=K.mhOctMesh(m); if(M.dirs.length!==26+72*(m-1)+24*(m-1)*(m-2)||M.tris.length/3!==48*m*m||M.dirs.length!==2+24*m*m||M.linesA.length!==24||M.linesB.length!==24) okm=false; }
  ok('the mirror-triangle sphere: 26 + 72(m−1) + 24(m−1)(m−2) = 2 + 24m² vertices, 48m² triangles, 24 + 24 mirror sides, m = 1…8', okm, 'm = 8: '+K.mhOctMesh(8).dirs.length+' vertices');
  const a=K.mhPolytope(K.mhLpPts(1,6)), b=K.mhPolytope(K.mhLpPts(Infinity,6)), ap=K.mhPolar(a), bp=K.mhPolar(b);
  ok('sampled at p = 1 the hull is exactly the octahedron (4/3, polar 8); at p = ∞ exactly the cube (8, polar 4/3)', rel(a.vol,4/3)<1e-12&&rel(ap.vol,8)<1e-12&&rel(b.vol,8)<1e-12&&rel(bp.vol,4/3)<1e-12&&a.verts.length===6&&b.verts.length===8,
    [a.vol,ap.vol,b.vol,bp.vol].map(v=>v.toFixed(13)).join(' · ')+' · vertices '+a.verts.length+', '+b.verts.length);
  const t=performance.now(), vs=[2,4,8,16].map(m=>K.mhPolytope(K.mhLpPts(2,m)).vol), B=4*Math.PI/3, er=vs.map(v=>B-v);
  ok('a fine ℓ₂ sampling (m = 2, 4, 8, 16: nested) approaches 4π/3 from below, monotonically', vs.every((v,i)=>v<B&&(i===0||v>vs[i-1])), vs.map(v=>v.toFixed(8)).join(' → ')+' (4π/3 = '+B.toFixed(8)+') · deficits '+er.map(e2).join(', ')+' · ratios '+er.slice(1).map((e,i)=>(er[i]/e).toFixed(2)).join(', ')+' · '+ms(t));
  for(const p of [1.5,4]){ const t1=performance.now(), q=K.mhConj(p), rows=[2,4,8,16].map(m=>{ const P=K.mhPolytope(K.mhLpPts(p,m)), Q=K.mhPolar(P); return [P.vol,Q.vol,P.vol*Q.vol]; }), V=K.mhLpVol(3,p), W=K.mhLpVol(3,q), X=K.mhPlp(3,p);
    const mono=rows.every((r,i)=>r[0]<=V*(1+1e-14)&&r[1]>=W*(1-1e-14)&&(i===0||(r[0]>rows[i-1][0]&&r[1]<rows[i-1][1])))&&rows.every(r=>r[2]>=M32&&r[2]<=SANT);
    ok('p = '+p+': sampled polytopes K_m ⊂ B_p grow and their polars K_m° ⊃ B_q shrink with m (nested), products inside [32/3, (4π/3)²]', mono,
      rows.map((r,i)=>'m='+[2,4,8,16][i]+': '+r[0].toFixed(6)+' × '+r[1].toFixed(6)+' = '+r[2].toFixed(6)).join(' · ')+' · exact '+V.toFixed(6)+' × '+W.toFixed(6)+' = '+X.toFixed(6)+' · rel err at m=16: '+e2(rel(rows[3][2],X))+' · '+ms(t1)); } }
/* 11 · seeded random symmetric polytopes: the theorem in ℝ³ (Iriyeh–Shibata 2020; Blaschke–Santaló) */
{ let m3=0; for(let seed=1;seed<=20;seed++){ const P=K.mhPolytope(K.mhRandSymPts(seed,3)), Q=K.mhPolar(P); m3=Math.max(m3,Math.abs(P.vol*Q.vol-M32)); }
  ok('±x₁, ±x₂, ±x₃ — linear images of the octahedron (Hanner): 32/3 for 20 random triples', m3<1e-10, 'max |P − 32/3| = '+e2(m3));
  const t=performance.now(); let lo=Infinity, hi=-Infinity, alo=0, ahi=0, allIn=true, nmin=99, nmax=0, ms0=0, deg=0, degErr=0;
  for(let seed=1;seed<=300;seed++){ const N=4+(seed-1)%30, P=K.mhPolytope(K.mhRandSymPts(seed,N)), Q=K.mhPolar(P), v=P.vol*Q.vol; nmin=Math.min(nmin,N); nmax=Math.max(nmax,N);
    if(!(v>=M32*(1-1e-12)&&v<=SANT*(1+1e-12))) allIn=false; if(v>hi){ hi=v; ahi=seed; }
    if(P.verts.length===6){ deg++; degErr=Math.max(degErr,Math.abs(v-M32)); } else if(v<lo){ lo=v; alo=seed; }
    if(seed<=30){ const v0=P.pts[P.verts[0]], S=K.mhSantalo(P,[0.3*v0[0],0.3*v0[1],0.3*v0[2]]); ms0=Math.max(ms0,Math.hypot(...S.s)/P.scale); } }
  ok('300 seeded random symmetric polytopes (±x_i, '+nmin+'…'+nmax+' pairs): all 32/3 ≤ |K||K°| ≤ (4π/3)²; hulls that keep only three pairs are linear octahedra at exactly 32/3, every other one is strictly above (equality only for parallelepipeds and cross-polytopes in ℝ³)', allIn&&degErr<1e-10&&lo>M32*(1+1e-6),
    deg+' hulls collapse to three pairs (max |P − 32/3| = '+e2(degErr)+') · min over the other '+(300-deg)+': '+lo.toFixed(6)+' (seed '+alo+', ×'+(lo/M32).toFixed(4)+' of 32/3) · max '+hi.toFixed(6)+' (seed '+ahi+', ×'+(hi/SANT).toFixed(4)+' of (4π/3)²) · '+ms(t));
  ok('the Santaló point of a symmetric polytope is its centre (Newton from 0.3 × a vertex, 30 polytopes)', ms0<1e-9, 'max |s|/size = '+e2(ms0)); }
/* 12 · seeded random general polytopes after Santaló centring: ≥ 64/9 is the collection's claim in ℝ³ (classical for n = 2) */
{ const t=performance.now(); let lo=Infinity, hi=-Infinity, alo=0, allIn=true, cenOk=true, gmax=0, it=0, nmin=99, nmax=0, deg=0, degErr=0;
  for(let seed=1;seed<=300;seed++){ const N=5+(seed-1)%30, P=K.mhPolytope(K.mhRandGenPts(seed,N)), S=K.mhSantalo(P), c=K.mhPolarAt(P,P.cen,false).F*P.vol; nmin=Math.min(nmin,N); nmax=Math.max(nmax,N);
    hi=Math.max(hi,S.prod); if(!(S.prod>=M64*(1-1e-12)&&S.prod<=SANT*(1+1e-12))) allIn=false; if(c<S.prod*(1-1e-12)) cenOk=false;
    if(P.verts.length===4){ deg++; degErr=Math.max(degErr,Math.abs(S.prod-M64)); } else if(S.prod<lo){ lo=S.prod; alo=seed; }
    gmax=Math.max(gmax,S.gn*P.scale/S.F); it+=S.iters; }
  ok('300 seeded random general polytopes ('+nmin+'…'+nmax+' points), polar about the Santaló point: all 64/9 ≤ |K||(K − s)°| ≤ (4π/3)²; tetrahedral hulls give exactly 64/9, every other one is strictly above (the collection claims equality only for simplices)', allIn&&degErr<1e-9&&lo>M64*(1+1e-6),
    deg+' hulls are tetrahedra (max |P − 64/9| = '+e2(degErr)+') · min over the other '+(300-deg)+': '+lo.toFixed(6)+' (seed '+alo+', ×'+(lo/M64).toFixed(4)+' of 64/9) · max '+hi.toFixed(6)+' · '+(it/300).toFixed(1)+' Newton steps on average · '+ms(t));
  ok('at the Santaló point the polar centroid is at the origin (|∇F|·size/F < 10⁻¹⁰) and the product is below the product about the vertex centroid', gmax<1e-10&&cenOk, 'max |∇F|·size/F = '+e2(gmax)); }
/* 13 · timings for the laboratory's work */
{ const r=K.mhRng(8), pts=[]; for(let i=0;i<400;i++) pts.push([K.mhGauss(r),K.mhGauss(r),K.mhGauss(r)]);
  for(let k=0;k<3;k++) K.mhPolytope(pts); let t=performance.now(); for(let k=0;k<10;k++) K.mhPolytope(pts); const a=(performance.now()-t)/10;
  const L=K.mhLpPts(1.5,8); t=performance.now(); const P=K.mhPolytope(L); const b=performance.now()-t; t=performance.now(); const Q=K.mhPolar(P); const c=performance.now()-t;
  const G=K.mhRandGenPts(3,30); t=performance.now(); for(let k=0;k<20;k++){ const X=K.mhPolytope(G); K.mhSantalo(X); } const d=(performance.now()-t)/20;
  t=performance.now(); for(let k=0;k<20;k++){ const X=K.mhPolytope(K.mhRandSymPts(k+1)); K.mhPolar(X); } const e=(performance.now()-t)/20;
  t=performance.now(); K.mhOctMesh(10); const f=performance.now()-t;
  ok('timings: hull of 400 Gaussian points, ℓ_p sampling of 1538 points and its polar (3072 points), a 30-point general polytope with its Santaló point, a random symmetric product, the m = 10 display sphere', a<100&&b<1000&&d<100&&e<50&&f<200,
    a.toFixed(2)+' ms · '+b.toFixed(1)+' ms + '+c.toFixed(1)+' ms (polar has '+Q.verts.length+' vertices) · '+d.toFixed(2)+' ms · '+e.toFixed(2)+' ms · '+f.toFixed(1)+' ms'); }
console.log('total '+ms(t00));
console.log(pass+' passed, '+fail+' failed');
if(fail) process.exit(1);
