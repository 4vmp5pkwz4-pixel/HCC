#!/usr/bin/env node
'use strict';
/* Independent arithmetic tests for a RESEARCH model, not proof of CEF gravity. */
const assert=require('node:assert/strict');
const path=require('node:path');
const {pathToFileURL}=require('node:url');
let count=0;
function check(name,fn){fn(); count++; console.log('PASS '+name)}
(async()=>{
  const F=await import(pathToFileURL(path.join(__dirname,'../core/research/cef-frontier.mjs')).href);
  const cmul=(a,b)=>[a[0]*b[0]-a[1]*b[1],a[0]*b[1]+a[1]*b[0]];
  const cadd=(a,b)=>[a[0]+b[0],a[1]+b[1]];
  const matmul=(A,B)=>A.map((row,i)=>row.map((_,j)=>row.reduce((s,a,k)=>cadd(s,cmul(a,B[k][j])),[0,0])));
  const adj=(A)=>A.map((row,i)=>row.map((_,j)=>[A[j][i][0],-A[j][i][1]]));
  const dist=(a,b)=>Math.hypot(a[0]-b[0],a[1]-b[1]);
  check('independent U/V matrix multiplication and Bott trace-log n=4,5,8,12',()=>{
    for(const n of [4,5,8,12]){
      const U=Array.from({length:n},(_,i)=>Array.from({length:n},(_,j)=>i===j?[Math.cos(2*Math.PI*i/n),Math.sin(2*Math.PI*i/n)]:[0,0]));
      const V=Array.from({length:n},(_,i)=>Array.from({length:n},(_,j)=>i===(j+1)%n?[1,0]:[0,0]));
      const UV=matmul(U,V),VU=matmul(V,U);
      const W=matmul(matmul(matmul(U,V),adj(U)),adj(V));
      let frobenius=0, winding=0;
      for(let i=0;i<n;i++) for(let j=0;j<n;j++){
        const w=W[i][j],desired=i===j?[Math.cos(2*Math.PI/n),Math.sin(2*Math.PI/n)]:[0,0];
        assert.ok(dist(w,desired)<1e-12);
        frobenius+=dist(UV[i][j],VU[i][j])**2;
        if(i===j)winding+=Math.atan2(w[1],w[0])/(2*Math.PI);
      }
      const cert=F.clockShiftCertificate(n);
      assert.ok(Math.abs(Math.sqrt(frobenius/n)-cert.commutatorNorm)<1e-12);
      assert.ok(Math.abs(winding-1)<1e-12);
      assert.equal(cert.bottIndex,1);
      assert.ok(cert.spectralAvoidanceMargin>0);
    }
  });
  check('universal 1/8 quantitative obstruction n>=4',()=>{
    for(const n of [4,5,10,100,10000]){
      const x=F.clockShiftCertificate(n);
      assert.ok(x.commutatorNorm<=Math.SQRT2+1e-14);
      assert.ok(x.commutatorNorm+4/8<2);
      assert.equal(x.maxApproximationDistanceLowerBound,1/8);
    }
  });
  check('Weyl cocycle tensor obstruction and 2π trivial case',()=>{
    assert.equal(F.weylTensorObstruction(Math.PI).forbidsIndependentTensorFactors,true);
    assert.equal(F.weylTensorObstruction(0).forbidsIndependentTensorFactors,false);
    assert.equal(F.weylTensorObstruction(2*Math.PI).forbidsIndependentTensorFactors,false);
    assert.ok(Math.abs(F.weylTensorObstruction(Math.PI).cocycleDistanceFromOne-2)<1e-14);
  });
  check('2x2 normal-state centralizer toy never scalar',()=>{
    for(const p of [.1,.3,.5,.9]){
      const x=F.toyCentralizer(p);
      assert.equal(x.scalarCentralizer,false);
      assert.equal(x.centralizerComplexDimension,p===.5?4:2);
    }
  });
  check('selector finite differences, including negative Hessian',()=>{
    const qStar=100,nu=.5;
    for(const q of [.25,1,2,4,10]){
      const h=q*1e-4;
      const x=F.selectorLocal(q,qStar,nu);
      const left=F.selectorLocal(q-h,qStar,nu).value;
      const right=F.selectorLocal(q+h,qStar,nu).value;
      const deriv=(right-left)/(2*h);
      assert.ok(Math.abs(x.derivative-deriv)<1e-6,`q=${q}`);
    }
    assert.equal(F.selectorLocal(.25,qStar,nu).hessian,-4);
    assert.ok(F.selectorLocal(1,qStar,nu).hessian>0);
    assert.ok(F.selectorLocal(qStar,qStar,nu).derivative>0);
  });
  check('one-loop UV sensitivity and local non-identifiability',()=>{
    const g=.559754586,xi=.99916928,eps=.01;
    const x=F.couplingSensitivity(g,xi,eps);
    const beta=16*Math.PI*Math.PI/g;
    const lnQ1=Math.log(xi)+beta,lnQ2=Math.log(xi)+16*Math.PI*Math.PI/(g*(1+eps));
    assert.ok(Math.abs(x.logLambdaRatio-(lnQ1-lnQ2))<1e-10);
    assert.ok(x.elasticityOfLambdaToG>280 && x.elasticityOfLambdaToG<285);
    assert.ok(x.maxPositiveCouplingChangeForOnePercentLambda<.00004);
    const compensatedLogXi=Math.log(xi)+x.finiteDifferenceCompensationLogXi;
    assert.ok(Math.abs(compensatedLogXi+beta/(1+eps)-lnQ1)<1e-10);
  });
  check('numerical precision cannot test discrete unit counts at astronomical q',()=>{
    const qStar=3.307251460713979e122;
    assert.equal(qStar+1,qStar);
    const ulp=Math.pow(2,Math.floor(Math.log2(qStar))-52);
    assert.ok(ulp>1e100);
  });
  check('Hopf S3 bulk 3-form recovers S2 Chern integer under independent quadrature',()=>{
    const t16=F.hopfFiberTransgression(16);
    const t64=F.hopfFiberTransgression(64);
    const t256=F.hopfFiberTransgression(256);
    assert.equal(t256.firstChernOnBase,1);
    assert.equal(t256.firstChernOnTotalSpace,0);
    assert.equal(t256.exactNormalizedBulkHopf,1);
    assert.ok(t256.quadratureError<t64.quadratureError);
    assert.ok(t64.quadratureError<t16.quadratureError);
    assert.ok(t256.quadratureError<1e-5);
    assert.ok(Math.abs(t256.normalizedBulkIntegral-4*Math.PI*Math.PI)<4e-4);
  });
  check('research provenance never claims full physical bridge',()=>{
    assert.equal(F.FRONTIER_RESEARCH_CONTRACT.independentPhysicalBridgeProved,false);
    assert.equal(F.FRONTIER_RESEARCH_CONTRACT.establishedWorldNovelty,false);
  });
  console.log('\n'+count+'/'+count+' checks passed · mathematical model and its scope only');
})().catch(e=>{console.error('FAIL '+(e.stack||e));process.exitCode=1});
