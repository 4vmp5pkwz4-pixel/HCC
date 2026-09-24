#!/usr/bin/env node
'use strict';
/* ══ EVERY SKY OBJECT OPENS ITS PICTURES, AND ANY STAR CAN BE STOOD ON ══════════
 * 1. photographs come only from the agencies' own archives (NASA Image and Video
 *    Library API, ESA/Hubble, ESA/Webb, ESO, NASA 3D Resources, NASA Eyes) and a
 *    failure to reach them is said, not hidden; objects with no searchable name get
 *    no invented query
 * 2. standing on a star puts the camera at that star's measured position looking
 *    back at the Sun, the Sun is drawn with its absolute magnitude 4.83, and the scale
 *    chain does not pull the camera home while standing
 * 3. every object is searched under the name astronomers file it under, never under
 *    the words an interface translates or simplifies: the IAU Latin name of a
 *    constellation, a Bayer designation spelled out, every catalogue designation of a
 *    deep-sky object; and a returned picture is kept only if it names the object
 * 4. MUTATIONS are caught */
const fs = require('node:fs'), path = require('node:path');
const SRC = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
let pass = 0, fail = 0;
const ok = (n, c, d) => { if (c) { pass++; console.log('  PASS — ' + n + (d ? ' :: ' + d : '')); } else { fail++; console.log('  FAIL — ' + n + (d ? ' :: ' + d : '')); } };
const between = (s, a, b) => { const i = s.indexOf(a), j = s.indexOf(b, i); return i < 0 || j < 0 ? '' : s.slice(i, j); };
const OFFICIAL = ['images-api.nasa.gov', 'images.nasa.gov', 'esahubble.org', 'esawebb.org', 'www.eso.org', 'science.nasa.gov', 'eyes.nasa.gov', 'simbad.cds.unistra.fr'];
function media(src) { const m = between(src, 'function hccMediaOpen(key){', 'globalThis.HCC_MEDIA=');
  const hosts = [...m.matchAll(/https:\/\/([a-z0-9.-]+)\//g)].map(x => x[1]);
  return { m, hosts, official: hosts.length >= 7 && hosts.every(h => OFFICIAL.includes(h)),
    honest: /could not be reached from this browser/.test(m) && /the atlas does not guess one/.test(src) && /if\(\/\^HIP \\d\+\$\/\.test\(base\)\) return \{name:base,ids:\[base\],kind:'star'\};/.test(src) }; }
function stand(src) { return /const HCC_SUN_M=4\.83;/.test(src) && /const cam=p\.clone\(\)\.addScaledVector\(back,0\.03\*ZOD3D_PC_AU\);/.test(src)
  && /if\(HCC_STAND\) return;          \/\* standing on another star/.test(src) && /if\(hccStandable\(key\)\) acts\.unshift\(/.test(src); }
const M = media(SRC);
ok('photographs and 3D come only from the agencies\' own archives', M.official, [...new Set(M.hosts)].join(' · '));
ok('and a failure to reach them is said, and a star known only by its Hipparcos number is searched as that number, never given an invented name', M.honest);
ok('any star with a measured distance can be stood on: the camera at its position looking back, the Sun at M = 4.83, the scale chain held', stand(SRC));

/* 3 · the names archives file things under */
const grab = (s, re) => (s.match(re) || [])[0] || '';
const names = s => { const src = grab(s, /function hccIauCon\(abbr\)\{[\s\S]*?\n\}/) + grab(s, /const HCC_GREEK=\{[^\n]*\};/) + grab(s, /const HCC_SUP=\{[^\n]*\};/)
    + grab(s, /const HCC_GREEK3=\{[^\n]*\};/) + grab(s, /function hccSpellGreek\(nm\)\{[\s\S]*?\n\}/);
  try { return new Function(src + ';return {spell:hccSpellGreek, iau:hccIauCon};')(); } catch (e) { return null; } };
const N = names(SRC);
const CASES = [['ε Phe', 'Epsilon Phoenicis'], ['β¹ Tuc', 'Beta1 Tucanae'], ['Lam CMa', 'Lambda Canis Majoris'], ['η Carinae', 'Eta Carinae'], ['ρ Cassiopeiae', 'Rho Cassiopeiae'], ['Betelgeuse', 'Betelgeuse']];
const got = N ? CASES.map(([a, b]) => [a, N.spell(a), b]) : [];
ok('a Bayer designation is spelled out the way catalogues and archives write it', N && got.every(([, x, b]) => x === b), got.map(([a, x]) => `${a} → ${x}`).join(' · '));
const T = N && N.iau();
ok('all 88 IAU constellations resolve to their Latin name and genitive', T && Object.keys(T).length === 88 && T.CMa[0] === 'Canis Major' && T.Cru[0] === 'Crux' && T.Phe[1] === 'Phoenicis',
  T ? `${Object.keys(T).length} constellations · CMa → ${T.CMa[0]}, Cru → ${T.Cru[0]}` : '');
const untranslated = s => /registerSel\(key,\{name:sky3dConName\(con\),mode:'solar',labelEl:l\.element,media:hccConMedia\(con\),/.test(s)
  && /registerSel\('zod3d_'\+con,\{[^\n]*media:hccConMedia\(con\),/.test(s) && /function hccMediaQuery\(key,s\)\{ const r=hccMediaIds\(key,s\); return r\?r\.name:''; \}/.test(s)
  && !/function hccMediaIds[\s\S]{0,4000}hccL\(/.test(grab(s, /function hccMediaIds\(key,s\)\{[\s\S]*?\n\}/));
ok('a constellation is searched under its IAU name from its key — a translated or popular label ("Great Dog", "Овен") never reaches an archive', untranslated(SRC));
ok('a deep-sky object carries every catalogue designation it has, and the archives that index designations get one',
  /media:\{name:r\[7\]\|\|r\[0\],ids:\[r\[0\],\.\.\.\(r\[8\]\|\|\[\]\)\],kind:'dso'\}/.test(SRC) && /\['Messier '\+nm\[0\]\.slice\(1\)\]/.test(SRC)
  && /const desig=M&&M\.kind==='dso'\?/.test(SRC));
const relevant = s => /return idsN\.some\(k=>T\.includes\(k\)\)\?2:idsN\.some\(k=>A\.includes\(k\)\)\?1:0;/.test(s) && /const sc=hits\(it\); if\(sc\) all\.push\(\[sc,it\]\);/.test(s);
ok('a picture from the NASA library is shown only if its title, keywords or description name the object', relevant(SRC));
const m1 = SRC.replace("'https://esahubble.org/images/archive/search/?q='", "'https://example.com/images/?q='");
const m2 = SRC.replace('if(HCC_STAND) return;          /* standing on another star', 'if(false) return;          /* standing on another star');
ok('mutations are caught: an unofficial host, and a scale chain that drags the camera home', !media(m1).official && !stand(m2));
const m3 = SRC.replace("registerSel(key,{name:sky3dConName(con),mode:'solar',labelEl:l.element,media:hccConMedia(con),", "registerSel(key,{name:sky3dConName(con),mode:'solar',labelEl:l.element,");
const m4 = SRC.replace('const sc=hits(it); if(sc) all.push([sc,it]);', 'const sc=1; all.push([sc,it]);');
const m5 = SRC.replace("gam:'Gamma',del:'Delta'", "gam:'Gamma',del:'Delt'");
ok('MUTATIONS — a translated constellation label, every picture kept whatever it shows, and a misspelled Greek letter are each caught',
  !untranslated(m3) && !relevant(m4) && (() => { const n = names(SRC.replace("del:'Delta',eps", "del:'Delt',eps")); return !n || n.spell('Del Ori') !== 'Delta Orionis'; })());
console.log('\n  ' + pass + ' passed, ' + fail + ' failed'); process.exit(fail ? 1 : 0);
