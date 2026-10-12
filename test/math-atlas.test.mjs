import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const kernel=()=>import('../core/math/s3-cap-observability.mjs');
const near=(a,b,t=2e-12)=>assert.ok(Math.abs(a-b)<t,`${a} != ${b}`);

test('the radial restriction Gram matches independent quadrature',async()=>{
 const m=await kernel(),chi=.83,L=4,G=m.radialGram(L,chi);
 const steps=6000,h=chi/steps;
 for(let n=0;n<=L;n++)for(let j=0;j<=L;j++){
  let integral=0;for(let i=0;i<=steps;i++)integral+=(i===0||i===steps?1:i%2?4:2)*Math.sin((n+1)*i*h)*Math.sin((j+1)*i*h);
  near(G[n][j],2*integral*h/(3*Math.PI),1e-11);
 }
});
test('full S3 restriction is the identity and scalar multiplicity sums correctly',async()=>{
 const m=await kernel();for(let L=0;L<9;L++){
  const r=m.capObservability({L,chi:Math.PI});
  assert.equal(r.mode_count,Array.from({length:L+1},(_,n)=>(n+1)**2).reduce((a,b)=>a+b,0));
  near(r.volume_fraction,1);near(r.witness_concentration,1);near(r.log10_inverse_gain_lower_bound,0);
  r.radial_gram.forEach((row,n)=>row.forEach((v,j)=>near(v,Number(n===j))));
 }
});
test('the witness integral agrees with independent angular quadrature',async()=>{
 const m=await kernel();const simpson=(f,b)=>{const N=12000,h=b/N;let s=f(0)+f(b);for(let i=1;i<N;i++)s+=(i%2?4:2)*f(i*h);return s*h/3;};
 for(const L of [0,1,3,7])for(const chi of [.1,.8,Math.PI/2,2.7]){
  const f=t=>(1-Math.cos(t))**(2*L)*Math.sin(t)**2;
  const expected=simpson(f,chi)/simpson(f,Math.PI);
  const r=m.capObservability({L,chi});
  near(r.log10_witness_concentration,Math.log10(expected),2e-8);
  if(L===0)near(r.witness_concentration,r.volume_fraction);
 }
});
test('small apertures keep a finite logarithmic bound without inventing eigenvalues',async()=>{
 const m=await kernel(),a=m.capObservability({L:24,chi:1e-6}),b=m.capObservability({L:24,chi:2e-6});
 assert.ok(Number.isFinite(a.log10_inverse_gain_lower_bound));assert.ok(a.log10_inverse_gain_lower_bound>200);
 near(b.log10_witness_concentration-a.log10_witness_concentration,99*Math.log10(2),1e-8);
 assert.equal(a.witness_concentration,null);assert.equal(a.empirical_validation,false);assert.equal(a.topology_detected,false);
 for(const input of [{L:-1,chi:1},{L:1.5,chi:1},{L:49,chi:1},{L:2,chi:0},{L:2,chi:Math.PI+.01},{L:2,chi:NaN}])assert.throws(()=>m.capObservability(input),RangeError);
});
test('logarithmic bounds survive underflow of the aperture square and volume',async()=>{
 const m=await kernel();
 for(const L of [0,6,48])for(const chi of [1e-110,1e-162,1e-200,Number.MIN_VALUE]){
  const r=m.capObservability({L,chi,includeGram:false});
  assert.ok(Number.isFinite(r.log10_witness_concentration));
  assert.ok(Number.isFinite(r.log10_volume_fraction));
  assert.ok(Number.isFinite(r.log10_inverse_gain_lower_bound));
  assert.ok(Number.isFinite(r.log10_condition_number_lower_bound));
  assert.equal(r.witness_concentration,null);assert.equal(r.volume_fraction,null);
  near(r.log10_volume_fraction,3*Math.log10(chi)+Math.log10(2/(3*Math.PI)),1e-10);
  if(L===0)near(r.log10_condition_number_lower_bound,0,1e-10);
  else assert.ok(r.log10_condition_number_lower_bound>1000);
 }
 for(const L of [0,6,48]){
  const a=m.capObservability({L,chi:1e-200,includeGram:false});
  const b=m.capObservability({L,chi:2e-200,includeGram:false});
  near(b.log10_witness_concentration-a.log10_witness_concentration,(4*L+3)*Math.log10(2),1e-10);
 }
});
test('catalog search finds companion manuscripts and distinguishes artifact coverage',async()=>{
 const {searchMathCatalog}=await import('../core/research/math-bridges.mjs');
 const c=JSON.parse(readFileSync(new URL('../api/math-catalog.json',import.meta.url)));
 assert.equal(c.families.length,372);assert.equal(c.families.reduce((n,f)=>n+f.papers.length,0),719);
 assert.ok(searchMathCatalog(c,{query:'Vlasov Maxwell'}).some(f=>f.id==='362'));
 assert.ok(searchMathCatalog(c,{query:'bounded recovery'}).some(f=>f.id==='290'));
 for(const id of ['260','264'])assert.deepEqual(searchMathCatalog(c,{query:id}).map(f=>f.id),[id]);
 for(const f of c.families)for(const p of f.papers){assert.ok(p.url.includes(c.source_commit));assert.equal(p.lean_verified_here,false);assert.equal(p.independently_verified_here,false);}
});
test('topic matches and catalog formalization never close a physical bridge',async()=>{
 const {bridgeVerdict}=await import('../core/research/math-bridges.mjs');
 assert.equal(bridgeVerdict({bridge:'method',leanArtifact:true}).closed,false);
 assert.equal(bridgeVerdict({bridge:'direct',leanArtifact:true,claimedClosed:true}).closed,false);
 const c=JSON.parse(readFileSync(new URL('../api/math-bridges.json',import.meta.url)));
 for(const b of c.bridges){assert.equal(bridgeVerdict(b).closed,false);assert.ok(b.hypotheses.length);assert.ok(b.notClosed);assert.ok(c.gates.some(g=>g.id===b.gate));}
});
