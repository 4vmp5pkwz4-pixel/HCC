'use strict';
const fs=require('fs');
function rep(src,re,to,name){
  const m=src.match(re);
  if(!m) throw new Error(`${name}: structural anchor not found`);
  const second=src.slice(m.index+m[0].length).match(re);
  if(second) throw new Error(`${name}: structural anchor is not unique`);
  return src.replace(re,to);
}
let s=fs.readFileSync('index.html','utf8');

// Register the first non-S3 laboratory without rewriting the existing S3 catalogue.
s=rep(s,/(const LAB_REGISTRY=\(\(\)=>\{[\s\S]*?)(\n\s*return out;\n\}\)\(\);)/,
(_,body,tail)=>body+`\n  out.push({id:'chronometry', parentWorld:'cyc', category:'maps',\n    title:'Ancient Chronometry Observatory',\n    description:'Source-locked comparative chronometry: exact textual relations, same-term definition conflicts, historical astronomy benchmarks, explicit hypotheses and falsification gates.',\n    status:'MODEL', capabilities:{xr:true}, defaultInspector:'inspect',\n    route:'#/world/cyc/lab/chronometry'});`+tail,'LAB_REGISTRY');

s=rep(s,/function hccRoute\(ctx=HCC_CTX\)\{[\s\S]*?\n\}/,
`function hccRoute(ctx=HCC_CTX){\n  return ctx.labId ? \`#/world/\${ctx.worldId}/lab/\${ctx.labId}\` : \`#/world/\${ctx.worldId}\`;\n}`,'hccRoute');
s=rep(s,/\s*if\(m\[2\]&&!LAB_BY_ID\.has\(m\[2\]\)\) return null;/,
"\n  if(m[2]){ const L=LAB_BY_ID.get(m[2]); if(!L||L.parentWorld!==m[1]) return null; }",'hccParseRoute parent check');
s=rep(s,/\} else HCC_CTX\.labId=null;/,
`} else if(labId&&worldId==='cyc'){\n      HCC_CTX.labId=labId;\n      if(labId==='chronometry'){ state.cycFrame='chronometry'; try{ applyCycFrameView(); }catch(e){} }\n    } else HCC_CTX.labId=null;`,'hccGo Cycles lab');
s=rep(s,/if\(HCC_CTX\.labId\)\{ hccGo\(\{worldId:'s3',labId:null\}\); return true; \}/,
"if(HCC_CTX.labId){ hccGo({worldId:HCC_CTX.worldId,labId:null}); return true; }",'hccBack');
s=rep(s,/return HCC_CTX\.worldId==='s3'&&HCC_CTX\.labId\?HCC_CTX\.labId:HCC_CTX\.worldId;/,
'return HCC_CTX.labId?HCC_CTX.labId:HCC_CTX.worldId;','config owner');

const visual=`/* ══ ANCIENT CHRONOMETRY OBSERVATORY · SOURCE SPACE ↔ SCIENCE SPACE ════
   Shared Atlas time only. Geometry and brightness explain structure, never confidence. */
const cycChronometryInst=new THREE.Group(); cycChronometryInst.position.set(-27,-14,-24); cycGroup.add(cycChronometryInst);
let chronometryPick=null, chronometryEpochMarker=null, chronometryEpochLab=null;
{
  const panelMat=new THREE.MeshStandardMaterial({color:0x11151f,metalness:.72,roughness:.24,transparent:true,opacity:.88});
  const gold=new THREE.MeshStandardMaterial({color:0xd8bd79,emissive:0x6b5324,emissiveIntensity:.24,metalness:.72,roughness:.28});
  const platinum=new THREE.MeshStandardMaterial({color:0xc9d3df,emissive:0x293849,emissiveIntensity:.20,metalness:.68,roughness:.30});
  const warn=new THREE.MeshStandardMaterial({color:0xd98b64,emissive:0x5a2415,emissiveIntensity:.30,metalness:.42,roughness:.34});
  const mkPanel=x=>{const m=new THREE.Mesh(new THREE.BoxGeometry(8.7,10.7,.18),panelMat.clone());m.position.set(x,0,0);cycChronometryInst.add(m);return m;};
  mkPanel(-5.2);mkPanel(5.2);
  const st=mkLabel('SOURCE SPACE','label const');st.position.set(-5.2,6.15,.35);cycChronometryInst.add(st);
  const sc=mkLabel('SCIENCE SPACE','label const');sc.position.set(5.2,6.15,.35);cycChronometryInst.add(sc);
  const title=mkLabel('ANCIENT CHRONOMETRY · provenance before proximity','label major');title.position.set(0,7.55,.4);cycChronometryInst.add(title);
  const mkNode=(x,y,mat,txt)=>{const m=new THREE.Mesh(new THREE.SphereGeometry(.32,18,12),mat);m.position.set(x,y,.55);cycChronometryInst.add(m);const l=mkLabel(txt,'label dim');l.position.set(x+(x<0?.55:-.55),y,.6);cycChronometryInst.add(l);return m;};
  chronometryPick=mkNode(-5.2,3.7,gold,'Abhidharmakośa · kṣaṇa');
  mkNode(-5.2,2.15,gold,'Bhāgavata · kṣaṇa');mkNode(-5.2,.6,platinum,'Arthaśāstra · truṭi');
  mkNode(-5.2,-.95,platinum,'Bhāgavata · truṭi');mkNode(-5.2,-2.5,platinum,'Siddhāntaśiromaṇi · truṭi');
  const conflict=mkLabel('Same term / different definition','label const');conflict.position.set(-5.2,-4.45,.55);cycChronometryInst.add(conflict);
  mkNode(5.2,3.5,gold,'Jain 21 kyr · HYPOTHESIS');mkNode(5.2,1.8,warn,'DEPENDENT · 42k = 2 × 21k');
  mkNode(5.2,.1,platinum,'Aryabhata · sidereal benchmark');mkNode(5.2,-1.6,platinum,'Daming · year / lunation');mkNode(5.2,-3.3,platinum,'Shoushi · year / lunation');
  const pending=mkLabel('PENDING_EPOCH_CORRECTION','label const');pending.position.set(5.2,-4.65,.55);cycChronometryInst.add(pending);
  const noPhase=mkLabel('NO PHASE ANCHOR · period proximity is not phase consistency','label dim');noPhase.position.set(5.2,4.85,.55);cycChronometryInst.add(noPhase);
  for(const y of [3.5,1.8,.1,-1.6,-3.3]){const g=new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(-.8,y,.25),new THREE.Vector3(.8,y,.25)]);cycChronometryInst.add(new THREE.Line(g,new THREE.LineBasicMaterial({color:0x8aa0b8,transparent:true,opacity:.38})));}
  const rail=new THREE.Mesh(new THREE.CylinderGeometry(.035,.035,8,10),platinum);rail.position.set(8.35,0,.55);cycChronometryInst.add(rail);
  chronometryEpochMarker=new THREE.Mesh(new THREE.SphereGeometry(.22,16,12),gold);chronometryEpochMarker.position.set(8.35,0,.72);cycChronometryInst.add(chronometryEpochMarker);
  chronometryEpochLab=mkLabel('','label dim');chronometryEpochLab.position.set(8.35,-5.6,.65);cycChronometryInst.add(chronometryEpochLab);
}
function updateChronometryObservatory(){
  const atlasYears=state.epochDays/365.2425;
  const phase=((atlasYears%21000)+21000)%21000/21000;
  chronometryEpochMarker.position.y=-4+8*phase;
  chronometryEpochLab.element.innerHTML='shared Atlas epoch · '+atlasYears.toFixed(2)+' y from J2000 · 21 kyr phase '+(phase*100).toFixed(2)+'%';
}
registerSel('chronometry',{name:'Ancient Chronometry Observatory',mode:'cyc',pick:chronometryPick,
  src:['source-locked textual registries','Aryabhata/Daming/Shoushi benchmark registry'],accuracyTier:'M',catalogueStatus:'model-derived',
  forbiddenClaims:['Numerical proximity is not physical identity.','Same-named historical units are never averaged across traditions.','The Jain 21 kyr comparison has no independent phase anchor and remains a hypothesis.'],
  desc:'Two synchronized spaces: source-qualified textual definitions and admissible scientific comparisons. Typed conduits exist only for declared relations.',
  getPos:()=>cycChronometryInst.position.clone(),focusDist:()=>22,
  rows:()=>[['Clock','shared state.epochDays — Pause and Cycles speed apply'],['Jain closure','4K + 3K + 2K + (K−42000 y) + 21000 y + 21000 y = 10K'],['21 kyr','HYPOTHESIS · NO PHASE ANCHOR'],['42 kyr','DEPENDENT · 42k = 2 × 21k'],['Astronomy','6 benchmarks · PENDING_EPOCH_CORRECTION'],['Source rule','Same term / different definition remains explicit']]});
`;
s=rep(s,/const cycSarosInst=new THREE\.Group\(\);\s*cycSarosInst\.position\.set\(26,0,-24\);\s*cycGroup\.add\(cycSarosInst\);/,
visual+"\nconst cycSarosInst=new THREE.Group(); cycSarosInst.position.set(26,0,-24); cycGroup.add(cycSarosInst);",'Chronometry visual insertion');

s=rep(s,/\} else if\(state\.cycFrame==='orientation'\)\{\s*const p=cycOrientInst\.position;/,
`} else if(state.cycFrame==='chronometry'){\n    const p=cycChronometryInst.position;\n    controls.target.copy(p);camera.position.copy(p).add(new THREE.Vector3(0,4,25));setControlDistanceLimits(5,120);\n  } else if(state.cycFrame==='orientation'){\n    const p=cycOrientInst.position;`,'Chronometry camera');
s=rep(s,/(<option value="orientation"[^\n]*Earth\/Sun\/Moon orientation<\/option>)/,
`<option value="chronometry" \${state.cycFrame==='chronometry'?'selected':''}>⌛ Ancient chronometry</option>\n          $1`,'Chronometry frame option');
s=rep(s,/\['phase','phase'\],\['reso','resonance'\],\['orient','orientation'\],\['antik','antikythera'\]/,
"['phase','phase'],['reso','resonance'],['chrono','chronometry'],['orient','orientation'],['antik','antikythera']",'Chronometry wrist frame');
s=rep(s,/\s*if\(cycSarosInst\.visible\) updateSarosEngine\(\);/,
"\n  cycChronometryInst.visible=frame==='hierarchy'||frame==='chronometry';\n  if(cycChronometryInst.visible) updateChronometryObservatory();\n  if(cycSarosInst.visible) updateSarosEngine();",'Chronometry update loop');

s=s.replaceAll('4.149.1','4.150.0').replaceAll('cycles-saros-global-clock-2026.09.05.1','ancient-chronometry-observatory-2026.09.05.1');
fs.writeFileSync('index.html',s);

let m=fs.readFileSync('scripts/build-manifest.mjs','utf8');
m=rep(m,/HCC_NAV\.go\('s3',\s*id\);/,"HCC_NAV.go(L.world || L.parentWorld || 's3', id);",'manifest world route');
fs.writeFileSync('scripts/build-manifest.mjs',m);
const v={version:'4.150.0',build:'ancient-chronometry-observatory-2026.09.05.1',channel:'github-pages',source:'main',note:"Served with cache: 'no-store' by the freshness sentinel in index.html. scripts/validate.mjs fails the build if either field disagrees with HCC_VERSION / HCC_BUILD, so this file cannot drift from the document it describes."};
fs.writeFileSync('version.json',JSON.stringify(v,null,2)+'\n');
console.log('patched v4.150.0 Ancient Chronometry release');
