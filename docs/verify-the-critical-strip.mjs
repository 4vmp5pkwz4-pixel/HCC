/* THE CRITICAL STRIP (v4.380) — family 003 of openai/math, the quasi-Riemann hypothesis — repository verifier on the page's own kernels (core/atlas/extracted.mjs, sliced from index.html). */
// Verifier for the quasi-Riemann-hypothesis laboratory (family 003): node test.mjs
const K=await import(new URL('../core/atlas/extracted.mjs',import.meta.url));
let pass=0, fail=0; const T0=performance.now(), times=[];
const check=(ok,claim,nums)=>{ if(ok) pass++; else fail++; console.log(`${ok?'PASS':'FAIL'} — ${claim} :: ${nums}`); };
const timed=(name,f)=>{ const t=performance.now(), r=f(), ms=performance.now()-t; times.push(`${name} ${ms.toFixed(1)} ms`); return [r,ms]; };
const e=x=>x.toExponential(2), cabs=(a,b)=>Math.hypot(a[0]-b[0],a[1]-b[1]);
/* an independent algorithm for small |t|: Borwein's accelerated alternating series for η(s) = (1 − 2^{1−s}) ζ(s) */
function borwein(sr,si,n){ const d=new Float64Array(n+1); let term=1/n, acc=0;
  for(let i=0;i<=n;i++){ if(i>0) term*=4*(n+i-1)*(n-i+1)/((2*i)*(2*i-1)); acc+=term; d[i]=n*acc; }
  let re=0, im=0; for(let k=0;k<n;k++){ const L=Math.log(k+1), m=Math.exp(-sr*L), c=(k%2?-1:1)*(d[k]-d[n])*m; re+=c*Math.cos(si*L); im-=c*Math.sin(si*L); }
  const m2=Math.exp((1-sr)*Math.LN2), a=-si*Math.LN2, er=1-m2*Math.cos(a), ei=-m2*Math.sin(a), dr=d[n]*er, di=d[n]*ei, q=dr*dr+di*di;
  return [-(re*dr+im*di)/q, -(im*dr-re*di)/q]; }

// 1. special values (exact, Euler, Riemann, literature)
{ const z2=K.zsZeta(2,0)[0], z4=K.zsZeta(4,0)[0], z3=K.zsZeta(3,0)[0];
  check(Math.abs(z2/(Math.PI**2/6)-1)<1e-14,'ζ(2) = π²/6 (Euler)',`${z2} vs ${Math.PI**2/6}, rel ${e(Math.abs(z2/(Math.PI**2/6)-1))}`);
  check(Math.abs(z4/(Math.PI**4/90)-1)<1e-14,'ζ(4) = π⁴/90',`${z4} vs ${Math.PI**4/90}, rel ${e(Math.abs(z4/(Math.PI**4/90)-1))}`);
  check(Math.abs(z3-1.2020569031595942)<1e-15,'ζ(3) = 1.2020569031595942… (Apéry’s constant)',`${z3}`);
  const z0=K.zsZeta(0,0), zm=K.zsZeta(-1,0);
  check(Math.abs(z0[0]+0.5)<1e-14&&Math.abs(zm[0]+1/12)<1e-12,'ζ(0) = −1/2 and ζ(−1) = −1/12 (the method covers −1 ≤ σ ≤ 3)',`${z0[0]}, ${zm[0]} (err ${e(Math.abs(zm[0]+1/12))})`);
  const zh=K.zsZeta(0.5,0)[0], zb=borwein(0.5,0,60)[0];
  check(Math.abs(zh+1.4603545088095868)<1e-14&&Math.abs(zb-zh)<1e-13,'ζ(1/2) = −1.4603545088095868… (Euler–Maclaurin and Borwein)',`EM ${zh}, Borwein ${zb}`); }
// 2. ζ(2+3i) three ways
{ const a=K.zsZetaEM(2,3,20), b=K.zsZetaEM(2,3,80), c=borwein(2,3,60);
  check(cabs(a,b)<1e-12&&cabs(a,c)<1e-12,'ζ(2+3i): Euler–Maclaurin with N = 20 and N = 80 and Borwein’s series agree',`${a[0].toFixed(15)} ${a[1].toFixed(15)}i · |N20−N80| ${e(cabs(a,b))} · |EM−Borwein| ${e(cabs(a,c))}`); }
// 3. the precision at the top of the range: two different N at |t| = 1200, σ = −1 … 3
{ let w=0; for(const s of [-1,0,0.5,0.875,1.2,3]){ const N=K.zsNTerms(s,1200), a=K.zsZetaEM(s,1200,N), b=K.zsZetaEM(s,1200,Math.round(1.6*N)); w=Math.max(w,cabs(a,b)/Math.hypot(a[0],a[1])); }
  check(w<1e-11,'ζ(σ + 1200i), σ ∈ {−1, 0, ½, ⅞, 1.2, 3}: N and 1.6N terms agree',`worst relative difference ${e(w)} (N = ${K.zsNTerms(0.5,1200)} at σ = ½)`); }
// 4. functional equation ζ(s) = χ(s) ζ(1 − s)
{ let w=0; for(const [s,t] of [[0.3,5],[-0.5,20],[-1,300],[0.2,1000],[-1,1200]]){ const z=K.zsZeta(s,t), c=K.zsChi(s,t), u=K.zsZeta(1-s,-t), r=[c[0]*u[0]-c[1]*u[1],c[0]*u[1]+c[1]*u[0]]; w=Math.max(w,cabs(z,r)/Math.hypot(z[0],z[1])); }
  check(w<1e-11,'functional equation ζ(s) = χ(s) ζ(1 − s) at 5 points up to t = 1200 (independent sums at s and 1 − s)',`worst relative residual ${e(w)}`); }
// 5. Bernoulli numbers: the double table against exact rationals (Akiyama–Tanigawa in BigInt)
{ const gcd=(a,b)=>{ a=a<0n?-a:a; b=b<0n?-b:b; while(b){ [a,b]=[b,a%b]; } return a; }, red=([p,q])=>{ if(q<0n){ p=-p; q=-q; } const g=gcd(p,q)||1n; return [p/g,q/g]; };
  const A=[], B=[]; for(let m=0;m<=82;m++){ A[m]=[1n,BigInt(m+1)]; for(let j=m;j>=1;j--){ const [a,b]=A[j-1], [c,d]=A[j]; A[j-1]=red([(a*d-c*b)*BigInt(j),b*d]); } B[m]=A[0]; }
  let f=1n; const F=[1n]; for(let i=1;i<=82;i++){ f*=BigInt(i); F[i]=f; }
  let wb=0, ws=0; for(let k=1;k<=41;k++){ const [p,q]=B[2*k]; wb=Math.max(wb,Math.abs(K.ZS_BK[k]*(Number(q)*Number(F[2*k]))/Number(p)-1)); if(k<=12) ws=Math.max(ws,Math.abs(K.ZS_STIRLING[k]*Number(q)*2*k*(2*k-1)/Number(p)-1)); }
  check(wb<1e-14&&ws<1e-15&&B[12][0]===-691n&&B[12][1]===2730n,'B_{2k}/(2k)! (k ≤ 41) and the Stirling coefficients B_{2k}/(2k(2k−1)) (k ≤ 12) match exact rationals',`worst rel ${e(wb)} · ${e(ws)} · B₁₂ = ${B[12][0]}/${B[12][1]}`); }
// 6. θ and Z
{ let w=0; for(const t of [50,100,300,1000]) w=Math.max(w,Math.abs(K.zsTheta(t)-K.zsThetaAsym(t)));
  check(K.zsTheta(0)===0&&w<1e-12,'θ(t) by shifted Stirling = the asymptotic series (t/2)log(t/2π) − t/2 − π/8 + 1/(48t) + … ; θ(0) = 0',`max |Δθ| over t = 50 … 1000: ${e(w)}; θ(100) = ${K.zsTheta(100).toFixed(12)}`);
  let wi=0; for(let t=1;t<1200;t+=3.7){ const c=K.zsZc(t); wi=Math.max(wi,Math.abs(c[1])/(1+Math.abs(c[0]))); }
  check(wi<1e-11,'Z(t) = e^{iθ(t)} ζ(½ + it) is real on 1 ≤ t ≤ 1200',`max |Im|/(1 + |Z|) = ${e(wi)} over 324 heights`); }
// 7. the first ten zeros (Odlyzko’s tables) and γ₁₀₀
const LIT=[14.134725141734693,21.022039638771555,25.010857580145688,30.424876125859513,32.935061587739189,37.586178158825671,40.918719012147495,43.327073280914999,48.005150881167159,49.773832477672302];
const [J100,ms100]=timed('zeros on (0, 100)',()=>K.zsZeros(0,100));
{ const w5=Math.max(...LIT.slice(0,5).map((g,i)=>Math.abs(J100.zeros[i]-g))), w10=Math.max(...LIT.map((g,i)=>Math.abs(J100.zeros[i]-g)));
  check(w5<1e-8,'first five zeros 14.134725141734693, 21.022039638771555, 25.010857580145688, 30.424876125859513, 32.935061587739189',`computed ${J100.zeros.slice(0,5).map(x=>x.toFixed(12)).join(', ')} · max err ${e(w5)}`);
  check(w10<1e-8,'zeros 6 … 10: 37.586178158825671, 40.918719012147495, 43.327073280914999, 48.005150881167159, 49.773832477672302',`max err ${e(w10)}`); }
// 8. N(100) = 29 both ways
const N100=K.zsN(100);
check(J100.zeros.length===29&&N100.N===29&&Math.abs(N100.raw-29)<1e-9,'N(100) = 29: sign changes of Z on (0, 100) = the argument-principle count θ/π + 1 + S',`sign changes ${J100.zeros.length} (${J100.evals} Z-evaluations, ${ms100.toFixed(1)} ms) · AP ${N100.raw.toFixed(12)} · S(100) = ${N100.S.toFixed(6)}`);
// 9. N(T) to 1000 both ways; 649 zeros below 1000; γ₁₀₀
const [J1000,ms1000]=timed('zeros on (0, 1000)',()=>K.zsZeros(0,1000));
{ const rows=[50,100,200,500,1000].map(T=>{ const a=K.zsN(T), c=J1000.zeros.filter(g=>g<T).length; return {T,ap:a.N,raw:a.raw,c,vm:K.zsNvm(T)}; });
  check(rows.every(r=>r.ap===r.c&&Math.abs(r.raw-r.ap)<1e-9),'N(T) by the argument principle = sign changes of Z, T = 50, 100, 200, 500, 1000',rows.map(r=>`N(${r.T}) = ${r.ap}/${r.c}`).join(' · ')+` · ${J1000.evals} Z-evaluations in ${ms1000.toFixed(0)} ms`);
  check(J1000.zeros.length===649,'649 zeros of ζ on the critical line with 0 < t < 1000',`found ${J1000.zeros.length}, γ₆₄₉ = ${J1000.zeros[648].toFixed(10)}`);
  check(Math.abs(J1000.zeros[99]-236.524229665816)<1e-8,'γ₁₀₀ = 236.524229665816…',`${J1000.zeros[99].toFixed(12)}`);
  check(rows.every(r=>Math.abs(r.ap-r.vm)<1),'Riemann–von Mangoldt main term (T/2π)log(T/2πe) + 7/8 within 1 of N(T)',rows.map(r=>`T=${r.T}: ${r.vm.toFixed(3)} vs ${r.ap}`).join(' · '));
  let mg=1e9, at=0; for(let i=1;i<649;i++){ const g=J1000.zeros[i]-J1000.zeros[i-1]; if(g<mg){ mg=g; at=J1000.zeros[i-1]; } }
  const Jc=K.zsZeros(0,1000,1);
  check(Jc.zeros.length===649&&Jc.pairs>0,'close pairs: a coarse grid (step 0.5) hides pairs between samples; the dip search at local minima of |Z| recovers them',`coarse grid ${Jc.zeros.length} zeros, ${Jc.pairs} pairs from ${Jc.dips} dips · smallest gap below 1000: ${mg.toFixed(6)} at t = ${at.toFixed(4)}`); }
// 10. boxes by the argument principle
{ const [B1,m1]=timed('box [7/8,1.2]×[10,100]',()=>K.zsBoxCount(7/8,1.2,10,100)), [B2,m2]=timed('box [0.05,0.95]×[10,100]',()=>K.zsBoxCount(0.05,0.95,10,100));
  check(B1.count===0&&Math.abs(B1.raw)<1e-9,'no zero in the box [7/8, 1.2] × [10, 100] (winding number of ζ round the boundary)',`winding ${B1.raw.toExponential(2)} · min |ζ| on boundary ${B1.minAbs.toFixed(4)} · ${B1.evals} evaluations, ${m1.toFixed(1)} ms`);
  check(B2.count===29&&Math.abs(B2.raw-29)<1e-9,'box [0.05, 0.95] × [10, 100] holds 29 zeros = the critical-line count',`winding ${B2.raw.toFixed(12)} · min |ζ| ${B2.minAbs.toFixed(4)} · ${B2.evals} evaluations, ${m2.toFixed(1)} ms`);
  const [B3,m3]=timed('boxes at t ∈ [1000,1120]',()=>[K.zsBoxCount(7/8,1.2,1000,1120),K.zsBoxCount(0.05,0.95,1000,1120)]), Jw=K.zsZeros(1000,1120), Nw=K.zsN(1120).N-K.zsN(1000).N;
  check(B3[0].count===0&&B3[1].count===Jw.zeros.length&&Nw===Jw.zeros.length,'at t ∈ [1000, 1120]: box [7/8, 1.2] empty; box [0.05, 0.95] = sign changes = N(1120) − N(1000)',`${B3[0].count} · ${B3[1].count} · ${Jw.zeros.length} · ${Nw} · min |ζ| ${B3[0].minAbs.toFixed(4)}, ${B3[1].minAbs.toFixed(4)} · ${m3.toFixed(0)} ms`);
  const B4=K.zsBoxCount(0.5,1.5,-1,1);
  check(B4.winding===-1&&B4.count===0,'the pole at s = 1: the winding round [0.5, 1.5] × [−1, 1] is −1, so zeros − poles = −1, zeros = 0',`winding ${B4.raw.toFixed(12)}`); }
// 11. Gram’s law and its first failure (Hutchinson 1925)
{ let first=null; for(let n=-1;n<=200&&first===null;n++){ const g=K.zsGram(n); if((n%2===0?1:-1)*K.zsZ(g)<=0) first=[n,g]; }
  const g0=K.zsGram(0), GW=K.zsGramWindow(0,K.zsGram(400)+1e-6);
  check(first&&first[0]===126&&GW.fails[0][0]===126&&Math.abs(K.zsTheta(g0))<1e-12,'Gram’s law (−1)ⁿ Z(gₙ) > 0 holds for n = −1 … 125 and first fails at n = 126 (Hutchinson 1925)',`g₀ = ${g0.toFixed(10)}, g₁₂₆ = ${first?first[1].toFixed(8):'—'}, Z(g₁₂₆) = ${first?K.zsZ(first[1]).toFixed(6):'—'} · computed failures n ≤ 400: ${GW.fails.map(f=>f[0]).join(', ')} of ${GW.count} Gram points`); }
// 12. the height-field grid
{ const [G,mg]=timed('grid 64×192 on [−0.5,1.6]×[0,100]',()=>K.zsGrid(-0.5,1.6,0,100,64,192)); let w=0;
  for(let j=1;j<192;j+=5) for(let i=0;i<64;i+=3){ const s=-0.5+2.1*i/63, t=100*j/191, z=K.zsZeta(s,t); w=Math.max(w,Math.abs(0.5*Math.log(z[0]**2+z[1]**2)-G.logAbs[j*64+i])); }
  const [G2,mh]=timed('grid 64×192 on [−0.5,1.6]×[1000,1120]',()=>K.zsGrid(-0.5,1.6,1000,1120,64,192));
  check(mg<150&&w<1e-5&&G.logAbs[45]===Infinity,'grid of log|ζ|, arg ζ (shared row phases) = pointwise ζ; the pole cell s = 1 is +∞',`64×192 in ${mg.toFixed(1)} ms (t ≤ 100), ${mh.toFixed(1)} ms (t ≈ 1000) · max |Δ log|ζ|| ${e(w)}`); }
// 13. the regions drawn
{ const c=K.zsClassicalSigma(100), d=K.zsClassicalSigma(1000);
  check(c>K.ZS_QRH&&d>c&&d<1&&Number.isNaN(K.zsClassicalSigma(1)),'classical region σ ≥ 1 − 1/(5.558691 log t) lies right of 7/8 and tends to 1 (drawn for t ≥ 2)',`σ(100) = ${c.toFixed(5)}, σ(1000) = ${d.toFixed(5)}, 7/8 = ${K.ZS_QRH}, 11/12 = ${K.ZS_QRH2.toFixed(5)}`); }
console.log('timings: '+times.join(' · ')+` · total ${(performance.now()-T0).toFixed(0)} ms`);
console.log(`${pass} passed, ${fail} failed`);
process.exit(fail?1:0);
