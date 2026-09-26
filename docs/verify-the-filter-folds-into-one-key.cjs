#!/usr/bin/env node
'use strict';
/* ══ THE CONTROLS FILTER FOLDS INTO ONE KEY ══════════════════════════════════════════════
 * A reader made the Controls sheet small and could not use it: the grip, the header rail and a
 * sticky filter row (field, ✕, A−, A+, ¶) took the whole of a short sheet, and the last row it
 * had left sank under the time machine. This file checks the source for the repair:
 *   1. the filter strip is hidden unless opened or holding a query, so a short sheet shows
 *      controls directly under its rail
 *   2. it opens from ONE key in the rail (⌕), which carries the number of changed settings,
 *      and from "/" whenever Controls is open and the reader is not typing
 *   3. closing it clears the query — a folded filter can never hide sections nobody can see —
 *      and Escape on an empty field closes it; the decision rule is run here on a copy
 *   4. the zoomed sheet stands on the same floor: its bottom offset is divided by its own zoom
 *   5. the key is written with a plain title, because it can be built before the language state
 *      exists (a TT() there stopped the page from booting — measured, once)
 */
const fs = require('node:fs'), path = require('node:path');
const SRC = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
let pass = 0, fail = 0;
const ok = (n, c, d) => { if (c) { pass++; console.log('  PASS — ' + n + (d ? ' :: ' + d : '')); } else { fail++; console.log('  FAIL — ' + n + (d ? ' :: ' + d : '')); } };

ok('the filter strip is hidden unless opened or holding a query, so a short sheet shows controls directly under its rail',
  /#ctl:not\(\.ctl-find-open\) > \.ctlFind\{display:none!important\}/.test(SRC) && /p\.classList\.toggle\('ctl-find-open',CTL_FIND\.open\|\|!!CTL_FIND\.q\);/.test(SRC) && /const CTL_FIND=\{ q:'', mode:null, open:false \};/.test(SRC));

ok('it opens from one key in the rail, which carries the number of changed settings, and from "/" while Controls is open and nobody is typing',
  /const PANEL_RAIL_ROLES=\['sheetGrip','ctlFindBtn','closeBtn','foldBtn','pinBtn','panel-collapser'\];/.test(SRC) && /b\.className='ctlFindBtn'; b\.textContent='⌕';/.test(SRC)
  && /if\(n\) k\.dataset\.n=String\(n\); else delete k\.dataset\.n;/.test(SRC) && /\.ctlFindBtn\[data-n\]::before\{content:attr\(data-n\)/.test(SRC)
  && /if\(e\.key!=='\/'\|\|e\.ctrlKey\|\|e\.metaKey\|\|e\.altKey\) return;/.test(SRC) && /if\(!panelIsOpen\('ctl'\)\) return; \}catch\(x\)\{ return; \} e\.preventDefault\(\); ctlFindToggle\(true\);/.test(SRC));

{ const a = SRC.indexOf('function ctlFindToggle(force){'), f = SRC.slice(a, SRC.indexOf('\naddEventListener', a));
  const run = (open0, q0, force) => { const CTL_FIND = { q: q0, open: open0 }, inp = { value: q0, focus() {} }, cls = new Set(), applied = [];
    const p = { querySelector: () => inp, classList: { toggle: (c, on) => on ? cls.add(c) : cls.delete(c) }, scrollTop: 5 };
    new Function('document', 'CTL_FIND', 'ctlApplyFilter', f + ';return ctlFindToggle;')({ getElementById: () => p }, CTL_FIND, () => applied.push(CTL_FIND.q))(force);
    return `${CTL_FIND.open ? 'open' : 'shut'}:${JSON.stringify(CTL_FIND.q)}:${cls.has('ctl-find-open') ? 'shown' : 'hidden'}`; };
  const r = [run(false, '', undefined), run(true, 'dust', undefined), run(false, 'dust', undefined), run(true, '', false)].join(' · ');
  ok('closing clears the query — a folded filter can never hide sections nobody can see — and Escape on an empty field closes it; the toggle run here on a copy',
    r === 'open:"":shown · shut:"":hidden · shut:"":hidden · shut:"":hidden' && /if\(!had\) ctlFindToggle\(false\);/.test(SRC), r); }

ok('the zoomed sheet stands on the same floor: Controls divides its bottom offset by its own zoom, so a short sheet no longer sinks under the time machine',
  /#ctl\{bottom:calc\(\(var\(--sheet-floor\) \+ 10px\) \/ var\(--ctl-zoom,1\)\)!important\}/.test(SRC));

ok('the key carries a plain title, because it can be built before the language state exists',
  /b\.title='Filter the controls \(\/\) — the number is how many settings you have changed';/.test(SRC) && !/function ctlFindKey\(p\)\{[^\n]*\n[^\n]*TT\(/.test(SRC));

console.log('\n  ' + pass + ' passed, ' + fail + ' failed'); process.exit(fail ? 1 : 0);
