/* THE IRRATIONALITY EXPONENT OF π (v4.380) — families 017 and 005 of openai/math — repository verifier on the page's own kernels (core/atlas/extracted.mjs, sliced from index.html). */
/* verifier for the π-exponent / Flint–Hills / Catalan laboratory (families 017 and 005 of the openai/math collection).
   Loads kernels.js as text, prints PASS/FAIL per check, exits 1 on any failure. */
const K=await import(new URL('../core/atlas/extracted.mjs',import.meta.url));
let pass=0, fail=0; const T0=performance.now();
const check=(ok,claim,nums)=>{ if(ok) pass++; else fail++; console.log(`${ok?'PASS':'FAIL'} — ${claim} :: ${nums}`); };
const ms=t=>(performance.now()-t).toFixed(1)+' ms';
const D=4000, P=D+K.PE_GUARD, B=10n**BigInt(P);
/* published digits (π: 110 decimals; G: 40 decimals) and the opening of π's continued fraction */
const PI_DIG='3.14159265358979323846264338327950288419716939937510582097494459230781640628620899862803482534211706798214808651';
const G_DIG='0.9159655941772190150546035149323841107741';
const PI_CF30=[3,7,15,1,292,1,1,1,2,1,3,1,14,2,1,1,2,2,2,2,1,84,2,1,1,15,3,13,1,4];
const PI_CF_TASK=[3,7,15,1,292,1,1,1,2,1,3,1,14,2,1,1,2,2,2,2,1,84,2,1,1,15,3,13,1,4,2,6,6,99,1,2,2,6,3,5,1,1,6,8,1,7,1,2,3,7,1,2,1,1,12,1,1,1,3,1,1,8,1,1,2,1,6,1,1,5,2,2,3,1,2,4,4,16,1,161,45,1,22,1,2,2,1,4,1,2,24,1,2,1,3,1,2,1];

/* ── π ── */
let t=performance.now(); const pi=K.pePi(P); const tPi=ms(t);
t=performance.now(); const piM=K.pePiMachin(P); const tM=ms(t);
check(K.peDigitStr(pi,P,110)===PI_DIG,'π by the Chudnovsky series (binary splitting) reproduces the published 110 decimals',`${K.peDigitStr(pi,P,40)}… · ${P} digits in ${tPi}`);
const dPi=pi-piM; check(dPi<=3n&&dPi>=-3n,'π by Machin’s formula equals π by Chudnovsky to all computed digits (two independent algorithms)',`|difference| = ${dPi} units of 10^−${P} · Machin ${tM}`);
/* ── G ── */
t=performance.now(); const g=K.peCatalan(P); const tG=ms(t);
t=performance.now(); const gR=K.peCatRamanujan(P); const tR=ms(t);
check(K.peDigitStr(g,P,40)===G_DIG,'Catalan’s G by Guillera’s series reproduces the published 40 decimals 0.9159655941772190150546035149323841107741',`${K.peDigitStr(g,P,48)}… · ${P} digits in ${tG}`);
const dG=g-gR; check(dG<=3n&&dG>=-3n,'G by Ramanujan’s formula (π/8) log(2+√3) + (3/8) Σ (n!)²/((2n)!(2n+1)²) equals G by Guillera to all computed digits',`|difference| = ${dG} units of 10^−${P} · Ramanujan ${tR}`);
{ /* the defining series Σ (−1)^j/(2j+1)² itself, accelerated by Cohen–Rodriguez Villegas–Zagier in double precision */
  const n=40; let d=Math.pow(3+Math.sqrt(8),n); d=(d+1/d)/2; let b=-1, c=-d, s=0;
  for(let k=0;k<n;k++){ c=b-c; s+=c/((2*k+1)*(2*k+1)); b=(k+n)*(k-n)*b/((k+0.5)*(k+1)); }
  const gd=Number(g/10n**BigInt(P-17))/1e17; check(Math.abs(s/d-gd)<1e-14,'the defining alternating series Σ (−1)^j/(2j+1)² (CVZ acceleration, 40 terms, double) agrees with the BigInt G',`${(s/d).toPrecision(17)} vs ${gd.toPrecision(17)} · Δ = ${Math.abs(s/d-gd).toExponential(1)}`); }

/* ── continued fractions, certification, convergents ── */
t=performance.now(); const C=K.peCf(pi,P,D); const tC=ms(t);
t=performance.now(); const CG=K.peCf(g,P,D); const tCG=ms(t);
check(PI_CF30.every((v,i)=>C.a[i]===v),'the certified continued fraction of π begins [3; 7, 15, 1, 292, 1, 1, 1, 2, 1, 3, 1, 14, 2, 1, 1, 2, 2, 2, 2, 1, 84, 2, 1, 1, 15, 3, 13, 1, 4]',`[${C.a.slice(0,12).join(', ')}, …] · ${C.K} certified terms in ${tC}`);
check(PI_CF_TASK.every((v,i)=>C.a[i]===v),'its first 98 terms equal the list quoted in the task (OEIS A001203: … 16, 1, 161, 45, 1, 22 …)',`a_79 = ${C.a[79]}, a_80 = ${C.a[80]}, a_431 = ${C.a[431]} (largest of the first ${C.K - 1})`);
check(C.P_[3]===355n&&C.Q_[3]===113n&&C.P_[4]===103993n&&C.Q_[4]===33102n,'the convergents 355/113 (k = 3) and 103993/33102 (k = 4) are present',`p/q: ${C.P_.slice(0,6).map((p,i)=>p+'/'+C.Q_[i]).join(', ')}`);
{ let bad=0; for(let k=1;k<C.P_.length;k++){ const det=C.P_[k]*C.Q_[k-1]-C.P_[k-1]*C.Q_[k]; if(det!==(k%2?1n:-1n)) bad++; }
  for(let k=1;k<CG.P_.length;k++){ const det=CG.P_[k]*CG.Q_[k-1]-CG.P_[k-1]*CG.Q_[k]; if(det!==(k%2?1n:-1n)) bad++; }
  check(bad===0,'exact convergent identity p_k q_{k−1} − p_{k−1} q_k = (−1)^{k−1} (π and G, k < 160)',`${bad} violations`); }
{ /* the stored −log₁₀|y − p/q| against a direct BigInt difference, and the classical two-sided bound */
  let mx=0, bad=0; const E=BigInt(K.PE_ERR);
  for(let k=1;k<C.P_.length-1;k++){ const p=C.P_[k], q=C.Q_[k], q1=C.Q_[k+1], d=pi*q-p*B, ad=d<0n?-d:d;
    const le=-(K.peLnBig(ad)-K.peLnBig(q)-P*Math.LN10)/Math.LN10; mx=Math.max(mx,Math.abs(le-C.le[k]));
    /* 1/(q (q + q')) < |x − p/q| < 1/(q q'), x within E·10^−P of y: test with ad ± E q */
    if(!((ad-E*q)*(q+q1)>B && (ad+E*q)*q1<B)) bad++; }
  check(mx<1e-11&&bad===0,'|π − p_k/q_k| from the Euclid remainders equals the direct BigInt difference, and 1/(q_k(q_k+q_{k+1})) < |π − p_k/q_k| < 1/(q_k q_{k+1}) exactly (k < 159)',`max |Δ log₁₀| = ${mx.toExponential(1)} · ${bad} bound violations`); }
{ let below=0; for(const CC of [C,CG]) for(let k=1;k<CC.K;k++) if(CC.mu[k]===CC.mu[k]&&!(CC.mu[k]>2)) below++;
  check(below===0,'every certified convergent of π and of G has μ_k > 2 (|x − p/q| < 1/q², Dirichlet–Legendre)',`${C.K - 1} + ${CG.K - 2} convergents · ${below} with μ_k ≤ 2`); }
t=performance.now(); const EP=K.peCfEnds(pi,P,D), EG=K.peCfEnds(g,P,D); const tE=ms(t);
check(EP.K===C.K&&EG.K===CG.K&&EP.a.every((v,i)=>v===C.a[i])&&EG.a.every((v,i)=>v===CG.a[i]),'the cylinder test equals the literal certification (both ends of [x − 10^−D, x + 10^−D] expanded, common prefix kept)',`π ${EP.K} = ${C.K} · G ${EG.K} = ${CG.K} terms at D = ${D} · both ends ${tE}`);
{ const rows=[]; let ok=true;
  for(const d of [500,1000,2000,4000]){ const Pd=d+K.PE_GUARD, x=pi/10n**BigInt(P-Pd), y=g/10n**BigInt(P-Pd), cp=K.peCf(x,Pd,d), cg=K.peCf(y,Pd,d), rp=(cp.K-1)/d, rg=(cg.K-1)/d;
    rows.push(`D=${d}: π ${cp.K-1} (${rp.toFixed(4)}), G ${cg.K-1} (${rg.toFixed(4)})`); if(!(rp>0.93&&rp<1.01&&rg>0.93&&rg<1.01)) ok=false; }
  check(ok,'Lochs: certified partial quotients per decimal digit within [0.93, 1.01] (Lochs’s constant 6 ln2 ln10/π² = 0.970270)',rows.join(' · ')); }
{ const m3=C.mu[3], md=-Math.log(Math.abs(Math.PI-355/113))/Math.log(113);
  check(Math.abs(m3-md)<1e-6,'μ for 355/113 from the BigInt engine equals −log|π − 355/113|/log 113 in double precision',`μ_3 = ${m3.toFixed(6)} vs ${md.toFixed(6)} · μ_1 (22/7) = ${C.mu[1].toFixed(4)}, μ_4 (103993/33102) = ${C.mu[4].toFixed(4)}`); }
{ const mp=K.peMuCF(C.a), mg=K.peMuCF(CG.a); let mx=0; for(let k=1;k<C.K-30;k++) mx=Math.max(mx,Math.abs(mp[k]-C.mu[k])); for(let k=2;k<CG.K-30;k++) mx=Math.max(mx,Math.abs(mg[k]-CG.mu[k]));
  check(mx<1e-10,'μ_k from exact remainders equals 2 + ln(x_{k+1} + q_{k−1}/q_k)/ln q_k computed from the partial quotients alone',`max |Δμ| = ${mx.toExponential(1)} over k ≤ K − 30`); }
const mP=K.peMaxMu(C,5), mG=K.peMaxMu(CG,6), tailP=K.peMaxMu(C,C.K>>1), tailG=K.peMaxMu(CG,CG.K>>1);
check(mP.mu<2.5&&mG.mu<2.5,'measured: beyond 103993/33102 (π) and 109/119 (G) every certified convergent has μ_k < 5/2 (consistent with, not evidence of, the claimed limit 2)',`π: max μ_k (k > 4) = ${mP.mu.toFixed(4)} at k = ${mP.k} (a_${mP.k+1} = ${C.a[mP.k+1]}) · G: μ_5 (109/119) = ${CG.mu[5].toFixed(4)}, max (k > 5) = ${mG.mu.toFixed(4)} at k = ${mG.k}`);
check(tailP.mu<2.01&&tailG.mu<2.01,'measured: over the second half of the certified convergents max μ_k − 2 is below 0.01',`π: ${(tailP.mu-2).toExponential(2)} at k = ${tailP.k} · G: ${(tailG.mu-2).toExponential(2)} at k = ${tailG.k}`);
{ const qP=C.lq[C.K-1], qG=CG.lq[CG.K-1];
  check(qP>0.45*D&&qG>0.45*D,'the certified convergents exclude π = a/b and G = a/b for every denominator b ≤ q_{K−1} (finite horizon, not irrationality)',`π: q_{K−1} ≈ 10^${qP.toFixed(1)} · G: q_{K−1} ≈ 10^${qG.toFixed(1)}`); }

/* ── Gauss–Kuzmin, Khinchin, Lévy ── */
const SP=K.peStats(C.a.slice(0,3001),C.lq), SG=K.peStats(CG.a.slice(0,3001),CG.lq), SPa=K.peStats(C.a,C.lq), SGa=K.peStats(CG.a,CG.lq);
check(Math.abs(SP.khin-K.PE_K0)<0.2&&Math.abs(SG.khin-K.PE_K0)<0.2,'Khinchin: the geometric mean of the first 3000 partial quotients is within 0.2 of K₀ = 2.6854520010 (π and G)',`π ${SP.khin.toFixed(4)} · G ${SG.khin.toFixed(4)} · all certified: π ${SPa.khin.toFixed(4)} (n = ${SPa.n}), G ${SGa.khin.toFixed(4)} (n = ${SGa.n})`);
{ let ok=true; const rows=[]; for(const a of [1,2,3]){ const l=K.peGK(a); rows.push(`a=${a}: law ${l.toFixed(4)} π ${SPa.freq[a].toFixed(4)} G ${SGa.freq[a].toFixed(4)}`); if(Math.abs(SPa.freq[a]-l)>0.03||Math.abs(SGa.freq[a]-l)>0.03) ok=false; }
  let chiP=0, chiG=0; for(let a=1;a<=10;a++){ const e=SPa.law[a]*SPa.n; chiP+=(SPa.cnt[a]-e)**2/e; const eg=SGa.law[a]*SGa.n; chiG+=(SGa.cnt[a]-eg)**2/eg; }
  check(ok,'Gauss–Kuzmin: frequencies of a = 1, 2, 3 within 0.03 of log₂(1 + 1/(a(a+2)))',rows.join(' · ')+` · χ² (10 bins, 9 dof): π ${chiP.toFixed(1)}, G ${chiG.toFixed(1)}`); }
{ let s=0; for(let a=1;a<10;a++) s+=K.peGK(a); s+=K.peGKTail(10); check(Math.abs(s-1)<1e-15,'the Gauss–Kuzmin law sums to 1 (bins 1 … 9 and the tail log₂(1 + 1/10))',`Σ = ${s.toPrecision(17)}`); }
check(Math.abs(SPa.levy-K.PE_LEVY)<0.1&&Math.abs(SGa.levy-K.PE_LEVY)<0.1,'Lévy: ln q_k / k within 0.1 of π²/(12 ln 2) = 1.186569',`π ${SPa.levy.toFixed(4)} · G ${SGa.levy.toFixed(4)}`);

/* ── the Flint–Hills series ── */
t=performance.now(); const F=K.peFhInit(1e7); while(!K.peFhStep(F,1e6)); const tF=ms(t);
const S6=K.peFhAt(F,1e6), S7=K.peFhSum(F), S5=K.peFhAt(F,1e5), S3=K.peFhAt(F,1e3);
{ let mono=true; for(let i=1;i<F.cpI;i++) if(F.cpS[i]<F.cpS[i-1]) mono=false;
  check(mono&&S7>=S6&&S6>=S5&&F.cpN[F.cpI-1]===1e7,'S(N) = Σ_{n≤N} 1/(n³ sin² n) is nondecreasing at all checkpoints up to N = 10⁷ (values reported, not asserted)',`S(10³) = ${S3.toFixed(10)} · S(10⁵) = ${S5.toFixed(10)} · S(10⁶) = ${S6.toFixed(12)} · S(10⁷) = ${S7.toFixed(12)} · 10⁷ terms in ${tF}`); }
check(F.top[0][0]===355,'the largest single term up to 10⁷ is at n = 355 (the numerator of 355/113)',F.top.slice(0,9).map(x=>`${x[0]}: ${x[1].toPrecision(6)}`).join(' · '));
{ let mx=0, mxM=0; for(const r of F.res){ const ex=K.peSinRed(r[0],pi,P)[0]; mx=Math.max(mx,Math.abs(K.peSinCW(r[0])-ex)/Math.abs(ex)); mxM=Math.max(mxM,Math.abs(Math.sin(r[0])-ex)/Math.abs(ex)); }
  check(mx<1e-14&&mxM<1e-14,'spike terms: sin n by Cody–Waite and by Math.sin agree with the exact BigInt reduction n − mπ for every resonant n ≤ 10⁷ (n|sin n| < 4)',`${F.res.length} resonant n · max relative error: Cody–Waite ${mx.toExponential(1)}, Math.sin ${mxM.toExponential(1)}`); }
{ /* the split π = C1 + C2 + C3: C1·2^28 and C2·2^58 are integers below 2^30, C3·2^112 an integer; the exact sum vs π */
  const i1=K.PE_C1*2**28, i2=K.PE_C2*2**58, i3=K.PE_C3*2**112;
  const okBits=Number.isInteger(i1)&&i1<2**30&&Number.isInteger(i2)&&i2<2**30&&Number.isInteger(i3);
  const sum=(BigInt(i1)<<84n)+(BigInt(i2)<<54n)+BigInt(i3), ex=(pi<<112n)/B, dd=sum>ex?sum-ex:ex-sum, rel=Number(dd)/Number(ex);
  let mx=0; for(let i=0;i<100000;i++){ const n=1+(i*2654435761)%9999991; const a=Math.sin(n), b=K.peSinCW(n); mx=Math.max(mx,Math.abs(a-b)/Math.abs(a)); }
  check(okBits&&rel<1e-30&&mx<1e-15,'Cody–Waite split π = C1 + C2 + C3 (30 + 30 significant bits + remainder) equals π to 10^−30 and matches Math.sin (fdlibm) on 10⁵ sampled n ≤ 10⁷',`|C1 + C2 + C3 − π|/π = ${rel.toExponential(1)} · max relative Δ sin = ${mx.toExponential(1)}`); }
{ /* Legendre: n ≥ 16 with n|sin n| < 0.9 forces n/m (m = round(n/π)) to reduce to a convergent p_k/q_k */
  const conv=C.P_.map((p,i)=>[p,C.Q_[i]]); const bad=[], hits=[];
  for(const r of F.res){ const n=r[0]; if(n<16||r[2]>=0.9) continue; const m=BigInt(Math.round(n/Math.PI)), N=BigInt(n);
    const f=conv.find(([p,q])=>N%p===0n&&N/p*q===m); if(f) hits.push(`${n}=${N/f[0]}·${f[0]}`); else bad.push(n); }
  check(bad.length===0&&hits.length>0,'every n ≥ 16 (≤ 10⁷) with n·|sin n| < 0.9 is a multiple j·p_k of a convergent numerator with round(n/π) = j·q_k (Legendre)',`${hits.join(', ')}${bad.length?' · not convergent: '+bad.join(','):''}`); }
{ /* the term at a convergent numerator is π^−3 q^{2μ−5} (sin p_k ≈ ±(p_k − q_kπ), p_k ≈ q_kπ): the bridge between μ_k and the spikes */
  const rows=[]; let mx=0;
  for(let k=3;k<C.P_.length;k++){ const p=Number(C.P_[k]); if(p>1e7) break; const r=F.res.find(x=>x[0]===p); const term=r?r[1]:1/(p**3*K.peSinCW(p)**2);
    const pred=Math.pow(Number(C.Q_[k]),2*C.mu[k]-5)/Math.PI**3, rel=Math.abs(term/pred-1); mx=Math.max(mx,rel); rows.push(`${p}: ${term.toPrecision(4)} (2μ−5 = ${(2*C.mu[k]-5).toFixed(3)})`); }
  check(mx<1e-6,'at every convergent numerator 355 ≤ p_k ≤ 10⁷ the term 1/(p³ sin² p) equals π^−3 q_k^{2μ_k−5} (double sum vs BigInt continued fraction)',`max relative Δ = ${mx.toExponential(1)} · ${rows.join(' · ')}`); }
console.log(`timings: π Chudnovsky ${tPi} · Machin ${tM} · G Guillera ${tG} · Ramanujan ${tR} · CF π ${tC} · CF G ${tCG} · ends ${tE} · Flint–Hills 10⁷ ${tF} · total ${ms(T0)}`);
console.log(`${pass} passed, ${fail} failed`); process.exit(fail?1:0);
