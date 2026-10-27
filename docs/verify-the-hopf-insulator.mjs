/* THE HOPF INSULATOR (v4.407) — Preece & Batenin, «Certified Hopf Tomography: Exact Invariants, Sharp Stability and Minimax
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

console.log(`\n${pass} passed, ${fail} failed · ${(performance.now()-t00).toFixed(0)} ms`);
process.exit(fail?1:0);
