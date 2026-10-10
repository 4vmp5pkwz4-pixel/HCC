import test from 'node:test';
import assert from 'node:assert/strict';
import {phiHopfProtocol,fibonacciCounts} from '../core/research/phi-hopf-fibonacci.mjs';
test('Fibonacci substitution counts',()=>{
 assert.deepEqual(fibonacciCounts(1),{level:1,length:2,A:1,B:1});
 assert.deepEqual(fibonacciCounts(6),{level:6,length:21,A:13,B:8});
});
test('fricke/excess-action variance bridge',()=>{
 for(let n=1;n<=15;n++)for(const a of [.2,1,2.5])for(const b of [.3,1,3]){
  const x=phiHopfProtocol({n,omegaA:a,omegaB:b});
  assert.ok(Math.abs(x.bridgeResidual)<2e-12);
  assert.ok(x.tempoDispersionRatio>=1-1e-12);
 }
});
test('Fibonacci proportions converge to golden mean',()=>{
 const x=phiHopfProtocol({n:30});
 assert.ok(Math.abs(x.fractionA-1/x.phi)<1e-12);
});
test('invalid parameters are rejected',()=>{
 assert.throws(()=>phiHopfProtocol({nu:0}),RangeError);
 assert.throws(()=>phiHopfProtocol({omegaA:-3}),RangeError);
 assert.throws(()=>fibonacciCounts(0),RangeError);
});
