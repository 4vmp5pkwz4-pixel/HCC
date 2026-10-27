/* THE HALDANE GAP — THE CLAIMED PROOF, RE-RUN (v4.405) — family 268 of the openai/math collection: repository verifier on the
   page's own kernels (core/atlas/extracted.mjs, sliced from index.html).
   The page diagonalises the twisted rings of the paper's Lemma 5.1, re-derives its §5 and the hypotheses of its Prop. 4.3 in exact
   BigInt rationals and recomputes the energy of its trial state. Each clause below is checked against an independent construction
   written here (brute force in the plain weight basis, and the Cartesian definition with the actual rotation matrices), against
   the numbers printed in the paper, and against mutations that must fail. */
const K=await import(new URL('../core/atlas/extracted.mjs',import.meta.url));
let pass=0, fail=0; const t00=performance.now();
const check=(ok,claim,nums)=>{ if(ok) pass++; else fail++; console.log(`${ok?'PASS':'FAIL'} — ${claim} :: ${nums}`); };
const ex=v=>Number.isFinite(v)?v.toExponential(2):String(v);

/* brute force: the twisted ring straight from the weight-basis rules, as a real symmetric matrix of twice the size */
function direct(n,theta){ const N=3**n, re=new Float64Array(N*N), im=new Float64Array(N*N), dig=c=>{ const d=[]; for(let k=0;k<n;k++){ d.push(c%3); c=(c-c%3)/3; } return d; };
  for(let c=0;c<N;c++){ const d=dig(c); let e=0; for(let j=0;j<n;j++) e+=(d[(j+n-1)%n]-1)*(d[j]-1); re[c*N+c]+=e;
    for(let j=0;j<n;j++){ const jp=(j+1)%n; for(const del of [1,-1]){ if(d[j]+del<0||d[j]+del>2||d[jp]-del<0||d[jp]-del>2) continue;
      const r=c+del*3**j-del*3**jp, ph=j===n-1?theta*del:0; re[r*N+c]+=Math.cos(ph); im[r*N+c]+=Math.sin(ph); } } }
  const M=2*N, A=new Float64Array(M*M);
  for(let i=0;i<N;i++) for(let j=0;j<N;j++){ const a=re[i*N+j], b=im[i*N+j]; A[i*M+j]=a; A[(i+N)*M+j+N]=a; A[i*M+j+N]=-b; A[(i+N)*M+j]=b; }
  const ev=K.hgJacobi(A,M).values; return Float64Array.from(ev.filter((_,k)=>k%2===0)); }
/* the Cartesian definition (2.3): S^α = −iε_α, so S^α ⊗ S^α = −G_α ⊗ G_α is real; the seam carries g G_α g^T on site 0 */
function cartesian(n,g){ const G=K.HGP_GM, N=3**n, H=new Float64Array(N*N), dig=c=>{ const d=[]; for(let k=0;k<n;k++){ d.push(c%3); c=(c-c%3)/3; } return d; };
  const rot=a=>{ const o=new Float64Array(9); for(let i=0;i<3;i++) for(let j=0;j<3;j++){ let s=0; for(let k=0;k<3;k++) for(let l=0;l<3;l++) s+=g[i*3+k]*G[a][k*3+l]*g[j*3+l]; o[i*3+j]=s; } return o; };
  const GR=[0,1,2].map(rot);
  for(let c=0;c<N;c++){ const d=dig(c);
    for(let r=0;r<N;r++){ const e=dig(r); let h=0;
      for(let j=0;j<n;j++){ const jp=(j+1)%n; let same=true; for(let k=0;k<n;k++) if(k!==j&&k!==jp&&d[k]!==e[k]) { same=false; break; } if(!same) continue;
        for(let a=0;a<3;a++){ const B=j===n-1?GR[a]:G[a]; h-=G[a][e[j]*3+d[j]]*B[e[jp]*3+d[jp]]; } }
      H[r*N+c]=h; } }
  return Float64Array.from(K.hgJacobi(H,N).values); }
const maxd=(a,b)=>a.length!==b.length?Infinity:Math.max(...Array.from(a,(v,i)=>Math.abs(v-b[i])));

/* 1. the gauge-spread twist and the momentum blocks against brute force */
{ let worst=0, rows=[]; for(const n of [4,5]) for(const th of [0,Math.PI,2*Math.PI/3,0.83]){ const a=K.hgpSpectrum(n,th), b=direct(n,th), d=maxd(a,b); worst=Math.max(worst,d); rows.push(`n=${n} θ=${th.toFixed(3)}: ${ex(d)}`); }
  check(worst<1e-10,'the twisted ring in S^z × momentum blocks (seam phase spread by the diagonal gauge e^{−i(θ/n)Σ j x_j}) has the spectrum of the twisted ring built straight from the weight-basis rules, M < 0 by negation + conjugation included',rows.join(' · ')); }
/* 2. the twist conventions against the actual rotations (P = diag(1, −1, −1), C: e_x → e_y → e_z) */
{ const P=Float64Array.of(1,0,0,0,-1,0,0,0,-1), C=Float64Array.of(0,0,1,1,0,0,0,1,0), I=Float64Array.of(1,0,0,0,1,0,0,0,1); let worst=0; const rows=[];
  for(const [g,th,nm] of [[I,0,'1'],[P,Math.PI,'P'],[C,2*Math.PI/3,'C']]){ const d=maxd(cartesian(4,g),K.hgpSpectrum(4,th)); worst=Math.max(worst,d); rows.push(`${nm}: ${ex(d)}`); }
  check(worst<1e-10,'the Cartesian definition (2.3) with the actual rotation matrices P = diag(1, −1, −1) and C (e_x → e_y → e_z) on the closing bond has the spectra of the weight-basis twists θ = π and 2π/3 (L = 4)',rows.join(' · ')); }
/* 3. the Hermitian eigensolver against Jacobi on the real embedding */
{ const g=K.hgRng(11), n=23, re=new Float64Array(n*n), im=new Float64Array(n*n);
  for(let i=0;i<n;i++) for(let j=0;j<=i;j++){ const a=g()-0.5, b=i===j?0:g()-0.5; re[i*n+j]=a; re[j*n+i]=a; im[i*n+j]=b; im[j*n+i]=-b; }
  const M=2*n, A=new Float64Array(M*M); for(let i=0;i<n;i++) for(let j=0;j<n;j++){ A[i*M+j]=re[i*n+j]; A[(i+n)*M+j+n]=re[i*n+j]; A[i*M+j+n]=-im[i*n+j]; A[(i+n)*M+j]=im[i*n+j]; }
  const d=maxd(K.hgpEigH(re,im,n),Float64Array.from(K.hgJacobi(A,M).values.filter((_,k)=>k%2===0)));
  check(d<1e-12,'complex Householder + implicit QL = Jacobi on the real embedding [[Re, −Im], [Im, Re]] (random Hermitian 23 × 23)',ex(d)); }
/* 4. the live recomputation: twelve spectra, every trace against the independent diagonalisation and the printed centres */
{ const t=performance.now(), R=K.hgpRunStart(); while(!K.hgpRunStep(R)){} let rel=0;
  for(const key in R.live){ const [n,g]=key.split('|'), ind=K.HGP_IND[n][g]; rel=Math.max(rel,Math.abs(R.live[key].z21-ind[0])/ind[0],Math.abs(R.live[key].z49-ind[1])/ind[1]); }
  const dims=Object.entries(R.live).every(([k,v])=>v.dim===3**parseInt(k.split('|')[0]));
  check(Object.keys(R.live).length===12&&dims&&rel<1e-11,'the page recomputes the twelve twisted spectra L ≤ 8 (g = 1, P; C at L = 6, 8), every dimension 3^L, and its traces agree with the independent diagonalisation',`${R.blocks} blocks in ${(performance.now()-t).toFixed(0)} ms · max relative difference ${ex(rel)}`);
  const rows=K.hgpCompare(K.hgpMerged(R.live)), worst=Math.max(...rows.map(r=>r[5]));
  check(rows.length===27&&rows.every(r=>r[7])&&worst<1e-6,'all 27 traces of Lemma 5.1 lie within the stated error of the printed centres (10⁻⁵ at b = 21/2, 3·10⁻⁵ at b = 49/4) — and within 10⁻⁶',`max |computed − printed| = ${worst.toExponential(3)} at ${(r=>`L = ${r[0]}, b = ${r[1]}, g = ${r[2]}`)(rows.find(r=>r[5]===worst))}`); }
/* 5. the exact chain on the printed table */
const chain=K.hgpChain(K.hgpTable('paper'));
{ const want=[[151249n,2500000n,433453n,2500000n],[343303n,5000000n,1632381n,10000000n],[44601n,625000n,361773n,2500000n],[632939n,10000000n,1055161n,10000000n],[375793n,10000000n,445941n,10000000n],[84513n,10000000n,27493n,5000000n]];
  const tbl=chain.table.every(([p,q],j)=>p[0]===want[j][0]&&p[1]===want[j][1]&&q[0]===want[j][2]&&q[1]===want[j][3]);
  check(chain.ok&&chain.steps.length===22,'every inequality of §5.2, §5.3 and the hypotheses of Prop. 4.3 hold in exact rationals on the printed table',chain.steps.map(s=>s.id).join(' ')+` · ${chain.steps.filter(s=>s.ok).length}/22`);
  check(tbl,'the six coupled updates, rounded up to 10⁻⁷, reproduce the printed table fraction by fraction, ending at p₆ = 84513/10⁷, q₆ = 27493/(5·10⁶) < 1/100',chain.table.map(([p,q])=>`${p[0]}/${p[1]}, ${q[0]}/${q[1]}`).join(' · '));
  const st=Object.fromEntries(chain.steps.map(s=>[s.id,s]));
  check(chain.BJ===318604.54848175&&chain.BN===48169.880699&&chain.mJ===1.0657205&&chain.mN===0.2783155&&chain.p0<0.047916&&chain.q0<0.181521,'B_J = 318604.54848175 and B_N = 48169.880699 exactly; m_J = 1.0657205, m_N = 0.2783155; p₀ < 0.047916, q₀ < 0.181521, as printed',`p₀ = ${chain.p0.toFixed(9)} · q₀ = ${chain.q0.toFixed(9)}`);
  check(chain.S60>0.8756&&chain.T120>0.876&&Math.abs(chain.R[2]-0.068404)<1e-12&&st.FJ.margin>180&&st.FN49.margin>654&&st.FI.margin>0.0301&&st.FN.margin>0.3463,'S(60, 105/4) > 0.8756 and T(120, 105/4) > 0.8760 (> 7/8); R(0.998) = 0.068404; the filter margins exceed the printed 0.0301, 0.3463, 180 and 654',`S = ${chain.S60.toFixed(7)} · T = ${chain.T120.toFixed(7)} · F_J − B_J = ${st.FJ.margin.toFixed(3)} · F_N − B_N = ${st.FN49.margin.toFixed(3)}`);
  const G=K.hgpG(K.hgpQ(1,8));
  check(G[0]===913952n&&G[1]===117649n&&Math.abs(chain.gap60-4/105*Math.log(80/79))<1e-15&&Math.abs(chain.gap2304-Math.log(20)/784)<1e-15,'Prop. 4.3: G(1/8) = 913952/117649 exactly; the bounds (4/105) ln(80/79) (L ≥ 60) and ln 20/784 (L ≥ 2304)',`γ ≥ ${chain.gap60.toExponential(4)}, ${chain.gap2304.toFixed(6)} J`); }
/* 6. and on the values computed here */
{ const R=K.hgpRunStart(); while(!K.hgpRunStep(R)){} const c=K.hgpChain(K.hgpTable(K.hgpMerged(R.live)),K.hgpQ(1,100000),K.hgpQ(30,1000000)), tight=K.hgpChain(K.hgpTable(K.hgpMerged(R.live)),K.hgpQ(1,1e9),K.hgpQ(1,1e9));
  check(c.ok&&tight.ok,'the chain holds again with the computed traces in place of the printed centres — with the stated errors, and with errors of 10⁻⁹',`p₆, q₆ = ${tight.rows[6][0]}, ${tight.rows[6][1]} with 10⁻⁹`); }
/* 7. mutations that must fail */
{ const tab=K.hgpTable('paper'), bump=(T,n,k,d)=>{ T[n]=T[n].slice(); T[n][k]=K.hgpAdd(T[n][k],d); };
  const m1=K.hgpTable('paper'); bump(m1.t21,10,2,K.hgpQ(-8,1000000));                       /* Z₁₀(21/2, C) lowered by 8·10⁻⁶ */
  const m2=K.hgpTable('paper'); bump(m2.t49,12,0,K.hgpQ(3,1000));                            /* Z₁₂(49/4) raised by 3·10⁻³ */
  const m3=K.hgpTable('paper'); bump(m3.t49,12,1,K.hgpQ(5,10000));                           /* Z₁₂(49/4, P) raised by 5·10⁻⁴ */
  const c1=K.hgpChain(m1), c2=K.hgpChain(m2), c3=K.hgpChain(m3), f=c=>c.steps.filter(s=>!s.ok).map(s=>s.id).join(',');
  check(!c1.ok&&!c2.ok&&!c3.ok,'a wrong trace breaks the chain: Z₁₀(21/2, C) − 8·10⁻⁶, Z₁₂(49/4) + 3·10⁻³, Z₁₂(49/4, P) + 5·10⁻⁴ each fail a step',`${f(c1)} · ${f(c2)} · ${f(c3)}`);
  /* and the chain leans on the longest rings: the shortest traces at b = 49/4 can move by a whole unit, the L = 6 one by 2·10⁻³ upward */
  const m4=K.hgpTable('paper'); bump(m4.t49,4,0,K.hgpQ(1)); bump(m4.t49,5,1,K.hgpQ(-1)); const m5=K.hgpTable('paper'); bump(m5.t49,6,1,K.hgpQ(2,1000));
  check(K.hgpChain(m4).ok&&K.hgpChain(m5).ok,'the chain leans on the longest rings: Z₄(49/4) + 1 together with Z₅(49/4, P) − 1 leaves every step holding, and so does Z₆(49/4, P) + 2·10⁻³ — the short traces enter the filters with weights that the margins absorb',`${K.hgpChain(m4).steps.filter(s=>s.ok).length}/22 · ${K.hgpChain(m5).steps.filter(s=>s.ok).length}/22`);
  const floorTo=(x,den)=>K.hgpQ(K.hgpFloor(K.hgpMul(x,[den,1n])),den), one=[1n,1n]; let p=K.hgpQ(0), q=K.hgpQ(0);
  { const c=chain; p=K.hgpOfNum(c.p0); q=K.hgpOfNum(c.q0); }
  const pn=floorTo(K.hgpF(K.hgpSub(one,K.hgpMul(K.hgpPow(K.hgpSub(one,p),2),K.hgpSub(one,q)))),10000000n);
  check(!(pn[0]===151249n&&pn[1]===2500000n),'rounding DOWN instead of up does not reproduce the first printed row (the table is sensitive to its rounding rule)',`floor gives ${pn[0]}/${pn[1]} instead of 151249/2500000`); }
/* 8. how much error the chain carries */
{ const tab=K.hgpTable('paper'), at=(w,e,d)=>w==='21'?K.hgpChain(tab,e,null,d):K.hgpChain(tab,null,e,d), Q=K.hgpQ;
  const a=at('21',Q(3215,100000000),true), b=at('21',Q(3218,100000000),true), c=at('49',Q(11425,100000000),false), d=at('49',Q(11435,100000000),false), e=at('21',Q(10580,1000000000),false), f=at('21',Q(10590,1000000000),false);
  const first=x=>x.steps.filter(s=>!s.ok).map(s=>s.id)[0];
  check(a.ok&&!b.ok&&first(b)==='FN'&&c.ok&&!d.ok&&first(d)==='FJ'&&e.ok&&!f.ok&&first(f)==='mO'&&K.HGP_SLACK.e21===3.2164e-5&&K.HGP_SLACK.e49===1.143e-4,
    'with every filter and constant kept and only the masses re-derived, the chain carries a uniform error 3.216·10⁻⁵ at b = 21/2 (then the N filter fails) and 1.143·10⁻⁴ at b = 49/4 (then the J filter) — 3.2 and 3.8 times the stated errors; with the printed rounded masses, 1.058·10⁻⁵ (then m_O)',
    `3.215e-5 ${a.ok} / 3.218e-5 ${b.ok} (${first(b)}) · 1.1425e-4 ${c.ok} / 1.1435e-4 ${d.ok} (${first(d)}) · 1.0580e-5 ${e.ok} / 1.0590e-5 ${f.ok} (${first(f)})`); }
/* 9. the trial state of Lemma C.2 */
{ const t=performance.now(), J=K.hgpTrial([72,120]), e72=J.out[72].e, e120=J.out[120].e;
  check(J.D===26&&J.sizes.join(',')==='162,136,136,80,80,32,32,8,8,1,1'&&Math.abs(e72-K.HGP_TRIAL_EXACT[72])<1e-12&&Math.abs(e120-K.HGP_TRIAL_EXACT[120])<1e-12&&J.out[72].margin>1.12e-7&&J.out[120].margin>1.05e-7,
    'the trial matrix-product state (bond dimension 26, blocks of d − e: 162, 136, 136, 80, …) has E/N(72) = −1.4014821126008 and E/N(120) = −1.4014821051733 — the exact integer values — below −a = −1.401482',
    `${e72.toFixed(13)}, ${e120.toFixed(13)} · margins ${J.out[72].margin.toExponential(3)}, ${J.out[120].margin.toExponential(3)} per site · ${(performance.now()-t).toFixed(0)} ms`); }
/* 10. the kernel of the spatial transfer is symmetric: a site sees the merged chronological list of its two bonds */
{ const h=K.hgpHistory(8,1.2,5), bonds=h.bonds; let sym=0;
  const site=(x,y)=>{ const m=[...x,...y].sort((p,q)=>p[0]-q[0]); let P=Float64Array.of(1,0,0,0,1,0,0,0,1); for(const [,a] of m){ const G=K.HGP_GM[a], Q=new Float64Array(9); for(let r=0;r<3;r++) for(let k=0;k<3;k++) for(let c=0;c<3;c++) Q[r*3+c]+=P[r*3+k]*G[k*3+c]; P=Q; } return P[0]+P[4]+P[8]; };
  for(let j=0;j<8;j++){ const x=bonds[j], y=bonds[(j+1)%8]; sym=Math.max(sym,Math.abs(site(x,y)-site(y,x))); }
  const G=K.HGP_GM, anti=G.every(m=>m.every((v,k)=>v===-m[(k%3)*3+((k/3)|0)])), comm=(()=>{ const mul=(A,B)=>{ const o=new Float64Array(9); for(let r=0;r<3;r++) for(let k=0;k<3;k++) for(let c=0;c<3;c++) o[r*3+c]+=A[r*3+k]*B[k*3+c]; return o; };
    const xy=mul(G[0],G[1]), yx=mul(G[1],G[0]); return xy.map((v,k)=>v-yx[k]).every((v,k)=>Math.abs(v+G[2][k])<1e-15||Math.abs(v-G[2][k])<1e-15); })();
  check(sym===0&&anti&&comm,'the site factor k(x, y) = Tr(merged chronological product of G_α) is symmetric in its two bond histories, with G_α = iS^α real antisymmetric and closing so(3) — why X_b is self-adjoint',`max |k(x, y) − k(y, x)| = ${sym} over 8 sites · weight of the sampled history ${h.w.toPrecision(4)}`); }

/* 11. the selection rule and the sectors, seen from inside the histories */
{ const G=K.HGP_GM, code=[1,2,3], g=K.hgRng(3); let nz=0, viol=0;
  for(let t=0;t<20000;t++){ const n=1+Math.floor(10*g()); let P=Float64Array.of(1,0,0,0,1,0,0,0,1), x=0;
    for(let k=0;k<n;k++){ const a=Math.floor(3*g()); x^=code[a]; const Q=new Float64Array(9); for(let r=0;r<3;r++) for(let kk=0;kk<3;kk++) for(let c=0;c<3;c++) Q[r*3+c]+=P[r*3+kk]*G[a][kk*3+c]; P=Q; }
    if(Math.abs(P[0]+P[4]+P[8])>1e-12){ nz++; if(x!==0) viol++; } }
  let zeroU=0, ok=0, neg=0, cls=[0,0,0,0];
  for(let s=1;s<=60;s++){ if(K.hgpHistory(8,1.2,s,true).w===0) zeroU++; const h=K.hgpHistory(8,1.2,s); if(h&&h.w!==0&&h.s!=null){ ok++; cls[h.s]++; if(h.w<0) neg++; } }
  check(viol===0&&nz>1000&&zeroU===60&&ok===60&&neg>0&&cls[0]>0&&cls[1]+cls[2]+cls[3]>0,
    'the selection rule: a site\'s trace survives only if its numbers of x, y, z events share one parity (x, y, z = 1, 2, 3 in Z₂² XOR to zero); so every bond of a weighing history carries the same class s — its D₂ sector (s = 0 is J, 1, 2, 3 the N lists) — and a history drawn blind weighs zero; drawn by walking the colours it weighs ±, in both kinds of sector',
    `${nz} random words with a non-zero trace, ${viol} breaking the rule · blind draws weighing zero ${zeroU}/60 · walk-drawn ${ok}/60 with one class per history, ${neg} negative · sectors J ${cls[0]}, N ${cls[1]+cls[2]+cls[3]}`); }

console.log(`\n${pass} passed, ${fail} failed · ${(performance.now()-t00).toFixed(0)} ms`);
process.exit(fail?1:0);
