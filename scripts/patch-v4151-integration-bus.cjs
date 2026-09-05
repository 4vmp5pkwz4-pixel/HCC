#!/usr/bin/env node
'use strict';
const fs=require('fs');
const path='index.html';
let s=fs.readFileSync(path,'utf8');
const marker="HCC_ATLAS_INTEGRATION_SCHEMA = 'hcc.atlas-integration/1'";
if(s.includes(marker)){console.log('Atlas integration bus already present');process.exit(0);}
if(!s.includes("HCC_FIRST_PRINCIPLES_SCHEMA = 'hcc.first-principles/1'")) throw new Error('first-principles runtime must be materialized before integration bus');
if(!s.includes('HCC v4.151 · FIRST-PRINCIPLES LENS')) throw new Error('First-Principles Lens must be materialized before integration bus so it can be connected to the shared graph');

const anchor='/* ── END HCC v4.151 FIRST-PRINCIPLES CONTRACT ─────────────────────────────── */';
if(!s.includes(anchor)) throw new Error('first-principles insertion anchor missing');

const block=String.raw`

/* ── HCC v4.151 · ATLAS INTEGRATION BUS ────────────────────────────────────
   One typed, revisioned state graph for laboratories, dimensions, projections, operators,
   chronology and views.  A graph edge is a declared operational relation, never evidence
   that its endpoints are the same physical mechanism.  Unknown semantics fail closed. */
const HCC_ATLAS_INTEGRATION_SCHEMA = 'hcc.atlas-integration/1';
const HCC_ATLAS_UNDECLARED='UNDECLARED';
const HCC_ATLAS_INTEGRATION_DOMAINS=Object.freeze(['multiview','chronometry','solar','xr','anyons','first-principles']);
let frameRevision=0;
let hccAtlasSharedTimeSeconds=0;
let hccAtlasFocusId=null;
const hccAtlasListeners=new Set();

function hccAtlasLabs(){
  try{const xs=globalThis.HCC_API&&HCC_API.labs&&HCC_API.labs.list?HCC_API.labs.list():[];return Array.isArray(xs)?xs:[];}catch{return [];}
}
function hccAtlasLabId(x){return typeof x==='string'?x:(x&&x.id)||'';}
function hccAtlasContract(labId){
  try{return globalThis.HCC_FIRST_PRINCIPLES&&HCC_FIRST_PRINCIPLES.lab?HCC_FIRST_PRINCIPLES.lab(labId):{schema:'hcc.first-principles/1',lab_id:labId,source_status:HCC_ATLAS_UNDECLARED,parameters:[]};}
  catch(error){return {schema:'hcc.first-principles/1',lab_id:labId,source_status:HCC_ATLAS_UNDECLARED,parameters:[],error:String(error)};}
}
function hccAtlasRuntimeLab(labId){try{return globalThis.HCC_API&&HCC_API.labs&&HCC_API.labs.get?HCC_API.labs.get(labId):null;}catch{return null;}}
function hccAtlasNodeId(labId,kind,name){return labId+':'+kind+':'+name;}
function hccAtlasDeclared(v){return v!==undefined&&v!==null&&v!==''&&v!==HCC_ATLAS_UNDECLARED;}

function hccAtlasBuildGraph(){
  const nodes=[];const edges=[];const seen=new Set();
  const addNode=n=>{if(!n||!n.id||seen.has(n.id))return;seen.add(n.id);nodes.push(Object.freeze(n));};
  const addEdge=e=>{if(e&&e.from&&e.to)edges.push(Object.freeze(e));};
  for(const item of hccAtlasLabs()){
    const id=hccAtlasLabId(item);if(!id)continue;
    const c=hccAtlasContract(id),runtime=hccAtlasRuntimeLab(id)||{};
    addNode({id,type:'laboratory',lab_id:id,title:(item&&item.title)||runtime.title||id,status:c.source_status||HCC_ATLAS_UNDECLARED});
    const dimId=hccAtlasNodeId(id,'dimension','native');
    addNode({id:dimId,type:'dimension',lab_id:id,value:c.native_dimension||HCC_ATLAS_UNDECLARED,native_space:c.native_space||HCC_ATLAS_UNDECLARED});
    addEdge({type:'has_dimension',from:id,to:dimId});
    const projId=hccAtlasNodeId(id,'projection','display');
    addNode({id:projId,type:'projection',lab_id:id,value:c.projection||HCC_ATLAS_UNDECLARED,display_dimension:c.display_dimension||HCC_ATLAS_UNDECLARED});
    addEdge({type:'projects_to',from:dimId,to:projId,claim:'representation-map-not-physical-identity'});
    for(const p of Array.isArray(c.parameters)?c.parameters:[]){
      const pid=hccAtlasNodeId(id,'parameter',p.id||p.name||'unknown');
      addNode({id:pid,type:'parameter',lab_id:id,name:p.id||p.name||HCC_ATLAS_UNDECLARED,quantity_kind:p.quantity_kind||HCC_ATLAS_UNDECLARED,unit:p.unit||HCC_ATLAS_UNDECLARED,role:p.role||HCC_ATLAS_UNDECLARED,domain:p.domain||HCC_ATLAS_UNDECLARED});
      addEdge({type:'controls',from:pid,to:id});
    }
    const outs=Array.isArray(runtime.outputs)?runtime.outputs:[];
    for(const o of outs){
      const name=o&&o.name?String(o.name):'';if(!name)continue;
      const oid=hccAtlasNodeId(id,'output',name);
      addNode({id:oid,type:'output',lab_id:id,name,quantity_kind:(o.quantity_kind||o.quantityKind||HCC_ATLAS_UNDECLARED),unit:o.unit||HCC_ATLAS_UNDECLARED});
      addEdge({type:'produces',from:id,to:oid});
    }
  }

  /* Existing measured semantic bridge: topological entropy is already a nat-valued
     quantity accepted by Information Lab.  This declares that transfer, not a new theorem. */
  const az='anyzoo.topological_entanglement_entropy',inf='infolab.entropy_nats';
  addNode({id:az,type:'output',lab_id:'anyzoo',name:'topological_entanglement_entropy',quantity_kind:'entropy',unit:'nat'});
  addNode({id:inf,type:'parameter',lab_id:'infolab',name:'entropy_nats',quantity_kind:'entropy',unit:'nat',role:'input'});
  addEdge({type:'converts',from:az,to:inf,quantity_kind:'entropy',unit:'nat',scale:1,provenance:'existing Atlas bus link'});

  addNode({id:'operator:fibonacci.braid',type:'operator',domain:'anyons',source:'HCC_FIRST_PRINCIPLES.braid'});
  addNode({id:'operator:fibonacci.gate-distance',type:'operator',domain:'anyons',source:'HCC_FIRST_PRINCIPLES.gateDistance'});
  addEdge({type:'braids',from:'anyzoo',to:'operator:fibonacci.braid'});
  addEdge({type:'compares',from:'operator:fibonacci.braid',to:'operator:fibonacci.gate-distance'});

  addNode({id:'time:shared',type:'time',unit:'s',quantity_kind:'time',value:hccAtlasSharedTimeSeconds});
  for(const domain of HCC_ATLAS_INTEGRATION_DOMAINS){
    const did='domain:'+domain;addNode({id:did,type:'view-domain',domain,does_not_assert_physical_equivalence:true});
    addEdge({type:'synchronizes',from:'time:shared',to:did,quantity_kind:'time',unit:'s'});
  }
  return Object.freeze({schema:HCC_ATLAS_INTEGRATION_SCHEMA,nodes:Object.freeze(nodes),edges:Object.freeze(edges),fail_closed:true,does_not_assert_physical_equivalence:true});
}
function hccAtlasGraph(){return hccAtlasBuildGraph();}
function hccAtlasResolve(id){const g=hccAtlasBuildGraph();return g.nodes.find(n=>n.id===id)||null;}
function hccAtlasNeighborhood(id){
  const g=hccAtlasBuildGraph();const prefix=id+':';
  const edges=g.edges.filter(e=>e.from===id||e.to===id||e.from.startsWith(prefix)||e.to.startsWith(prefix));
  const ids=new Set([id]);for(const e of edges){ids.add(e.from);ids.add(e.to);}
  return Object.freeze({id,nodes:g.nodes.filter(n=>ids.has(n.id)),edges});
}
function hccAtlasEmit(type,payload){
  const event=Object.freeze({schema:HCC_ATLAS_INTEGRATION_SCHEMA,type,revision:frameRevision,time_seconds:hccAtlasSharedTimeSeconds,payload,provenance:'hcc.atlas-integration/1'});
  for(const fn of [...hccAtlasListeners]){try{fn(event);}catch{}}
  try{globalThis.dispatchEvent(new CustomEvent('hcc:atlas-integration',{detail:event}));}catch{}
  return event;
}
function hccAtlasSubscribe(fn){if(typeof fn!=='function')throw new TypeError('subscriber must be a function');hccAtlasListeners.add(fn);return()=>hccAtlasListeners.delete(fn);}
function hccAtlasSetTime(seconds,provenance='user-or-host-clock'){
  seconds=Number(seconds);if(!Number.isFinite(seconds))throw new RangeError('time_seconds must be finite');
  hccAtlasSharedTimeSeconds=seconds;frameRevision++;
  return hccAtlasEmit('time',{time_seconds:seconds,provenance});
}
function hccAtlasFocus(labId,provenance='ui-focus'){
  const id=String(labId||'');if(!id)throw new RangeError('lab id required');hccAtlasFocusId=id;frameRevision++;
  return hccAtlasEmit('focus',{lab_id:id,provenance});
}
function hccAtlasQuantityCompatibility(a,b){
  if(!a||!b)return {ok:false,reason:'endpoint_missing'};
  const ak=a.quantity_kind,bk=b.quantity_kind,au=a.unit,bu=b.unit;
  if(hccAtlasDeclared(ak)&&hccAtlasDeclared(bk)&&ak!==bk)return {ok:false,reason:'quantity_kind_mismatch'};
  if(hccAtlasDeclared(au)&&hccAtlasDeclared(bu)&&au!==bu)return {ok:false,reason:'unit_mismatch',requires:'converter_required'};
  if(!hccAtlasDeclared(ak)||!hccAtlasDeclared(bk)||!hccAtlasDeclared(au)||!hccAtlasDeclared(bu))return {ok:false,reason:'converter_required'};
  return {ok:true,reason:'compatible'};
}
function hccAtlasTransfer(fromId,toId,value,options={}){
  const from=hccAtlasResolve(fromId),to=hccAtlasResolve(toId);const compat=hccAtlasQuantityCompatibility(from,to);
  let out=value,converted=false;
  if(!compat.ok){
    if(typeof options.converter!=='function')throw Object.assign(new TypeError(compat.reason),{code:compat.reason,from:fromId,to:toId});
    out=options.converter(value,from,to);converted=true;
  }
  frameRevision++;
  const receipt=Object.freeze({from:fromId,to:toId,input:value,value:out,converted,unit:to&&to.unit||HCC_ATLAS_UNDECLARED,quantity_kind:to&&to.quantity_kind||HCC_ATLAS_UNDECLARED,revision:frameRevision,time_seconds:hccAtlasSharedTimeSeconds,provenance:options.provenance||'typed-atlas-transfer'});
  hccAtlasEmit('transfer',receipt);return receipt;
}
function hccAtlasSnapshot(labId=hccAtlasFocusId){
  const id=labId||null,c=id?hccAtlasContract(id):null,g=hccAtlasBuildGraph();
  return Object.freeze({schema:HCC_ATLAS_INTEGRATION_SCHEMA,frameRevision,time_seconds:hccAtlasSharedTimeSeconds,lab_id:id,contract:c,parameters:c&&c.parameters||[],dimension:c&&c.native_dimension||HCC_ATLAS_UNDECLARED,projection:c&&c.projection||HCC_ATLAS_UNDECLARED,graph_counts:{nodes:g.nodes.length,edges:g.edges.length},provenance:'live Atlas API + first-principles contracts',fail_closed:true});
}
function hccAtlasAnyonBraid(word){
  if(!globalThis.HCC_FIRST_PRINCIPLES||!HCC_FIRST_PRINCIPLES.braid)throw new Error('Fibonacci braid kernel unavailable');
  const result=HCC_FIRST_PRINCIPLES.braid(word);frameRevision++;hccAtlasEmit('operator',{operator:'operator:fibonacci.braid',word,result});return result;
}
function hccAtlasAnyonGateDistance(A,B){
  if(!globalThis.HCC_FIRST_PRINCIPLES||!HCC_FIRST_PRINCIPLES.gateDistance)throw new Error('gate-distance kernel unavailable');
  const result=HCC_FIRST_PRINCIPLES.gateDistance(A,B);frameRevision++;hccAtlasEmit('operator',{operator:'operator:fibonacci.gate-distance',result});return result;
}

globalThis.HCC_ATLAS_INTEGRATION=Object.freeze({
  schema:HCC_ATLAS_INTEGRATION_SCHEMA,
  domains:HCC_ATLAS_INTEGRATION_DOMAINS,
  graph:hccAtlasGraph,
  resolve:hccAtlasResolve,
  neighborhood:hccAtlasNeighborhood,
  contract:hccAtlasContract,
  snapshot:hccAtlasSnapshot,
  transfer:hccAtlasTransfer,
  subscribe:hccAtlasSubscribe,
  setTime:hccAtlasSetTime,
  focus:hccAtlasFocus,
  operators:Object.freeze({fibonacci:Object.freeze({braid:hccAtlasAnyonBraid,gateDistance:hccAtlasAnyonGateDistance})}),
  policy:Object.freeze({fail_closed:true,does_not_assert_physical_equivalence:true})
});
/* ── END HCC v4.151 ATLAS INTEGRATION BUS ────────────────────────────────── */
`;
s=s.replace(anchor,anchor+block);

/* Route the Lens through the same integration graph.  The underlying exact kernels stay
   HCC_FIRST_PRINCIPLES; the bus supplies identity, topology, time, provenance and links. */
const fpLine='const FP=globalThis.HCC_FIRST_PRINCIPLES;';
if(!s.includes(fpLine)) throw new Error('Lens FP binding not found');
s=s.replace(fpLine,"const ATLAS=globalThis.HCC_ATLAS_INTEGRATION;\nconst FP=globalThis.HCC_FIRST_PRINCIPLES;");
const oldContract="function contract(){try{return FP.lab(selected);}catch(e){return {lab_id:selected,native_space:'UNDECLARED',native_dimension:'UNDECLARED',state_dimension:'UNDECLARED',display_dimension:'UNDECLARED',projection:'UNDECLARED',metric_or_form:'UNDECLARED',coordinates:'UNDECLARED',domain:'UNDECLARED',parameters:[],error:String(e)};}}";
const newContract="function contract(){try{return ATLAS&&ATLAS.contract?ATLAS.contract(selected):FP.lab(selected);}catch(e){return {lab_id:selected,native_space:'UNDECLARED',native_dimension:'UNDECLARED',state_dimension:'UNDECLARED',display_dimension:'UNDECLARED',projection:'UNDECLARED',metric_or_form:'UNDECLARED',coordinates:'UNDECLARED',domain:'UNDECLARED',parameters:[],error:String(e)};}}";
if(!s.includes(oldContract)) throw new Error('Lens contract bridge not found');
s=s.replace(oldContract,newContract);

const depStart='function hccFpRenderDependency(){';
const depEnd='function hccFpRenderGeometry(){';
const a=s.indexOf(depStart),b=s.indexOf(depEnd,a);
if(a<0||b<0)throw new Error('Lens dependency renderer anchors not found');
const dep=String.raw`function hccFpRenderDependency(){
 const c=contract();const F=fib();const isFib=selected==='anyzoo'||selected==='fibonacci.anyons';
 const hood=ATLAS&&ATLAS.neighborhood?ATLAS.neighborhood(selected):{nodes:[],edges:[]};
 const graphRows=(hood.edges||[]).slice(0,28).map(e=>'<div class="hccFpNode">'+esc(e.type)+' · '+esc(e.from)+' → '+esc(e.to)+'</div>').join('<span class="hccFpArrow">↔</span>');
 const chain=isFib?['braid unitary ρ(w)','ρ(σ₂)=F^-1 R F','F,R symbols','φ=(1+√5)/2','τ×τ=1+τ']:['observable / rendered result','laboratory equation','declared parameter semantics','primitive definitions / source status'];
 return '<div class="hccFpGrid"><article class="hccFpCard wide"><div class="hccFpKicker">Unified Atlas graph · typed neighborhood</div><div class="hccFpDag">'+(graphRows||chain.map((x,i)=>'<div class="hccFpNode">'+esc(x)+'</div>'+(i<chain.length-1?'<span class="hccFpArrow">→</span>':'')).join(''))+'</div></article><article class="hccFpCard"><div class="hccFpKicker">Lab contract</div><div class="hccFpMono">'+esc(c.lab_id)+'\n'+esc(c.source_status)+'\nframe '+esc(ATLAS&&ATLAS.snapshot?ATLAS.snapshot(selected).frameRevision:'UNDECLARED')+'</div></article><article class="hccFpCard"><div class="hccFpKicker">Verification</div><div class="hccFpMono">'+(isFib?'φ polynomial · F involution · |R|=1 · Yang–Baxter\nresidual '+fmt(F.invariant_checks.braid_relation):'Typed graph edges are operational relations; they do not assert physical equivalence.')+'</div></article></div>';
}
`;
s=s.slice(0,a)+dep+s.slice(b);

fs.writeFileSync(path,s);
console.log('connected Atlas through hcc.atlas-integration/1 · typed graph + shared frame + Lens + anyon operators');
