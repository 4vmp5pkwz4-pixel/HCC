#!/usr/bin/env node
'use strict';
/* ══ THE ZODIAC HAS DEPTH ════════════════════════════════════════════════════════
 *
 * Every zodiac figure in this atlas used to sit on a sphere 600 AU across, which
 * put Denebola (11 pc) and Al Jabhah (389 pc) at the same distance, and the sphere
 * was hidden past 1200 AU — so the zodiac vanished exactly when a reader left the
 * Solar System to look at it. Now 528 stars stand at their measured distances and
 * move with the clock. This file checks the claims that make that true, by
 * COMPUTING them from what the atlas embeds rather than by reading its prose:
 *
 *   1. the embedded catalogue IS data/zodiac-3d.json, field for field
 *   2. the space-motion kernel, sliced out of index.html and run here, reproduces
 *      the ERFA C library (pyerfa 2.0.1.5) at 370 star/epoch pairs from −100 000 to
 *      +12 000 — including the five pairs that were 25 mas off before the
 *      transverse-Doppler limit was fixed
 *   3. the quality classes follow from the fields by the rule the source states
 *   4. no star is placed at a distance its parallax cannot support (μ Sgr)
 *   5. EVERY figure is deeper than it is wide, with the numbers the source quotes
 *   6. the structural fixes: the flat zodiac is gone from the sphere, the layer is
 *      updated at every scale, and the 1000-light-year Sun marker that buried it is
 *      bounded by angle
 */
const fs = require('node:fs'), path = require('node:path');
const ROOT = path.join(__dirname, '..');
const src = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const DATA = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'zodiac-3d.json'), 'utf8'));
let pass = 0, fail = 0;
const ok = (n, c, d) => { if (c) { pass++; console.log('  PASS — ' + n + (d ? ' :: ' + d : '')); }
  else { fail++; console.log('  FAIL — ' + n + (d ? ' :: ' + d : '')); } };

/* ── the embedded table and the kernel, taken from the atlas itself ── */
const between = (a, b) => { const i = src.indexOf(a); const j = src.indexOf(b, i); return i < 0 || j < 0 ? '' : src.slice(i, j); };
const FIELDS = JSON.parse(between('const ZOD3D_FIELDS=', ';\n').replace('const ZOD3D_FIELDS=', ''));
const rowsTxt = between('const ZOD3D_STARS=[', '];\nconst ZOD3D_FIGURES=').replace('const ZOD3D_STARS=[', '');
const ROWS = JSON.parse('[' + rowsTxt + ']');
const FIG = JSON.parse(between('const ZOD3D_FIGURES=', ';\n').replace('const ZOD3D_FIGURES=', ''));
const STARS = ROWS.map(r => Object.fromEntries(FIELDS.map((f, k) => [f, r[k]])));
const kernelTxt = between('const Z3_DAU=', 'const ZOD3D_ZODIAC=');
const K = new Function(kernelTxt + '\nreturn {z3Starpm, z3Starpv, z3Pvstar};')();
const open = s => !!s.spanLo && s.spanHi === null;
const placedPlx = s => { if (!(s.plx > 0) || s.q === 'D') return null; return open(s) ? 1000 / s.spanLo : s.plx; };
const PC_AU = 648000 / Math.PI;

{ /* 1. THE EMBEDDED CATALOGUE IS THE FILE */
  const SRC = { 'Gaia DR3': 1, 'Hipparcos (ESA 1997)': 2, 'SIMBAD 2018 compilation': 3, 'SIMBAD 2018': 3, none: 0 };
  let bad = 0; const where = [];
  DATA.stars.forEach((d, i) => {
    const e = STARS[i]; if (!e) { bad++; return; }
    const same = e.hip === d.hip && e.con === d.con && e.V === d.V && e.ra === d.ra && e.de === d.de
      && e.pmra === d.pmra && e.pmde === d.pmde && e.plx === d.plx && e.ep === d.ep && e.rv === d.rv
      && e.q === d.q && e.src === SRC[d.src] && e.otherPlx === d.otherPlx
      && e.spanLo === (d.span ? d.span.lo : null) && e.spanHi === (d.span ? d.span.hi : null) && e.fig === (d.fig ? 1 : 0);
    if (!same) { bad++; if (where.length < 3) where.push(d.name || d.hip); }
  });
  ok('the catalogue embedded in the atlas is data/zodiac-3d.json, star for star and field for field — the golden values below were computed from exactly these numbers',
    STARS.length === DATA.stars.length && STARS.length === 528 && bad === 0,
    `${STARS.length} embedded, ${DATA.stars.length} in the file, ${bad} differing` + (where.length ? ' · e.g. ' + where.join(', ') : ''));
  ok('and the figures embedded are the thirteen the ecliptic crosses, with every figure star present in the catalogue',
    Object.keys(FIG).length === 13 && Object.values(FIG).flat(2).every(h => STARS.some(s => s.hip === h)),
    `${Object.values(FIG).flat(2).length} figure-star references across ${Object.keys(FIG).join(' ')}`);
}

{ /* 2. THE KERNEL IS ERFA */
  let worst = 0, worstRv0 = 0, n = 0, nRv0 = 0;
  for (const g of DATA.golden) {
    const s = STARS[g.i], de = s.de * Math.PI / 180;
    const r = K.z3Starpm(s.ra * Math.PI / 180, de, (s.pmra / 3.6e6) * Math.PI / 180 / Math.cos(de),
      (s.pmde / 3.6e6) * Math.PI / 180, s.plx / 1000, s.rv || 0, s.ep, g.epoch);
    let dra = Math.abs(r.ra - g.ra); if (dra > Math.PI) dra = 2 * Math.PI - dra;
    const e = Math.max(dra * Math.cos(g.de), Math.abs(r.dec - g.de)) * 206264806.247;   /* mas */
    worst = Math.max(worst, e); n++;
    if (s.rv == null && Math.abs(g.epoch - s.ep) > 50000) { worstRv0 = Math.max(worstRv0, e); nRv0++; }
  }
  ok('the space-motion kernel, run here straight out of index.html, reproduces the ERFA C library at every golden pair, from 100 000 years ago to 12 000 AD',
    n === DATA.golden.length && n >= 300 && worst < 1e-5, `${n} pairs · worst angular difference ${worst.toExponential(2)} mas`);
  ok('INCLUDING the stars with no measured radial velocity over a hundred thousand years — the pairs that were 25 mas off while ERFA\'s β_r ≠ 0 guard dropped the transverse Doppler term at an exact zero',
    nRv0 >= 3 && worstRv0 < 1e-5 && /const vr=d\*vsr\+del\*Z3_DC;/.test(src) && !/const wr=betsr!==0\?d\+del\/betsr:1;/.test(src),
    `${nRv0} such pairs · worst ${worstRv0.toExponential(2)} mas · the continuous form (d·v_sr + δ·c)·x̂ is in the source`);
  const sp = K.z3Starpv(1.0, 0.3, 1e-6, 1e-6, 0.01, 10), back = K.z3Pvstar(sp.pv);
  ok('and eraStarpv and eraPvstar are inverses of each other, which is the property the whole light-time solution rests on',
    Math.abs(back.ra - 1.0) < 1e-12 && Math.abs(back.dec - 0.3) < 1e-12 && Math.abs(back.px - 0.01) / 0.01 < 1e-12 && Math.abs(back.rv - 10) < 1e-9,
    `round trip ra ${Math.abs(back.ra - 1).toExponential(1)} · ϖ ${(Math.abs(back.px - 0.01) / 0.01).toExponential(1)} · v_r ${Math.abs(back.rv - 10).toExponential(1)} km/s`);
}

{ /* 3. THE QUALITY CLASSES FOLLOW FROM THE FIELDS */
  const wrong = [];
  for (const s of STARS) {
    const dis = s.otherPlx ? Math.abs(s.plx - s.otherPlx) / Math.max(s.plx, s.otherPlx) : null;
    const hipEra = s.src === 2 || s.src === 3;
    const want = !(s.plx > 0) || s.src === 0 ? 'D' : (hipEra && s.plx < 1.0) ? 'C' : (dis != null && dis > 0.30) ? 'C'
      : (dis != null && dis <= 0.10) ? 'A' : 'B';
    if (want !== s.q) wrong.push(`${s.name || s.hip}: ${s.q}≠${want}`);
  }
  const Q = STARS.reduce((m, s) => (m[s.q] = (m[s.q] || 0) + 1, m), {});
  ok('every star\'s distance class follows from its own fields by the stated rule: A within 10 % of the other catalogue, C beyond 30 % or under the 1 mas floor, D with no parallax',
    wrong.length === 0 && Q.A === 178 && Q.B === 327 && Q.C === 10 && Q.D === 13,
    wrong.length ? wrong.slice(0, 4).join('; ') : `A ${Q.A} · B ${Q.B} · C ${Q.C} · D ${Q.D}`);
  const cross = STARS.filter(s => s.otherPlx).map(s => Math.abs(s.plx - s.otherPlx) / Math.max(s.plx, s.otherPlx)).sort((a, b) => a - b);
  const med = cross[Math.floor(cross.length / 2)];
  ok('the distance error bar is MEASURED, not assumed: 228 stars carry both independent parallaxes, and the median disagreement is the 3.9 per cent the source quotes',
    cross.length === 228 && Math.abs(med - 0.039) < 0.002 && /Median 3\.9 per\s*\n?\s*cent/.test(src),
    `${cross.length} cross-checked · median ${(100 * med).toFixed(2)} % · 90th ${(100 * cross[Math.floor(cross.length * 0.9)]).toFixed(1)} %`);
}

{ /* 4. NOTHING IS PLACED WHERE ITS PARALLAX CANNOT PUT IT */
  const mu = STARS.find(s => s.bayer === 'μ' && s.con === 'Sgr');
  ok('μ Sgr, whose 0.09 mas Hipparcos parallax would put it at 11 kpc beyond the Galactic Centre, is placed at its lower bound of 917 pc and flagged as a lower bound',
    !!mu && mu.plx < 0.1 && open(mu) && Math.abs(1000 / placedPlx(mu) - 917.43) < 0.1 && mu.q === 'C',
    mu ? `1/ϖ would be ${(1000 / mu.plx).toFixed(0)} pc · placed at ${(1000 / placedPlx(mu)).toFixed(1)} pc` : 'NOT FOUND');
  const D = STARS.filter(s => s.q === 'D');
  ok('and the thirteen stars no source measures are not given a distance at all — they stay on the directional sky, which is all that is known of them',
    D.length === 13 && D.every(s => placedPlx(s) == null) && /THE STARS NO SOURCE PUTS AT ANY DISTANCE stay where the only thing known about them/.test(src),
    D.map(s => s.name || (s.bayer ? s.bayer + ' ' + s.con : 'HIP ' + s.hip)).slice(0, 6).join(', ') + ' …');
  ok('and "only a lower bound" is an OPEN span, never confused with a star that simply has one source — Leo places 46 of its 48 stars, not the 21 the first form counted',
    STARS.filter(s => s.con === 'Leo' && placedPlx(s) != null && !open(s)).length === 46
    && /const zod3dOpen=s=>!!s\.spanLo&&s\.spanHi===null;/.test(src) && !/zod3dPlacedPlx\(z\)!=null&&z\.spanHi!==null/.test(src),
    `Leo: ${STARS.filter(s => s.con === 'Leo').length} in the boundary, ${STARS.filter(s => s.con === 'Leo' && placedPlx(s) != null && !open(s)).length} placed`);
}

{ /* 5. EVERY FIGURE IS DEEPER THAN IT IS WIDE */
  const depth = con => {
    const hips = new Set((FIG[con] || []).flat()); const P = [];
    for (const s of STARS) { if (s.con !== con || !hips.has(s.hip) || open(s) || placedPlx(s) == null) continue;
      const de = s.de * Math.PI / 180;
      const r = K.z3Starpm(s.ra * Math.PI / 180, de, (s.pmra / 3.6e6) * Math.PI / 180 / Math.cos(de), (s.pmde / 3.6e6) * Math.PI / 180,
        placedPlx(s) / 1000, s.rv || 0, s.ep, 2000);
      P.push({ p: r.positionAU, d: 1 / r.px }); }
    const c = [0, 1, 2].map(k => P.reduce((t, q) => t + q.p[k], 0) / P.length), cl = Math.hypot(...c), u = c.map(x => x / cl);
    let tr = 0; for (const q of P) { const a = q.p[0] * u[0] + q.p[1] * u[1] + q.p[2] * u[2];
      tr = Math.max(tr, Math.hypot(q.p[0] - a * u[0], q.p[1] - a * u[1], q.p[2] - a * u[2])); }
    const ds = P.map(q => q.d); return { lo: Math.min(...ds), hi: Math.max(...ds), ratio: (Math.max(...ds) - Math.min(...ds)) / (2 * tr / PC_AU) };
  };
  const R = {}; for (const c of Object.keys(FIG)) R[c] = depth(c);
  const vals = Object.values(R).map(x => x.ratio);
  ok('EVERY one of the thirteen figures is deeper than it is wide — the spread along the line of sight exceeds the spread across it — which is the measurement that says the sphere was wrong',
    vals.length === 13 && vals.every(v => v > 1),
    Object.entries(R).map(([c, x]) => `${c} ${x.ratio.toFixed(1)}`).join(' · '));
  ok('and the numbers the source quotes are the numbers this computes: Virgo 1.5 at the low end, Leo 10.7 at the high end, Leo from 11 to 389 pc and Scorpius out to 1.7 kpc',
    Math.abs(R.Vir.ratio - 1.5) < 0.05 && Math.abs(R.Leo.ratio - 10.7) < 0.05 && Math.round(R.Leo.lo) === 11 && Math.round(R.Leo.hi) === 389
    && Math.abs(R.Sco.hi - 1708) < 2 && /from 1\.5 \(Virgo\) to 10\.7 \(Leo\)/.test(src),
    `Vir ${R.Vir.ratio.toFixed(2)} · Leo ${R.Leo.ratio.toFixed(2)} (${R.Leo.lo.toFixed(1)}–${R.Leo.hi.toFixed(1)} pc) · Sco to ${R.Sco.hi.toFixed(0)} pc`);
}

{ /* 6. THE STRUCTURAL FIXES */
  ok('the flat sphere no longer draws the zodiac: both of its construction loops skip the zodiac constellations, so nothing is drawn twice at two distances',
    (src.match(/if\(con\.z\) return;/g) || []).length >= 2 && /THE ZODIAC IS NO LONGER DRAWN HERE/.test(src),
    'stars, names, figure lines and selections of the twelve are built by the 3D layer only');
  ok('the layer is updated from the unconditional part of the solar frame, not the local-scale branch, so it is there from inside the planets to across the Galaxy',
    /const localScale = \(state\.solarScaleLayer\|\|'local'\)==='local';[\s\S]{0,3000}try\{ updateZodiac3d\(dt\); \}/.test(src)
    && /skyGroup\.visible = localScale && camDist < 1200;[\s\S]{0,400}updateZodiac3d\(dt\)/.test(src),
    'placed next to the line that hides the 600 AU sphere, which is the line that used to hide the zodiac');
  ok('and the thousand-light-year Sun marker on the spiral arms is bounded by ANGLE — from 905 pc it was 307 pc in radius and every zodiac star nearer than that was inside an opaque ball',
    /mwSunDot\.scale\.setScalar\(Math\.max\(1e-9,Math\.min\(1,0\.006\*ds\/\(1000\*LY_AU\)\)\)\)/.test(src),
    'never more than 0.34° in radius, and never larger than the 1000 ly the galactic views were built for');
  ok('the lines of sight appear only once the camera leaves the Solar System, because seen from 50 AU off the Sun they are a fan across the middle of the planets',
    /A LINE OF SIGHT IS ONLY INFORMATIVE FROM OFF THE LINE/.test(src) && /Math\.log10\(Math\.max\(dSun,1\)\/1\.03e5\)/.test(src),
    'zero inside 0.5 pc, full by 5 pc');
  ok('the journeys out and back are PACED goals, which survive the scale hand-offs — the first form set the camera directly and the governor pulled it back to 0.011 pc',
    /camera\.position\.copy\(to\); hccCameraGoal\(to\.length\(\),84\);/.test(src) && /hccCameraGoal\(L,84\)/.test(src),
    'see the depth · back to the Sun · one figure from the side');
  ok('brightness is computed from WHERE THE CAMERA IS: each star carries its absolute magnitude and the shader sizes it by the magnitude seen from there, which is the catalogue V exactly from the Sun',
    /absM\[k\]=s\.V\+5\+5\*Math\.log10\(plx\/1000\);/.test(src) && /m=aMag\+5\.0\*log\(dPc\/10\.0\)\/log\(10\.0\);/.test(src)
    && /const mat=hccStarMaterial\(\{abs:true\}\);/.test(src),
    'M = V + 5 + 5 log ϖ″ and m = M + 5 log(d/10 pc)');
  ok('and the layer can be asked: a diagnostics handle for scripts and an instrument whose outputs include the depth-to-width ratio and the tide error of linear motion',
    /globalThis\.HCC_ZODIAC3D=Object\.freeze\(\{/.test(src) && /id:'zod3d', world:'solar', lab:'zod3d',/.test(src)
    && /name:'depth_to_width'/.test(src) && /name:'tide_error'/.test(src) && /name:'star_distance_is_lower_bound'/.test(src),
    'HCC_ZODIAC3D.{stars,placed,state,depth,sideView,view,occluders} and HCC_API.evaluate("zod3d", …)');
}

console.log('\n  ' + pass + ' passed, ' + fail + ' failed');
process.exit(fail ? 1 : 0);
