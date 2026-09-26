#!/usr/bin/env node
'use strict';
/* ══ ANDROMEDA, ALIVE — AND LEANING THE WAY THE SKY SHOWS ═══════════════════════════════
 * The galaxies of the Solar world were pictures: M31 a two-armed cloud swung rigidly once
 * in 250 Myr, the Milky Way a cloud of points with no light between them. This file checks
 * what replaced them, from the source and against geometry computed HERE:
 *   1. THE TILT. M31's north-west half is the near side (its dust lanes stand against the
 *      bulge — Hubble 1943) and its north-east half recedes (Rubin & Ford 1970). From the
 *      catalogue RA, Dec, inclination and position angle alone, the basis the atlas uses
 *      puts the NW minor-axis point nearer than the centre and, spun about its normal,
 *      makes the NE major-axis point recede — and the Solar-world M31 now uses that basis
 *   2. THE ARMS TRAIL: in that frame the shader's azimuth increases with the spin and the
 *      crest azimuth decreases outward
 *   3. ONE CLOCK: the living disc subtracts exactly the rate its host frame turns at, so a
 *      star's inertial angle is aP + Ω(R)·t, and the frame period is one declared number
 *   4. THE DUST LANE IS WHERE COROTATION PUTS IT: inside corotation on the upstream edge of
 *      the arm and the young stars downstream; outside, both swap sides
 *   5. HII KNOTS LIVE IN THE MATERIAL FRAME: a clump born at φc is found, age a later, at
 *      φc + (Ω − Ω_frame)·a — two generations, ~30 Myr each, cross-faded
 *   6. THE BAR IS A FIGURE: its stars turn as one at Ωbar instead of shearing apart, and the
 *      diffuse bar turns at the same rate
 *   7. the Milky Way's diffuse light uses the same rates as its stars, and fades from inside
 *   8. MUTATION: the old tilt (L·cos i with a plus sign) puts the SE half nearer, caught
 */
const fs = require('node:fs'), path = require('node:path');
const SRC = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
let pass = 0, fail = 0;
const ok = (n, c, d) => { if (c) { pass++; console.log('  PASS — ' + n + (d ? ' :: ' + d : '')); } else { fail++; console.log('  FAIL — ' + n + (d ? ' :: ' + d : '')); } };
const D = Math.PI / 180, dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2], add = (a, b, k = 1) => a.map((x, i) => x + k * b[i]), mul = (a, k) => a.map(x => x * k);
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]], unit = a => mul(a, 1 / Math.hypot(...a));
/* equatorial, built here */
const eq = (ra, de) => [Math.cos(de * D) * Math.cos(ra * D), Math.cos(de * D) * Math.sin(ra * D), Math.sin(de * D)];
const gd = SRC.match(/m31:\{name:'Andromeda centre · M31\*',ra:([\d.]+),dec:([\d.]+),distLy:[\d.e]+,col:0x[0-9a-f]+,inclination:([\d.]+),pa:([\d.]+)/);
const [ra, de, inc, pa] = gd.slice(1).map(Number);
const basis = sign => { const L = eq(ra, de), E = unit(cross([0, 0, 1], L)), N = unit(cross(L, E));
  const major = unit(add(mul(N, Math.cos(pa * D)), E, Math.sin(pa * D))), minor = unit(add(mul(N, -Math.sin(pa * D)), E, Math.cos(pa * D)));
  const normal = unit(add(mul(L, sign * Math.cos(inc * D)), minor, Math.sin(inc * D))); return { L, E, N, major, minor, normal }; };
/* the in-plane point in the direction of a sky vector s: remove the normal part */
const inPlane = (B, s) => unit(add(s, B.normal, -dot(s, B.normal)));
const verdict = B => { const nw = inPlane(B, unit(add(B.N, B.E, -1))), se = inPlane(B, unit(add(B.E, B.N, -1)));
  const ne = B.major, vNE = cross(B.normal, ne);   /* spin about +normal: v = n × r */
  return { nwNear: dot(nw, B.L) < 0 && dot(se, B.L) > 0, neRecedes: dot(vNE, B.L) > 0, nw: dot(nw, B.L), v: dot(vNE, B.L) }; };

/* 1 · the tilt */
{ const B = basis(-1), v = verdict(B);
  const gdb = SRC.slice(SRC.indexOf('function galaxyDiscBasis('), SRC.indexOf('function galaxyStars('));
  ok('THE TILT: from RA, Dec, i and PA alone the atlas\'s basis puts M31\'s north-west half nearer than its centre and, spun about its normal, the north-east half receding — both as observed — and the Solar-world M31 now stands on that basis',
    v.nwNear && v.neRecedes && /const normal=L\.clone\(\)\.multiplyScalar\(-Math\.cos\(inc\)\)\.addScaledVector\(minor,Math\.sin\(inc\)\)/.test(gdb)
    && /const B=galaxyDiscBasis\(GAL_DATA\.m31\.ra,GAL_DATA\.m31\.dec,GAL_DATA\.m31\.inclination,GAL_DATA\.m31\.pa\);\n\s*orientDisk\(m31Physical,B\.major,B\.normal\);/.test(SRC),
    `NW point · line of sight ${v.nw.toFixed(3)} (nearer) · NE velocity · line of sight ${v.v.toFixed(3)} (receding)`); }

/* 2 · the arms trail */
{ const B = basis(-1), x = B.major, y = B.normal, z = cross(x, y), P = (R, f) => add(mul(x, R * Math.cos(f)), z, -R * Math.sin(f));   /* hand −1 */
  const rot = (v, th) => add(add(mul(v, Math.cos(th)), cross(y, v), Math.sin(th)), y, dot(y, v) * (1 - Math.cos(th)));   /* Rodrigues about +normal */
  const moved = rot(P(10, 0.3), 0.01), expect = P(10, 0.31), err = Math.hypot(...add(moved, expect, -1));
  const w = /M31_LIVING\.stars=galLivingStars|common=\{[^}]*hand:-1, wind:-1/.test(SRC) && /OmP:D\.Vflat\*k\/D\.corotationKpc, frame, hand:-1, wind:-1/.test(SRC);
  const crest = R => -Math.log(R / 10) / Math.tan(7 * D);
  ok('THE ARMS TRAIL: in M31\'s frame the shader\'s azimuth (hand −1) advances exactly with the spin about the normal, and the crest azimuth falls outward (wind −1)',
    err < 1e-12 && w && crest(12) < crest(8), `spin vs azimuth ${err.toExponential(1)} · crest(8) ${crest(8).toFixed(2)} > crest(12) ${crest(12).toFixed(2)} rad`); }

/* 3 · one clock */
{ const spin = +eval((SRC.match(/spinDays:([\d.e*]+)\}\);/) || [])[1]);
  const frame = 2 * Math.PI / (spin / 365.25 / 1e6), host = t => 2 * Math.PI * ((t * 365.25e6) % spin) / spin;
  let worst = 0; for (const t of [0.7, 37, 412.5, 2600]) { const om = 250 * 1.0226903e-3 / 10, inertial = 1.1 + om * t, drawn = 1.1 + (om - frame) * t + host(t);
    const d = Math.abs(((inertial - drawn) % (2 * Math.PI) + 3 * Math.PI) % (2 * Math.PI) - Math.PI); worst = Math.max(worst, d); }
  ok('ONE CLOCK: the living disc subtracts exactly the rate its host frame turns at, so a star\'s drawn angle is its inertial aP + Ω(R)·t, and the frame period is one declared number used by both',
    worst < 1e-9 && /const m31Days=M31_DISC\.spinDays;/.test(SRC) && /frame=2\*Math\.PI\/\(D\.spinDays\/365\.25\/1e6\)/.test(SRC) && /float phi=aP\+\(om-uFrame\)\*uT;/.test(SRC),
    `worst phase error ${worst.toExponential(1)} rad over 2.6 Gyr`); }

/* 4 · the dust lane */
{ const g = SRC.slice(SRC.indexOf('function galGlowDisc(P){'), SRC.indexOf('function galLivingStars(P){'));
  /* the gas moves at Ω − Ωp relative to the pattern, in +φ; it arrives from the side it comes from */
  const side = (om, omP) => { const sg = om > omP ? 1 : -1; return { dust: -sg * 0.32, born: sg * 0.42, upstream: -Math.sign(om - omP) }; };
  const inn = side(0.05, 0.03), out = side(0.02, 0.03);
  ok('THE DUST LANE IS WHERE COROTATION PUTS IT: inside corotation on the upstream edge of each arm with the young stars downstream, outside corotation both swapped',
    /float sg=om>uOmP\?1\.0:-1\.0;/.test(g) && /exp\(-\(ds\+sg\*0\.32\)\*\(ds\+sg\*0\.32\)\/0\.035\)/.test(g) && /exp\(-\(ds-sg\*0\.42\)\*\(ds-sg\*0\.42\)\/0\.14\)/.test(g)
    && Math.sign(inn.dust) === inn.upstream && Math.sign(inn.born) === -inn.upstream && Math.sign(out.dust) === out.upstream && Math.sign(out.born) === -out.upstream,
    `inside: dust at ${inn.dust}, young at +${inn.born} kpc · outside: dust at +${out.dust}, young at ${out.born} kpc`); }

/* 5 · knots in the material frame */
{ const g = SRC.slice(SRC.indexOf('function galGlowDisc(P){'), SRC.indexOf('function galLivingStars(P){'));
  const om = 0.04, fr = 0.027, phic = 0.9, age = 17, phiNow = phic + (om - fr) * age, recovered = phiNow - (om - fr) * age;
  ok('HII KNOTS LIVE IN THE MATERIAL FRAME: a clump born at φc is found age a later at φc + (Ω − Ω_frame)·a and looked up at its birth place; two generations of ~30 Myr cross-faded',
    Math.abs(recovered - phic) < 1e-15 && /float pm=phi-\(om-uFrame\)\*age;/.test(g) && /float tk=uT\/30\.0\+0\.5\*float\(k\), e=floor\(tk\), a=fract\(tk\), age=a\*30\.0;/.test(g) && /kn\+=c\*sin\(3\.14159265\*a\);/.test(g)); }

/* 6 · the bar */
ok('THE BAR IS A FIGURE: its stars turn as one at Ωbar instead of shearing apart, and the diffuse bar turns at the same rate',
  /if\(aK>1\.5\) phi=aP\+\(uOmB-uOm0\)\*uT;/.test(SRC) && /uOmB:\{value:M\.OmegaBar\*MW_KMS_KPC_TO_RAD_MYR\}/.test(SRC) && /float ba=uBarA\+\(uOmB-uFrame\)\*uT;/.test(SRC) && /OmB:M\.OmegaBar\*k,/.test(SRC));

/* 7 · the Milky Way's light */
ok('the Milky Way\'s diffuse light runs on the same rates as its stars (V = Ω₀R₀, frame Ω₀, arms Ωp, bar Ωbar) and fades out when seen from inside the disc',
  /MW_LIVING\.glow=galGlowDisc\(\{Vflat:Om0\*M\.R0\/k, Rsolid:1\.0,/.test(SRC) && /OmP:M\.OmegaP\*k, frame:Om0, hand:1, wind:MW_SOLAR_WIND, az0:MW_SOLAR_AZ0/.test(SRC)
  && /G\.material\.uniforms\.uFade\.value=THREE\.MathUtils\.smoothstep\(h,0\.35,2\.5\);/.test(SRC) && /globalThis\.HCC_MW=Object\.freeze\(\{view:\(\)=>mwLivingShow\(\), andromeda:face=>m31LivingShow\(!!face\),/.test(SRC));

/* 8 · mutation */
{ const v = verdict(basis(+1));
  ok('MUTATION — the old tilt (+L·cos i) puts the south-east half nearer, and with the recession kept the arms would lead: caught', !v.nwNear && v.neRecedes, `NW point · line of sight ${v.nw.toFixed(3)}`); }

console.log('\n  ' + pass + ' passed, ' + fail + ' failed'); process.exit(fail ? 1 : 0);
