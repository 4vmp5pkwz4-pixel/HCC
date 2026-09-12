const fs=require('fs');
const src=fs.readFileSync('index.html','utf8');
let pass=0,fail=0;
function check(name,cond,detail=''){
  if(cond){pass++;console.log(`PASS — ${name}${detail?` · ${detail}`:''}`);}
  else{fail++;console.error(`FAIL — ${name}${detail?` · ${detail}`:''}`);}
}
const rMatch=src.match(/R:\s*([0-9.]+),\s*\/\/ Gly — curvature radius of S³/);
const R=rMatch?Number(rMatch[1]):NaN;
const expectedOut=R*0.94, expectedIn=R*0.88;
check('canonical S3 curvature radius is readable and finite',Number.isFinite(R)&&R>500&&R<600,`R=${R}`);
check('one scale-seam authority exists',src.includes('const SCALE_SEAMS=Object.freeze({')&&src.includes('obsS3OutGly:S3.R*0.94')&&src.includes('s3ObsInGly:S3.R*0.88')&&src.includes('s3UnitGly:100'));
check('Observable outward seam lies beyond the particle horizon but inside the canonical curvature radius',expectedOut>S3Particle(src)&&expectedOut<R,`out=${expectedOut.toFixed(3)} Gly`);
check('S3 return seam is inside the outward seam and still outside the particle horizon',expectedIn<expectedOut&&expectedIn>S3Particle(src),`in=${expectedIn.toFixed(3)} Gly`);
check('Solar to Observable uses the shared seam authority',src.includes("d>SCALE_SEAMS.solarObsOutGly*GLY_AU"));
check('Observable to Solar uses the shared seam authority',src.includes('dObs<SCALE_SEAMS.obsSolarInGly'));
check('Observable to finite S3 carrier has an outward handoff',src.includes('dObs>SCALE_SEAMS.obsS3OutGly')&&src.includes("state.s3view='sec'; setMode('s3')")&&src.includes('dObs/SCALE_SEAMS.s3UnitGly'));
check('finite S3 carrier has a hysteretic return to Observable',src.includes("state.s3view==='sec'")&&src.includes('dS3*SCALE_SEAMS.s3UnitGly<SCALE_SEAMS.s3ObsInGly')&&src.includes("setMode('obs')")&&src.includes('dS3*SCALE_SEAMS.s3UnitGly'));
check('Observable zoom limits can reach both adjacent seams',src.includes('setControlDistanceLimits(SCALE_SEAMS.obsSolarInGly*0.6, SCALE_SEAMS.obsS3OutGly*1.35)'));
check('giant structures use the same COSMOS authority on both sides of the Solar/Observable seam',src.includes('for(const s of COSMOS){')&&src.includes('COSMOS.forEach(s=>')&&src.includes('const cosmosGroup = new THREE.Group(); obsGroup.add(cosmosGroup);')&&src.includes('solarCosmicGroup.add(g)'));
check('Observable view carries the curvature ledger through the canonical S3 modulus',src.includes('const obsCurvGroup=new THREE.Group(); obsGroup.add(obsCurvGroup);')&&src.includes('SEL_LEDGER.forEach((L,i)=>')&&src.includes('new THREE.SphereGeometry(L.R,48,30)'));
check('finite S3 volume remains the exact closed-carrier value',src.includes('V:          3.254188648717e9')&&src.includes("ok('V = 2*pi^2*R^3 matches table'"));
check('handoff copy states topology is finite and boundaryless rather than a Euclidean outer wall',src.includes('finite S³ carrier')&&src.includes('∂S³_R = ∅'));
console.log(`\nscale continuity: ${pass} passed, ${fail} failed`);
process.exitCode=fail?1:0;
function S3Particle(text){const m=text.match(/Dparticle:\s*([0-9.]+),/);return m?Number(m[1]):NaN;}
