#!/usr/bin/env node
'use strict';
const fs=require('fs');
const path='index.html';
let s=fs.readFileSync(path,'utf8');
const marker='HCC v4.151 · FIRST-PRINCIPLES READINESS MOUNT';
if(s.includes(marker)){console.log('First-Principles readiness mount already present');process.exit(0);}
if(!s.includes('HCC v4.151 · FIRST-PRINCIPLES LENS'))throw new Error('visual Lens must be materialized first');
if(!s.includes("HCC_ATLAS_INTEGRATION_SCHEMA = 'hcc.atlas-integration/1'"))throw new Error('Atlas Integration Bus must be materialized before readiness mount');

const start=`(function(){\n'use strict';\nconst ATLAS=globalThis.HCC_ATLAS_INTEGRATION;\nconst FP=globalThis.HCC_FIRST_PRINCIPLES;\nif(!FP||document.getElementById('hccFpTrigger')) return;`;
const replacement=`(function(){\n'use strict';\n/* ${marker}\n   The Lens is a view over authoritative runtime contracts, so it mounts only after the\n   document and HCC_API readiness boundary. It never polls and never owns an animation loop. */\nasync function hccFpMount(){\nif(document.getElementById('hccFpTrigger')) return;\nlet ATLAS=globalThis.HCC_ATLAS_INTEGRATION;\nlet FP=globalThis.HCC_FIRST_PRINCIPLES;\ntry{if(globalThis.HCC_API&&HCC_API.ready)await HCC_API.ready({timeout:10000});}catch{}\nATLAS=globalThis.HCC_ATLAS_INTEGRATION||ATLAS;\nFP=globalThis.HCC_FIRST_PRINCIPLES||FP;\nif(!FP||!ATLAS)throw new Error('First-Principles runtime or Atlas Integration Bus unavailable at readiness boundary');`;
if(!s.includes(start))throw new Error('integrated Lens bootstrap anchor not found');
s=s.replace(start,replacement);

const end=`globalThis.hccFpOpenLens=hccFpOpenLens;globalThis.hccFpCloseLens=hccFpCloseLens;\n})();\n</script>\n<!-- END HCC v4.151 FIRST-PRINCIPLES LENS -->`;
const endReplacement=`globalThis.hccFpOpenLens=hccFpOpenLens;globalThis.hccFpCloseLens=hccFpCloseLens;\n}\nif(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>{void hccFpMount();},{once:true});\nelse void hccFpMount();\n})();\n</script>\n<!-- END HCC v4.151 FIRST-PRINCIPLES LENS -->`;
if(!s.includes(end))throw new Error('Lens closure anchor not found');
s=s.replace(end,endReplacement);
fs.writeFileSync(path,s);
console.log('mounted First-Principles Lens from DOM/HCC_API readiness boundary');
