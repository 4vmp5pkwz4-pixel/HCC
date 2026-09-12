import {readFileSync,writeFileSync} from 'node:fs';
const p='index.html';let s=readFileSync(p,'utf8');
const marker='globalThis.FBS3R_QA=';
if(!s.includes(marker)) throw new Error('FBS3R_QA marker not found');
const inject=`globalThis.__ZERO_DIAG=()=>{const d=nexusDiagnostics(),C=nexusStructuralCalibration('all');return {nexus:{nodes:NEXUS_VIEWS.length,relations:NEXUS_RELATIONS.length,duplicates:d.duplicates,unresolved:d.unresolved,isolated:d.isolated,components:d.components,notInS3:NEXUS_VIEWS.filter(v=>!S3_VIEW_NAMES[v]),notInLabRegistry:NEXUS_VIEWS.filter(v=>!LAB_BY_ID.has(v)),labsNotInNexus:LAB_REGISTRY.map(x=>x.id).filter(v=>v!=='nexus'&&!NEXUS_VIEWS.includes(v))},calibration:{tested:C.tested,relations:NEXUS_RELATIONS.length,recall5:C.recall_at_5},panels:{predictiveScope:panelScopeOf('predictivePanel'),predictiveDock:document.querySelectorAll('#panelDock [data-panel="predictivePanel"]').length},scales:{declaredKinds:Object.keys(scaleSurvey().kinds).length,stackCapacity:scalesObjs?.stackLabs?.length||0}};};\n`;
s=s.replace(marker,inject+marker);writeFileSync(p,s);console.log('instrumented');
