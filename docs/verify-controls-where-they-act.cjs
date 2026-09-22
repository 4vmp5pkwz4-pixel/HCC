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

/* 5 ── a panel you scroll is a panel you search by hand */
{ const fin = cut('function ctlApplyFilter(root){', '\nfunction ctlFinderHTML');
  ok('the controls panel can be filtered, and the filter reads the body as well as the heading',
    /const hit=\(sect\.textContent\|\|''\)\.toLowerCase\(\)\.includes\(q\);/.test(fin)
    && /sect\.style\.display=hit\?'':'none';/.test(fin),
    'a reader looking for a control knows what it DOES, not which section somebody filed it under — so "diffusivity" has to find it inside "Physical coefficients"');

  ok('a match opens itself, so the hit is visible rather than merely present',
    /if\(hit\)\{ shown\+\+; sect\.classList\.remove\('collapsed'\); \}/.test(fin),
    'a filter that leaves the one matching section folded has answered the question and hidden the answer');

  /* ── THIS CHECK PASSED ON BROKEN BEHAVIOUR ─────────────────────────────────
     It asserted that the two strings appeared: the `foldWas===undefined` record
     and the `toggle('collapsed', foldWas==='1')` restore. Both did. But the
     restore ran UNCONDITIONALLY in the no-query branch, so on a freshly rebuilt
     panel — where foldWas is undefined — it evaluated false and unfolded every
     section, overwriting the state the accordion had restored from SECT_STATE
     two lines earlier.
     MEASURED: fold everything in the Field Lab (10 of 10, 509 px), leave the
     world, come back — 0 of 10, 3074 px. The presence of a line is not the
     behaviour of a line, which is the whole defect this file exists to catch, and
     I committed one. The check now requires the restore to be GUARDED. */
  ok('and clearing it restores the fold state the reader left, rather than a default',
    /if\(sect\.dataset\.foldWas!==undefined\)\{/.test(fin)
    && /sect\.classList\.toggle\('collapsed', sect\.dataset\.foldWas==='1'\);/.test(fin)
    && /delete sect\.dataset\.foldWas;/.test(fin)
    && /A lens that rewrites what it looks at is not a lens/.test(src),
    'the filter is a lens, not an edit — if it never touched a section\'s fold it has nothing to give back, and touching it anyway destroyed the persisted state on every rebuild');

  ok('filtering to nothing says so, instead of leaving a bare bar over an empty panel',
    /No section in this world mentions/.test(src)
    && /nothing has been turned off/.test(src),
    'an empty panel under a filter bar looks exactly like a panel that has broken');

  ok('the filter is never persisted, because a panel that came back filtered is a panel with controls missing and no sign of why',
    !/SECT_STATE\.set\([^)]*CTL_FIND/.test(src)
    && !/localStorage[^;]*ctlFind/i.test(src)
    && /the filter is never persisted/.test(src),
    'fold state persists and is discoverable from the chevron; a hidden filter is neither');

  ok('folding every section writes through to the persisted state, or the next rebuild would undo it',
    /SECT_STATE\.set\('ctl\|'\+state\.mode\+'\|'\+head\.textContent\.trim\(\), on\?'0':'1'\)/.test(src),
    'a fold-all that lasts until the next re-render is a fold-all that does not work');

  ok('the bar is mounted where every rebuild passes, not in one of the dozen callers that rebuild the panel',
    /if\(id==='ctl' && !p\.querySelector\(':scope > \.ctlFind'\)\)\{/.test(src)
    && /it is the one place that sees\s*\n\s+them all/.test(src),
    'a bar installed by one caller is a bar that disappears when any of the others runs');
}

{ const fin = cut('function ctlApplyFilter(root){', '\nfunction ctlFinderHTML');
  ok('the filter comes off when the world changes, because it is a lens on what is in front of you',
    /if\(CTL_FIND\.mode!==nowMode\)\{/.test(fin)
    && /CTL_FIND\.q='';/.test(fin)
    && /Changing world replaces what the lens is pointed at, so the\s*\n\s+lens comes off/.test(src),
    'MEASURED before: typing "coefficients" in the Field Lab and switching to Solar left 0 of 13 sections showing — a panel the reader did not empty');

  ok('and it reads the mode through a guard, because this runs inside a const\'s temporal dead zone at boot',
    /let nowMode=null; try\{ nowMode=state\.mode; \}catch\(e\)\{ nowMode=CTL_FIND\.mode; \}/.test(fin)
    && /took the\s*\n\s+whole page down the first time this line was written without the try/.test(src),
    'touching a const in its TDZ throws a ReferenceError rather than giving undefined — the first version of the world-switch clear killed the page, and only a boot run caught it');

  ok('but it survives a panel rebuild, which is a different thing entirely',
    /if\(id==='ctl'\) try\{ ctlApplyFilter\(p\); \}catch\(e\)\{\}/.test(src)
    && /re-applied to the new ones or the panel silently un-filters itself/.test(src),
    'a rebuild replaces the sections under the same filter; a world switch replaces what the filter is about');
}

/* ── AND THEN A THIRD THING WANTED THE SAME LINE ────────────────────────────
   The z fight between the grip and the filter bar was settled by giving them two
   different sticky tops in the same scroller. Then the panel header rail arrived,
   sticky at the top of that same scroller and opaque, and painted over both: the
   filter bar's fold controls measured 299 px² under the pin in 35 of 42 states,
   and the grip was under an opaque background again — the exact fault its own
   comment records being fixed once before. Three things claiming one line is not
   settled by a third top; it is settled by there being ONE line. The grip joins
   the rail and takes the width the buttons do not, and the filter bar starts
   where the rail ENDS, at a height that is declared rather than guessed. */
{ ok('the phone sheet\'s drag handle shares the header rail with the panel buttons instead of fighting it for the same sticky line, and the filter bar starts where that rail ends',
    /const PANEL_RAIL_ROLES=\['sheetGrip','closeBtn','foldBtn','pinBtn','panel-collapser'\];/.test(src)
    && /\.panel \.panelRail > \.sheetGrip, \.panelRail > \.sheetGrip\{\s*\n\s+order:0;flex:1 1 auto!important/.test(src)
    && /#ctl \.ctlFind\{top:calc\(var\(--hdr-btn\) \+ 10px\);z-index:6\}/.test(src)
    && /a covered handle is a sheet\s*\n\s+that cannot be resized/.test(src),
    'one header line: the grip stretches, the buttons sit at its right-hand end, and the filter bar begins below it');

  ok('and the rule that placed the grip on its own still stands underneath, so a run in which the adoption pass never fires degrades to the geometry it replaced rather than to nothing',
    /#ctl \.sheetGrip\{display:block;position:sticky;top:-14px;z-index:8;/.test(src)
    && /If the adoption pass never runs the buttons keep their corner and the old\s*\n\s+geometry/.test(src),
    'a fallback that is worse is still a fallback; a fallback that is nothing is a blank header');

  ok('and the source says this one was reasoned rather than measured, because the mobile path is unreachable headlessly',
    /This could not be\s*\n\s+exercised headlessly: MOBILE_GPU is a device-capability flag, not a\s*\n\s+viewport width/.test(src)
    && /The\s*\n\s+geometry is therefore reasoned from these two rules, not measured/.test(src),
    'a probe at 400px reported grip:null — the sheet never builds in the test browser, and claiming a measurement that did not happen is worse than admitting the gap');
}

{ const sel = cut('function ctlSections(root){', '\nfunction ctlApplyFilter');
  ok('the filter reaches every section, at whatever depth somebody nested it',
    /root\.querySelectorAll\('\.sect'\)/.test(sel)
    && /!el\.parentElement\.closest\('\.sect'\)/.test(sel)
    && !/:scope > \.sect/.test(sel),
    'MEASURED in S³: a bare div of 5087 px stood between the panel and six of its sections — 68% of the panel, outside a `:scope > .sect` selector entirely, so fold-all left it at 5992 px while every other world dropped under 1100 and the filter could hide none of it');

  ok('and a section inside a section still folds with its parent rather than being pulled out of it',
    /!el\.parentElement\.closest\('\.sect'\)/.test(sel)
    && /Nesting is still respected/.test(src),
    'depth is somebody\'s markup decision; it is not a statement about which controls the reader wants hidden');
}

/* 5b ── an instrument with no switch at all */
{ const eng = cut('function fbsSpectroApply(){', '\n}');
  ok('the phi-ladder spectrometer has a switch, which it did not have when it was reported as a fault',
    /state\.fbsSpectro:false|fbsSpectro:false/.test(src)
    && /id="fbsSpectroOn"/.test(src)
    && /const on=!!state\.fbsSpectro&&state\.mode==='fbs';/.test(eng)
    && /fbsSpectro\.visible=on;/.test(eng),
    'it was built on entering the world and never hidden — thirty-six bars, a ring, an arrow and two labels standing permanently through the phi-shells they measure, with no way to put them away');

  ok('and it is OFF by default, because its verdict is a null result',
    /fbsSpectro:false/.test(src)
    && !/fbsSpectro:true/.test(src),
    'every bin near the same height carries one bit — nothing here — and a null result is not worth the most prominent object on the stage');

  ok('but the FINDING is not hidden with the drawing: the verdict stays in the panel either way',
    /function fbsSpectroVerdict\(\)\{/.test(src)
    && /Does the ladder mean anything\?/.test(src)
    && /The rungs are a COORDINATE, not a law/.test(src)
    && /does not survive its own test, and that is a result rather than an embarrassment/.test(src),
    'hiding a drawing must not quietly retire the measurement — the ladder of this atlas fails its own test, and that stays on the page in words');

  ok('the mount hands to that one authority rather than force-building on entry',
    /try\{ fbsSpectroApply\(\); \}catch\(e\)\{\}/.test(src)
    && !/if\(!fbsSpectro\.children\.length\) buildSpectrometer/.test(src.replace(/\/\*[\s\S]*?\*\//g,'')),
    'setMode used to build it unconditionally, which is how an instrument ends up with no off switch');
}

/* 6 ── two sections sharing a name shared their fold state */
{ ok('the duplicate S³ heading is gone, because the accordion was using the heading as a key',
    (src.match(/<b>\$\{TT\('S³ Laboratory'/g) || []).length
      + (src.match(/<b>S³ Laboratory<\/b>/g) || []).length === 1
    && /S³ laboratory views/.test(src)
    && /A duplicate label is not a\s*\n\s+cosmetic fault when something downstream is using the label as a key/.test(src),
    'the launcher and the view switcher both rendered in the S³ world under one gold title, and collapsing either wrote the other\'s state');

  ok('and the key really is the heading, which is why the collision mattered',
    /const key=id\+'\|'\+state\.mode\+'\|'\+head\.textContent\.trim\(\);/.test(src),
    'panel + mode + heading — so two headings that match are one entry');
}

console.log(`\n  ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
