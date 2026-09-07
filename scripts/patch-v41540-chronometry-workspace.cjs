#!/usr/bin/env node
'use strict';
const fs=require('node:fs');
const INDEX='index.html';
const FRAGMENT='scripts/fragments/v41540-chronometry-workspace.jsfrag';
function once(src,from,to,label){const i=src.indexOf(from);if(i<0)throw new Error('missing '+label);if(src.indexOf(from,i+from.length)>=0)throw new Error('non-unique '+label);return src.slice(0,i)+to+src.slice(i+from.length);}
let html=fs.readFileSync(INDEX,'utf8');
if(html.includes("HCC_CHRONOMETRY_OBSERVATORY_SCHEMA='hcc.chronometry-observatory/1'")){console.log('v4.154 chronometry workspace already materialized');process.exit(0);}
if(!html.includes("HCC_MULTIPHASE_SOLAR_CONTROL_SCHEMA='hcc.multiphase-solar-control/1'"))throw new Error('v4.153 multiphase control must be materialized first');
const moduleTag=html.match(/<script\s+type=["']module["'][^>]*>/i);if(!moduleTag)throw new Error('main module tag missing');
const imp="\nimport {groupDefinitionConflicts as hccChronometryConflicts, jainAvasarpini as hccJainAvasarpini, sumSymbolicDurations as hccSumSymbolicDurations, classifyCandidate as hccClassifyChronometryCandidate} from './core/labs/chronometry.source_locked.mjs';";
if(!html.includes("groupDefinitionConflicts as hccChronometryConflicts")) html=once(html,moduleTag[0],moduleTag[0]+imp,'module import anchor');
const fragment=fs.readFileSync(FRAGMENT,'utf8').trim();
html=once(html,'function observeCycle(key){',fragment+'\nfunction observeCycle(key){','Cycles runtime boundary');
fs.writeFileSync(INDEX,html);
console.log('materialized hcc.chronometry-observatory/1 + hcc.multiphase-workspace/2');
