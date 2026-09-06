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

const fragment=fs.readFileSync(FRAGMENT,'utf8').trim();
html=replaceOnce(html,'function observeCycle(key){',fragment+'\nfunction observeCycle(key){','Cycles runtime boundary');

const panelAnchor='${hccCycleNavigationHTML()}\n     <div class="sect"><b>Shared timeline</b>';
const panelReplacement='${hccCycleNavigationHTML()}\n     ${hccMultiPhaseControlHTML()}\n     <div class="sect"><b>Shared timeline</b>';
html=replaceOnce(html,panelAnchor,panelReplacement,'Cycles control panel');

const bindAnchor="ctl.querySelectorAll('[data-cycle-view]').forEach(b=>b.onclick=()=>hccCycleNavigate(b.dataset.cycleView));";
html=replaceOnce(html,bindAnchor,bindAnchor+'\n  hccBindMultiPhaseControls();','central control binding');

fs.writeFileSync(INDEX,html);
console.log('materialized hcc.multiphase-solar-control/1 into index.html');
