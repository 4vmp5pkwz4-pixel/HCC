import test from 'node:test';
import assert from 'node:assert/strict';
import {closedBackground,distance,scalarShell,causalCapFraction,su2Character,masslessEnergyBalanceResidual,CLAIM_STATUS} from '../core/research/hcc-causal-spectral-v16.mjs';
test('HCC reference radius is conditional and maps to OmegaK',()=>{
 const b=closedBackground();
 assert.ok(Math.abs(b.omegaK+.0007)<1e-10);
 assert.equal(CLAIM_STATUS.cosmic_topology,'NOT_OBSERVED');
 const d=distance(.51,b);
 assert.ok(Math.abs(d.DM_over_rd-13.496)<.004);
});
test('retarded background distance and geometric cap',()=>{
 const b=closedBackground(),d=distance(1090,b);
 assert.ok(Math.abs(d.chi-.08249)<2e-5);
 assert.ok(causalCapFraction(d.chi)>0);
});
test('S3 scalar eigenvalues and SU2 projector recurrence',()=>{
 assert.deepEqual(scalarShell(2,1),{n:2,eigenvalue:8,multiplicity:9});
 for(let n=0;n<=15;n++)for(let i=1;i<=20;i++){
  const g=i*Math.PI/22;
  assert.ok(Math.abs(su2Character(n,Math.cos(g))-Math.sin((n+1)*g)/((n+1)*Math.sin(g)))<2e-12);
 }
});
test('physical work-minus-dissipation invariant is explicitly typed',()=>{
 assert.equal(masslessEnergyBalanceResidual({energy:3,initialEnergy:1,sourceWork:4,hubbleDissipation:2}),0);
 assert.throws(()=>closedBackground({radiusGly:-1}),RangeError);
});