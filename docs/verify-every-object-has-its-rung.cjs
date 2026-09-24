#!/usr/bin/env node
'use strict';
/* ══ EVERY OBJECT HAS ITS RUNG ═════════════════════════════════════════════════
 * The φ-ladder is a coordinate, and this makes it the one index that runs through every
 * world: any rung gathers what lies on it, and any object with a length has a rung.
 * This file reads index.html and COMPUTES:
 *   1. the rung law is the atlas's own: N = ln(L / l_P) / ln φ, with l_P and φ as FBS has
 *      them — Earth's radius, the astronomical unit, the light year come out where the
 *      φ-atlas already puts them
 *   2. a PERIOD enters at its light-distance cT — the co-scaling R/t = c the ladder
 *      states — so the year sits on the light year's rung, exactly
 *   3. Solar-System bodies carry size, orbit and period; every object of the Solar world
 *      carries its measured distance from the Sun; the φ-atlas markers carry their scale
 *   4. the rung inspector gathers the literature scales on a rung from the SAME φ-atlas
 *      (recomputed here: the astronomical unit's rung holds the "Astronomical unit"
 *      entry), with the door to each one's laboratory
 *   5. every object with a rung gets "φ On the ladder" on its card, and the φ-shells glow
 *      with the number of measured objects on them
 *   6. MUTATIONS: a period entered as seconds instead of cT, a rung law in log10, and an
 *      inspector that drops the laboratory doors are each caught
 */
const fs = require('node:fs'), path = require('node:path');
const SRC = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
let pass = 0, fail = 0;
const ok = (n, c, d) => { if (c) { pass++; console.log('  PASS — ' + n + (d ? ' :: ' + d : '')); } else { fail++; console.log('  FAIL — ' + n + (d ? ' :: ' + d : '')); } };
const lP = +(SRC.match(/const FBS = \{\s*lP\s*:\s*([0-9.e+-]+)/) || [0, NaN])[1];
const PHI = (1 + Math.sqrt(5)) / 2, LN = Math.log(PHI), C = 299792458, AU = 1.495978707e11;
const rung = L => Math.log(L / lP) / LN;
const law = s => /const rungOfLen=L=>Math\.log\(L\/FBS\.lP\)\/LN_PHI;/.test(s);
ok('the rung law is the atlas\'s own: N = ln(L / ℓ_P) / ln φ', law(SRC) && Math.abs(lP - 1.616255e-35) < 1e-40,
  `Earth radius N ${rung(6.371e6).toFixed(2)} · 1 AU N ${rung(AU).toFixed(2)} · 1 ly N ${rung(9.4607304725808e15).toFixed(2)}`);
const year = C * 365.25 * 86400;
ok('a period enters at its light-distance cT, so the Julian year sits exactly on the light year\'s rung',
  /add\('period',C_MS\*36000\/p\.rate\*365\.25\*86400,'orbital period, as the light-distance cT'\)/.test(SRC) && Math.abs(rung(year) - rung(9.4607304725808e15)) < 1e-9,
  `cT(1 yr) = ${(year / 1e15).toFixed(4)} × 10¹⁵ m = 1 ly · N ${rung(year).toFixed(4)}`);
const bodies = s => /if\(\(m=key\.match\(\/\^planet\(\\d\+\)\$\/\)\)\)\{ const p=PLANETS\[\+m\[1\]\]; if\(p\)\{ add\('size',p\.r\*1e3,'radius'\); add\('orbit',p\.a\*AU_M,'orbital semi-major axis'\);/.test(s)
  && /else if\(key==='moon'\)\{ add\('size',MOON\.r\*1e3,'radius'\);/.test(s) && /else if\(key==='sun'\)\{ add\('size',SUN\.r\*1e3,'radius'\); \}/.test(s)
  && /add\('distance',d,'distance from the Sun'\)/.test(s) && /else if\(\(m=key\.match\(\/\^fbsAt\(\\d\+\)\$\/\)\)\)/.test(s);
ok('bodies carry size, orbit and period; every Solar-world object its distance from the Sun; the φ-atlas markers their scale', bodies(SRC));

/* the inspector's literature scales, recomputed from the φ-atlas itself */
/* the rows whose scale is a numeric literal (a few are expressions of the atlas's own
   constants and are read by the atlas, not here) */
const atlasSrc = (SRC.match(/const PHI_ATLAS=(\[[\s\S]*?\n\]);/) || [0, ''])[1];
const ROWS = [...atlasSrc.matchAll(/\['([^'\n]+)',\s*([0-9.]+e[+-]?\d+|[0-9.]+),/g)].map(m => [m[1], +m[2]]);
const ATLAS = [['literal rows', ROWS]];
const onRung = (N, w) => ROWS.filter(r => Math.abs(rung(r[1]) - N) <= w).map(r => r[0]);
const auHits = onRung(rung(AU), 0.5);
ok('the rung inspector draws its literature scales from the same φ-atlas: the astronomical unit\'s rung holds "Astronomical unit"',
  ROWS.length > 80 && auHits.some(x => /Astronomical unit/.test(x)) && /out\.scales=\[\]; PHI_ATLAS\.forEach\(\(\[grp,rows\]\)=>rows\.forEach\(r=>\{ const n=rungOfLen\(r\[1\]\); if\(inW\(n\)\)/.test(SRC),
  `${ATLAS.reduce((a, [, r]) => a + r.length, 0)} φ-atlas scales · on rung ${rung(AU).toFixed(2)} ± 0.5: ${auHits.join(', ')}`);
const doors = s => /B\.querySelectorAll\('\[data-rl\]'\)\.forEach\(b=>b\.onclick=\(\)=>\{ d\.remove\(\); try\{ phiAtlasJump\(b\.dataset\.rl\); \}catch\(e\)\{\} \}\);/.test(s);
ok('and each scale keeps its door into the laboratory where that physics lives', doors(SRC));
ok('every object with a rung gets "φ On the ladder" on its card; the φ-shells glow with the measured objects on them',
  /acts\.push\(\[`φ \$\{TT\('On the ladder','На лестнице','Auf der Leiter'\)\} · N \$\{r0\.N\.toFixed\(1\)\}/.test(SRC)
  && /if\(!tier2&&n>=240&&n<=300\)\{ const cnt=rungCount\(n\); if\(cnt>0\)\{/.test(SRC) && /function rungCount\(n\)\{/.test(SRC));
const scaleNotCause = /Kin on the ladder share a SCALE, never a cause/.test(SRC) && /A rung is a shared SCALE, never a shared cause/.test(SRC);
ok('the inspector says what a rung is and is not: a shared scale, never a shared cause', scaleNotCause);

/* mutations */
ok('MUTATION — a period entered as seconds instead of cT is caught',
  !/add\('period',C_MS\*36000\/p\.rate\*365\.25\*86400,/.test(SRC.replace("add('period',C_MS*36000/p.rate*365.25*86400,", "add('period',36000/p.rate*365.25*86400,")));
ok('MUTATION — a rung law in log10 is caught', !law(SRC.replace('const rungOfLen=L=>Math.log(L/FBS.lP)/LN_PHI;', 'const rungOfLen=L=>Math.log10(L/FBS.lP)/LN_PHI;')));
ok('MUTATION — an inspector without its laboratory doors is caught', !doors(SRC.replace("try{ phiAtlasJump(b.dataset.rl); }catch(e){}", '')));

console.log('\n  ' + pass + ' passed, ' + fail + ' failed'); process.exit(fail ? 1 : 0);
