import { phaseFingerprint } from './fingerprint.mjs';
import { UNDECLARED } from './contract.mjs';

const labOf = x => String(x || '').split('.')[0];
const pairKey = (a,b) => a < b ? `${a}|${b}` : `${b}|${a}`;

function intervalOf(space){
  const x=space.domain;
  if (!x || x===UNDECLARED || !Array.isArray(x.interval) || x.interval.length!==2) return null;
  const a=Number(x.interval[0]), b=Number(x.interval[1]);
  return Number.isFinite(a)&&Number.isFinite(b) ? [Math.min(a,b),Math.max(a,b)] : null;
}
function domainsOverlap(a,b){
  const A=intervalOf(a), B=intervalOf(b); if(!A||!B) return true;
  return Math.max(A[0],B[0]) <= Math.min(A[1],B[1]);
}
function incompatibleDimensions(a,b){
  const byQ=new Map();
  for(const i of a.invariants||[]) if(i.quantity_kind && i.quantity_kind!==UNDECLARED) byQ.set(i.quantity_kind,i.dimension);
  for(const j of b.invariants||[]){
    if(!byQ.has(j.quantity_kind)) continue;
    const d=byQ.get(j.quantity_kind);
    if(d!==UNDECLARED && j.dimension!==UNDECLARED && d!==j.dimension) return true;
  }
  return false;
}
function intersection(a,b){ const B=new Set(b); return [...new Set(a)].filter(x=>B.has(x)).sort(); }

export function discoverCandidateBridges({registry,nexusRelations=[],quantityRoutes=[]}={}){
  if(!registry || typeof registry.listSpaces!=='function') throw new TypeError('phase registry is required');
  const spaces=[...registry.listSpaces()].sort((a,b)=>a.id.localeCompare(b.id));
  const nexus=new Set((nexusRelations||[]).map(r=>pairKey(labOf(r.from),labOf(r.to))));
  const routes=new Set((quantityRoutes||[]).map(r=>pairKey(labOf(r.from),labOf(r.to))));
  const out=[];
  for(let i=0;i<spaces.length;i++) for(let j=i+1;j<spaces.length;j++){
    const a=spaces[i], b=spaces[j];
    if(incompatibleDimensions(a,b) || !domainsOverlap(a,b)) continue;
    const A=phaseFingerprint(a), B=phaseFingerprint(b), key=pairKey(a.id,b.id);
    const sharedInv=intersection(A.invariant_quantity_kinds,B.invariant_quantity_kinds);
    const sharedGeo=intersection(A.geometry_kinds,B.geometry_kinds);
    const time=A.time_kind!==UNDECLARED && A.time_kind===B.time_kind;
    const carrier=A.carrier_kind!==UNDECLARED && A.carrier_kind===B.carrier_kind;
    const terms=[
      {name:'shared_invariant_quantity_kinds',value:4*sharedInv.length,detail:sharedInv},
      {name:'shared_geometry_kinds',value:2*sharedGeo.length,detail:sharedGeo},
      {name:'compatible_time_semantics',value:time?1:0,detail:time?A.time_kind:null},
      {name:'shared_carrier_kind',value:carrier?1:0,detail:carrier?A.carrier_kind:null},
      {name:'existing_nexus_neighborhood',value:nexus.has(key)?2:0,detail:nexus.has(key)},
      {name:'existing_quantity_route',value:routes.has(key)?2:0,detail:routes.has(key)}
    ];
    const score=terms.reduce((s,t)=>s+t.value,0); if(score<=0) continue;
    const passed=[];
    if(sharedInv.length) passed.push('shared invariant quantity kind with compatible dimensions');
    if(sharedGeo.length) passed.push('shared declared geometry kind');
    if(time) passed.push('compatible declared time semantics');
    if(carrier) passed.push('shared declared carrier kind');
    if(nexus.has(key)) passed.push('existing Nexus neighborhood');
    if(routes.has(key)) passed.push('existing quantity route');
    out.push({id:`candidate:${a.id}->${b.id}`,source:a.id,target:b.id,status:'CANDIDATE_BRIDGE',noncanonical:true,review_required:true,
      score,terms,passed,unproven:['explicit state-space map','invariant pullback','flow compatibility','structure preservation'],
      motivated_by:terms.filter(t=>t.value>0).map(t=>t.name)});
  }
  out.sort((a,b)=>b.score-a.score || a.id.localeCompare(b.id));
  return Object.freeze(out.map((c,i)=>Object.freeze({...c,rank:i+1,terms:Object.freeze(c.terms.map(Object.freeze)),passed:Object.freeze(c.passed),unproven:Object.freeze(c.unproven),motivated_by:Object.freeze(c.motivated_by)})));
}
