#!/usr/bin/env node
'use strict';
/* ══ EVERY PLANET WAS ONE FLAT COLOUR ══════════════════════════════════════════
 *
 * MeshStandardMaterial with a single hex colour and nothing else. Earth was a blue
 * ball, Venus a beige one, Mars an orange one, and not one of them carried the
 * shell of air that is the reason any of those colours is what it is.
 *
 * THE SCALE HEIGHT IS NOT TYPED IN. Hydrostatic balance against the ideal gas law
 * gives H = RT/(μg) directly, so the file carries T, μ and g — each published per
 * body — and derives the fourth. The published heights below are the authority
 * outside this repository, and the derivation was not fitted to them.
 *
 * THE COLOUR IS ONE LINE: σ ∝ λ⁻⁴. Against the sRGB primaries that is
 * 0.428 : 1.000 : 2.441, so blue scatters 5.705 times as hard as red — exactly
 * (680/440)⁴ — and that single ratio is why a daytime sky is blue and a sunset red.
 *
 * WHAT IS DRAWN IS EXAGGERATED AND THE FACTOR IS REPORTED. Eight scale heights of
 * Earth's air is one per cent of its radius, and of Jupiter's three tenths of one
 * per cent; at true thickness there would be nothing on the screen. The drawn
 * thickness is a compressive but strictly monotone function of the true ratio, so
 * the ORDER between planets survives what the magnitude cannot.
 *
 * AND WHERE THERE IS NO AIR, NOTHING IS DRAWN. A body with no shell and a body
 * nobody got round to are indistinguishable on a screen, so the refusals are
 * written down with their reasons.
 */
const fs = require('node:fs'), path = require('node:path');
const ROOT = path.join(__dirname, '..');
const src = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
let pass = 0, fail = 0;
const ok = (n, c, d) => { if (c) { pass++; console.log('  PASS — ' + n + (d ? ' :: ' + d : '')); }
  else { fail++; console.log('  FAIL — ' + n + (d ? ' :: EXPECTED ' + d : '')); } };

/* the table is cut out of the page, so a change there reaches this check */
/* cut to the next named field rather than to the first `}),` — the tint arrays and
   the per-body braces make that punctuation appear early, and a slice pinned to
   punctuation is the same defect this repository has filed five times */
const tbl = (() => { const i = src.indexOf('bodies:Object.freeze({');
  return i < 0 ? null : src.slice(i, src.indexOf('refused:Object.freeze({', i)); })();
ok('the three published quantities per body are in the page, and the scale height is not',
  !!tbl && /Earth:\s*\{T:288, mu:28\.97, g:9\.807/.test(tbl)
  && !/H:\s*8\.[45]/.test(tbl) && /function hccScaleHeightKm\(name\)\{/.test(src),
  'T, mu and g are published inputs; H is the output of RT/(mu g) and appears nowhere as a constant');

const R = 8.314462618;
const BODY = {};
for (const m of tbl.matchAll(/(\w+):\s*\{T:([\d.]+),\s*mu:([\d.]+),\s*g:([\d.]+)/g))
  BODY[m[1]] = { T: +m[2], mu: +m[3], g: +m[4] };
const H = n => R * BODY[n].T / (BODY[n].mu * 1e-3 * BODY[n].g) / 1000;

/* published isothermal scale heights — the authority outside this repository */
const PUB = { Venus: 15.9, Earth: 8.5, Mars: 11.1, Jupiter: 27, Saturn: 59.5, Uranus: 27.7, Neptune: 19.7 };
const rows = Object.keys(PUB).map(n => ({ n, H: H(n), pub: PUB[n], d: Math.abs(H(n) / PUB[n] - 1) }));
ok('every derived scale height lands on the published one, within what an isothermal model deserves',
  Object.keys(BODY).length === 7 && rows.every(r => r.d < 0.15),
  rows.map(r => `${r.n} ${r.H.toFixed(1)}/${r.pub}`).join(' · ')
  + ` · worst ${(100 * Math.max(...rows.map(r => r.d))).toFixed(0)}%`);

ok('and the ones that should be tightest are, because their atmospheres are closest to isothermal',
  rows.find(r => r.n === 'Venus').d < 0.01 && rows.find(r => r.n === 'Earth').d < 0.02
  && rows.find(r => r.n === 'Titan' || r.n === 'Mars').d < 0.03,
  'Venus is a deep well-mixed CO₂ column and comes out to three figures; the giants are where one temperature describes least');

/* ── the colour ────────────────────────────────────────────────────────────── */
const lam = [680, 550, 440], beta = lam.map(l => Math.pow(550 / l, 4));
ok('Rayleigh is computed from the wavelengths rather than entered as a colour',
  /const lam=\[680,550,440\], b=lam\.map\(l=>Math\.pow\(550\/l,4\)\)/.test(src)
  && Math.abs(beta[2] / beta[0] - Math.pow(680 / 440, 4)) < 1e-12,
  `σ ∝ λ⁻⁴ → ${beta.map(v => v.toFixed(3)).join(' : ')} · blue over red ${(beta[2] / beta[0]).toFixed(3)}`);

ok('the phase functions are the ones the physics names, not a rim light with a comment on it',
  /float rayleigh=0\.75\*\(1\.0\+cosT\*cosT\);/.test(src)
  && /float mie=\(1\.0-gg\)\/pow\(1\.0\+gg-2\.0\*g\*cosT, 1\.5\)\*0\.25;/.test(src)
  && /uSun\.value\.copy\(sunMesh\.position\)\.sub\(o\.mesh\.position\)\.normalize\(\)/.test(src),
  'Rayleigh ¾(1 + cos²θ) and Henyey-Greenstein for the haze, lit from where the Sun is rather than from wherever the camera happens to be');

ok('the limb is where the air shows, because a grazing ray crosses more of it',
  /float grazing=pow\(1\.0-abs\(dot\(N,V\)\),2\.4\);/.test(src),
  'an atmosphere is a ring of colour and not a wash over the disc, and the geometry is what makes it one');

/* ── what is drawn, and what is refused ─────────────────────────────────────── */
ok('the drawn thickness is compressive but strictly monotone in the true ratio',
  /const t=HCC_ATM\.thickMin\+HCC_ATM\.thickSpan\*Math\.sqrt\(Math\.min\(1,ratio\/0\.065\)\);/.test(src),
  'a square root is monotone, so the deepest air in the system is still the deepest on the screen');

ok('the exaggeration is recorded per planet rather than left for the reader to discover',
  /exaggeration:t\/Math\.max\(ratio,1e-9\)/.test(src) && /userData\.atmosphere=/.test(src),
  'eight scale heights of Earth air is one per cent of its radius; at true thickness there would be nothing to see');

const ref = (() => { const i = src.indexOf('refused:Object.freeze({');
  return i < 0 ? null : src.slice(i, src.indexOf('source:', i)); })();
const reasons = [...(ref || '').matchAll(/(\w+):'([^']+)'/g)].map(m => ({ n: m[1], r: m[2] }));
ok('the bodies with no atmosphere are refused by name, each with a reason long enough to be one',
  reasons.length >= 4 && reasons.every(x => x.r.length > 60)
  && reasons.some(x => x.n === 'Mercury') && reasons.some(x => x.n === 'Pluto'),
  reasons.map(x => `${x.n} (${x.r.length} chars)`).join(' · '));

ok('and the reasons are physics rather than a shrug',
  /exosphere/.test(ref) && /do not collide with each other/.test(ref)
  && /FREEZES ONTO THE SURFACE/.test(ref) && /not merely unknown but undefined/.test(ref),
  'Mercury has no fluid to have a scale height; Pluto has one that condenses onto the ground as it recedes, so a single H would describe it at one point in its orbit only');

ok('a shell is built only for a body in the table, so no atmosphere can appear where none was declared',
  /const b=HCC_ATM\.bodies\[name\]; if\(!b\) return null;/.test(src)
  && /const atm = planetAtmosphere\(p\.name, p\.r\);/.test(src),
  'a blue limb on Mercury would be a lie told in the most persuasive medium this instrument has');

console.log(`\n  ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
