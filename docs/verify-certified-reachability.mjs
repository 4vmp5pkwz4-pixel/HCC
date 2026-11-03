/* CERTIFIED REACHABILITY AND FIBONACCI COHERENCE (v4.411) — Preece & Batenin, «Certified quantum reachability and Fibonacci coherence:
   finite-time bounds, kernel-checked braiding, and tensor-rank obstructions» (FBS3R, 3 November 2026): repository verifier on the
   page's own kernels (core/atlas/extracted.mjs). Each claim is recomputed against a construction written here independently —
   exact rational polynomial arithmetic, a separate floating-point model of the anyon data, brute-force counts, exact-rational Hankel
   ranks — and mutations must fail. */
import fs from 'node:fs';
const K=await import(new URL('../core/atlas/extracted.mjs',import.meta.url));
const SRC=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
let pass=0, fail=0; const t00=performance.now();
const check=(ok,claim,nums)=>{ if(ok) pass++; else fail++; console.log(`${ok?'PASS':'FAIL'} — ${claim} :: ${nums}`); };
const PHI=(1+Math.sqrt(5))/2, rnd=(s=>()=>{ s=(s*16807)%2147483647; return s/2147483647; })(20261103);

/* exact rationals and polynomials with BigInt */
const gcd=(a,b)=>{ a=a<0n?-a:a; b=b<0n?-b:b; while(b){ [a,b]=[b,a%b]; } return a; };
const Q=(n,d=1n)=>{ n=BigInt(n); d=BigInt(d); if(d<0n){ n=-n; d=-d; } const g=gcd(n,d)||1n; return [n/g,d/g]; };
const qa=(a,b)=>Q(a[0]*b[1]+b[0]*a[1],a[1]*b[1]), qs=(a,b)=>qa(a,[-b[0],b[1]]), qm=(a,b)=>Q(a[0]*b[0],a[1]*b[1]), qd=(a,b)=>Q(a[0]*b[1],a[1]*b[0]), qeq=(a,b)=>a[0]===b[0]&&a[1]===b[1], qz=a=>a[0]===0n;
const pa=(p,q)=>{ const n=Math.max(p.length,q.length); return Array.from({length:n},(_,i)=>qa(p[i]||Q(0),q[i]||Q(0))); };
const pm=(p,q)=>{ const r=Array.from({length:p.length+q.length-1},()=>Q(0)); p.forEach((a,i)=>q.forEach((b,j)=>{ r[i+j]=qa(r[i+j],qm(a,b)); })); return r; };
const ps=(p,c)=>p.map(a=>qm(a,c)), pd=p=>p.slice(1).map((a,i)=>qm(a,Q(i+1))), peq=(p,q)=>{ const n=Math.max(p.length,q.length); for(let i=0;i<n;i++) if(!qeq(p[i]||Q(0),q[i]||Q(0))) return false; return true; };
const P=(...c)=>c.map(x=>Array.isArray(x)?Q(x[0],x[1]):Q(x));

/* 1. Theorem 1: the envelope against exact open-system evolution — random interactions (any sign, up to |V| = 25), detunings,
   dephasing and loss on two and three targets, every subset A — and its attainment by independent drives stopped at π/2 */
{ let worst=-1, runs=0, subsets=0; for(let trial=0;trial<36;trial++){ const k=2+(trial%2), d=1<<k, u=[...Array(k)].map(()=>0.15+0.9*rnd()),
    V=[...Array(k)].map(()=>[...Array(k)].map(()=>(rnd()-0.5)*50)), Del=[...Array(k)].map(()=>(rnd()-0.5)*6);
    const L=K.vxGKSL(K.vxRydberg(k,u,V,Del),K.vxJumps(k,[...Array(k)].map(()=>rnd()*0.6),[...Array(k)].map(()=>rnd()*0.6),0),d); runs++;
    K.vxPropagate(L,K.vxVacuum(d),4,120,(s,t,r)=>{ for(let mask=1;mask<d;mask++){ const U=[]; for(let j=0;j<k;j++) if(mask>>j&1) U.push(u[j]*t); worst=Math.max(worst,K.vxPop(r,d,mask)-K.vxEnvelope(U)); subsets++; } }); }
  /* attainment: independent resonant drives until U_j = π/2, then zero drive on that target — the probabilities equal the envelope */
  const u=[0.4,0.7], tStop=u.map(x=>Math.PI/2/x); let att=0; const pAt=t=>{ const amp=u.map((x,j)=>Math.sin(Math.min(Math.PI/2,x*t))**2); return amp[0]*amp[1]; };
  { const H1=K.vxRydberg(2,u,0,null), L1=K.vxGKSL(H1,[],4); const r1=K.vxPropagate(L1,K.vxVacuum(4),tStop[1],50,(s,t,r)=>{ att=Math.max(att,Math.abs(K.vxPop(r,4,3)-K.vxEnvelope(u.map(x=>x*t)))); });
    const L2=K.vxGKSL(K.vxRydberg(2,[u[0],0],0,null),[],4); K.vxPropagate(L2,r1,tStop[0]-tStop[1],50,(s,t,r)=>{ const T=tStop[1]+t; att=Math.max(att,Math.abs(K.vxPop(r,4,3)-pAt(T))); }); }
  /* mutation: a sin⁴ envelope is crossed */
  let mut=0; { const L=K.vxGKSL(K.vxRydberg(2,[0.5,0.5],0,null),[],4); K.vxPropagate(L,K.vxVacuum(4),2,40,(s,t,r)=>{ mut=Math.max(mut,K.vxPop(r,4,3)-Math.sin(0.5*t)**8); }); }
  check(worst<=1e-12&&att<1e-12&&mut>1e-3,'Theorem 1: from empty targets p_A(t) ≤ ∏ sin²(min{π/2, U_j}) over random diagonal interactions, detunings, dephasing and loss — and independent drives stopped at π/2 attain it; a sin⁴ envelope is crossed',
    `${runs} models, ${subsets} (time, subset) pairs, max(p − envelope) ${worst.toExponential(1)} · attainment ${att.toExponential(1)} · sin⁴ crossed by ${mut.toFixed(3)}`); }

/* 2. the exact propagator e^{τL} against fourth-order Runge–Kutta at small steps, and trace preservation */
{ const u=[0.35,0.5,0.65], L=K.vxGKSL(K.vxRydberg(3,u,40,[0.5,0.5,0.5]),K.vxJumps(3,0.3,0.4,0.05),8), ex=[], rk=[];
  K.vxPropagate(L,K.vxVacuum(8),6,60,(s,t,r)=>ex.push(K.vxPop(r,8,7))); K.vxEvolve(L,K.vxVacuum(8),6,24000,(s,t,r)=>{ if(s%400===0) rk.push(K.vxPop(r,8,7)); });
  let d=0; for(let i=0;i<ex.length;i++) d=Math.max(d,Math.abs(ex[i]-rk[i])); const r=K.vxPropagate(L,K.vxVacuum(8),6,1); let tr=0; for(let s=0;s<8;s++) tr+=r[2*(s*8+s)];
  check(d<1e-12&&Math.abs(tr-1)<1e-10,'the laboratory\'s propagator e^{τL}, by scaling and squaring the GKSL superoperator, agrees with Runge–Kutta at 24 000 steps and keeps the trace',
    `max |Δp| ${d.toExponential(1)} · trace − 1 = ${(tr-1).toExponential(1)}`); }

/* 3. the rational supersolution: the three sum-of-squares identities as EXACT polynomial identities, and its consequences */
{ const h=P(0,0,1,0,[-1,3],0,[2,45]), hp=pd(h), one=P(1);
  const sos1=pm(P(0,0,1),pa(ps(pm(P([-15,4],0,1),P([-15,4],0,1)),Q(2,45)),P([3,8])));
  const sos2=pm(P(0,[2,15]),pa(ps(pm(P([-5,2],0,1),P([-5,2],0,1)),Q(2)),P([5,2])));
  const lhs3=pa(pm(hp,hp),ps(pm(h,pa(one,ps(h,Q(-1)))),Q(-4))), sos3=pm(P(0,0,0,0,0,0,0,0,[4,2025]),pa(ps(pm(P(-3,0,1),P(-3,0,1)),Q(4)),P(9)));
  const x=Q(1,5), hx=qa(qa(qm(x,x),qm(Q(-1,3),qm(qm(x,x),qm(x,x)))),qm(Q(2,45),qm(qm(qm(x,x),qm(x,x)),qm(x,x)))), h2=qm(hx,hx);
  const ok=peq(h,sos1)&&peq(hp,sos2)&&peq(lhs3,sos3)&&h2[0]===770173504n&&h2[1]===494384765625n;
  const ex=Number(h2[0])/Number(h2[1])-Math.sin(0.2)**4, mut=peq(lhs3,pm(P(0,0,0,0,0,0,0,0,[4,2025]),pa(ps(pm(P(-3,0,1),P(-3,0,1)),Q(4)),P(8))));
  check(ok&&!mut&&Math.abs(ex-6.404e-10)<2e-13&&Math.abs(Number(h2[0])/Number(h2[1])-0.00155784230735)<1e-14,'h(x) = x² − x⁴/3 + 2x⁶/45 is a certified supersolution: h = x²[(2/45)(x² − 15/4)² + 3/8], h′ = (2x/15)[2(x² − 5/2)² + 5/2], h′² − 4h(1 − h) = (4x⁸/2025)[4(x² − 3)² + 9], exactly; h(1/5)² = 770173504/494384765625 — the excess over sin⁴(1/5) is 6.404·10⁻¹⁰ (printed 6.41·10⁻¹⁰); 9 → 8 in the last identity fails',
    `three identities exact · h(1/5)² = ${h2[0]}/${h2[1]} · excess ${ex.toExponential(4)} · mutated identity ${mut?'holds (bad)':'fails'}`); }

/* 4. the first interaction correction: p₁₁ = a²b²t⁴ − a²b²[(a² + b²)/3 + V²/18]t⁶ + O(t⁸), against exact diagonalisation; V²/9 fails */
{ let worst=0, mutw=0; for(const [a,b,V] of [[0.2,0.2,0],[0.2,0.3,5],[0.5,0.4,10],[0.3,0.3,30]]){ for(const t of [0.02,0.03,0.04]){ const ex=K.vxTwoQubitP11(a,b,V,t), se=K.vxP11Series(a,b,V,t), sc=a*a*b*b*t**6*Math.max(1,V*V);
      worst=Math.max(worst,Math.abs(ex-se)/(sc*Math.max(1,V*V)*t*t*4+1e-300)); mutw=Math.max(mutw,Math.abs(ex-(se-a*a*b*b*V*V*t**6/18))/(sc+1e-300)); } }
  check(worst<1&&mutw>1e-3,'the first interaction-dependent term of the two-qubit blockade is −a²b²[(a² + b²)/3 + V²/18]t⁶: the remainder against exact diagonalisation is O(t⁸), and a coefficient V²/9 leaves a t⁶ residue',
    `max |exact − series|/(scale·t²) ${worst.toExponential(2)} · with V²/9: ${mutw.toExponential(2)}`); }

/* 5. the printed tables, to their last digit: the static finite-V table, the long-time table and its all-time certificates */
{ const T1=[[0,1.557841667e-3],[1,1.473206222e-3],[5,3.573427182e-4],[10,7.149240526e-5],[50,2.518722689e-6],[100,6.295086097e-7]];
  const T2=[[10,20,2.57025e-4,3.19489e-3],[20,100,5.06896e-8,7.99680e-4],[100,100,6.02130e-10,3.19995e-5]];
  const ok1=T1.every(([V,p])=>Math.abs(K.vxTwoQubitP11(0.2,0.2,V,1)-p)<=0.5e-9*Math.pow(10,Math.floor(Math.log10(p))+3)),
    ok2=T2.every(([V,t,p,c])=>Math.abs(K.vxTwoQubitP11(0.2,0.2,V,t)/p-1)<2e-6&&Math.abs(K.vxEnergy(0.2,0.2,V)/c-1)<2e-6&&K.vxTwoQubitP11(0.2,0.2,V,t)<=K.vxEnergy(0.2,0.2,V));
  /* the rationals: 4/15129 (finite V, t = 1, V = 10), 20000/25010001 (energy moment, V = 20), 1/625 */
  const fv=Q(16n*1n*1n,625n), den=qs(Q(10),qm(Q(2),Q(2,25))), r4=qd(fv,qm(den,den)), en=qd(qm(Q(4*400),Q(2,25)),qm(qa(Q(400),Q(2,25)),qa(Q(400),Q(2,25))));
  check(ok1&&ok2&&r4[0]===4n&&r4[1]===15129n&&en[0]===20000n&&en[1]===25010001n,'Tables II and III of the manuscript to every printed digit, the all-time certificate 4V²(a² + b²)/(V² + a² + b²)² above each value, and 4/15129, 20000/25010001 in exact rationals',
    `finite-V table ${ok1?'all six':'NOT'} · long-time ${ok2?'all three':'NOT'} · ${r4[0]}/${r4[1]} · ${en[0]}/${en[1]}`); }

/* 6. Theorem 5, revised: 13/600000 exactly, and the pair table is NOT what the stated model gives — 0.88 % lower at every V */
{ const C=qa(qm(Q(5),qm(Q(1,10000),Q(1,4))),Q(0)), J=qm(qm(Q(5,4),Q(1,1000)),Q(1,3)), cert=qm(Q(1,25),qa(C,J));
  const X=[0,1,1,0], Pm=[1,0,0,0]; const d=4, mk=V=>{ const H=K.vxZeros(d); /* basis bit 0 = site N−1, bit 1 = site N */
    for(let s=0;s<4;s++){ const n1=s&1, n2=s>>1&1; if(n1&&n2) H[2*(s*d+s)]=V; if(!n2) H[2*((s^1)*d+s)]+=0.2; H[2*((s^2)*d+s)]+=0.01; }
    const Jp=K.vxZeros(d); for(let s=0;s<4;s++) if(!(s>>1&1)) Jp[2*((s|2)*d+s)]=Math.sqrt(0.001); return K.vxGKSL(H,[Jp],d); };
  const got=[0,10,50].map(V=>K.vxPop(K.vxPropagate(mk(V),K.vxVacuum(4),1,1),4,3)), printed=[1.408467e-5,1.314559e-5,1.310261e-5], ratio=printed.map((p,i)=>p/got[i]);
  check(cert[0]===13n&&cert[1]===600000n&&got.every(v=>v<13/600000)&&ratio.every(r=>Math.abs(r-0.99123)<2e-4)&&Math.abs(got[0]-1.420910e-5)<1e-10,'Theorem 5\'s certificate is 13/600000 exactly — and REVISED: its pair table does not follow from the stated model (uX_{N−1}P_N + εX_N + Vn_{N−1}n_N, pump √γσ_N⁺), which gives values 0.88 % higher at every V, a constant ratio as from another normalisation, all still under the certificate',
    `${cert[0]}/${cert[1]} · model ${got.map(v=>v.toExponential(6)).join(', ')} · printed/model ${ratio.map(r=>r.toFixed(5)).join(', ')}`); }

/* 7. Theorem 6, the all-time loss-aware factor: 1/96 passes in exact integers, 1/97 does not; the optimum b* and the six-target
   product 1.25446·10⁻¹²; and a long run with pump and loss never exceeds ∏ b_j */
{ const chk=(bn,bd)=>{ const b=Q(bn,bd), r=qs(qm(Q(4),b),qm(Q(1,1000),qs(Q(1),b))), l=qm(r,r), rr=qm(qm(Q(4,25),b),qs(Q(1),b)); return !(r[0]<0n)&&(l[0]*rr[1]>=rr[0]*l[1]); };
  const bs=K.vxAllTimeB(0.2,4,0.001), six=bs**6; let worst=0; { const k=2, u=[0.2,0.2], L=K.vxGKSL(K.vxRydberg(k,u,7,[0.3,0.3]),K.vxJumps(k,0.1,4,0.001),4); K.vxPropagate(L,K.vxVacuum(4),60,120,(s,t,r)=>{ worst=Math.max(worst,K.vxPop(r,4,3)/(bs*bs)); }); }
  check(chk(1,96)&&!chk(1,97)&&Math.abs(six/1.25446e-12-1)<1e-4&&(1/96)**2===1/9216&&worst<=1+1e-9,'Theorem 6: with u ≤ 1/5, κ ≥ 4, γ ≤ 1/1000 the factor b = 1/96 passes r ≥ 0, r² ≥ 4u²b(1 − b) exactly (1/97 does not); the optimum b* gives the six-target product 1.25446·10⁻¹², and an interacting pair under drive, pump and loss stays under b*² for sixty time units',
    `1/96 ${chk(1,96)?'passes':'fails'} · 1/97 ${chk(1,97)?'passes':'fails'} · b* = ${bs.toPrecision(6)} · b*⁶ = ${six.toExponential(5)} · max p/b*² = ${worst.toFixed(6)}`); }

/* 8. the Fibonacci dark event: H|d⟩ = 0; moments 0, 0, 0, 0, 0, 3γΩ⁴; p_M(0.1), p_M(0.2) as printed; middle dephasing changes nothing;
   Proposition 10's window and lower bound γΩ⁴t⁵/80 hold on it */
{ const mu=K.vxDarkMoments(1,0.2,0,6), mid=K.vxDarkMoments(1,0,0.7,9), p1=K.vxDarkP(1,0.2,0,0.1), p2=K.vxDarkP(1,0.2,0,0.2), M=6+0.4, act=K.vxActivation(0.6,M,5);
  let low=true; for(const f of [0.2,0.5,1]){ const t=act.T*f; if(K.vxDarkP(1,0.2,0,t)<act.c*t**5) low=false; }
  const mOm=K.vxDarkMoments(1.7,0.31,0,5)[5];
  check(mu.slice(0,5).every(v=>Math.abs(v)<1e-15)&&Math.abs(mu[5]-0.6)<1e-13&&Math.abs(mOm-3*0.31*1.7**4)<1e-11&&mid.every(v=>Math.abs(v)<1e-15)&&Math.abs(p1/4.95656e-8-1)<1e-5&&Math.abs(p2/1.55372e-6-1)<1e-5&&low&&Math.abs(act.c-0.6/240)<1e-15,
    'the three-site Fibonacci dark state never reaches |010⟩ without noise; one dephased end gives the moments 0, 0, 0, 0, 0, 3γΩ⁴ (any Ω, γ), p_M(0.1) = 4.95656·10⁻⁸ and p_M(0.2) = 1.55372·10⁻⁶ as printed; dephasing the middle does nothing; Proposition 10\'s lower bound γΩ⁴t⁵/80 holds on its window',
    `μ = ${mu.map(v=>Math.abs(v)<1e-15?0:+v.toPrecision(6)).join(', ')} · Ω = 1.7, γ = 0.31: μ₅ ${mOm.toFixed(6)} · p_M ${p1.toExponential(5)}, ${p2.toExponential(5)} · T* = ${act.T.toExponential(2)}`); }

/* 9. the Fibonacci anyon data — every pentagon (512) and both hexagons (64 + 64) EXACTLY in Z[ζ, s], and again in independent
   floating-point complex arithmetic written here; swapped R phases fail exactly five hexagon components; a perturbed F fails */
{ const pe=K.vxPentagon(), h1=K.vxHexagon(false,false), h2=K.vxHexagon(true,false), sw=K.vxHexagon(false,true);
  const c=1/PHI, s=Math.sqrt(c), z=k=>[Math.cos(k*Math.PI/5),Math.sin(k*Math.PI/5)], cm=(a,b)=>[a[0]*b[0]-a[1]*b[1],a[0]*b[1]+a[1]*b[0]], ca=(a,b)=>[a[0]+b[0],a[1]+b[1]];
  const N=(a,b,x)=>a===0?(b===x?1:0):b===0?(a===x?1:0):1, F=(eps)=>(a,b,x,d,e,f)=>{ if(!(N(a,b,e)&&N(e,x,d)&&N(b,x,f)&&N(a,f,d))) return [0,0]; if(a&&b&&x&&d){ const M=[[c+eps,s],[s,-c]]; return [M[e][f],0]; } return [1,0]; };
  const R=(a,b,x)=>!N(a,b,x)?[0,0]:a&&b?(x===0?z(6):z(3)):[1,0];
  const pent=(FF)=>{ let ok=0; for(let m=0;m<512;m++){ const [a,b,x,d,e,f,g,k,l]=[0,1,2,3,4,5,6,7,8].map(i=>(m>>i)&1); const L=cm(FF(f,x,d,e,g,l),FF(a,b,l,e,f,k)); let Rr=[0,0]; for(const h of [0,1]) Rr=ca(Rr,cm(cm(FF(a,b,x,g,f,h),FF(a,h,d,e,g,k)),FF(b,x,d,k,h,l))); if(Math.hypot(L[0]-Rr[0],L[1]-Rr[1])<1e-12) ok++; } return ok; };
  const hex=(FF)=>{ let ok=0; for(let m=0;m<64;m++){ const [a,b,x,d,e,g]=[0,1,2,3,4,5].map(i=>(m>>i)&1); const L=cm(cm(R(x,a,e),FF(a,x,b,d,e,g)),R(x,b,g)); let Rr=[0,0]; for(const f of [0,1]) Rr=ca(Rr,cm(cm(FF(x,a,b,d,e,f),R(x,f,d)),FF(a,b,x,d,f,g))); if(Math.hypot(L[0]-Rr[0],L[1]-Rr[1])<1e-12) ok++; } return ok; };
  const fp=pent(F(0)), fh=hex(F(0)), mp=pent(F(1e-3)), num=K.vxKnum(K.VX_C), sNum=K.vxKnum(K.VX_S);
  check(pe.ok===512&&h1.ok===64&&h2.ok===64&&sw.ok===59&&fp===512&&fh===64&&mp<512&&Math.abs(num[0]-c)<1e-15&&Math.abs(sNum[0]-s)<1e-15,
    'the Fibonacci F and R satisfy every pentagon component and both hexagons — exactly, as integers of Z[ζ, s] (ζ = e^{iπ/5}, s² = ζ² − ζ³ = φ⁻¹), and again in independent complex arithmetic; exchanging the two R phases breaks five hexagon components; F with c + 10⁻³ breaks the pentagon',
    `exact: pentagon ${pe.ok}/512, hexagons ${h1.ok}/64 and ${h2.ok}/64, swapped ${sw.ok}/64 · float: ${fp}/512, ${fh}/64 · perturbed F: ${mp}/512 · c ↦ ${num[0].toFixed(15)}`); }

/* 10. the golden braid: B = FRF; p_k = 4φ⁻³ sin²(3πk/10) exactly for k = 0 … 20 (p₁ = φ⁻¹, p₁₀ = 0); the braid relation; and the
   benchmark alone cannot see the swapped phases (|u^k − v^k| is symmetric) — which is why the hexagon is needed */
{ let exact=0; for(let k=0;k<=20;k++) if(K.vxBraidP(k).equal) exact++; const p1=K.vxBraidP(1), p10=K.vxBraidP(10);
  const c=1/PHI, s=Math.sqrt(c), u=[Math.cos(6*Math.PI/5),Math.sin(6*Math.PI/5)], v=[Math.cos(3*Math.PI/5),Math.sin(3*Math.PI/5)], pk=(k,U,Vv)=>{ const a=[Math.cos(k*Math.atan2(U[1],U[0])),Math.sin(k*Math.atan2(U[1],U[0]))], b=[Math.cos(k*Math.atan2(Vv[1],Vv[0])),Math.sin(k*Math.atan2(Vv[1],Vv[0]))]; return c*c*s*s*((a[0]-b[0])**2+(a[1]-b[1])**2); };
  let sym=0; for(let k=0;k<=20;k++) sym=Math.max(sym,Math.abs(pk(k,u,v)-pk(k,v,u)),Math.abs(pk(k,u,v)-K.vxBraidPnum(k)));
  check(exact===21&&K.vxKeq(p1.exact,K.VX_C)&&K.vxKeq(p10.exact,K.VX_ZERO)&&K.vxYangBaxter()&&K.vxM2eq(K.vxM2mul(K.VX_F2,K.VX_F2),K.VX_I2)&&sym<1e-12,
    'the middle exchange of four τ anyons gives p_k = 4φ⁻³ sin²(3πk/10) — computed as the exact product B^k in Z[ζ, s] and equal to the closed form for k = 0 … 20, p₁ = φ⁻¹ and p₁₀ = 0 exactly; σ₁σ₂σ₁ = σ₂σ₁σ₂ and F² = 𝟙 exactly; the benchmark is blind to swapping the R phases',
    `${exact}/21 exact · p₁ ≡ c · p₁₀ ≡ 0 · Yang–Baxter ${K.vxYangBaxter()} · swap and closed form agree to ${sym.toExponential(1)}`); }

/* 11. Proposition 15: a noisy braid word stays within Σδ_j/2 of the ideal; the window is clipped to [0, 1] */
{ const w=K.vxNoiseWindow(K.vxBraidPnum(3),[0.01,0.01,0.01]), w0=K.vxNoiseWindow(0.001,Array(10).fill(0.05));
  check(Math.abs(w[0]-(K.vxBraidPnum(3)-0.015))<1e-15&&Math.abs(w[1]-(K.vxBraidPnum(3)+0.015))<1e-15&&w0[0]===0,'the composed diamond-norm budget puts k noisy braids within ½Σδ_j of the ideal probability (clipped to [0, 1])',
    `k = 3, δ = 0.01: [${w[0].toFixed(5)}, ${w[1].toFixed(5)}] · clipped below at ${w0[0]}`); }

/* 12. Proposition 13: fusion paths ↔ blockade words, a bijection, F_n of them; the ring counts L_N by brute force; φ^N = L_N − (−φ)^{−N} */
{ let ok=true; for(let n=2;n<=18;n++){ const W=K.vxFusionPaths(n,1).map(p=>K.vxWordOf(p).join('')); const all=[]; for(let m=0;m<(1<<Math.max(0,n-2));m++){ const w=m.toString(2).padStart(n-2,'0'); if(n-2===0) { all.push(''); break; } if(!/11/.test(w)) all.push(w); }
    if(new Set(W).size!==W.length||W.length!==all.length||!all.every(w=>W.includes(w))||BigInt(W.length)!==K.vxFibBig(n)) ok=false; }
  let ring=true; for(let N=3;N<=20;N++){ let c=0; for(let m=0;m<(1<<N);m++){ if(m&(m<<1)&((1<<N)-1)) continue; if((m&1)&&(m>>(N-1)&1)) continue; c++; } if(BigInt(c)!==K.vxLucasBig(N)) ring=false; }
  let nearest=true; for(let N=2;N<=60;N++) if(BigInt(Math.round(PHI**N))!==K.vxLucasBig(N)) nearest=false;
  const L266=K.vxLucasBig(266).toString();
  check(ok&&ring&&nearest&&L266.length===56&&L266.startsWith('389683759')&&Math.abs(K.vxRungGap(266).log10+266*Math.log10(PHI))<1e-12,'the fusion paths of n τ anyons (total τ) are in bijection with the binary words of length n − 2 with no adjacent ones — F_n of each, n ≤ 18; the blockade configurations of N atoms on a ring, counted by brute force, are the Lucas numbers L_N (N ≤ 20); round(φ^N) = L_N, and L₂₆₆ has 56 digits with φ²⁶⁶ − L₂₆₆ = −10^{−55.59}',
    `bijection ${ok} · ring ${ring} · nearest integer ${nearest} · L₂₆₆ = ${L266.slice(0,12)}… (${L266.length} digits)`); }

/* 13. Appendix A: the maximal-entropy blockade chain — stationary density, correlations and correlation length, by matrix powers */
{ const c=1/PHI, T=[[c,c*c],[1,0]]; let pi=[0.5,0.5]; for(let i=0;i<200;i++) pi=[pi[0]*T[0][0]+pi[1]*T[1][0],pi[0]*T[0][1]+pi[1]*T[1][1]];
  const M=K.vxMaxEnt(); let worst=0; let Tr=[[1,0],[0,1]]; for(let r=0;r<=6;r++){ const joint=pi[1]*Tr[1][1]; worst=Math.max(worst,Math.abs(joint-pi[1]*pi[1]-M.corr(r))); Tr=[[Tr[0][0]*T[0][0]+Tr[0][1]*T[1][0],Tr[0][0]*T[0][1]+Tr[0][1]*T[1][1]],[Tr[1][0]*T[0][0]+Tr[1][1]*T[1][0],Tr[1][0]*T[0][1]+Tr[1][1]*T[1][1]]]; }
  check(Math.abs(pi[1]-(5-Math.sqrt(5))/10)<1e-14&&Math.abs(M.rho-pi[1])<1e-14&&worst<1e-14&&Math.abs(M.xi*M.s-0.5)<1e-15,'the maximal-entropy blockade chain has density (5 − √5)/10, correlations (−φ⁻²)^r/5 and correlation length 1/(2 ln φ) — s·ξ = ½ in this ensemble',
    `ρ = ${pi[1].toFixed(15)} · max correlation error ${worst.toExponential(1)} · sξ = ${(M.xi*M.s).toFixed(15)}`); }

/* 14. Theorems 8 and 9 — the Hankel rank of the event output (k + 1 for shared rates, 2^k for binary-superincreasing ones) and the
   operator-Schmidt rank of E_r across a cut (q₊ − q₋ + 1), both by exact rational elimination */
{ const rank=(A)=>{ A=A.map(r=>r.map(x=>x)); let rk=0; const n=A.length, m=A[0].length; for(let c=0;c<m&&rk<n;c++){ let p=-1; for(let r=rk;r<n;r++) if(!qz(A[r][c])){ p=r; break; } if(p<0) continue; [A[rk],A[p]]=[A[p],A[rk]];
      for(let r=0;r<n;r++){ if(r===rk||qz(A[r][c])) continue; const f=qd(A[r][c],A[rk][c]); A[r]=A[r].map((x,j)=>qs(x,qm(f,A[rk][j]))); } rk++; } return rk; };
  /* p(t) = ∏_j (γ_j/λ_j)(1 − e^{−λ_j t}); μ_m = d^m p/dt^m at 0 = Σ_A coeff_A (−Σ_{j∈A} λ_j)^m */
  const hank=(gs,ls,sz)=>{ let terms=[[Q(1),Q(0)]]; gs.forEach((g,j)=>{ const w=qd(g,ls[j]), nx=[]; for(const [c,e] of terms){ nx.push([qm(c,w),e]); nx.push([qm(qm(c,w),Q(-1)),qa(e,ls[j])]); } terms=nx; });
    const mu=m=>terms.reduce((s,[c,e])=>{ let pw=Q(1); for(let i=0;i<m;i++) pw=qm(pw,qm(e,Q(-1))); return qa(s,qm(c,pw)); },Q(0)); return Array.from({length:sz},(_,i)=>Array.from({length:sz},(_,j)=>mu(i+j))); };
  const k=3, shared=rank(hank(Array(k).fill(Q(1,4)),Array(k).fill(Q(2)),10)), sup=rank(hank(Array(k).fill(Q(1,4)),[Q(1),Q(2),Q(4)],12));
  let osr=true; for(const [kk,l] of [[6,3],[7,2],[8,4]]) for(let r=0;r<=kk;r++){ const M=[]; for(let a=0;a<(1<<l);a++){ const row=[]; for(let b=0;b<(1<<(kk-l));b++){ const pc=x=>x.toString(2).split('').filter(c=>c==='1').length; row.push(Q(pc(a)+pc(b)===r?1:0)); } M.push(row); }
      const qm_=Math.max(0,r-kk+l), qp=Math.min(r,l); if(rank(M)!==qp-qm_+1) osr=false; }
  check(shared===k+1&&sup===1<<k&&osr,'the minimal linear realisation of the target-vacuum event has k + 1 coordinates for shared rates and 2^k for binary-superincreasing ones (Theorem 8, k = 3), and E_r has operator-Schmidt rank q₊ − q₋ + 1 across every cut tried (Theorem 9) — exact rational ranks',
    `Hankel rank shared ${shared}, superincreasing ${sup} · OSR formula ${osr?'holds':'fails'} for k = 6, 7, 8`); }

/* 15. the small numbers of §§ VIII–XI: the compression constant 2/√3 attained; the activation window 1/128 and t²/4 on it; 294351 shots;
   the group-observer dimensions 13, 49, 256, 4096; 7/58 for the Lean two-qubit instance with spectral gap 29/99 */
{ const W=[[1/3,Math.SQRT2/3],[Math.SQRT2/3,2/3]], d=[[1/3,Math.SQRT2/3],[Math.SQRT2/3,0]], ev=(A)=>{ const tr=A[0][0]+A[1][1], det=A[0][0]*A[1][1]-A[0][1]*A[1][0], s=Math.sqrt(tr*tr/4-det); return Math.max(Math.abs(tr/2+s),Math.abs(tr/2-s)); };
  const comp=ev(d)/((2/Math.sqrt(3))*Math.sqrt(1*W[0][0]));
  const act=K.vxActivation(1,4,2); let low=true; for(const a of [1,1.5,2]) for(const b of [1,1.3,2]) for(const f of [0.1,0.5,1]){ const t=act.T*f, p2=a===b?1-Math.exp(-a*t)*(1+a*t):1-(b*Math.exp(-a*t)-a*Math.exp(-b*t))/(b-a); if(p2<act.c*t*t) low=false; }
  const dims=[[12],[6,6],[3,3,3,3],Array(12).fill(1)].map(g=>g.reduce((p,k)=>p*(k+1),1));
  const q1=qd(Q(1,5),qa(Q(1,5),Q(3,7))), q2=qd(Q(2,9),qa(Q(2,9),Q(4,11))), st=qm(q1,q2), gap=qd(qa(Q(2,9),Q(4,11)),Q(2));
  check(Math.abs(comp-1)<1e-15&&act.T===1/128&&act.c===0.25&&low&&K.vxShots(0.01,0.002,0.01)===294351&&dims.join()==='13,49,256,4096'&&st[0]===7n&&st[1]===58n&&gap[0]===29n&&gap[1]===99n,
    'the compression constant 2/√3 is attained by the printed 2 × 2 example; the activation window is 1/128 with p₂ ≥ t²/4 on it for a, b ∈ [1, 2]; 294351 shots; group-observer dimensions 13, 49, 256, 4096; the Lean two-qubit instance’s stationary joint probability 7/58 and spectral gap 29/99 in exact rationals',
    `‖W − PWP‖/(2/√3)√(Bm) = ${comp.toFixed(15)} · T* = ${act.T} · shots ${K.vxShots(0.01,0.002,0.01)} · ${dims.join(', ')} · ${st[0]}/${st[1]} · gap ${gap[0]}/${gap[1]}`); }

/* 16. the bindu's tree: F_{n+2} nodes on rung n, golden shares φ⁻¹ : φ⁻², and every τ-branch the whole tree scaled into its share */
{ const T=K.vxTree(12); let counts=true; for(let n=0;n<=12;n++) if(BigInt(T.filter(o=>o.n===n).length)!==K.vxFibBig(n+2)) counts=false;
  let sh=0, self=0; for(const o of T){ if(o.x!==1) continue; const kids=T.filter(q=>q.p===T.indexOf(o)); if(kids.length===2){ const w=o.b-o.a; sh=Math.max(sh,Math.abs((kids.find(q=>q.x===1).b-kids.find(q=>q.x===1).a)/w-1/PHI)); } }
  const root=T.filter(o=>o.n<=6), byStart=new Map(root.map(o=>[o.n+'|'+o.a.toFixed(12)+'|'+o.x,o]));
  for(const o of T){ if(o.x!==1||o.n>5) continue; const idx=T.indexOf(o), desc=[]; const stack=[[idx,0]]; while(stack.length){ const [i,dep]=stack.pop(); if(dep>6) continue; desc.push([T[i],dep]); T.forEach((q,j)=>{ if(q.p===i) stack.push([j,dep+1]); }); }
    for(const [q,dep] of desc){ const a=(q.a-o.a)/(o.b-o.a), r=byStart.get(dep+'|'+a.toFixed(12)+'|'+q.x); self=Math.max(self,r?Math.abs((q.b-o.a)/(o.b-o.a)-r.b):1); } }
  check(counts&&sh<1e-12&&self<1e-12&&/fbsBtTick\(dt,D\)/.test(SRC)&&/HERMES_TABLET=\[/.test(SRC),'the bindu’s tree has F_{n+2} branches on rung n, splits every τ node φ⁻¹ : φ⁻² and is exactly self-similar — every τ-branch is the whole tree scaled into its interval — and the FBS3R world draws it',
    `counts F₂ … F₁₄ ${counts} · share error ${sh.toExponential(1)} · self-similarity ${self.toExponential(1)}`); }

/* 17. the Emerald Tablet lines: each stands beside one statement, carries a status and a live check, and none claims more than its
   statement — the correspondence of scales is marked false for dynamics, the creation line a model */
{ const blk=SRC.slice(SRC.indexOf('const HERMES_TABLET=['),SRC.indexOf('const HERMES_ST='));
  const rows=(blk.match(/\{lat:'/g)||[]).length, cks=(blk.match(/ck:\(\)=>/g)||[]).length, sts=(blk.match(/st:'(exact|exact-count|exact-image|model|method)'/g)||[]).length;
  check(rows===13&&cks===13&&sts===13&&/st:'exact-count'/.test(blk)&&/False for the PHYSICS/.test(blk)&&/Sic mundus creatus est\.',[^]*?st:'model'/.test(blk)&&/The Kybalion \(1908\)/.test(SRC),
    'the Emerald Tablet is laid line by line beside the statements it can honestly name — thirteen lines, each with a status and a live check; «as below, so above» is exact as a count and marked false as dynamics, «thus the world was created» a model, and the seven «Hermetic principles» are attributed to The Kybalion',
    `${rows} lines · ${cks} checks · ${sts} statuses`); }

/* 18. wired: the laboratory is in the catalogue, the native contract, the ledger, the relations, the views and the instrument */
{ const need=[/\{id:'fibreach', category:'quant'/, /  fibreach:\{\n    native_space:/, /id:'fibreachConfirm411', kind:'confirms'/, /id:'fibreachRevise411', kind:'revises'/, /\['fibreach','pxp','invariant'/, /\['fibreach','anyzoo','invariant'/,
    /vxGroup\.visible = \(v==='fibreach'\);/, /if\(v==='fibreach'&&!vxObjs\)\{ vxSetup\(\); \}/, /else if\(V==='fibreach'\) body = vxPanelHTML\(\);/, /if\(V==='fibreach'\)\{ vxBind\(ctl\); \}/, /state\.s3view==='fibreach'\)\{\n      fbsAnimT\+=labDt; updateVx\(labDt\);/,
    /\['vxAtlas','fibreach',vxGroup,/, /id:'fibreach', world:'s3', lab:'fibreach',/, /globalThis\.HCC_FIBREACH=Object\.freeze\(\{/];
  const miss=need.filter(r=>!r.test(SRC)).map(r=>String(r).slice(1,40));
  check(!miss.length,'wired: catalogue, native contract, ledger (confirms and revises), relations to the Fibonacci cube and the anyon zoo, view, panel, update, atlas entry, instrument and agent handle',
    miss.length?`missing: ${miss.join(' | ')}`:`${need.length} registrations`); }

console.log(`\n${pass} passed, ${fail} failed · ${((performance.now()-t00)/1000).toFixed(1)} s`);
process.exit(fail?1:0);
