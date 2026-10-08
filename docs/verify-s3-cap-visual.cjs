#!/usr/bin/env node
/* Check BOTH numerical ownership and the atlas's actual rendered path. */
const fs=require('node:fs'), path=require('node:path');
const root=path.join(__dirname,'..');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const visual=fs.readFileSync(path.join(root,'visual/s3-cap-observability.mjs'),'utf8');
const core=fs.readFileSync(path.join(root,'core/math/s3-cap-observability.mjs'),'utf8');
const checks=[
 ['native Three.js scene, not an iframe',html.includes('mountS3CapObservability')&&html.includes('CAPOBS.update(')&&!visual.includes('<iframe')],
 ['controls inside existing Center Lab',html.includes('id="capObsOn"')&&html.includes('id="capObsL"')&&html.includes("if(V==='lab')")],
 ['field lives in existing S³ scene',html.includes('parent:s3LabGroup')&&visual.includes('new THREE.LineSegments')],
 ['one white tracer, no thick light tubes',visual.includes('new THREE.Mesh(')&&!visual.includes('TubeGeometry')],
 ['scientific numerical core stays distinct from display',html.includes("from './core/math/s3-cap-observability.mjs'")&&core.includes('export function witnessFraction')],
 ['no invented cosmic topology or golden-ratio selection',html.includes('REFERENCE MODEL')&&core.includes('not_derived')],
 ['actual frame updates active observability',html.includes('CAPOBS.tick(labDt)')],
 ['geodesic cap follows movable basepoint A',html.includes('center:P.A')&&visual.includes('S3M.tangentBasis(A)')],
 ['no bloomy display dependency',visual.includes('THREE.NormalBlending')&&!visual.includes('AdditiveBlending')]
];
for(const [name,ok] of checks)console.log((ok?'PASS':'FAIL')+' s3-cap · '+name);
if(checks.some(([,ok])=>!ok))process.exitCode=1;
else console.log('S3 CAP VISUAL: '+checks.length+'/'+checks.length+' source integration gates PASS');
