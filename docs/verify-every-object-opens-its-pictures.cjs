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
 * 3. MUTATIONS are caught */
const fs = require('node:fs'), path = require('node:path');
const SRC = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
let pass = 0, fail = 0;
const ok = (n, c, d) => { if (c) { pass++; console.log('  PASS — ' + n + (d ? ' :: ' + d : '')); } else { fail++; console.log('  FAIL — ' + n + (d ? ' :: ' + d : '')); } };
const between = (s, a, b) => { const i = s.indexOf(a), j = s.indexOf(b, i); return i < 0 || j < 0 ? '' : s.slice(i, j); };
const OFFICIAL = ['images-api.nasa.gov', 'images.nasa.gov', 'esahubble.org', 'esawebb.org', 'www.eso.org', 'science.nasa.gov', 'eyes.nasa.gov'];
function media(src) { const m = between(src, 'function hccMediaOpen(key){', 'globalThis.HCC_MEDIA=');
  const hosts = [...m.matchAll(/https:\/\/([a-z0-9.-]+)\//g)].map(x => x[1]);
  return { m, hosts, official: hosts.length >= 7 && hosts.every(h => OFFICIAL.includes(h)),
    honest: /could not be reached from this browser/.test(m) && /the atlas does not guess one/.test(src) && /if\(\/\^HIP \\d\+\$\/\.test\(q\)\) return '';/.test(src) }; }
function stand(src) { return /const HCC_SUN_M=4\.83;/.test(src) && /const cam=p\.clone\(\)\.addScaledVector\(back,0\.03\*ZOD3D_PC_AU\);/.test(src)
  && /if\(HCC_STAND\) return;          \/\* standing on another star/.test(src) && /if\(hccStandable\(key\)\) acts\.unshift\(/.test(src); }
const M = media(SRC);
ok('photographs and 3D come only from the agencies\' own archives', M.official, [...new Set(M.hosts)].join(' · '));
ok('and a failure to reach them is said, and a star with no searchable name gets no invented query', M.honest);
ok('any star with a measured distance can be stood on: the camera at its position looking back, the Sun at M = 4.83, the scale chain held', stand(SRC));
const m1 = SRC.replace("'https://esahubble.org/images/archive/search/?q='", "'https://example.com/images/?q='");
const m2 = SRC.replace('if(HCC_STAND) return;          /* standing on another star', 'if(false) return;          /* standing on another star');
ok('mutations are caught: an unofficial host, and a scale chain that drags the camera home', !media(m1).official && !stand(m2));
console.log('\n  ' + pass + ' passed, ' + fail + ' failed'); process.exit(fail ? 1 : 0);
