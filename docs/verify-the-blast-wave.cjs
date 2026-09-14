#!/usr/bin/env node
'use strict';
/* ══ THE BLAST WAVE THE ATLAS DERIVES, AND THE WINDOW WHERE IT IS TRUE ════════
 *
 * Every other dimension check in this repository is about the dimension table itself.
 * This one is about the first time that table PREDICTS A NUMBER PHOTOGRAPHS CAN
 * CONTRADICT, so it is written to be as hostile to that prediction as possible.
 *
 * Hand the null-space routine the four kinds {energy, mass density, time, length} and
 * exactly one dimensionless group comes back: ρL⁵/(Et²). That is R = ξ(Et²/ρ)^(1/5),
 * and the exponents 1/5, −1/5, 2/5 are never typed in the source — they are read out
 * of the same integer arithmetic that sorted the twenty-nine directions.
 *
 * ξ IS THE PART DIMENSIONAL ANALYSIS CANNOT REACH. Buckingham fixes the shape of a law
 * and is silent about the constant in front. So the atlas integrates the similarity
 * equations for it, and this file checks the result against two published values at
 * two different γ — because one number agreeing could be a coincidence and two could
 * not. It also checks that the value is NOT the approximate closed form that is often
 * quoted for ξ, which gives 1.0144 where the true constant is 1.0328: a derivation
 * that silently degraded to the approximation would still look plausible.
 *
 * THEN THE TEST. G. I. Taylor's 1950 table, from Mack's photographs of Trinity, is
 * fitted for its exponent with no knowledge of what it ought to be, and the answer is
 * 0.4058 ± 0.0076 against the derived 0.4.
 *
 * AND THEN THE HONEST PART, which is the reason this file exists rather than a check
 * that the yield comes out right. Inverting for E does NOT give one number: it gives
 * 4.3 kt at the first frame and 14.3 at the last, because the derivation assumed a
 * POINT source (false while the shock has swept less air than the device weighed) and
 * a STRONG shock (false once it is down to Mach 3). Inside the window where both hold,
 * twelve points read 18.97 ± 0.60 kt. A validity window reported as a window is worth
 * more than a yield reported as a fact, and this file checks that the window is a
 * PLATEAU rather than a threshold tuned until the answer looked good — which is the
 * only thing that separates the two.
 */
const fs = require('node:fs'), path = require('node:path');
const ROOT = path.join(__dirname, '..');
const src = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
let pass = 0, fail = 0;
const ok = (n, c, d) => { if (c) { pass++; console.log('  PASS — ' + n + (d ? ' :: ' + d : '')); }
  else { fail++; console.log('  FAIL — ' + n + (d ? ' :: EXPECTED ' + d : '')); } };

/* ── run the atlas's OWN code rather than a copy of it ─────────────────────────
   A verifier that reimplements the physics it checks is checking its own arithmetic
   and would agree with the source about a shared mistake. So the three blocks are cut
   out of index.html and evaluated: what is exercised below is the shipped source. */
const cut = (a, b) => { const i = src.indexOf(a); const j = src.indexOf(b, i);
  if (i < 0 || j < 0) throw new Error('could not cut ' + a.slice(0, 40)); return src.slice(i, j); };
const API = (() => {
  const code = cut('const HCC_DIM=', '/* ══ TWENTY-NINE')
    + cut('function hccNullBasis', 'function hccDirectionCensus')
    + cut('/* ══ THE BLAST WAVE', '/* and four that must FAIL')
    + '\nreturn {hccBlastExponents, hccSedovProfile, hccSedovXi, hccBlastRadius, hccBlastSpeed,'
    + ' hccTrinitySlope, hccTrinityYield, hccTrinityStability, hccTrinityPoints, HCC_TRINITY, HCC_SEDOV};';
  return new Function(code)();
})();

/* 1 ── the exponents are DERIVED, and the file must not contain them as text */
{ const x = API.hccBlastExponents();
  ok('the four kinds admit exactly one dimensionless group, and it is ρL⁵/(Et²)',
    !!x && x.groups === 1 && JSON.stringify(x.vector) === '[-1,1,-2,5]',
    x ? 'null space of {energy, mass density, time, length} → [' + x.vector.join(', ') + ']' : 'one group');
  ok('and the exponents of the law are read out of it rather than typed',
    Math.abs(x.energy - 0.2) < 1e-12 && Math.abs(x['mass density'] + 0.2) < 1e-12
    && Math.abs(x.time - 0.4) < 1e-12,
    'R = E^' + x.energy + ' ρ^' + x['mass density'] + ' t^' + x.time);
  /* the strong form: hccBlastRadius must not contain a literal exponent at all */
  const body = cut('function hccBlastRadius', 'const hccBlastSpeed');
  ok('hccBlastRadius spells no exponent of its own, so a wrong null space cannot be papered over',
    !/0\.2|0\.4|1\s*\/\s*5|2\s*\/\s*5/.test(body) && /x\.energy/.test(body)
    && /x\['mass density'\]/.test(body) && /x\.time/.test(body),
    'every exponent fetched from hccBlastExponents(); a literal here would be a second authority for the law');
}

/* 2 ── ξ, which Buckingham cannot give, at two γ and against the wrong closed form */
{ const a = API.hccSedovProfile(1.4), b = API.hccSedovProfile(5 / 3);
  ok('the similarity equations are integrated for ξ, and two independent γ land on the published values',
    Math.abs(a.xi - 1.0328) < 5e-4 && Math.abs(b.xi - 1.1517) < 5e-4,
    'ξ(7/5) = ' + a.xi.toFixed(6) + ' vs 1.0328 · ξ(5/3) = ' + b.xi.toFixed(6) + ' vs 1.1517');
  const approx = g => Math.pow(75 * (g - 1) * (g + 1) * (g + 1) / (16 * Math.PI * (3 * g - 1)), 1 / 5);
  ok('and it is the real constant, not the approximate closed form that is usually quoted for it',
    Math.abs(a.xi - approx(1.4)) > 0.015,
    'the approximation gives ' + approx(1.4).toFixed(4) + ' where the integration gives '
    + a.xi.toFixed(4) + ' — a degraded derivation would still have looked plausible');
  ok('the integration starts ON the Rankine–Hugoniot conditions, so a strong shock in air compresses by exactly six',
    Math.abs(a.shock.G - 6) < 1e-12 && Math.abs(a.shock.U - 2 / 2.4) < 1e-12
    && Math.abs(a.shock.P - 2 / 2.4) < 1e-12 && Math.abs(a.G[0] - 6) < 1e-12,
    'U(1) = P(1) = 0.833333, G(1) = 6 — and six whatever the energy, which is the content of the jump conditions');
}

/* 3 ── the interior diverges and does not reach the answer */
{ const c = API.hccSedovProfile(1.4, 4000, 1e-3), f = API.hccSedovProfile(1.4, 80000, 1e-6);
  const rel = Math.abs(c.xi - f.xi) / f.xi;
  ok('U and P run past 10¹³ as λ → 0 and ξ does not notice, because G → 0 faster still',
    rel < 1e-4,
    'cut 10⁻³ / 4×10³ steps → ' + c.xi.toFixed(7) + ' · cut 10⁻⁶ / 8×10⁴ steps → ' + f.xi.toFixed(7)
    + ' · relative difference ' + rel.toExponential(1) + '; the cut is a convention, the convergence is not');
  ok('and the shipped default is inside that converged region rather than beside it',
    API.HCC_SEDOV.lamMin <= 1e-3 && API.HCC_SEDOV.steps >= 4000,
    'default λ cut ' + API.HCC_SEDOV.lamMin + ' at ' + API.HCC_SEDOV.steps + ' steps');
}

/* 4 ── THE TEST: photographs against a table of units */
{ const T = API.hccTrinitySlope();
  ok('Taylor’s 1945 photographs measure the exponent the atlas derived, never having been told what it should be',
    T.sigma < 2 && T.n === 25,
    'log R vs log t over ' + T.n + ' frames → ' + T.slope.toFixed(4) + ' ± ' + T.stderr.toFixed(4)
    + ' against the derived ' + T.predicted + ' · ' + T.sigma.toFixed(2) + 'σ');
  ok('and the fit is a fit, not a restatement: the data is 25 independent frames spanning 620× in time',
    API.HCC_TRINITY.data.length === 25
    && API.HCC_TRINITY.data[24][0] / API.HCC_TRINITY.data[0][0] > 600,
    '0.10 ms to 62 ms, 11.1 m to 185 m — an exponent cannot hide over three decades');
}

/* 5 ── the window, and the plateau that licenses quoting it */
{ const Y = API.hccTrinityYield(), S = API.hccTrinityStability();
  ok('inverting for the yield gives a drifting number over the whole table, and the drift is reported rather than averaged away',
    Y.all.spread > 15 && Math.abs(Y.all.mean - API.HCC_TRINITY.taylorPublishedKt) < 1.5,
    'whole table ' + Y.all.mean.toFixed(2) + ' ± ' + Y.all.sd.toFixed(2) + ' kt ('
    + Y.all.spread.toFixed(1) + '%), which is Taylor’s own published '
    + API.HCC_TRINITY.taylorPublishedKt + ' and 20% under the declassified '
    + API.HCC_TRINITY.declassifiedKt);
  ok('inside the window where both idealisations hold, the spread falls sixfold',
    Y.n === 12 && Y.spread < 5 && Y.all.spread / Y.spread > 5,
    Y.n + ' points from ' + Y.window.t0 + ' to ' + Y.window.t1 + ' ms → ' + Y.mean.toFixed(2)
    + ' ± ' + Y.sd.toFixed(2) + ' kt (' + Y.spread.toFixed(1) + '%)');
  ok('and the window is a PLATEAU, not a threshold tuned until the answer looked right',
    S.driftPct < 5 && S.trials.length >= 9,
    'swept cut 10→50 and Mach 25→35 — a factor of five and of 1.4 — move the answer from '
    + S.lo.toFixed(2) + ' to ' + S.hi.toFixed(2) + ' kt, ' + S.driftPct.toFixed(2) + '% over '
    + S.trials.length + ' cuts');
  /* the two ends fail for DIFFERENT reasons, which is the claim the comment makes */
  const P = API.hccTrinityPoints(), first = P[0], last = P[P.length - 1];
  ok('the two ends fail for opposite reasons, and the numbers say which',
    first.swept < 2 && first.mach > 100 && last.mach < 5 && last.swept > 1000,
    'first frame: swept ' + first.swept.toFixed(1) + '× the device mass at Mach '
    + first.mach.toFixed(0) + ' — not yet a point source · last frame: Mach '
    + last.mach.toFixed(1) + ' at ' + last.swept.toFixed(0) + '× — no longer a strong shock');
  /* and the criterion that SOUNDED physical and failed, recorded as evidence */
  const machOnly = API.hccTrinityYield(0, 15);
  ok('a Mach cut alone was tried first and made the spread worse, and that refusal is written down',
    machOnly.spread > Y.spread * 3
    && /A Mach cut ALONE, tried first, makes the spread WORSE/.test(src),
    'Mach ≥ 15 alone → ' + machOnly.spread.toFixed(1) + '% against ' + Y.spread.toFixed(1)
    + '% for the two-sided window — a criterion that sounded physical and failed is evidence about the physics');
}

/* 6 ── one law across twenty-two orders of magnitude */
{ const rTNT = API.hccBlastRadius(21 * 4.184e12, 1.25, 1.08e-3, 1.4);
  const rSNR = API.hccBlastRadius(1e44, 2e-21, 350 * 3.156e7, 5 / 3) / 3.086e16;
  ok('the same formula, with nothing changed but two numbers, reaches Trinity and a supernova remnant',
    Math.abs(rTNT - 38.9) / 38.9 < 0.12 && rSNR > 1 && rSNR < 8,
    '21 kt in air at 1.08 ms → ' + rTNT.toFixed(1) + ' m against the photographed 38.9 · 10⁴⁴ J in the ISM at 350 yr → '
    + rSNR.toFixed(2) + ' pc against Cassiopeia A’s measured ≈2.5');
  ok('and the speed is the law differentiated, not a second formula that could disagree with it',
    Math.abs(API.hccBlastSpeed(21 * 4.184e12, 1.25, 1.08e-3, 1.4)
      - API.hccBlastExponents().time * rTNT / 1.08e-3) < 1e-9,
    'Ṙ = (2/5)R/t with the 2/5 fetched from the same null space as the R it differentiates');
}

/* 7 ── the picture is the solution, and the controls move the geometry */
/* ── WHAT THE PICTURE IS REQUIRED TO BE ───────────────────────────────────────
 * Two versions of this drawing were wrong in the same way before the third worked,
 * and the checks here are written against the REASON rather than the code, because
 * the first version of this very check asserted a line of shell-stacking code and
 * went green while the screen showed a solid white ball. A check that passes on a
 * wrong picture is worse than no check: it certifies the error.
 *
 * MEASURED, and this is the number that condemns both earlier versions: half the
 * shocked mass lies outside λ = 0.964. The shell is 3.6% of the radius. A picture
 * that does not show a thin bright shell against a nearly empty middle is not
 * showing the Sedov solution, whatever it is drawing.
 */
{ const half = (() => { const p = API.hccSedovProfile(1.4); let tot = 0, acc = 0;
    for (let k = 0; k < p.lam.length - 1; k++) tot += p.G[k] * (Math.pow(p.lam[k], 3) - Math.pow(p.lam[k + 1], 3));
    for (let k = 0; k < p.lam.length - 1; k++) { acc += p.G[k] * (Math.pow(p.lam[k], 3) - Math.pow(p.lam[k + 1], 3));
      if (acc >= tot / 2) return p.lam[k]; } return 0; })();
  ok('the solution really is a thin shell, which is the fact the drawing has to survive',
    half > 0.94 && half < 0.99,
    'half the shocked mass lies outside λ = ' + half.toFixed(4) + ' — a shell 3.6% of the radius thick');

  ok('so it is drawn by marching the view ray through the profile, not by stacking spheres',
    /BLAST_FRAG/.test(src) && /for\(int i=0;i<128;i\+\+\)\{/.test(src)
    && /vec4 s=texture2D\(uProfile, vec2\(lam,0\.5\)\);/.test(src)
    && /acc\.rgb\+=col\*a\*\(1\.0-acc\.a\);/.test(src)
    && !/new THREE\.SphereGeometry\(BLAST\.radius\*lam/.test(src),
    'a sphere drawn as a surface covers a FILLED DISC whatever its opacity, and any stack of filled discs is a filled disc — there is no arrangement of nested surfaces that looks like a shell');

  ok('the limb brightens because a grazing ray spends longer in the gas, which is the physical reason and not an effect',
    /the limb\s*\n?\s*\*?\s*brightens because a grazing ray spends longer in the dense gas/.test(src)
    || /limb brightening for free and for the right reason/.test(src),
    'path length through the shell is what makes a shell look like a shell');

  ok('opacity is the density and hue is the temperature, both fetched from the integrated profile',
    /data\[i\*4\+0\]=Math\.round\(255\*Math\.min\(1,Math\.max\(0,w\)\)\);/.test(src)
    && /const lam=i\/\(N-1\), q=at\(lam\), w=q\.G\/Gmax;/.test(src)
    && /const t=q\.G>1e-12\?Math\.log\(\(q\.P\/q\.G\)\/Tshock\)\/span:1;/.test(src),
    'nothing in the lookup is a constant chosen to look right — both channels are the solution');

  ok('and the lookup is RGBA, because a three-byte buffer against a four-byte format cost this atlas a black Sun once',
    /const N=BLAST_LUT_N, data=new Uint8Array\(N\*4\);/.test(src)
    && /bytesPerTexel:data\.length\/N/.test(src)
    && /only the buffer length can catch it/.test(src),
    'the constructor substitutes its RGBA default silently, so the format argument can never detect this and only the length can');

  ok('the temperature scale is normalised over the gas rather than over the radius, and says so',
    /if\(prof\.G\[k\]<Gmax\*BLAST\.tempFloor\) break;/.test(src)
    && /The gas that\s*\n\s+is not there cannot be coloured/.test(src),
    'P/G passes 3000 by λ = 0.25, and letting the near-vacuum set the scale squeezed the whole visible shell into one flat orange');

  ok('the shock surface is marked rather than drawn over',
    /for\(let a=0;a<3;a\+\+\) blastWave\.add\(ring\(a\)\);/.test(src)
    && !/wireframe:true, depthWrite:false\}\)\);\n  blastWave\.add\(w\);/.test(src),
    'a 64 × 48 wireframe buried the volume it was annotating — three great circles say where the shock is and cover nothing');
}

ok('the time control moves the drawn wave by the derived exponent rather than only the caption',
  /blastWave\.scale\.setScalar\(Math\.pow\(Math\.max\(1e-4,BLAST\.tFrac\),hccBlastExponents\(\)\.time\)\)/.test(src),
  'a control that moved a number and left the geometry alone is the defect this atlas keeps finding');

/* 8 ── ONE authority for what the Field Lab shows */
{ const body = cut('function fieldWorldApply(', 'function dimSpaceApply()');
  /* the declaration sets it false once; after that exactly one function may write it */
  const all = (src.match(/fieldGroup\.visible\s*=/g) || []).length;
  const decl = /const fieldGroup=new THREE\.Group\(\); fieldGroup\.visible=false;/.test(src) ? 1 : 0;
  const writers = all - decl;
  ok('exactly one function decides which of the three instruments in the Field Lab volume is visible',
    writers === 1 && /blastWave\.visible=blast/.test(body) && /dimSpace\.visible=dims/.test(body)
    && /fieldGroup\.visible=inField&&!blast&&!dims/.test(body)
    && /function dimSpaceApply\(\)\{ fieldWorldApply\(\); \}/.test(src)
    && /function blastApply\(\)\{ fieldWorldApply\(\); \}/.test(src),
    'one writer for fieldGroup.visible besides the declaration (found ' + writers + ') · the precedence is stated rather than emergent');
  /* and the two world switches must HAND OFF rather than decide, which is the bug
     this check actually found: they were setting it flatly to mode==='field' */
  ok('both world switches hand the decision to that one function instead of overruling it',
    /fieldWorldApply\(world\);/.test(src) && /fieldWorldApply\(mode\);/.test(src)
    && !/fieldGroup\.visible = (world|mode)===/.test(src),
    'entering the Field Lab with the blast wave up must not turn the solver lattice back on over it');
  /* a deliberate null must not fall through to state.mode — the fractal tiles pass one */
  ok('an explicit null world means no field, rather than falling back to whatever mode was last set',
    /modeNow===undefined\?state\.mode:modeNow/.test(body)
    && !/\(modeNow\|\|state\.mode\)/.test(body),
    'the fractal tiles pass null for world; || would have swallowed it and shown the lattice inside a fractal');
  ok('and the fact that it was four writers, not the two that were noticed, is written down',
    /IT WAS FOUR, AND THE CHECK FOUND THREE OF THEM/.test(src)
    && /A claim of single authority is worth precisely as much as the grep that tests it/.test(src),
    'a fix with no record of what it fixed teaches nobody which mistake to avoid next time');
}

/* 9 ── the theorem's limit still stated, now that it has been USED */
ok('using a dimensionless group as a law does not quietly promote every other group to one',
  /Buckingham fixes the shape of the law\s*\n\s+\* and says nothing about the constant in front/.test(
    '* ' + src) || /Buckingham fixes the shape of the law/.test(src),
  'the shape is necessary; the constant is not given; and the other twenty-eight directions are still only directions');

console.log(`\n  ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
