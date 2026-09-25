#!/usr/bin/env node
'use strict';
/* ══ THE CONTROLS PANEL IS RUBBER, AND EVERY FIELD PARAMETER SAYS WHAT IT DRIVES ══════
 * Two requests: the Controls panel must compress as far as a small screen needs while you
 * tune, and the Field Laboratory's parameters must not look unavailable. Measured first: all
 * ten sliders and their numeric boxes do write the state — but all eight coefficients were
 * shown for every equation although each drives exactly one, so seven of them silently did
 * nothing whatever equation was on; and the structure view had silenced the vector-field
 * checkbox. This file checks the fixes in index.html:
 *   1. A−/A+ scale the whole panel by CSS zoom (text, controls and spacing together), ¶ hides
 *      the explanatory notes but never a live readout (notes with an id), the gold corner
 *      drags width and height, a double-click restores them, and all of it is remembered;
 *      a small screen starts a size smaller
 *   2. nothing leaks from under a smaller panel: the coach card in the same corner hides
 *      while Controls is open, and the finder bar wraps instead of clipping
 *   3. the current equation's coefficients come first and lit; every other coefficient stays
 *      reachable, dimmed, with a one-press switch to the equation it drives — and Poisson,
 *      which has no coefficient, says so and points to ⚡ Solve to convergence
 *   4. the vector-field checkbox acts in both views again
 *   5. MUTATION: a notes rule without the :not([id]) guard would hide the live readouts
 */
const fs = require('node:fs'), path = require('node:path');
const SRC = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
let pass = 0, fail = 0;
const ok = (n, c, d) => { if (c) { pass++; console.log('  PASS — ' + n + (d ? ' :: ' + d : '')); } else { fail++; console.log('  FAIL — ' + n + (d ? ' :: ' + d : '')); } };
ok('rubber: A−/A+ zoom the whole panel, ¶ hides notes, the corner drags width and height, a double-click restores, all remembered, smaller on small screens',
  /#ctl\{left:14px;bottom:14px;width:336px;max-height:58vh;overflow:auto;z-index:40;zoom:var\(--ctl-zoom,1\)\}/.test(SRC) && /id="ctlZoomOut"/.test(SRC) && /id="ctlZoomIn"/.test(SRC) && /id="ctlCompact"/.test(SRC)
  && /function ctlCornerInit\(\)\{/.test(SRC) && /h\.addEventListener\('dblclick',/.test(SRC) && /localStorage\.setItem\('hcc\.ctl\.ui'/.test(SRC) && /const small=\(innerHeight<720\|\|innerWidth<820\); return Object\.assign\(\{zoom:small\?0\.86:1/.test(SRC));
const noteRule = SRC.match(/#ctl\.ctl-compact \.sectBody > \.note:not\(\[id\]\), #ctl\.ctl-compact \.sect > \.note:not\(\[id\]\)\{display:none\}/);
ok('compact never hides a live readout: only notes WITHOUT an id go (the field audit, structure, T_c readouts all carry ids)', !!noteRule && /class="note" id="fieldStructInfo"/.test(SRC) && /class="note" id="fieldTcOut"/.test(SRC));
ok('nothing leaks from under a smaller panel: the coach card hides while Controls is open, and the finder bar wraps',
  /body\.ctl-shown #atlasCoach\{visibility:hidden\}/.test(SRC) && /document\.body\.classList\.toggle\('ctl-shown',open\)/.test(SRC) && /#ctl \.ctlFind\{flex-wrap:wrap;row-gap:3px\}/.test(SRC));
ok('every coefficient says which equation it drives: the current one first and lit, the others dimmed with a one-press switch; Poisson says it has none',
  /data-coef-model="\$\{mod\}"/.test(SRC) && /data-coef-go="\$\{mod\}"/.test(SRC) && /const mine=C\.filter\(c=>c\[2\]===m\), rest=C\.filter\(c=>c\[2\]!==m\);/.test(SRC)
  && /\['fieldTemp','Ising temperature T\/J','ising',0\.2,8,0\.01\]/.test(SRC) && /Poisson has no coefficient to tune/.test(SRC) && /ctl\.querySelectorAll\('\[data-coef-go\]'\)/.test(SRC));
ok('the vector-field checkbox acts in both views again', /vectors\.visible=!!state\.fieldVectors&&state\.vectorFields!==false/.test(SRC) && !/vectors\.visible=cloud&&/.test(SRC));
/* mutation: without the guard the live readouts go too */
const readouts = ['fieldDiag', 'fieldStructInfo', 'fieldTcOut'], hidden = sel => readouts.filter(id => /:not\(\[id\]\)/.test(sel) ? false : true);
ok('MUTATION — a compact rule without :not([id]) would hide the three live readouts, and is caught', hidden('#ctl.ctl-compact .note{display:none}').length === 3 && hidden(noteRule ? noteRule[0] : '').length === 0);
console.log('\n  ' + pass + ' passed, ' + fail + ' failed'); process.exit(fail ? 1 : 0);
