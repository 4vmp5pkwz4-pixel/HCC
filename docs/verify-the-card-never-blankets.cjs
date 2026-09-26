#!/usr/bin/env node
'use strict';
/* ══ THE CARD NEVER BLANKETS WHAT IT DESCRIBES ═══════════════════════════════════════════
 * On a phone, the first tap on an object opened its whole scientific passport from under the
 * breadcrumb down to the time machine — over the whole model it described — and folding it
 * did not stick: the next object opened full again. The card now has two states and keeps
 * the one the reader chose. This file checks the source for that contract:
 *   1. a phone starts on the PEEK (name, one line, ◎ fly · ▴ open · ✕ close); a desktop on the
 *      open card; either way the reader's own choice is remembered and every new selection
 *      opens in it
 *   2. on a phone the card sits ON the laboratory bar and, open, stops under half the screen —
 *      never from the top — so the model is always in view above it
 *   3. one row of doors: the generic pin and hide rail give way to the card's own ◎ ▴/▾ ✕,
 *      named in three languages for a screen reader; the floating buttons step aside
 *   4. a swipe up opens, a swipe down folds, and a swipe down from the peek lets the object go
 *   5. the laboratory bar stays under the card instead of jumping over it: only a sheet that
 *      reaches into the bar's own band lifts it
 *   6. the peek's one line is the card's first two numbers, or the first sentence of its text
 */
const fs = require('node:fs'), path = require('node:path');
const SRC = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
let pass = 0, fail = 0;
const ok = (n, c, d) => { if (c) { pass++; console.log('  PASS — ' + n + (d ? ' :: ' + d : '')); } else { fail++; console.log('  FAIL — ' + n + (d ? ' :: ' + d : '')); } };

ok('a phone starts on the peek and a desktop on the open card; the reader\'s choice is remembered and every new selection opens in it',
  /let selCardExpanded=\(\(\)=>\{ try\{ const v=localStorage\.getItem\(SEL_CARD_KEY\); if\(v==='1'\|\|v==='0'\) return v==='1'; \}catch\(e\)\{\} return !SEL_CARD_PHONE\.matches; \}\)\(\);/.test(SRC)
  && /localStorage\.setItem\(SEL_CARD_KEY,selCardExpanded\?'1':'0'\)/.test(SRC) && /selCard\.classList\.toggle\('collapsed', !selCardExpanded\);   \/\/ the reader's remembered state/.test(SRC)
  && /<div id="selPeek" aria-live="polite">/.test(SRC) && /#selCard\.collapsed > :not\(h3\):not\(\.panel-collapser\):not\(#selPeek\)\{display:none!important\}/.test(SRC));

{ const m = SRC.match(/@media \(max-width:760px\),\(pointer:coarse\) and \(max-height:520px\)\{\n    html body #selCard\{([^}]+)\}/); const css = m ? m[1] : '';
  ok('on a phone the card sits on the laboratory bar and, open, stops under half the screen — the model stays in view above it',
    /top:auto!important/.test(css) && /bottom:calc\(var\(--bottom-band,0px\) \+ var\(--labbar-h,58px\) \+ 16px\)!important/.test(css) && /max-height:min\(46vh,/.test(css)
    && /document\.documentElement\.style\.setProperty\('--labbar-h',Math\.round\(br\.height\)\+'px'\)/.test(SRC), css.slice(0, 90)); }

ok('one row of doors: the generic pin and hide rail give way to ◎ ▴/▾ ✕, named in three languages; the floating buttons step aside',
  /html body #selCard > \.panelRail,html body #selCard > \.pinBtn,html body #selCard > \.panel-collapser\{display:none!important\}/.test(SRC) && /body\.selcard-up \.fab\{display:none!important\}/.test(SRC)
  && /TT\('Fly to it','Перелететь к объекту','Hinfliegen'\)/.test(SRC) && /TT\('Fold to one line','Свернуть в строку','Auf eine Zeile falten'\)/.test(SRC) && /b\.textContent=selCardExpanded\?'▾':'▴';/.test(SRC));

{ const sw = SRC.slice(SRC.indexOf("selCard.addEventListener('touchstart'"), SRC.indexOf("selCard.addEventListener('touchstart'") + 700);
  /* run the swipe rule here on a copy */
  const decide = (dy, dx, expanded, top0) => { if (Math.abs(dy) < 44 || Math.abs(dy) < 1.4 * Math.abs(dx)) return 'none'; if (dy < 0 && !expanded) return 'open'; if (dy > 0 && top0 <= 0) return expanded ? 'fold' : 'close'; return 'none'; };
  const r = [decide(-80, 5, false, 0), decide(90, 4, true, 0), decide(90, 4, false, 0), decide(90, 4, true, 120), decide(20, 0, true, 0), decide(-60, 80, false, 0)].join();
  ok('a swipe up opens, a swipe down folds, a swipe down from the peek lets the object go — never while the card is scrolled, never on a sideways swipe',
    /if\(Math\.abs\(dy\)<44\|\|Math\.abs\(dy\)<1\.4\*Math\.abs\(dx\)\) return;/.test(sw) && /if\(dy<0&&!selCardExpanded\) selCardSetExpanded\(true\);/.test(sw)
    && /else if\(dy>0&&top0<=0\)\{ if\(selCardExpanded\) selCardSetExpanded\(false\); else document\.getElementById\('selClear'\)\?\.click\(\); \}/.test(sw) && r === 'open,fold,close,none,none,none', r); }

ok('the laboratory bar stays under the card: only a sheet that reaches into the bar\'s own band lifts it',
  /const natTop=top-8-br\.height;/.test(SRC) && /r\.top>vh\*0\.3&&r\.bottom>natTop\+4\) top=Math\.min\(top,r\.top\);/.test(SRC));

{ const a = SRC.indexOf('function selCardPeekText(s){'), f = SRC.slice(a, SRC.indexOf('\n', SRC.indexOf('return kv', a)) + 1);
  const run = (rows, desc) => new Function('document', f + ';return selCardPeekText;')({ querySelectorAll: () => rows.map(r => ({ cells: r.map(t => ({ textContent: t })) })) })({ desc });
  const one = run([['Type', 'Terrestrial planet'], ['Semi-major axis a', '1.0000 AU'], ['Eccentricity', '0.0167']], ''), two = run([], 'A dwarf planet. It orbits beyond Neptune.');
  ok('the peek\'s one line is the card\'s first two numbers, or else the first sentence of its text', one === 'Terrestrial planet · 1.0000 AU' && two === 'A dwarf planet.', `${one} | ${two}`); }

console.log('\n  ' + pass + ' passed, ' + fail + ' failed'); process.exit(fail ? 1 : 0);
