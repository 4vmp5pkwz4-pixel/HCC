#!/usr/bin/env node
'use strict';

const fs=require('fs');
const TARGET_VERSION='4.151.1';
const TARGET_BUILD='linked-cycle-views-2026.09.06.1';
const OLD_VERSION='4.151.0';
const OLD_BUILD='first-principles-atlas-2026.09.05.1';

function read(p){return fs.readFileSync(p,'utf8');}
function write(p,s){fs.writeFileSync(p,s);}
function replaceOnce(s,from,to,label){
  const i=s.indexOf(from);
  if(i<0) throw new Error(`missing patch anchor: ${label}`);
  if(s.indexOf(from,i+from.length)>=0) throw new Error(`non-unique patch anchor: ${label}`);
  return s.slice(0,i)+to+s.slice(i+from.length);
}
function replaceRegexOnce(s,re,to,label){
  const flags=re.flags.includes('g')?re.flags:re.flags+'g';
  const rg=new RegExp(re.source,flags);
  const m=[...s.matchAll(rg)];
  if(m.length!==1) throw new Error(`${label}: expected one match, found ${m.length}`);
  const x=m[0], repl=typeof to==='function'?to(x):to;
  return s.slice(0,x.index)+repl+s.slice(x.index+x[0].length);
}

let html=read('index.html');
if(html.includes("hcc.cycles-linked-view/1")){
  console.log('linked Cycles view already materialized; refusing duplicate insertion');
} else {
  // 1. Add an explicit analytical frame to the existing Cycles selector.
  html=replaceRegexOnce(html,
    /<option value="antikythera"[^>]*>[^<]*Antikythera mechanism<\/option>/,
    m=>`<option value="linked" \${state.cycFrame==='linked'?'selected':''}>⟲ Linked analytical view</option>\n              ${m[0]}`,
    'Cycles frame selector');

  // 2. Replace the old private resonance animation accumulator with a deterministic
  //    phase derived from the same global epoch used by every Cycles instrument.
  html=replaceOnce(html,'let resoPulse=0;\nfunction updateCycResonance(dt){\n  resoPulse+=dt;\n  const A=state.cycPairA, B=state.cycPairB, pulse=0.78+0.22*Math.sin(resoPulse*3);',
`function updateCycResonance(dt){
  const A=state.cycPairA, B=state.cycPairB;
  const _ra=cycleByKey(A), _rb=cycleByKey(B);
  const _pa=cycLinkedPhaseOf(_ra), _pb=cycLinkedPhaseOf(_rb);
  const _raw=Math.abs(_pa-_pb), _phaseDistance=Math.min(_raw,1-_raw);
  const pulse=0.78+0.22*Math.cos(2*Math.PI*_phaseDistance);`,
    'resonance authoritative-time pulse');

  // 3. Insert the linked analytical instrument immediately before the Saros engine.
  const sarosAnchor='/* ── THE SAROS ENGINE · three hands that nearly meet';
  const sarosAt=html.indexOf(sarosAnchor);
  if(sarosAt<0) throw new Error('missing patch anchor: Saros engine boundary');
  const linked=String.raw`
/* ── HCC v4.151.1 · LINKED CYCLES ANALYTICAL VIEW ───────────────────────────
   One selected cycle pair, one authoritative epoch, four explicitly named analytical
   lenses. Edges are structural view links: this scene is not a physical causal graph. */
const HCC_CYCLES_LINKED_VIEW_SCHEMA='hcc.cycles-linked-view/1';
function cycLinkedPhaseOf(c){
  if(!c || !(c.days>0) || !Number.isFinite(state.epochDays)) return 0;
  const q=state.epochDays/c.days;
  return ((q%1)+1)%1;
}
function cycLinkedPhaseDistance(a,b){
  const d=Math.abs(a-b);
  return Math.min(d,1-d);
}
function cycLinkedCommensurabilityText(c){
  if(!c) return 'NO DECLARED INTEGER LOCK';
  if(typeof c.label==='string'&&c.label) return c.label;
  const nums=Object.entries(c).filter(([,v])=>Number.isFinite(v)).slice(0,4);
  return nums.length?nums.map(([k,v])=>k+'='+fmt(v,6)).join(' · '):'STRUCTURAL RELATION AVAILABLE';
}

const cycLinkedInst=new THREE.Group(); cycGroup.add(cycLinkedInst);
cycLinkedInst.userData.schema=HCC_CYCLES_LINKED_VIEW_SCHEMA;
cycLinkedInst.userData.relation='STRUCTURAL VIEW LINK';

const cycLinkedCore=new THREE.Group(); cycLinkedInst.add(cycLinkedCore);
const cycLinkedRingA=new THREE.Mesh(
  new THREE.TorusGeometry(2.05,.075,12,72),
  new THREE.MeshBasicMaterial({color:0xe7c778,transparent:true,opacity:.9,depthWrite:false}));
const cycLinkedRingB=new THREE.Mesh(
  new THREE.TorusGeometry(1.48,.06,12,64),
  new THREE.MeshBasicMaterial({color:0x79c7ff,transparent:true,opacity:.82,depthWrite:false}));
cycLinkedRingB.rotation.x=Math.PI/2;
cycLinkedCore.add(cycLinkedRingA,cycLinkedRingB);
const cycLinkedMarkerA=new THREE.Mesh(new THREE.SphereGeometry(.16,14,10),new THREE.MeshBasicMaterial({color:0xffdc78}));
const cycLinkedMarkerB=new THREE.Mesh(new THREE.SphereGeometry(.14,14,10),new THREE.MeshBasicMaterial({color:0x85d5ff}));
cycLinkedCore.add(cycLinkedMarkerA,cycLinkedMarkerB);
const cycLinkedHub=new THREE.Mesh(new THREE.IcosahedronGeometry(.5,2),new THREE.MeshBasicMaterial({color:0xd9c5ff,wireframe:true,transparent:true,opacity:.72}));
cycLinkedCore.add(cycLinkedHub);

const cycLinkedNodeGeo=new THREE.SphereGeometry(.34,18,12);
const cycLinkedSpecs=[
  {key:'information',title:'02 · INTEGRATED INFORMATION',pos:new THREE.Vector3(-5.0,2.7,0),color:0x66d9ff},
  {key:'complexity',title:'03 · INTEGRATED COMPLEXITY',pos:new THREE.Vector3(5.0,2.7,0),color:0xc6a7ff},
  {key:'scaling',title:'04 · UNIFIED SCALING',pos:new THREE.Vector3(5.0,-2.7,0),color:0xf5c56b},
  {key:'observer',title:'05 · OBSERVER SELECTION',pos:new THREE.Vector3(-5.0,-2.7,0),color:0x86efb5}
];
const cycLinkedNodes=new Map(), cycLinkedReadout=new Map();
for(const spec of cycLinkedSpecs){
  const node=new THREE.Mesh(cycLinkedNodeGeo,new THREE.MeshBasicMaterial({color:spec.color,transparent:true,opacity:.92}));
  node.position.copy(spec.pos); cycLinkedInst.add(node); cycLinkedNodes.set(spec.key,node);
  const title=mkLabel(spec.title,'label const'); title.position.copy(spec.pos).add(new THREE.Vector3(0,.72,0)); cycLinkedInst.add(title);
  const read=mkLabel('—','label'); read.position.copy(spec.pos).add(new THREE.Vector3(0,-.65,0));
  if(read.element){ read.element.dataset.cycLinkedReadout=spec.key; read.element.style.maxWidth='250px'; read.element.style.textAlign='center'; }
  cycLinkedInst.add(read); cycLinkedReadout.set(spec.key,read);
}
const cycLinkedTitle=mkLabel('LINKED CYCLES · ONE EPOCH · FOUR ANALYTICAL LENSES','label const');
cycLinkedTitle.position.set(0,4.25,0);cycLinkedInst.add(cycLinkedTitle);
const cycLinkedFirewall=mkLabel('STRUCTURAL VIEW LINK · not IIT Φ · not a physical causal graph','label');
cycLinkedFirewall.position.set(0,-4.15,0);cycLinkedInst.add(cycLinkedFirewall);
function cycLinkedStaticLine(a,b,opacity=.28){
  const g=new THREE.BufferGeometry().setFromPoints([a,b]);
  const l=new THREE.Line(g,new THREE.LineBasicMaterial({color:0xb9c8dd,transparent:true,opacity,depthWrite:false}));
  cycLinkedInst.add(l); return l;
}
const _linkedZero=new THREE.Vector3(0,0,0);
for(const spec of cycLinkedSpecs) cycLinkedStaticLine(_linkedZero,spec.pos,.34);
for(let i=0;i<cycLinkedSpecs.length;i++) cycLinkedStaticLine(cycLinkedSpecs[i].pos,cycLinkedSpecs[(i+1)%cycLinkedSpecs.length].pos,.18);

function cycLinkedSetReadout(key,text){
  const o=cycLinkedReadout.get(key);
  if(o&&o.element) o.element.textContent=text;
}
function updateCycLinkedView(){
  const a=cycleByKey(state.cycPairA), b=cycleByKey(state.cycPairB);
  if(!a||!b) return;
  const pa=cycLinkedPhaseOf(a), pb=cycLinkedPhaseOf(b), d=cycLinkedPhaseDistance(pa,pb);
  const information=Math.max(0,1-2*d);
  const comm=cycleCommensurability(a,b);
  const ratio=(a.days>0&&b.days>0)?b.days/a.days:NaN;
  const logScale=ratio>0?Math.log10(ratio):NaN;
  const pair=(a.name||a.label||a.key||state.cycPairA)+' ↔ '+(b.name||b.label||b.key||state.cycPairB);

  const aa=2*Math.PI*pa, ab=2*Math.PI*pb;
  cycLinkedMarkerA.position.set(2.05*Math.cos(aa),2.05*Math.sin(aa),0);
  cycLinkedMarkerB.position.set(1.48*Math.cos(ab),0,1.48*Math.sin(ab));
  cycLinkedRingA.rotation.z=aa;
  cycLinkedRingB.rotation.y=ab;
  cycLinkedHub.rotation.set(aa*.22,ab*.27,(aa-ab)*.18);
  const syncGlow=.72+.28*information;
  for(const node of cycLinkedNodes.values()) node.scale.setScalar(syncGlow);

  cycLinkedSetReadout('information','phase proximity = '+fmt(information,5)+' · not IIT Φ');
  cycLinkedSetReadout('complexity',cycLinkedCommensurabilityText(comm));
  cycLinkedSetReadout('scaling','B/A = '+fmt(ratio,7)+' · log₁₀ = '+fmt(logScale,5));
  cycLinkedSetReadout('observer',pair+' · epoch '+fmt(state.epochDays,3)+' d');
}

registerSel('cycLinkedView',{
  name:'Linked analytical cycle view',mode:'cyc',tier:'M',kind:'representation',
  accuracy:'representation / structural relation',
  forbiddenClaims:[
    'Integrated Information is a normalized phase-proximity view score, not IIT Φ.',
    'Integrated Complexity reports selected commensurability structure, not a universal complexity measure.',
    'Unified Scaling is the selected mean-period ratio/log-ratio, not a universal scaling law.',
    'Layout and edges are non-metric STRUCTURAL VIEW LINK relations, not a physical causal graph.'
  ],
  desc:'Four synchronized analytical lenses over the currently selected Cycles pair, driven only by the authoritative Atlas epoch.',
  getPos:()=>cycLinkedInst.position.clone(),focusDist:()=>15,
  rows:()=>{
    const a=cycleByKey(state.cycPairA),b=cycleByKey(state.cycPairB);
    if(!a||!b) return [];
    const pa=cycLinkedPhaseOf(a),pb=cycLinkedPhaseOf(b),ratio=b.days/a.days;
    return [
      ['schema',HCC_CYCLES_LINKED_VIEW_SCHEMA],
      ['pair',(a.name||state.cycPairA)+' ↔ '+(b.name||state.cycPairB)],
      ['phase distance',fmt(cycLinkedPhaseDistance(pa,pb),7)],
      ['period ratio B/A',fmt(ratio,9)],
      ['epoch',fmt(state.epochDays,6)+' d'],
      ['relation','STRUCTURAL VIEW LINK']
    ];
  }
});
/* ── END LINKED CYCLES VIEW ───────────────────────────────────────────────── */

`;
  html=html.slice(0,sarosAt)+linked+html.slice(sarosAt);

  // 4. The Cycles scene owns lifecycle and visibility; no additional animation loop exists.
  html=replaceOnce(html,
    "cycResonanceInst.visible = frame==='hierarchy'||frame==='resonance';\n  if(cycResonanceInst.visible) updateCycResonance(dt);",
    "cycResonanceInst.visible = frame==='hierarchy'||frame==='resonance';\n  if(cycResonanceInst.visible) updateCycResonance(dt);\n  cycLinkedInst.visible = frame==='linked';\n  if(cycLinkedInst.visible) updateCycLinkedView();",
    'Cycles update lifecycle');

  // 5. Linked frame gets its own camera focus through the existing selection/focus engine.
  html=replaceOnce(html,'function applyCycFrameView(){',
`function applyCycFrameView(){
  if(state.cycFrame==='linked'){
    const linked=SELECT.get('cycLinkedView');
    if(linked) focusOn(linked);
    return;
  }`, 'Cycles frame camera');

  // 6. Selection context knows how to route the linked instrument back into its owning frame.
  html=replaceRegexOnce(html,
    /const want = key==='cycGal'\?'gal' : key==='cycPrec'\?'geo' : key==='cycPhaseAtlas'\?'phase'\s*:\s*key==='cycResonanceWeb'\?'resonance' : 'helio';/,
    `const want = key==='cycGal'?'gal' : key==='cycPrec'?'geo' : key==='cycPhaseAtlas'?'phase'\n               : key==='cycResonanceWeb'?'resonance' : key==='cycLinkedView'?'linked' : 'helio';`,
    'Cycles selection context');
  html=replaceOnce(html,
    "resonance:['hierarchy','resonance'], helio:['hierarchy','helio','geo']",
    "resonance:['hierarchy','resonance'], linked:['linked'], helio:['hierarchy','helio','geo']",
    'Cycles frame visibility map');
}

html=html.split(OLD_BUILD).join(TARGET_BUILD);
html=html.split(OLD_VERSION).join(TARGET_VERSION);
write('index.html',html);
const version=JSON.parse(read('version.json'));
version.version=TARGET_VERSION;
version.build=TARGET_BUILD;
write('version.json',JSON.stringify(version,null,2)+'\n');
console.log(`materialized v${TARGET_VERSION} · ${TARGET_BUILD} · linked Cycles analytical view`);
