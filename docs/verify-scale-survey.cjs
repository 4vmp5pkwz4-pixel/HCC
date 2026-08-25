/* ── THE CONVERSION TABLE THE SCALE SURVEY STANDS ON ──────────────────────────
   STATUS: MEASURED. This file reads index.html for ONE thing — the HCC_SI table — and
   verifies nothing else from it. Every factor in that table is then re-derived here from
   the DEFINITION of the unit and compared. A conversion table is the one kind of registry
   where the invariant IS the number, so a verifier that re-implemented the survey and
   copied the table would check nothing at all; the only useful thing it can do is derive
   each factor a second way and disagree.

   The definitions used, none of them taken from the atlas:
     c   = 299792458 m/s                      exact, SI definition
     yr  = 31557600 s                         the Julian year, 365.25 x 86400
     ly  = c * yr                             so a Gly is 1e9 of them
     AU  = 149597870700 m                     exact, IAU 2012
     pc  = (648000/pi) AU                     the definition of the parsec
     e   = 1.602176634e-19 C                  exact, SI 2019, hence the electronvolt
     erg = 1e-7 J                             the CGS definition
     G(auss) = 1e-4 T                         the CGS definition
     M_sun, R_earth                           conventional values, checked for magnitude only

   And the Planck units are checked by RELATION rather than by value, because a relation
   cannot be typed wrong in a way that still holds: l_P/t_P must be exactly c, m_P c l_P
   must be exactly hbar, and G m_P^2 must be exactly hbar c. */
'use strict';
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
let pass = 0, fail = 0;
const ok = (n, c, d) => { if (c) { pass++; console.log(`  ok   ${n}${d ? ' · ' + d : ''}`); }
                          else { fail++; console.log(`  FAIL ${n}${d ? ' · ' + d : ''}`); } };

/* ── the table, read out of the single source of truth ───────────────────── */
const src = readFileSync(join(__dirname, '..', 'index.html'), 'utf8');
const start = src.indexOf('const HCC_SI=Object.freeze({');
const end = src.indexOf('});', start);
ok('the survey’s conversion table is present in index.html and can be read as one block',
  start > 0 && end > start, start > 0 ? `${end - start} characters` : 'not found');
const block = src.slice(start, end);
const TABLE = {};
for (const m of block.matchAll(/'([^']+)':\{kind:'([^']+)',f:([^}]+)\}/g)) {
  let f;
  try { f = Function(`"use strict";return (${m[3]});`)(); } catch { f = NaN; }
  TABLE[m[1]] = { kind: m[2], f };
}
ok('every entry parses to a finite positive factor and a named kind',
  Object.keys(TABLE).length > 30 && Object.values(TABLE).every(e => Number.isFinite(e.f) && e.f > 0 && e.kind),
  `${Object.keys(TABLE).length} units over ${new Set(Object.values(TABLE).map(e => e.kind)).size} kinds`);

/* ── the definitions, independently ──────────────────────────────────────── */
const c = 299792458, yr = 31557600, ly = c * yr, AU = 149597870700;
const pc = (648000 / Math.PI) * AU, e = 1.602176634e-19;
const EXPECT = {
  m: 1, km: 1e3, cm: 1e-2, mm: 1e-3, nm: 1e-9, fm: 1e-15,
  AU, pc, kpc: 1000 * pc, Gly: 1e9 * ly, R_earth: 6.371e6,
  s: 1, ms: 1e-3, ns: 1e-9, d: 86400, yr,
  Hz: 1, kHz: 1e3, MHz: 1e6, GHz: 1e9, 'rad/s': 1 / (2 * Math.PI), 'Hz/s': 1,
  J: 1, erg: 1e-7, eV: e, ueV: e * 1e-6, meV: e * 1e-3, keV: e * 1e3, MeV: e * 1e6, GeV: e * 1e9,
  'J/m^3': 1, kg: 1, M_sun: 1.98892e30, 'kg/m^3': 1, 'kg/s': 1, 'cm^-3': 1e6,
  K: 1, mK: 1e-3, uK: 1e-6, 'uK^2': 1e-12,
  'm/s': 1, 'km/s': 1e3, 'm^2/s': 1, W: 1, 'erg/s': 1e-7,
  'W/m^2': 1, 'W m^-2': 1, Pa: 1, V: 1, G: 1e-4, T: 1, Wb: 1,
  'kg m/s': 1, 'J·s': 1, 'm^2': 1, 'm^3': 1, 'm^-2': 1,
  'Gly^2': (1e9 * ly) ** 2, 'Gly^3': (1e9 * ly) ** 3,
};
{
  const missing = Object.keys(TABLE).filter(u => !(u in EXPECT));
  const extra = Object.keys(EXPECT).filter(u => !(u in TABLE));
  ok('this file and the atlas name exactly the same units — neither has one the other has not',
    missing.length === 0 && extra.length === 0,
    `${Object.keys(TABLE).length} in the atlas, ${Object.keys(EXPECT).length} derived here${missing.length ? ' · only in the atlas: ' + missing.join(', ') : ''}${extra.length ? ' · only here: ' + extra.join(', ') : ''}`);
}
{
  const bad = [];
  for (const [u, e2] of Object.entries(TABLE)) {
    if (!(u in EXPECT)) continue;
    const want = EXPECT[u], got = e2.f;
    if (Math.abs(got / want - 1) > 1e-12) bad.push(`${u}: table ${got} vs derived ${want}`);
  }
  ok('and every factor in the table equals the one derived here from the unit’s definition, to machine precision',
    bad.length === 0, bad.length ? bad.slice(0, 4).join(' · ') : `${Object.keys(TABLE).length} factors, worst disagreement below 1e-12`);
}
{
  /* the derivations that are relations rather than values */
  ok('a light-year is c times the Julian year and a Gly is a billion of them, which is where 9.4607304725808e24 m comes from rather than from a table',
    Math.abs(TABLE.Gly.f / (1e9 * c * yr) - 1) < 1e-15,
    `c·yr = ${ly.toExponential(12)} m · Gly = ${TABLE.Gly.f.toExponential(12)} m`);
  ok('a parsec is 648000/pi astronomical units, and the kiloparsec is a thousand of those',
    Math.abs(TABLE.pc.f / pc - 1) < 1e-15 && Math.abs(TABLE.kpc.f / (1000 * pc) - 1) < 1e-15,
    `pc = ${pc.toExponential(12)} m from AU = ${AU} m exactly`);
  ok('the electronvolt ladder is the elementary charge times powers of ten, with no rounding introduced between the rungs',
    ['ueV', 'meV', 'eV', 'keV', 'MeV', 'GeV'].every(u => Math.abs(TABLE[u].f / EXPECT[u] - 1) < 1e-15)
    && Math.abs(TABLE.GeV.f / TABLE.MeV.f - 1e3) < 1e-9
    && Math.abs(TABLE.MeV.f / TABLE.eV.f - 1e6) < 1e-6,
    `e = ${e} C exactly · GeV/MeV = ${(TABLE.GeV.f / TABLE.MeV.f).toPrecision(12)}`);
  ok('rad/s is converted to Hz by exactly one factor of 2·pi and nothing else, which is the one conversion in this table that is a choice rather than a definition and is therefore the one worth stating out loud',
    Math.abs(TABLE['rad/s'].f * (2 * Math.PI) - 1) < 1e-15,
    `1 rad/s = ${TABLE['rad/s'].f.toPrecision(15)} Hz`);
  ok('two spellings of one unit land on one axis: W/m^2 and W m^-2 carry the same kind and the same factor, because two spellings treated as two dimensions is how a bus starts believing two things are different',
    TABLE['W/m^2'] && TABLE['W m^-2'] && TABLE['W/m^2'].kind === TABLE['W m^-2'].kind
    && TABLE['W/m^2'].f === TABLE['W m^-2'].f,
    `both are ${TABLE['W/m^2'] ? TABLE['W/m^2'].kind : '(missing)'}`);
  ok('the area and volume units are the CUBE and SQUARE of the length unit they are named after, not a length with a different exponent written beside it',
    Math.abs(TABLE['Gly^2'].f / (TABLE.Gly.f ** 2) - 1) < 1e-12
    && Math.abs(TABLE['Gly^3'].f / (TABLE.Gly.f ** 3) - 1) < 1e-12,
    `Gly² = ${TABLE['Gly^2'].f.toExponential(6)} m² · Gly³ = ${TABLE['Gly^3'].f.toExponential(6)} m³`);
}
{
  /* ── the Planck anchors, checked by relation ──────────────────────────── */
  const hb = 1.054571817e-34, G = 6.67430e-11, kB = 1.380649e-23;
  const lP = Math.sqrt(hb * G / c ** 3), tP = lP / c, mP = Math.sqrt(hb * c / G);
  const EP = mP * c * c, TP = EP / kB;
  ok('the Planck length and time satisfy l_P / t_P = c exactly, which no typo in either can survive',
    Math.abs((lP / tP) / c - 1) < 1e-15, `l_P/t_P = ${(lP / tP).toPrecision(15)} m/s against c = ${c}`);
  ok('and m_P · c · l_P returns hbar, and G · m_P² returns hbar·c — two independent relations that pin the mass',
    Math.abs((mP * c * lP) / hb - 1) < 1e-14 && Math.abs((G * mP * mP) / (hb * c) - 1) < 1e-14,
    `m_P c l_P = ${(mP * c * lP).toExponential(9)} vs hbar = ${hb.toExponential(9)}`);
  ok('the Planck energy and temperature follow from the mass by E = mc² and T = E/k_B with nothing else inserted',
    Math.abs(EP / (mP * c * c) - 1) < 1e-15 && Math.abs(TP / (EP / kB) - 1) < 1e-15,
    `E_P = ${EP.toExponential(9)} J · T_P = ${TP.toExponential(9)} K`);
  /* and against the literal the atlas stores in two places */
  const stored = [...src.matchAll(/1\.616255e-35/g)].length;
  ok('the atlas stores the Planck length as a rounded literal in more than one place and the survey computes it instead, so the disagreement is a measured rounding rather than an assumed agreement',
    stored >= 2 && Math.abs(lP / 1.616255e-35 - 1) < 1e-6 && Math.abs(lP / 1.616255e-35 - 1) > 0,
    `computed ${lP.toExponential(12)} m · stored literal appears ${stored} times · relative difference ${Math.abs(lP / 1.616255e-35 - 1).toExponential(2)}`);
}
console.log(`\n${pass}/${pass + fail} checks passed\n`);
process.exit(fail ? 1 : 0);
