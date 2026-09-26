import test from 'node:test';
import assert from 'node:assert/strict';
import { definePhaseBridge, evaluatePhaseBridge } from '../core/phase/index.mjs';
import { contactActionPhaseAdapter } from '../core/phase-adapters/contact-action.mjs';
import { actContactResidual, actReebPath, actLegendrianPath, actAlpha } from '../core/atlas/extracted.mjs';

test('Reeb/contact normalization uses native contact residual kernel',()=>{
  const c=contactActionPhaseAdapter();
  assert.equal(c.adapter.contactResidual,actContactResidual);
  const r=c.adapter.contactResidual([1,0,0,0]);
  assert.ok(r.norm<1e-15); assert.ok(r.alphaR<1e-15); assert.ok(r.contraction<1e-15);
});

test('Reeb paths remain on S3 and close',()=>{
  const c=contactActionPhaseAdapter(); assert.equal(c.adapter.reebPath,actReebPath);
  const P=c.adapter.reebPath(.63,.27,128);
  for(const u of P) assert.ok(Math.abs(u.reduce((s,x)=>s+x*x,0)-1)<1e-12);
  assert.ok(Math.hypot(...P[0].map((x,i)=>x-P.at(-1)[i]))<1e-12);
});

test('Legendrian torus-knot path satisfies alpha(tangent)=0 numerically',()=>{
  const c=contactActionPhaseAdapter(); assert.equal(c.adapter.legendrianPath,actLegendrianPath);
  const P=c.adapter.legendrianPath(2,3,.1,2400); let worst=0;
  for(let i=1;i<P.length-1;i+=37){const v=P[i+1].map((x,j)=>(x-P[i-1][j])/2);worst=Math.max(worst,Math.abs(actAlpha(P[i],v)));}
  assert.ok(worst<1e-6,`Legendrian alpha residual ${worst}`);
});

test('contact-only geometry refuses a symplectic-preservation request',()=>{
  const a=contactActionPhaseAdapter(), b=contactActionPhaseAdapter();
  const bridge=definePhaseBridge({id:'bad',source:'act',target:'act',status:'STRUCTURAL_ANALOGY',preserve_geometry:'symplectic',structure_verifier:()=>true});
  const r=evaluatePhaseBridge(bridge,a,b,{});
  assert.equal(r.status,'REFUSED'); assert.equal(r.code,'MISSING_GEOMETRY');
});

test('metaplectic double-cover return keeps representation status and cross-domain analogy',()=>{
  const m=contactActionPhaseAdapter().metadata.metaplectic_double_cover;
  assert.equal(m.two_pi,-1);
  assert.equal(m.four_pi,1);
  assert.equal(m.status,'representation');
  assert.equal(m.cross_domain_status,'analogy');
});
