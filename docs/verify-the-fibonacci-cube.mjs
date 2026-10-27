/* THE FIBONACCI CUBE (v4.406) — Preece & Batenin, «Rational Spectral Hierarchies and Matrix-Free Gauge Certificates» (FBS3R,
   23 October 2026): repository verifier on the page's own kernels (core/atlas/extracted.mjs, sliced from index.html).
   Every printed number of the manuscript is recomputed two ways (by the Hamiltonian and by the temporal-mask transfer that never
   builds it); the numerators found here beyond the paper are recomputed by the transfer and checked against sparse traces; and
   mutations that must fail, do. */
const K=await import(new URL('../core/atlas/extracted.mjs',import.meta.url));
let pass=0, fail=0; const t00=performance.now();
const check=(ok,claim,nums)=>{ if(ok) pass++; else fail++; console.log(`${ok?'PASS':'FAIL'} — ${claim} :: ${nums}`); };
const F=K.PX_FIB, eq=(a,b)=>a.length===b.length&&a.every((x,i)=>x===b[i]);

/* 1. words, addresses, flips */
{ let ok=true; for(let n=1;n<=14;n++){ const W=K.pxWords(n); if(W.length!==F[n+2]) ok=false;
    W.forEach((w,i)=>{ if(K.pxRank(n,w)!==i) ok=false; if(w&(w>>1)) ok=false; });
    const G=K.pxAdj(n); G.nb.forEach((l,i)=>l.forEach((j,q)=>{ const site=G.site[i][q]; if(Math.abs(j-i)!==F[n-site+2]||G.W[i]^G.W[j]^(1<<(site-1))) ok=false; })); }
  check(ok,'|C_n| = F_{n+2}; the Zeckendorf address r(s) = Σ s_j F_{n−j+2} numbers the words 0 … F_{n+2} − 1; every flip at site j moves it by ±F_{n−j+2} (n = 1 … 14)',`F_16 = ${F[16]} words at n = 14`); }
/* 2. the printed table, two ways */
{ const table={1:[2,2,2],2:[8,16,32],3:[42,190,866],4:[112,752,5296],5:[296,2860,30096],6:[684,8356,115636],8:[3208,56840,1206848],10:[13156,305460,8789188]}; let ok=true, n0=0;
  for(const n in table) [4,6,8].forEach((k,i)=>{ const a=K.pxMomentByH(+n,k), b=K.pxMomentByTransfer(+n,k); n0++; if(a!==BigInt(table[n][i])||b!==a) ok=false; });
  check(ok&&n0===24,'the 24 printed traces Tr A_n^{4,6,8} (n = 1 … 6, 8, 10), by the Hamiltonian and by the temporal-mask transfer that never builds it',`Tr A_10^8 = ${table[10][2]}`); }
/* 3–5. the numerators: one transfer pass per order, n = 1 … 3m + 4 */
const passes={};
for(const m of [2,3,4,5,6]){ const t=performance.now(), T=K.pxTransferStart(3*m+4,2*m); while(!K.pxTransferStep(T)){} const v=T.vals, Pm=K.pxNumerator(m,v.slice(0,3*m+3)), s=K.pxSeries(K.PX_PM[m],m,3*m+4);
  passes[m]={v, Pm, ok:eq(Pm,K.PX_PM[m])&&s[3*m+3]===v[3*m+3]&&s[3*m+4]===v[3*m+4], ms:performance.now()-t}; }
check([2,3,4].every(m=>passes[m].ok)&&eq(K.PX_PM[2],[0n,2n,2n,18n,-4n]),'P_2, P_3, P_4 from the transfer\'s first 3m + 3 values are exactly the printed numerators, and the series predicts the next two values',
  [2,3,4].map(m=>`P_${m}: ${passes[m].Pm.length-1}° (${passes[m].ms.toFixed(0)} ms)`).join(' · '));
{ const v5=passes[5].v; let byH=true; for(let n=1;n<=13;n++) if(K.pxMomentByH(n,10)!==v5[n]) byH=false;
  check(passes[5].ok&&byH&&K.PX_PM[5][13]===14560n,'beyond the paper: P_5 (order 10) recomputed by one transfer pass to n = 19 is the cited numerator, ending 14560z¹³; its next two values hold, and its first 13 values equal the Hamiltonian\'s',`${passes[5].ms.toFixed(0)} ms`); }
check(passes[6].ok&&K.PX_PM[6][16]===-546492n,'beyond the paper: P_6 (order 12) recomputed by one transfer pass to n = 22 is the cited numerator, ending −546492z¹⁶, and its next two values hold',`${passes[6].ms.toFixed(0)} ms`);
check([2,3,4,5,6].every(m=>K.PX_PM[m].length-1===3*m-2),'the degrees of P_2 … P_6 are 4, 7, 10, 13, 16 = 3m − 2 — four below the proven bound 3m + 2 (a pattern, stated as one)',[2,3,4,5,6].map(m=>K.PX_PM[m].length-1).join(', '));
/* 6. the flux certificate against brute force */
{ const g=K.hgRng?K.hgRng(17):null; let worst=0; const rows=[];
  for(const n of [5,6,7,8]) for(const phi of [0.4,1.1,2.9]){ const J=Array.from({length:n},(_,i)=>[1,2,-1,3,-2][(i*7+n)%5]), V=Array.from({length:F[n+2]},(_,i)=>Math.sin(1.3*i+n));
    const d=K.pxTrH4(n,J,V,phi)-K.pxTrH4(n,J,V,0), c=8*(Math.cos(phi)-1)*K.pxFluxS(n,J); worst=Math.max(worst,Math.abs(d-c)/Math.max(1,Math.abs(d))); }
  check(worst<1e-12,'Tr H_φ⁴ − Tr H_0⁴ = 8(cos φ − 1) S_n with R_j = R_{j−1} + R_{j−2} + w_{j−2}F_{j−2}, under integer couplings and a static diagonal field, against brute force (n = 5 … 8, three phases)',`max relative error ${worst.toExponential(1)}`); }
/* 7. the plaquettes */
{ let ok=true; for(const n of [6,8,9]){ const W=K.pxWords(n), S=new Set(W);
    for(let i=1;i<=n;i++) for(let j=i+2;j<=n;j++){ let c=0; for(const w of W){ const bi=1<<(i-1), bj=1<<(j-1); if(w&bi||w&bj) continue; if(S.has(w|bi)&&S.has(w|bj)&&S.has(w|bi|bj)) c++; } if(c!==F[i]*F[j-i-1]*F[n-j+1]) ok=false; } }
  check(ok,'the squares through flips i and j: Q_ij(n) = F_i F_{j−i−1} F_{n−j+1}','n = 6, 8, 9'); }
/* 8. the eigensystem, the scars and the revival */
{ const S=K.pxScars(12), N=S.N; let ok=true; for(const k of [2,4,6]){ let s=0; for(const e of S.E.vals) s+=e**k; if(Math.abs(s-Number(K.pxMomentByH(12,k)))>1e-6*s) ok=false; }
  const top=Array.from(S.ov).map((o,i)=>[o,i]).sort((a,b)=>b[0]-a[0]).slice(0,6).map(([,i])=>S.E.vals[i]), has=e=>top.some(x=>Math.abs(Math.abs(x)-e)<0.02);
  let mx=0, tm=0; for(let k=0;k<=400;k++){ const t=3.5+k*0.005, r=S.ret(t); if(r>mx){ mx=r; tm=t; } }
  const med=Array.from(S.ov).sort((a,b)=>a-b)[N>>1];
  check(ok&&has(1.329)&&has(2.736)&&mx>0.74&&Math.abs(tm-4.72)<0.03&&med<1e-3,'n = 12: Σ E^k = Tr A^k (k = 2, 4, 6); the levels most like |Z₂⟩ stand at ±1.33, ±2.74 …, a typical level a thousand times weaker; the walk from |Z₂⟩ returns with probability 0.743 at t ≈ 4.72 = 2π/1.33',
    `return ${mx.toFixed(3)} at t = ${tm.toFixed(3)} · median overlap ${med.toExponential(1)} · top levels ${top.map(x=>x.toFixed(2)).join(', ')}`); }
/* 9. the Gaussian limit, from the exact series */
{ const n=400, fb=k=>{ let a=0n, b=1n; for(let i=0;i<k;i++){ const t=a+b; a=b; b=t; } return a; }, dim=fb(n+2), M2=2n*(BigInt(n)*fb(n+1)+2n*BigInt(n+1)*fb(n))/5n;
  const q=(a,b)=>Number(a*10n**15n/b)/1e15, m2n=q(M2,dim*BigInt(n)), ratios=[2,3,4,5,6].map(m=>q(K.pxSeries(K.PX_PM[m],m,n)[n]*dim**BigInt(m-1),M2**BigInt(m))), gauss=[3,15,105,945,10395];
  check(Math.abs(m2n-(1-1/Math.sqrt(5)))<0.002&&ratios.every((r,i)=>Math.abs(r/gauss[i]-1)<0.05&&r<gauss[i]),'the variance per state tends to (1 − 1/√5)·n and the moment ratios to the Gaussian 3, 15, 105, 945, 10395 (from below; at n = 400 from the exact series)',
    `Tr A²/dim/n = ${m2n.toFixed(5)} vs ${(1-1/Math.sqrt(5)).toFixed(5)} · ${ratios.map(r=>r.toFixed(2)).join(', ')}`); }
/* 10. mutations that must fail */
{ const bad=K.PX_PM[5].slice(); bad[7]+=1n; const s=K.pxSeries(bad,5,19);
  const m1=s[18]!==passes[5].v[18]||s[19]!==passes[5].v[19];
  /* without the blockade the transfer counts the hypercube: Tr Q_n^4 = n(3n − 2)·2^n */
  const T=K.pxTransferStart(6,4); T.D=T.D; const hyper=(n)=>{ const K2=16, D=T.D; let cur=Array.from({length:K2},()=>null); cur[0]=new Map([[0,1n]]);
    for(let j=0;j<n;j++){ const nx=Array.from({length:K2},()=>null); for(let a=0;a<K2;a++){ const P=cur[a]; if(!P) continue; for(let b=0;b<K2;b++){ const d=D[b]; let Q=nx[b]; for(const [S2,c] of P){ if(S2&d) continue; if(!Q){ Q=new Map(); nx[b]=Q; } Q.set(S2|d,(Q.get(S2|d)||0n)+c); } } } cur=nx; }
    let t=0n; for(const P of cur) if(P&&P.has(15)) t+=P.get(15); return t; };
  const h6=hyper(6);
  check(m1&&h6===BigInt(6*(3*6-2)*64)&&h6!==K.pxMomentByH(6,4),'mutations fail: one coefficient of P_5 off by one misses the values past its range; dropping the blockade from the transfer counts the hypercube instead (Tr Q_6⁴ = 6·16·2⁶ = 6144, not 684)',`${h6} ≠ ${K.pxMomentByH(6,4)}`); }

console.log(`\n${pass} passed, ${fail} failed · ${(performance.now()-t00).toFixed(0)} ms`);
process.exit(fail?1:0);
