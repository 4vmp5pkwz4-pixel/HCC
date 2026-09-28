import { UNDECLARED, assertFiniteNativeState } from './contract.mjs';
import { phaseRefusal } from './refusals.mjs';

export const PHASE_BRIDGE_STATUSES=Object.freeze(['EXACT_MAP','NUMERICALLY_VERIFIED_MAP','CONDITIONAL_MAP','STRUCTURAL_ANALOGY','CANDIDATE_BRIDGE','REFUSED']);

function deepFreeze(v){ if(!v||typeof v!=='object'||Object.isFrozen(v)) return v; for(const x of Object.values(v)) deepFreeze(x); return Object.freeze(v); }
function needString(v,name){ if(typeof v!=='string'||!v.trim()) throw new TypeError(`${name} is required`); return v.trim(); }

export function definePhaseBridge(spec){
  if(!spec||typeof spec!=='object'||Array.isArray(spec)) throw new TypeError('phase bridge must be an object');
  const id=needString(spec.id,'phase bridge id'), source=needString(spec.source,'phase bridge source'), target=needString(spec.target,'phase bridge target');
  if(!PHASE_BRIDGE_STATUSES.includes(spec.status)) throw new TypeError(`phase bridge "${id}" has invalid status`);
  return deepFreeze({...spec,id,source,target,invariant_maps:[...(spec.invariant_maps||[])]});
}

const timeKind=c=>typeof c.time==='object'&&c.time?c.time.kind??UNDECLARED:c.time;
const geometryKinds=c=>{
  if(!c.geometry||c.geometry===UNDECLARED) return [];
  const xs=Array.isArray(c.geometry)?c.geometry:[c.geometry];
  return xs.map(x=>typeof x==='string'?x:x?.kind).filter(Boolean);
};
function inv(c,id){ return (c.invariants||[]).find(x=>x.id===id)||null; }
function displayProjection(c,id){ return (c.projections||[]).find(p=>p.id===id&&p.scientific_eligible===false)||null; }
function validState(c,s){ const r=assertFiniteNativeState(c,s); return r?.status==='REFUSED'?r:null; }

export function evaluatePhaseBridge(bridge,sourceContract,targetContract,sample={}){
  if(!bridge||!sourceContract||!targetContract) return phaseRefusal('INVALID_BRIDGE_INPUT','bridge and both phase contracts are required');
  if(bridge.source!==sourceContract.id||bridge.target!==targetContract.id)
    return phaseRefusal('BRIDGE_ENDPOINT_MISMATCH','bridge endpoints do not match supplied phase contracts',{bridge:{source:bridge.source,target:bridge.target},supplied:{source:sourceContract.id,target:targetContract.id}});
  if(bridge.status==='REFUSED') return phaseRefusal('DECLARED_REFUSAL',bridge.reason||'this bridge is explicitly refused',{bridge_id:bridge.id});

  if(bridge.map_kind==='projection'&&bridge.projection_id&&displayProjection(sourceContract,bridge.projection_id))
    return phaseRefusal('DISPLAY_ONLY_BRIDGE',`projection "${bridge.projection_id}" is display-only and cannot define a scientific bridge`,{projection_id:bridge.projection_id});

  for(const m of bridge.invariant_maps||[]){
    const a=inv(sourceContract,m.source), b=inv(targetContract,m.target);
    if(!a||!b) return phaseRefusal('UNKNOWN_BRIDGE_INVARIANT','bridge names an invariant absent from one side',{source:m.source,target:m.target});
    if(a.dimension!==UNDECLARED&&b.dimension!==UNDECLARED&&a.dimension!==b.dimension)
      return phaseRefusal('INCOMPATIBLE_DIMENSION',`invariant dimensions differ: ${a.dimension} versus ${b.dimension}`,{source:a.dimension,target:b.dimension});
    if(a.unit!=null&&b.unit!=null&&a.unit!==b.unit&&!m.unit_map)
      return phaseRefusal('INCOMPATIBLE_UNIT',`invariant units differ without an explicit unit map: ${a.unit} versus ${b.unit}`,{source:a.unit,target:b.unit});
  }

  const sk=timeKind(sourceContract), tk=timeKind(targetContract), timeCheck={source_kind:sk,target_kind:tk,pass:true};
  if(sk!==UNDECLARED&&tk!==UNDECLARED&&sk!==tk){
    if(typeof bridge.time_map!=='function') return phaseRefusal('TIME_SEMANTICS_MISMATCH',`time semantics differ: ${sk} versus ${tk}; no time map is declared`,{source:sk,target:tk});
    if(sample.sourceTime!==undefined){
      const mapped=bridge.time_map(sample.sourceTime); timeCheck.mapped=mapped;
      if(!Number.isFinite(mapped)) return phaseRefusal('INVALID_TIME_MAP','declared time map returned a non-finite value',{mapped});
      if(sample.targetTime!==undefined){
        const tol=Number(bridge.time_tolerance??1e-12), residual=Math.abs(mapped-sample.targetTime); timeCheck.target=sample.targetTime; timeCheck.residual=residual; timeCheck.pass=residual<=tol;
        if(!timeCheck.pass) return phaseRefusal('TIME_MAP_FAILED','declared time reparameterization does not match the supplied target time',{mapped,target:sample.targetTime,residual,tolerance:tol});
      }
    }
  }

  if(bridge.preserve_geometry){
    const sg=geometryKinds(sourceContract), tg=geometryKinds(targetContract);
    if(!sg.includes(bridge.preserve_geometry)||!tg.includes(bridge.preserve_geometry))
      return phaseRefusal('MISSING_GEOMETRY',`geometry "${bridge.preserve_geometry}" is not declared on both sides`,{source:sg,target:tg});
    if(typeof bridge.structure_verifier!=='function')
      return phaseRefusal('MISSING_STRUCTURE_VERIFIER',`geometry preservation was requested without a verifier`,{geometry:bridge.preserve_geometry});
  }

  let targetState=sample.targetState;
  if(sample.sourceState!==undefined){
    const bad=validState(sourceContract,sample.sourceState); if(bad) return bad;
    if(typeof bridge.map==='function') targetState=bridge.map(sample.sourceState);
    else if((bridge.invariant_maps||[]).length) return phaseRefusal('MISSING_STATE_MAP','an invariant pullback check requires an explicit state map',{bridge_id:bridge.id});
  }
  if(targetState!==undefined){ const bad=validState(targetContract,targetState); if(bad) return bad; }

  const invariantChecks=[];
  for(const m of bridge.invariant_maps||[]){
    if(sample.sourceState===undefined||targetState===undefined) return phaseRefusal('MISSING_SAMPLE','bridge invariant check requires source and mapped target state',{bridge_id:bridge.id});
    const a=inv(sourceContract,m.source), b=inv(targetContract,m.target);
    if(typeof a.evaluator!=='function'||typeof b.evaluator!=='function') return phaseRefusal('MISSING_INVARIANT_EVALUATOR','bridge invariant check requires evaluators',{source:m.source,target:m.target});
    const av=a.evaluator(sample.sourceState), bv=b.evaluator(targetState), mapped=typeof m.value_map==='function'?m.value_map(av):av;
    const residual=Math.abs(Number(mapped)-Number(bv)), tolerance=Number(m.tolerance??a.tolerance??b.tolerance??0), pass=Number.isFinite(residual)&&residual<=tolerance;
    invariantChecks.push(Object.freeze({source:m.source,target:m.target,source_value:av,target_value:bv,mapped_source_value:mapped,residual,tolerance,pass}));
    if(!pass) return phaseRefusal('INVARIANT_PULLBACK_FAILED',`bridge "${bridge.id}" does not preserve invariant ${m.source}→${m.target}`,{residual,tolerance,source_value:av,target_value:bv});
  }

  let structure=null;
  if(bridge.preserve_geometry){
    const out=bridge.structure_verifier({source:sourceContract,target:targetContract,sourceState:sample.sourceState,targetState,bridge});
    const pass=out===true||out?.pass===true;
    if(!pass) return phaseRefusal('STRUCTURE_PRESERVATION_FAILED',`bridge "${bridge.id}" failed its ${bridge.preserve_geometry} structure verifier`,{result:out});
    structure=typeof out==='object'?out:{pass:true};
  }

  return deepFreeze({schema:'hcc.phase-bridge-report/1',bridge_id:bridge.id,status:bridge.status,source:bridge.source,target:bridge.target,
    checks:{time:timeCheck,invariants:invariantChecks,structure},target_state:targetState??null,assumptions:[...(bridge.assumptions||[])]});
}
