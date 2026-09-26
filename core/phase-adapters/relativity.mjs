import { definePhaseSpace, defineInvariant } from '../phase/contract.mjs';
import { phaseRefusal } from '../phase/refusals.mjs';
import { REL_S, relGamma, relBoostPts } from '../atlas/extracted.mjs';

function boost(pts,beta){
  if(!Number.isFinite(beta)||Math.abs(beta)>=1) return phaseRefusal('OUT_OF_DOMAIN','Lorentz boost requires finite |beta| < 1',{beta,domain:'|beta| < 1'});
  if(!Array.isArray(pts)||pts.some(p=>!Array.isArray(p)||p.length!==2||p.some(x=>!Number.isFinite(x))))
    return phaseRefusal('INVALID_STATE','boost events must be finite [t,x] pairs',{pts});
  return relBoostPts(pts,beta);
}

export function relativityPhaseAdapter(){
  return definePhaseSpace({
    id:'rel',
    title:'Special Relativity Laboratory',
    carrier:{kind:'Minkowski-1+1',dimension:2,compact:false,signature:'+ -'},
    coordinates:[
      {id:'t',type:'number',role:'native',quantity_kind:'spacetime-time-coordinate',unit:'c-normalized',dimension:'L'},
      {id:'x',type:'number',role:'native',quantity_kind:'spacetime-space-coordinate',unit:'c-normalized',dimension:'L'},
      {id:'beta',type:'number',role:'auxiliary',quantity_kind:'boost-velocity-over-c',unit:null,dimension:'1'}
    ],
    time:{kind:'spacetime-coordinate',unit:'c-normalized',frame_dependent:true,global_time_map:null},
    dynamics:{kind:'static-transformation-family',group:'SO+(1,1)'},
    geometry:[{kind:'Minkowski-metric'},{kind:'causal-structure'}],
    constraints:[],
    invariants:[defineInvariant({
      id:'minkowski_interval',kind:'exact',quantity_kind:'spacetime-interval-squared',unit:'c-normalized^2',dimension:'L^2',
      evaluator:s=>s.t*s.t-s.x*s.x,coordinates:['t','x'],status:'exact Lorentz invariant',provenance:'core/atlas/extracted.mjs: relBoostPts'
    })],
    projections:[],
    domain:{beta:{min:-1,max:1,open:true},assumptions:['special relativity in 1+1 displayed boost sector']},
    epistemic:{status:'derived',caveat:'Lorentz-frame time is not promoted to a universal atlas time.'},
    adapter:Object.freeze({scale:REL_S,gamma:relGamma,boostKernel:relBoostPts,boost})
  });
}
