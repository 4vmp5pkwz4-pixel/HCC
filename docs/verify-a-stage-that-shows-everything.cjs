#!/usr/bin/env node
'use strict';
/* ══ A STAGE THAT SHOWS EVERYTHING MUST RUN EVERYTHING ═══════════════════════
 *
 * The cycles world has a frame called "All models · one stage". Measured on it,
 * by sampling every instrument's transforms over three seconds and again in the
 * instrument's own frame:
 *
 *     antikGroup                in its own frame: moves | on the stage: FROZEN
 *     cycWheelsInst             in its own frame: moves | on the stage: FROZEN
 *     cycButterflyExplorerInst  in its own frame: moves | on the stage: FROZEN
 *
 * A quarter of the instruments on the stage that shows everything were
 * photographs of themselves. Each was ticked by FRAME NAME — `if(frame===
 * 'antikythera') antikUpdate(...)` — and the shared stage is a different frame
 * name, so adding a frame froze them by omission. The linked view next door had
 * the general rule right all along: `if(cycLinkedInst.visible)
 * updateCycLinkedView()`. An instrument is ticked because it is ON STAGE.
 *
 * AND THE STAGE HAD NO ARGUMENT. Twelve instruments stood in five UNLABELLED
 * rows, ordered within each row by BOUNDING-SPHERE RADIUS — a fact about the
 * mesh that a reader cannot see and would not care about if they could — and
 * spaced by those same radii, which made the stage 163 units deep and 72 wide.
 * The five rows were the atlas's own epistemic grouping and existed only in a
 * table. What arrived on screen was a field of twelve unrelated objects.
 *
 * Two axes now, and both mean something. ACROSS: time, on a log₁₀-days rule with
 * its decades ticked and its landmarks named, every instrument that has a period
 * joined to its own place on it by a line. INTO THE STAGE: what kind of claim it
 * is, five rows each carrying its heading in the scene. Every instrument is
 * scaled into one slot, because size here was never a measurement — and the five
 * that have no period have no line, which is the statement their row is about.
 */
const fs = require('node:fs'), path = require('node:path');
const ROOT = path.join(__dirname, '..');
const src = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
let pass = 0, fail = 0;
const ok = (n, c, d) => { if (c) { pass++; console.log('  PASS — ' + n + (d ? ' :: ' + d : '')); }
  else { fail++; console.log('  FAIL — ' + n + (d ? ' :: EXPECTED ' + d : '')); } };

function balanced(from, open, close) {
  const i = src.indexOf(from);
  if (i < 0) throw new Error('marker not found: ' + from.slice(0, 44));
  const k = src.indexOf(open, i);
  let d = 0, q = null;
  for (let n = k; n < src.length; n++) {
    const c = src[n];
    if (q) { if (c === '\\') { n++; continue; } if (c === q) q = null; continue; }
    if (c === "'" || c === '"' || c === '`') { q = c; continue; }
    if (c === open) d++;
    else if (c === close) { d--; if (!d) return src.slice(k, n + 1); }
  }
  throw new Error('unbalanced block from ' + from.slice(0, 44));
}

{ /* 1. ON STAGE, THEREFORE RUNNING */
  ok('AN INSTRUMENT ON STAGE IS RUNNING. Three of the twelve were ticked by frame name, so the stage that shows everything — a different frame name — showed three photographs: the Antikythera mechanism, the wheels of time and the butterfly explorer all moved in their own frames and stood still on it',
    /if\(antikGroup\.visible\) antikUpdate\(state\.epochDays\);/.test(src)
    && /if\(cycWheelsInst\.visible\)\{\s*\n\s*updateWheelsOfTime\(\);/.test(src)
    && /if\(cycButterflyExplorerInst\.visible\) updateGalacticButterfly\(\);/.test(src)
    && !/if\(frame==='antikythera'\) antikUpdate/.test(src)
    && !/if\(frame==='wheels'\)\{\s*\n\s*updateWheelsOfTime/.test(src)
    && !/if\(frame==='butterfly-explorer'\) updateGalacticButterfly/.test(src),
    'all three now read .visible, as the linked view next door always did — so adding a frame can no longer freeze an instrument by omission');
  ok('and while the stage is up it is the only thing that places an instrument: the per-frame layout wrote three of them back to their own-frame position and scale on every tick, because it ran whatever frame was showing',
    /if\(!_cycAtlasOn\)\{\s*\n\s*galInst\.position\.set\(0,0,0\);/.test(src)
    && /galInst\.scale\.setScalar\(1\); precInst\.scale\.setScalar\(\.96\); seaInst\.scale\.setScalar\(1\);\s*\n\s*\}/.test(src),
    'the galactic clock, the seasons dial and the precession diagnostic kept their slot only because nothing else wrote to them');
}

{ /* 2. EVERY INSTRUMENT DECLARES A PERIOD OR THE REASON IT HAS NONE */
  const tbl = balanced('const CYC_ATLAS_PERIOD=Object.freeze({', '{', '}');
  const entries = [...tbl.matchAll(/(\w+):\s*\{([^}]*\{[^}]*\}[^}]*|[^}]*)\}/g)].map(m => [m[1], m[2]]);
  const withCycle = entries.filter(e => /cycle:\s*'/.test(e[1]));
  const withNone = entries.filter(e => /none:\s*'/.test(e[1]));
  const reasoned = withNone.every(e => (e[1].match(/none:\s*'([^']*)'/) || [, ''])[1].length > 40);
  const named = entries.every(e => /t:\s*\{en:'[^']+'/.test(e[1]));
  ok('and every instrument on it declares its characteristic period, or the written reason it has none — because five of the twelve are not about a period at all and that is the whole subject of the rows they stand in',
    entries.length === 12 && withCycle.length === 6 && withNone.length === 6 && reasoned && named,
    `${entries.length} declared · ${withCycle.length} with a period from the cycle table · ${withNone.length} with a reason they have none, each over forty characters · every one carrying its own name, because taking the name from the frame gave three instruments the label "All cycles"`);
}

{ /* 3. THE TWO AXES */
  ok('and the rows are ordered by that period rather than by bounding-sphere radius, so time runs left to right in every row, the same direction as the rule beneath them',
    /const order=list\.slice\(\)\.sort\(\(a,b\)=>\{\s*\n\s*const la=cycAtlasLogPeriod\(a\.name\), lb=cycAtlasLogPeriod\(b\.name\);/.test(src)
    && !/list\.sort\(\(a,b\)=>b\.sphere\.radius-a\.sphere\.radius\);/.test(src),
    'the widest-first alternating placement is gone with the radius it encoded');
  ok('and every instrument is scaled into one slot, because the butterfly measured 25 units across and the Antikythera dials 6 — a factor of four that says nothing about either and made the stage 163 deep',
    /const CYC_ATLAS_SLOT_R=7;/.test(src)
    && /const k=CYC_ATLAS_SLOT_R\/Math\.max\(u\.sphere\.radius,1e-6\);/.test(src)
    && /const rowR=ordered\.map\(\(\)=>CYC_ATLAS_SLOT_R\);/.test(src)
    && /if\(i>0\) x\+=2\*CYC_ATLAS_SLOT_R\+CYC_ATLAS_MARGIN;/.test(src),
    'a regular grid, so POSITION is the only thing left carrying a claim');
  ok('and the rule, its decades, its landmarks, the line from each instrument to its own place on it, and the heading on each row are all built FROM THE PLAN, so the furniture cannot describe a layout other than the one standing',
    /function cycAtlasBuildFurniture\(\)\{/.test(src)
    && /const plan=cycAtlasPlan\(\);/.test(src)
    && /cycAtlasFurniture\.visible=!!on;\s*\n\s*if\(on\) try\{ cycAtlasBuildFurniture\(\); \}/.test(src)
    && /const lg=cycAtlasLogPeriod\(u\.name\);\s*\n\s*if\(lg===null\)\{ silent\+\+; continue; \}/.test(src),
    'and an instrument with no period gets no line, which is the absence the reader is meant to see');
}

{ /* 4. THE THINGS THE MEASUREMENTS FORCED */
  ok('and the stage re-measures when something on it has grown, because several of these are built on demand: an unbuilt group measures as nothing, the fallback radius is 4, and the slot scale then comes out as an ENLARGEMENT — the wheels stood 72 units across a 14-unit slot',
    /function cycAtlasStale\(\)\{/.test(src)
    && /if\(r>CYC_ATLAS_SLOT_R\*1\.73\*1\.5\) return true;/.test(src)
    && /if\(cycAtlasStale\(\)\)\{ cycAtlasApply\(false\); cycAtlasApply\(true\); \}/.test(src),
    'measured as a size, not as a child count — a count recorded on the first pass is already the built count');
  ok('and every label inside every instrument stands down here and is kept down, because instruments built on demand add labels after the stand-down ran — measured on screen as "Stonehenge · 56 Aubrey holes" written across its neighbours',
    /if\(o\.visible\)\{ o\.visible=false; o\.userData\._cycAtlasHid=true; \}/.test(src)
    && /if\(cycAtlasHideT>0\.5\)\{ cycAtlasHideT=0;/.test(src)
    && /lab\.visible = galInst\.visible && state\.showLabels!==false && !lab\.userData\._cycAtlasHid;/.test(src),
    'including the galaxy\u2019s own arm names, which are re-shown every tick and would otherwise have overridden the stand-down');
  ok('and the camera distance is SOLVED from the field of view rather than tuned: three typed multipliers were tried and all three cropped the rule, which is the one landmark the time axis exists to reach',
    /const d=R\/Math\.sin\(Math\.max\(0\.2,Math\.min\(vFov,hFov\)\)\/2\);/.test(src)
    && /const hFov=2\*Math\.atan\(Math\.tan\(vFov\/2\)\*\(camera\.aspect\|\|1\.6\)\);/.test(src),
    'the narrower of the two fields, so the stage fits a phone held upright as well as a desk');
}

console.log(`\n  ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
