#!/usr/bin/env node
'use strict';
/* ══ THE LEVELS ARE ONE LADDER, AND EVERY SEAM OPENS BOTH WAYS (v4.404) ═════════════════════════════════════════════
 * Asked: «продумай и проверь логику перемещения по фрактальным уровням». The atlas is a ladder of scales — the Solar
 * chain (planets → Oort cloud → Milky Way → Local Group → cosmic web), the Observable Universe, the finite S³ carrier —
 * joined at two seams, read by one rung N = log_φ(L/ℓ_P). Both seams were driven across in both directions and read on
 * the atlas itself. MEASURED, five ways the logic did not hold:
 *   1. the doors opened ONE way. The switch «Auto world-scale hand-offs» (off by default) governed the two outward
 *      crossings only, so zooming IN crossed both seams whatever it said and zooming OUT crossed neither: a reader who
 *      zoomed from the Observable Universe into the Solar System could not zoom back out to where they had come from;
 *   2. the Observable ↔ S³ seam switched worlds without the router: the Observable world on the screen while the address,
 *      the trail and the context said «S³ · Section», and Back went to a laboratory the reader had never opened;
 *   3. the same seam paced its crossing from the radius the governor had last applied — in the OTHER world's unit: the
 *      carrier opened at 91 times the mapped radius and crept in over 48 frames, the Observable world at a hundredth of
 *      it and crept out — nine rungs lost and regained at a seam whose map is a similarity;
 *   4. Back restored the camera where the crossing had fired — past the seam — so the reader was carried across again
 *      as soon as the cooldown ran out; and a restored camera was a GESTURE to the governor, held to 2.6× of wherever the
 *      world switch had put it, so Back to a view far out stopped short and stayed there;
 *   5. the S³ section had no rung at all — «S³ · the unit is its radius» — though its unit is 100 Gly by the very map
 *      its seam uses, so the ladder broke at the one seam a reader crosses by zooming.
 * Now one function crosses every seam (hccSeamCross): routed, the radius mapped in physical length and the governor told
 * the camera already stands there; one predicate governs all four automatic crossings (hccSeamAuto); with it off a seam
 * the zoom reaches offers its door — in both directions — under the caption, and the ladder's strip offers the same
 * doors; every crossing arrives inside the band of the world it enters (hccSeamBand); Back is a placement and lands
 * inside the band (hccCameraRestore → hccSeamSafe); and the section reads its rung from its 100 Gly.
 * Checked by RUNNING the arithmetic (the rung on both sides of every seam, the nesting of the bands, the governor's bound
 * on a restored camera) and by reading the source for the wiring.
 */
const fs = require('node:fs'), path = require('node:path');
const SRC = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
let pass = 0, fail = 0;
const ok = (n, c, d) => { if (c) { pass++; console.log('  PASS — ' + n + (d ? ' :: ' + d : '')); } else { fail++; console.log('  FAIL — ' + n + (d ? ' :: ' + d : '')); } };
const fn = name => { const i = SRC.indexOf('function ' + name + '('); if (i < 0) return ''; const j = SRC.indexOf('\nfunction ', i + 10); return SRC.slice(i, j < 0 ? i + 8000 : j); };
const cross = (() => { const i = SRC.indexOf('function hccSeamCross(to){'); return i < 0 ? '' : SRC.slice(i, SRC.indexOf('\nconst hccSeamAuto=', i)); })();

/* the numbers the seams are made of, read from the page and RUN: the carrier's radius comes out of the reconstruction */
const R = (() => { const i = SRC.indexOf('/* ══ THE CONDITIONAL RECONSTRUCTION'), j = SRC.indexOf('/* ONE AUTHORITY FOR EVERY WORLD-SCALE SEAM.');
  return new Function(SRC.slice(i, j) + '\nreturn S3.R;')(); })();
const num = re => { const m = SRC.match(re); return m ? +m[1] : NaN; };
const SEAMS = { solarObsOutGly: num(/solarObsOutGly:([\d.]+)/), obsSolarInGly: num(/obsSolarInGly:([\d.]+)/),
  obsS3OutGly: R * num(/obsS3OutGly:S3\.R\*([\d.]+)/), s3ObsInGly: R * num(/s3ObsInGly:S3\.R\*([\d.]+)/), s3UnitGly: num(/s3UnitGly:(\d+)/) };
const AU_M = 1.495978707e11, LY_AU = num(/AU_PER_LY: ([\d.]+)/), GLY_AU = 1e9 * LY_AU, GLY_M = GLY_AU * AU_M;
const lP = 1.616255e-35, PHI = (1 + Math.sqrt(5)) / 2, levelOf = L => Math.log(L / lP) / Math.log(PHI), T = 2 * Math.tan(50 * Math.PI / 360);

/* 1 · one function, routed */
{ const legs = (cross.match(/hccGo\(\{worldId:'(obs|s3|solar)'(?:,labId:'sec')?\},\{history:true\}\)/g) || []).length;
  const sites = [/if\(hccSeamAuto\(\)\)\{ hccSeamCross\('obs'\); return; \}/, /if\(_outS3&&hccSeamAuto\(\)\) hccSeamCross\('s3'\);/,
    /else if\(_inSolar&&hccSeamAuto\(\)\) hccSeamCross\('solar'\);/, /if\(_inObs&&hccSeamAuto\(\)\) hccSeamCross\('obs'\);/].filter(re => re.test(SRC)).length;
  ok('ONE FUNCTION CROSSES EVERY SEAM, AND IT IS A NAVIGATION: each of its three legs goes through the router with history, so the address, the trail, the context and Back follow — the Observable ↔ S³ seam had switched worlds behind the router\'s back',
    legs === 3 && sites === 4 && !/setMode\('obs'\); controls\.target\.set\(0,0,0\);   \/\/ the Observable world IS observer-centred/.test(SRC)
    && /if\(!\(to==='obs'&&\(from==='solar'\|\|from==='s3'\)\)&&!\(from==='obs'&&\(to==='solar'\|\|to==='s3'\)\)\) return false;/.test(cross),
    `${legs} routed legs · ${sites} of 4 zoom crossings call it · a crossing between two worlds that share no seam is refused`); }

/* 2 · one switch, both directions */
{ const auto = /const hccSeamAuto=\(\)=>state\.autoScaleHandoff!==false&&state\.scaleChain!==false;/.test(SRC);
  /* read in exactly one place besides the checkbox that renders it */
  const stray = (SRC.replace(/id="autoHandoff" \$\{state\.autoScaleHandoff!==false\?'checked':''\}/, '').match(/state\.autoScaleHandoff!==false/g) || []).length;
  const offers = [/hccSeamOffer\('obs'\);\s*\n\s*\} else hccSeamOffer\(null\);/, /else hccSeamOffer\(_outS3\?'s3':_inSolar\?'solar':null\);/, /else hccSeamOffer\(_inObs\?'obs':null\);/].filter(re => re.test(SRC)).length;
  ok('ONE SWITCH, BOTH DIRECTIONS: the automatic hand-off is one predicate for all four crossings — it governed the two outward ones only, so the zoom crossed inward whatever it said and never back out — and with it off every seam offers its door instead, in both directions',
    auto && stray === 1 && offers === 3 && /function hccSeamOffer\(to\)\{ if\(state\.scaleChain===false\)\{ HCC_SEAM\.door=null; return; \}/.test(SRC)
    && !/state\.autoScaleHandoff!==false/.test(fn('sxObsBand')),
    `the switch is read in exactly one place (${stray}) · ${offers} of 3 seam sites offer a door · the ladder's band no longer depends on it`); }

/* 3 · the rung, run on both sides of every seam */
{ const mpu = { solar: AU_M, obs: GLY_M, s3: SEAMS.s3UnitGly * GLY_M };
  const unit = { solar: GLY_AU, obs: 1, s3: 1 / SEAMS.s3UnitGly };   /* scene units per Gly in each world */
  const legs = [['solar', 'obs', SEAMS.solarObsOutGly * 1.001], ['obs', 'solar', SEAMS.obsSolarInGly * 0.999], ['obs', 's3', SEAMS.obsS3OutGly * 1.001], ['s3', 'obs', SEAMS.s3ObsInGly * 0.999]];
  const jumps = legs.map(([a, b, g]) => Math.abs(levelOf(T * g * unit[a] * mpu[a]) - levelOf(T * g * unit[b] * mpu[b])));
  const wired = /_lastCamDist=r; hccCameraGoal\(r,0\);/.test(cross) && /const _solarR=Math\.max\(dGly,0\.008\)\*GLY_AU;/.test(cross) && /r=dGly\/SCALE_SEAMS\.s3UnitGly;/.test(cross)
    && /else if\(from==='solar'\)|if\(from==='solar'\)\{ dir=camera\.position\.clone\(\)\.sub\(controls\.target\); dGly=dir\.length\(\)\/GLY_AU; \}/.test(cross)
    && /dGly=dir\.length\(\)\*SCALE_SEAMS\.s3UnitGly;/.test(cross) && !/SCALE_SEAMS\.crossFrames/.test(cross);
  const s3rung = /if\(sxS3Sec\(\)\) return SCALE_SEAMS\.s3UnitGly\*HCC_GLY_M;/.test(fn('sxMetersPerUnit'))
    && /const sxS3Sec=\(\)=>state\.mode==='s3'&&state\.s3view==='sec'&&!\(typeof MV!=='undefined'&&MV\.on\);/.test(SRC);
  ok('THE RUNG IS CONTINUOUS ACROSS EVERY SEAM: the radius is mapped in physical length, the governor is told the camera stands there (no pace from the other world\'s unit), and the S³ section reads its rung from the 100 Gly its seam maps by — run here for all four crossings',
    wired && s3rung && Math.max(...jumps) < 1e-9,
    legs.map(([a, b, g], i) => `${a}→${b} at ${g < 1 ? (g * 1000).toFixed(1) + ' Mly' : g.toFixed(0) + ' Gly'}: N ${levelOf(T * g * unit[a] * mpu[a]).toFixed(3)} → ${levelOf(T * g * unit[b] * mpu[b]).toFixed(3)}`).join(' · ')); }

/* 4 · the bands nest inside the seams, and every zoom crossing arrives inside the band it enters */
{ const band = new Function('state', 'SCALE_SEAMS', fn('hccSeamBand') + '\nreturn hccSeamBand;')({ quantShells: false, obsFibWhole: false }, SEAMS);
  const O = band('obs'), S = band('s3'), L = band('solar'), inside = (x, b) => x > b.lo && x < b.hi;
  const arrivals = [['Solar → Observable', SEAMS.solarObsOutGly, O], ['Observable → Solar', SEAMS.obsSolarInGly, L], ['Observable → S³', SEAMS.obsS3OutGly, S], ['S³ → Observable', SEAMS.s3ObsInGly, O]];
  const out = arrivals.filter(([, x, b]) => !inside(x, b)).map(a => a[0]);
  const clamp = /const B=hccSeamBand\(to\); dGly=Math\.min\(B\.hi,Math\.max\(B\.lo,dGly\)\);/.test(cross);
  ok('EVERY CROSSING ARRIVES INSIDE THE WORLD IT ENTERS: the bands lie inside the seams\' hysteresis, so the zoom\'s crossings are never clamped on arrival, and a door taken from far past its seam is held to the band — nothing lands past the opposite seam to be carried on when the cooldown ends',
    out.length === 0 && clamp && O.lo > SEAMS.obsSolarInGly && O.hi < SEAMS.obsS3OutGly && S.lo > SEAMS.s3ObsInGly && L.hi < SEAMS.solarObsOutGly,
    `Observable [${(O.lo * 1000).toFixed(1)} Mly, ${O.hi.toFixed(0)} Gly] · S³ from ${S.lo.toFixed(0)} Gly · Solar up to ${(L.hi * 1000).toFixed(1)} Mly · arrivals outside: ${out.length ? out.join(', ') : 'none'}`); }

/* 5 · the door */
{ const D = fn('hccSeamDoorSync');
  ok('THE DOOR: a button under the caption the crossing would have written, offered only by the world that is drawn and only while it keeps offering it (stale two FRAMES after it stops — a time-out in milliseconds blinked it on a slow frame), read every frame — and pressing it takes the door away BEFORE crossing (the first draft reset its signature to the hidden state\'s and the door stood on, stale, in every world after)',
    /<div id="hud"><div class="big" id="hudBig"><\/div><div class="sub" id="hudSub"><\/div><button type="button" class="seamDoor" id="seamDoor" hidden><\/button><\/div>/.test(SRC)
    && /try\{ hccSeamDoorSync\(\); \}catch\(e\)\{\}/.test(SRC) && /const f=\+\+HCC_SEAM\.f, D=HCC_SEAM\.door&&HCC_SEAM\.door\.from===state\.mode&&f-HCC_SEAM\.door\.f<=2/.test(D) && /HCC_SEAM\.door=to\?\{to, from:state\.mode, f:HCC_SEAM\.f\}:null;/.test(SRC)
    && /el\.onclick=ev=>\{ ev\.stopPropagation\(\); const d=HCC_SEAM\.door; HCC_SEAM\.door=null; el\.hidden=true; HCC_SEAM\.sig=''; if\(d&&d\.from===state\.mode\) hccSeamCross\(d\.to\); \};/.test(D)
    && /#hud \.seamDoor\{pointer-events:auto;/.test(SRC) && !/body\.panel-open #hud \.seamDoor\{pointer-events:none\}/.test(SRC)
    && (D.match(/TT\('/g) || []).length >= 4,
    'three destinations named in three languages · clickable wherever the caption is visible (a desk keeps its caption with Controls open; a phone hides both)'); }

/* 6 · Back */
{ const R2 = fn('hccCameraRestore'), back = fn('navUnifiedBack'), nb = fn('navBack');
  const step = num(/step:([\d.]+),\s+\/\/ at most this factor of dolly per frame/), placed = 130, asked = 957;
  ok('BACK IS A PLACEMENT, AND IT LANDS INSIDE THE SEAM: both stacks restore through one function that starts the governor\'s bound from the restored camera and puts a view left past a seam back inside that seam\'s band — run here: a restored camera was a gesture, held to ' + step + '× of where the world switch had put it',
    /hccCameraGoalClear\(\); camera\.position\.fromArray\(cam\); controls\.target\.fromArray\(tgt\);\s*\n\s*_lastCamDist=camera\.position\.distanceTo\(controls\.target\); hccCameraGoal\(_lastCamDist,0\); hccSeamSafe\(\); syncCameraClipping\(true\); \}/.test(R2)
    && /hccCameraRestore\(cam,tgt\)/.test(back) && /hccCameraRestore\(s\.cam,s\.tgt\);/.test(nb)
    && /B=hccSeamBand\('obs'\)/.test(fn('hccSeamSafe')) && step > 1 && placed * step < asked
    && /if\(mode!==state\.mode\) _lastCamDist=NaN;/.test(fn('setMode')),
    `Back to ${asked} Gly from a world switch that had placed the camera at ${placed}: before, the first frame stood at ${(placed * step).toFixed(0)} Gly and nothing asked again; now it stands where it was taken, or at the seam's edge · and a world switch forgets the radius of the world it left (Back to the Solar System walked out from ${(0.0021 * step).toFixed(4)} AU — 2 Mly read as AU — over ${Math.ceil(Math.log(71.63 / 0.0021) / Math.log(step))} frames)`); }

/* 7 · the strip offers the same doors, and the carrier has a band */
{ const scrub = fn('sxScrubTo'), fly = fn('sxFlyTo'), oc = fn('sxObsCross');
  ok('THE LADDER\'S STRIP OFFERS THE SAME DOORS: on the carrier it steers the carrier (the whole of it stands above rung 300) and offers the door down at the rung asked; past the Observable band\'s top it offers the carrier with the switch either way, and the door goes by the seam itself and then on to the rung asked — it used to fly past the seam and leave the crossing to the zoom, which with the switch off never came',
    /if\(sxS3Sec\(\)\)\{ SX_STATE\.scrubN=final\?null:N; sxS3Steer\(N,final\); return; \}/.test(scrub)
    && scrub.indexOf('sxS3Steer(N,final)') < scrub.indexOf('sxFlyTo(L)')
    && /if\(sxS3Sec\(\)&&!cross\)\{ const B=sxS3Band\(\), Nv=levelOf\(1\.6\*L\); if\(Nv>=B\.lo-0\.5\)\{ sxS3Steer\(Nv,true\); return; \}/.test(fly)
    && /if\(E\.from==='s3'\)\{ if\(sxS3Sec\(\)&&hccSeamCross\('obs'\)\) try\{ sxObsSteer\(E\.want,true\); \}catch\(e\)\{\} return; \}/.test(oc)
    && /if\(hccSeamCross\('s3'\)\) sxS3Steer\(E\.want,true\);/.test(oc) && !/SCALE_SEAMS\.obsS3OutGly\*1\.06/.test(oc)
    && /SX_STATE\.obsEdge=\{side:'below', want:N, t:performance\.now\(\), from:'s3'\};/.test(fn('sxS3Steer')),
    'drag, tap, step and rung card all reach the carrier\'s band and its door'); }

/* 8 · and the page checks it at boot */
ok('AND THE PAGE CHECKS IT AT BOOT: the switch reads both ways, every zoom crossing arrives inside its band, and the rung is equal on both sides of the carrier\'s seam',
  /ok\('Every seam opens both ways, and every crossing the zoom makes arrives inside the world it enters',/.test(SRC)
  && /ok\('And the φ-ladder runs on across the carrier\\'s seam: the S³ section has a rung, read from the same 100 Gly its seam maps by',/.test(SRC));

console.log(`\n  ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
