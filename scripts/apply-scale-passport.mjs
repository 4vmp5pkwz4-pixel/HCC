#!/usr/bin/env node
import { readFileSync, writeFileSync } from 'node:fs';

const path='index.html';
let s=readFileSync(path,'utf8');
const original=s;

function replaceOnce(from,to,label){
  const n=s.split(from).length-1;
  if(n!==1) throw new Error(label+' expected once, found '+n);
  s=s.replace(from,to);
}

/* Remove a frozen historical radius from explanatory prose. The seam itself was
   already derived from S3.R; the comment must follow the same authority. */
replaceOnce(
  'projection is allowed to pass the 548-Gly curvature-radius proxy before the',
  'projection is allowed to pass the canonical curvature-radius proxy before the',
  'scale-seam prose authority'
);

replaceOnce(
  '#ctxSpace{max-width:330px;color:#c6cede}\n  #ctxPerf{font-variant-numeric:tabular-nums;color:#9ce3c6}',
  '#ctxSpace{max-width:330px;color:#c6cede}\n  #ctxScale{max-width:260px;color:#b7cfe8}\n  #ctxPerf{font-variant-numeric:tabular-nums;color:#9ce3c6}',
  'context rail scale width'
);
replaceOnce(
  '#ctxSpace{max-width:42vw} #ctxPerf{display:none}',
  '#ctxSpace{max-width:38vw} #ctxScale{max-width:44vw} #ctxPerf{display:none}',
  'mobile context rail scale width'
);

const anchor='};\nlet contextRailAt=0;\nfunction updateContextRail(force=false){';
const at=s.indexOf('const CONTEXT_META={');
const anchorAt=s.indexOf(anchor,at);
if(at<0||anchorAt<0) throw new Error('CONTEXT_META insertion anchor missing');

const passport=`};
function hccScalePassport(){
  const mode=state.mode||'solar';
  const layer=state.solarScaleLayer||'local';
  const fmt=(x,d=3)=>Number.isFinite(x)?(Math.abs(x)>=100?x.toFixed(1):x.toFixed(d)):'—';
  const make=(kind,compact,detail,extra={})=>({
    schema:'hcc.scale-passport/1',mode,world:zoomWorldKey(),kind,compact,detail,...extra
  });
  if(mode==='solar'){
    const out=SCALE_SEAMS.solarObsOutGly;
    const layerName=({local:'Solar System',galactic:'Milky Way',andromeda:'Local Group',cosmic:'Cosmic web'})[layer]||layer;
    const compact=layer==='cosmic'?\`AU · Obs seam \${fmt(out)} Gly\`:\`1u=1 AU · \${layerName}\`;
    return make('metric+semantic-layer',compact,
      \`metric R³ scene with semantic framing layers; internal Solar layers change framing, not the underlying direction field; the Observable handoff is navigation, not a physical boundary. Outward seam: \${fmt(out)} Gly.\`,
      {unit:'AU',layer,seams:{outward:{to:'obs',value:out,unit:'Gly',kind:'navigation-handoff'}}});
  }
  if(mode==='obs'){
    const inward=SCALE_SEAMS.obsSolarInGly, outward=SCALE_SEAMS.obsS3OutGly;
    return make('metric+representation-seams',
      \`1u=1 Gly · Solar↙ \${fmt(inward)} · S³↗ \${fmt(outward)}\`,
      \`observer-centred comoving display; inward Solar handoff at \${fmt(inward)} Gly; outward S³ handoff enters a conditional carrier representation at \${fmt(outward)} Gly through a similarity map. The overlap is navigation hysteresis, not a physical boundary or shell thickness.\`,
      {unit:'Gly',seams:{inward:{to:'solar',value:inward,unit:'Gly'},outward:{to:'s3',value:outward,unit:'Gly',kind:'representation-handoff'}}});
  }
  if(mode==='s3'){
    const inward=SCALE_SEAMS.s3ObsInGly, unit=SCALE_SEAMS.s3UnitGly;
    return make('conditional-reconstruction',
      \`1u=\${fmt(unit,0)} Gly · conditional S³\`,
      \`conditional reconstruction; stereographic carrier display with 1 scene unit = \${fmt(unit,0)} Gly; not established global topology. Return seam to the Observable representation: \${fmt(inward)} Gly. The hysteresis is navigation, not shell thickness.\`,
      {unitGly:unit,seams:{inward:{to:'obs',value:inward,unit:'Gly',kind:'representation-handoff'}},epistemic:'conditional reconstruction'});
  }
  if(mode==='cyc') return make('clock-coordination','clock-linked · no spatial seam',
    'no spatial seam; shared epoch coordinates instruments; it does not make their clock meanings identical.',
    {unit:'instrument-specific time/phase'});
  if(mode==='fbs') return make('ansatz-scale','N-scale · ×φ ansatz · non-metric',
    'ansatz/model scale coordinate N with ×φ steps; not a measured ruler or universal law.',
    {unit:'N / phi-step',epistemic:'ansatz'});
  if(mode==='field') return make('model-space','reduced/model units · no metric seam',
    'reduced/model units; no cross-world metric identity. Solver coordinates remain local to the active model.',
    {unit:'model-specific'});
  if(mode==='fractal') return make('semantic-zoom','semantic zoom · non-metric',
    'semantic zoom; not physical distance. Iteration depth and projection scale are display/model coordinates.',
    {unit:'semantic'});
  return make('local-model','local model units','local model coordinates; no implicit cross-world metric identity.');
}
globalThis.HCC_SCALE_PASSPORT=()=>hccScalePassport();
let contextRailAt=0;
function updateContextRail(force=false){`;

s=s.slice(0,anchorAt)+passport+s.slice(anchorAt+anchor.length);

replaceOnce(
  '  let name=meta[0], space=meta[1], scale=meta[2];',
  '  let name=meta[0], space=meta[1];',
  'context rail local fields'
);
replaceOnce(
  "    const layer=state.solarScaleLayer||'local'; name=({galactic:'Milky Way',andromeda:'Local Group',cosmic:'Cosmic web'})[layer]||name;\n    scale='semantic gateway · directions invariant';",
  "    const layer=state.solarScaleLayer||'local'; name=({galactic:'Milky Way',andromeda:'Local Group',cosmic:'Cosmic web'})[layer]||name;",
  'solar context rail legacy scale copy'
);
replaceOnce(
  "  document.getElementById('ctxMode').textContent=name;\n  document.getElementById('ctxSpace').textContent=space;\n  document.getElementById('ctxScale').textContent=scale;",
  "  const passport=hccScalePassport();\n  document.getElementById('ctxMode').textContent=name;\n  document.getElementById('ctxSpace').textContent=space;\n  const scaleEl=document.getElementById('ctxScale');\n  scaleEl.textContent=passport.compact; scaleEl.title=passport.detail; scaleEl.dataset.scaleKind=passport.kind;\n  scaleEl.setAttribute('aria-label','Scale passport: '+passport.detail);\n  rail.dataset.scaleKind=passport.kind;\n  rail.setAttribute('aria-label','Current scientific context. '+name+'. '+space+'. Scale passport: '+passport.detail);",
  'context rail passport binding'
);

if(!s.includes("globalThis.HCC_SCALE_PASSPORT=()=>hccScalePassport();")) throw new Error('scale passport API missing after patch');
if(s===original) throw new Error('no source change');
writeFileSync(path,s);
console.log('scale passport applied to existing context rail');
