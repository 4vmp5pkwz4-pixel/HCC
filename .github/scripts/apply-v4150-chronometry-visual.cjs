'use strict';
const fs=require('fs');
const p='index.html';
let s=fs.readFileSync(p,'utf8');

function once(oldText,newText,label){
  const n=s.split(oldText).length-1;
  if(n!==1) throw new Error(`${label}: expected one anchor, found ${n}`);
  s=s.replace(oldText,newText);
}

if(s.includes('const cycChronometryInst=new THREE.Group()'))
  throw new Error('Chronometry visual station already exists');

const sarosAnchor=`const cycSarosInst=new THREE.Group(); cycSarosInst.position.set(26,0,-24); cycGroup.add(cycSarosInst);`;
const visual=`/* ══ ANCIENT CHRONOMETRY OBSERVATORY · SOURCE SPACE ↔ SCIENCE SPACE ═══════
   This is deliberately TWO spaces.  The left half is provenance geometry: a term is
   attached to the text that defines it, and same-name definitions are kept apart.  The
   right half is quantity geometry: only typed time intervals enter the logarithmic rail.
   A short Euclidean distance between the halves is NEVER evidence of physical identity.

   DEPTH IS EPISTEMIC STATE, NOT DECORATION:
     z =  0   exact textual/source definition
     z = -1   hypothesis awaiting an independent phase anchor
     z = -2   historical astronomy awaiting source-epoch correction

   ONE UNIVERSE, ONE CLOCK: the only moving element is a display cursor derived from
   state.epochDays.  It does not create or validate an ancient phase anchor. */
const cycChronometryInst=new THREE.Group();
cycChronometryInst.position.set(0,-13,-24); cycGroup.add(cycChronometryInst);
const chronometrySourceNodes=[];
const chronometryScienceNodes=[];
let chronometryEpochNeedle=null;
let chronometryEpochLab=null;
let chronometryPick=null;
function chronometryLine(a,b,color=0x6f7ba8,opacity=.45){
  const g=new THREE.BufferGeometry().setFromPoints([a,b]);
  return new THREE.Line(g,new THREE.LineBasicMaterial({color,transparent:true,opacity}));
}
function chronometryDot(x,y,z,color,scale=.19){
  const m=new THREE.Mesh(new THREE.SphereGeometry(scale,18,12),
    new THREE.MeshStandardMaterial({color,emissive:color,emissiveIntensity:.35,metalness:.45,roughness:.32}));
  m.position.set(x,y,z); cycChronometryInst.add(m); return m;
}
function chronometryYearY(years){
  /* display coordinate only: 1 day .. 100 kyr spans the useful historical rail */
  const lo=Math.log10(1/365.2425), hi=Math.log10(1e5), q=Math.log10(Math.max(1/365.2425,years));
  return -5+10*Math.max(0,Math.min(1,(q-lo)/(hi-lo)));
}
{
  const sourceTitle=mkLabel('SOURCE SPACE · source-qualified definitions','label const');
  sourceTitle.position.set(-7.2,6.5,0); cycChronometryInst.add(sourceTitle);
  const sourceSub=mkLabel('Same term / different definition · conflicts remain split','label dim');
  sourceSub.position.set(-7.2,5.8,0); cycChronometryInst.add(sourceSub);
  const scienceTitle=mkLabel('SCIENCE SPACE · typed temporal comparisons','label const');
  scienceTitle.position.set(7.1,6.5,0); cycChronometryInst.add(scienceTitle);
  const scienceSub=mkLabel('position = log(period) · depth = epistemic state · distance is non-metric','label dim');
  scienceSub.position.set(7.1,5.8,0); cycChronometryInst.add(scienceSub);

  /* A thin central firewall is a visual boundary, not a conversion operator. */
  const wall=chronometryLine(new THREE.Vector3(0,-6,0),new THREE.Vector3(0,6,0),0xd4af6a,.32);
  cycChronometryInst.add(wall);
  const wallLab=mkLabel('TYPE / PROVENANCE FIREWALL','label axis'); wallLab.position.set(0,5.4,.1); cycChronometryInst.add(wallLab);

  const sourceRows=[
    {id:'abhidharmakosa.ksana',term:'kṣaṇa',text:'Abhidharmakośa III.88–89',y:3.8,col:0x8fd0ff},
    {id:'bhagavata.ksana',term:'kṣaṇa',text:'Bhāgavata 3.11.7–8',y:2.5,col:0x8fd0ff},
    {id:'arthasastra.truti',term:'truṭi',text:'Arthaśāstra II.20',y:.8,col:0xc69aff},
    {id:'bhagavata.truti',term:'truṭi',text:'Bhāgavata 3.11.6–8',y:-.5,col:0xc69aff},
    {id:'siddhantasiromani.truti',term:'truṭi',text:'Siddhāntaśiromaṇi · source-qualified',y:-1.8,col:0xc69aff}
  ];
  for(const r of sourceRows){
    const dot=chronometryDot(-7.2,r.y,0,r.col,.2); dot.userData={chronometrySource:r.id}; chronometrySourceNodes.push(dot);
    const lab=mkLabel(r.term+' · '+r.text,'label major'); lab.position.set(-6.8,r.y,0); cycChronometryInst.add(lab);
  }
  /* Conflict braces: same spelling, explicitly not one unit. */
  const kBrace=chronometryLine(new THREE.Vector3(-8.1,2.5,.05),new THREE.Vector3(-8.1,3.8,.05),0xffb36b,.9);
  const tBrace=chronometryLine(new THREE.Vector3(-8.1,-1.8,.05),new THREE.Vector3(-8.1,.8,.05),0xffb36b,.9);
  cycChronometryInst.add(kBrace,tBrace);
  const kc=mkLabel('Same term / different definition','label axis'); kc.position.set(-8.2,3.15,.08); cycChronometryInst.add(kc);
  const tc=mkLabel('Same term / different definition','label axis'); tc.position.set(-8.2,-.5,.08); cycChronometryInst.add(tc);

  const sourceGate=mkLabel('No source-name averaging · no universal SI identity','label dim');
  sourceGate.position.set(-7.2,-3.4,0); cycChronometryInst.add(sourceGate);

  /* Science-space logarithmic rail.  These are comparable time intervals; their z depth
     states what is known about the comparison, not how numerically close two values are. */
  const railX=7.0;
  const rail=chronometryLine(new THREE.Vector3(railX,-5,0),new THREE.Vector3(railX,5,0),0xd4af6a,.72);
  cycChronometryInst.add(rail);
  const ticks=[
    {years:1/365.2425,label:'1 day'},{years:1,label:'1 year'},{years:100,label:'100 y'},
    {years:1e4,label:'10 kyr'},{years:1e5,label:'100 kyr'}
  ];
  for(const q of ticks){
    const y=chronometryYearY(q.years);
    const tick=chronometryLine(new THREE.Vector3(railX-.18,y,0),new THREE.Vector3(railX+.18,y,0),0xd4af6a,.6);
    cycChronometryInst.add(tick);
    const l=mkLabel(q.label,'label dim'); l.position.set(railX+.45,y,0); cycChronometryInst.add(l);
  }

  const y21=chronometryYearY(21000), y42=chronometryYearY(42000);
  const j21=chronometryDot(railX-1.25,y21,-1,0xffd27a,.24); chronometryScienceNodes.push(j21);
  const j21l=mkLabel('Jain 21 kyr · HYPOTHESIS · NO PHASE ANCHOR','label major');
  j21l.position.set(railX-1.0,y21,-1); cycChronometryInst.add(j21l);
  const j42=chronometryDot(railX-1.25,y42,-1,0xff9d6e,.24); chronometryScienceNodes.push(j42);
  const j42l=mkLabel('DEPENDENT · 42k = 2 × 21k','label major');
  j42l.position.set(railX-1.0,y42,-1); cycChronometryInst.add(j42l);
  const dep=chronometryLine(j21.position.clone(),j42.position.clone(),0xff9d6e,.72); cycChronometryInst.add(dep);

  /* Six bootstrap astronomy records remain one pending-evaluation family until source
     epoch correction exists.  Their display cluster is separated in depth (z=-2). */
  const astroY=chronometryYearY(1);
  const astro=chronometryDot(railX-1.25,astroY,-2,0x75c7ff,.27); chronometryScienceNodes.push(astro);
  const astrol=mkLabel('Aryabhata · Daming · Shoushi · 6 benchmarks · PENDING_EPOCH_CORRECTION','label major');
  astrol.position.set(railX-1.0,astroY,-2); cycChronometryInst.add(astrol);

  /* Typed, explicitly non-equivalence conduits: source claim → admissible comparison
     station.  They do NOT connect kṣaṇa/truṭi conflicts to unrelated modern scales. */
  const jainSource=chronometryDot(-4.0,4.7,0,0xffd27a,.22);
  const jainLab=mkLabel('Jain avasarpini · exact textual closure = 10K','label major');
  jainLab.position.set(-3.7,4.7,0); cycChronometryInst.add(jainLab);
  const c21=chronometryLine(jainSource.position.clone(),j21.position.clone(),0xffd27a,.32); cycChronometryInst.add(c21);
  const c42=chronometryLine(jainSource.position.clone(),j42.position.clone(),0xff9d6e,.26); cycChronometryInst.add(c42);
  const conduitLab=mkLabel('typed time-interval hypothesis · not identity','label axis');
  conduitLab.position.set(2.0,3.7,-.5); cycChronometryInst.add(conduitLab);

  /* Shared Atlas-epoch dial. It is a display cursor only: without an independent ancient
     phase anchor it is forbidden to turn the 21 kyr hypothesis into phase consistency. */
  const dialX=7.0,dialY=-4.2;
  const dial=new THREE.Mesh(new THREE.TorusGeometry(1.25,.025,8,96),
    new THREE.MeshBasicMaterial({color:0x6f7ba8,transparent:true,opacity:.6}));
  dial.position.set(dialX,dialY,0); cycChronometryInst.add(dial);
  chronometryEpochNeedle=new THREE.Group(); chronometryEpochNeedle.position.set(dialX,dialY,0); cycChronometryInst.add(chronometryEpochNeedle);
  const ng=new THREE.CylinderGeometry(.025,.025,1.05,8); ng.translate(0,.525,0);
  const needle=new THREE.Mesh(ng,new THREE.MeshStandardMaterial({color:0xffe9a8,emissive:0xffe9a8,emissiveIntensity:.35}));
  chronometryEpochNeedle.add(needle);
  chronometryEpochLab=mkLabel('Atlas epoch cursor · NO PHASE ANCHOR','label dim');
  chronometryEpochLab.position.set(dialX,dialY-1.65,0); cycChronometryInst.add(chronometryEpochLab);

  chronometryPick=new THREE.Mesh(new THREE.SphereGeometry(.42,20,14),
    new THREE.MeshStandardMaterial({color:0xd4af6a,emissive:0xd4af6a,emissiveIntensity:.22,metalness:.7,roughness:.24}));
  chronometryPick.position.set(0,0,.25); cycChronometryInst.add(chronometryPick);
  const title=mkLabel('ANCIENT CHRONOMETRY OBSERVATORY · provenance before proximity','label const');
  title.position.set(0,7.35,.2); cycChronometryInst.add(title);
  cycChronometryInst.userData={sourceRows,scienceNodes:chronometryScienceNodes,epochLab:chronometryEpochLab};
}
function updateChronometryObservatory(){
  const epoch=Number.isFinite(state.epochDays)?state.epochDays:0;
  /* 25,772 y is the existing mean-precession diagnostic scale.  This dial is deliberately
     labelled NO PHASE ANCHOR: it visualizes the current Atlas coordinate only. */
  const phase=((((epoch/365.2425)/25772)%1)+1)%1;
  if(chronometryEpochNeedle) chronometryEpochNeedle.rotation.z=-2*Math.PI*phase;
  if(chronometryEpochLab?.element)
    chronometryEpochLab.element.innerHTML='Atlas epoch cursor · '+(phase*360).toFixed(2)+'° display phase · <b>NO PHASE ANCHOR</b>';
}

`;
once(sarosAnchor,visual+sarosAnchor,'Saros visual insertion');

const visibilityAnchor=`  cycResonanceInst.visible = frame==='hierarchy'||frame==='resonance';\n  if(cycResonanceInst.visible) updateCycResonance(dt);\n  if(cycSarosInst.visible) updateSarosEngine();`;
const visibilityReplacement=`  cycResonanceInst.visible = frame==='hierarchy'||frame==='resonance';\n  if(cycResonanceInst.visible) updateCycResonance(dt);\n  cycChronometryInst.visible=frame==='hierarchy'||frame==='chronometry';\n  if(cycChronometryInst.visible) updateChronometryObservatory();\n  if(cycSarosInst.visible) updateSarosEngine();`;
once(visibilityAnchor,visibilityReplacement,'Cycles visibility/update');

fs.writeFileSync(p,s);
