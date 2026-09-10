#!/usr/bin/env node
'use strict';
/* ══ THE GALAXIES THE ATLAS NEVER PLACED, AND THE NESTING NOBODY HAD COMPUTED ══
 *
 * For twenty-one releases this atlas held forty-eight clusters, walls, voids and
 * compact objects at exact J2000 positions — and exactly two galaxies, the Milky
 * Way and M31, and those only inside the solar-scale ladder. The thing the cosmic
 * web is MADE OF was the one thing not placed.
 *
 * Forty-two are placed now, and this measures them. It does not read a table of
 * expected pictures: it runs the atlas's OWN raDecDir out of index.html over the
 * atlas's OWN catalogue, and checks the results against facts that exist outside
 * this file and cannot be edited into agreement —
 *
 *   · angular separations of famous pairs (M31/M32, M31/M110, M81/M82, LMC/SMC),
 *     which no single coordinate can be wrong in without moving,
 *   · the 3D separation of M31 and M33 against the Local Group's own geometry,
 *   · that every catalogued Virgo member lands INSIDE the Virgo sphere the atlas
 *     had already drawn, which tests the members and the cluster at once,
 *   · that the observer comes out inside exactly one asserted structure and it is
 *     Laniakea — Tully et al. 2014 re-derived from coordinates, not copied.
 *
 * And it runs the containment census itself, in a sandbox, so the census the
 * interface shows is the census that was checked.
 */
const fs = require('node:fs'), path = require('node:path'), vm = require('node:vm');
const ROOT = path.join(__dirname, '..');
const src = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');

let pass = 0, fail = 0;
const ok = (n, c, d) => { if (c) { pass++; console.log('  PASS — ' + n + (d ? ' :: ' + d : '')); }
  else { fail++; console.log('  FAIL — ' + n + (d ? ' :: EXPECTED ' + d : '')); } };

/* Slice by the STRUCTURE that begins each block, never by punctuation that happens
   to follow it: a slice pinned to a comma or a brace goes red the day a fourth
   argument is added, and a check that goes red against correct code is worse than
   no check at all. Each cut below starts at a declaration and ends by counting
   brackets, so the block is the block. */
function cutBalanced(from, open, close) {
  const i = src.indexOf(from);
  if (i < 0) throw new Error('slice not found: ' + from);
  const j = src.indexOf(open, i);
  let d = 0;
  for (let k = j; k < src.length; k++) {
    if (src[k] === open) d++;
    else if (src[k] === close) { d--; if (d === 0) return src.slice(i, k + 1); }
  }
  throw new Error('unbalanced: ' + from);
}
const S_GAL = cutBalanced('const GALAXIES=Object.freeze([', '[', ']') + ');';
const S_COSMOS = cutBalanced('const COSMOS = [', '[', ']') + ';';
const S_RADEC = cutBalanced('function raDecDir(raH, dec){', '{', '}');
const S_GALRD = cutBalanced('function galacticRaDec(lDeg,bDeg){', '{', '}');
const S_COMOV = src.slice(src.indexOf('const C_DH_GLY = '), src.indexOf('function galacticRaDec(lDeg,bDeg){'));
const S_BASIS = cutBalanced('function galaxyDiscBasis(raDeg,decDeg,inclDeg,paDeg){', '{', '}');
const S_NEST = src.slice(src.indexOf("const NESTING_SPHERE_TYPES=new Set("),
                         src.indexOf('function nestingRows(key){'));

ok('every block this check runs was cut out of index.html, not copied beside it',
  [S_GAL, S_COSMOS, S_RADEC, S_GALRD, S_COMOV, S_BASIS, S_NEST].every(s => s && s.length > 40),
  `${S_GAL.length} + ${S_COSMOS.length} + ${S_NEST.length} chars of live source`);

/* A Vector3 with exactly the operations the sliced code uses. Anything the atlas
   calls that is missing here throws rather than silently returning undefined. */
class V3 {
  constructor(x, y, z) { this.x = x || 0; this.y = y || 0; this.z = z || 0; }
  clone() { return new V3(this.x, this.y, this.z); }
  set(x, y, z) { this.x = x; this.y = y; this.z = z; return this; }
  multiplyScalar(s) { this.x *= s; this.y *= s; this.z *= s; return this; }
  addScaledVector(v, s) { this.x += v.x * s; this.y += v.y * s; this.z += v.z * s; return this; }
  crossVectors(a, b) { return this.set(a.y * b.z - a.z * b.y, a.z * b.x - a.x * b.z, a.x * b.y - a.y * b.x); }
  dot(v) { return this.x * v.x + this.y * v.y + this.z * v.z; }
  length() { return Math.sqrt(this.dot(this)); }
  normalize() { const l = this.length() || 1; return this.multiplyScalar(1 / l); }
  distanceTo(v) { const a = this.x - v.x, b = this.y - v.y, c = this.z - v.z; return Math.sqrt(a * a + b * b + c * c); }
}
const sandbox = {
  Math, Map, Set, Object, Array, Number, console, JSON,
  THREE: { Vector3: V3 },
  DEG: Math.PI / 180, OBLIQ: 23.4392911 * Math.PI / 180,
  H0: 67.4, OM: 0.315,
};
const ctx = vm.createContext(sandbox);
const built = vm.runInContext([S_RADEC, S_GALRD, S_COMOV,
  'const VELA_EQ=galacticRaDec(272.5,0), DIPOLE_EQ=galacticRaDec(94,-16), LOCALVOID_EQ=galacticRaDec(60,15);',
  S_GAL, S_COSMOS,
  'for(const s of COSMOS) if(s.dGly==null && s.dMly!=null) s.dGly=s.dMly/1000;',
  'const CELESTIAL_POLE_DIR=raDecDir(0,90).normalize();', S_BASIS,
  // the scene positions, built exactly as the render loop builds them
  `const COSMOS_POS=new Map();
   for(const s of COSMOS){ const d = s.dGly!=null ? s.dGly : comovingGly(s.z);
     COSMOS_POS.set(s.key, raDecDir(s.ra/15,s.dec).multiplyScalar(d)); }`,
  S_NEST,
  // hand the sliced declarations back out: a const inside a vm script is not a
  // property of the sandbox, so the block ends by naming what it built.
  '({GALAXIES, COSMOS, COSMOS_POS, HCC_NESTING, raDecDir, galaxyDiscBasis})'
].join('\n'), ctx, { timeout: 20000 });

const { GALAXIES, COSMOS, COSMOS_POS, HCC_NESTING, raDecDir, galaxyDiscBasis } = built;

/* ── the catalogue itself ─────────────────────────────────────────────────── */
/* Checked over EVERY galaxy in the catalogue, not only the forty-two in the new
   block: three Coma members were retyped to galaxy in this release and carried a
   distance in the old spelling, which was found the first time the page tried to
   print one and not one moment earlier. A check that only looks at the new list
   would have missed it, so it looks at the type. */
const ALL_GAL = COSMOS.filter(s => s.type === 'galaxy');
const GALAXY_FLOOR = 42;              // a floor, and a floor only rises
ok('the galaxy catalogue is at or above its floor, and the floor only rises',
  GALAXIES.length >= GALAXY_FLOOR, `${GALAXIES.length} galaxies against floor ${GALAXY_FLOOR}`);
ok('every galaxy in the whole catalogue carries an exact position and a distance in the one spelling, with no gaps',
  ALL_GAL.length >= GALAXIES.length &&
  ALL_GAL.every(g => g.ra >= 0 && g.ra < 360 && g.dec >= -90 && g.dec <= 90 && g.dMly > 0),
  `${ALL_GAL.length} galaxies, every RA in [0,360), Dec in [-90,90], dMly > 0`);
ok('and every one of them declares a diameter small enough to be a galaxy rather than a cluster',
  ALL_GAL.every(g => g.size > 0 && g.size < 0.001),
  `largest is ${(Math.max(...ALL_GAL.map(g => g.size)) * 1e6).toFixed(0)} kly across`);
ok('every galaxy in the whole catalogue declares what may not be read off its drawing',
  ALL_GAL.every(g => Array.isArray(g.forbiddenClaims) && g.forbiddenClaims.length > 0),
  `${ALL_GAL.length} galaxies, each naming its own limit`);
/* Asserted against the SOURCE, not the runtime objects: the one conversion line
   writes dGly onto these very objects at load, so by the time the census has run
   every one of them has both. The invariant is that no literal in the catalogue
   writes a second distance — which is a property of the text. */
ok('a galaxy distance is written ONCE, as dMly — no entry spells a second one in Gly',
  !/dGly\s*:/.test(S_GAL) && (S_GAL.match(/dMly\s*:/g) || []).length === GALAXIES.length,
  `${(S_GAL.match(/dMly\s*:/g) || []).length} dMly declarations and no dGly in the catalogue text`);
ok('no galaxy key collides with a structure key already in the atlas',
  new Set(COSMOS.map(s => s.key)).size === COSMOS.length,
  `${COSMOS.length} catalogue keys, all distinct`);
ok('every galaxy declares what may not be read off its drawing',
  GALAXIES.every(g => Array.isArray(g.forbiddenClaims) && g.forbiddenClaims.length > 0),
  'each entry names either the disc-orientation limit or the no-shape-asserted limit');
const oriented = GALAXIES.filter(g => g.incl != null && g.pa != null);
ok('a disc orientation is declared or it is absent — never half of one',
  GALAXIES.every(g => (g.incl == null) === (g.pa == null)),
  `${oriented.length} with both inclination and position angle, ${GALAXIES.length - oriented.length} with neither`);
ok('every Virgo member says in its own forbidden claims that it is drawn at the CLUSTER distance',
  GALAXIES.filter(g => g.group === 'Virgo Cluster')
    .every(g => g.forbiddenClaims.some(c => /CLUSTER distance/.test(c))),
  `${GALAXIES.filter(g => g.group === 'Virgo Cluster').length} Virgo members, each carrying the warning`);

/* ── the positions, against facts outside this file ───────────────────────── */
const byKey = new Map(GALAXIES.map(g => [g.key, g]));
const dirOf = k => { const g = byKey.get(k); return raDecDir(g.ra / 15, g.dec).normalize(); };
const sepDeg = (a, b) => Math.acos(Math.max(-1, Math.min(1, dirOf(a).dot(dirOf(b))))) * 180 / Math.PI;
const PAIRS = [
  ['m31', 'm32', 0.404, 0.02, 'M32 sits 24 arcmin south of the M31 nucleus'],
  ['m31', 'm110', 0.609, 0.02, 'M110 sits 37 arcmin north-west of it'],
  ['m31', 'm33', 14.78, 0.10, 'M31 and M33 are just under fifteen degrees apart'],
  ['m81', 'm82', 0.615, 0.02, 'the interacting pair fits in one low-power eyepiece field'],
  ['lmc', 'smc', 20.77, 0.15, 'the two Clouds are twenty-one degrees apart'],
  ['ngc185', 'ngc147', 0.972, 0.03, 'the bound dwarf pair, one degree apart'],
  ['m84', 'm86', 0.283, 0.02, "the two ellipticals at the bend of Markarian's Chain"],
];
for (const [a, b, want, tol, why] of PAIRS) {
  const got = sepDeg(a, b);
  ok(`the sky separation ${a.toUpperCase()}–${b.toUpperCase()} comes out right — ${why}`,
    Math.abs(got - want) <= tol, `${got.toFixed(4)}° against ${want}° ± ${tol}°`);
}
const pos3 = k => { const g = byKey.get(k); return raDecDir(g.ra / 15, g.dec).multiplyScalar(g.dMly); };
const d3 = (a, b) => pos3(a).distanceTo(pos3(b));
ok('M31 and M33 come out about 0.70 Mly apart in three dimensions, from two directions and two distances',
  Math.abs(d3('m31', 'm33') - 0.704) < 0.03, `${d3('m31', 'm33').toFixed(4)} Mly`);
ok('the two Magellanic Clouds come out about 75 kly apart, which is the number their tidal bridge is drawn from',
  Math.abs(d3('lmc', 'smc') - 0.0742) < 0.005, `${(d3('lmc', 'smc') * 1000).toFixed(1)} kly`);
ok('every distance lands between the Galactic centre and four hundred million light years — nothing has slipped a factor of a thousand',
  GALAXIES.every(g => g.dMly > 0.026 && g.dMly < 400),
  `${Math.min(...GALAXIES.map(g => g.dMly)) * 1000} kly to ${Math.max(...GALAXIES.map(g => g.dMly))} Mly`);

/* ── the disc basis, as arithmetic ────────────────────────────────────────── */
{
  const B = galaxyDiscBasis(10.684708, 41.268750, 77.5, 38.0);
  const orth = Math.abs(B.major.dot(B.normal)) + Math.abs(B.major.dot(new V3().crossVectors(B.normal, B.major)));
  ok('the disc basis is orthonormal by construction, and it is measured rather than trusted',
    orth < 1e-12 && Math.abs(B.major.length() - 1) < 1e-12 && Math.abs(B.normal.length() - 1) < 1e-12,
    `M31: |major·normal| = ${Math.abs(B.major.dot(B.normal)).toExponential(2)}, both unit to 1e-12`);
  const faceOn = galaxyDiscBasis(10.684708, 41.268750, 0, 38.0);
  const L = raDecDir(10.684708 / 15, 41.268750).normalize();
  ok('a face-on disc has its normal pointing straight back at us — the limit the formula must hit',
    Math.abs(faceOn.normal.dot(L) + 1) < 1e-12, `i = 0° gives normal·L = ${faceOn.normal.dot(L).toFixed(15)}`);
  const edgeOn = galaxyDiscBasis(10.684708, 41.268750, 90, 38.0);
  ok('an edge-on disc has its normal in the plane of the sky — the other limit',
    Math.abs(edgeOn.normal.dot(L)) < 1e-12, `i = 90° gives normal·L = ${edgeOn.normal.dot(L).toExponential(2)}`);
}

/* ── the census ───────────────────────────────────────────────────────────── */
const N = HCC_NESTING(1);
const VIRGO_MEMBERS = GALAXIES.filter(g => g.group === 'Virgo Cluster').map(g => g.key);
ok('every catalogued Virgo member lands inside the Virgo sphere the atlas had already drawn',
  VIRGO_MEMBERS.every(k => N.per.get(k).inside.some(x => x.key === 'virgo')),
  `${VIRGO_MEMBERS.join(', ')} — each within ${(COSMOS.find(s => s.key === 'virgo').size / 2 * 1000).toFixed(1)} Mly of the Virgo centre`);
ok("M87's black hole lands in Virgo too, from a position that was in the atlas before any of this",
  N.per.get('m87bh').inside.some(x => x.key === 'virgo'), 'the containment test agrees with the object it was not written for');
ok('the observer is inside exactly ONE asserted structure, and it is Laniakea',
  N.observer_depth === 1 && N.observer_inside[0] === 'laniakea',
  `Tully et al. 2014, re-derived: depth ${N.observer_depth}, inside [${N.observer_inside.join(', ')}]`);
ok('and our own membership is stated with the margin it survives to, not as a certainty',
  Math.abs(N.observer_exit_margin - 0.6154) < 0.002,
  `we sit at ${(N.observer_exit_margin * 100).toFixed(1)}% of Laniakea's declared radius — below m = ${N.observer_exit_margin.toFixed(3)} we are in nothing`);
ok('shrinking every declared radius to 60% drops us out of everything, which is what a marginal membership means',
  HCC_NESTING(0.6).observer_depth === 0 && HCC_NESTING(0.62).observer_depth === 1,
  'the census answers a sweep of the one knob it has, rather than a single picture');
ok('a galaxy is never a container — nothing is asserted to be inside one',
  [...N.per.values()].every(v => v.inside.every(x => COSMOS.find(s => s.key === x.key).type !== 'galaxy')),
  'the three Coma members were typed cluster until v4.213.0, and the census concluded Coma was inside NGC 4874');

/* CEILINGS THAT ONLY FALL, FLOORS THAT ONLY RISE. The refused count is a ceiling
   because every one of them is an overlap the atlas cannot stand behind, and the
   way to move it down is to give a container a known centroid or an honest shape —
   never to stop looking. */
const ASSERTED_FLOOR = 60;
const REFUSED_CEILING = 320;
ok('the asserted containments are at or above their floor',
  N.asserted >= ASSERTED_FLOOR, `${N.asserted} asserted against floor ${ASSERTED_FLOOR}`);
ok('the overlaps the atlas refuses to assert are at or below their ceiling, and the ceiling only falls',
  N.refused <= REFUSED_CEILING, `${N.refused} refused against ceiling ${REFUSED_CEILING}`);
ok('every refusal resolves to one of the two declared reasons — none is unexplained',
  Object.keys(N.refused_by_reason).every(r => r === 'centroid_not_known' || r === 'shape_is_not_a_sphere') &&
  Object.values(N.refused_by_reason).reduce((a, b) => a + b, 0) === N.refused,
  Object.entries(N.refused_by_reason).map(([k, v]) => `${k} ${v}`).join(' · '));
ok('the census walks every placed object, the observer included',
  N.objects === COSMOS.length + 1, `${N.objects} objects = ${COSMOS.length} catalogued + the observer`);
ok('and it reports what its own catalogue is missing rather than only what it has',
  N.empty_containers > 0 && N.empty_containers < N.containers,
  `${N.empty_containers} of ${N.containers} declared structures contain nothing this atlas has placed`);

console.log(`\n  ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
