#!/usr/bin/env node
'use strict';
const fs=require('node:fs');
const INDEX='index.html';
const FRAGMENT='scripts/fragments/v41530-multiphase-browser.jsfrag';

function replaceOnce(src,from,to,label){
  const first=src.indexOf(from);
  if(first<0) throw new Error('missing patch anchor: '+label);
  if(src.indexOf(from,first+from.length)>=0) throw new Error('non-unique patch anchor: '+label);
  return src.slice(0,first)+to+src.slice(first+from.length);
}

function insertCyclesPanel(src){
  const token='${hccCycleNavigationHTML()}';
  let at=-1, from=0, found=[];
  while((at=src.indexOf(token,from))>=0){ found.push(at); from=at+token.length; }
  for(const pos of found){
    const tail=src.slice(pos+token.length,pos+token.length+700);
    if(/Shared timeline/.test(tail)){
      return src.slice(0,pos+token.length)+'\n     ${hccMultiPhaseControlHTML()}'+src.slice(pos+token.length);
    }
  }
  throw new Error('missing structural Cycles panel anchor; navigation occurrences='+found.length);
}

let html=fs.readFileSync(INDEX,'utf8');
if(html.includes("HCC_MULTIPHASE_SOLAR_CONTROL_SCHEMA='hcc.multiphase-solar-control/1'")){
  console.log('multiphase Solar control already materialized');
  process.exit(0);
}

const moduleTag=html.match(/<script\s+type=["']module["'][^>]*>/i);
if(!moduleTag) throw new Error('missing module script tag');
const solverImport="\nimport {wrap01 as hccWrapPhase01, evaluateMultiPhase as hccEvaluateMultiPhase, searchMultiPhase as hccSearchMultiPhase} from './core/cycles/multiphase-solver.mjs';";
if(!html.includes("./core/cycles/multiphase-solver.mjs")){
  html=replaceOnce(html,moduleTag[0],moduleTag[0]+solverImport,'main module import');
}

let fragment=fs.readFileSync(FRAGMENT,'utf8').trim();
// Enforce preview semantics and clean provenance even if the source fragment is
// reused independently: Live OFF means search only, APPLY is the explicit commit.
fragment=replaceOnce(fragment,
  "hccApplyMultiPhaseEpoch(result.epochDays,'multiphase.'+direction);",
  "hccApplyMultiPhaseEpoch(result.epochDays,direction);",
  'single provenance prefix');
fragment=replaceOnce(fragment,
  "hccApplyMultiPhaseEpoch(r.epochDays,'multiphase.apply');",
  "hccApplyMultiPhaseEpoch(r.epochDays,'apply');",
  'apply provenance prefix');
fragment=replaceOnce(fragment,
  "hccRunMultiPhaseSearch(action,true);",
  "hccRunMultiPhaseSearch(action,false);",
  'preview-only when live disabled');
html=replaceOnce(html,'function observeCycle(key){',fragment+'\nfunction observeCycle(key){','Cycles runtime boundary');

html=insertCyclesPanel(html);

const bindAnchor="ctl.querySelectorAll('[data-cycle-view]').forEach(b=>b.onclick=()=>hccCycleNavigate(b.dataset.cycleView));";
html=replaceOnce(html,bindAnchor,bindAnchor+'\n  hccBindMultiPhaseControls();','central control binding');

fs.writeFileSync(INDEX,html);
console.log('materialized hcc.multiphase-solar-control/1 into index.html');
