/* THE HOPF-TRIAD UNIVERSE (v4.408) — Preece & Batenin, «Exact closed cosmological backgrounds sourced by an isotropic Hopf triad»
   (FBS3R, 15 October 2026): repository verifier on the page's own kernels (core/atlas/extracted.mjs). Every identity of the manuscript
   is recomputed against an independent construction written here, and mutations must fail. */
const K=await import(new URL('../core/atlas/extracted.mjs',import.meta.url));
let pass=0, fail=0; const t00=performance.now();
const check=(ok,claim,nums)=>{ if(ok) pass++; else fail++; console.log(`${ok?'PASS':'FAIL'} — ${claim} :: ${nums}`); };

/* 1. isotropy at many points of S³ */
{ let w=0; for(let k=0;k<40;k++){ const q=[Math.sin(1.3*k+1),Math.cos(2.1*k+0.3),Math.sin(3.7*k+0.7),Math.cos(0.9*k)], n=Math.hypot(...q), r=K.htIsotropy(q.map(x=>x/n));
    w=Math.max(w,Math.abs(r.s2-24),Math.abs(r.sF-48)); for(let i=0;i<3;i++) for(let j=0;j<3;j++) w=Math.max(w,Math.abs(r.T2[i][j]-(i===j?8:0)),Math.abs(r.TF[i][j]-(i===j?32:0))); }
  check(w<1e-6,'three orthogonal Hopf maps n_a(q) = q e_a q⁻¹ are isotropic together: Σ|dn_a|² = 24, Σ|F_a|² = 48, Σ dn_a·dn_a = 8γ, Σ F_a F_a = 32γ at forty points of S³',`max deviation ${w.toExponential(1)}`);
  /* and one alone is not: a rank-two derivative tensor */
  const q=[0.3,0.5,-0.4,0.71], n=Math.hypot(...q), qq=q.map(x=>x/n), h=1e-5, D=[];
  for(let i=0;i<3;i++){ const ex=[Math.cos(h),0,0,0], em=[Math.cos(h),0,0,0]; ex[i+1]=Math.sin(h); em[i+1]=-Math.sin(h); const p=K.htN(K.htMul(qq,ex),0), m=K.htN(K.htMul(qq,em),0); D.push([(p[0]-m[0])/(2*h),(p[1]-m[1])/(2*h),(p[2]-m[2])/(2*h)]); }
  const norms=D.map(v=>Math.hypot(...v)).sort((a,b)=>a-b);
  check(norms[0]<1e-6&&Math.abs(norms[1]-2)<1e-6&&Math.abs(norms[2]-2)<1e-6,'a single Hopf map has a preferred direction: along its own fibre E_a n_a = 0, across it |E_i n_a| = 2 — rank two',norms.map(x=>x.toFixed(6)).join(', ')); }
/* 1b. the drawing: the curves drawn are fibres, and the three families are one picture turned by 120° about the diagonal */
{ let w=0, rmax=0; for(let a=0;a<3;a++) for(const beta of [0.8*Math.PI,Math.PI]) for(let k=0;k<12;k++){ const q0=K.htBase(a,beta,2*Math.PI*k/12), n0=K.htN(q0,a);
    for(let j=0;j<=48;j++){ const t=2*Math.PI*j/48, e=[Math.cos(t),0,0,0]; e[a+1]=Math.sin(t); const n=K.htN(K.htMul(q0,e),a); w=Math.max(w,Math.hypot(n[0]-n0[0],n[1]-n0[1],n[2]-n0[2])); }
    for(const p of K.htFibre(q0,a,48,1)) rmax=Math.max(rmax,Math.hypot(...p)); }
  let w2=0; for(const beta of [0.8*Math.PI,Math.PI]) for(let k=0;k<12;k++){ const phi=2*Math.PI*k/12;
    for(let a=0;a<3;a++){ const F=K.htFibre(K.htBase(a,beta,phi),a,48,1), G=K.htFibre(K.htBase((a+1)%3,beta,phi),(a+1)%3,48,1);
      for(let j=0;j<F.length;j++){ const r=[F[j][2],F[j][0],F[j][1]]; w2=Math.max(w2,Math.hypot(r[0]-G[j][0],r[1]-G[j][1],r[2]-G[j][2])); } } }
  check(w<1e-12&&w2<1e-12&&rmax<2,'the drawing: every curve drawn for map a is a fibre (n_a constant along it), and the rotation of R³ by 120° about (1, 1, 1) carries the picture of each map exactly onto the next — the isotropy, seen; all within radius 2 of the projection from −1 (the rings drawn: 0.8π and the core over −e_a)',`n_a varies by ${w.toExponential(1)} · rotated family off by ${w2.toExponential(1)} · max radius ${rmax.toFixed(3)}`); }
/* 2. the spherical averages */
{ let w=0; for(const s of [0.2,0.7,1.5,2.5]){ w=Math.max(w,Math.abs(K.htOmegaAvg(s,2,6000)-1/Math.cosh(s/2)**2),Math.abs(K.htOmegaAvg(s,4,6000)-Math.cosh(s))); }
  check(w<1e-8,'over the conformal family ω_s = (cosh s + f sinh s)⁻¹: ⟨ω²⟩ = sech²(s/2) and ⟨ω⁴⟩ = cosh s (quadrature with the coordinate marginal (2/π)√(1 − u²))',`max deviation ${w.toExponential(1)}`); }
/* 3. the bounce solves both Friedmann equations */
{ let w=0; for(const [eta,D,h] of [[0.3,0.05,0.7],[0.1,0.2,1],[0.6,0.01,0.4]]){ const B=K.htBounce(eta,D,h); if(!B.ok) continue;
    for(const t of [0,0.4,1.1,2.3]){ const e=1e-4, a=Math.sqrt(B.a2(t)), ad=(Math.sqrt(B.a2(t+e))-Math.sqrt(B.a2(t-e)))/(2*e), add=(Math.sqrt(B.a2(t+e))-2*a+Math.sqrt(B.a2(t-e)))/(e*e);
      w=Math.max(w,Math.abs(ad*ad-(h*h*a*a-B.C+D/(a*a)))/(h*h*a*a),Math.abs(add-(h*h*a-D/a**3))/(h*h*a)); } }
  check(w<1e-5,'a(t)² = (C + √(C² − 4h²D) cosh 2h(t − t₀))/(2h²) satisfies ȧ² = h²a² − C + D/a² and ä = h²a − D/a³',`max relative residual ${w.toExponential(1)}`); }
/* 4. the second variation */
{ let w=0; for(const [s0,a,k,l] of [[0,1.3,0.2,0.1],[0,0.7,0.5,0.3],[0,2.5,0.05,0.4]]){ const e=1e-3, d2=(K.htEnergy(s0+e,a,k,l)-2*K.htEnergy(s0,a,k,l)+K.htEnergy(s0-e,a,k,l))/(e*e); w=Math.max(w,Math.abs(d2-K.htEss(a,k,l))); }
  check(w<1e-5,'E_ss(0, a)/2π² = −6κa + 24λ/a, from E/2π² = 12κa sech²(s/2) + (24λ/a) cosh s; nonnegative exactly when a² ≤ 4λ/κ',`max deviation ${w.toExponential(1)}`); }
/* 5. the joint window against the turning-point condition, and t_crit */
{ let bad=0, n=0; for(let i=1;i<80;i++) for(let j=1;j<80;j++){ const eta=0.95*i/80, z=0.3*j/80, lo=eta/2-3*eta*eta/4; if(Math.abs(z-lo)<1e-9) continue; n++; if(K.htWindow(eta,z)!==K.htWindowByRoot(eta,z)) bad++; }
  let w=0; for(const [eta,z] of [[0.2,0.12],[0.1,0.1],[0.3,0.11],[0.05,0.06]]){ if(!K.htWindow(eta,z)) continue; const B=K.htBounce(eta,z,1); w=Math.max(w,Math.abs(B.a2(K.htTcrit(eta,z,1))-2*z/eta)); }
  check(bad===0&&n>6000&&w<1e-9,'Proposition 3: the window 0 < η < ½, η/2 − 3η²/4 ≤ ζ < (1 − η)²/4 is exactly where the upper turning root b satisfies b ≤ C − η/2; and at t_crit, a² = 4λ/κ (= 2ζ/η with h = 1)',`${n} grid points, ${bad} disagreements · max |a²(t_crit) − 2ζ/η| ${w.toExponential(1)}`); }
/* 6. mutations fail */
{ const wrongLower=(eta,z)=>eta>0&&eta<0.5&&z>=eta/2-eta*eta/4&&z<(1-eta)*(1-eta)/4; let differs=0; for(let i=1;i<40;i++) for(let j=1;j<40;j++){ const eta=0.5*i/40, z=0.3*j/40; if(wrongLower(eta,z)!==K.htWindowByRoot(eta,z)) differs++; }
  const B=K.htBounce(0.3,0.05,0.7), t=0.8, e=1e-4, a=Math.sqrt(B.a2(t)), ad=(Math.sqrt(B.a2(t+e))-Math.sqrt(B.a2(t-e)))/(2*e), Cw=1+0.3, res=Math.abs(ad*ad-(0.49*a*a-Cw+0.05/(a*a)));
  check(differs>0&&res>0.1,'mutations fail: a window with the wrong quadratic term (η/2 − η²/4) disagrees with the turning-point condition, and the sign of η flipped in C = 1 − η breaks the Friedmann equation',`${differs} disagreements · residual ${res.toFixed(3)}`); }

console.log(`\n${pass} passed, ${fail} failed · ${(performance.now()-t00).toFixed(0)} ms`);
process.exit(fail?1:0);
