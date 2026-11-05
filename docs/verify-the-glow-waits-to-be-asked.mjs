/* THE GLOW WAITS TO BE ASKED (v4.412). A reader asked for the HDR bloom to be off by default and to stay a tick-box in Controls.
   The bloom is a display effect — perceptual, not radiometric: no number the atlas reports passes through it — so turning it off
   by default costs no physics, and it is the post-chain that once carried a NaN from one fragment into a black square hundreds of
   pixels wide. This verifier holds the three parts of the request, and evaluates the remembered-choice rule as it ships:
     1. off on arrival — the state starts from the remembered choice, which is "on" only when this device stored '1', and "off"
        when nothing was stored, when '0' was stored, and when storage itself throws (a private window);
     2. the tick-box is in Controls, ticked only when the glow is on, and the choice is stored when it changes;
     3. the render path builds and uses the bloom only when it is on, and the hint says so in all four languages. */
import fs from 'node:fs';
const SRC = fs.readFileSync(new URL('../index.html', import.meta.url), 'utf8');
let pass = 0, fail = 0;
const check = (ok, claim, nums) => { if (ok) pass++; else fail++; console.log(`${ok ? 'PASS' : 'FAIL'} — ${claim} :: ${nums}`); };

/* 1 */
{
  const fn = SRC.slice(SRC.indexOf('const HCC_BLOOM_KEY='), SRC.indexOf('function TT('));
  const remembered = store => new Function('localStorage', fn + ';return hccBloomRemembered();')(store);
  const mem = v => ({ getItem: k => (k === 'hcc.bloom.v1' ? v : null) });
  const thrower = { getItem: () => { throw new Error('SecurityError'); } };
  const cases = [[mem(null), false], [mem('0'), false], [mem('1'), true], [mem('true'), false], [thrower, false]];
  const ok = /const HCC_BLOOM_KEY='hcc\.bloom\.v1';/.test(fn) && cases.every(([s, want]) => remembered(s) === want)
    && /astOn:false, bloomOn:hccBloomRemembered\(\),/.test(SRC) && !/bloomOn:true/.test(SRC);
  check(ok, 'the glow is off on arrival: the state starts from the remembered choice, which is on only when this device stored "1" — nothing stored, "0", any other value and a storage that throws all start it off',
    `${cases.length} cases · state initialiser ${/bloomOn:hccBloomRemembered\(\)/.test(SRC) ? 'reads the choice' : 'CHANGED'}`);
}
/* 2 */
{
  const row = SRC.slice(SRC.indexOf('<div class="ctlrow"><label>HDR bloom</label>'), SRC.indexOf('<div class="ctlrow"><label>Hierarchy locator</label>'));
  const ok = /<input type="checkbox" id="bloomOn" \$\{state\.bloomOn===true\?'checked':''\}>/.test(row)
    && /off by default · tick to turn the glow on · perceptual, not radiometric · off in XR/.test(row)
    && /ctl\.querySelector\('#bloomOn'\)\.onchange=e=>\{ state\.bloomOn=e\.target\.checked; try\{ localStorage\.setItem\(HCC_BLOOM_KEY,state\.bloomOn\?'1':'0'\); \}catch\(err\)\{\} \}/.test(SRC);
  check(ok, 'the tick-box stays in Controls, ticked only when the glow is on, and a change is remembered on this device',
    ok ? 'checkbox #bloomOn · hint · onchange stores 1/0' : 'control changed');
}
/* 3 */
{
  const gate = /if\(state\.bloomOn!==false && !renderer\.xr\.isPresenting && !webglContextLost && !\(hccSeamQuiet>0\) && !HCC_SAFE_GPU && ensureBloom\(\)\)\{/.test(SRC);
  const enc = (SRC.match(/state\.bloomOn!==false&&/g) || []).length >= 2;
  const dict = JSON.parse((SRC.match(/<script type="application\/json" id="hcc-i18n">([\s\S]*?)<\/script>/) || [])[1].replace(/<\\\//g, '</'));
  const pieces = ['off by default', 'tick to turn the glow on', 'perceptual, not radiometric', 'off in XR'];
  const four = pieces.every(k => dict.t[k] && dict.t[k][0] && dict.t[k][1] && dict.ja && /[぀-ヿ㐀-鿿]/.test(dict.ja[k] || ''));
  check(gate && enc && four, 'the frame uses the bloom chain only when the glow is on (the shaders that encode for themselves read the same switch), and the hint is translated in Russian, German and Japanese',
    `render gate ${gate} · self-encoding shaders ${enc} · hint pieces in four languages ${four}`);
}
console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
