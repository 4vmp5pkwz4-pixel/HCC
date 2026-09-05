#!/usr/bin/env node
'use strict';
const fs=require('fs');
const path='index.html';
let s=fs.readFileSync(path,'utf8');
const manifest=JSON.parse(fs.readFileSync('api/manifest.json','utf8'));
const declaredLinks=JSON.stringify((manifest.bus&&manifest.bus.links)||[]);
const declaredWorlds=JSON.stringify(manifest.worlds||[]);
const declaredMultiview=JSON.stringify(manifest.multiview||[]);
const labMeta=JSON.stringify(Object.fromEntries((manifest.labs||[]).map(l=>[l.id,{world:l.world||null,instrument:l.instrument||null,route:l.route||null,title:l.title||l.id}])));
const sourceVersion=JSON.stringify(manifest.version||'UNDECLARED');
const sourceBuild=JSON.stringify(manifest.build||'UNDECLARED');

const marker="HCC_ATLAS_INTEGRATION_SCHEMA = 'hcc.atlas-integration/1'";
if(s.includes(marker)){console.log('Atlas integration bus already present');process.exit(0);}
if(!s.includes("HCC_FIRST_PRINCIPLES_SCHEMA = 'hcc.first-principles/1'")) throw new Error('first-principles runtime must be materialized before integration bus');
if(!s.includes('HCC v4.151 · FIRST-PRINCIPLES LENS')) throw new Error('First-Principles Lens must be materialized before integration bus so it can be connected to the shared graph');

const anchor='/* ── END HCC v4.151 FIRST-PRINCIPLES CONTRACT ─────────────────────────────── */';
if(!s.includes(anchor)) throw new Error('first-principles insertion anchor missing');

const block=String.raw`

/* ── HCC v4.151 · ATLAS INTEGRATION BUS ────────────────────────────────────
   One typed, revisioned state graph for laboratories, dimensions, projections, instruments,
   measured bus links, chronology and multiviews. A graph edge is a declared operational
   relation, never evidence that its endpoints are the same physical mechanism. Unknown
   semantics fail closed. Existing solvers stay authoritative and are never duplicated. */
const HCC_ATLAS_INTEGRATION_SCHEMA = 'hcc.atlas-integration/1';
const HCC_ATLAS_UNDECLARED='UNDECLARED';
const HCC_ATLAS_INTEGRATION_DOMAINS=Object.freeze(['multiview','chronometry','solar','xr','anyons','first-principles']);
const HCC_ATLAS_DECLARED_LINKS=Object.freeze(${declaredLinks});
const HCC_ATLAS_DECLARED_WORLDS=Object.freeze(${declaredWorlds});
const HCC_ATLAS_DECLARED_MULTIVIEW=Object.freeze(${declaredMultiview});
const HCC_ATLAS_LAB_META=Object.freeze(${labMeta});
const HCC_ATLAS_SOURCE=Object.freeze({source_manifest_version:${sourceVersion},source_manifest_build:${sourceBuild},provenance:'api/manifest.json'});
let frameRevision=0;
let hccAtlasSharedTimeSeconds=0;
let hccAtlasFocusId=null;
const hccAtlasListeners=new Set();

function hccAtlasLabs(){
  try{const xs=globalThis.HCC_API&&HCC_API.labs&&HCC_API.labs.list?HCC_API.labs.list():[];return Array.isArray(xs)?xs:[];}catch{return [];}
}
function hccAtlasInstruments(){
  try{const xs=globalThis.HCC_API&&HCC_API.instruments&&HCC_API.instruments.list?HCC_API.instruments.list():[];return Array.isArray(xs)?xs:[];}catch{return [];}
}
function hccAtlasDescribe(id){
  try{return globalThis.HCC_API&&HCC_API.describe?HCC_API.describe(id):null;}catch{return null;}
}
function hccAtlasLabId(x){return typeof x==='string'?x:(x&&x.id)||'';}
function hccAtlasInstrumentId(x){return typeof x==='string'?x:(x&&x.id)||'';}
function hccAtlasContract(labId){
  try{return globalThis.HCC_FIRST_PRINCIPLES&&HCC_FIRST_PRINCIPLES.lab?HCC_FIRST_PRINCIPLES.lab(labId):{schema:'hcc.first-principles/1',lab_id:labId,source_status:HCC_ATLAS_UNDECLARED,parameters:[]};}
  catch(error){return {schema:'hcc.first-principles/1',lab_id:labId,source_status:HCC_ATLAS_UNDECLARED,parameters:[],error:String(error)};}
}
function hccAtlasRuntimeLab(labId){try{return globalThis.HCC_API&&HCC_API.labs&&HCC_API.labs.get?HCC_API.labs.get(labId):null;}catch{return null;}}
function hccAtlasNodeId(labId,kind,name){return labId+':'+kind+':'+name;}
function hccAtlasDeclared(v){return v!==undefined&&v!==null&&v!==''&&v!==HCC_ATLAS_UNDECLARED;}

function hccAtlasBuildGraph(){
  const nodes=[];const edges=[];const seen=new Set(),edgeSeen=new Set();
  const addNode=n=>{if(!n||!n.id||seen.has(n.id))return;seen.add(n.id);nodes.push(Object.freeze(n));};
  const addEdge=e=>{if(!e||!e.from||!e.to)return;const k=[e.type,e.from,e.to].join('|');if(edgeSeen.has(k))return;edgeSeen.add(k);edges.push(Object.freeze(e));};

  for(const w of HCC_ATLAS_DECLARED_WORLDS){
    if(!w||!w.id)continue;
    addNode({id:'world:'+w.id,type:'world',world_id:w.id,title:w.title||w.id,provenance:'api/manifest.json worlds'});
  }
  for(const p of HCC_ATLAS_DECLARED_MULTIVIEW){
    if(!p||!p.id)continue;
    const mid='multiview:'+p.id;
    addNode({id:mid,type:'multiview',preset_id:p.id,title:p.title||p.id,contract:p.contract||HCC_ATLAS_UNDECLARED,provenance:'api/manifest.json multiview'});
    for(const v of p.views||[])addEdge({type:'contains_view',from:mid,to:String(v),provenance:'api/manifest.json multiview'});
    for(const bus of p.bus||[])addEdge({type:'observes_bus',from:mid,to:String(bus),provenance:'api/manifest.json multiview'});
  }

  for(const item of hccAtlasLabs()){
    const id=hccAtlasLabId(item);if(!id)continue;
    const c=hccAtlasContract(id),runtime=hccAtlasRuntimeLab(id)||{},meta=HCC_ATLAS_LAB_META[id]||{};
    addNode({id,type:'laboratory',lab_id:id,title:(item&&item.title)||runtime.title||meta.title||id,status:c.source_status||HCC_ATLAS_UNDECLARED,route:meta.route||HCC_ATLAS_UNDECLARED});
    const world=(item&&item.world)||meta.world;
    if(world){
      addNode({id:'world:'+world,type:'world',world_id:world,title:world,provenance:'live lab / manifest'});
      addEdge({type:'belongs_to_world',from:id,to:'world:'+world});
    }
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
  }

  /* Live typed instruments come from the already-published HCC_API. They are graph nodes
     and contracts, not copied solvers. */
  for(const raw of hccAtlasInstruments()){
    const id=hccAtlasInstrumentId(raw);if(!id)continue;
    const desc=hccAtlasDescribe(id)||raw||{};
    const iid='instrument:'+id;
    addNode({id:iid,type:'instrument',instrument_id:id,title:desc.title||id,status:desc.status||HCC_ATLAS_UNDECLARED,source:'HCC_API.describe'});
    const owningLab=Object.entries(HCC_ATLAS_LAB_META).find(([,m])=>m&&m.instrument===id);
    if(owningLab)addEdge({type:'exposes_instrument',from:owningLab[0],to:iid,source:'HCC_API.describe'});
    for(const p of desc.inputs||[]){
      const name=p&&((p.name||p.id))?String(p.name||p.id):'';if(!name)continue;
      const pid='instrument:'+id+':parameter:'+name;
      addNode({id:pid,type:'parameter',instrument_id:id,name,quantity_kind:p.quantity_kind||p.quantityKind||HCC_ATLAS_UNDECLARED,unit:p.unit||HCC_ATLAS_UNDECLARED,role:'instrument-input',domain:p.domain||HCC_ATLAS_UNDECLARED,source:'HCC_API.describe'});
      addEdge({type:'controls',from:pid,to:iid,source:'HCC_API.describe'});
    }
    for(const o of desc.outputs||[]){
      const name=o&&((o.name||o.id))?String(o.name||o.id):'';if(!name)continue;
      const oid='instrument:'+id+':output:'+name;
      addNode({id:oid,type:'output',instrument_id:id,name,quantity_kind:o.quantity_kind||o.quantityKind||HCC_ATLAS_UNDECLARED,unit:o.unit||HCC_ATLAS_UNDECLARED,source:'HCC_API.describe'});
      addEdge({type:'produces',from:iid,to:oid,source:'HCC_API.describe'});
    }
  }

  /* Import every measured link from the manifest. This is the existing Atlas bus made
     visible to the unified graph, not a second hand-maintained connectivity table. */
  for(const link of HCC_ATLAS_DECLARED_LINKS){
    if(!link||!link.from||!link.to)continue;
    const from=String(link.from),to=String(link.to);
    const fromParts=from.split('.'),toParts=to.split('.');
    addNode({id:from,type:'output',lab_id:fromParts[0]||HCC_ATLAS_UNDECLARED,name:fromParts.slice(1).join('.')||from,quantity_kind:link.quantity_kind||HCC_ATLAS_UNDECLARED,unit:link.unit||HCC_ATLAS_UNDECLARED,provenance:'api/manifest.json bus.links'});
    addNode({id:to,type:'parameter',lab_id:toParts[0]||HCC_ATLAS_UNDECLARED,name:toParts.slice(1).join('.')||to,quantity_kind:link.quantity_kind||HCC_ATLAS_UNDECLARED,unit:link.unit||HCC_ATLAS_UNDECLARED,role:'measured-bus-target',provenance:'api/manifest.json bus.links'});
    addEdge({type:link.converted?'converts':'transfers',from,to,quantity_kind:link.quantity_kind||HCC_ATLAS_UNDECLARED,unit:link.unit||HCC_ATLAS_UNDECLARED,scale:link.scale===undefined?1:link.scale,converted:!!link.converted,provenance:'api/manifest.json bus.links'});
  }

  /* This bridge is kept explicit because it is central to the Anyon Observatory and is
     also present in the measured manifest. Edge de-duplication prevents double counting. */
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
  return Object.freeze({schema:HCC_ATLAS_INTEGRATION_SCHEMA,nodes:Object.freeze(nodes),edges:Object.freeze(edges),source:HCC_ATLAS_SOURCE,measured_bus_links:HCC_ATLAS_DECLARED_LINKS.length,fail_closed:true,does_not_assert_physical_equivalence:true});
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
  return Object.freeze({schema:HCC_ATLAS_INTEGRATION_SCHEMA,frameRevision,time_seconds:hccAtlasSharedTimeSeconds,lab_id:id,contract:c,parameters:c&&c.parameters||[],dimension:c&&c.native_dimension||HCC_ATLAS_UNDECLARED,projection:c&&c.projection||HCC_ATLAS_UNDECLARED,graph_counts:{nodes:g.nodes.length,edges:g.edges.length},source_manifest_version:HCC_ATLAS_SOURCE.source_manifest_version,source_manifest_build:HCC_ATLAS_SOURCE.source_manifest_build,measured_bus_links:g.measured_bus_links,provenance:'live Atlas API + api/manifest.json + first-principles contracts',fail_closed:true});
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
  source:HCC_ATLAS_SOURCE,
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
  measuredLinks:()=>HCC_ATLAS_DECLARED_LINKS.slice(),
  multiview:()=>HCC_ATLAS_DECLARED_MULTIVIEW.slice(),
  worlds:()=>HCC_ATLAS_DECLARED_WORLDS.slice(),
  operators:Object.freeze({fibonacci:Object.freeze({braid:hccAtlasAnyonBraid,gateDistance:hccAtlasAnyonGateDistance})}),
  policy:Object.freeze({fail_closed:true,does_not_assert_physical_equivalence:true})
});
/* ── END HCC v4.151 ATLAS INTEGRATION BUS ────────────────────────────────── */
`;
s=s.replace(anchor,anchor+block);

/* Route the Lens through the same integration graph. The underlying exact kernels stay
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
 const snap=ATLAS&&ATLAS.snapshot?ATLAS.snapshot(selected):null;
 const graphRows=(hood.edges||[]).slice(0,28).map(e=>'<div class="hccFpNode">'+esc(e.type)+' · '+esc(e.from)+' → '+esc(e.to)+'</div>').join('<span class="hccFpArrow">↔</span>');
 const chain=isFib?['braid unitary ρ(w)','ρ(σ₂)=F^-1 R F','F,R symbols','φ=(1+√5)/2','τ×τ=1+τ']:['observable / rendered result','laboratory equation','declared parameter semantics','primitive definitions / source status'];
 return '<div class="hccFpGrid"><article class="hccFpCard wide"><div class="hccFpKicker">Unified Atlas graph · typed neighborhood</div><div class="hccFpDag">'+(graphRows||chain.map((x,i)=>'<div class="hccFpNode">'+esc(x)+'</div>'+(i<chain.length-1?'<span class="hccFpArrow">→</span>':'')).join(''))+'</div></article><article class="hccFpCard"><div class="hccFpKicker">Lab contract</div><div class="hccFpMono">'+esc(c.lab_id)+'\n'+esc(c.source_status)+'\nframe '+esc(snap?snap.frameRevision:'UNDECLARED')+' · measured links '+esc(snap?snap.measured_bus_links:'UNDECLARED')+'</div></article><article class="hccFpCard"><div class="hccFpKicker">Verification</div><div class="hccFpMono">'+(isFib?'φ polynomial · F involution · |R|=1 · Yang–Baxter\nresidual '+fmt(F.invariant_checks.braid_relation):'Typed graph edges are operational relations; they do not assert physical equivalence.')+'</div></article></div>';
}
`;
s=s.slice(0,a)+dep+s.slice(b);

fs.writeFileSync(path,s);
console.log('connected Atlas through hcc.atlas-integration/1 · all measured bus links + worlds + multiview + live instruments + shared frame + Lens + anyon operators');
