#!/usr/bin/env node
'use strict';
/* ══ THE CYCLES WORLD, IN ORDER — AND ITS SECTIONS ═════════════════════════════════════════
 * v4.340 made the Cycles world strict and gave its clocks a phase space with sections. Checked:
 *   1. one order: the view table IS the concatenation of the numbered groups (0 · I · II · III · IV), the <select>
 *      is generated from that table rather than typed a second time, and every one of the fourteen frames says
 *      what it is
 *   2. one set of constants and one phase: the month and the year are the CYC_* constants, the Metonic cycle is
 *      19 tropical years by construction, the dashboard families partition the cycles and each says what KIND of
 *      number its period is; the linked view reads the same phase as the torus and the dashboard
 *   3. the Antikythera dials anchored: every eclipse in the catalogue falls inside the window its Saros pointer
 *      glows in, and the window is selective (under a third of all new moons)
 *   4. the three-distance theorem on the Poincaré sections of the atlas's cycle pairs: never more than three gap
 *      lengths, the longest the sum of the other two; the Metonic 19/235 among the convergents of the month/year ρ
 *   5. the Saros found, not told: the best return of the Moon's (node, apsis) section is lunation 223 from any of
 *      several epochs; the Inex, 358, lands on the opposite node
 *   6. wired: the section and Saros panels, the family dashboard, the collapsed observatory, ledger and tracks
 */
const fs = require('node:fs'), path = require('node:path');
const SRC = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
let pass = 0, fail = 0;
const ok = (n, c, d) => { if (c) { pass++; console.log('  PASS — ' + n + (d ? ' :: ' + d : '')); } else { fail++; console.log('  FAIL — ' + n + (d ? ' :: ' + d : '')); } };
(async () => {
  const K = await import(path.join(__dirname, '..', 'core', 'atlas', 'extracted.mjs'));
  const { HCC_CYCLE_GROUPS: G, HCC_CYCLE_VIEWS: V, CYCLES, CYCLE_FAMILIES: FAM, cycleKind, cycMeanElements, cycEclipseWindow, cycSarosSection, cycStrobe, cycConvergents, ECLIPSES, DISCOVERIES, discoveryTrack, trackRun } = K;
  { const order = G.flatMap(g => g.frames), views = V.map(v => v[0]), notes = SRC.slice(SRC.indexOf('<div class="note" style="font-size:10.5px;color:var(--gold-2)">${({'), SRC.indexOf('})[state.cycFrame]||\'\'}</div>'));
    const noted = views.filter(v => new RegExp('\\n\\s*' + (v.includes('-') ? `'${v}'` : v) + ':TT\\(').test(notes));
    ok('one order: the view table is the concatenation of the numbered groups, the <select> is generated from it, and all fourteen frames say what they are',
      order.join() === views.join() && views.length === 14 && G.map(g => g.t.en.split(' · ')[0]).join() === '0,I,II,III,IV' && /<select id="cycFrame"[\s\S]{0,200}HCC_CYCLE_GROUPS\.map\(g=>`<optgroup/.test(SRC) && !/<option value="hierarchy" \$\{state\.cycFrame==='hierarchy'/.test(SRC) && noted.length >= 13,
      `${G.map(g => g.t.en.split(' — ')[0] + ' (' + g.frames.length + ')').join(' · ')} · notes for ${noted.length}${noted.length < 14 ? ' (+ butterfly-explorer carries its own controls)' : ''}`); }
  { const by = k => CYCLES.find(c => c.key === k), keys = CYCLES.map(c => c.key), fam = FAM.flatMap(f => f.keys), kinds = new Set(CYCLES.map(cycleKind));
    const phaseOne = /function cycLinkedPhaseOf\(c\)\{[\s\S]{0,700}?return cyclePhase\(c,state\.epochDays\);/.test(SRC) && /const ph=\(c,d\)=>cyclePhase\(c,d\)/.test(SRC);
    ok('one set of constants and one phase: month and year are the CYC_* constants, Metonic is 19 years by construction, the families partition the cycles and name their kind',
      by('moon').days === 29.530588853 && by('year').days === 365.24219 && by('metonic').days === 19 * by('year').days && by('metonic').constructedFrom.key === 'year'
      && fam.length === keys.length && new Set(fam).size === fam.length && keys.every(k => fam.includes(k)) && [...kinds].every(k => ['measured', 'derived', 'defined', 'predicted', 'approximate', 'model'].includes(k)) && phaseOne
      && /const ANTIK=\{ year:CYC_TROPICAL_Y, sidMonth:CYC_SIDEREAL_M, synMonth:CYC_SYNODIC/.test(SRC) && !/ANTIK_NODECYC=6798/.test(SRC),
      `${FAM.map(f => f.id + ' ' + f.keys.length).join(' · ')} · kinds: ${[...kinds].join(', ')} · Metonic ${by('metonic').days.toFixed(4)} d vs 235 months ${(235 * by('moon').days).toFixed(4)} d`); }
  { const jd = d => (d instanceof Date ? d.getTime() : Date.parse(d)) / 86400000 + 2440587.5 - 2451545, hits = ECLIPSES.filter(e => cycEclipseWindow(jd(e.date || e[0])).solar).length;
    let nm = 0, lit = 0; const E0 = cycMeanElements(jd('2024-01-01T00:00Z')), t0 = jd('2024-01-01T00:00Z') - E0.D / 360 * 29.530588853; for (let k = 0; k < 150; k++) { nm++; if (cycEclipseWindow(t0 + k * 29.530588853).solar) lit++; }
    ok('the Antikythera dials anchored: every eclipse in the catalogue falls inside the window the Saros pointer glows in, and the window is selective',
      hits === ECLIPSES.length && ECLIPSES.length >= 15 && lit / nm < 1 / 3 && /function antikUpdate\(days\)\{\n\s*const E=cycMeanElements\(days\)/.test(SRC) && /const W=cycEclipseWindow\(days\), hot=W\.solar\|\|W\.lunar/.test(SRC),
      `${hits} of ${ECLIPSES.length} catalogued eclipses in the window · lit at ${lit} of ${nm} new moons 2024–2036`); }
  { const keys = ['moon', 'draconic', 'anomalistic', 'sidmonth', 'year', 'sidyear', 'nodyear', 'saros', 'inex', 'metonic', 'solar', 'hale', 'obliq', 'prec', 'eccS', 'eccL', 'mercperi', 'gal'], C = keys.map(k => CYCLES.find(c => c.key === k));
    let n = 0, bad = 0, worst = 0, skipped = 0; for (const a of C) for (const b of C) { if (a === b) continue; if (a.days * 400 / b.days > 1e8) { skipped++; continue; } for (const N of [7, 50, 223, 400]) { n++; const S = cycStrobe(a, b, N, 1234.5); if (!S.three) bad++; if (S.gaps.length === 3) worst = Math.max(worst, S.sumRule); } }
    const my = cycStrobe(CYCLES.find(c => c.key === 'moon'), CYCLES.find(c => c.key === 'year'), 50, 0), conv = cycConvergents(my.rho, 8).map(c => c.p + '/' + c.q);
    ok('the three-distance theorem on every section: never more than three gap lengths, the longest the sum of the other two; 19/235 among the convergents of the month/year ρ',
      bad === 0 && n === 1068 && skipped === 39 && worst < 1e-7 && conv.includes('19/235'), `${n} sections on ${n / 4} pairs (${skipped} beyond double precision) · worst sum rule ${worst.toExponential(1)} · convergents ${conv.slice(0, 7).join(', ')}`); }
  { const bests = [0, 5000, -20000, 123456].map(ep => { const S = cycSarosSection(900, ep); const b = S.ret.reduce((m, r) => { const d = Math.hypot(r.dF, r.dM); return d < m.d ? { k: r.k, d } : m; }, { k: 0, d: Infinity }); return { k: b.k, inex: S.ret[357].dFopp * 360 }; });
    ok('the Saros found, not told: from any of four epochs the best return of the (node, apsis) section is lunation 223, and the Inex lands on the opposite node',
      bests.every(b => b.k === 223 && b.inex < 0.1), bests.map(b => `223? ${b.k} · Inex ${b.inex.toFixed(3)}°`).join(' | ')); }
  { const led = ['sarosInSection', 'threeGaps', 'antikytheraAnchored'].every(id => DISCOVERIES.some(d => d.id === id && d.domain === 'time' && d.verifier === 'docs/verify-the-cycles-in-order.cjs')), tr = ['sarosInSection', 'threeGaps'].every(id => trackRun(discoveryTrack(id)).ok);
    ok('wired: the section and Saros panels in their frames, the family dashboard, the observatory collapsed where it is not the subject, the ledger and its tracks',
      led && tr && /\$\{state\.cycFrame==='phase'\?cycSectionPanelHTML\(\):''\}/.test(SRC) && /\$\{state\.cycFrame==='resonance'\?cycSarosPanelHTML\(\):''\}/.test(SRC) && /CYCLE_FAMILIES\.map\(f=>/.test(SRC)
      && /<details class="sect" \$\{\['phase','linked','resonance','chronometry'\]\.includes\(state\.cycFrame\)\?'open':''\}>/.test(SRC) && /cycPhaseInst\.add\(cycSectionRing,cycSectionPts\)/.test(SRC) && /cycSarosInst\.add\(sarosSectionGrp\)/.test(SRC),
      `ledger ${led ? '3 entries' : 'MISSING'} · tracks ${tr ? 'replay' : 'FAIL'}`); }
  console.log('\n  ' + pass + ' passed, ' + fail + ' failed'); process.exit(fail ? 1 : 0);
})();
