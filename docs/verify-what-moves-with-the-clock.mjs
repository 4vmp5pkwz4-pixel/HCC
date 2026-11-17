/* WHAT MOVES WITH THE CLOCK (v4.433) — a reader ran the time machine flat out at the scale of the whole universe and saw the
   quasars and superstructures stand still.
     1. measured (docs/data/what-moves-v4.433.json): the Horizons quasar sphere now follows the clock's light cone as the Sun →
        Cosmos one does, with the same counts; and the proper-distance view draws the scene at exactly a(t) of the clock;
     2. standing still is right in comoving units: a peculiar velocity of 300 km/s for ten billion years is 3.07 Mpc, against the
        comoving distances of the quasars computed here in the clock's own cosmology;
     3. the «two cones» are the catalogue's footprint: the quasars' Galactic latitudes against an isotropic sky;
     4. the changes are in the page.
   NOT claimed: any quasar's activity at another epoch (a stated window), or any motion of a structure beyond linear estimates. */
import fs from 'node:fs'; import path from 'node:path';
const ROOT = path.join(path.dirname(new URL(import.meta.url).pathname), '..');
const src = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
let pass = 0, fail = 0;
const check = (ok, claim, nums) => { if (ok) pass++; else fail++; console.log(`${ok ? 'PASS' : 'FAIL'} — ${claim} :: ${nums}`); };
const grab = (a, b) => { const i = src.indexOf(a), j = src.indexOf(b, i); if (i < 0 || j < 0) throw new Error('not found: ' + a); return src.slice(i, j); };
const L = new Function(`${grab('const HCC_S3R=Object.freeze({', "\n});")}\n});\n${grab('const CT_COSMO=(()=>{', '\nconst ctE=')}\n${grab('let HZ_TAB=null;', 'function hzScreenAt(')}\nreturn {hzAgeAtA,hzAtT};`)();
const A = JSON.parse(fs.readFileSync(path.join(ROOT, 'docs/data/what-moves-v4.433.json'), 'utf8')), R = A.rows, t0 = L.hzAgeAtA(1);

{ const off = R.filter(r => !r.proper), at = y => off.find(r => r.yrs === y), lums = new Set(off.map(r => r.lum));
  const ok = A.errors === 0 && at(0).horizons.seen === 5959 && at(-1.3e10).horizons.seen === 4922 && at(-1.37e10).horizons.seen === 234 && at(1e10).horizons.active === 0 && lums.size === off.length && at(1e11).lum < 1e-3 * at(0).lum;
  check(ok, 'the Horizons quasar sphere follows the clock: at every epoch tried the light drawn is different, today all 5 959 are seen, 707 million years after the Big Bang 4 922 (the rest beyond that observer’s particle horizon), 7 million years after it 234, and ten billion years on all are seen but none still shining — the same counts as the Sun → Cosmos sphere, from the same function',
    off.map(r => `${r.yrs.toExponential(1)} yr: seen ${r.horizons.seen}, Σlum ${r.lum}`).join(' · ')); }

{ const on = R.filter(r => r.proper); let worst = 0; for (const r of on) { const a = L.hzAtT(t0 + r.horizons.dtYears / 1e9).a;   /* the clock as the pass read it (it ran a little after being set) */ worst = Math.max(worst, Math.abs(r.scale - a) / a); }
  check(on.length === 6 && worst < 1e-9 && on.some(r => r.scale < 0.01) && on.some(r => r.scale > 100), 'proper distances: with the switch on, the whole Horizons scene is drawn at the scale factor of the clock’s moment, a(t) from the clock itself — 0.006 seven million years after the Big Bang, 0.12 at 707 Myr, 1 today, 1.89 ten billion years on and 364 at a hundred billion — so the universe is seen to grow as the clock runs',
    `${on.map(r => `${r.yrs.toExponential(1)} yr: ×${r.scale.toPrecision(4)}`).join(' · ')} · worst against a(t) ${worst.toExponential(1)}`); }

{ const kpcPerGyrPerKms = 977.792 / 956.06 /* = 1.02271 kpc/Gyr per km/s, from 1 km/s · 1 Gyr */, d = 300 * 10 * 1.0227121650537077 / 1000;
  const chi = z => (L.hzAtT(t0).particle - L.hzAtT(L.hzAgeAtA(1 / (1 + z))).particle) / 3.2615637771674333e-3;   /* Gly → Mpc */
  const near = chi(0.3), med = chi(1);
  check(Math.abs(d - 3.068) < 0.001 && d / med < 0.001 && d / near < 0.003, 'standing still is right in the units the scene is drawn in: in comoving coordinates the expansion is carried by the coordinates themselves, and what remains is each object’s own motion — 300 km/s for ten billion years is 3.07 Mpc, a thousandth of the comoving distance of a quasar at z = 1 and a third of a percent at z = 0.3, below a pixel at the scale of the whole sphere',
    `300 km/s × 10 Gyr = ${d.toFixed(3)} Mpc · χ(z = 0.3) = ${near.toFixed(0)} Mpc · χ(z = 1) = ${med.toFixed(0)} Mpc · ratio ${(d / med).toExponential(2)}`); }

{ const F = A.footprint;
  check(F.n === 5959 && F.below20 < 0.05 && F.isotropic20 > 0.34 && F.below10 < 0.01 && F.north > 0.6, 'the «two cones» are where the surveys looked, not a structure of the universe: of the 5 959 catalogue quasars 2.2 % lie within 20° of the Galactic plane where an isotropic sky would put 34 %, 0.2 % within 10° (17 % expected), and two thirds lie in the northern Galactic hemisphere — the Milky Way’s disc hides the rest, and the compilations were taken toward the caps',
    `|b| < 20°: ${(100 * F.below20).toFixed(1)} % (isotropic ${(100 * F.isotropic20).toFixed(1)} %) · |b| < 10°: ${(100 * F.below10).toFixed(2)} % (${(100 * F.isotropic10).toFixed(1)} %) · north ${(100 * F.north).toFixed(1)} %`); }

{ const need = ['function qsoClockApply(pts,zOf,S){', "qsoClockApply(OBS_CATALOGUE.q,k=>QSO3D.rows[k][3],QSO_CLOCK.obs);", "const hP=state.obsProper===true?hzAtT(hzNowGyr()):null", '<input type="checkbox" id="obsProper"', 'globalThis.HCC_PROPER=Object.freeze({', 'function qsoFootprint(){', "{id:'qsoHorizons433', kind:'revises'"];
  const miss = need.filter(s => !src.includes(s));
  check(!miss.length, 'the changes are in the page: one light-cone pass for both quasar spheres, the proper-distance switch in the Horizons controls with its agent handle and its line in the caption, and the footprint statistic',
    miss.length ? 'missing ' + miss.map(x => x.slice(0, 40)).join(' | ') : `${need.length} source pins present`); }

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
