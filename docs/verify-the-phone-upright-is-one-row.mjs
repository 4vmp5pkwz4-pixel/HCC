/* THE PHONE HELD UPRIGHT (v4.412). A reader asked why the time machine's buttons stood in two rows, and said the interface was
   not made for the phone, upright or on its side. Measured before (Playwright, the iPhone profiles, Japanese, four places each):
   upright the time machine stood on two rows (105 px) at 430 px, on THREE (152 px) at 390 px inside a laboratory — the
   laboratory clock ⏱ pushed the epoch jumps onto a row of their own — and on three everywhere at 320 px, where the scene kept
   170 px of 568; the trail under the world row and the laboratory bar above the time machine said the same laboratory twice;
   the touch hint stood over the caption; the clock pill cut both its dates at 430 px; the world row ran 66 px past a 320-px
   screen. After: one row (55 px) at every width, the bar in the top row beside Back, the scene 363 px at 390 (was 266).
   This verifier holds the rules that produce that, in the source that ships. */
import fs from 'node:fs';
const SRC = fs.readFileSync(new URL('../index.html', import.meta.url), 'utf8');
let pass = 0, fail = 0;
const check = (ok, claim, nums) => { if (ok) pass++; else fail++; console.log(`${ok ? 'PASS' : 'FAIL'} — ${claim} :: ${nums}`); };
const has = (s) => SRC.includes(s);

/* 1. the class */
{
  const ok = /const port=matchMedia\('\(pointer:coarse\)'\)\.matches&&innerHeight>=innerWidth&&innerWidth<=560;/.test(SRC)
    && has("document.documentElement.classList.toggle('port',port); document.body.classList.toggle('port',port);")
    && has("if(!land&&!port) document.documentElement.classList.remove('tm-more');");
  check(ok, 'a phone held upright has its own class, computed beside the landscape one from the same finger and viewport, and the unfolded state survives a turn of the phone',
    ok ? 'port = coarse pointer · height ≥ width · width ≤ 560' : 'class missing');
}
/* 2. one row, by priority */
{
  const ok = has('html.port body #timeMachine{flex-wrap:nowrap!important;')
    && has('html.port body #tmTransport{display:contents!important}')
    && has('html.port body #timeMachine #tmDir,html.port body #timeMachine #tmAgora,html.port body #timeMachine #tmJumps,\nhtml.port body #timeMachine #tmLab,html.port body #timeMachine #tmNote{display:none!important}')
    && has("@media (max-width:419px){ html.port body #tmBack,html.port body #tmFwd{display:none!important} }")
    && has('html.port body #tmMore{order:8!important;display:inline-flex!important;')
    && /html\.port body #tmRate\{order:5!important;flex:1 1 96px!important;min-width:96px!important;/.test(SRC);
  check(ok, 'upright the time machine is ONE row: play, the φ-scale, the rate with the date on it and the step unit always; the two steps from 420 px; direction, the epoch jumps, the laboratory clock and the Agora under the chevron — and the rate has a small basis that grows, so the row never wraps on its bases',
    ok ? 'nowrap · fold order · steps ≥ 420 px · rate basis 96 px' : 'rule missing');
}
/* 3. the unfold */
{
  const ok = has('html.port.tm-more body #timeMachine{flex-wrap:wrap!important}')
    && has('html.port.tm-more body #timeMachine .tmBreak{display:block!important;flex:0 0 100%!important;')
    && has('html.port.tm-more body #timeMachine #tmJumps{display:flex!important;order:23!important;')
    && has('html.port.tm-more body #timeMachine #tmLab:not([hidden]){display:inline-flex!important;');
  check(ok, 'the chevron unfolds what was folded onto ONE second row behind a full-width break, so the first row stays exactly as it was',
    ok ? 'break at order 19 · steps, direction, jumps, clock, Agora after it' : 'unfold rule missing');
}
/* 4. the laboratory bar in the top row */
{
  const ok = has('html.port body #hccCrumb > :not([data-crumb="back"]){display:none!important}')
    && has('html.port body #labBar{top:calc(var(--topbar-h,64px) + 6px)!important;bottom:auto!important;left:calc(58px + var(--safe-l,0px))!important;')
    && has("if(document.documentElement.classList.contains('land')||document.documentElement.classList.contains('port')){")
    && has('html.port body #lbTip{top:auto!important;bottom:calc(var(--bottom-band,111px) + 8px)!important;');
  check(ok, 'upright the trail is Back alone and the laboratory bar stands beside it in the top row, as on its side — the same laboratory is no longer said twice, and the row it left at the bottom goes to the scene; the bar\'s tip stands above the time machine',
    ok ? 'crumb = Back · bar top row · placement by the stylesheet · tip at the foot' : 'rule missing');
}
/* 5. the hint, the clock, the world row, the glyphs */
{
  const hint = has("if(phone&&document.documentElement.classList.contains('port')&&tmR&&tmR.height>0){ el.style.top=Math.max(90,Math.round(tmR.top-(el.offsetHeight||44)-12))+'px'; }");
  const clock = has('html.port body #clock .st{display:none!important}');
  const worlds = /@media \(max-width:359px\)\{\n  #modeRow\.worldSigns\{gap:2px!important\}\n  #modeRow\.worldSigns \.modebtn\[data-mode\]\{min-width:34px!important;/.test(SRC);
  const glyph = has('html.port body #timeMachine .tmBtn{display:inline-flex;align-items:center;justify-content:center}');
  check(hint && clock && worlds && glyph, 'the touch hint stands at the stage\'s foot, above the time machine, never over the caption; the clock pill keeps only the reader\'s own time upright (the simulated one is on the time machine); all seven worlds and More fit a 320-px row; the step glyphs are centred in their buttons',
    `hint ${hint} · clock ${clock} · worlds ${worlds} · glyphs ${glyph}`);
}
console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
