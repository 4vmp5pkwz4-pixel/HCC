#!/usr/bin/env node
'use strict';
/* ══ THE MILKY WAY, ALIVE ═══════════════════════════════════════════════════════════════
 * A reader ran the clock to its limit and saw the Galaxy in the Solar world turn like a
 * painted wheel: one cloud of points swung rigidly round the Sun, arms and all, while the
 * trails of the nearby stars hung where they had been. Three repairs, checked here:
 *   1. THE ARMS TRAIL. Once the disc turned the right way (v4.320), the arm tracks drawn in
 *      its frame were LEADING the rotation — which no observed spiral does. They now wind
 *      the other way, and the arm tracers agree: η Carinae lands in Sagittarius–Carina
 *      (where it is) only with the trailing winding, on the Local Spur with the old one
 *   2. THE DISC IS A DISC. 90 000 stars carried by the shader at Ω(R) − Ω₀ in the frame
 *      that turns with the Sun (so the Sun's radius stands still, the inside overtakes
 *      it, the outside falls behind), and young stars lit only where the density wave
 *      is, the wave turning at Ωp − Ω₀ — so the arms move THROUGH the stars, slowest
 *      near corotation, which on this model's own numbers sits at the Sun's radius
 *   3. THE SCHEMATIC ARMS RIDE THE SAME WAVE, and the Sun is taken out of them: it
 *      stands still in this frame, the pattern does not
 *   4. THE TRAILS MOVE WITH THEIR STARS: seen from the Sun, a streak is now the star's
 *      own ridden path from where it is, redrawn as the clock runs
 *   5. ☰ IS A TOOLBOX, including "the Galaxy from above"
 *   6. MUTATION: the old winding puts η Carinae on the Local Spur, caught
 */
const fs = require('node:fs'), path = require('node:path');
const SRC = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
let pass = 0, fail = 0;
const ok = (n, c, d) => { if (c) { pass++; console.log('  PASS — ' + n + (d ? ' :: ' + d : '')); } else { fail++; console.log('  FAIL — ' + n + (d ? ' :: ' + d : '')); } };

/* the arm tracers, placed here from their catalogue RA/Dec and distance */
const a = SRC.indexOf('const MWT_OBJECTS=') + 'const MWT_OBJECTS='.length, MWT = JSON.parse(SRC.slice(a, SRC.indexOf('];', a) + 1));
const D = Math.PI / 180, AG = [[-0.0548755604, -0.8734370902, -0.4838350155], [0.4941094279, -0.4448296300, 0.7469822445], [-0.8676661490, -0.1980763734, 0.4559837762]];
const R0 = 8.178, ARMS = [['sct', 5.0], ['sgr', 6.7], ['per', 9.7], ['nor', 13.2], ['ori', 8.2, 11.5]];
const armOf = (o, wind) => { const e = [Math.cos(o.de * D) * Math.cos(o.ra * D), Math.cos(o.de * D) * Math.sin(o.ra * D), Math.sin(o.de * D)], g = AG.map(r => (r[0] * e[0] + r[1] * e[1] + r[2] * e[2]) * o.dKpc);
  /* the disc frame: x from the centre toward the Sun, y to the pole, z = x × y = the direction of the Sun's motion */
  const lx = -(g[0] - R0), lz = g[1], R = Math.hypot(lx, lz), th = Math.atan2(lz, lx); let best = null;
  for (const [k, Ra, p] of ARMS) { const tp = Math.tan((p || 12.5) * D), ta = wind * Math.log(Math.max(R, 0.2) / Ra) / tp; const dd = ((th - ta) % (2 * Math.PI) + 3 * Math.PI) % (2 * Math.PI) - Math.PI; const perp = Math.abs(R * dd * Math.sin(Math.atan(tp)));
    if (!best || perp < best.perp) best = { k, perp }; }
  return best.k; };
const eta = MWT.find(o => o.key === 'etacar');

/* 1 · the arms trail */
{ const wind = +((SRC.match(/const MW_SOLAR_WIND=(-?1);/) || [])[1]);
  /* the Sun moves along +z of the disc frame at azimuth 0, so the rotation INCREASES azimuth; an arm trails when its
     azimuth DECREASES outward: d(az)/dR = wind/(R tan p) < 0 */
  ok('the arms trail: the Sun moves along +z of the disc frame (azimuth increasing), and the arm azimuth now decreases outward — the drawn tracks, the tracer classification and the shader all use the same trailing winding',
    wind === -1 && /const a=MW_SOLAR_AZ0\+MW_SOLAR_WIND\*dth/.test(SRC) && /const ta=MW_SOLAR_AZ0\+MW_SOLAR_WIND\*Math\.log/.test(SRC) && /uWind:\{value:MW_SOLAR_WIND\}/.test(SRC), `MW_SOLAR_WIND = ${wind}`);
  ok('and the arm tracers agree: with the trailing winding η Carinae lands in Sagittarius–Carina, where it is', armOf(eta, -1) === 'sgr', `η Carinae → ${armOf(eta, -1)}`); }

/* 2 · the disc is a disc */
{ const sh = SRC.slice(SRC.indexOf('function mwLivingBuild(){'), SRC.indexOf('function mwLivingShow(){'));
  const Om0 = 2 * Math.PI / 230, rel = R => Om0 * R0 / Math.max(R, 1) - Om0, OmP = 28 * 1.0226903e-3, Rc = Om0 * R0 / OmP;
  ok('the disc is a disc: each star turns at Ω(R) − Ω₀ in the frame that turns with the Sun — zero at the Sun\'s radius, ahead inside, behind outside — and young stars shine only where the wave is, the wave turning at Ωp − Ω₀',
    /float om=uOm0\*uR0\/max\(aR,1\.0\);/.test(sh) && /float phi=aP\+\(om-uOm0\)\*uT;/.test(sh) && /\+\(uOmP-uOm0\)\*uT;/.test(sh) && /lum=0\.05\+1\.5\*w;/.test(sh)
    && Math.abs(rel(R0)) < 1e-15 && rel(4) > 0 && rel(12) < 0 && /N=\(typeof MOBILE_GPU!=='undefined'&&MOBILE_GPU\)\?40000:90000/.test(sh),
    `Ω(4 kpc) − Ω₀ = ${rel(4).toFixed(4)} rad/Myr · Ω(12) − Ω₀ = ${rel(12).toFixed(4)} · pattern − Ω₀ = ${(OmP - Om0).toFixed(5)} · the wave and the stars move together at R = ${Rc.toFixed(2)} kpc`); }

/* 3 · the schematic arms ride the wave, the Sun does not */
ok('the schematic arm tracks ride the same wave, and the Sun marker is taken out of them — it stands still in this frame, the pattern does not',
  /mwArms\.rotation\.y=-\(\(MILKY_WAY\.OmegaP\*MW_KMS_KPC_TO_RAD_MYR\)-\(2\*Math\.PI\/GAL_YEAR_MYR\)\)\*tMyr;/.test(SRC) && /milkyWayPhysical\.add\(mwSunDot\);/.test(SRC) && !/mwArms\.add\(mwSunDot\)/.test(SRC)
  && /try\{ mwLivingUpdate\(\); \}catch/.test(SRC));

/* 4 · trails move with their stars */
ok('the trails move with their stars: seen from the Sun a streak runs from where the star is now to where it will be, redrawn as the clock runs; the decomposed frames turn with the disc and fade',
  /hip3dPosAt\(s,epJ,v\); hip3dPosAt\(s,epJ\+tau,w\);/.test(SRC) && /try\{ galFlowRide\(epJ\); \}catch/.test(SRC) && /galFlowGroup\.quaternion\.copy\(galSpinQuat\(new THREE\.Quaternion\(\)\)\)/.test(SRC)
  && /LS\.userData\.stars=F\.G\.map/.test(SRC));

/* 5 · ☰ */
ok('☰ is a toolbox: it opens one sheet of the tools that act on the view — clean view, reset, fullscreen, capture, theme, share, reset motion, all laboratories — and the atlas-wide panels, the Galaxy from above among them',
  /if\(dock\)\{ dock\.onclick=\(\)=>toolsOpen\(\);/.test(SRC) && /TT\('Clean view'/.test(SRC) && /TT\('The Galaxy from above'/.test(SRC) && /TT\('Share link'/.test(SRC) && /globalThis\.HCC_TOOLS=Object\.freeze/.test(SRC));

/* 6 · mutation */
ok('MUTATION — the old (leading) winding puts η Carinae on the Local Spur instead of Sagittarius–Carina, caught', armOf(eta, 1) !== 'sgr', `η Carinae → ${armOf(eta, 1)}`);

console.log('\n  ' + pass + ' passed, ' + fail + ' failed'); process.exit(fail ? 1 : 0);
