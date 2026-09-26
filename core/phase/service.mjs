import { createPhaseRegistry } from './registry.mjs';
import { probeInvariant } from './invariant-probe.mjs';
import { evaluatePhaseBridge } from './bridges.mjs';
import { discoverCandidateBridges } from './candidates.mjs';
import { phaseRefusal } from './refusals.mjs';
import { INITIAL_PHASE_SPACES } from '../phase-adapters/index.mjs';

function notFound(id){
  throw Object.assign(new Error(`no phase-space laboratory "${id}"`),{code:'NOT_FOUND',detail:{lab_id:id}});
}
function jsonSafe(value){
  if(value===null||typeof value==='string'||typeof value==='number'||typeof value==='boolean') return value;
  if(Array.isArray(value)) return value.map(jsonSafe).filter(v=>v!==undefined);
  if(typeof value==='function'||value===undefined) return undefined;
  if(typeof value==='object'){
    const out={}; for(const [k,v] of Object.entries(value)){ if(k==='adapter'||k==='state_validator') continue; const q=jsonSafe(v);if(q!==undefined)out[k]=q;} return out;
  }
  return String(value);
}
const pairTouches=(b,a,z)=>!a&&!z||(!a||(b.source===a||b.target===a))&&(!z||(b.source===z||b.target===z));

export function createPhaseService({spaces=INITIAL_PHASE_SPACES,bridges=[],nexusRelations=[],quantityRoutes=[],identity={}}={}){
  const registry=createPhaseRegistry({spaces,bridges});
  const candidates=discoverCandidateBridges({registry,nexusRelations,quantityRoutes});
  const get=id=>registry.getSpace(id)||notFound(id);
  const service={
    describe(labId){ return get(labId); },
    probe(labId,invariantId,input={}){ return probeInvariant(get(labId),invariantId,input); },
    compare(labA,labB,input={}){
      const a=get(labA), b=get(labB);
      const matches=registry.listBridges({labA,labB}).filter(x=>(x.source===labA&&x.target===labB)||(x.source===labB&&x.target===labA));
      if(!matches.length) return phaseRefusal('NO_REGISTERED_BRIDGE',`no canonical phase bridge is registered between "${labA}" and "${labB}"`,{
        lab_a:labA,lab_b:labB,candidate_exists:candidates.some(c=>(c.source===labA&&c.target===labB)||(c.source===labB&&c.target===labA))});
      const reports=[];
      for(const bridge of matches){
        if(bridge.source===labA&&bridge.target===labB) reports.push(evaluatePhaseBridge(bridge,a,b,input));
        else reports.push(phaseRefusal('BRIDGE_DIRECTION_MISMATCH',`registered bridge "${bridge.id}" is directed ${bridge.source} -> ${bridge.target}`,{bridge_id:bridge.id}));
      }
      return Object.freeze({schema:'hcc.phase-compare/1',lab_a:labA,lab_b:labB,reports:Object.freeze(reports)});
    },
    bridges({labA=null,labB=null,status=null,includeCandidates=false}={}){
      const canonical=registry.listBridges({labA,labB,status}).filter(b=>pairTouches(b,labA,labB));
      const cand=includeCandidates?candidates.filter(b=>pairTouches(b,labA,labB)&&(!status||b.status===status)):[];
      return Object.freeze({schema:'hcc.phase-bridges/1',filter:{labA,labB,status,includeCandidates},canonical:Object.freeze(canonical),candidates:Object.freeze(cand)});
    },
    snapshot(currentIdentity=identity){
      const current={version:currentIdentity.version??null,build:currentIdentity.build??null};
      const generated={version:identity.version??current.version,build:identity.build??current.build};
      const same=generated.version===current.version&&generated.build===current.build;
      return jsonSafe({schema:'hcc.phase-space/1',version:generated.version,build:generated.build,core_version:identity.core_version??null,
        code_sha256:identity.code_sha256??null,base_core_code_sha256:identity.base_core_code_sha256??null,phase_code_sha256:identity.phase_code_sha256??null,generator:'core/phase/service.mjs',generated_release:generated,current_release:current,
        generated_on_this_release:same,stale:!same,counts:{spaces:registry.listSpaces().length,bridges:registry.listBridges().length,candidates:candidates.length},
        spaces:registry.listSpaces(),bridges:registry.listBridges(),candidates});
    },
    registry
  };
  return Object.freeze(service);
}

export const PHASE_SERVICE=createPhaseService();
