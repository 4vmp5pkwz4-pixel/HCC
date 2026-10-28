/* THE HOPF INSULATOR (v4.407, v4.409) — Preece & Batenin, «Certified Hopf Tomography: Exact Invariants, Sharp Stability and Minimax
   Calibration» (FBS3R, 23 October 2026): repository verifier on the page's own kernels (core/atlas/extracted.mjs).
   The manuscript's exact claims are recomputed against independent constructions written here, and mutations must fail. */
const K=await import(new URL('../core/atlas/extracted.mjs',import.meta.url));
let pass=0, fail=0; const t00=performance.now();
const check=(ok,claim,nums)=>{ if(ok) pass++; else fail++; console.log(`${ok?'PASS':'FAIL'} — ${claim} :: ${nums}`); };
const frac=q=>`${q[0]}/${q[1]}`, eqQ=(q,a,b)=>q[0]===BigInt(a)&&q[1]===BigInt(b);

/* 1. the exact gap against a grid minimisation of |h₀| = |u|² */
{ let worst=0; for(const m of [-4.2,-3.4,-2,-1.5,-0.4,0,0.7,1.6,2.5,3.3,4.1]){ let mn=Infinity; const N=60;
    for(let i=0;i<=N;i++) for(let j=0;j<=N;j++) for(let l=0;l<=N;l++){ const k=v=>Math.PI*v/N, u=K.hiU(k(i),k(j),k(l),m); mn=Math.min(mn,u[0]**2+u[1]**2+u[2]**2+u[3]**2); }
    const h=K.hiH0(0.3,1.2,2.1,m), u=K.hiU(0.3,1.2,2.1,m); worst=Math.max(worst,Math.abs(mn-K.hiGap(m)),Math.abs(Math.hypot(...h)-(u[0]**2+u[1]**2+u[2]**2+u[3]**2))); }
  check(worst<1e-9,'the exact gap: min_k |h₀(k, m)| = min_s (s − m)², s ∈ {−3, −1, 1, 3}, with |h₀| = |u|² — against a minimisation over a grid that contains the vertices of the cosine cube',`max deviation ${worst.toExponential(1)} over eleven m`); }
/* 2. the degree formula against the pulled-back volume of S³ */
{ const rows=[]; let worst=0; for(const m of [-4,-2.5,-2,-0.6,0,1.4,2,3.6,4]){ const f=K.hiDegree(m), I=K.hiDegreeIntegral(m,36); worst=Math.max(worst,Math.abs(I-f)); rows.push(`${m}: ${f} (${I.toFixed(4)})`); }
  check(worst<1e-3&&[-4,-2,0,2,4].map(K.hiDegree).join(',')==='0,-1,2,-1,0','the degree of z/|z| : T³ → S³ is −Σ c_x c_y c_z over the vertices c ∈ {±1}³ with Σ c > m — 0, −1, +2, −1, 0 across the phases — and equals the integral of det[u, ∂ₓu, ∂ᵧu, ∂_z u]/|u|⁴ over T³ divided by 2π²',rows.join(' · ')); }
/* 3. the Hopf invariant by Whitehead's integral */
{ const rows=[]; let worst=0, ok=true; for(const [m,want] of [[-4,0],[-2,1],[-0.5,-2],[0.5,-2],[2,1],[4,0]]){ const h32=K.hiHopf(m,32), h64=K.hiHopf(m,64), r=h64+(h64-h32)/3; worst=Math.max(worst,Math.abs(r-want)); if(Math.round(r)!==want||-K.hiDegree(m)!==want) ok=false; rows.push(`${m}: ${r.toFixed(4)}`); }
  check(ok&&worst<0.01,'the Hopf invariant χ = −(1/16π²)∫A·F (curl A = F solved by FFT) is 0, 1, −2, 1, 0 — minus the degree, the Hopf map\'s own class being −1 in this orientation — Richardson between 32³ and 64³ within 0.01 of the integers',rows.join(' · ')+` · worst ${worst.toFixed(4)}`); }
/* 4. the 125-site certificate */
{ const g=K.hgRng?K.hgRng(5):null; let worst=0; for(const m of [-2,0.3,2.7]){ const pts=[[0.3,1.1,2.9],[5.1,0.7,4.4],[2.2,3.3,1.9],[6.0,6.1,0.05]]; worst=Math.max(worst,K.hiInterp125(m,pts)); }
  check(worst<1e-12,'every component of h₀ is a trigonometric polynomial of coordinatewise bandwidth ≤ 2, so the 5³ = 125 samples reconstruct it exactly — the Dirichlet interpolant off the grid',`max error ${worst.toExponential(1)}`); }
/* 5. the preimage curves land on their target */
{ let worst=0, n=0; for(const m of [-2,0,2]) for(const p of K.HI_TARGETS.slice(0,3)){ const seg=K.hiPreimage(m,p,24); n+=seg.length; for(const [a,b] of seg) for(const X of [a,b]){ const v=K.hiN(K.hiU(X[0],X[1],X[2],m)); worst=Math.max(worst,Math.hypot(v[0]-p[0],v[1]-p[1],v[2]-p[2])); } }
  check(n>200&&worst<0.08,'the drawn preimage curves are preimages: every traced point maps within the tracing grid\'s resolution of its target colour',`${n} segments · max |n − p| ${worst.toFixed(3)}`); }
/* 6. Theorem 43 */
const B=K.hiCalibMatrix(), D=K.hiBestDeletion(B);
{ const P9=B.filter((_,i)=>i!==8); let det=[1n,1n]; { const n=P9.length, A=P9.map(r=>r.slice()); for(let i=0;i<n;i++){ let p=i; while(A[p][i][0]===0n) p++; if(p!==i){ [A[i],A[p]]=[A[p],A[i]]; det=K.hgpMul(det,[-1n,1n]); } det=K.hgpMul(det,A[i][i]); for(let k=i+1;k<n;k++){ const f=K.hgpDiv(A[k][i],A[i][i]); if(f[0]!==0n) A[k]=A[k].map((x,q)=>K.hgpSub(x,K.hgpMul(f,A[i][q]))); } } }
  check(B.length===12&&B[0].length===11&&D.invertible===12&&D.best.s===9&&eqQ(D.best.norm,127525,31104)&&eqQ(det,-130459631616,152587890625),
    'Theorem 43: the six rational references give a 12 × 11 bearing matrix whose twelve single deletions are all invertible; the best, omitting equation 9, has ‖P⁻¹‖∞ = 127525/31104 and det P = −130459631616/152587890625',`${D.invertible}/12 · s = ${D.best.s} · ${frac(D.best.norm)} · det ${frac(det)}`); }
/* 7. Proposition 11 */
{ const M=K.hiMinimax(B);
  check(eqQ(M.norm,14563561,3950208)&&M.del.join(',')==='6,6,0,2,0,1,4,6,6,10,6'&&M.worstRow===4,'Proposition 11: the minimax left inverse (each row minimising its ℓ₁ cost on the line of left inverses, at a breakpoint) has ‖L‖∞ = 14563561/3950208, deleted equations (6, 6, 0, 2, 0, 1, 4, 6, 6, 10, 6), worst row four',`${frac(M.norm)} · ${M.del.join(',')} · row ${M.worstRow}`);
  const gain=K.hgpDiv(D.best.norm,M.norm), eps=K.hgpDiv([1n,1n],K.hgpMul(D.best.norm,[16n,3n]));
  check(eqQ(gain,16195675,14563561)&&eqQ(eps,5832,127525),'the derived rationals: the gain 127525/31104 ÷ 14563561/3950208 = 16195675/14563561, and Theorem 44\'s threshold 1/(C_new·16/3) = 5832/127525',`${frac(gain)} · ${frac(eps)}`); }
/* 8. mutations that must fail */
{ const dup=K.HI_REFS.map(r=>r.slice()); dup[5]=dup[4]; const Dd=K.hiBestDeletion(K.hiCalibMatrix(dup));
  const moved=K.HI_REFS.map(r=>r.slice()); moved[5]=[[0,1],[3,5],[4,5]]; const Dm=K.hiBestDeletion(K.hiCalibMatrix(moved));
  check(Dd.invertible===0&&!(Dm.best&&eqQ(Dm.best.norm,127525,31104)),'mutations fail: duplicating a reference makes every eleven-row block singular (the manuscript\'s own negative control), and moving the sixth reference changes the certified norm',`duplicate: ${Dd.invertible}/12 invertible · moved: ${Dm.best?frac(Dm.best.norm):'—'}`); }

/* 9. v4.409 — the curves are curves: the traced segments, joined modulo 2π, close on the torus; every colour's windings cancel (its
   preimage bounds), and the Hopf current F, computed here by its own finite differences, runs along each curve */
const TAU=2*Math.PI, RINGS=[0.5,1.05,1.6,2.4,2.9];
{ let curves=0, open=0, unbalanced=0, worstAgree=1, used=0, segs=0, wsum=0, lsum=0; const sins=[];
  for(const m of [-2.5,-2,-0.5,0.5,2,2.5]) for(const th of RINGS){ const G=K.hiGrid(m,24);
    for(const p of K.hiRing(5,th,0.37)){ const seg=K.hiPreimageOn(G,p), C=K.hiChain(seg).map(c=>K.hiOrient(c,m)); segs+=seg.filter(([a,b])=>Math.hypot(a[0]-b[0],a[1]-b[1],a[2]-b[2])>=1e-12).length;
      curves+=C.length; for(const c of C){ used+=c.pts.length-1; if(!c.closed){ open++; continue; } worstAgree=Math.min(worstAgree,c.agree);
        /* F by its definition, at the middle of every fourth segment: ½ε_ijk n·(∂_j n × ∂_k n), here by a five-point stencil */
        for(let i=0;i+1<c.pts.length;i+=2){ const a=c.pts[i], b=c.pts[i+1], x=a.map((v,q)=>(v+b[q])/2), t=a.map((v,q)=>b[q]-v), e=1e-3, n=y=>K.hiN(K.hiU(y[0],y[1],y[2],m)),
            d=[0,1,2].map(ax=>{ const at=s2=>{ const y=x.slice(); y[ax]+=s2*e; return n(y); }, A=at(-2), B=at(-1), Cc=at(1), D=at(2); return [0,1,2].map(cc=>(A[cc]-8*B[cc]+8*Cc[cc]-D[cc])/(12*e)); }), c0=n(x),
            tri=(u,v)=>c0[0]*(u[1]*v[2]-u[2]*v[1])+c0[1]*(u[2]*v[0]-u[0]*v[2])+c0[2]*(u[0]*v[1]-u[1]*v[0]), F=[tri(d[1],d[2]),tri(d[2],d[0]),tri(d[0],d[1])];
          const len=Math.hypot(...t), cr=Math.hypot(F[1]*t[2]-F[2]*t[1],F[2]*t[0]-F[0]*t[2],F[0]*t[1]-F[1]*t[0])/(Math.hypot(...F)*len); sins.push(cr); wsum+=len*cr; lsum+=len; } }
      if([0,1,2].some(q=>C.filter(c=>c.closed).reduce((s2,c)=>s2+c.wind[q],0)!==0)) unbalanced++; } }
  const p95=sins.slice().sort((x,y)=>x-y)[Math.floor(0.95*(sins.length-1))], mean=wsum/lsum;
  check(open===0&&unbalanced===0&&used===segs&&worstAgree>0.9&&mean<0.06&&p95<0.2,'the drawn curves are closed curves of the torus: the segments, joined modulo 2π, close up and use every segment; each colour\'s windings cancel (its preimage bounds a surface, as the vanishing weak invariants require); the Hopf current F runs along every curve to the grid\'s resolution, and orients it',
    `${curves} curves over 6 m × 5 rings × 5 colours · open ${open} · unbalanced ${unbalanced} · segments used ${used}/${segs} · per-curve F-agreement ≥ ${worstAgree.toFixed(3)} · |sin∠(F, segment)| length-weighted mean ${mean.toFixed(3)}, 95th percentile ${p95.toFixed(3)} at 24³`); }
/* 10. v4.409 — the linking number, counted on the curves themselves, pair by pair: −χ (the degree), in every phase and for every ring —
   also past the equator, where the curves wind round the torus and are joined by bridges that cancel as chains */
{ const rows=[]; let pairs=0, wrong=0, unknown=0, wound=0;
  for(const m of [-2.5,-2,-0.5,0.5,2,2.5,3.5,-3.8]) { const vals=new Set(); for(const th of RINGS){ const G=K.hiGrid(m,24), C=K.hiRing(5,th,0.37).map(p=>K.hiChain(K.hiPreimageOn(G,p)).map(c=>K.hiOrient(c,m)));
      wound+=C.flat().filter(c=>c.closed&&c.wind.some(Boolean)).length;
      for(let a=0;a<5;a++) for(let b=a+1;b<5;b++){ const L=K.hiLink(C[a],C[b]); pairs++; if(L===null) unknown++; else { vals.add(L); if(L!==K.hiDegree(m)) wrong++; } } }
    rows.push(`${m}: ${[...vals].join('/')}`); }
  check(pairs===400&&wrong===0&&unknown===0&&wound>100,'the preimages of any two colours, oriented along F, link exactly −χ times — the degree of z/|z|: −1, 2, −1 in the topological phases, 0 in the trivial ones — for every pair of five colours on rings from θ = 0.5 to 2.9 — the manuscript\'s χ is minus Whitehead\'s ∫A·F/16π², which is the linking number itself',
    `${pairs} pairs · wrong ${wrong} · undetermined ${unknown} · curves winding round the torus ${wound} · ${rows.join(' · ')}`); }
/* 11. v4.409 — the crossing count is Gauss's linking integral: on a standard Hopf link both give −1; the count flips with an orientation,
   and a preimage with one of its two curves removed no longer bounds (refused) or links differently */
{ const n=400, C1=[], C2=[]; for(let i=0;i<=n;i++){ const t=TAU*i/n; C1.push([1+0.3*Math.cos(t),1+0.3*Math.sin(t),1]); C2.push([1.3+0.3*Math.cos(t),1,1+0.3*Math.sin(t)]); }
  let g=0; for(let i=0;i<n;i++) for(let j=0;j<n;j++){ const a=C1[i], b=C1[i+1], c=C2[j], d=C2[j+1], r=[0,1,2].map(q=>(a[q]+b[q]-c[q]-d[q])/2), d1=[0,1,2].map(q=>b[q]-a[q]), d2=[0,1,2].map(q=>d[q]-c[q]), R=Math.hypot(...r);
    g+=(r[0]*(d1[1]*d2[2]-d1[2]*d2[1])+r[1]*(d1[2]*d2[0]-d1[0]*d2[2])+r[2]*(d1[0]*d2[1]-d1[1]*d2[0]))/(R*R*R); }
  g/=4*Math.PI; const cv=P=>[{pts:P, closed:true, wind:[0,0,0]}], L=K.hiLink(cv(C1),cv(C2)), Lr=K.hiLink(cv(C1),cv(C2.slice().reverse()));
  const G=K.hiGrid(0,24), Ca=K.hiChain(K.hiPreimageOn(G,K.hiRing(2,1.05,0)[0])).map(c=>K.hiOrient(c,0)), Cb=K.hiChain(K.hiPreimageOn(G,K.hiRing(2,1.05,0)[1])).map(c=>K.hiOrient(c,0)), full=K.hiLink(Ca,Cb), half=K.hiLink(Ca.slice(0,1),Cb);
  const Gs=K.hiGrid(0,24), Cs=K.hiChain(K.hiPreimageOn(Gs,K.hiRing(2,2.6,0)[0])).map(c=>K.hiOrient(c,0)), Ds=K.hiChain(K.hiPreimageOn(Gs,K.hiRing(2,2.6,0)[1])).map(c=>K.hiOrient(c,0)), cut=K.hiLink(Cs.slice(1),Ds);
  check(Math.abs(g+1)<1e-3&&L===-1&&Lr===1&&full===2&&half!==2&&Ca.length===2&&cut===null,'the crossing count is Gauss\'s double integral (−1 on a standard Hopf link, both ways), reverses with an orientation, and fails as it must: at m = 0 a colour\'s preimage is two curves and one alone links half as often; a winding preimage with one curve removed no longer bounds, and the count refuses it',
    `Gauss ${g.toFixed(4)} · count ${L} · reversed ${Lr} · m = 0: both curves ${full}, one ${half} · winding with a curve removed ${cut}`); }
/* 12. v4.409 — what is drawn is what is counted: the cube cuts every curve at its faces and carries the pieces back inside, keeping its
   length; around Γ and around (π, π, π) alike */
{ let worst=-9, dl=0, n=0, jump=0, off=0;
  for(const c0 of [0,Math.PI]) for(const m of [-2,0,2]) for(const th of [1.05,2.4]){ const G=K.hiGrid(m,20);
    for(const p of K.hiRing(4,th,0.2)) for(const c of K.hiChain(K.hiPreimageOn(G,p))){ const P=K.hiPieces(c.pts,c0,c.closed); n+=P.length; let L0=0, L1=0;
      for(let i=0;i+1<c.pts.length;i++) L0+=Math.hypot(...[0,1,2].map(q=>c.pts[i+1][q]-c.pts[i][q]));
      for(const pc of P){ for(const x of pc.pts) for(let q=0;q<3;q++) worst=Math.max(worst,Math.abs(x[q]-c0)-Math.PI); for(let i=0;i+1<pc.pts.length;i++){ const d=Math.hypot(...[0,1,2].map(q=>pc.pts[i+1][q]-pc.pts[i][q])); L1+=d; if(d>1) jump++; } }
      dl=Math.max(dl,Math.abs(L1-L0));
      /* the resampled path: every point on the polyline (distance to its nearest segment), the ends kept */
      const R=K.hiResample(c.pts,0.1), dseg=(x,a,b)=>{ const ab=[0,1,2].map(q=>b[q]-a[q]), ax=[0,1,2].map(q=>x[q]-a[q]), L2=ab[0]**2+ab[1]**2+ab[2]**2, t=L2?Math.max(0,Math.min(1,(ab[0]*ax[0]+ab[1]*ax[1]+ab[2]*ax[2])/L2)):0; return Math.hypot(...[0,1,2].map(q=>ax[q]-t*ab[q])); };
      for(const x of R){ let d=Infinity; for(let i=0;i+1<c.pts.length;i++) d=Math.min(d,dseg(x,c.pts[i],c.pts[i+1])); off=Math.max(off,d); }
      off=Math.max(off,Math.hypot(...[0,1,2].map(q=>R[0][q]-c.pts[0][q])),Math.hypot(...[0,1,2].map(q=>R[R.length-1][q]-c.pts[c.pts.length-1][q]))); } }
  check(worst<=1e-12&&dl<1e-9&&jump===0&&off<1e-9,'the drawing is the counted curve: cut at the faces of the cube [c₀ − π, c₀ + π]³ and carried back inside, every piece stays in the cube, no piece jumps across it, the length is kept to rounding, and the evenly resampled tube path stays on the traced curve',
    `${n} pieces · max excess ${worst.toExponential(1)} · length change ${dl.toExponential(1)} · jumps ${jump} · resampled path off the curve ${off.toExponential(1)}`); }

console.log(`\n${pass} passed, ${fail} failed · ${(performance.now()-t00).toFixed(0)} ms`);
process.exit(fail?1:0);
