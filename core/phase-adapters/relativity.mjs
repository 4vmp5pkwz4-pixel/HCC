import { definePhaseSpace, defineInvariant, defineProjection } from '../phase/contract.mjs';
import { phaseRefusal } from '../phase/refusals.mjs';
import { REL_S, relGamma, relBoostPts } from '../atlas/extracted.mjs';

function validBeta(beta){ return Number.isFinite(beta)&&Math.abs(beta)<1; }
function boost(pts,beta){
  if(!validBeta(beta)) return phaseRefusal('OUT_OF_DOMAIN','Lorentz boost requires finite |beta| < 1',{beta,domain:'|beta| < 1'});
  if(!Array.isArray(pts)||pts.some(p=>!Array.isArray(p)||p.length!==2||p.some(x=>!Number.isFinite(x))))
    return phaseRefusal('INVALID_STATE','boost events must be finite [t,x] pairs',{pts});
  return relBoostPts(pts,beta);
}
function boost4(pts,beta){
  if(!validBeta(beta)) return phaseRefusal('OUT_OF_DOMAIN','Lorentz boost requires finite |beta| < 1',{beta,domain:'|beta| < 1'});
  if(!Array.isArray(pts)||pts.some(p=>!Array.isArray(p)||p.length!==4||p.some(x=>!Number.isFinite(x))))
    return phaseRefusal('INVALID_STATE','native Minkowski events must be finite [t,x,y,z] quadruples',{pts});
  const tx=relBoostPts(pts.map(([t,x])=>[t,x]),beta);
  return pts.map((p,i)=>[tx[i][0],tx[i][1],p[2],p[3]]);
}
function transform4(pts,beta,{source_frame,target_frame}={}){
  if(typeof source_frame!=='string'||!source_frame||typeof target_frame!=='string'||!target_frame)
    return phaseRefusal('MISSING_FRAME','Lorentz transformation requires explicit source_frame and target_frame');
  const events=boost4(pts,beta); if(events?.status==='REFUSED') return events;
  return Object.freeze({events,beta,gamma:relGamma(beta),frame:Object.freeze({source:source_frame,target:target_frame,boost_axis:'x'})});
}

export function relativityPhaseAdapter(){return definePhaseSpace({
  id:'rel',title:'Special Relativity Laboratory',
  carrier:{kind:'Minkowski-3+1',dimension:4,compact:false,signature:'+---'},
  coordinates:[
    {id:'t',type:'number',role:'native',quantity_kind:'spacetime-time-coordinate',unit:'c-normalized',dimension:'L'},
    {id:'x',type:'number',role:'native',quantity_kind:'spacetime-space-coordinate',unit:'c-normalized',dimension:'L'},
    {id:'y',type:'number',role:'native',quantity_kind:'spacetime-space-coordinate',unit:'c-normalized',dimension:'L'},
    {id:'z',type:'number',role:'native',quantity_kind:'spacetime-space-coordinate',unit:'c-normalized',dimension:'L'},
    {id:'beta',type:'number',role:'auxiliary',quantity_kind:'boost-velocity-over-c',unit:null,dimension:'1'}
  ],
  time:{kind:'spacetime-coordinate',unit:'c-normalized',frame_dependent:true,frame_required:true,global_time_map:null},
  dynamics:{kind:'static-transformation-family',group:'SO+(1,3)',implemented_family:'proper orthochronous x-directed boosts'},
  geometry:[{kind:'Minkowski-metric'},{kind:'causal-structure'}],constraints:[],
  invariants:[defineInvariant({
    id:'minkowski_interval',kind:'exact',quantity_kind:'spacetime-interval-squared',unit:'c-normalized^2',dimension:'L^2',
    evaluator:s=>s.t*s.t-s.x*s.x-s.y*s.y-s.z*s.z,coordinates:['t','x','y','z'],status:'exact Lorentz invariant',
    provenance:'x-boost delegates (t,x) to core/atlas/extracted.mjs: relBoostPts; y,z are transverse identities'
  })],
  projections:[defineProjection({id:'rel_display_2p1',kind:'display-only',from:'Minkowski-3+1',to:'rendered 2+1 spacetime slice',scientific_eligible:false})],
  domain:{beta:{min:-1,max:1,open:true},assumptions:['special relativity in native 3+1 coordinates','current authoritative numeric boost kernel is the x-directed 1+1 block; transverse y,z coordinates are unchanged']},
  epistemic:{status:'derived',caveat:'Lorentz-frame time is not promoted to universal Atlas time; the rendered 2+1 scene is a display projection, not the native 3+1 state.'},
  metadata:{frames:{required:true,default:null},native_dimension:'3+1',display_dimension:'2+1'},
  adapter:Object.freeze({scale:REL_S,gamma:relGamma,boostKernel:relBoostPts,boost,boost4,transform4})
});}
