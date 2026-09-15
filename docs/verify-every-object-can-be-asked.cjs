#!/usr/bin/env node
'use strict';
/* ══ EVERY OBJECT IN THE ATLAS CAN BE ASKED ══════════════════════════════════
 *
 * The atlas registers 680 selectable objects, each with a description and a rows()
 * that computes its information on demand. Whether that information can actually
 * be PRODUCED was never asked.
 *
 * It was asked, by calling rows() on every one of them:
 *
 *     680 registered · 640 answered · 40 THREW
 *
 * The forty were every Lagrange point of every planet, and every one of them
 * failed the same way: rows() reads a rotating frame out of LAG_MARKS, and that
 * frame is filled in by lagUpdate — which returns early unless the Lagrange
 * stations are visible. So in every world but the Solar System, and in the Solar
 * System before the stations are switched on, the frame was null and the panel
 * threw on F.a. The guard in front of it checked that the MARK existed and then
 * read a field of the FRAME, which is a different object.
 *
 * The frame is a function of the epoch and nothing else, so it is computed when
 * the tick has not left one behind. An object's information must not depend on
 * whether something else has run.
 *
 * AND FIVE OBJECTS HAD NO DESCRIPTION, only an equation. Four were solver families
 * whose entire description was twelve characters of "∂u/∂t = α∇²u" where every
 * other object in the atlas carries a sentence saying what the thing is and what
 * it does not claim.
 */
const fs = require('node:fs'), path = require('node:path');
const ROOT = path.join(__dirname, '..');
const src = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
let pass = 0, fail = 0;
const ok = (n, c, d) => { if (c) { pass++; console.log('  PASS — ' + n + (d ? ' :: ' + d : '')); }
  else { fail++; console.log('  FAIL — ' + n + (d ? ' :: EXPECTED ' + d : '')); } };

{ /* 1. THE LAGRANGE PANELS COMPUTE THEIR OWN FRAME */
  ok('THE FORTY LAGRANGE PANELS COMPUTE THE FRAME THEY NEED instead of depending on a tick that only runs while their stations are visible — the information was there and unreachable from every other world',
    /let F=m\.frame;\s*\n\s*if\(!F\|\|!Number\.isFinite\(F\.a\)\)\{ try\{ F=lagFrame\(p, state\.epochDays\/36525\); \}catch\(e\)\{ F=null; \} \}/.test(src)
    && /if\(!F\|\|!Number\.isFinite\(F\.a\)\) return \[\['pair'/.test(src),
    'and where even that cannot be had it returns the rows it can rather than throwing — a panel that throws tells the reader nothing at all');
  ok('and the guard now checks the thing it is about to read, which is the fault this class of bug always is',
    !/const P=lagPoints\(mu\)\[k\], F=m\.frame;/.test(src),
    'the old one asked whether the MARK existed and then read a field of the FRAME');
}

{ /* 2. EVERY OBJECT SAYS WHAT IT IS */
  const md = (src.match(/const modelDesc=\{([\s\S]*?)\n  \};/) || [, ''])[1];
  const keys = [...md.matchAll(/^\s*(\w+):'/gm)].map(m => m[1]);
  ok('and every solver family says in prose what it is and what it does NOT claim, with the equation kept on the line the panel already prints it on',
    keys.length === 8
    && /function fieldModelDesc\(m\)\{/.test(src)
    && /desc:FIELD\.fieldModelDesc\(model\)/.test(src)
    && !/desc:FIELD\.equations\[model\]/.test(src)
    && /reduced number, not a material property/.test(src),
    `${keys.length} described — ${keys.join(', ')} — each naming its reduced units and the calibration it does not have`);
  ok('and the description helper reads the table it is declared beside rather than the const it is being built inside — the first form said FIELD.equations[m] and threw a TDZ ReferenceError during module evaluation, which killed the page before LAB_BY_ID existed and reported itself as a fault in something else entirely',
    /const eq=equations\[m\]\|\|'';/.test(src)
    && !/const eq=\(FIELD&&FIELD\.equations&&FIELD\.equations\[m\]\)/.test(src),
    'the two tables are the same object; one of them is in scope');
  ok('and the light-year rung of the phi-ladder says something rather than "Interstellar scale."',
    /the distance light covers in a Julian year, 9\.4607×10¹⁵ m/.test(src)
    && !/desc:'Interstellar scale\.'/.test(src),
    'it is the rung where the ladder stops describing objects and starts describing the space between them');
}

{ /* 3. AND IT IS EXERCISED, NOT TRUSTED */
  ok('and the boot suite ASKS every registered object for its information rather than trusting that a panel exists, which is the only way the forty were found',
    /for\(const \[k,sel\] of SELECT\)\{/.test(src)
    && /rows = typeof sel\.rows==='function' \? sel\.rows\(\) : \(sel\.rows\|\|null\);/.test(src)
    && /catch\(e\)\{ threw\.push/.test(src)
    && /if\(!defer\('every object can be asked'\)\)\{/.test(src),
    'deferred, because six hundred and eighty rows() calls is a real cost on a reader’s first frame and this is a release gate, not an arrival check');
}

console.log(`\n  ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
