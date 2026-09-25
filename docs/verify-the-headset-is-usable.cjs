#!/usr/bin/env node
'use strict';
/* ══ THE HEADSET IS USABLE — MEASURED IN AN EMULATED QUEST 3 ═══════════════════════
 * "The panels stick together, mode switching is bad, the Solar System has to be redone."
 * Each complaint was measured before it was fixed (scripts/xr-audit.mjs drives the atlas in
 * IWER's emulated Meta Quest 3 and writes docs/xr-audit.json), and this file checks the fix:
 *   1. THE GHOST: a panel whose canvas changed height kept its first GPU allocation, so the
 *      old layout stayed visible under the new one — a new size must be a new texture
 *   2. NO OVERLAP: in every world, with five content windows opened at once, no two content
 *      panels overlap in the reader's view — recomputed here from the raw angular rectangles,
 *      not taken from the audit's own count (the wrist menu is the reader's hand and exempt)
 *   3. LEGIBLE: body text subtends at least 1.0° at the eye in every window (it was ~0.5°)
 *   4. ONE WINDOW, TABS FOR THE REST: the dock shows one content window and a tab strip
 *   5. THE ORRERY: in the Solar world the system stands in front of the reader at 1 AU = 2 m
 *      with the Sun ~3.4 m ahead at waist height, guides larger than the room are hidden and
 *      the planets are named; in every other world the group is back at scale 1
 *   6. MODE SWITCHING: all seven worlds entered in one session without an error, the old
 *      world's card closed on the way, Controls re-read for the new world
 *   7. THE FIELD LAB in VR carries its own controls (equations, presets, structure, SOR, T_c)
 *   8. MUTATIONS: a fan that places two windows 0.3 m apart at 1.1 m, and a panel 0.5 m wide at
 *      1.27 m, are each caught by the same checks
 */
const fs = require('node:fs'), path = require('node:path');
const SRC = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const A = JSON.parse(fs.readFileSync(path.join(__dirname, 'xr-audit.json'), 'utf8'));
let pass = 0, fail = 0;
const ok = (n, c, d) => { if (c) { pass++; console.log('  PASS — ' + n + (d ? ' :: ' + d : '')); } else { fail++; console.log('  FAIL — ' + n + (d ? ' :: ' + d : '')); } };
const overlaps = P => { const out = []; for (let i = 0; i < P.length; i++) for (let j = i + 1; j < P.length; j++) { const a = P[i], b = P[j];
  if (a.name === 'menu' || b.name === 'menu') continue;
  const ox = Math.min(a.az[1], b.az[1]) - Math.max(a.az[0], b.az[0]), oy = Math.min(a.el[1], b.el[1]) - Math.max(a.el[0], b.el[0]); if (ox > 0 && oy > 0) out.push(a.name + '×' + b.name); } return out; };
const content = w => w.panels.filter(p => p.name !== 'menu' && p.name !== 'tabs');

/* 1 · the ghost */
ok('the ghost panel: a canvas that changes height gets a NEW texture, so no earlier layout can show through',
  /if\(this\.canvas\.height!==h\)\{ this\.canvas\.height=h; this\.tex\.dispose\(\); this\.tex=new THREE\.CanvasTexture\(this\.canvas\);/.test(SRC) && /this\.mat\.map=this\.tex; this\.mat\.needsUpdate=true;/.test(SRC));

/* 2 · no overlap, recomputed */
const all = A.worlds.map(w => ({ w: w.world, o: overlaps(w.panels), n: w.panels.length }));
ok('no two content windows overlap in the reader\'s view, in any of the worlds, with five windows opened at once — recomputed from the raw angular rectangles',
  A.presenting === true && A.worlds.length >= 7 && all.every(x => x.o.length === 0) && A.worlds.every(w => w.audit.counted === 0), all.map(x => `${x.w}: ${x.o.length}`).join(' · '));

/* 3 · legible */
const txt = A.worlds.map(w => Math.min(...content(w).map(p => p.textDeg)));
ok('legible: body text subtends at least 1.0° at the eye in every content window of every world (it was ~0.5°)', txt.every(t => t >= 1.0), `smallest ${Math.min(...txt).toFixed(2)}°`);

/* 4 · one window, tabs */
ok('one content window at a time, the others one press away on a tab strip riding above it',
  A.worlds.every(w => content(w).length === 1 && w.panels.some(p => p.name === 'tabs')) && /function dockActivate\(p\)\{/.test(SRC) && /const tabPanel    = new XRPanel\(1\.0, 1000, \.14\);/.test(SRC));

/* 5 · the orrery */
const sol = A.worlds.filter(w => w.world === 'solar'), other = A.worlds.filter(w => w.world !== 'solar');
ok('the orrery: in the Solar world 1 AU = 2 m with the Sun ~3.4 m ahead at waist height, oversized guides hidden and the planets named; elsewhere the group is back at scale 1',
  sol.every(w => w.qa.orrery.key === 'inner' && w.qa.orrery.k === 2 && Math.abs(w.qa.orrery.sun[2] + 3.4) < 0.05 && Math.abs(w.qa.orrery.sun[1] - 1) < 0.01 && w.qa.orrery.hidden > 0 && w.qa.orrery.labels >= 8)
  && other.every(w => w.qa.orrery.k === 1 && w.qa.orrery.key === null) && /const ORRERY=\{inner:\{k:2\.0,sun:3\.4,y:1\.0\}, outer:\{k:0\.22,sun:7\.4,y:1\.0\}, kuiper:\{k:0\.1,sun:5\.8,y:1\.0\}\};/.test(SRC),
  sol.map(w => JSON.stringify(w.qa.orrery)).join(' '));

/* 6 · mode switching */
ok('mode switching: all worlds entered in one session with no page error; the old world\'s card closes, Controls and Status are re-read',
  A.errors.filter(e => !/Failed to fetch/.test(e)).length === 0 && new Set(A.worlds.map(w => w.world)).size >= 7
  && /if\(cardPanel\.visible\|\|cardPanel\._tabHidden\) dockClose\(cardPanel\);/.test(SRC) && /for\(const q of \[ctrlPanel,statusPanel\]\) if\(q\.visible\) dockRefresh\(q\);/.test(SRC)
  && /if\(state\.mode==='solar'&&m!=='solar'\) orreryRestore\(\);/.test(SRC));

/* 7 · the field lab in VR */
ok('the Field Laboratory carries its own controls in the headset: eight equations, presets, run, structure, slice, SOR and the critical point',
  /else if\('field'===state\.mode\)\{/.test(SRC) && /\['ising','Ising'\]\];/.test(SRC) && /label:'⚡ Solve to convergence \(SOR\)'/.test(SRC) && /label:'⊙ Measure the critical point'/.test(SRC));

/* 8 · mutations */
{ const fan = [{ name: 'card', az: [-20, 5], el: [-10, 10] }, { name: 'status', az: [-2, 22], el: [-5, 8] }];
  ok('MUTATION — a fan placing two windows 0.3 m apart at 1.1 m overlaps and is caught', overlaps(fan).length === 1);
  const oldDeg = Math.atan((0.5 * 19 / 820) / 1.27) * 180 / Math.PI;
  ok('MUTATION — the old panel, 0.5 m wide at 1.27 m, puts body text at ' + oldDeg.toFixed(2) + '° and is caught by the 1.0° floor', oldDeg < 1.0); }

console.log('\n  ' + pass + ' passed, ' + fail + ' failed'); process.exit(fail ? 1 : 0);
