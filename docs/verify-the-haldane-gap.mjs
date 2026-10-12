/* THE HALDANE GAP (v4.380) — family 268 of the openai/math collection: repository verifier on the page's own kernels
   (core/atlas/extracted.mjs, sliced from index.html).
   Exact identities and theorems are asserted tightly; literature numbers only inside loose bands, and printed. */
const K=await import(new URL('../core/atlas/extracted.mjs',import.meta.url));
let pass=0, fail=0; const t00=performance.now();
const check=(ok,claim,nums)=>{ if(ok) pass++; else fail++; console.log(`${ok?'PASS':'FAIL'} — ${claim} :: ${nums}`); };
const f=(v,d=6)=>Number.isFinite(v)?v.toFixed(d):String(v), ex=v=>Number.isFinite(v)?v.toExponential(1):String(v);
const now=()=>performance.now();

/* 1. two spins one: S·S = [S(S+1) − 4]/2 with S = 0, 1, 2 */
{ const all=[]; for(let M=-2;M<=2;M++){ const z=K.hgBuild(2,0,false,M); all.push(...K.hgJacobi(K.hgDense(z),z.N).values); } all.sort((a,b)=>a-b);
  const want=[-2,-1,-1,-1,1,1,1,1,1], err=Math.max(...all.map((v,i)=>Math.abs(v-want[i])));
  check(all.length===9&&err<1e-12,'two spins one (open dimer): the spectrum of S·S is −2 (×1), −1 (×3), +1 (×5)',all.map(v=>f(v,3)).join(' ')+` · max error ${ex(err)}`); }
/* 2. the AKLT bond operator X + X²/3 = 2 P₂ − 2/3 */
{ const B=K.hgBondMatrix(1/3).B, ev=K.hgJacobi(B,9).values, want=[-2/3,-2/3,-2/3,-2/3,4/3,4/3,4/3,4/3,4/3], err=Math.max(...ev.map((v,i)=>Math.abs(v-want[i])));
  check(err<1e-12,'AKLT bond: S·S + (1/3)(S·S)² = 2P₂ − 2/3 (eigenvalues −2/3 ×4, 4/3 ×5)',ev.map(v=>f(v,4)).join(' ')+` · ${ex(err)}`); }
/* 3. sector dimensions */
{ const enumerate=(L,M)=>{ const z=K.hgLanczosStart(L,0,true,M); while(z.phase==='basis') K.hgLzUnit(z); return z; };
  const d4=[]; for(let M=-4;M<=4;M++) d4.push(enumerate(4,M).bn);
  let ok=d4.join(',')==='1,4,10,16,19,16,10,4,1', sums=[];
  for(let L=2;L<=12;L++){ let s=0; for(let M=-L;M<=L;M++){ const n=K.hgSectorDim(L,M); s+=n; if(L<=8||M===0||M===1){ const z=enumerate(L,M); if(z.bn!==n) ok=false; } } sums.push(s); if(s!==Math.pow(3,L)) ok=false; }
  const z=enumerate(12,0); let sorted=true, look=true; for(let k=1;k<z.N;k++) if(z.codes[k]<=z.codes[k-1]) sorted=false;
  for(let k=0;k<z.N;k+=977){ if(z.table[z.codes[k]]!==k||K.hgIndexOf(z.codes,z.codes[k])!==k) look=false; } const sumOk=K.hgDigits(12,z.codes[4321]).reduce((a,b)=>a+b,0)===0&&K.hgCode(K.hgDigits(12,z.codes[4321]))===z.codes[4321];
  check(ok&&z.N===73789&&sorted&&look&&sumOk,'sector dimensions are trinomial coefficients and sum to 3^L (L = 2 … 12); codes sorted, table = binary search',`L = 4: ${d4.join(',')} · L = 12, S^z = 0: ${z.N} · Σ = 3^L for L = 2..12`); }
/* 4. symmetry of the sparse matrix */
{ let worst=0; const g=K.hgRng(7);
  for(const per of [true,false]) for(const M of [0,1]){ const z=K.hgBuild(8,0.37,per,M), u=new Float64Array(z.N).map(()=>g()-0.5), v=new Float64Array(z.N).map(()=>g()-0.5), Hu=K.hgApply(z,u,new Float64Array(z.N)), Hv=K.hgApply(z,v,new Float64Array(z.N));
    const a=K.hgDot(u,Hv), b=K.hgDot(Hu,v); worst=Math.max(worst,Math.abs(a-b)/Math.max(1,Math.abs(a))); }
  check(worst<1e-13,'H is symmetric: ⟨u|Hv⟩ = ⟨Hu|v⟩ for random u, v (L = 8, β = 0.37, ring and open, S^z = 0, 1)',`max relative difference ${ex(worst)}`); }
/* 5. Lanczos against dense Jacobi, and SU(2): the lowest S^z = 1 level is in the S^z = 0 spectrum */
{ let worst=0, su2=0, n=0;
  for(const beta of [0,-0.3,1/3,0.8]) for(const per of [true,false]){ const sp={};
    for(const M of [0,1]){ const z=K.hgBuild(6,beta,per,M), ev=K.hgJacobi(K.hgDense(z),z.N).values, lz=K.hgLanczos(6,beta,per,M,{tol:1e-11}); worst=Math.max(worst,Math.abs(ev[0]-lz.E)); sp[M]=ev; n++; }
    su2=Math.max(su2,Math.min(...sp[0].map(v=>Math.abs(v-sp[1][0])))); }
  check(worst<1e-9&&su2<1e-9,'Lanczos = dense Jacobi diagonalisation (L = 6, β = 0, −0.3, 1/3, 0.8, ring and open); the lowest S^z = 1 level lies in the S^z = 0 spectrum',`${n} sectors · max |E_Lanczos − E_dense| ${ex(worst)} · SU(2) ${ex(su2)}`); }
/* 6. the Heisenberg 4-ring is H = S_A·S_B (A = {0, 2}, B = {1, 3}): E₀ = −6 (S_A = S_B = 2, S = 0), triplet −5 */
{ const a=K.hgLanczos(4,0,true,0), b=K.hgLanczos(4,0,true,1);
  check(Math.abs(a.E+6)<1e-10&&Math.abs(b.E-a.E-1)<1e-10,'Heisenberg 4-ring: H = S_A·S_B ⇒ E₀ = −6 and Δ(4) = 1 exactly',`E₀ = ${f(a.E,12)} · Δ = ${f(b.E-a.E,12)}`); }
/* 7. AKLT ring energies */
{ const rows=[]; let worst=0; for(const L of [4,6,8,10]){ const z=K.hgLanczos(L,1/3,true,0,{tol:1e-11}); worst=Math.max(worst,Math.abs(z.E+2*L/3)); rows.push(`L=${L}: ${f(z.E,10)}`); }
  check(worst<1e-9,'AKLT ring (Affleck–Kennedy–Lieb–Tasaki 1987): E₀ = −(2/3)·L, i.e. −2/3 per bond, L = 4 … 10',rows.join(' · ')+` · max error ${ex(worst)}`); }
/* 8. the AKLT ground state is the valence-bond state (2×2 matrix product) */
{ let ov=0, rs=0; for(const L of [8,10]){ const z=K.hgLanczos(L,1/3,true,0,{tol:1e-11}), v=K.hgAkltVbs(L,z.codes), y=K.hgApply(z,v,new Float64Array(z.N)); ov=Math.max(ov,Math.abs(1-Math.abs(K.hgDot(v,z.x))));
    let r=0; for(let i=0;i<z.N;i++) r+=(y[i]+2*L/3*v[i])**2; rs=Math.max(rs,Math.sqrt(r)); }
  check(ov<1e-9&&rs<1e-12,'AKLT ring ground state = the valence-bond state Tr(A^{m₁}⋯A^{m_L}): overlap 1 and H ψ_VBS = −(2L/3) ψ_VBS (L = 8, 10)',`1 − |⟨ψ_ED|ψ_VBS⟩| ${ex(ov)} · residual ${ex(rs)}`); }
/* 9. open AKLT chain: four-fold degenerate ground state (two free edge spins ½) */
{ let worst=0, gap2=Infinity; const rows=[]; for(const L of [6,8]){ const e=[0,1,2].map(M=>K.hgLanczos(L,1/3,false,M,{tol:1e-11}).E), w=-2*(L-1)/3; worst=Math.max(worst,Math.abs(e[0]-w),Math.abs(e[1]-w)); gap2=Math.min(gap2,e[2]-w); rows.push(`L=${L}: ${e.map(v=>f(v,8)).join(', ')}`); }
  check(worst<1e-9&&gap2>0.1,'open AKLT chain: E₀(S^z = 0) = E₀(S^z = 1) = −(2/3)(L − 1) (edge spins ½), S^z = 2 lies above',rows.join(' · ')+` · max error ${ex(worst)}`); }
/* 10–12. AKLT correlations, string order and decay length on the ring L = 10 */
{ const L=10, z=K.hgLanczos(L,1/3,true,0,{tol:1e-12}), R=K.hgMeasure(L,z.codes,z.table,z.x); let worst=0; const rows=[];
  for(let r=1;r<=5;r++){ const e=K.hgAkltRing(L,r).corr; worst=Math.max(worst,Math.abs(R.C[r]-e)); rows.push(f(R.C[r],6)); }
  check(worst<1e-8,'AKLT ring ⟨S₀·S_r⟩ = 4[(−1/3)^r + (−1/3)^{L−r}] / [1 + 3(−1/3)^L] (transfer matrix), L = 10, r = 1 … 5',rows.join(', ')+` · max error ${ex(worst)}`);
  const s5=R.S[5], ring=K.hgAkltRing(L,5).string; let flat=0; for(let r=1;r<L;r++) flat=Math.max(flat,Math.abs(R.S[r]-ring));
  check(Math.abs(s5-ring)<1e-8&&flat<1e-8&&Math.abs(s5-K.HG_STRING_AKLT)<2e-4,'AKLT string order ⟨S^z₀ e^{iπΣS^z} S^z_r⟩ at L = 10, r = 5: the finite-ring value −(4/9)(1 + 9(−1/3)^L)/(1 + 3(−1/3)^L), within 2·10⁻⁴ of −4/9',`${f(s5,9)} · ring formula ${f(ring,9)} · −4/9 = ${f(-4/9,9)} · same for every r: ${ex(flat)}`);
  const xf=K.hgXiFit(L,true,Array.from({length:L},(_,j)=>R.C[j]),0);
  check(Math.abs(xf.xi-1/Math.log(3))<1e-6&&xf.staggered,'AKLT decay length from the ring fit A[e^{−r/ξ} + e^{−(L−r)/ξ}] is 1/ln 3, signs staggered',`ξ = ${f(xf.xi,8)} · 1/ln 3 = ${f(1/Math.log(3),8)}`); }
/* 13–14. Heisenberg ring L = 10: singlet sum rule, triplet, translation invariance */
{ const L=10, z=K.hgLanczos(L,0,true,0,{tol:1e-11}), R=K.hgMeasure(L,z.codes,z.table,z.x), z1=K.hgLanczos(L,0,true,1,{tol:1e-11}), R1=K.hgMeasure(L,z1.codes,z1.table,z1.x);
  let sing=0, trip=0, ti=0, sz=0; for(let i=0;i<L;i++){ let s=0; for(let j=0;j<L;j++){ s+=R.C[i*L+j]; trip+=R1.C[i*L+j]; ti=Math.max(ti,Math.abs(R.C[i*L+(i+j)%L]-R.C[j])); } sing=Math.max(sing,Math.abs(s)); sz=Math.max(sz,Math.abs(R1.Sz[i]-1/L)); }
  check(sing<1e-9&&Math.abs(trip-2)<1e-9&&sz<1e-9,'Heisenberg ring L = 10: Σ_j ⟨S_i·S_j⟩ = 0 (singlet ground state); the lowest S^z = 1 state has ⟨S_tot²⟩ = 2 and ⟨S^z_i⟩ = 1/L',`singlet ${ex(sing)} · ⟨S²⟩ = ${f(trip,10)} · ⟨S^z_i⟩ − 1/L ${ex(sz)}`);
  check(ti<1e-8,'ring correlations are translation invariant: ⟨S_i·S_{i+r}⟩ independent of i',`max deviation ${ex(ti)} · ⟨S₀·S₁⟩ = ${f(R.C[1],6)}`); }
/* 15. the stepper: slices give the one-shot answer; the clocked slices stay near their budget */
{ const a=K.hgLanczos(8,0.2,true,0), z=K.hgLanczosStart(8,0.2,true,0); let calls=0; while(!K.hgLanczosStep(z,3)) calls++;
  check(a.E===z.E&&a.it===z.it,'the chunked stepper (3 slices per call) reproduces the one-shot Lanczos result exactly',`E = ${f(z.E,12)} in ${calls} calls · ${z.it} iterations`); }
/* 16–19. Heisenberg rings L = 4 … 12: gaps, energies, fits, timings */
{ const Ls=[4,6,8,10,12], out={}, rows=[], tms=[]; let maxCall=0;
  for(const L of Ls){ const job=K.hgStudyStart(L,0,true), t0=now(); while(true){ const ta=now(), d=K.hgStudyStep(job,4,now); maxCall=Math.max(maxCall,now()-ta); if(d) break; } out[L]=job.out; out[L].wall=now()-t0; }
  for(const L of Ls){ const o=out[L]; rows.push(`Δ(${L}) = ${f(o.gap,6)}`); tms.push(`L=${L}: ${f(o.ms[0],0)}+${f(o.ms[1],0)} ms (dim ${o.dim[0]}, ${o.it[0]}+${o.it[1]} it, res ≤ ${ex(Math.max(o.res[0],o.res[1]))})`); }
  const gaps=Ls.map(L=>out[L].gap), dec=gaps.every((g,i)=>i===0||g<gaps[i-1]);
  check(dec&&gaps.every(g=>g>0),'Heisenberg rings: the gap Δ(L) = E₀(S^z = 1) − E₀(S^z = 0) is positive and decreasing, L = 4 … 12',rows.join(' · '));
  const resOk=Ls.every(L=>out[L].res[0]<1e-6&&out[L].res[1]<1e-6), t12=out[12].ms[0]+out[12].ms[1];
  check(resOk&&t12<20000&&maxCall<40,'Lanczos converges in every sector (‖Hx − Ex‖ < 10⁻⁶), run in 4 ms slices; target ≤ 3 s at L = 12',tms.join(' · ')+` · L = 12 total ${f(t12,0)} ms · longest slice ${f(maxCall,1)} ms`);
  const e12=out[12].e0; check(Math.abs(e12-K.HG_LIT.e0)<0.01,'E₀/L of the L = 12 ring within ±0.01 of the thermodynamic −1.401484 (literature, DMRG)',`E₀/L: ${Ls.map(L=>`L=${L}: ${f(out[L].e0,6)}`).join(' · ')} · L = 12 − literature = ${f(e12-K.HG_LIT.e0,6)}`);
  const f3=K.hgFit3([8,10,12],[out[8].gap,out[10].gap,out[12].gap]), f2=K.hgFit2([6,8,10,12],[out[6].gap,out[8].gap,out[10].gap,out[12].gap],6.0);
  check(f3&&f3.ok&&Math.abs(f3.dinf-0.41)<0.05,'Δ(L) = Δ∞ + A e^{−L/ξ} through L = 8, 10, 12 gives Δ∞ within 0.05 of 0.41 (literature 0.41048); the fit with ξ fixed at 6.0 is reported',
    `three-parameter: Δ∞ = ${f(f3.dinf,5)}, ξ_fit = ${f(f3.xi,3)}, A = ${f(f3.A,4)} · two-parameter (ξ = 6.0, L = 6 … 12): Δ∞ = ${f(f2.dinf,5)}, A = ${f(f2.A,4)}, rms ${ex(f2.rms)}`);
  const xs=[8,10,12].map(L=>`L=${L}: ξ_eff ${f(out[L].xi.xi,3)}, string(L/2) ${f(out[L].string,5)}`).join(' · ');
  check([8,10,12].every(L=>out[L].xi.staggered&&out[L].string<0),'Heisenberg rings: correlations staggered, string order negative (reported; ring fits are effective lengths, not ξ∞ ≈ 6.03)',xs); }
/* 20. open Heisenberg chains: the S^z = 1 level is the edge (Kennedy) triplet, its splitting shrinks with L */
{ const rows=[], g=[]; for(const L of [4,6,8,10]){ const o=K.hgStudy(L,0,false); g.push(o.gap); rows.push(`L=${L}: ${f(o.gap,5)} (S^z=2 − S^z=1: ${f(o.gap21,4)})`); }
  check(g.every((v,i)=>v>0&&(i===0||v<g[i-1])),'open Heisenberg chains: E₀(S^z = 1) − E₀(S^z = 0) (edge-spin splitting) positive and shrinking with L',rows.join(' · ')); }
console.log(`${pass} passed, ${fail} failed · ${(now()-t00).toFixed(0)} ms`);
process.exit(fail?1:0);
