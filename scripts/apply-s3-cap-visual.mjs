import {readFileSync,writeFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {resolve,dirname} from 'node:path';
/* Small opt-in patch to the legacy 20 MB self-contained atlas entrypoint.
 * Default --check never mutates. --apply writes the verified patch.
 * DO NOT treat patched source as merge-ready without native-browser/XR review.
 */
const file=resolve(dirname(fileURLToPath(import.meta.url)),'../index.html');
const patchIndex=function patchIndex(source) {
 let s=source;
 const names=[];
 const replace=(a,b,n)=>{
   const i=s.indexOf(a);
   if(i<0||s.indexOf(a,i+a.length)!==-1)throw new Error("Invalid or ambiguous anchor: "+n);
   s=s.slice(0,i)+b+s.slice(i+a.length);names.push(n);
 };
 replace("import {createButterflyScene, butterflyControlsHTML, VIEWS as BUTTERFLY_VIEWS} from './visual/galactic-butterfly.mjs';",
 "import {createButterflyScene, butterflyControlsHTML, VIEWS as BUTTERFLY_VIEWS} from './visual/galactic-butterfly.mjs';\n"+
 "import {mountS3CapObservability} from './visual/s3-cap-observability.mjs';\n"+
 "import {witnessFraction as capWitness, inverseAmplificationAtLeast as capInverse} from './core/math/s3-cap-observability.mjs';", "imports");
 replace("const s3LabGroup = new THREE.Group(); s3LabGroup.visible=false; s3Group.add(s3LabGroup);\nconst CLAB =",
 "const s3LabGroup = new THREE.Group(); s3LabGroup.visible=false; s3Group.add(s3LabGroup);\n"+
 "const CAPOBS = mountS3CapObservability({THREE,S3M,parent:s3LabGroup,RU});\nconst CLAB =", "scene");
 replace("chiA:0.55, chiB:0.85, arc:true, frames:true",
 "chiA:0.55, chiB:0.85, arc:true, frames:true, obsOn:false, obsL:3", "state");
 replace("    refreshReadout();\n  }\n  function refreshReadout(){",
 "    matA.opacity=P.obsOn?.14:.3;\n    CAPOBS.update({center:P.A,chi:P.chiA,L:P.obsL,enabled:P.obsOn});\n"+
 "    refreshReadout();\n  }\n  function refreshReadout(){", "model geometry");
 replace("  }\n  function setCenter(which, preset){",
 `    const o=ctl.querySelector('#capObsOut');
    if(o){
      if(P.obsOn){ const r=capWitness(P.obsL,P.chiA);
        o.textContent='S³ · L='+P.obsL+' · χ='+P.chiA.toFixed(3)
          +' · cap energy='+r.toExponential(3)
          +' · inverse instability ≥ '+capInverse(P.obsL,P.chiA).toExponential(3)+'×';
      }else o.textContent=TT('Enable field','Включить поле','Feld aktivieren');
    }
  }
  function setCenter(which, preset){`, "readout");
 const uiStart=s.indexOf("else if(V==='lab') body = `"),uiEnd=s.indexOf("else if(V==='ring') body = `",uiStart);
 if(uiStart<0||uiEnd<uiStart)throw new Error("UI block missing");
 let ui=s.slice(uiStart,uiEnd);
 const anchor='    <div class="sect"><b>Invariant readout</b>';
 if(!ui.includes(anchor))throw new Error("UI marker missing");
 const extra=`    <div class="sect"><b>\${TT('Spectral observability · S³ cap',
     'Спектральная наблюдаемость · S³-шапка','Spektrale Beobachtbarkeit · S³-Kappe')}</b>
      <div class="ctlrow">
        <label>\${TT('Field','Поле','Feld')}</label>
        <input type="checkbox" id="capObsOn" \${CLAB.P.obsOn?'checked':''} aria-label="Show spectral cap field"></div>
      <div class="ctlrow">
        <label>\${TT('Harmonic band L','Полоса гармоник L','Harmonisches Band L')}</label>
        <input type="range" id="capObsL" min="0" max="12" step="1" value="\${CLAB.P.obsL}">
        <span class="val" id="capObsLV">L = \${CLAB.P.obsL}</span></div>
      <div id="capObsOut" class="note" style="font-size:11px;font-variant-numeric:tabular-nums"></div>
      <div class="note" style="color:var(--dim);font-size:11px">
        \${TT('REFERENCE MODEL · geodesics and a white tracer represent a mathematical spectral mode, not photons. χ_A above controls the cap, not cosmic topology.',
         'ЭТАЛОННАЯ МОДЕЛЬ · геодезические и белый маркер представляют спектральную моду, не фотоны. χ_A задаёт область, не космологическую топологию.',
         'REFERENZMODELL · Geodäten und weißer Tracer sind eine mathematische Mode, keine Photonen. χ_A bestimmt die Kappe, keine kosmische Topologie.')}</div>
    </div>
`;
 ui=ui.replace(anchor,extra+anchor);
 s=s.slice(0,uiStart)+ui+s.slice(uiEnd);
 names.push("controls");
 const controlAnchor="      ctl.querySelector('#labFr').onchange  = e=>{ CLAB.P.frames=e.target.checked; upd(); };";
 replace(controlAnchor,controlAnchor+
 "\n      ctl.querySelector('#capObsOn').onchange = e=>{ CLAB.P.obsOn=e.target.checked; upd(); };"+
 "\n      ctl.querySelector('#capObsL').oninput = e=>{ CLAB.P.obsL=Math.round(+e.target.value); upd(); };", "events");
 replace("    } else if(state.s3view==='lab'){\n      const chiAB=S3M.chi(CLAB.P.A,CLAB.P.B);",
 "    } else if(state.s3view==='lab'){\n      CAPOBS.tick(labDt);\n      const chiAB=S3M.chi(CLAB.P.A,CLAB.P.B);", "tick");
 const hud="      hudSub.textContent = 'mathematical basepoints in the conditional S³ reconstruction · stereographic view · χ-screens are round spheres';";
 replace(hud,hud+"\n      if(CLAB.P.obsOn){"+
 "hudBig.textContent+=' · spectral band L='+CLAB.P.obsL;"+
 "hudSub.textContent='REFERENCE MODEL · spectral witness in geodesic cap · one white tracer · not detector data or topology detection';}", "HUD");
 const ctl="    if(q('#labChiBV')) q('#labChiBV').textContent = CLAB.P.chiB.toFixed(2)+' rad';";
 replace(ctl,ctl+"\n    if(q('#capObsLV')) q('#capObsLV').textContent = 'L = '+CLAB.P.obsL;", "value");
 return {source:s,changes:names};
};
let before=readFileSync(file,'utf8');
if(before.includes("const CAPOBS = mountS3CapObservability(")){
 console.log('S³ cap visual patch already applied; no change');process.exit(0);
}
const result=patchIndex(before);
if(!result.source.includes('CAPOBS.tick(labDt)')||!result.source.includes('id="capObsOn"'))
 throw new Error('patched entrypoint lacks visual control or tick');
if(process.argv.includes('--apply')) {
 writeFileSync(file,result.source,'utf8');
 console.log('Applied',result.changes.length,'S³ native optical bindings to index.html');
}else{
 console.log('CHECK PASS:',result.changes.length,'native scene bindings applicable to current index.html');
 console.log('Run: node scripts/apply-s3-cap-visual.mjs --apply');
}
