#!/usr/bin/env node
'use strict';
/* ══ THE LABORATORIES READ THE ATLAS ═══════════════════════════════════════════
 * A panel audit (7 worlds × desktop and phone, every panel and dialog, every Controls and
 * Info button pressed) and a laboratory census (all 120, measured) found what this file
 * now holds fixed, and the laboratories that were thinnest were given the atlas's own
 * data. Read from index.html and COMPUTED:
 *   1. the Predictive Reach Observatory lists its controls WITH the atlas identity the
 *      reach validator requires — it failed closed in every world without it
 *   2. a long Controls label on a phone takes two lines instead of an ellipsis
 *   3. the main-sequence diagram carries the measured sky: every Hipparcos star with a
 *      good parallax and a colour, placed by T_eff (Ballesteros 2012), M_V from the
 *      parallax and the bolometric correction of Flower (1996) / Torres (2010) —
 *      checked here against the Sun (B−V 0.65 → 5778 K, BC −0.08)
 *   4. the distance-ladder laboratory carries the atlas's own Hubble diagram, and the
 *      H0 its galaxies imply is recomputed here from the embedded data — and labelled as
 *      the catalogue's calibration, not an independent ladder
 *   5. a laboratory takes its magnitude from the atlas: the picker indexes the named
 *      stars, galaxies, clusters, nebulae and quasars with their measured V
 *   6. MUTATIONS: the identity dropped, a bolometric correction of the wrong sign, and
 *      the H0 caveat removed are each caught
 */
const fs = require('node:fs'), path = require('node:path');
const SRC = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
let pass = 0, fail = 0;
const ok = (n, c, d) => { if (c) { pass++; console.log('  PASS — ' + n + (d ? ' :: ' + d : '')); } else { fail++; console.log('  FAIL — ' + n + (d ? ' :: ' + d : '')); } };
const grab = (s, re) => (s.match(re) || [])[0] || '';

/* 1 · the observatory */
const ident = s => { const calls = s.match(/hccListReachControls\([^)]*\)/g) || []; return calls.length >= 3 && calls.every(c => /,\{version:HCC_VERSION,build:HCC_BUILD\}\)$/.test(c)); };
ok('the Predictive Reach Observatory lists its controls with the atlas identity the validator requires', ident(SRC),
  `${(SRC.match(/hccListReachControls\([^)]*\)/g) || []).length} call sites, every one with {version, build}`);
/* 2 · phone labels */
ok('a long Controls label on a phone takes two lines, not an ellipsis',
  /#ctl \.ctlrow > label\{flex:0 1 auto;max-width:46%;margin:0;font-size:10\.6px;\s*line-height:1\.25;white-space:normal;overflow:hidden;display:-webkit-box;-webkit-box-orient:vertical;-webkit-line-clamp:2/.test(SRC));

/* 3 · the measured sky on the HR diagram */
const hr = s => { try { return new Function(grab(s, /function hrBallesteros\(bv\)\{[^\n]*\}/) + grab(s, /function hrBolCorr\(T\)\{[\s\S]*?return b; \}/) + ';return {T:hrBallesteros, BC:hrBolCorr};')(); } catch (e) { return null; } };
const H = hr(SRC);
const Tsun = H && H.T(0.65), BCsun = H && H.BC(5778);
ok('T_eff from B−V (Ballesteros) and the bolometric correction (Flower/Torres) give the Sun its own numbers',
  H && Math.abs(Tsun - 5778) < 5 && Math.abs(BCsun + 0.08) < 0.01 && H.BC(30000) < -2.5 && H.BC(3500) < -2,
  H ? `B−V 0.65 → ${Tsun.toFixed(0)} K · BC(5778 K) ${BCsun.toFixed(3)} · BC(30 000 K) ${H.BC(30000).toFixed(2)} · BC(3 500 K) ${H.BC(3500).toFixed(2)}` : '');
const hipJ = SRC.match(/const HCC_SKY_HIP=(\{[^\n]*\});/); const HIP = hipJ ? eval('(' + hipJ[1] + ')') : null;
let nHR = 0; if (HIP) { const b = Buffer.from(HIP.b64, 'base64'); for (let i = 0; i < HIP.count; i++) { const o = i * HIP.rec, bv = b.readInt16LE(o + 14), plx = b.readUInt32LE(o + 16) / 100, e = b.readUInt16LE(o + 20) / 1000; if (bv !== -32768 && plx > 0 && e > 0 && plx / e >= 5) nHR++; } }
ok('the main-sequence diagram carries the measured sky, on the back plane where no mass is invented',
  nHR > 14000 && /const MS=hrMeasuredStars\(\), PL=hrPlane\(\)/.test(SRC) && /mp\[i\*3\+2\]=-1\.75;/.test(SRC) && /const Mv=st\.V\+5\+5\*Math\.log10\(st\.plx\/1000\), Mbol=Mv\+hrBolCorr\(T\), L=Math\.pow\(10,-0\.4\*\(Mbol-4\.74\)\);/.test(SRC),
  `${nHR} Hipparcos stars with a colour and a parallax good to five standard errors`);

/* 4 · the atlas's Hubble diagram */
const Z = JSON.parse((SRC.match(/const DSO3D_GALZ=(\[[^\]]*\]);/) || [0, '[]'])[1]);
const G = (() => { const m = SRC.match(/const DSO3D_GAL=\{count:(\d+),sha256:'[0-9a-f]+',b64:'([A-Za-z0-9+/=]+)'\};/); const b = Buffer.from(m[2], 'base64'), out = [];
  for (let i = 0; i < +m[1]; i++) out.push(Math.pow(10, b.readUInt16LE(i * 8 + 4) / 8000 - 2) / 1000); return out; })();
const dc = z => { const n = 300, h = z / n; let s = 0; for (let i = 0; i <= n; i++) { const w = (i === 0 || i === n) ? 1 : (i % 2 ? 4 : 2); s += w / Math.sqrt(0.315 * (1 + i * h) ** 3 + 9.182e-5 * (1 + i * h) ** 4 + (1 - 0.315 - 9.182e-5)); } return 299792.458 / 67.4 * h / 3 * s; };
const r = []; Z.forEach((zz, i) => { const z = zz / 1e5; if (z > 0.01 && z < 0.08) r.push(67.4 * dc(z) / G[i]); }); r.sort((a, b) => a - b);
const H0 = r[r.length >> 1];
const caveat = s => /the catalogue\\'s calibration, not an independent ladder/.test(s) && /so this measures the CATALOGUE'S calibration/.test(s);
ok('the distance ladder carries the atlas\'s own Hubble diagram; the H0 its galaxies imply, recomputed here, is labelled the catalogue\'s calibration',
  Z.length === G.length && r.length > 2000 && H0 > 60 && H0 < 75 && caveat(SRC),
  `${Z.filter(z => z > 150).length} galaxies with a redshift · median over ${r.length} at 0.01 < z < 0.08: H0 = ${H0.toFixed(1)} km/s/Mpc (quartiles ${r[r.length >> 2].toFixed(0)}–${r[(3 * r.length) >> 2].toFixed(0)})`);

/* 5 · the picker */
const picker = s => /function atlasMagIndex\(\)\{/.test(s) && /kind:'star'/.test(s) && /kind:'galaxy'/.test(s) && /kind:'quasar'/.test(s)
  && /if\(host\) hccAtlasMagPicker\(host,h=>\{ state\.phnMag=Math\.max\(-2,Math\.min\(34,h\.V\)\);/.test(s);
ok('a laboratory takes its magnitude from the atlas: named stars, galaxies, clusters, nebulae and quasars, each with its measured V', picker(SRC));

/* 6 · mutations */
ok('MUTATION — the atlas identity dropped from one call is caught', !ident(SRC.replace('hccListReachControls(predictiveReachArtifact,{version:HCC_VERSION,build:HCC_BUILD});', 'hccListReachControls(predictiveReachArtifact);')));
const Hm = hr(SRC.replace('let b=0; for(let i=0;i<c.length;i++) b+=c[i]*Math.pow(lt,i); return b; }', 'let b=0; for(let i=0;i<c.length;i++) b-=c[i]*Math.pow(lt,i); return b; }'));
ok('MUTATION — a bolometric correction of the wrong sign is caught', Hm && Math.abs(Hm.BC(5778) + 0.08) > 0.1);
ok('MUTATION — the H0 caveat removed is caught', !caveat(SRC.replace("the catalogue\\'s calibration, not an independent ladder", 'the Hubble constant')));

console.log('\n  ' + pass + ' passed, ' + fail + ' failed'); process.exit(fail ? 1 : 0);
