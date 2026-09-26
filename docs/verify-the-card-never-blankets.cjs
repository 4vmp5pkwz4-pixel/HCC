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
 *   4. THE CARD IS RUBBER like every other sheet: on a phone its grip drags the height (tap folds
 *      or opens, a flick down folds or lets the object go, a flick up opens full); on a desktop a
 *      gold corner drags width and height; both remembered
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
  && /<div id="selPeek" aria-live="polite">/.test(SRC) && /#selCard\.collapsed > :not\(h3\):not\(\.panel-collapser\):not\(#selPeek\):not\(\.selGrip\)\{display:none!important\}/.test(SRC));

{ const m = SRC.match(/@media \(max-width:760px\),\(pointer:coarse\) and \(max-height:520px\)\{\n    html body #selCard\{([^}]+)\}/); const css = m ? m[1] : '';
  ok('on a phone the card sits on the laboratory bar and, open, starts under half the screen and never reaches the top — the model stays in view above it',
    /top:auto!important/.test(css) && /bottom:calc\(var\(--bottom-band,0px\) \+ var\(--labbar-h,58px\) \+ 16px\)!important/.test(css) && /max-height:min\(var\(--sel-h,46vh\),/.test(css)
    && /document\.documentElement\.style\.setProperty\('--labbar-h',Math\.round\(br\.height\)\+'px'\)/.test(SRC), css.slice(0, 90)); }

ok('one row of doors: the generic pin and hide rail give way to ◎ ▴/▾ ✕, named in three languages; the floating buttons step aside',
  /html body #selCard > \.panelRail,html body #selCard > \.pinBtn,html body #selCard > \.panel-collapser\{display:none!important\}/.test(SRC) && /body\.selcard-up \.fab\{display:none!important\}/.test(SRC)
  && /TT\('Fly to it','Перелететь к объекту','Hinfliegen'\)/.test(SRC) && /TT\('Fold to one line','Свернуть в строку','Auf eine Zeile falten'\)/.test(SRC) && /b\.textContent=selCardExpanded\?'▾':'▴';/.test(SRC));

{ const a = SRC.indexOf('THE CARD IS RUBBER, LIKE EVERY OTHER SHEET'), rb = SRC.slice(a, SRC.indexOf('selCardCornerInit(); })();', a));
  /* the release rule, run here on a copy */
  const release = (moved, v, h, was, top0) => { if (moved < 6) return 'tap'; if (v > 0.6 || h < 110) return was ? 'fold' : (top0 <= 0 ? 'close' : 'fold'); if (v < -0.6) return 'full'; return 'keep ' + h; };
  const r = [release(2, 0, 300, true, 0), release(80, 0.9, 300, true, 0), release(80, 0.9, 96, false, 0), release(80, 0.1, 90, true, 0), release(80, -0.9, 200, false, 0), release(80, 0.1, 266, true, 0)].join();
  ok('THE CARD IS RUBBER, like every other sheet: its grip drags the open height continuously (remembered, capped at the scene band less a strip of model); a tap folds or opens, a flick down folds or lets the object go, a flick up opens full, below 110 px it folds — and the generic sheet drag leaves it to its own',
    /if\(selCardExpanded\) selCardHeight\(drag\.h0-dy,false\);/.test(rb) && /if\(d\.v>0\.6\|\|h<110\)/.test(rb) && /if\(d\.v<-0\.6\)\{ selCardSetExpanded\(true\); selCardHeight\(selCardCap\(\)\); return; \}/.test(rb)
    && /localStorage\.setItem\(SEL_H_KEY,String\(h\)\)/.test(SRC) && /max-height:min\(var\(--sel-h,46vh\),calc\(/.test(SRC) && /if\(el\.id==='selCard'\) return false;/.test(SRC)
    && r === 'tap,fold,close,fold,full,keep 266', r); }
ok('and on a desktop the gold corner at its top left drags its width and height, remembered, and a double-click restores them',
  /c\.id='selCorner'/.test(SRC) && /localStorage\.setItem\(SEL_UI_KEY,JSON\.stringify\(ui\)\)/.test(SRC) && /c\.addEventListener\('dblclick',\(\)=>\{ ui=\{\};/.test(SRC) && /#selCorner\{position:fixed;/.test(SRC));

ok('the laboratory bar stays under the card: only a sheet that reaches into the bar\'s own band lifts it',
  /const natTop=top-8-br\.height;/.test(SRC) && /r\.top>vh\*0\.3&&r\.bottom>natTop\+4\) top=Math\.min\(top,r\.top\);/.test(SRC));

{ const a = SRC.indexOf('function selCardPeekText(s){'), f = SRC.slice(a, SRC.indexOf('\n', SRC.indexOf('return kv', a)) + 1);
  const run = (rows, desc) => new Function('document', f + ';return selCardPeekText;')({ querySelectorAll: () => rows.map(r => ({ cells: r.map(t => ({ textContent: t })) })) })({ desc });
  const one = run([['Type', 'Terrestrial planet'], ['Semi-major axis a', '1.0000 AU'], ['Eccentricity', '0.0167']], ''), two = run([], 'A dwarf planet. It orbits beyond Neptune.');
  ok('the peek\'s one line is the card\'s first two numbers, or else the first sentence of its text', one === 'Terrestrial planet · 1.0000 AU' && two === 'A dwarf planet.', `${one} | ${two}`); }

console.log('\n  ' + pass + ' passed, ' + fail + ' failed'); process.exit(fail ? 1 : 0);
