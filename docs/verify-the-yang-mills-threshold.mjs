/* THE YANG–MILLS THRESHOLD ON S³ (v4.409) — Preece & Batenin, «Geometric Infrared Scale of Yang–Mills Theory on a Compact
   Three-Manifold» (FBS3R, April 2026): repository verifier on the page's own kernels (core/atlas/extracted.mjs). The spectrum of
   the curl of S³ is counted exactly — integer matrices, BigInt ranks, no harmonic analysis assumed — and set against the
   manuscript's claim that the gauge field's threshold is √3/R. Mutations must fail. */
const K=await import(new URL('../core/atlas/extracted.mjs',import.meta.url));
let pass=0, fail=0; const t00=performance.now();
const check=(ok,claim,nums)=>{ if(ok) pass++; else fail++; console.log(`${ok?'PASS':'FAIL'} — ${claim} :: ${nums}`); };
const same=(a,b)=>{ const ka=Object.keys(a).sort(), kb=Object.keys(b).sort(); return ka.length===kb.length&&ka.every((k,i)=>k===kb[i]&&a[k]===b[k]); };

/* 1. the curl's spectrum on every P_d ⊗ C³, d ≤ 5, counted and complete */
const SP=[0,1,2,3,4,5].map(K.ymCurlSpectrum);
{ const rows=SP.map(s=>`d ${s.d}: ${Object.entries(s.eig).sort((a,b)=>a[0]-b[0]).map(([l,k])=>`${l}×${k}`).join(' ')}`);
  check(SP.every(s=>s.complete&&same(s.eig,K.ymCurlPredicted(s.d))),'on fields Σ f_k E_k with f_k homogeneous of degree d ≤ 5, the curl of S³ has only integer eigenvalues, its eigenspaces fill the whole space (168 dimensions at d = 5), and the counts are exactly those of representation theory: −(e+2) on (e+1)(e+3) fields, 0 on (e+1)², +e on (e−1)(e+1), summed over e = d, d−2, …',rows.join(' · ')); }
/* 2. the gauge levels and their degeneracies */
{ const tot={}; for(const s of SP) for(const [l,k] of Object.entries(s.eig)) if(+l!==0){ const a=Math.abs(+l); tot[a]=(tot[a]||0); }
  /* each |λ| = ℓ + 1 appears once at degree ℓ − 1 (negative) and once at degree ℓ + 1 (positive): count it there */
  const deg=[1,2,3].map(l=>(SP[l-1].eig[-(l+1)]||0)+(SP[l+1].eig[l+1]||0));
  check(deg.join(',')==='6,16,30'&&deg.every((g,i)=>g===K.ymLevel(i+1).gaugeDeg),'the divergence-free fields: |curl| = ℓ + 1 for ℓ ≥ 1, each on 2ℓ(ℓ+2) fields — 6, 16, 30 — so the linearised Yang–Mills operator curl² has eigenvalues (ℓ+1)²/R² = 4, 9, 16 and the threshold is 2/R; the manuscript\'s degeneracy 2(ℓ+1)² = 8, 18, 32 is twice the scalar count',`2ℓ(ℓ+2): ${deg.join(', ')} · claimed: ${[1,2,3].map(l=>K.ymLevel(l).claimDeg).join(', ')}`); }
/* 3. √3 is not there: 3 is not an eigenvalue of curl² on any P_d ⊗ C³, d ≤ 4 — and it is the scalar Laplacian's first eigenvalue */
{ const no3=[0,1,2,3,4].map(d=>{ const O=K.ymOps(d), C2=O.mul(O.curl,O.curl); return K.ymKernel(C2,3); });
  const O1=K.ymOps(1), lap3=K.ymKernel(O1.lap,-3), O2=K.ymOps(2), lap8=K.ymKernel(O2.lap,-8);
  check(no3.every(k=>k===0)&&lap3===4&&lap8===9,'the manuscript\'s ω₁² = 3/R² is not an eigenvalue of curl² on any of these spaces — it is the first eigenvalue of the SCALAR Laplacian, −Σ E_j² = ℓ(ℓ+2) on (ℓ+1)² functions (3 on the 4 linear functions, 8 on the 9 harmonic quadratics): the manuscript took the scalar spectrum for the vector one',`kernel of curl² − 3: ${no3.join(', ')} · scalar 3 on ${lap3}, 8 on ${lap8}`); }
/* 4. Weitzenböck, as matrices: ∇*∇ = curl² − grad div − 2 on every P_d ⊗ C³ — so the rough Laplacian gives 2, 7, 14 on the divergence-free fields, not 3 either */
{ let worst=0; for(const d of [0,1,2,3]){ const O=K.ymOps(d), C2=O.mul(O.curl,O.curl); for(let a=0;a<O.dim;a++) for(let b=0;b<O.dim;b++) worst=Math.max(worst,Math.abs(O.rough[a][b]-(C2[a][b]-O.gd[a][b]-(a===b?2:0)))); }
  const O=K.ymOps(2), k2=K.ymKernel(O.rough,2), k3=K.ymKernel(O.rough,3);
  check(worst===0&&k2===6&&k3===0,'the Weitzenböck identity holds entry by entry, ∇*∇ = curl² − grad div − Ric with Ric = 2: the connection Laplacian on divergence-free fields is (ℓ+1)² − 2 = 2, 7, 14 — the six Killing fields at 2 — and never 3, so no reading of "transverse vector Laplacian" gives the manuscript\'s value',`max entry deviation ${worst} · ∇*∇ = 2 on ${k2} fields, = 3 on ${k3}`); }
/* 5. the six lowest modes are the Killing fields: E_k (left-invariant, curl −2) and the right-invariant e_k x (curl +2), whose orbits are the two Hopf fibrations */
{ const O0=K.ymOps(0); const left=[0,1,2].every(k=>{ const v=[0,0,0]; v[k]=1; const w=O0.curl.map(r=>r.reduce((s,x,j)=>s+x*v[j],0)); return w.every((x,i)=>x===-2*v[i]); });
  /* the right-invariant field e_k x, written in the left frame: f_m = ⟨e_k x, x e_m⟩, quadratic */
  const M=K.ymMonos(2), N=M.length, O2=K.ymOps(2); let right=true;
  for(let k=0;k<3;k++){ const v=new Array(3*N).fill(0); const ek=[0,0,0,0]; ek[k+1]=1;
    for(let m=0;m<3;m++){ const em=[0,0,0,0]; em[m+1]=1; /* ⟨e_k x, x e_m⟩ as a quadratic form: evaluate on the monomial basis by polarisation */
      const q=(x)=>{ const a=K.htMul(ek,x), b=K.htMul(x,em); return a[0]*b[0]+a[1]*b[1]+a[2]*b[2]+a[3]*b[3]; };
      M.forEach((mo,p)=>{ const idx=[]; mo.forEach((c,mu)=>{ for(let t=0;t<c;t++) idx.push(mu); }); const e=(i)=>{ const x=[0,0,0,0]; x[i]=1; return x; };
        const [i,j]=idx; const val=i===j?q(e(i)):(q(e(i).map((z,t)=>z+e(j)[t]))-q(e(i))-q(e(j))); v[m*N+p]=val; }); }
    const w=O2.curl.map(r=>r.reduce((s,x,j)=>s+x*v[j],0)); if(!w.every((x,i)=>x===2*v[i])) right=false; }
  const orbit=K.ymOrbit([0.6,0.48,0.64,0],0,true,64,1), orbitR=K.ymOrbit([0.6,0.48,0.64,0],0,false,64,1);
  check(left&&right&&orbit.length===65&&orbitR.length===65,'the six lowest modes are the Killing fields of S³: the three left-invariant E_k have curl −2, the three right-invariant e_k x have curl +2 — their orbits are the two Hopf fibrations, so the lowest gluon on S³ is a Hopf field, at ω = 2/R',`left ${left} · right ${right}`); }
/* 6. the physical scale, and the manuscript's own glueball arithmetic */
{ const L=300, r0=410, gapClaim=Math.sqrt(3)*L, gap=2*L, F=K.YM_FIB;
  const ratio=K.ymGlue(3,1,true)/K.ymGlue(1,1,true), ratioFormula=K.ymGlue(3,1,false)/K.ymGlue(1,1,false);
  const pulls=(f)=>K.YM_LATTICE.map(([j,m,e,n])=>(f(n)-m)/e);
  const pc=pulls(n=>K.ymGlue(n,r0,true)), pf=pulls(n=>K.ymGlue(n,r0,false)), printed={1:1421,3:2170,4:3069,5:4779}, pp=pulls(n=>printed[n]);
  check(Math.abs(gapClaim-519.6)<0.1&&gap===600&&F[2]*(F[2]+2)===8&&ratio===1.5&&Math.abs(ratioFormula-Math.sqrt(8/3))<1e-12&&Math.abs(2*r0*Math.sqrt(7)-2170)<1&&Math.abs(K.ymGlue(3,r0,false)-2320)<1&&pc.slice(0,3).every(x=>Math.abs(x)<1.2)&&Math.abs(pp[0])>3.8&&Math.abs(pp[2])>3.2,
    'at R = 1/Λ (Λ = 300 MeV) the threshold is 2Λ = 600 MeV, not √3Λ = 520 MeV. The manuscript\'s glueball ratio is also miscomputed on its own terms: its formula gives √(F₃(F₃+2)/F₁(F₁+2)) = √(8/3) = 1.633 — as its Appendix B prints (Ω₃R = 2.828, m₃ = 2320 MeV) — while its Theorem 6(c) and Table 2 use 7 for F₃(F₃+2) = 8 (√(7/3) = 1.528, 2170 MeV). With the gauge spectrum the ratio is (F₃+1)/(F₁+1) = 3/2, and at r₀⁻¹ = 410 MeV the three lightest states of its lattice table fall within 1.13σ (its printed masses: 3.9, 1.9 and 3.2σ away); 1⁺⁻ and 3⁺⁻ stay far off in every version — the two-gluon approximation is the manuscript\'s, and nothing here rests on it',
    `gap ${gap} (claimed ${gapClaim.toFixed(1)}) · F₃(F₃+2) = ${F[2]*(F[2]+2)} · m₃/m₁ ${ratio} (formula ${ratioFormula.toFixed(4)}, printed √(7/3) = ${Math.sqrt(7/3).toFixed(4)}) · pulls, gauge: ${pc.map(x=>x.toFixed(2)).join(', ')} · printed: ${pp.map(x=>x.toFixed(2)).join(', ')}`); }
/* 7. mutations fail */
{ /* a flat curl (the −2 f_m term dropped) puts the left-invariant fields at 0 and breaks the count; the scalar levels in place of the gauge ones break the degeneracy */
  const O=K.ymOps(0), flat=O.curl.map((r,i)=>r.map((x,j)=>i===j?x+2:x)), kz=K.ymKernel(flat,0);
  const bad=[1,2,3].map(l=>2*(l+1)*(l+1)), good=[1,2,3].map(l=>K.ymLevel(l).gaugeDeg);
  check(kz===3&&!same(K.ymCurlSpectrum(0).eig,{0:3})&&bad.join()!==good.join(),'mutations fail: dropping the frame\'s own curl (−2) puts the three left-invariant fields at zero, which the count refuses; and the manuscript\'s degeneracy 2(ℓ+1)² is not the measured 2ℓ(ℓ+2)',`flat curl kills ${kz} · ${bad.join(',')} ≠ ${good.join(',')}`); }

console.log(`\n${pass} passed, ${fail} failed · ${(performance.now()-t00).toFixed(0)} ms`);
process.exit(fail?1:0);
