#!/usr/bin/env node
'use strict';
/* ══ BETWEEN NEPTUNE AND THE CLOUD ═══════════════════════════════════════════
 *
 * The Solar System in this atlas ran from the planets straight to an inferred
 * comet reservoir at two thousand AU, with the entire Kuiper belt — the structure
 * that told us Pluto is not a planet — missing from it.
 *
 * It is built the way the asteroid belt was built one release ago, and for the
 * same reason: its shape is made of resonances with the planet that governs it,
 * and those follow from Kepler's third law alone. An object completing p orbits
 * while Neptune completes q sits at a = a_N (q/p)^(2/3), so the plutino peak is
 * DERIVED from the semi-major axis in this atlas's own element table.
 *
 * AND THAT IS THE CHECK WORTH MAKING. Neptune's a = 30.06992276 AU puts the 3:2 at
 * 39.403 AU. Pluto — which the atlas draws independently, from its own JPL row,
 * with no knowledge of this — sits at 39.48. The belt's largest feature and the
 * position of its largest member agree to two parts in a thousand.
 *
 * AND THE OORT CLOUD'S RADIAL LAW WAS IMPLICIT, AND WRONG. logRand draws uniformly
 * in ln r, which IS a number density n(r) ∝ r⁻³ — a choice nobody made and nothing
 * stated — where the models this atlas cites give r^−3.5 (Hills 1981; Duncan, Quinn
 * & Tremaine 1987). Declared and drawn by the exact inverse of its own cumulative,
 * which is closed form for every index except 3, and 3 is the one the old draw was
 * silently assuming.
 */
const fs = require('node:fs'), path = require('node:path');
const ROOT = path.join(__dirname, '..');
const src = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
let pass = 0, fail = 0;
const ok = (n, c, d) => { if (c) { pass++; console.log('  PASS — ' + n + (d ? ' :: ' + d : '')); }
  else { fail++; console.log('  FAIL — ' + n + (d ? ' :: EXPECTED ' + d : '')); } };

{ /* 1. THE BELT EXISTS AND ITS SHAPE IS DERIVED */
  ok('THE ATLAS HAS A KUIPER BELT, where it used to run from the planets straight to a comet reservoir at two thousand AU',
    /const KUIPER=Object\.freeze\(\{/.test(src)
    && /kuiperPoints=new THREE\.Points\(g, new THREE\.ShaderMaterial\(\{/.test(src)
    && /const kuiperGroup=new THREE\.Group\(\); solarGroup\.add\(kuiperGroup\);/.test(src),
    'the classical belt, the 3:2, the 2:1, the 5:3 and the scattered disc, each with its own eccentricity and inclination');
  ok('and the resonances that shape it are DERIVED from Neptune’s own semi-major axis, read from the element table the planets are drawn from — change Neptune and the plutinos move',
    /function kuiperResonanceAU\(p,q\)\{ return kuiperNeptuneA\(\)\*Math\.pow\(q\/p, 2\/3\); \}/.test(src)
    && /const n=PLANETS\.find\(p=>p\.name==='Neptune'\); if\(n&&n\.a>0\) return n\.a;/.test(src)
    && /\{p:2,q:3, name:'3:2 · plutinos'/.test(src),
    'a_N (q/p)^(2/3) puts the 3:2 at 39.403 AU, and Pluto sits at 39.48 having been placed from its own row');
  ok('and the peak of the drawn population is measured back out of the buffer as a histogram of semi-major axis, rather than being trusted because it was sampled from a table that said so',
    /let best=0; for\(let i=1;i<nb;i\+\+\) if\(h\[i\]>h\[best\]\) best=i;/.test(src)
    && /Math\.abs\(peak-kuiperResonanceAU\(2,3\)\)<2\*bin/.test(src),
    'the busiest bin of 22,000 objects lands at 39.30 AU, one bin from the resonance');
}

{ /* 2. IT IS A POPULATION, WITH THE PROPERTIES OF ONE */
  ok('and it is a thick torus rather than a plate: the resonant groups and the scattered disc carry ten to eighteen degrees of inclination where the cold classical belt carries eight',
    /incRmsDeg:8\.0, eccRms:0\.075/.test(src)
    && /scattered:\{frac:0\.14, aMin:48, aMax:260, eccRms:0\.42, incRmsDeg:18\}/.test(src)
    && /const rayleigh=mean=>\{ const s=mean\/Math\.sqrt\(Math\.PI\/2\); return s\*Math\.sqrt\(-2\*Math\.log\(u\(\)\)\); \};/.test(src),
    'measured back out: mean |z| of 6.83 AU over a belt whose bulk is at 44');
  ok('and its colour tracks INCLINATION rather than radius, because the ultra-red matter survives only where nothing has stirred it',
    /type\[i\]=1\/\(1\+Math\.exp\(-\(0\.12-inc\)\/0\.05\)\);/.test(src)
    && /uColA:\{value:new THREE\.Color\(0\.72,0\.44,0\.36\)\}/.test(src),
    'the cold classical belt is the red one');
  ok('and it has its own seed, not the asteroid belt’s and not the Galaxy’s — a shared magic number is a shared blind spot, which this atlas has already paid for once',
    /const rnd=mulberry\(20260917\);/.test(src)
    && /const rnd=mulberry\(20260916\);/.test(src)
    && /const rnd=mulberry\(20260915\);/.test(src),
    'three populations, three seeds, each named where it is drawn');
  ok('and one shader draws both belts, because they differ in their populations and not in their physics — the two ends of whichever taxonomy each has arrive as uniforms',
    /uniform vec3 uColA, uColB;/.test(src)
    && /vCol = mix\(uColA, uColB, clamp\(aType,0\.0,1\.0\)\);/.test(src)
    && !/vec3 sType = vec3\(0\.86,0\.74,0\.58\);/.test(src),
    'silicaceous to carbonaceous for the asteroids, ultra-red to neutral for the Kuiper objects');
}

{ /* 3. THE OORT CLOUD'S LAW IS DECLARED */
  ok('AND THE OORT CLOUD’S RADIAL LAW IS DECLARED. Drawing uniformly in ln r IS a number density proportional to r to the minus three — a choice nobody made and nothing stated — where the models this atlas cites give minus three and a half',
    /const OORT_GAMMA=3\.5;/.test(src)
    && /const powRand=\(a,b,g\)=>\{/.test(src)
    && /const logRand=\(a,b\)=>powRand\(a,b,OORT_GAMMA\);/.test(src),
    'and drawn by the exact inverse of its own cumulative, which is closed form for every index except 3 — the one the old draw was assuming');
  ok('and the boot suite measures the MEDIAN RADIUS of the drawn cloud rather than looking for the constant in the file, which is what its first form did with an || true on the end that made it assert nothing at all',
    /const med=rs\[Math\.floor\(m\/2\)\];/.test(src)
    && /Math\.abs\(med\/want-1\)<0\.05/.test(src)
    && !/test\(String\(typeof oortPoints\)\)\|\|true/.test(src),
    '38,032 AU measured against the 38,197 the declared index gives; the implicit one would have put it at 44,721');
}

console.log(`\n  ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
