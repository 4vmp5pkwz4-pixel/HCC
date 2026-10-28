/* GAUSS'S THEOREM ON S³ (v4.410) — Preece & Batenin, «Gauss's theorem in the Fractal Bindu S³ of Reality model: electric flux as a
   probe of curved topology and self-similar scaling» (FBS3R, 19 July 2025): repository verifier on the page's own kernels
   (core/atlas/extracted.mjs). The page's claims are recomputed against independent constructions written here, and mutations must fail. */
const K=await import(new URL('../core/atlas/extracted.mjs',import.meta.url));
let pass=0, fail=0; const t00=performance.now();
const check=(ok,claim,nums)=>{ if(ok) pass++; else fail++; console.log(`${ok?'PASS':'FAIL'} — ${claim} :: ${nums}`); };
const PI=Math.PI, PHI=(1+Math.sqrt(5))/2, grid=(a,b,n)=>Array.from({length:n},(_,k)=>a+(b-a)*(k+0.5)/n);

/* 1. the Green's function: d/dχ(sin²χ G′) = 2 sin²χ/4π², i.e. ΔG = 1/2π² away from the charge, and 4πχG → 1 at it (Coulomb) */
{ let worst=0; for(const x of grid(0.05,PI-0.05,80)){ const h=1e-5, f=t=>Math.sin(t)**2*K.gsGp(t), d=(f(x+h)-f(x-h))/(2*h); worst=Math.max(worst,Math.abs(d/Math.sin(x)**2-1/(2*PI*PI))); }
  const coul=[1e-2,1e-3,1e-4].map(x=>4*PI*x*K.gsG(x));
  check(worst<1e-6&&Math.abs(coul[2]-1)<1e-3,'the Green\'s function of S³ with the uniform background, G = (π − χ) cot χ/4π², has ΔG = 1/2π² away from the charge and G ~ 1/4πχ at it',
    `max |ΔG − 1/2π²| ${worst.toExponential(1)} · 4πχG at χ = 10⁻², 10⁻³, 10⁻⁴: ${coul.map(v=>v.toFixed(5)).join(', ')}`); }
/* 2. the flux through the geodesic sphere of radius χ: −4π sin²χ G′ = 1 − Γ(χ), Γ the volume fraction inside, by its own quadrature */
{ let worst=0, wv=0; for(const x of grid(0.02,PI-0.02,60)){ worst=Math.max(worst,Math.abs(K.gsFluxNum(x)-(1-K.gsGamma(x))));
    let v=0; const n=400; for(let k=0;k<n;k++){ const t=x*(k+0.5)/n; v+=4*PI*Math.sin(t)**2*x/n; } wv=Math.max(wv,Math.abs(v/(2*PI*PI)-K.gsGamma(x))); }
  check(worst<1e-12&&wv<1e-5,'a lone charge on its background sends Q(1 − Γ(χ))/ε₀ through the sphere of radius χ, Γ(χ) = (χ − sin χ cos χ)/π the fraction of S³ inside — zero at the antipode',
    `max |−4π sin²χ G′ − (1 − Γ)| ${worst.toExponential(1)} · Γ against the volume integral ${wv.toExponential(1)}`); }
/* 3. the background is the zero mode removed: G − 1/8π² = Σ_{ℓ≥1} (ℓ+1) sin((ℓ+1)χ)/(ℓ(ℓ+2) sin χ)/2π² (accelerated here independently:
   Σ n sin nχ/(n² − 1) = (π − χ)/2 − sin χ + Σ sin nχ/(n(n² − 1))), and 1/8π² is the mean of G over S³ */
{ let worst=0; for(const x of [0.1,0.4,0.9,1.4,2.0,2.6,3.0]){ let t=0; for(let n=2;n<=20000;n++) t+=Math.sin(n*x)/(n*(n*n-1)); const s=((PI-x)/2-Math.sin(x)+t)/(2*PI*PI*Math.sin(x)); worst=Math.max(worst,Math.abs(K.gsG(x)-1/(8*PI*PI)-s)); }
  let m=0, w=0; for(const x of grid(0,PI,40000)){ const v=Math.sin(x)**2; m+=K.gsG(x)*v; w+=v; } m/=w;
  const fe=Math.max(...[0.4,1.4,2.6].map(x=>Math.abs(K.gsSpectral(x,1600)-(K.gsG(x)-1/(8*PI*PI)))));
  check(worst<1e-10&&Math.abs(m-1/(8*PI*PI))<1e-6&&fe<1e-3,'G is the Green\'s function of S³ with the constant harmonic removed — the sum over the harmonics of degree ℓ ≥ 1 with weights 1/ℓ(ℓ+2): the uniform background IS the removal of the zero mode, and 1/8π² is the mean of G',
    `max |G − 1/8π² − Σ| ${worst.toExponential(1)} · mean of G ${m.toFixed(8)} vs 1/8π² = ${(1/(8*PI*PI)).toFixed(8)} · the page's Fejér sum at L = 1600 within ${fe.toExponential(1)}`); }
/* 4. a lone charge without a background is impossible: the radial harmonic functions are a cot χ + b, singular at BOTH poles — the
   field of an antipodal pair; and ∫Δf dV = 4π[sin²χ f′]₀^π = 0 for every smooth radial f, so Δφ = −ρ/ε₀ needs ∫ρ = 0 */
{ let worst=0; for(const x of grid(0.2,PI-0.2,40)){ const f=t=>1/Math.tan(t), h=1e-4, d=t=>Math.sin(t)**2*(f(t+h)-f(t-h))/(2*h); worst=Math.max(worst,Math.abs((d(x+h)-d(x-h))/(2*h))); }
  let I=0; const f=t=>Math.cos(t)**3+0.3*Math.cos(2*t)+0.1*Math.sin(t)**4, n=20000; for(const t of grid(0,PI,n)){ const h=1e-4, d=u=>Math.sin(u)**2*(f(u+h)-f(u-h))/(2*h); I+=(d(t+h)-d(t-h))/(2*h)*PI/n; }
  const nearPi=[1e-2,1e-3].map(e=>-4*PI*Math.sin(PI-e)**2*(-1/Math.sin(PI-e)**2)/(4*PI));
  check(worst<1e-5&&Math.abs(I)<1e-6&&nearPi.every(v=>Math.abs(v-1)<1e-9),'without the background there is no lone charge: the only radial harmonic functions are a cot χ + b, which carry flux 1 into the antipode too — the field of an antipodal pair — and ∫ Δf dV = 0 for every smooth f, so a solution needs ∫ ρ = 0',
    `max |Δ cot χ| ${worst.toExponential(1)} · ∫ Δf dV for a test f ${I.toExponential(1)} · flux of cot χ/4π into the antipode ${nearPi.map(v=>v.toFixed(6)).join(', ')}`); }
/* 5. Gauss's theorem on S³, measured: the flux of E out of geodesic spheres about ANY centre, by quadrature, is the charge inside —
   point charges plus the background inside, for a lone charge; the point charges alone, for neutral sets */
{ const rnd=(s=>()=>{ s=(s*16807)%2147483647; return s/2147483647; })(11), pt=()=>{ const g=()=>Math.sqrt(-2*Math.log(rnd()))*Math.cos(2*PI*rnd()), v=[g(),g(),g(),g()], m=Math.hypot(...v); return v.map(x=>x/m); };
  const sets=[[[1,[1,0,0,0]]], [[1,[1,0,0,0]],[-1,[-1,0,0,0]]], [[1,[1,0,0,0]],[-1,[Math.cos(1.3),Math.sin(1.3),0,0]]], [[2,pt()],[-1,pt()],[-1,pt()]]];
  /* spheres that pass no closer than 0.15 rad to a charge, where the integrand is smooth and the quadrature spectrally accurate */
  let worst=0, n=0, tried=0; for(const Q of sets){ const tot=Q.reduce((s,[q])=>s+q,0); for(let k=0;k<6;){ const c=pt(), chi=0.3+2.5*rnd(); tried++;
      if(Q.some(([q,x])=>Math.abs(K.gsDist(x,c)-chi)<0.15)) continue; k++;
      const inside=Q.filter(([q,x])=>K.gsDist(x,c)<chi).reduce((s,[q])=>s+q,0)-tot*K.gsGamma(chi), F=K.gsSphereFlux(Q,c,chi,56); worst=Math.max(worst,Math.abs(F-inside)); n++; } }
  check(worst<1e-7,'Gauss\'s theorem on S³, measured: through 24 geodesic spheres about random centres, for a lone charge, an antipodal pair, a pair at 1.3 rad and a neutral triple, the flux of E by quadrature equals the charge inside (the background\'s share included where there is a net charge)',
    `${n} spheres (of ${tried} drawn; those within 0.15 rad of a charge set aside, where the integrand is nearly singular) · max |flux − enclosed| ${worst.toExponential(1)}`); }
/* 6. the field lines: a lone charge's are geodesics, each ending at its share; an antipodal pair's all arrive; a pair's, integrated, all
   reach −Q; and exactly round(N(1 − Γ(χ))) lines of a lone charge pass every sphere — the flux, counted in lines */
{ const N=120, sh=Array.from({length:N},(_,i)=>i).sort((a,b)=>((a*0.6180339887)%1)-((b*0.6180339887)%1)), share=new Array(N); sh.forEach((i,j)=>{ share[i]=(j+0.5)/N; });
  let off=0; for(const x of grid(0.05,PI-0.05,50)){ const pass=share.filter(u=>K.gsEnd(u)>x).length; off=Math.max(off,Math.abs(pass-Math.round(N*K.gsFlux(x)))); }
  const Q=[[1,[1,0,0,0]],[-1,[Math.cos(1.9),Math.sin(1.9),0,0]]], e=K.gsFrame([1,0,0,0]); let arrived=0, tan=0;
  for(let i=0;i<20;i++){ const z=1-2*(i+0.5)/20, r=Math.sqrt(1-z*z), a=i*2.4, d=[r*Math.cos(a),r*Math.sin(a),z], u=[0,1,2,3].map(q=>d[0]*e[0][q]+d[1]*e[1][q]+d[2]*e[2][q]), x0=[0,1,2,3].map(q=>Math.cos(0.03)*(q===0?1:0)+Math.sin(0.03)*u[q]);
    const L=K.gsLine(Q,x0,800,0.02,x=>K.gsDist(x,Q[1][1])<0.03); if(K.gsDist(L[L.length-1],Q[1][1])<0.031) arrived++;
    for(let k=5;k+1<L.length;k+=25){ const E=K.gsField(Q,L[k]), t=[0,1,2,3].map(q=>L[k+1][q]-L[k][q]), dot=E.reduce((s,v,q)=>s+v*t[q],0); tan=Math.max(tan,1-dot/(Math.hypot(...E)*Math.hypot(...t))); } }
  check(off===0&&arrived===20&&tan<1e-3,'the drawn lines are the field: exactly round(N(1 − Γ(χ))) of a lone charge\'s 120 lines pass every sphere; all 20 lines of a pair at 1.9 rad, integrated on S³, reach −Q; and they run along E',
    `lines-count deviation ${off} · arrived ${arrived}/20 · max 1 − cos∠(E, line) ${tan.toExponential(1)}`); }
/* 7. the manuscript's hierarchy, in closed form: the net charge 1/(1 − φ^{−D}) is 1.340 at D = 2.85 (its abstract prints 1.35), 1.685 at
   D(∞) = 1.87, φ²/2 at D = 3 (φ³ − 1 = 2φ); its Eq. (1) is the tail sum of the shells inside; ten terms give 1.34, as its appendix says;
   the net is above 1 for every D > 0 — convergent, never zero */
{ const net=D=>1/(1-Math.pow(PHI,-D)); let eq1=0; for(const D of [1.87,2.85,3]) for(let n=0;n<12;n++){ let tail=0; for(let k=n+1;k<400;k++) tail+=Math.pow(PHI,-k*D); eq1=Math.max(eq1,Math.abs(tail-K.gsShellFlux(D,n))); }
  const v=[2.85,1.87,3].map(D=>K.gsHierNet(D)), ten=K.gsHierPartial(2.85,10), minNet=Math.min(...grid(0.05,6,200).map(K.gsHierNet));
  check(Math.abs(v[0]-1.340010)<1e-5&&Math.abs(v[1]-net(1.87))<1e-12&&Math.abs(v[2]-PHI*PHI/2)<1e-12&&Math.abs(ten-v[0])<1e-4&&eq1<1e-12&&minNet>1,'the manuscript\'s golden hierarchy carries 1/(1 − φ^{−D}) = 1.34001 ΔQ₀ at D = 2.85 (its abstract rounds to 1.35), 1.68527 at D = 1.87 and φ²/2 at D = 3; its Eq. (1) is the charge of the shells inside; ten terms already give 1.34; and the sum exceeds 1 for every D — so the hierarchy alone is never neutral',
    `D = 2.85: ${v[0].toFixed(6)} · 1.87: ${v[1].toFixed(5)} · 3: ${v[2].toFixed(6)} (φ²/2 ${(PHI*PHI/2).toFixed(6)}) · 10 terms ${ten.toFixed(6)} · Eq. (1) ${eq1.toExponential(1)} · min over D ${minNet.toFixed(4)}`); }
/* 8. mutations that must fail: with the background removed the flux of a lone charge would be 1 through every sphere — then at the
   antipode a sphere enclosing no charge would carry flux 1; a mirror hierarchy at the antipode makes it neutral, and the flux through
   the equatorial sphere is then the hierarchy's whole charge, not zero */
{ const Fno=K.gsSphereFlux([[1,[1,0,0,0]],[-1,[-1,0,0,0]]],[-1,0,0,0],0.2,40), lone=K.gsSphereFlux([[1,[1,0,0,0]]],[-1,0,0,0],0.2,40), D=2.85, net=K.gsHierNet(D);
  const mirror=[]; for(let n=0;n<10;n++){ const q=Math.pow(PHI,-n*D), r=0.02*Math.pow(PHI,-n); mirror.push([q,[Math.cos(r),Math.sin(r),0,0]]); mirror.push([-q,[-Math.cos(r),-Math.sin(r),0,0]]); }
  const eq=K.gsSphereFlux(mirror,[1,0,0,0],PI/2,40);
  check(Math.abs(Fno+1)<1e-6&&Math.abs(lone-(-K.gsGamma(0.2)))<1e-6&&Math.abs(eq-K.gsHierPartial(D,10))<1e-4,'mutations fail as they must: a charge whose flux reaches the antipode undiminished needs a charge −Q there (the sphere about the antipode carries −1, not 0); about the antipode of a lone charge only the background\'s −Γ is enclosed; a mirror hierarchy makes the universe neutral, and the equatorial sphere then carries the hierarchy\'s whole charge',
    `pair, sphere about the antipode ${Fno.toFixed(6)} · lone ${lone.toFixed(6)} vs −Γ(0.2) ${(-K.gsGamma(0.2)).toFixed(6)} · mirror hierarchy through the equator ${eq.toFixed(5)} vs ${K.gsHierPartial(D,10).toFixed(5)} (net of the infinite one ${net.toFixed(5)})`); }

/* 9. the whole universe is drawn and nothing outside it: the two-ball chart sends the half y₀ ≥ 0 into one unit ball and the half
   y₀ ≤ 0 into the other, an equatorial point to the same place of both surfaces; every point of every drawn line lands in a ball,
   never beyond its surface; and a line that crosses the equator leaves one ball and enters the other at the same surface point */
{ const R=[[1,0,0,0],[0,1,0,0],[0,0,1,0],[0,0,0,1]], rnd=(s=>()=>{ s=(s*16807)%2147483647; return s/2147483647; })(23); let glue=0, out=0, jump=0, n=0, cross=0;
  for(let k=0;k<2000;k++){ const g=()=>2*rnd()-1, v=[0,g(),g(),g()], m=Math.hypot(...v), x=v.map(t=>t/m); const a=K.gsChart2([1e-15,x[1],x[2],x[3]],R), b=K.gsChart2([-1e-15,x[1],x[2],x[3]],R);
    glue=Math.max(glue,Math.hypot(a.p[0]-b.p[0],a.p[1]-b.p[1],a.p[2]-b.p[2]),Math.abs(Math.hypot(...a.p)-1)); }
  const Qs=[[[1,[1,0,0,0]],[-1,[Math.cos(2.2),Math.sin(2.2),0,0]]],[[1,[1,0,0,0]],[-1,[-1,0,0,0]]]], e=K.gsFrame([1,0,0,0]);
  for(const Q of Qs) for(let i=0;i<12;i++){ const z=1-2*(i+0.5)/12, r=Math.sqrt(1-z*z), al=i*2.4, d=[r*Math.cos(al),r*Math.sin(al),z], u=[0,1,2,3].map(q=>d[0]*e[0][q]+d[1]*e[1][q]+d[2]*e[2][q]), x0=[0,1,2,3].map(q=>Math.cos(0.03)*(q===0?1:0)+Math.sin(0.03)*u[q]);
    const L=K.gsLine(Q,x0,700,0.02,x=>K.gsDist(x,Q[1][1])<0.03); let prev=null;
    for(const x of L){ const c=K.gsChart2(x,K.ymRot4?K.ymRot4(0.7,0.4):R); n++; out=Math.max(out,Math.hypot(...c.p)-1);
      if(prev&&prev.b===c.b&&Math.hypot(c.p[0]-prev.p[0],c.p[1]-prev.p[1],c.p[2]-prev.p[2])>0.25) jump++;
      if(prev&&prev.b!==c.b){ cross++; const q=K.gsCross(prev.y,c.y); jump+=Math.abs(Math.hypot(...q)-1)>1e-12?1:0; jump+=(Math.hypot(...q.map((v,j)=>v-prev.p[j]))>0.25||Math.hypot(...q.map((v,j)=>v-c.p[j]))>0.25)?1:0; }
      prev=c; } }
  check(glue<1e-12&&out<=1e-12&&jump===0&&cross>10,'the whole universe is drawn, and nothing outside it: S³ is two balls whose surfaces are one sphere — the equator lands on the same point of both — every point of every line lies within a ball, and a line crossing the equator leaves one ball and enters the other at the same point of their common surface',
    `gluing ${glue.toExponential(1)} · beyond a surface ${out<=0?'never':out.toExponential(1)} · ${n} line points · ${cross} crossings, discontinuities ${jump}`); }

console.log(`\n${pass} passed, ${fail} failed · ${(performance.now()-t00).toFixed(0)} ms`);
process.exit(fail?1:0);
