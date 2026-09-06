'use strict';
const fs=require('node:fs');
let src=fs.readFileSync('index.html','utf8');
function one(oldText,newText,label){
  const n=src.split(oldText).length-1;
  if(n!==1)throw new Error(`${label}: expected 1, found ${n}`);
  src=src.replace(oldText,newText);
}
one("let hccAtlasSharedTimeSeconds=0;",`function hccAtlasTimeView(){
  const svc=globalThis.HCC_TIME_FABRIC;
  if(!svc||typeof svc.snapshot!=='function')return Object.freeze({available:false,schema:'hcc.time-fabric/1'});
  const snap=svc.snapshot();
  return Object.freeze({available:true,schema:'hcc.time-fabric/1',epoch_days_j2000:snap.epochDaysJ2000,rate_days_per_second:snap.rateDaysPerSecond,paused:snap.paused,revision:snap.revision,source:snap.source});
}`,'shared seconds declaration');
one(`  addNode({id:'time:shared',type:'time',unit:'s',quantity_kind:'time',value:hccAtlasSharedTimeSeconds});
  for(const domain of HCC_ATLAS_INTEGRATION_DOMAINS){
    const did='domain:'+domain;addNode({id:did,type:'view-domain',domain,does_not_assert_physical_equivalence:true});
    addEdge({type:'synchronizes',from:'time:shared',to:did,quantity_kind:'time',unit:'s'});
  }`,`  const tv=hccAtlasTimeView();
  if(tv.available)addNode({id:'time:atlas-epoch',type:'time-domain',domain_id:'atlas.epoch',kind:'ABSOLUTE_EPOCH',unit:'day[J2000]',quantity_kind:'absolute_epoch',value:tv.epoch_days_j2000,revision:tv.revision,provenance:'HCC_TIME_FABRIC'});
  for(const domain of HCC_ATLAS_INTEGRATION_DOMAINS){
    const did='domain:'+domain;addNode({id:did,type:'view-domain',domain,does_not_assert_physical_equivalence:true});
  }`,'shared time graph');
one(`function hccAtlasEmit(type,payload){
  const event=Object.freeze({schema:HCC_ATLAS_INTEGRATION_SCHEMA,type,revision:frameRevision,time_seconds:hccAtlasSharedTimeSeconds,payload,provenance:'hcc.atlas-integration/1'});`,`function hccAtlasEmit(type,payload){
  const event=Object.freeze({schema:HCC_ATLAS_INTEGRATION_SCHEMA,type,revision:frameRevision,atlas_time:hccAtlasTimeView(),payload,provenance:'hcc.atlas-integration/1'});`,'event time');
one(`function hccAtlasSetTime(seconds,provenance='user-or-host-clock'){
  seconds=Number(seconds);if(!Number.isFinite(seconds))throw new RangeError('time_seconds must be finite');
  hccAtlasSharedTimeSeconds=seconds;frameRevision++;
  return hccAtlasEmit('time',{time_seconds:seconds,provenance});
}`,`function hccAtlasSetTime(){
  const err=new TypeError('setTime(seconds) is untyped and has been removed; use setEpochDays(dayJ2000, provenance)');
  err.code='UNTYPED_TIME_REJECTED';throw err;
}
function hccAtlasSetEpochDays(dayJ2000,provenance='atlas-integration.setEpochDays'){
  const svc=globalThis.HCC_TIME_FABRIC;if(!svc||typeof svc.setEpochDays!=='function')throw new Error('AtlasTime authority unavailable');
  const snap=svc.setEpochDays(dayJ2000,provenance);frameRevision++;
  hccAtlasEmit('time',{domain_id:'atlas.epoch',unit:'day[J2000]',epoch_days_j2000:snap.epochDaysJ2000,provenance});return snap;
}`,'setTime');
one(`  const receipt=Object.freeze({from:fromId,to:toId,input:value,value:out,converted,unit:to&&to.unit||HCC_ATLAS_UNDECLARED,quantity_kind:to&&to.quantity_kind||HCC_ATLAS_UNDECLARED,revision:frameRevision,time_seconds:hccAtlasSharedTimeSeconds,provenance:options.provenance||'typed-atlas-transfer'});`,`  const receipt=Object.freeze({from:fromId,to:toId,input:value,value:out,converted,unit:to&&to.unit||HCC_ATLAS_UNDECLARED,quantity_kind:to&&to.quantity_kind||HCC_ATLAS_UNDECLARED,revision:frameRevision,atlas_time:hccAtlasTimeView(),provenance:options.provenance||'typed-atlas-transfer'});`,'transfer receipt');
one(`  return Object.freeze({schema:HCC_ATLAS_INTEGRATION_SCHEMA,frameRevision,time_seconds:hccAtlasSharedTimeSeconds,lab_id:id,contract:c,parameters:c&&c.parameters||[],dimension:c&&c.native_dimension||HCC_ATLAS_UNDECLARED,projection:c&&c.projection||HCC_ATLAS_UNDECLARED,graph_counts:{nodes:g.nodes.length,edges:g.edges.length},source_manifest_version:HCC_ATLAS_SOURCE.source_manifest_version,source_manifest_build:HCC_ATLAS_SOURCE.source_manifest_build,measured_bus_links:g.measured_bus_links,provenance:'live Atlas API + api/manifest.json + first-principles contracts',fail_closed:true});`,`  return Object.freeze({schema:HCC_ATLAS_INTEGRATION_SCHEMA,frameRevision,atlas_time:hccAtlasTimeView(),lab_id:id,contract:c,parameters:c&&c.parameters||[],dimension:c&&c.native_dimension||HCC_ATLAS_UNDECLARED,projection:c&&c.projection||HCC_ATLAS_UNDECLARED,graph_counts:{nodes:g.nodes.length,edges:g.edges.length},source_manifest_version:HCC_ATLAS_SOURCE.source_manifest_version,source_manifest_build:HCC_ATLAS_SOURCE.source_manifest_build,measured_bus_links:g.measured_bus_links,provenance:'live Atlas API + api/manifest.json + first-principles contracts',fail_closed:true});`,'snapshot time');
one(`  setTime:hccAtlasSetTime,
  focus:hccAtlasFocus,`,`  setTime:hccAtlasSetTime,
  setEpochDays:hccAtlasSetEpochDays,
  focus:hccAtlasFocus,`,'api method');
const anchor=`function atlasTimeSnapshot(){return atlasFrameTime;}`;
one(anchor,`${anchor}
const HCC_TIME_FABRIC=Object.freeze({
  schema:HCC_TIME_FABRIC_SCHEMA,
  snapshot(){const s=atlasTimeSnapshot();return Object.freeze({...s,epochDaysJ2000:epochDaysOf(s)});},
  setEpochDays(dayJ2000,provenance='time-fabric.api.setEpochDays'){setAtlasEpochDays(dayJ2000,provenance);return this.snapshot();},
  setRateDaysPerSecond(rate,provenance='time-fabric.api.setRate'){setAtlasSignedRate(rate,provenance);return this.snapshot();},
  setPaused(paused,provenance='time-fabric.api.setPaused'){setAtlasPaused(paused,provenance);return this.snapshot();},
  adapter(source,target){return findClockAdapter(source,target);}
});
globalThis.HCC_TIME_FABRIC=HCC_TIME_FABRIC;
globalThis.HCC_TIME_DIAGNOSTICS=Object.freeze({
  schema:HCC_TIME_FABRIC_SCHEMA,
  snapshot:()=>HCC_TIME_FABRIC.snapshot(),
  domain:(id)=>domainById(id),
  adapter:(source,target)=>findClockAdapter(source,target),
  domains:()=>TIME_DOMAINS.slice(),
  scopes:()=>STATE_SCOPES.slice(),
  statuses:()=>({...CLOCK_STATUS})
});`,'time fabric API');
fs.writeFileSync('index.html',src);
console.log('Patched legacy integration time bus onto AtlasTime');
