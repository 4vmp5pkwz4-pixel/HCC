import {readFileSync,writeFileSync} from 'node:fs';
const p='index.html';let s=readFileSync(p,'utf8');
function once(oldText,newText,label){const n=s.split(oldText).length-1;if(n!==1)throw new Error(`${label}: expected exactly one match, found ${n}`);s=s.replace(oldText,newText);console.log(`patched: ${label}`);}

once(
"const Gamma = chi => (chi - 0.5*Math.sin(2*chi)) / Math.PI;       // exact S³ ball volume fraction",
"/* ONE AUTHORITY FOR EVERY WORLD-SCALE SEAM. The two outer values are tied to\n   the canonical S³ modulus rather than copied numerically: the observer-centred\n   projection is allowed to pass the 548-Gly curvature-radius proxy before the\n   atlas changes topology view, then returns only after crossing back inside it.\n   The 8%/6% overlap is hysteresis, not a physical shell thickness. */\nconst SCALE_SEAMS=Object.freeze({\n  solarObsOutGly:26,\n  obsSolarInGly:0.020,\n  obsS3OutGly:S3.R*1.08,\n  s3ObsInGly:S3.R*0.94,\n  s3UnitGly:100\n});\nconst Gamma = chi => (chi - 0.5*Math.sin(2*chi)) / Math.PI;       // exact S³ ball volume fraction",
'shared world-scale seam authority');

once(
"if(layer==='cosmic' && d>26*GLY_AU && state.autoScaleHandoff!==false){",
"if(layer==='cosmic' && d>SCALE_SEAMS.solarObsOutGly*GLY_AU && state.autoScaleHandoff!==false){",
'Solar to Observable shared seam');

once(
"    setControlDistanceLimits(0.012,1600);   // 12 Mly … outside the 548-Gly curvature shell",
"    setControlDistanceLimits(SCALE_SEAMS.obsSolarInGly*0.6, SCALE_SEAMS.obsS3OutGly*1.35);\n    // The outer limit deliberately reaches beyond the canonical curvature-radius proxy,\n    // so the reader sees the 548-Gly shell before the global finite-S³ hand-off.",
'Observable limits span both neighbouring seams');

once(
"        if(homeAim && dObs<0.8 && dObs>=0.02)\n          hudBig.textContent=`→ home galaxy ${ (dObs*1000).toFixed(0) } Mly — keep zooming: hand-off to the Solar scale chain at 20 Mly`;\n        if(homeAim && dObs<0.02){",
"        if(homeAim && dObs<0.8 && dObs>=SCALE_SEAMS.obsSolarInGly)\n          hudBig.textContent=`→ home galaxy ${ (dObs*1000).toFixed(0) } Mly — keep zooming: hand-off to the Solar scale chain at ${(SCALE_SEAMS.obsSolarInGly*1000).toFixed(0)} Mly`;\n        if(homeAim && dObs>SCALE_SEAMS.obsS3OutGly && state.autoScaleHandoff!==false){\n          const dir=camera.position.clone().sub(controls.target);\n          if(dir.lengthSq()<1e-12) dir.set(0.4,0.3,1);\n          dir.normalize();\n          _autoScaleCd=2.0;\n          // The observer-centred R³ projection has now shown the canonical curvature\n          // modulus. Continue into the actual compact-carrier instrument: S³ has finite\n          // volume 2π²R³ but NO outer boundary (∂S³_R = ∅). Preserve direction and\n          // physical camera radius exactly while changing display units 1 Gly → 1/100.\n          state.s3view='sec'; setMode('s3');\n          controls.target.set(0,0,0);\n          camera.position.copy(dir).multiplyScalar(dObs/SCALE_SEAMS.s3UnitGly);\n          syncCameraClipping(true);\n          hudBig.textContent=`Scale ↑ finite S³ carrier — R=${S3.R.toFixed(1)} Gly · V=2π²R³=${S3.V.toExponential(3)} Gly³ · boundaryless`;\n        }\n        if(homeAim && dObs<SCALE_SEAMS.obsSolarInGly){",
'Observable outward finite-S3 and inward Solar seams');

once(
"  else if(state.mode==='s3'){\n    /* MULTIVIEW: step every visible laboratory in the SAME frame with the SAME dt,",
"  else if(state.mode==='s3'){\n    // Reverse leg of the same seam. Only the global section participates: zooming a\n    // specialist S³ laboratory must never throw the reader into another instrument.\n    if(state.s3view==='sec' && !state.landed && !renderer.xr.isPresenting && !focusAnim){\n      if(_autoScaleCd>0) _autoScaleCd-=dt;\n      else { const dS3=camera.position.distanceTo(controls.target), homeAim=controls.target.length()<0.08;\n        if(homeAim && dS3*SCALE_SEAMS.s3UnitGly<SCALE_SEAMS.s3ObsInGly){\n          const dir=camera.position.clone().sub(controls.target);\n          if(dir.lengthSq()<1e-12) dir.set(0.4,0.3,1);\n          dir.normalize();\n          _autoScaleCd=2.0;\n          setMode('obs'); controls.target.set(0,0,0);\n          camera.position.copy(dir).multiplyScalar(dS3*SCALE_SEAMS.s3UnitGly);\n          syncCameraClipping(true);\n          hudBig.textContent='Scale ↓ observer-centred Universe — curvature ledger, giant structures, particle horizon, then the Solar scale chain';\n        }\n      }\n    }\n    /* MULTIVIEW: step every visible laboratory in the SAME frame with the SAME dt,",
'finite-S3 return seam');

once(
"      <div class=\"ctlrow\" title=\"Zooming out past the cosmic-web layer hands the view over to the Observable Universe mode, keeping the direction and mapping the radius 1:1. Turn this off to stay in the Solar frame.\"><label>Auto hand-off to Observable Universe</label>\n        <input type=\"checkbox\" id=\"autoHandoff\" ${state.autoScaleHandoff!==false?'checked':''}></div>\n      <div class=\"note\" style=\"font-size:10.5px;color:var(--dim)\">The zoom chain runs Solar System → Milky Way → Local Group → Cosmic web, and past the last of those it can continue INTO the Observable Universe mode — same sky, same direction, one unit becoming one gigalightyear. That last step changes which instrument you are in, so it is yours to allow: off, the zoom stops at the cosmic layer instead.</div>",
"      <div class=\"ctlrow\" title=\"Continuous world-scale chain: Solar System → Milky Way → Local Group → giant structures → Observable Universe → finite S³ carrier. Direction and physical radius are preserved at both mode seams.\"><label>Auto world-scale hand-offs</label>\n        <input type=\"checkbox\" id=\"autoHandoff\" ${state.autoScaleHandoff!==false?'checked':''}></div>\n      <div class=\"note\" style=\"font-size:10.5px;color:var(--dim)\">The zoom chain is continuous in both directions: Solar System → Milky Way → Local Group → cosmic web and named giant structures → Observable Universe → the canonical 548.3-Gly curvature-radius proxy → the finite S³ carrier. The last view has finite proper volume 2π²R³ but no outer wall (∂S³_R = ∅). Turn automatic hand-offs off to keep the current world instrument fixed.</div>",
'world-scale control copy');

writeFileSync(p,s);console.log('scale continuity source repairs written');
