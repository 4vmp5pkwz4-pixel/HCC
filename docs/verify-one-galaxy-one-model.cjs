#!/usr/bin/env node
'use strict';
/* ══ ONE GALAXY, ONE MODEL — AND IT IS A POPULATION, NOT A PICTURE ═══════════
 *
 * This atlas drew the Milky Way TWICE.
 *
 * The solar-scale label layer carried MW_ARM_DEFS: six arms as {r0 in LIGHT
 * YEARS, phi in radians} with phases 2.0, 4.7, 0.5, 3.1, 5.8, 2.6 — six numbers
 * with no source, describing the same spiral the cycles world described as four
 * galactocentric radii in KILOPARSECS at the Sun's azimuth. Same galaxy, same
 * pitch angle typed into both, two parameterisations, and nothing that could
 * notice when they disagreed. They already did: the two layers put Perseus in
 * different places, and no view has ever shown both, so no render revealed it
 * and no check asked. That is the same defect class as the two cycle instruments
 * that shared one coordinate for three releases.
 *
 * And the cycles one was not even a model. It was a 1024-pixel canvas — 2600
 * dots for the bar, 3400 per arm — mapped onto a flat CircleGeometry and then
 * ROTATED AS ONE RIGID TEXTURE at the density-wave period. Every star in the
 * Galaxy therefore had the pattern speed, which is the single angular rate a
 * density wave is defined by not having; the winding problem the density-wave
 * theory exists to answer was baked in as the animation. The disc also had no
 * thickness, so the Galaxy was a coaster.
 *
 * What replaces it is sampled from the declared structural parameters and moved
 * by the declared rates: an exponential thin disc, an exponential thick disc and
 * the boxy bar, each star on the flat rotation curve, with a single m=4
 * logarithmic spiral phase-fitted to the four tabulated arm radii turning at
 * Omega_p. Corotation then falls out of v_c/Omega_p instead of being asserted.
 *
 * This file holds that in place: one model, no second arm table, no rigid spin,
 * the rates reaching the shader, and the clock borrowed rather than taken.
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
const model = balanced('const MILKY_WAY=Object.freeze({', '{', '}');
const num = k => { const m = model.match(new RegExp(k + ':\\s*([0-9.]+)')); return m ? parseFloat(m[1]) : NaN; };

{ /* 1. THE SECOND TABLE IS GONE AND BOTH LAYERS READ THE ONE THAT IS LEFT */
  const arms = [...model.matchAll(/\{key:'(\w+)'[^}]*R:\s*([0-9.]+)/g)].map(m => [m[1], parseFloat(m[2])]);
  ok('THE SECOND ARM TABLE IS GONE. MW_ARM_DEFS held six arms as {r0 in light years, phi in radians} with no source, describing the same spiral the cycles world held in kiloparsecs — two authorities for one galaxy, disagreeing, with no view that showed both',
    !/MW_ARM_DEFS/.test(src.replace(/\/\*[\s\S]*?\*\//g, ''))
    && arms.length === 5 && arms.some(a => a[0] === 'ori'),
    `MILKY_WAY.arms declares ${arms.length}: ${arms.map(a => a[0] + ' ' + a[1] + ' kpc').join(', ')} — and nothing outside a comment mentions the table that is gone`);
  ok('and both drawn layers take their arms from it — the solar-scale label layer and the cycles population — so moving an arm moves it in both places or in neither',
    /MILKY_WAY\.arms\.forEach\(arm=>\{/.test(src)
    && /for\(const arm of MILKY_WAY\.arms\)\{/.test(src)
    && /lab\.userData\.mwArm=arm/.test(src),
    'the solar layer iterates MILKY_WAY.arms for its lines and labels; the cycles instrument iterates it for the arm names it carries with the pattern');
}

{ /* 2. THE PICTURE IS GONE — no painted arms, no rigid spin */
  ok('and the painted galaxy is gone with it: no canvas sprays arm dots any more, and no CircleGeometry is spun at the pattern period to fake rotation',
    !/for\(let i=0;i<3400;i\+\+\)/.test(src)
    && !/galDisk\.rotation\.z\s*=/.test(src)
    && /galStars=new THREE\.Points\(geo,mat\)/.test(src),
    'the arms are a wave in the vertex shader; the only disc left is an axisymmetric haze, which it would be meaningless to rotate');
  ok('and every star carries its own angular rate rather than the pattern\u2019s, which is the whole content of the density-wave picture',
    /float om\s*=\s*uVc\/max\(R,1\.0\);/.test(src)
    && /float phi = phi0 - mix\(om, uOmegaB, bar\)\*uT;/.test(src)
    && /float psi = phi \+ uOmegaP\*uT - uArmPhase - log\(max\(R,0\.35\)\/uR0\)\*uPitchInv;/.test(src),
    'omega = v_c/R per vertex, the bar as a rigid figure at Omega_bar, and the arm phase wound by ln R about the fitted phase');
}

{ /* 3. THE DERIVED QUANTITIES ARE DERIVED */
  const R0 = num('R0'), vc = num('vc'), Op = num('OmegaP');
  const Rco = vc / Op;
  ok('and corotation is computed from the rotation curve against the pattern speed rather than stated — it is the radius that decides which way the arms sweep past a star, and this atlas has never carried it',
    /function mwCorotationKpc\(\)\{ return MILKY_WAY\.vc\/MILKY_WAY\.OmegaP; \}/.test(src)
    && Math.abs(R0 / Rco - 1) < 0.05,
    `v_c/Omega_p = ${Rco.toFixed(3)} kpc against R0 = ${R0} kpc — the Sun is within ${(Math.abs(R0 / Rco - 1) * 100).toFixed(2)}% of corotation, which is why the arms barely overtake it`);
  ok('and the pattern PERIOD is derived from the pattern SPEED instead of being a second number typed beside it, as 218 was typed beside 28 km/s/kpc',
    /const GAL_PATTERN_MYR = 2\*Math\.PI\/\(MILKY_WAY\.OmegaP\*MW_KMS_KPC_TO_RAD_MYR\);/.test(src),
    `one turn in ${(2 * Math.PI / (Op * 1.0226903e-3)).toFixed(1)} Myr, which cannot now disagree with the speed it comes from`);
  ok('and the arm phase is least-squares fitted to the four tabulated radii rather than chosen, with the residual reported as the angle by which one wave misses each named arm',
    /function mwArmFit\(\)\{/.test(src)
    && /const c=u\.map\(\(uk,k\)=>2\*Math\.PI\*k\/MILKY_WAY\.m - uk\);/.test(src)
    && /worstRad:Math\.max\(\.\.\.resid\.map\(Math\.abs\)\)/.test(src),
    'the fit, its residuals and its worst miss are all returned, and the boot suite prints the miss in degrees rather than hiding it');
}

{ /* 4. THE CLOCK IS BORROWED */
  ok('and the galactic frame BORROWS the shared clock rather than taking it: it needs megayears per second, and leaving it there would strand every other instrument in the year eight million with the epoch in the drift report\u2019s untracked set',
    /function galClockBorrow\(\)\{/.test(src) && /function galClockReturn\(\)\{/.test(src)
    && /if\(state\.cycFrame!=='gal'\) galClockReturn\(\);/.test(src)
    && /if\(mode!=='cyc'\)\{ try\{ galClockReturn\(\); \}catch\(e\)\{\} \}/.test(src),
    'returned when the frame changes and when the world changes — a reader who clicks Solar has left the frame as much as one who picks another');
  ok('and the rate the caption quotes is MEASURED from the clock rather than read off the setting, because the frame time step is clamped and a slow machine achieves a fraction of what was asked for',
    /galRate\.myrPerSec = galRate\.myrPerSec \? galRate\.myrPerSec\*0\.86\+r\*0\.14 : r;/.test(src)
    && /running at \$\{r\.toFixed/.test(src),
    'measured at 0.88 Myr/s in a headless probe against a 4 Myr/s setting — a caption quoting the setting would have been wrong by four and a half times');
}

{ /* 5. THE POPULATION IS SAMPLED FROM THE PROFILES IT CLAIMS */
  ok('and the population is drawn from the declared profiles rather than sprayed: the radii are a gamma(2) draw, which is exactly the exponential surface density, and the heights are a two-sided exponential — so the disc has real thickness',
    /const expR=h=>\{ let R; let n=0; do\{ R=-h\*\(Math\.log\(u\(\)\)\+Math\.log\(u\(\)\)\); \}/.test(src)
    && /const expZ=h=>-h\*Math\.log\(u\(\)\)\*\(rnd\(\)<0\.5\?-1:1\);/.test(src)
    && /hZthin:\s*0\.30/.test(model) && /hZthick:\s*0\.90/.test(model),
    'thin disc 2.6 / 0.30 kpc, thick disc 2.0 / 0.90 — and the boot suite measures both back out of the buffer, because a sampler that quietly drew a uniform disc would look almost the same and be a different galaxy');
  ok('and it is seeded, so the Galaxy a reader is shown is the same Galaxy on every load and in every screenshot of it',
    /const rnd=mulberry\(20260915\);/.test(src),
    'one seed, named — an unseeded population would make every measurement of it unrepeatable');
}

console.log(`\n  ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
