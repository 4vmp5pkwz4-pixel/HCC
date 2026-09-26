import test from 'node:test';
import assert from 'node:assert/strict';
import { definePhaseBridge, evaluatePhaseBridge } from '../core/phase/index.mjs';
import { relativityPhaseAdapter } from '../core/phase-adapters/relativity.mjs';
import { relBoostPts, relGamma } from '../core/atlas/extracted.mjs';

const interval=p=>p[0]**2-p[1]**2-p[2]**2-p[3]**2;
function det4(A){
  A=A.map(r=>r.slice()); let d=1;
  for(let i=0;i<4;i++){let p=i;for(let r=i+1;r<4;r++)if(Math.abs(A[r][i])>Math.abs(A[p][i]))p=r;if(Math.abs(A[p][i])<1e-14)return 0;if(p!==i){[A[p],A[i]]=[A[i],A[p]];d=-d;}const q=A[i][i];d*=q;for(let r=i+1;r<4;r++){const f=A[r][i]/q;for(let c=i;c<4;c++)A[r][c]-=f*A[i][c];}}return d;
}

test('Lorentz adapter delegates the tx block to the authoritative boost kernel',()=>{
  const c=relativityPhaseAdapter();
  assert.equal(c.adapter.boostKernel,relBoostPts); assert.equal(c.adapter.gamma,relGamma);
  const pts=[[2,.7],[1.5,-.4],[0.2,.1]], beta=.73, out=c.adapter.boost(pts,beta);
  assert.deepEqual(out,relBoostPts(pts,beta));
});

test('native 3+1 boost preserves timelike null and spacelike intervals',()=>{
  const c=relativityPhaseAdapter();
  assert.equal(c.carrier.kind,'Minkowski-3+1');
  assert.deepEqual(c.coordinates.filter(x=>x.role==='native').map(x=>x.id),['t','x','y','z']);
  const pts=[[2,.7,.3,-.2],[1,1,0,0],[.2,1.1,.4,0]], out=c.adapter.boost4(pts,.61);
  for(let i=0;i<pts.length;i++) assert.ok(Math.abs(interval(pts[i])-interval(out[i]))<1e-12);
  assert.ok(interval(pts[0])>0); assert.ok(Math.abs(interval(pts[1]))<1e-14); assert.ok(interval(pts[2])<0);
});

test('x boost is proper orthochronous and transform carries explicit frame metadata',()=>{
  const c=relativityPhaseAdapter(), basis=[[1,0,0,0],[0,1,0,0],[0,0,1,0],[0,0,0,1]];
  const cols=c.adapter.boost4(basis,.42), M=Array.from({length:4},(_,r)=>cols.map(col=>col[r]));
  assert.ok(Math.abs(det4(M)-1)<1e-12);
  assert.ok(cols[0][0]>0);
  const tr=c.adapter.transform4([[1,0,0,0]],.42,{source_frame:'S',target_frame:"S'"});
  assert.deepEqual(tr.frame,{source:'S',target:"S'",boost_axis:'x'});
  assert.equal(c.time.frame_required,true);
});

test('beta at or beyond light speed is refused rather than clamped',()=>{
  const c=relativityPhaseAdapter();
  for(const beta of [-1,1,1.1,-2]){const r=c.adapter.boost4([[1,0,0,0]],beta);assert.equal(r.status,'REFUSED');assert.equal(r.code,'OUT_OF_DOMAIN');}
});

test('rendered 2+1 spacetime is display-only and cannot support a scientific phase bridge',()=>{
  const c=relativityPhaseAdapter(), p=c.projections.find(x=>x.id==='rel_display_2p1');
  assert.equal(p.scientific_eligible,false);
  const bridge=definePhaseBridge({id:'display',source:'rel',target:'rel',status:'STRUCTURAL_ANALOGY',map_kind:'projection',projection_id:p.id});
  const r=evaluatePhaseBridge(bridge,c,c,{});
  assert.equal(r.status,'REFUSED'); assert.equal(r.code,'DISPLAY_ONLY_BRIDGE');
});

test('time is frame dependent and has no implicit Atlas global-time map',()=>{
  const c=relativityPhaseAdapter();
  assert.equal(c.time.kind,'spacetime-coordinate'); assert.equal(c.time.global_time_map,null);
  assert.equal(c.dynamics.kind,'static-transformation-family'); assert.equal(c.dynamics.group,'SO+(1,3)');
});
