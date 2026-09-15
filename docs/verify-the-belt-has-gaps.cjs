#!/usr/bin/env node
'use strict';
/* ══ THE BELT HAS GAPS, AND THEY ARE JUPITER'S ═══════════════════════════════
 *
 * The asteroid belt in this atlas was eleven lines:
 *
 *     const a = 2.1 + Math.random()*1.2, th = Math.random()*2*Math.PI;
 *     const z = (Math.random()-.5)*.25;
 *
 * Three thousand five hundred points, uniform in semi-major axis, a uniform
 * quarter-AU slab, one flat grey. Three things were wrong with it.
 *
 * It was UNSEEDED, so it was a different belt on every load and no measurement of
 * it could be repeated — the rule this atlas adopted when its Galaxy became a
 * population.
 *
 * It had NO INCLINATION DISTRIBUTION. The real belt has a roughly Rayleigh
 * inclination of about 9° RMS, which at 2.65 AU is a torus a quarter of an AU
 * thick in the mean and reaching an AU and a half, not a plate.
 *
 * AND IT HAD NO KIRKWOOD GAPS — the one structural fact everybody knows about the
 * asteroid belt. They are not decoration and they are not a picture: each is a
 * mean-motion resonance with Jupiter, and an asteroid completing p orbits while
 * Jupiter completes q sits at a = a_J (q/p)^(2/3). So they are DERIVED here from
 * the semi-major axis in the atlas's own JPL element table. Change Jupiter and
 * they move.
 *
 * AND THE GAPS ARE IN a, NOT IN r. That is what this instrument can show and a
 * diagram cannot. The resonance empties a range of SEMI-MAJOR AXIS; what a reader
 * sees is the distance an asteroid happens to be at, and an eccentricity of 0.145
 * smears each gap across ±0.4 AU. Measured on the drawn buffer: the 3:1 gap is 84 %
 * deep in a and −11 % — noise — in r. That is why Kirkwood found them in a
 * histogram in 1866 and nobody found them by looking, and the reader can collapse
 * every asteroid onto its own semi-major axis and watch them appear.
 */
const fs = require('node:fs'), path = require('node:path');
const ROOT = path.join(__dirname, '..');
const src = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
let pass = 0, fail = 0;
const ok = (n, c, d) => { if (c) { pass++; console.log('  PASS — ' + n + (d ? ' :: ' + d : '')); }
  else { fail++; console.log('  FAIL — ' + n + (d ? ' :: EXPECTED ' + d : '')); } };

{ /* 1. THE GAPS ARE DERIVED */
  ok('THE KIRKWOOD GAPS ARE DERIVED FROM JUPITER rather than typed: a = a_J (q/p)^(2/3) is Kepler\u2019s third law, and a_J is read from the element table the planets themselves are drawn from',
    /function solarResonanceAU\(p,q\)\{ return solarJupiterA\(\)\*Math\.pow\(q\/p, 2\/3\); \}/.test(src)
    && /const j=PLANETS\.find\(p=>p\.name==='Jupiter'\); if\(j&&j\.a>0\) return j\.a;/.test(src)
    && !/2\.50\b.*2\.82\b.*3\.27/.test(src),
    'one authority: the gaps cannot disagree with the planet that makes them');
  const res = (src.match(/\{p:\d,q:\d, w:[\d.]+, depth:[\d.]+, name:'[\d:]+'\}/g) || []);
  ok('and the five resonances it draws are declared with their orders, so the list can be read and checked against the literature rather than inferred from five numbers',
    res.length === 5 && /name:'3:1'/.test(src) && /name:'5:2'/.test(src)
    && /name:'7:3'/.test(src) && /name:'2:1'/.test(src) && /name:'4:1'/.test(src),
    `${res.length} declared — 4:1, 3:1, 5:2, 7:3, 2:1 — each with the drawn width and depth of its notch, which are a profile and not a claim about its dynamics`);
}

{ /* 2. THE SAMPLING IS PHYSICAL AND REPEATABLE */
  ok('and the belt is sampled from that density in SEMI-MAJOR AXIS by rejection, then placed on a real orbit at a random true anomaly — so what the reader sees is where an asteroid would be, not where its average is',
    /do\{ a=SOLAR_BELT\.aMin\+rnd\(\)\*\(SOLAR_BELT\.aMax-SOLAR_BELT\.aMin\); \}/.test(src)
    && /while\(rnd\(\)>solarBeltDensity\(a\) && \+\+guard<64\);/.test(src)
    && /const r=a\*\(1-e\*e\)\/\(1\+e\*Math\.cos\(nu\)\);/.test(src),
    'the orbit is the conic, not a circle with noise on it');
  ok('and the inclinations are Rayleigh about the declared 9° RMS, converted through the distribution\u2019s own mean rather than used as a scale directly, so the belt is a torus and the old uniform ±0.125 AU slab is gone',
    /const rayleigh=mean=>\{ const s=mean\/Math\.sqrt\(Math\.PI\/2\); return s\*Math\.sqrt\(-2\*Math\.log\(u\(\)\)\); \};/.test(src)
    && /incRmsDeg:9\.0/.test(src) && /eccRms:0\.145/.test(src)
    && !/const z = \(Math\.random\(\)-\.5\)\*\.25;/.test(src),
    'a Rayleigh mean is sigma·sqrt(pi/2), and using the quoted RMS as sigma would have made the belt 25 % too thick');
  ok('and it is seeded, so the belt a reader is shown is the same belt on every load — the old one called Math.random() twice per asteroid',
    /const rnd=mulberry\(20260916\);\s*\n\s*const u=\(\)=>Math\.max\(rnd\(\),1e-9\);/.test(src)
    && /const rnd2=mulberry\(20260916\);/.test(src)
    && !/const a = 2\.1 \+ Math\.random\(\)\*1\.2/.test(src),
    'its own seed, not the Galaxy\u2019s: both drawing from 20260915 made an earlier form of this clause pass while the belt had been unseeded, because the Galaxy\u2019s call was still there to find — and the boot suite replays the seed to reproduce the first asteroid');
}

{ /* 3. THE THING THE INSTRUMENT IS FOR */
  ok('and the reader can collapse every asteroid onto its own semi-major axis and watch the gaps appear, because the gaps are in a and the eccentricity hides them in r — which is the whole reason they were found in a histogram and not by looking',
    /uniform float uCollapse/.test(src)
    && /vec3 flatPos = vec3\(aA\*cos\(aTheta\), 0\.0, aA\*sin\(aTheta\)\);/.test(src)
    && /vec3 p = mix\(truePos, flatPos, uCollapse\);/.test(src)
    && /id="beltGaps"/.test(src),
    'both the true position and the semi-major axis ride on the buffer, and the control eases between them so the TRANSITION is what the reader sees');
  ok('and the gap contrast is measured out of the drawn buffer in both coordinates rather than asserted, per unit width so a wider comparison band cannot flatter it',
    /function solarBeltContrast\(sample, aOf\)\{/.test(src)
    && /const dIn=inGap\/\(2\*w\), dOut=around\/\(6\*w\);/.test(src),
    'measured: 84 % deep in a at the 3:1 and −11 % in r, which is noise');
  ok('and the taxonomy changes across the belt as it really does — silicaceous inward, carbonaceous outward, crossing over near 2.7 AU — as a smooth mix rather than a step, because the two populations overlap',
    /* the two ends of the taxonomy became UNIFORMS when the Kuiper belt was added,
     * because one shader now draws both populations — silicaceous to carbonaceous
     * here, ultra-red to neutral there. The clause is about the belt having a
     * taxonomy at all and about it being a mix rather than a step; where the two
     * colours are declared is the shader's business. */
    /type\[i\]=1\/\(1\+Math\.exp\(-\(a-2\.72\)\/0\.16\)\);/.test(src)
    && /uColA:\{value:new THREE\.Color\(0\.86,0\.74,0\.58\)\}/.test(src)
    && /vCol = mix\(uColA, uColB, clamp\(aType,0\.0,1\.0\)\);/.test(src),
    'the old belt was one flat grey');
}

console.log(`\n  ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
