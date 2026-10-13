#!/usr/bin/env node
/* THE TRISPHERE AT EVERY SCALE (v4.381) — repository verifier on the page's own kernels (core/atlas/extracted.mjs, sliced
   from index.html) and the planets' own elements (PLANETS, read from index.html). Hamilton 1846, Fock 1935, Moser 1970:
   the Kepler problem at fixed energy is the geodesic flow of S³; disjoint great circles of S³ link with Lk = sign det;
   the Hopf fibration carries light, qubits and the isotropic oscillator; a closed FLRW cosmos is an S³ of radius
   (c/H₀)/√(−Ω_k). Exact reformulations — none of them a claim that physical space is a three-sphere. */
import fs from 'node:fs';
const H=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
const K=await import(new URL('../core/atlas/extracted.mjs',import.meta.url));
const a=H.indexOf('const PLANETS = ['), PL=new Function('return '+H.slice(a+16, H.indexOf('\n];',a)+3))();
let pass=0, fail=0; const ok=(c,n,d)=>{ if(c) pass++; else fail++; console.log(`${c?'PASS':'FAIL'} — ${n} :: ${d}`); };
/* 1 Hamilton + Fock + Moser: every planet's hodograph lands on a great circle of S³ */
const P=PL.map(p=>({name:p.name, el:K.tqEl(p)})); let worstR=0, worstN=0;
for(const q of P){ const pts=K.tqHodograph(q.el,720); q.pts=pts; q.P=K.tqPlane(pts); worstR=Math.max(worstR,q.P.res); for(const x of pts) worstN=Math.max(worstN,Math.abs(Math.hypot(...x)-1)); }
ok(worstR<1e-12&&worstN<1e-14,'Hamilton, Fock, Moser: the hodograph of each of the nine planets, mapped at its own energy, lies on the unit S³ and on a 2-plane through the origin — a great circle',`max |ξ| − 1 ${worstN.toExponential(1)} · max distance from the plane ${worstR.toExponential(1)}`);
/* 2 the Kepler solver itself: vis-viva and the orbit closes */
{ let w=0; for(const q of P){ for(let k=0;k<12;k++){ const s=K.tqKepler(q.el,k*0.53), r=Math.hypot(...s.r), v2=s.v.reduce((t,x)=>t+x*x,0); w=Math.max(w,Math.abs(v2-K.TQ_GM*(2/r-1/q.el.a))/v2); } }
  ok(w<1e-12,'the Kepler solver: vis-viva v² = GM(2/r − 1/a) at every sampled point of every orbit',`max relative ${w.toExponential(1)}`); }
/* 3 every pair is Hopf-linked: Lk = sign det, confirmed by the Gauss integral in ℝ³ */
const M=K.tqLinkMatrix(P.map(q=>q.P)); let zeros=0, agree=0, pairs=0, minDet=Infinity, gaussN=0, gaussOk=0; const pole=K.tqPole(P.map(q=>q.P),600,11), F=K.tqFrame(pole.pole);
for(let i=0;i<P.length;i++) for(let j=i+1;j<P.length;j++){ pairs++; if(M.L[i][j]===0) zeros++; minDet=Math.min(minDet,Math.abs(M.D[i][j]));
  const A=K.tqCircle(P[i].P,4000).map(x=>K.tqStereo(x,F)), B=K.tqCircle(P[j].P,4000).map(x=>K.tqStereo(x,F)), dl=K.tqDiskLink(A,B);
  if(dl===M.L[i][j]) agree++; if(Math.abs(M.D[i][j])>2e-3){ gaussN++; const g=K.tqGauss(K.tqCircle(P[i].P,900).map(x=>K.tqStereo(x,F)),K.tqCircle(P[j].P,900).map(x=>K.tqStereo(x,F))); if(Math.abs(g-M.L[i][j])<0.02) gaussOk++; } }
ok(zeros===0&&agree===pairs&&gaussOk===gaussN&&gaussN>=20,'every one of the 36 pairs of planetary rings is Hopf-linked in the trisphere of momenta: the sign of det[a₁ b₁ a₂ b₂] equals the signed crossings through a spanning disk after stereographic projection, pair by pair, and the Gauss integral agrees wherever the rings are well apart',`${pairs} pairs · disk crossings = det ${agree}/${pairs} · Gauss = det ${gaussOk}/${gaussN} (|det| > 2·10⁻³) · smallest |det| ${minDet.toExponential(2)} (Earth–Neptune) · pole margin ${pole.margin.toFixed(3)}`);
console.log('    Lk matrix: '+P.map((q,i)=>q.name.slice(0,3)+' '+M.L[i].map(x=>x>0?'+':x<0?'−':'·').join('')).join(' | '));
/* 4 coplanar orbits meet instead of linking: two orbits in one plane give det = 0 */
{ const e1={a:1,e:0.1,i:0.3,O:0.7,w:0.2}, e2={a:2.3,e:0.4,i:0.3,O:0.7,w:1.9}, A=K.tqPlane(K.tqHodograph(e1,360)), B=K.tqPlane(K.tqHodograph(e2,360)), r=K.tqLink(A,B,1e-10);
  ok(r.lk===0,'two orbits in one plane: their great circles share a line of ℝ⁴, so they meet in two antipodal points and do not link (det = 0)',`det ${r.det.toExponential(1)}`); }
/* 5 the Hopf map: each phase circle maps to one point of the sphere, two of them link once */
{ let w=0; const pts=[[0.4,1.1],[2.2,-0.7],[1.0,2.9]]; for(const [th,ph] of pts){ const C=K.tqCircle(K.tqFiber(th,ph),64), want=[Math.sin(th)*Math.cos(ph),Math.sin(th)*Math.sin(ph),Math.cos(th)]; for(const x of C){ const h=K.tqHopf(x); w=Math.max(w,Math.hypot(h[0]-want[0],h[1]-want[1],h[2]-want[2])); } }
  const A=K.tqFiber(0.4,1.1), B=K.tqFiber(2.2,-0.7), r=K.tqLink(A,B), F2=K.tqFrame(K.tqPole([A,B],300,3).pole), g=K.tqGauss(K.tqCircle(A,800).map(x=>K.tqStereo(x,F2)),K.tqCircle(B,800).map(x=>K.tqStereo(x,F2)));
  ok(w<1e-12&&Math.abs(Math.abs(g)-1)<0.01&&Math.sign(g)===r.lk,'Hopf: every global-phase circle maps to one point of the Poincaré / Bloch sphere, and the circles over two different states link exactly once',`max |h − target| ${w.toExponential(1)} · Gauss ${g.toFixed(4)} · det sign ${r.lk}`); }
/* 6 the oscillator's orbits are Hopf circles of the same fibration */
{ const O1=K.tqOscillator(1,0.4,0.6), O2=K.tqOscillator(0.3,1,2.1), C=K.tqCircle(O1,200); let w=0, h0=K.tqHopf(C[0]);
  for(const x of C){ const h=K.tqHopf(x); w=Math.max(w,Math.hypot(h[0]-h0[0],h[1]-h0[1],h[2]-h0[2])); }
  /* the time flow itself: x = A cos t, y = B cos(t − φ) with p = dq/dt is the rotation of (q + ip) by e^{−it} */
  let w2=0; const A=1, B=0.4, ph=0.6, n=Math.hypot(A,B); for(let k=0;k<50;k++){ const t=k*0.13, x=[A*Math.cos(t),-A*Math.sin(t),B*Math.cos(t-ph),-B*Math.sin(t-ph)].map(v=>v/n), c=Math.cos(t), s=Math.sin(t), y=O1.a.map((v,i)=>c*v+s*O1.b[i]); w2=Math.max(w2,Math.hypot(...x.map((v,i)=>v-y[i]))); }
  ok(w<1e-12&&w2<1e-12&&K.tqLink(O1,O2).lk!==0,'the isotropic oscillator in the plane: every orbit is a Hopf circle of its energy S³ (one point of the Hopf sphere), the time flow runs along it exactly, and two different orbits link',`Hopf image spread ${w.toExponential(1)} · flow vs circle ${w2.toExponential(1)} · Lk ${K.tqLink(O1,O2).lk}`); }
/* 7 hydrogen: the level n is n² harmonics on S³; its semiclassical orbits are great circles of the same S³ */
{ const dims=[1,2,3,4,5].map(n=>K.tqHarmonicDim(n-1)), sums=[1,2,3,4,5].map(n=>{ let s=0; for(let l=0;l<n;l++) s+=2*l+1; return s; });
  const o1=K.tqHydrogenOrbit(3,0,0.2,0.1,0.4), o2=K.tqHydrogenOrbit(3,1,1.1,0.9,2.0), A=K.tqPlane(K.tqHodograph(o1,360,1)), B=K.tqPlane(K.tqHodograph(o2,360,1));
  ok(dims.every((d,i)=>d===(i+1)**2&&d===sums[i])&&A.res<1e-12&&B.res<1e-12&&K.tqLink(A,B).lk!==0,'hydrogen (Fock): the level n is the space of harmonics of degree n − 1 on S³, of dimension n² = Σ(2ℓ+1); two semiclassical ellipses of one level are great circles of that S³, and they link',`dims ${dims.join(', ')} · residuals ${A.res.toExponential(1)}, ${B.res.toExponential(1)}`); }
/* 8 the closed cosmos */
{ const flat=K.tqCosmos(0.0007,67.66), c1=K.tqCosmos(-0.0031,67.66), c2=K.tqCosmos(-0.044,67.4), share=K.tqCosmos(-1,1).observedShare;
  ok(!flat.closed&&c1.closed&&Math.abs(c1.RGly-c1.cHGly/Math.sqrt(0.0031))<1e-9&&c1.RGly>250&&c2.RGly>60&&c2.RGly<80&&Math.abs(c2.fibreGly-2*Math.PI*c2.RGly)<1e-9,'the closed universe: R = (c/H₀)/√(−Ω_k) — the Planck 2018 combined Ω_k = 0.0007 ± 0.0019 is flat-compatible and bounds a closed R above ≈ 260 Gly at 2σ; Planck alone (Ω_k = −0.044) would mean R ≈ 69 Gly',`c/H₀ ${c1.cHGly.toFixed(3)} Gly · R(−0.0031) ${c1.RGly.toFixed(0)} Gly, observed share ${(c1.observedShare*100).toFixed(2)} % · R(−0.044) ${c2.RGly.toFixed(1)} Gly, Hopf circle ${c2.fibreGly.toFixed(0)} Gly, observed ${(c2.observedShare*100).toFixed(1)} %`); }
console.log(`${pass} passed, ${fail} failed`); process.exit(fail?1:0);
