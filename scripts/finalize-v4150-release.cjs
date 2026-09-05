'use strict';
const fs=require('fs');

let html=fs.readFileSync('index.html','utf8');
const required=[
  "id:'chronometry', parentWorld:'cyc'",
  'const cycChronometryInst=new THREE.Group()',
  'function updateChronometryObservatory()',
  "cycChronometryInst.visible=frame==='hierarchy'||frame==='chronometry'",
  'PENDING_EPOCH_CORRECTION',
  'Same term / different definition',
  'DEPENDENT · 42k = 2 × 21k',
  'NO PHASE ANCHOR'
];
for(const x of required) if(!html.includes(x)) throw new Error('release feature missing: '+x);
html=html.replaceAll('4.149.1','4.150.0')
  .replaceAll('cycles-saros-global-clock-2026.09.05.1','ancient-chronometry-observatory-2026.09.05.1');
fs.writeFileSync('index.html',html);

let m=fs.readFileSync('scripts/build-manifest.mjs','utf8');
const bad="  const row = await page.evaluate(async id => {\n    HCC_NAV.go(L.world || L.parentWorld || 's3', id);";
const good="  const row = await page.evaluate(async ({id,world}) => {\n    HCC_NAV.go(world, id);";
if(m.includes(bad)) m=m.replace(bad,good);
else if(!m.includes(good)) throw new Error('manifest walker browser-entry anchor missing');
const badArg='  }, L.id);';
const goodArg="  }, {id:L.id, world:L.world || L.parentWorld || 's3'});";
if(m.includes(badArg)) m=m.replace(badArg,goodArg);
else if(!m.includes(goodArg)) throw new Error('manifest walker argument anchor missing');
fs.writeFileSync('scripts/build-manifest.mjs',m);

const version={
  version:'4.150.0',
  build:'ancient-chronometry-observatory-2026.09.05.1',
  channel:'github-pages',
  source:'main',
  note:"Served with cache: 'no-store' by the freshness sentinel in index.html. scripts/validate.mjs fails the build if either field disagrees with HCC_VERSION / HCC_BUILD, so this file cannot drift from the document it describes."
};
fs.writeFileSync('version.json',JSON.stringify(version,null,2)+'\n');
console.log('v4.150.0 release identity and manifest walker finalized');
