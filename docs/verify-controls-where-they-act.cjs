#!/usr/bin/env node
'use strict';
/* ══ A CONTROL THAT CANNOT ACT IS NOT A CONTROL, IT IS A RUMOUR ═══════════════
 *
 * The panel had grown a footer headed "Scale chain" holding nine controls, of
 * which ONE was about the scale chain. The other eight were a dimension lattice,
 * a curvature band, a blast wave and its two sliders, a diffusion marker, a panel
 * theme and free flight — four unrelated concerns under a heading that named a
 * ninth of its own contents.
 *
 * Worse, the footer is appended in EVERY world. Six of the nine could only act in
 * one world each, so across six worlds they were rendered thirty-six times and
 * could act six. A reader in the Solar System was offered a blast wave, ticked
 * it, and nothing happened anywhere — with nothing to say why.
 *
 * WORSE STILL, THE INTERFACE CONTRADICTED THE MODEL. Three instruments share the
 * Field Lab volume and exactly one is drawn. The guard enforced that by RANKING
 * two independent booleans:
 *
 *     const blast = !!state.blastWave && inField;
 *     const dims  = !blast && !!state.dimSpace && inField;
 *
 * and the panel drew those two booleans as two independent checkboxes. Tick both
 * and the dimension lattice lost silently, its checkbox still ticked, nothing on
 * screen, nothing explaining it. The precedence was not the fix — it was the
 * symptom of a state that could hold a contradiction.
 *
 * So: one selector replaces the two flags, one radio group replaces the two
 * checkboxes, sub-controls appear only under the instrument they belong to, and
 * every world-specific control moved to the world that draws it. This file holds
 * that shape in place.
 */
const fs = require('node:fs'), path = require('node:path');
const ROOT = path.join(__dirname, '..');
const src = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
let pass = 0, fail = 0;
const ok = (n, c, d) => { if (c) { pass++; console.log('  PASS — ' + n + (d ? ' :: ' + d : '')); }
  else { fail++; console.log('  FAIL — ' + n + (d ? ' :: EXPECTED ' + d : '')); } };
/* the end marker is searched for AFTER the start marker ends, not from the start
 * marker itself — the mode branches all begin `else if(state.mode===`, so cutting
 * from one to the next found the SAME string and returned an empty slice. Three
 * checks then failed against correct code, which is the right direction to fail
 * in but still a defect in the check. */
const cut = (a, b) => { const i = src.indexOf(a);
  if (i < 0) throw new Error('start marker not found: ' + a.slice(0, 40));
  const j = src.indexOf(b, i + a.length);
  if (j < 0) throw new Error('end marker not found: ' + b.slice(0, 40));
  return src.slice(i, j); };

/* 1 ── the state cannot hold a contradiction any more */
{ ok('the two booleans that could disagree are gone, replaced by one selector',
    !/state\.blastWave\s*[=;)]/.test(src.replace(/\/\*[\s\S]*?\*\//g, ''))
    && !/state\.dimSpace\s*[=;)]/.test(src.replace(/\/\*[\s\S]*?\*\//g, ''))
    && /fieldInstrument:'solver'/.test(src)
    && /const FIELD_INSTRUMENT_IDS=Object\.freeze\(FIELD_INSTRUMENTS\.map\(i=>i\.id\)\);/.test(src),
    'state.blastWave and state.dimSpace appear only inside comments recording what they were');

  const guard = cut('function fieldWorldApply(modeNow){', '\n}');
  ok('and the guard no longer ranks anything, because there is nothing left that can conflict',
    /const pick=FIELD_INSTRUMENT_IDS\.includes\(state\.fieldInstrument\)\?state\.fieldInstrument:'solver';/.test(guard)
    && /const blast=inField&&pick==='blast';/.test(guard)
    && /const dims=inField&&pick==='dims';/.test(guard)
    /* the first form of this forbade the substring `!blast&&` anywhere in the
       guard and flagged `fieldGroup.visible=inField&&!blast&&!dims`, which is
       correct code: the solver lattice IS what is shown when neither of the
       other two is. What must not come back is `dims` being DEFINED in terms of
       `blast`, which is the ranking itself. */
    && !/const dims\s*=\s*!blast/.test(guard),
    'precedence was the symptom of a state that could hold a contradiction, not the fix for it');

  ok('an unknown selector value falls back rather than drawing nothing at all',
    /FIELD_INSTRUMENT_IDS\.includes\(state\.fieldInstrument\)\?state\.fieldInstrument:'solver'/.test(guard),
    'a persisted state from an older build must not leave the volume empty');
}

/* 2 ── the chooser is one group over the same ids the guard reads */
{ const panel = cut('function fieldInstrumentPanelHTML(){', '\n}');
  ok('the three instruments are one radio group, over the same registry the guard reads',
    /const FIELD_INSTRUMENTS=Object\.freeze\(\[/.test(src)
    && (src.match(/\{id:'(solver|dims|blast)'/g) || []).length === 3
    && /data-field-inst="\$\{i\.id\}"/.test(panel)
    && /i\.id===pick\?'on':''/.test(panel),
    'the control and the guard cannot name different instruments, because they read one list');

  ok('and its sub-controls appear only under the instrument they belong to',
    /const sub=pick==='blast'\?/.test(panel)
    && panel.indexOf('id="blastPreset"') > panel.indexOf("pick==='blast'")
    && panel.indexOf('id="blastT"') > panel.indexOf("pick==='blast'")
    && panel.indexOf('id="diffMarkOn"') > panel.indexOf("pick==='blast'"),
    'a slider for a thing that is not on screen is a slider that does nothing');

  ok('the diffusion marker is disabled, with a reason, when the solver is not the heat equation',
    /id="diffMarkOn"[^>]*\$\{\(state\.fieldModel\|\|'heat'\)==='heat'\?'':'disabled'\}/.test(panel)
    && /The diffusion marker needs the heat equation/.test(panel)
    && /a law drawn against the wrong solver would be a picture of nothing/.test(panel),
    'disabled and explained beats absent, because absent teaches the reader nothing about why');
}

/* 3 ── every world-specific control is rendered only in its world */
{ /* the Field Lab branch of buildCtlBody, and the Observable branch */
  const fieldBranch = cut("else if(state.mode==='field'){", "else if(state.mode===");
  const obsBranch = cut("else if(state.mode==='obs'){", "else if(state.mode===");
  ok('the instrument chooser is rendered from the Field Lab branch and from nowhere else',
    /\$\{fieldInstrumentPanelHTML\(\)\}/.test(fieldBranch)
    && (src.match(/\$\{fieldInstrumentPanelHTML\(\)\}/g) || []).length === 1,
    'it used to be appended in every world, so five of six offers could not act');
  ok('and the curvature band is rendered from the Observable branch and from nowhere else',
    /\$\{curvatureBandPanelHTML\(\)\}/.test(obsBranch)
    && (src.match(/\$\{curvatureBandPanelHTML\(\)\}/g) || []).length === 1,
    'the band draws into obsGroup, so offering it anywhere else was offering nothing');

  /* the appended footer must carry ONLY things that act everywhere */
  const footer = cut("ctl.insertAdjacentHTML('beforeend', `", '`);');
  const worldOnly = ['quantShellsOn', 'blastPreset', 'blastT', 'diffMarkOn', 'data-field-inst'];
  const leaked = worldOnly.filter(id => footer.includes(id));
  ok('the global footer carries only controls that act in every world',
    leaked.length === 0
    && footer.includes('id="scaleChainAll"') && footer.includes('id="freeFly"')
    && footer.includes('id="luxHolo"'),
    leaked.length ? `LEAKED: ${leaked.join(', ')}` : 'the scale chain, free flight and the panel theme — three things, and all three reach every world');

  ok('and its heading names what is under it rather than one ninth of it',
    /<b>Navigation &amp; appearance<\/b>/.test(footer)
    && !/<b>Scale chain<\/b>/.test(src),
    'a heading that names a fraction of its contents is a heading that misleads about the rest');
}

/* 4 ── the consequences of a control are written beside the control */
{ const band = cut('function curvatureBandPanelHTML(){', '\n}');
  ok('the curvature band states its own side effects, which are not obvious from ticking it',
    /the zoom ceiling opens to/.test(band) && /the automatic hand-off to the S³ carrier is suspended/.test(band),
    'turning it on moves the ceiling and suspends a hand-off — a control with hidden consequences is one the reader finds out about by accident');
  ok('and it carries the conditioning rather than only the radius',
    /central sign OPEN/.test(band) && /Not a detection/.test(band)
    && /\$\{\(100\*S3R\.pClosed\)\.toFixed\(2\)\}% of it/.test(band),
    'a radius shown without the 1.39% it is conditioned on is the misleading number the source spends a section warning about');
  ok('the scaling bench says where its drawing appears, since its text answer works everywhere but its loop does not',
    /the group is also drawn as a gold loop in the Field Lab's dimension lattice/.test(src),
    'a control whose output is partly invisible from here must say so, or the reader concludes it is broken');
}

console.log(`\n  ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
