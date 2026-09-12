import {readFileSync,writeFileSync} from 'node:fs';
const p='index.html';let s=readFileSync(p,'utf8');
function once(oldText,newText,label){const n=s.split(oldText).length-1;if(n!==1)throw new Error(`${label}: expected exactly one match, found ${n}`);s=s.replace(oldText,newText);console.log(`patched: ${label}`);}

once("  atlasPanel:{scope:'global',label:'Atlas'},\n  morePanel:{scope:'global',label:'More'},","  atlasPanel:{scope:'global',label:'Atlas'},\n  predictivePanel:{scope:'global',label:'Predictive foundation'},\n  morePanel:{scope:'global',label:'More'},",'predictive panel scope');

once('<button class="panelDockBtn" data-panel="atlasPanel" title="Atlas"><span>⌕</span><b>Atlas</b></button>\n    <button class="panelDockBtn" data-panel="morePanel" title="More"><span>⋯</span><b>More</b></button>','<button class="panelDockBtn" data-panel="atlasPanel" title="Atlas"><span>⌕</span><b>Atlas</b></button>\n    <button class="panelDockBtn" data-panel="predictivePanel" title="Predictive foundation"><span>⌁</span><b>Predict</b></button>\n    <button class="panelDockBtn" data-panel="morePanel" title="More"><span>⋯</span><b>More</b></button>','predictive panel recall control');

once("    const known=Object.keys(S3_VIEW_NAMES).filter(v=>v!=='nexus').sort(),declared=[...NEXUS_VIEWS].sort();\n    ok('Invariant Nexus covers every pre-existing S³ laboratory exactly once across six disciplinary clusters',","    const known=LAB_REGISTRY.map(x=>x.id).filter(v=>v!=='nexus').sort(),declared=[...NEXUS_VIEWS].sort();\n    ok('Invariant Nexus covers every registered laboratory except itself exactly once across six disciplinary clusters',",'nexus registry authority');

once("  ['bhr','qso','coupling','black-hole environment ↔ accretion source','The quasar station adds accretion and beaming around an idealized compact-object environment.','model-context'],\n",'', 'duplicate bhr-qso typed edge');

once('  const STACK_N=32, stackLabs=[];','  const STACK_N=HCC_SI_KINDS.length, stackLabs=[];','scale-axis capacity follows quantity registry');

const start=s.indexOf("function nexusStructuralCalibration(kind='all'){");
const end=s.indexOf('function nexusEnsureHypothesisLayer(){',start);
if(start<0||end<0)throw new Error('nexusStructuralCalibration boundaries not found');
const oldFn=s.slice(start,end);
const newFn=`function nexusStructuralCalibration(kind='all'){
  if(NEXUS_CV_CACHE.has(kind))return NEXUS_CV_CACHE.get(kind);
  const held=NEXUS_RELATIONS.filter(e=>kind==='all'||e.type===kind),pairs=new Map();
  for(const e of held){const key=[e.a,e.b].sort().join('|');if(!pairs.has(key))pairs.set(key,e);}
  let hit1=0,hit5=0,mrr=0,tested=0;
  for(const e of pairs.values()){
    const adj=new Map(NEXUS_VIEWS.map(v=>[v,new Set()]));
    for(const q of NEXUS_RELATIONS){
      if(kind!=='all'&&q.type!==kind)continue;
      if((q.a===e.a&&q.b===e.b)||(q.a===e.b&&q.b===e.a))continue;
      adj.get(q.a)?.add(q.b);adj.get(q.b)?.add(q.a);
    }
    const ranked=NEXUS_VIEWS.filter(v=>v!==e.a&&!adj.get(e.a).has(v)).map(v=>({v,s:nexusPairScore(e.a,v,adj)})).sort((a,b)=>b.s-a.s||a.v.localeCompare(b.v)),r=ranked.findIndex(q=>q.v===e.b)+1;
    if(!r)continue;tested++;if(r===1)hit1++;if(r<=5)hit5++;mrr+=1/r;
  }
  const out={scheme:'leave-one-declared-endpoint-pair-out resource-allocation score',kind,tested,declared_pairs:pairs.size,recall_at_1:tested?hit1/tested:0,recall_at_5:tested?hit5/tested:0,mean_reciprocal_rank:tested?mrr/tested:0,calibration_status:'internal graph-reconstruction diagnostic; not physical validation'};NEXUS_CV_CACHE.set(kind,out);return out;
}
`;
s=s.slice(0,start)+newFn+s.slice(end);
console.log('patched: multigraph-aware nexus calibration');

once("    ok('Invariant Nexus: spectral embedding is finite/deterministic and held-edge calibration reports bounded reconstruction scores',\n      E.positions.size===NEXUS_VIEWS.length&&[...E.positions.values()].every(p=>[p.x,p.y,p.z].every(Number.isFinite))&&[C.recall_at_1,C.recall_at_5,C.mean_reciprocal_rank].every(x=>x>=0&&x<=1)&&C.tested===NEXUS_RELATIONS.length,","    ok('Invariant Nexus: spectral embedding is finite/deterministic and held-pair calibration reports bounded reconstruction scores for every declared endpoint pair',\n      E.positions.size===NEXUS_VIEWS.length&&[...E.positions.values()].every(p=>[p.x,p.y,p.z].every(Number.isFinite))&&[C.recall_at_1,C.recall_at_5,C.mean_reciprocal_rank].every(x=>x>=0&&x<=1)&&C.tested===C.declared_pairs,",'spectral calibration invariant');

writeFileSync(p,s);console.log('zero-debt source repairs written');
