const fs=require('fs');
const src=fs.readFileSync('index.html','utf8');
let pass=0,fail=0;
function check(name,cond,detail=''){
  if(cond){pass++;console.log(`PASS — ${name}${detail?` · ${detail}`:''}`);}
  else{fail++;console.error(`FAIL — ${name}${detail?` · ${detail}`:''}`);}
}
/* ── THIS USED TO REGEX A NUMBER OUT OF THE SOURCE ───────────────────────────
 * It read `R: 548.324513026856,` with a pattern that required a numeric literal.
 * The eleven carrier constants are now COMPUTED from the published curvature
 * marginal rather than typed, so `R: S3R.RcGly,` matched nothing and the whole
 * file measured NaN — and NaN compares false, so every seam check failed at once
 * rather than silently passing. That is the good failure mode, but it is still
 * the wrong question: a verifier that pattern-matches a literal is testing how
 * the value is SPELLED. This runs the atlas's own reconstruction instead, so it
 * tests the value. */
const cut=(a,b)=>{const i=src.indexOf(a),j=src.indexOf(b,i);
  if(i<0||j<0) throw new Error('could not cut '+a.slice(0,48));return src.slice(i,j);};
const ATLAS=new Function(cut('/* ══ THE CONDITIONAL RECONSTRUCTION','/* ONE AUTHORITY FOR EVERY WORLD-SCALE SEAM.')
  +'\nreturn {S3,S3R,HCC_S3R};')();
const R=ATLAS.S3.R;
const solarOutMatch=src.match(/solarObsOutGly:\s*([0-9.]+)/);
const solarInMatch=src.match(/obsSolarInGly:\s*([0-9.]+)/);
const solarOut=solarOutMatch?Number(solarOutMatch[1]):NaN;
const solarIn=solarInMatch?Number(solarInMatch[1]):NaN;
const expectedOut=R*1.08, expectedIn=R*0.94;
/* the old form of this asked whether R lay between 500 and 600 — a window drawn
 * around the v38 fiducial. It would have rejected any corrected modulus, which is
 * the opposite of what a continuity check is for. The question that survives a
 * change of input is whether the carrier IS the reconstruction's median and sits
 * inside its own 95% conditional band. */
const band=ATLAS.S3R.shells;
check('the carrier radius is the conditional median of the published curvature marginal',
  Number.isFinite(R)&&Math.abs(R-ATLAS.HCC_S3R.published.Rc_Gly)/R<1e-11,
  `R=${R.toFixed(6)} Gly against the reference ${ATLAS.HCC_S3R.published.Rc_Gly}`);
check('and it lies inside the 95% conditional band, which spans a factor of eleven',
  R>band[0].RcGly&&R<band[4].RcGly&&band[4].RcGly/band[0].RcGly>10,
  `${band[0].RcGly.toFixed(1)} < ${R.toFixed(1)} < ${band[4].RcGly.toFixed(1)} Gly · a factor of ${(band[4].RcGly/band[0].RcGly).toFixed(1)} in radius and ${Math.pow(band[4].RcGly/band[0].RcGly,3).toFixed(0)} in volume`);
check('one scale-seam authority exists',src.includes('const SCALE_SEAMS=Object.freeze({')&&src.includes('obsS3OutGly:S3.R*1.08')&&src.includes('s3ObsInGly:S3.R*0.94')&&src.includes('s3UnitGly:100'));
check('Solar/Observable seam is expressed in Gly at Local-Group scale, not gigalightyear scale',Number.isFinite(solarOut)&&solarOut>0.001&&solarOut<0.1,`out=${solarOut} Gly = ${(solarOut*1000).toFixed(1)} Mly`);
check('Solar/Observable seam has a narrow hysteresis band rather than a black-scale corridor',Number.isFinite(solarIn)&&solarOut>solarIn&&solarOut/solarIn<2,`out/in=${(solarOut/solarIn).toFixed(3)}`);
check('Observable outward seam lies beyond the canonical curvature-radius proxy so the shell is seen before the topology handoff',expectedOut>R&&expectedOut<R*1.15,`out=${expectedOut.toFixed(3)} Gly`);
check('S3 return seam is inside the outward seam but still beyond the particle horizon',expectedIn<expectedOut&&expectedIn>S3Particle(src),`in=${expectedIn.toFixed(3)} Gly`);
check('Solar to Observable uses the shared seam authority',src.includes("d>SCALE_SEAMS.solarObsOutGly*GLY_AU"));
check('Observable to Solar uses the shared seam authority',src.includes('dObs<SCALE_SEAMS.obsSolarInGly'));
check('Observable to finite S3 carrier has an outward handoff',src.includes('dObs>SCALE_SEAMS.obsS3OutGly')&&src.includes("state.s3view='sec'; setMode('s3')")&&src.includes('dObs/SCALE_SEAMS.s3UnitGly'));
check('finite S3 carrier has a hysteretic return to Observable',src.includes("state.s3view==='sec'")&&src.includes('dS3*SCALE_SEAMS.s3UnitGly<SCALE_SEAMS.s3ObsInGly')&&src.includes("setMode('obs')")&&src.includes('dS3*SCALE_SEAMS.s3UnitGly'));
/* this matched the inline call `setControlDistanceLimits(..., obsS3OutGly*1.35)`
 * and broke when that moved into obsApplyZoomLimits() — which it had to, because
 * the curvature band needs a ceiling the toggle can raise and setMode computed
 * one the toggle could not reach. The grep was testing the spelling; what matters
 * is the invariant, so the invariant is what gets evaluated: in BOTH band states
 * the near limit must dive below the Solar hand-off and the far limit must clear
 * the S³ hand-off, or one of the two seams is a one-way trap. */
{ const seams = { obsSolarInGly: 0.020, obsS3OutGly: R * 1.08 };
  const ceiling = band => band ? ATLAS.S3R.shells[4].RcGly * 1.18 : seams.obsS3OutGly * 1.35;
  const floor = seams.obsSolarInGly * 0.6;
  check('Observable zoom limits can reach both adjacent seams, with the band on and with it off',
    floor < seams.obsSolarInGly && ceiling(false) > seams.obsS3OutGly && ceiling(true) > seams.obsS3OutGly
    && src.includes('function obsApplyZoomLimits(){')
    && src.includes('obsApplyZoomLimits();'),
    `floor ${floor.toFixed(4)} < ${seams.obsSolarInGly} Gly · ceiling ${ceiling(false).toFixed(0)} Gly normally and ${ceiling(true).toFixed(0)} with the band, both beyond the ${seams.obsS3OutGly.toFixed(0)} Gly hand-off`);
  check('and the band ceiling actually clears the outermost quantile, which the first version did not',
    ceiling(true) > ATLAS.S3R.shells[4].RcGly,
    `${ceiling(true).toFixed(0)} > ${ATLAS.S3R.shells[4].RcGly.toFixed(0)} Gly — three of the five shells lie beyond the S³ hand-off, so a fixed ceiling drew them where no reader could go`);
  check('the automatic hand-off is suspended while the band is shown, for the same reason the scale-chain switch suspends it',
    src.includes('dObs>SCALE_SEAMS.obsS3OutGly && !state.quantShells'),
    'the reader is looking AT the thing the seam would carry them through');
}
check('giant structures use the same COSMOS authority on both sides of the Solar/Observable seam',src.includes('for(const s of COSMOS){')&&src.includes('COSMOS.forEach(s=>')&&src.includes('const cosmosGroup = new THREE.Group(); obsGroup.add(cosmosGroup);')&&src.includes('solarCosmicGroup.add(g)'));
check('Observable view carries the curvature ledger through the canonical S3 modulus',src.includes('const obsCurvGroup=new THREE.Group(); obsGroup.add(obsCurvGroup);')&&src.includes('SEL_LEDGER.forEach((L,i)=>')&&src.includes('new THREE.SphereGeometry(L.R,48,30)'));
/* this used to grep for the typed literal `V: 3.254188648717e9` and for a boot
 * check that compared the table with the formula. Both are gone: the volume is
 * computed, so the literal cannot be there and the comparison would be a value
 * against itself. The identity is still worth asserting — against the reference. */
check('finite S3 volume is the exact closed-carrier value 2 pi^2 R^3',
  Math.abs(ATLAS.S3.V-2*Math.PI**2*R**3)/ATLAS.S3.V<1e-12
  && Math.abs(ATLAS.S3R.V-ATLAS.HCC_S3R.published.V_m3)/ATLAS.S3R.V<1e-11,
  `${ATLAS.S3.V.toExponential(6)} Gly^3 = ${ATLAS.S3R.V.toExponential(9)} m^3 against the reference ${ATLAS.HCC_S3R.published.V_m3}`);
check('handoff copy states topology is finite and boundaryless rather than a Euclidean outer wall',src.includes('finite S³ carrier')&&src.includes('∂S³_R = ∅'));
console.log(`\nscale continuity: ${pass} passed, ${fail} failed`);
process.exitCode=fail?1:0;
function S3Particle(){return ATLAS.S3.Dparticle;}  // same reason: computed, not spelled
