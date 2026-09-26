#!/usr/bin/env node
'use strict';
/* ══ NO STAR IS INSIDE THE OORT CLOUD ════════════════════════════════════════
 *
 * A reader flying out of the Solar System saw stars INSIDE the Oort cloud, and they
 * were there: the Solar world's sky was 72 000 random points on a shell 462–660 AU
 * from the Sun, visible out to 1 200 AU, while the Oort cloud begins at 2 000 AU and
 * the nearest real star, Proxima, is 268 000 AU away. It is replaced by every
 * Hipparcos star to V = 7 — each with its measured parallax, the parallax's standard
 * error and its proper motion — and a star measured to five standard errors stands
 * at d = 1/ϖ. This file takes the catalogue and the kinematics out of index.html and
 * COMPUTES:
 *
 *   1. the embedded catalogue decodes: its count, record size and magnitude limit are
 *      the ones declared, every position is on the sphere, and it is sorted by V
 *   2. every PLACED star is beyond the outer edge of the Oort cloud — the nearest is
 *      α Centauri at 1.35 pc — and no star without a five-sigma parallax is given a
 *      distance at all
 *   3. the distances are the published ones, star by star, for stars whose parallaxes
 *      are known independently of this build (Sirius, Vega, α Cen A, Polaris,
 *      Betelgeuse, Rigel, Arcturus, Procyon)
 *   4. the motion is the straight line the card says it is, TO FIRST ORDER: over ten
 *      thousand years a star turns through its proper motion times the time, and a placed
 *      star's distance grows only by the Pythagorean amount a transverse motion allows —
 *      to within 3Ωt, the bend the ride on the Galaxy adds (2026-09-26)
 *   5. the page no longer builds a random sky in the Solar world, the sky at infinity
 *      rides with the camera and fades between 0.05 and 0.5 pc, and the Oort cloud's
 *      own tracer points are soft haze, not star-like squares
 *   6. MUTATIONS — each of the defects this replaces, put back into a copy of the
 *      source, is caught by the checks above
 */
const fs = require('node:fs'), path = require('node:path');
const ROOT = path.join(__dirname, '..');
const SRC = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
let pass = 0, fail = 0;
const ok = (n, c, d) => { if (c) { pass++; console.log('  PASS — ' + n + (d ? ' :: ' + d : '')); }
  else { fail++; console.log('  FAIL — ' + n + (d ? ' :: ' + d : '')); } };
const between = (src, a, b) => { const i = src.indexOf(a); const j = src.indexOf(b, i); return i < 0 || j < 0 ? '' : src.slice(i, j); };

const PC_AU = 648000 / Math.PI, OORT_OUTER_AU = 100000, DEG = Math.PI / 180, OBLIQ = 23.4392911 * DEG;
const m = SRC.match(/const HCC_SKY_HIP=\{count:(\d+),vlim:([\d.]+),rec:(\d+),good:(\d+),inputs:(\{[^}]*\}),b64:'([A-Za-z0-9+/=]+)'\};/);
const NAMES = JSON.parse((SRC.match(/const HCC_SKY_HIP_NAMES=(\{[^\n]*\});/) || [0, '{}'])[1]);

/* a Vector3 with exactly the operations the runtime kinematics use */
class V3 { constructor(x = 0, y = 0, z = 0) { this.x = x; this.y = y; this.z = z; }
  set(x, y, z) { this.x = x; this.y = y; this.z = z; return this; }
  multiplyScalar(k) { this.x *= k; this.y *= k; this.z *= k; return this; }
  length() { return Math.hypot(this.x, this.y, this.z); }
  normalize() { const l = this.length() || 1; return this.multiplyScalar(1 / l); }
  dot(v) { return this.x * v.x + this.y * v.y + this.z * v.z; } }

/* the runtime's own decoder and motion law, run here straight out of the page */
function runtime(src, hip) {
  /* the motion law now includes the ride on the Galaxy (galRide and its frame), so that is cut out of the page too */
  const ride = between(src, 'const GAL_RIDE=', 'function galSceneToEq(') + (src.match(/^const STAT_MG=.*$/m) || [''])[0] + '\n' + (src.match(/^const statToGal=.*$/m) || [''])[0] + '\n';
  const code = ride + between(src, 'const HIP3D_GOOD=', 'function hip3dBuild(')
    + between(src, 'function hip3dRide(', 'function hip3dPlace(');
  if (!code) return null;
  const f = new Function('THREE', 'OBLIQ', 'DEG', 'HCC_SKY_HIP', 'HCC_SKY_HIP_NAMES', 'ZOD3D_PC_AU', 'solarGroup', 'atob', 'GAL_YEAR_MYR',
    code.replace(/^const hip3dGroup=.*$/m, '').replace(/^let hip3d=.*$/m, '')
    + '\nreturn {decode:hip3dDecode, posAt:hip3dPosAt, GOOD:HIP3D_GOOD};');
  return f({ Vector3: V3, Group: class { constructor() { this.name = ''; } } }, OBLIQ, DEG, hip, NAMES, PC_AU, { add() {} },
    s => Buffer.from(s, 'base64').toString('binary'), 230);
}

function checks(src, report) {
  const say = report ? ok : () => {};
  const r = {};
  const mm = src.match(/const HCC_SKY_HIP=\{count:(\d+),vlim:([\d.]+),rec:(\d+),good:(\d+),inputs:(\{[^}]*\}),b64:'([A-Za-z0-9+/=]+)'\};/);
  const HIP = mm ? { count: +mm[1], vlim: +mm[2], rec: +mm[3], good: +mm[4], inputs: JSON.parse(mm[5]), b64: mm[6] } : null;
  let RT = null; try { RT = HIP && runtime(src, HIP); } catch (e) { RT = null; }
  let S = []; try { S = RT ? RT.decode() : []; } catch (e) { S = []; }

  { /* 1. the catalogue decodes */
    const bytes = HIP ? Buffer.from(HIP.b64, 'base64').length : 0;
    let onSphere = 0, sorted = true;
    for (let i = 0; i < S.length; i++) { const u = S[i].u; if (Math.abs(Math.hypot(u[0], u[1], u[2]) - 1) < 1e-9) onSphere++;
      if (i && S[i].V < S[i - 1].V) sorted = false; }
    r.decodes = !!HIP && HIP.count > 15000 && bytes === HIP.count * HIP.rec && S.length === HIP.count
      && onSphere === S.length && sorted && S.every(s => s.V <= HIP.vlim + 1e-9)
      && Object.keys(HIP.inputs).length >= 6 && Object.values(HIP.inputs).every(h => /^[0-9a-f]{64}$/.test(h));
    say('the catalogue embedded in the page decodes to what it declares: every Hipparcos star to V = 7, on the unit sphere, sorted by V, and every input it was built from named by its SHA-256',
      r.decodes, HIP ? `${S.length} stars × ${HIP.rec} bytes = ${bytes} bytes · V ≤ ${HIP.vlim} · ${Object.keys(HIP.inputs).length} inputs hashed` : 'HCC_SKY_HIP not found');
  }
  { /* 2. no placed star inside the Oort cloud, and no distance without five sigma */
    const placed = S.filter(s => s.placed), open = S.filter(s => !s.placed);
    const nearest = placed.reduce((a, s) => s.dPc < a.dPc ? s : a, { dPc: Infinity });
    const fiveSigma = placed.every(s => s.plx > 0 && s.eplx > 0 && s.plx / s.eplx >= (RT ? RT.GOOD : 0) && (RT && RT.GOOD >= 5));
    const noGuess = open.every(s => s.dPc === undefined && !(s.plx > 0 && s.eplx > 0 && s.plx / s.eplx >= 5));
    r.beyond = placed.length > 15000 && nearest.dPc * PC_AU > OORT_OUTER_AU && nearest.dPc > 1.3 && fiveSigma && noGuess
      && HIP && placed.length === HIP.good;
    say('every placed star lies beyond the outer edge of the Oort cloud — the nearest is α Centauri — and a star whose parallax is not measured to five standard errors is given no distance at all',
      r.beyond, `${placed.length} placed (declared ${HIP && HIP.good}) · ${open.length} left as directions · nearest ${nearest.hip ? 'HIP ' + nearest.hip : '—'} at ${nearest.dPc.toFixed(3)} pc = ${Math.round(nearest.dPc * PC_AU).toLocaleString('en-US')} AU against the cloud's edge at ${OORT_OUTER_AU.toLocaleString('en-US')} AU`);
  }
  { /* 3. the distances are the published ones */
    const REF = [ // HIP, name, parallax (mas) as published independently of this build
      [32349, 'Sirius', 379.21], [91262, 'Vega', 130.23], [71683, 'α Cen A', 742.12], [11767, 'Polaris', 7.54],
      [27989, 'Betelgeuse', 6.55], [24436, 'Rigel', 3.78], [69673, 'Arcturus', 88.83], [37279, 'Procyon', 284.56]];
    const by = new Map(S.map(s => [s.hip, s]));
    const rows = REF.map(([h, n, p]) => { const s = by.get(h); return [n, s && s.placed ? Math.abs(s.dPc - 1000 / p) / (1000 / p) : Infinity]; });
    r.published = rows.every(([, e]) => e < 1e-3);
    say('the distances are the published ones: eight stars whose parallaxes are on record independently of this build land within 0.1 per cent of 1/ϖ',
      r.published, rows.map(([n, e]) => `${n} ${Number.isFinite(e) ? (100 * e).toFixed(3) + ' %' : 'MISSING'}`).join(' · '));
    const sir = by.get(32349), nm = NAMES['32349'];
    say('and the stars are named where they have names — Sirius is Sirius, in Canis Major — so a card never shows a bare number for a star anyone knows',
      !!(sir && nm && nm[0] === 'Sirius' && nm[2] === 'CMa' && Object.keys(NAMES).length > 4000), nm ? nm.join(' · ') : 'no name');
  }
  { /* 4. the straight line */
    let worstTurn = 0, worstDist = 0, n = 0;
    if (RT) for (const s of S) { const mu = Math.hypot(s.pmra, s.pmde); if (mu < 200) continue; n++;
      const t = 1e4, a = RT.posAt(s, 2000, new V3()), b = RT.posAt(s, 2000 + t, new V3());
      const turn = Math.acos(Math.min(1, a.dot(b) / (a.length() * b.length()))), want = Math.atan(mu * t / 3.6e6 * DEG);
      worstTurn = Math.max(worstTurn, Math.abs(turn - want) / want);
      if (s.placed) { const d0 = a.length(), d1 = b.length(), dw = d0 * Math.hypot(1, mu * t / 3.6e6 * DEG);
        worstDist = Math.max(worstDist, Math.abs(d1 - dw) / dw); } }
    /* the straight line is the FIRST-ORDER term: beyond a year the star rides the Galaxy, which bends it by no more than
       Ωt ≈ 2.7e-4 over ten thousand years (Coriolis and tide on the relative motion) — so the bound is 3Ωt, not 1e-6 */
    const bend = 3 * (2 * Math.PI / 230) * 1e-2;
    r.line = n > 50 && worstTurn < bend && worstDist < bend;
    say('the motion is the straight line the card declares: over ten thousand years every fast star turns through arctan(μt), and a placed star recedes only by the Pythagorean amount a transverse velocity allows — no radial velocity is invented',
      r.line, `${n} stars with μ > 0.2″/yr · worst turn error ${worstTurn.toExponential(1)} · worst distance error ${worstDist.toExponential(1)} (relative)`);
  }
  { /* 5. the structure */
    r.noRandomSky = !/skyGroup\.add\(starfield\(/.test(src);
    r.infinity = /skyGroup\.position\.copy\(solarGroup\.worldToLocal\(_skyCamLocal\.copy\(camera\.position\)\)\);/.test(src)
      && /const skyFade=1-THREE\.MathUtils\.smoothstep\(camDist, 0\.05\*ZOD3D_PC_AU, 0\.5\*ZOD3D_PC_AU\);/.test(src)
      && !/skyGroup\.visible = localScale && camDist < 1200;/.test(src);
    r.haze = /map:oortMistTex\(\)/.test(src) && /function oortMistTex\(\)/.test(src);
    r.selfTest = /No star is drawn inside the Oort cloud/.test(src);
    say('the Solar world builds no random sky any more — not one starfield() is added to it', r.noRandomSky);
    say('the sky that is only a direction is drawn at infinity: it rides with the camera instead of standing on a 600-AU shell around the Sun, and it fades between 0.05 and 0.5 pc, where a direction measured from the Sun stops being the direction from the camera',
      r.infinity);
    say('the Oort cloud\'s own points are soft haze, not hard squares that read as stars from inside the cloud', r.haze);
    say('and the atlas asserts it about itself at boot: a self-test measures the nearest drawn star against the cloud\'s outer edge', r.selfTest);
  }
  return r;
}

const base = checks(SRC, true);

{ /* 6. mutations: each defect put back is caught */
  const MUT = [
    ['the random shell around the Sun is put back', s => s.replace('const hccRealSkyGroup=', 'skyGroup.add(starfield(72000, 660));\nconst hccRealSkyGroup='), 'noRandomSky'],
    ['the sky is pinned to the Sun again', s => s.replace('skyGroup.position.copy(solarGroup.worldToLocal(_skyCamLocal.copy(camera.position)));', ''), 'infinity'],
    ['a distance is drawn for any parallax above zero', s => s.replace('const HIP3D_GOOD=5;', 'const HIP3D_GOOD=0.01;'), 'beyond'],
    ['one parallax is decoded ten times too large', s => s.replace('plx:dv.getUint32(o+16,true)/100', 'plx:dv.getUint32(o+16,true)/10'), 'published'],
    ['motion is applied as if it were in arcseconds (in the J2000 line and in the ride)', s => s.replace('const HIP3D_MAS=Math.PI/180/3.6e6;', 'const HIP3D_MAS=Math.PI/180/3.6e3;').replace('k=4.740470446*s.dPc/1000;', 'k=4.740470446*s.dPc;'), 'line'],
    ['the cloud is drawn in hard squares again', s => s.replace('map:oortMistTex(),', ''), 'haze'],
  ];
  const caught = MUT.map(([n, f, k]) => { const v = f(SRC); const changed = v !== SRC; const r = changed ? checks(v, false) : {};
    return [n, changed && base[k] === true && r[k] === false]; });
  ok('every defect this replaces, put back into a copy of the page, is caught by the check written for it',
    caught.every(([, c]) => c), caught.map(([n, c]) => `${c ? '✓' : '✗'} ${n}`).join(' · '));
}

console.log('\n  ' + pass + ' passed, ' + fail + ' failed');
process.exit(fail ? 1 : 0);
