#!/usr/bin/env node
'use strict';
/* ONE FRAME OF THIRTEEN BEHAVED UNLIKE THE OTHER TWELVE, AND THE OVERVIEW SHOWED
 * EVERYTHING.
 *
 * THE EXPLORER WAS BOLTED ON BESIDE THE CYCLES WORLD rather than built inside it,
 * with five special cases nothing else here has: it sat OUTSIDE cycGroup, it hid the
 * ENTIRE group whenever it was on, it bypassed updateCyc, it returned early out of
 * the top of the framing function before any other frame was considered, and it
 * REPLACED the control panel instead of contributing a section to it. A reader met a
 * different interface in one frame and had no way to know why. None of it was
 * needed: cycGroup carries no transform, and CYC_FRAME_INSTRUMENTS — which already
 * listed the explorer — is the single authority on when an instrument is visible.
 *
 * AND "ALL CYCLES" WAS SHOWING EVERYTHING, WHICH IS NOT AN OVERVIEW. Measured on
 * screen: seven instruments and 165 visible labels. A frame with 165 labels has no
 * reader — the eye finds no entry, and the declutter pass hides whichever labels
 * lose the collision test, so what is seen is arbitrary. The name of the frame is
 * its subject: the hierarchy of scales, one cycle nested in the next. It keeps that
 * and nothing else. The four instruments removed each already had their own frame.
 *
 *   before   7 instruments · 165 labels
 *   after    3 instruments ·  31 labels
 *   and every one of the thirteen frames still has an instrument of its own,
 *   the busiest being the resonance web at 84, which is that subject and not clutter
 */
const fs = require('node:fs'), path = require('node:path');
const src = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
let pass = 0, fail = 0;
/* a failing check must not print the sentence written for the passing case */
const ok = (n, c, d) => { if (c) { pass++; console.log('  PASS — ' + n + (d ? ' :: ' + d : '')); }
  else { fail++; console.log('  FAIL — ' + n + (d ? ' :: EXPECTED ' + d : '')); } };

/* ── THE EXPLORER IS AN ORDINARY FRAME ────────────────────────────────────── */
ok('the explorer lives inside cycGroup, a sibling of every other cycles instrument',
  /hccCyclesStage\.add\(cycGroup\);\s*\ncycGroup\.add\(cycButterflyExplorerInst\);/.test(src)
  && !/hccCyclesStage\.add\(cycGroup,cycButterflyExplorerInst\)/.test(src),
  'it was a sibling of the whole world instead of a member of it');
ok('and nothing hides the entire cycGroup to show one frame',
  !/function hccButterflySyncVisibility/.test(src)
  && !/cycGroup\.visible=state\.mode==='cyc'&&!active/.test(src),
  'that was a second authority over a fact the declaration table owns');
ok('the declaration table is what makes it visible, as for every other instrument',
  /\{name:'cycButterflyExplorerInst', frames:\['butterfly-explorer'\]/.test(src),
  'one list, thirteen frames, no exceptions');

const ctlBranch = /else if\(state\.mode==='cyc'&&state\.cycFrame==='butterfly-explorer'\)\{\s*\n\s*ctl\.innerHTML=/.test(src);
ok('the control panel is BUILT THE SAME WAY for all thirteen frames',
  !ctlBranch && /\$\{state\.cycFrame==='butterfly-explorer'\?hccButterflyControls\(\):''\}/.test(src),
  ctlBranch ? 'the explorer still replaces the whole panel with its own markup'
    : 'it contributes a section, as the galactic butterfly and the wheels do');
ok('and its controls bind where every other frame’s bind',
  /if\(state\.cycFrame==='butterfly-explorer'\)\{ try\{ hccButterflyBindControls\(\); \}catch\(e\)\{\} \}/.test(src),
  'not from a branch that had already thrown the panel away');
ok('it ticks from updateCyc like the others rather than replacing the call',
  /if\(frame==='butterfly-explorer'\) updateGalacticButterfly\(\);/.test(src)
  && !/if\(state\.cycFrame==='butterfly-explorer'\)updateGalacticButterfly\(\);\s*\n\s*else \{/.test(src),
  'one tick path for the world, not one path and an exception');
ok('and it frames itself in the ordinary place, with the ordinary shape',
  /if\(state\.cycFrame==='butterfly-explorer'\)\{[\s\S]{0,400}?setControlDistanceLimits\(2,90\);[\s\S]{0,60}?return;\s*\n\s*\}/.test(src)
  && !/if\(hccButterflySyncVisibility\(\)\)\{/.test(src),
  'it used to return out of the TOP of the framing function, before the guides');

/* ── THE OVERVIEW IS AN OVERVIEW ──────────────────────────────────────────── */
const decl = src.slice(src.indexOf('const CYC_FRAME_INSTRUMENTS=['), src.indexOf('\n];', src.indexOf('const CYC_FRAME_INSTRUMENTS=[')));
const rows = [...decl.matchAll(/\{name:'(\w+)',\s*frames:\[([^\]]*)\]/g)]
  .map(m => ({ name: m[1], frames: m[2].split(',').map(x => x.replace(/'/g, '').trim()).filter(Boolean) }));
const inHierarchy = rows.filter(r => r.frames.includes('hierarchy')).map(r => r.name);
ok('"All cycles" shows the hierarchy of scales and not every instrument the world owns',
  inHierarchy.length === 3
  && ['galInst', 'precInst', 'seaInst'].every(n => inHierarchy.includes(n)),
  inHierarchy.join(' ') + ' — seven instruments and 165 labels before, three and 31 after');

/* AND THE TWO INSTRUMENTS THAT COULD OVERRIDE THE TABLE NO LONGER CAN. Removing
   'hierarchy' from the declaration moved the count only from 165 to 112, because two
   assignments below the loop named the frame again on their own. A declaration
   something else can override is not a declaration. */
ok('the torus and the web take their frames FROM the declaration rather than naming one again',
  /const torusFrames=\(CYC_FRAME_INSTRUMENTS\.find\(d=>d\.name==='cycPhaseInst'\)/.test(src)
  && /const webFrames=\(CYC_FRAME_INSTRUMENTS\.find\(d=>d\.name==='cycResonanceInst'\)/.test(src)
  && !/cycResonanceInst\.visible = frame==='hierarchy'/.test(src),
  'only the two extra CONDITIONS are decided there now, never the frame list');

/* ── and no frame was emptied to achieve it ───────────────────────────────── */
const views = [...src.slice(src.indexOf('const HCC_CYCLE_VIEWS=['), src.indexOf('\n];', src.indexOf('const HCC_CYCLE_VIEWS=[')))
  .matchAll(/\n\s*\['([A-Za-z0-9_-]+)',/g)].map(m => m[1]);
const empty = views.filter(v => !rows.some(r => r.frames.includes(v)));
ok('every one of the thirteen frames still has an instrument of its own',
  empty.length === 0,
  empty.length ? ('no instrument declared for: ' + empty.join(' '))
    : `${views.length} frames, each with at least one — measured on screen, the busiest is the resonance web at 84 labels`);

console.log('\n' + (fail ? ('✖ ' + fail + ' FAILED, ' + pass + ' passed') : ('✔ ALL ' + pass + ' CHECKS PASSED')));
process.exit(fail ? 1 : 0);
