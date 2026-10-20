#!/usr/bin/env node
'use strict';
/* ══ THE LADDER, EVERYWHERE (v4.384) ═══════════════════════════════════════════════════════════════════════════════════
 * Asked: think the φ-ladder panel through as a WebXR designer would, above all on small screens, and bring in from the
 * catalogues whatever lifts it. One index of the rungs now feeds three faces — the horizontal ladder of a wide screen,
 * a vertical, thumb-scrolled ladder on a phone, and a spiral staircase beside the reader in a headset — and each rung
 * carries its regime, the photon whose wavelength it is, landmarks, literature scales and their laboratories, bodies,
 * the census and D. The ladder steers: drag it (wide) or scroll it with ⇅ (phone) and the camera follows through the
 * scales, finishing the flight on release. On a phone the time machine is two rows again: the φ-scale is one button
 * whose ring is the phase dial. Checked here by running the page's pure code and reading its wiring:
 *   1. the colour of visible light, and the band of the photon of every length
 *   2. the regimes of size
 *   3. the spiral staircase: three hundred steps, Planck at the floor, a turn every 25 rungs
 *   4. the phone: the vertical ladder (rows from the cosmos down, sticky regimes, the reader's rung lit, a tap opens the
 *      rung), steering with a debounced finishing flight and a tick per rung, and the two-row time machine
 *   5. the wide ladder steers on drag and selects on a click; the headset: a ray tap in the staircase's own metres, the
 *      wrist menu, the per-frame lamp; the laboratories of a rung open from its card
 */
const fs = require('node:fs'), path = require('node:path');
const SRC = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
let pass = 0, fail = 0;
const ok = (n, c, d) => { if (c) { pass++; console.log('  PASS — ' + n + (d ? ' :: ' + d : '')); } else { fail++; console.log('  FAIL — ' + n + (d ? ' :: ' + d : '')); } };
const grab = (re, what) => { const m = SRC.match(re); if (!m) throw new Error('not found: ' + what); return m[0]; };
const nmRGB = new Function(grab(/function sxNmRGB\(nm\)\{[\s\S]*?return `rgb\(\$\{c\(r\)\},\$\{c\(g\)\},\$\{c\(b\)\}\)`; \}/, 'sxNmRGB') + '\nreturn sxNmRGB;')();
const em = new Function('sxNmRGB', grab(/function sxEm\(R\)\{[\s\S]*?return \['ELF'[^\n]*\]; \}/, 'sxEm') + '\nreturn sxEm;')(nmRGB);
const rgb = s => s.match(/\d+/g).map(Number);
/* 1 */
{ const [b450, g530, r650, e380, e750] = [450, 530, 650, 381, 749].map(n => rgb(nmRGB(n)));
  const bands = [1e-12, 1e-9, 1e-7, 5.5e-7, 1e-5, 1e-2, 10, 1e6].map(R => em(R)[0]).join(',');
  const none = [1e-18, 1e9].map(R => em(R)).every(x => x === null);
  ok('the visible rungs carry the colour of their own light (450 nm blue, 530 nm green, 650 nm red, dim at both ends of the eye) and every length from 10⁻¹⁷ to 10⁸ m names the band of its photon',
    b450[2] > b450[0] && b450[2] > b450[1] && g530[1] > g530[0] && g530[1] > g530[2] && r650[0] > r650[1] && r650[0] > r650[2] && Math.max(...e380) < 200 && Math.max(...e750) < 200 && bands === 'γ,X,UV,vis,IR,μw,radio,ELF' && none,
    `450 ${b450} · 530 ${g530} · 650 ${r650} · bands ${bands}`); }
/* 2 */
{ const R = new Function('return ' + grab(/\[\[1e25,'Horizons'[^\n]*\]\];/, 'SX_REGIMES').replace(/;$/, ''))();
  const reg = L => { for (const r of R) if (L >= r[0]) return r[1]; return R[R.length - 1][1]; };
  const got = [1e-35, 1e-15, 1e-10, 1e-6, 6.4e6, 1.5e11, 1e17, 1e23, 1e26].map(reg);
  ok('the regimes of size run from quantum gravity through particles, atoms, life, planets, the Solar System, stars and galaxies to the horizons, in order',
    got.join('|') === ['Quantum gravity — no experiment reaches here', 'Particles and nuclei', 'Atoms and molecules', 'Cells and life', 'Landscapes, Earth and planets', 'The Solar System', 'Stars and the Galaxy', 'Galaxies and the cosmic web', 'Horizons'].join('|'),
    got.map(x => x.split(' ')[0]).join(' → ')); }
/* 3 */
{ const step = new Function('SX_NMAX', 'SX_XR', grab(/function sxXrStep\(n\)\{[^\n]*\}/, 'sxXrStep') + '\nreturn sxXrStep;')(300, { turns: 12, H: 1.75 });
  const ys = Array.from({ length: 301 }, (_, n) => step(n).y), mono = ys.every((y, i) => i === 0 || y > ys[i - 1]);
  ok('the spiral staircase: 301 steps rising monotonically from the floor (Planck) to 1.75 m (the S³ radius), a turn every 25 rungs',
    mono && Math.abs(ys[0]) < 1e-12 && Math.abs(ys[300] - 1.75) < 1e-12 && Math.abs(step(25).th - 2 * Math.PI) < 1e-12 && Math.abs(step(300).th - 24 * Math.PI) < 1e-9 && /const SX_XR=\{on:false, g:null, inst:null, here:null, card:null, pts:\[\], turns:12, H:1\.75, r0:0\.07\};/.test(SRC),
    `y(0) = ${ys[0]} · y(300) = ${ys[300]} m · θ(25) = 2π`); }
/* 4 */
{ const w = [
    /for\(let n=SX_NMAX;n>=0;n--\)\{ const r=idx\[n\], g=sxRegime\(r\.R\); if\(g!==reg\)\{ reg=g; h\+=`<div class="tsReg">/.test(SRC),
    /#tsList \.tsReg\{position:sticky;top:0/.test(SRC) && /#tsList \.tsRow\.here\{/.test(SRC),
    /row\.onclick=open;/.test(SRC) && /sxRungCard\(n,c\)/.test(SRC),
    /SX_STATE\.listEnd=setTimeout\(\(\)=>\{ if\(SX_STATE\.steer&&SX_STATE\.listN!=null\) sxScrubTo\(SX_STATE\.listN\+0\.5,true\); \},420\)/.test(SRC) && /sxHaptic\(4\); L\.querySelectorAll\('\.tsRow\.aim'\)/.test(SRC),
    /if\(!\(d>controls\.minDistance\*1\.02&&d<controls\.maxDistance\*0\.98\)\) return; try\{ hccCameraGoal\(d,6\); \}/.test(SRC),
    /#tmScale\{order:3!important;/.test(SRC) && /#tsN\{display:block!important;/.test(SRC) && /#tmPhase\{display:none!important\}/.test(SRC) && /#tmScale\.phase #tsPsiRing\{opacity:\.95\}/.test(SRC),
    /#tsLadder\.narrow\{max-height:calc\(100dvh - var\(--tabs-h,0px\) - var\(--tm-h,0px\) - 92px\)!important\}/.test(SRC)];
  ok('the phone: a vertical ladder from the cosmos down with sticky regimes, the reader\'s rung lit, a tap that opens the rung in place; scrolling with ⇅ steers the camera live and finishes the flight 420 ms after the thumb stops, with a tick per rung; the time machine is two rows and the phase dial is the ring of the φ-button',
    w.every(Boolean), w.map(x => x ? '✓' : '✗').join('')); }
/* 5 */
{ const w = [
    /A\.onpointermove=ev=>\{ const D=SX_STATE\.drag;/.test(SRC) && /if\(D\.moved\) sxScrubTo\(N,true\); else sxRungSelect\(Math\.round\(N\)\);/.test(SRC),
    /HCC_RAY_TAPS\.push\(\{id:'phi-ladder'/.test(SRC) && /inv=SX_XR\.g\.matrixWorld\.clone\(\)\.invert\(\), oL=o\.clone\(\)\.applyMatrix4\(inv\), dL=d\.clone\(\)\.transformDirection\(inv\)/.test(SRC),
    /rows\.push\('Scale'\);/.test(SRC) && /cb:\(\)=>\{ try\{ sxXrToggle\(\); \}catch\(e\)\{\} refreshMenu\(\); \}/.test(SRC),
    /try\{ sxXrTick\(\); \}catch\(e\)\{\}/.test(SRC) && /src\.gamepad&&src\.gamepad\.hapticActuators&&src\.gamepad\.hapticActuators\[0\]/.test(SRC),
    /if\(r\[2\]\) idx\[n\]\.labs\.add\(r\[2\]\);/.test(SRC) && /data-tslab=/.test(SRC) && /phiAtlasJump\(b\.dataset\.tslab\)/.test(SRC),
    /globalThis\.HCC_LADDER=Object\.freeze\(\{index:/.test(SRC)];
  ok('the wide ladder steers on drag and selects on a click; in a headset a trigger on a step is read in the staircase\'s own metres, the wrist menu carries the staircase, the reader\'s lamp rides it every frame and a pulse answers in the hands; the laboratories of a rung open from its card; agents read it all through HCC_LADDER',
    w.every(Boolean), w.map(x => x ? '✓' : '✗').join('')); }
{ /* v4.393: in FBS3R the quick ladder steers that world's own depth and never leaves it */
  const scrub = grab(/function sxScrubTo\(N,final\)\{[^\n]*/, 'sxScrubTo'), fly = grab(/function sxFlyTo\(L,lm(,cross)?\)\{[\s\S]*?\n  if\(state\.mode==='fbs'&&!fbsTier2\(\)\)\{ sxFbsGo\(levelOf\(L\),true\); return; \}/, 'sxFlyTo in FBS3R');
  const go = grab(/function sxFbsGo\(N,final\)\{[\s\S]*?return depth; \}/, 'sxFbsGo');
  const st = { mode: 'fbs', fbsNmin: 0, fbsNmaxU: 299.1, fbsDepth: 200, fbsTarget: null, fbsCycle: true, fbsVel: 2 };
  const F = new Function('state', 'FBS', go + '\nreturn sxFbsGo;')(st, { Nmax: 299.1 });
  F(142.6, false); const live = st.fbsDepth === 142.6 && st.fbsTarget === null && !st.fbsCycle && st.fbsVel === 0; F(145, true); const glide = st.fbsTarget === 145 && st.fbsDepth === 142.6; F(-9, true); const clamp = st.fbsTarget === 0;
  const routed = /if\(state\.mode==='fbs'&&!fbsTier2\(\)\)\{ SX_STATE\.scrubN=final\?null:N; sxFbsGo\(N,final\); return; \}/.test(scrub) && !!fly;
  const reads = /N=D&&D\.strip\?D\.N:st\?SX_STATE\.stepGoal:\(state\.mode==='fbs'&&!fbsTier2\(\)\?state\.fbsDepth:SX_STATE\.N\)/.test(SRC) && /const step=d=>\{ const N0=Number\.isFinite\(sxNow\(\)\)\?sxNow\(\):150/.test(SRC);
  ok('in FBS3R the quick φ-ladder is that world\'s own depth: a drag moves it live, a release or a step glides to it, the strip reads it, and nothing carries the reader to the Solar world\'s descent or the Horizons',
    live && glide && clamp && routed && reads, `live ${live ? '✓' : '✗'} · glide ${glide ? '✓' : '✗'} · clamped to the ladder ${clamp ? '✓' : '✗'} · scrub and flight stay in FBS3R ${routed ? '✓' : '✗'} · the strip reads the depth ${reads ? '✓' : '✗'}`); }
console.log('\n  ' + pass + ' passed, ' + fail + ' failed'); process.exit(fail ? 1 : 0);
