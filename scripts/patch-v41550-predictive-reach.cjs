#!/usr/bin/env node
'use strict';
const fs=require('node:fs');
const INDEX='index.html';
const FRAGMENT='scripts/fragments/v41550-predictive-reach.jsfrag';
function once(src,from,to,label){const i=src.indexOf(from);if(i<0)throw new Error('missing '+label);if(src.indexOf(from,i+from.length)>=0)throw new Error('non-unique '+label);return src.slice(0,i)+to+src.slice(i+from.length);}
let html=fs.readFileSync(INDEX,'utf8');
if(html.includes("HCC_PREDICTIVE_OBSERVATORY_SCHEMA='hcc.predictive-reach-observatory/1'")){console.log('v4.155 predictive reach already materialized');process.exit(0);}
if(!html.includes("HCC_CHRONOMETRY_OBSERVATORY_SCHEMA='hcc.chronometry-observatory/1'"))throw new Error('v4.154 chronometry workspace must be materialized first');
const moduleTag=html.match(/<script\s+type=["']module["'][^>]*>/i);if(!moduleTag)throw new Error('main module tag missing');
const imp="\nimport {validateReachArtifact as hccValidateReachArtifact, controlSemantics as hccControlSemantics, listReachControls as hccListReachControls, forecastReach as hccForecastReach} from './core/prediction/reach-forecast.mjs';";
html=once(html,moduleTag[0],moduleTag[0]+imp,'module import anchor');
html=once(html,
"const PANEL_IDS=['atlasNav','capPanel','flowPanel','navPanel','ctl','info','zpPanel','bixPanel','smithPanel','objectPanel','atlasPanel','oscPanel','xrCheck','motionPanel','vectorPanel','selCard'];",
"const PANEL_IDS=['atlasNav','capPanel','flowPanel','navPanel','ctl','info','zpPanel','bixPanel','smithPanel','objectPanel','atlasPanel','predictivePanel','oscPanel','xrCheck','motionPanel','vectorPanel','selCard'];",
'panel registry');
html=once(html,"atlasPanel:'Atlas QA',oscPanel:'Oscillators',","atlasPanel:'Atlas QA',predictivePanel:'Predictive Observatory',oscPanel:'Oscillators',",'panel title registry');
const atlasBtn='<button class="btn" id="atlasBtn" title="Runtime data contracts, provenance, uncertainty and scorecards">📊 QA Atlas</button>';
html=once(html,atlasBtn,atlasBtn+'\n  <button class="btn" id="predictiveBtn" title="Measured cross-laboratory intervention forecasts with fail-closed scaling-law gates">⌁ Predictive Observatory</button>','More-menu QA button');
const more='<div id="moreMenu" hidden role="menu" aria-label="More tools">';
const panel='<div class="panel" id="predictivePanel" style="display:none"><h3>⌁ Predictive Reach Observatory</h3><div class="note">Loading measured reach network…</div></div>\n';
html=once(html,more,panel+more,'predictive panel mount');
const predBus='    <div id="predBusControls" data-signature="${esc(predictionOutputSignature(v))}">${predictionBusControlsHTML(v)}</div>';
html=once(html,predBus,'    <div class="ctlrow"><button class="btn" type="button" data-predictive-reach-open title="Open the measured cross-laboratory intervention map">⌁ Predictive Reach</button></div>\n'+predBus,'Prediction Workbench entry');
const fragment=fs.readFileSync(FRAGMENT,'utf8').trim();
/* ── AN INSERTION POINT IS NOT NEUTRAL ────────────────────────────────────────
   This anchored the fragment immediately BEFORE `function observeCycle(key){`,
   which was a fine boundary in 4.155 and is not one now.
   docs/verify-cycle-navigation.cjs slices index.html from `const HCC_CYCLE_VIEWS=`
   to exactly that string and runs the slice in a bare vm context, so anything
   placed there is executed with none of the atlas around it: the fragment's
   registerPanelRenderer call threw a ReferenceError and a check about cycle
   navigation went red over a predictive-observatory feature it has no opinion on.
   The fragment is standalone and only needs module scope before first use, so it
   goes AFTER that function instead — outside every window another check cuts. */
html=once(html,'\nfunction updateCyc(dt){',fragment+'\nfunction updateCyc(dt){','runtime boundary');
fs.writeFileSync(INDEX,html);
console.log('materialized hcc.predictive-reach-observatory/1');
