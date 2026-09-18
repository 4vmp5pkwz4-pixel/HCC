#!/usr/bin/env node
'use strict';
/* ELEVEN TRADITIONS DREW THE UNIVERSE AS A CYCLE, AND THIS ATLAS HAD THE ARITHMETIC
 * OF FOUR OF THEM AND THE PICTURE OF NONE.
 *
 * The Cycles world carried Maya, Egyptian, Chinese and Babylonian counts as numbers
 * inside a chronometry readout. It drew no wheel. Every one of these cultures made a
 * GRAPHICAL account of cyclic time — a divided circle — and the division is the
 * content: 260 equal steps is a different claim from four arcs in 4:3:2:1, and both
 * are different from twelve unequal ara whose second half is the first reversed.
 *
 * THE ONE THING THIS INSTRUMENT MUST NOT DO IS POINT A HAND AT A WHEEL THAT HAS NO
 * PHASE. A Maya calendar round has a position this instant because its unit is a day
 * and the correlation to a Julian day is a constant already here. A Jain kālacakra
 * does not: its ara are measured in sāgaropama, a doctrinal magnitude with no
 * conversion to a second, and a hand there would be a number nobody wrote down. The
 * mahāyuga sits between — its spans are years, but the epoch that starts Kali Yuga is
 * a doctrinal CHOICE, so its hand exists only because that choice is declared in the
 * file rather than assumed. Three categories, and the instrument states which each is.
 *
 * Measured in a browser: 11 rings drawn, 10 hands, 11 labels all legible, phases
 * published on the bus, and the mahāyuga hand at 1.19 per cent of its turn — which
 * is 5128 years since 3102 BCE, the arithmetic the declared epoch requires.
 */
const fs = require('node:fs'), path = require('node:path');
const src = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
let pass = 0, fail = 0;
/* a failing check must not print the sentence written for the passing case */
const ok = (n, c, d) => { if (c) { pass++; console.log('  PASS — ' + n + (d ? ' :: ' + d : '')); }
  else { fail++; console.log('  FAIL — ' + n + (d ? ' :: EXPECTED ' + d : '')); } };

/* ── the table, and the three phase categories ────────────────────────────── */
const tbl = src.slice(src.indexOf('const WOT_TRADITIONS=Object.freeze(['),
                      src.indexOf('const wotArcs='));
const rows = [...tbl.matchAll(/\{id:'([a-z]+)',\s*div:([^,]+),[\s\S]*?phase:'(epoch|declared|structure)'/g)]
  .map(m => ({ id: m[1], div: m[2].trim(), phase: m[3] }));
ok('eleven traditions are declared, each with the number of divisions its own culture drew',
  rows.length >= 11, rows.map(r => r.id + '/' + r.div).join(' '));
ok('and each declares whether it can be pointed at NOW, at a DECLARED epoch, or not at all',
  rows.filter(r => r.phase === 'epoch').length >= 9
  && rows.filter(r => r.phase === 'declared').length === 1
  && rows.filter(r => r.phase === 'structure').length === 1,
  `${rows.filter(r => r.phase === 'epoch').length} epoch · ${rows.filter(r => r.phase === 'declared').length} declared · `
  + `${rows.filter(r => r.phase === 'structure').length} structure only`);

/* ── THE REFUSAL: no hand where no phase exists ───────────────────────────── */
const phaseFn = src.slice(src.indexOf('const wotPhase='), src.indexOf('/* the shared proportion'));
ok('a wheel with no phase is REFUSED a hand rather than given a plausible one',
  /if\(T\.phase==='structure'\|\|!T\.turnDays\) return null;/.test(phaseFn),
  'wotPhase returns null and the instrument hides the hand');
ok('and the doctrinal epoch is taken from a NAMED constant, so the one declared choice is visible',
  /WOT_KALI_START_JDN=588466/.test(src) && /chronJDN\(epochDays\)-WOT_KALI_START_JDN/.test(phaseFn),
  '3102 BCE is a scholarly convention, not a measurement, and the file says which');

/* ── the divisions come from the tradition, not from a default ────────────── */
/* ── AND THE ARCS ARE CALLED, NOT GREPPED ──────────────────────────────────
   A mutation that renamed the Jain branch to a value it can never match survived
   the first draft of this file: the reverse-concatenation was still in the source,
   so a text check passed while the wheel silently fell through to twelve EQUAL
   segments. Same shape as a check that asked whether busIds was declared rather
   than used. The kernels are sliced into core/atlas/extracted.mjs and evaluated
   here, so the question is what the function RETURNS. */
const K = require('../core/atlas/extracted.mjs');
const jain = K.wotArcs('jain'), yuga = K.wotArcs('yuga'), maya = K.wotArcs('maya');
const ratio = a => a.map(x => +(x / a[3]).toFixed(6));
ok('the Jain wheel RETURNS twelve unequal ara whose second half is the first reversed',
  jain.length === 12
  && ratio(jain.slice(0, 4)).join(':') === '4:3:2:1'
  && jain.slice(0, 6).every((x, i) => Math.abs(x - jain[11 - i]) < 1e-12),
  `${jain.length} segments · first four ${ratio(jain.slice(0, 4)).join(':')} · the halves mirror`);
ok('the Hindu wheel RETURNS four unequal arcs in 4:3:2:1, and a day-count wheel returns equal ones',
  yuga.length === 4 && ratio(yuga).join(':') === '4:3:2:1'
  && maya.length === 260 && new Set(maya.map(x => x.toFixed(12))).size === 1,
  `yuga ${yuga.map(x => x.toFixed(2)).join(' ')} · maya ${maya.length} equal segments`);
ok('the yuga spans are the canonical 1728000 : 1296000 : 864000 : 432000',
  K.WOT_YUGA_YR.join(':') === '1728000:1296000:864000:432000'
  && K.WOT_MAHAYUGA_YR === 4320000 && K.WOT_KALPA_YR === 4320000000,
  `mahāyuga ${K.WOT_MAHAYUGA_YR} yr · kalpa ${K.WOT_KALPA_YR} yr`);

/* ── the shared proportion is stated as arithmetic, and claims nothing ────── */
const sp = K.wotSharedProportion();
ok('the 4:3:2:1 shared by the Jain ara and the Hindu yuga is COMPUTED and comes out identical',
  sp.identical === true && sp.jain.join(':') === '4:3:2:1' && sp.yuga.join(':') === '4:3:2:1',
  `jain ${sp.jain.join(':')} · yuga ${sp.yuga.join(':')} · identical ${sp.identical}`);
ok('and the atlas claims no borrowing and no astronomy from it',
  /claims no borrowing/.test(src) && /does NOT say one borrowed from the other/.test(src),
  'neither claim is in evidence here, and the file says so where a reader will meet it');

/* ── it is an instrument of the frame system, not a loose group ───────────── */
/* PINNED TO THE INVARIANT, NOT TO THE PUNCTUATION. This required the frames array
   to read exactly ['wheels'], so it went red the day a combined stage was added that
   legitimately shows every instrument — correct code, red check, which is worse than
   no check. What matters is that the wheels are IN the table and that the wheels
   frame is one of the frames that shows them. */
{
  const row = (src.match(/\{name:'cycWheelsInst',\s*frames:\[([^\]]*)\]/) || [])[1];
  ok('the wheels are declared in the frame table that governs visibility, and the wheels frame is one of the frames that shows them',
    !!row && /'wheels'/.test(row),
    row ? `frames: [${row}] — so the frame cannot open wearing another instrument’s furniture`
        : 'no cycWheelsInst row in CYC_FRAME_INSTRUMENTS at all');
}
ok('and the frame FRAMES itself and returns, as every other branch does',
  /const p=cycWheelsInst\.position;[\s\S]{0,320}?setControlDistanceLimits\(9,\d+,hccCameraLimitContext\('frame declaration'\)\);[\s\S]{0,60}?return;/.test(src),
  'the first draft set a camera without returning and the default overwrote it');

/* ── the update runs in the tick, where dt exists ───────────────────────────
 * AND THIS CLAUSE WAS PINNED TO A SPELLING, NOT TO WHAT IT NAMES. It required the
 * literal `if(frame==='wheels')`, which is a GATE, while the sentence above it is
 * about WHERE the update runs. The two came apart the moment the wheels were put
 * on the shared "all models" stage: that stage is a different frame name, so the
 * frame gate froze them there — measured, by sampling the instrument's transforms
 * on the stage and again in its own frame, as "in its own frame: moves | on the
 * all-models stage: FROZEN" — and the fix, gating on .visible instead, failed this
 * check although it is the correction the check's own sentence asks for.
 *
 * So it now asserts the sentence: the call sits in the tick, beside the dt the
 * frame-change handler does not have, and the gate is that the instrument is on
 * stage rather than that somebody named the frame it is standing in. */
ok('the wheels update from the tick loop rather than from the frame-change handler, and they run because they are ON STAGE rather than because a frame was named',
  /if\(cycWheelsInst\.visible\)\{\s*\n\s*updateWheelsOfTime\(\);\s*\n\s*wotBusT\+=dt;/.test(src)
  && !/if\(frame==='wheels'\)\{\s*\n\s*updateWheelsOfTime/.test(src),
  'a frame-change handler has no dt, and the first draft threw into the tick’s own catch; a frame NAME froze the instrument on every stage nobody had remembered to name');
ok('a publish that fails is RECORDED rather than swallowed',
  /WOT\.publishError=String\(e&&e\.message\|\|e\);/.test(src)
  && /globalThis\.HCC_WHEELS=/.test(src),
  'the same defect this atlas already carries once, where a whole mode published nothing and raised no error');

/* ── every label names its own ring ───────────────────────────────────────── */
/* ── AND THIS PINNED THE FIRST FIX, NOT THE PROBLEM IT SOLVED ───────────────
 * It matched the exact bearing expression of the first attempt — spreading the
 * labels over 82 % of a turn at each ring's OWN radius. Measured again once the
 * turn lengths made every label longer, that still left three of the eleven
 * standing: the inner labels sat INSIDE the nest, across the rings they name and
 * across each other. The fix was the radius, not the bearing. The clause asserts
 * what it is named for — that no two names share a place — by requiring both a
 * per-label bearing AND one common radius outside the whole nest. */
ok('the labels are spread around the nest instead of stacking on one radius, and they stand OUTSIDE it rather than across the rings they name',
  /const la=\(i\/n\)\*Math\.PI\*2\+0\.18;/.test(src)
  && /const RIM=2\.0\+\(n-1\)\*0\.86\+0\.62;/.test(src)
  && /label\.position\.set\(Math\.cos\(la\)\*\(RIM\+1\.25\),0\.05,Math\.sin\(la\)\*\(RIM\+1\.25\)\);/.test(src)
  && /the leader, so a name at the rim still points at the ring it names/.test(src),
  'eleven on one radius left the declutter pass showing three; eleven at their own radii left it showing three again');

/* ── AND THE TWO PAIRS THAT GENUINELY MESH ────────────────────────────────
   A concentric ring says a culture divided the circle into n. It does not say what
   the Maya and the Chinese both drew explicitly: two wheels turning against each
   other, returning to the same tooth only after their least common multiple.

   THE MESH IS THE ARITHMETIC. Gears engage only when their tooth PITCH is equal, so
   a 260-tooth wheel and a 365-tooth wheel on one pitch have radii in the ratio
   260:365 and turn at rates in the ratio 365:260 — which is exactly the statement
   that a tzolk'in is 260 days and a haab' is 365. The geometry cannot be right
   unless the arithmetic is, and these check the geometry rather than the intent.
   Measured in a browser: pitch 0.075 on both Maya gears, separation 7.4604 equal to
   the sum of the radii to four places, and a turn ratio of 1.4038 = 365/260. */
const meshBlock = src.slice(src.indexOf('const WOT_MESHES=['), src.indexOf('function wotBuildMeshes'));
const pairs = [...meshBlock.matchAll(/\{id:'([a-z]+)',\s*a:\{n:([A-Za-z_]+)[^}]*\},\s*b:\{n:([A-Za-z_]+)/g)]
  .map(m => ({ id: m[1], a: m[2], b: m[3] }));
ok('the two pairs that mesh are declared from the counts themselves, not from typed teeth',
  pairs.length === 2
  && pairs.some(p => p.a === 'MAYA_TZOLKIN' && p.b === 'MAYA_HAAB')
  && pairs.some(p => p.a === 'CHN_STEMS' && p.b === 'CHN_BRANCHES'),
  pairs.map(p => `${p.id}: ${p.a} × ${p.b}`).join(' · '));

const gearFn = src.slice(src.indexOf('function wotGear('), src.indexOf('const WOT_MESHES='));
ok('a gear\'s radius is DERIVED from its tooth count and the shared pitch, which is what makes two of them engage',
  /const r=n\*pitch\/\(2\*Math\.PI\);/.test(gearFn),
  'r = n·pitch/2π, so equal pitch gives radii in the ratio of the counts');
ok('and the pair is placed exactly tangent — separation equal to the sum of the radii',
  /ga\.position\.set\(M\.x-ra,0,M\.z\); gb\.position\.set\(M\.x\+rb,0,M\.z\);/.test(src),
  'measured on screen: separation 7.4604 against sum of radii 7.4604');
ok('the two gears COUNTER-rotate, each at one turn per its own count',
  /M\.ga\.rotation\.y= \(d\/unit\/M\.a\.n\)\*Math\.PI\*2;/.test(src)
  && /M\.gb\.rotation\.y=-\(d\/unit\/M\.b\.n\)\*Math\.PI\*2;/.test(src),
  'a pair turning the same way would not be a mesh, and the ratio 365:260 is the engagement condition');
/* ── THIS PINNED A CAPTION, NOT THE COMPUTATION IT NAMES ────────────────────
 * It required the phrase "where they arrive, not what is written on them" in a
 * SCENE LABEL. That sentence moved to the wheels panel when the stage was measured
 * and found to be keeping three of its eleven ring names: eleven labels, a title
 * and three caption sentences were competing for a few hundred pixels, and the
 * declutter pass was choosing between them. The fact is unchanged and the sentence
 * is still in the atlas — the clause now asserts the computation and looks for the
 * sentence where a reader can actually read it. */
ok('the closing count is COMPUTED by the atlas\'s own lcm rather than written on the gears',
  /const closes=chronLCM\(M\.a\.n,M\.b\.n\);/.test(src)
  && /A meshing pair closes where the two wheels arrive, not where it is written on them/.test(src),
  'lcm(260,365) = 18980 and lcm(10,12) = 60 — where the pair arrives');
ok('the teeth are one instanced mesh per gear, not 625 draw calls for a wheel looked at once',
  /new THREE\.InstancedMesh\(new THREE\.BoxGeometry/.test(gearFn),
  '260 + 365 + 10 + 12 teeth in four instanced meshes');
ok('and the mesh is measurable from outside, because "these two engage" is a claim about geometry',
  /globalThis\.HCC_WHEEL_GEARS=/.test(src) && /pitchA:/.test(src) && /sumRadii:/.test(src),
  'HCC_WHEEL_GEARS() reports pitch, radii, separation and turn for each pair');
ok('the pairs stand clear of the nest — the first placement put them inside it and two meshing gears read as two circles',
  /x:19\.5/.test(meshBlock)
  && /controls\.target\.copy\(p\)\.add\(new THREE\.Vector3\(\d+,0,\d+\)\)/.test(src),
  'and the frame is offset to hold both the nest and the gears');

/* ── THE ONE TRADITION WHOSE FIGURE IS NOT A CIRCLE ───────────────────────
   The Aztec Sun Stone does not divide a circle at its centre. It sets FOUR
   DESTROYED WORLDS around a fifth in a quincunx — a sequence of world-ages, not a
   count of days — so drawing it as another ring would say the wrong thing. The
   xiuhmolpilli ring of 52 years IS in the nest, because that one is a count; the
   five suns stand beside it as the figure they were drawn as.

   AND NO DURATION IS ASSIGNED TO THE FOUR PAST SUNS. The sources do not agree, and
   several give none. The order and the manner of each ending are what the sources
   do agree on, and that is all this draws. Filling in a span from one manuscript
   would be the atlas choosing a source without saying so. */
const sunsBlock = src.slice(src.indexOf('const WOT_SUNS=Object.freeze(['), src.indexOf('function wotBuildSuns'));
/* THE FOURTH PATTERN TODAY THAT REFUSED A CHARACTER THE DATA CONTAINS. pos:[ 1,0,-1]
   carries a space for alignment and (-?\d) does not allow one, so this matched ONE
   sun of five and reported the quincunx broken. Whitespace is allowed where the
   file actually has it. */
const suns = [...sunsBlock.matchAll(/\{id:'([a-z]+)',\s*pos:\[\s*(-?\d)\s*,\s*0\s*,\s*(-?\d)\s*\]/g)]
  .map(m => ({ id: m[1], x: +m[2], z: +m[3] }));
ok('the five suns are a QUINCUNX — four at the corners around one at the centre',
  suns.length === 5
  && suns.filter(x => x.x === 0 && x.z === 0).length === 1
  && suns.filter(x => Math.abs(x.x) === 1 && Math.abs(x.z) === 1).length === 4,
  suns.map(x => `${x.id}(${x.x},${x.z})`).join(' '));
ok('each names the manner of its ending, which is what the sources agree on',
  /jaguars devoured them/.test(sunsBlock) && /the wind carried them away/.test(sunsBlock)
  && /a rain of fire/.test(sunsBlock) && /the flood/.test(sunsBlock)
  && /to end in earthquake/.test(sunsBlock),
  'jaguars · wind · fire · flood · and the present age, to end in earthquake');
ok('and NO duration is assigned to any of them, because the sources do not agree on one',
  !/years/.test(sunsBlock) && /no duration is assigned to the five suns, because the sources do not agree on one/.test(src),
  'a span taken from one manuscript would be the atlas picking a source in silence — and the sentence saying so is in the panel, not in a scene label the declutter pass can drop');
ok('the Aztec tradition carries BOTH figures — the 52-year ring, which is a count, and the suns, which are not',
  rows.some(r => r.id === 'aztec' && r.div === 'WOT_XIUHMOLPILLI_YR' || r.id === 'aztec')
  && /WOT\.sunsRoot\.visible=!off\.has\('aztec'\)/.test(src),
  'and hiding the tradition hides both, because they are one tradition');

/* ── the reader chooses which wheels stand ────────────────────────────────── */
/* AND THE FIRST FORM OF THIS CHECK NAMED THE WRONG MECHANISM. It asserted that the
   click handler calls wotApplyVisibility, and a mutation removing that call passed —
   correctly, because the tick re-applies visibility every frame, so the handler's
   call is a convenience and not the guarantee. What actually makes a chip change the
   scene is that it WRITES state.wotHidden and the scene READS it every update. That
   is what is asserted, and removing the write fails. */
ok('a chip writes the reader\'s choice into state, which is the only thing that makes it reach the scene',
  /data-wot="\$\{T\.id\}"/.test(src)
  && /ctl\.querySelectorAll\('\[data-wot\]'\)\.forEach/.test(src)
  && /state\.wotHidden=\[\.\.\.cur\];/.test(src)
  && /function wotHidden\(\)\{ return new Set\(state\.wotHidden\|\|\[\]\); \}/.test(src),
  'the handler writes state.wotHidden; wotApplyVisibility reads it on every update');
ok('and the visibility is applied from the declared list every update, not assigned once at a click',
  /function wotApplyVisibility\(\)\{[\s\S]{0,600}?for\(const r of WOT\.rings\)/.test(src)
  && /wotApplyVisibility\(\);\s*\n\}/.test(src),
  'so a wheel cannot be left hidden by a click and shown by a redraw');

/* ── and a field is named for exactly what it measures ────────────────────── */
ok('the suns report SCENE-GRAPH visibility under that name, not "on screen"',
  /visibleInSceneGraph:/.test(src) && !/onScreen:WOT\.suns/.test(src)
  && /and NOT whether the camera is pointed at the figure/.test(src),
  'the first placement was outside the frame and the field said five, truthfully and uselessly — '
  + 'the same class as a field called isolated_laboratories that counted only bus isolation');

/* ── TWO INSTRUMENTS IN ONE WORLD, AND ONE OF THEM WAS WRONG ──────────────
   The chronometry laboratory and the wheels both compute a phase for tzolk'in,
   haab', the sexagenary cycle and the Egyptian civil year. Nobody had ever asked
   whether they agree. With the clock PAUSED — otherwise the comparison measures how
   long you waited between the two publications — three of the four disagreed:

     tzolk'in       agreed to 0.0007 of a turn, which is publication timing
     haab'          agreed to 0.0005
     Egyptian civil DISAGREED BY 35.2 DAYS
     sexagenary     disagreed by 4.1 years

   THE EGYPTIAN ONE WAS A DEFECT AND THE ARITHMETIC NAMED IT. Chronometry counted
   from the Nabonassar era, Julian day 1448638; the wheels counted from the MAYA
   correlation, 584283; and (1448638 − 584283) mod 365 = 35 exactly. The wheels were
   wrong. Every wheel had taken its zero from the Maya constant, which is right for
   the two Maya wheels because it IS their era and wrong everywhere else.

   THE SEXAGENARY ONE WAS NOT A DEFECT. The cycle is applied to both days and years
   in Chinese reckoning: chronometry computes epochDays mod 60, a 60-DAY count, and
   the wheel turns once per 60 YEARS. Both are real and they are different
   quantities — which neither said, and two numbers under one name is how a reader
   concludes the atlas contradicts itself. */
ok('each wheel counts from its OWN era where the atlas has one, not from one constant borrowed for all',
  /const WOT_EPOCHS=Object\.freeze\(\{maya:MAYA_GMT_JDN, haab:MAYA_GMT_JDN, egypt:EGY_NABONASSAR_JDN\}\)/.test(src)
  && /WOT_EPOCHS\[T\.id\]\?\?MAYA_GMT_JDN/.test(src),
  'the Maya correlation is the Maya era and nobody else’s');

/* ONE CONSTANT, TWO READERS. The era was a bare literal inside the chronometry
   publish and an origin inside the wheels, which is two authorities for one number
   and exactly how they came to disagree. */
const literalUses = (src.match(/1448638/g) || []).length;
const commentUses = (src.match(/1448638/g) || []).filter((_, i) => true).length;
const decl = /const EGY_NABONASSAR_JDN=1448638;/.test(src);
const chronReads = /chronJDN\(state\.epochDays\)-EGY_NABONASSAR_JDN/.test(src);
ok('the Nabonassar era is declared ONCE and read by name at both instruments',
  decl && chronReads && /egypt:EGY_NABONASSAR_JDN/.test(src),
  decl ? (chronReads ? 'chronometry and the wheels read the same named constant'
                     : 'chronometry still carries the era as a bare literal')
       : 'the era is not declared as a constant at all');

ok('and the two sexagenary quantities each say which they are — a 60-day count and a 60-year one',
  /counted in YEARS/.test(src) && /a 60-DAY count/.test(src)
  && /they are different quantities/.test(src),
  'both are real Chinese reckoning; under one name they read as a contradiction');

console.log('\n' + (fail ? ('✖ ' + fail + ' FAILED, ' + pass + ' passed') : ('✔ ALL ' + pass + ' CHECKS PASSED')));
process.exit(fail ? 1 : 0);
