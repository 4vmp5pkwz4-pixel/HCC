#!/usr/bin/env node
'use strict';
/* ══ THE CATALOGUE IS ONE TREE, AND THE LADDER STAYS IN ITS WORLD (v4.401) ═══════════════════════════════════════
 * Asked, of the S³ laboratory panel: «посмотри, как много дубликатов — зачем это? Уберись, сделай иерархию, сделай
 * хороший, удобный каталог. Только учти, чтобы из нижней панели выбора лабораторий тоже все правильно работало и
 * выбиралось»; and of the φ-ladder: the golden spiral should open the mini-panel at once, and in the Observable world
 * that panel should work there instead of throwing the reader back to the Solar System.
 * MEASURED before, in Russian: 145 laboratories in thirteen flat groups with a "start here" block above them listing
 * thirteen of them a second time; 41 rows still in English; two laboratories both called «Лестница расстояний»; a
 * header of 145, a ⊞ of 146 and a position «1 / 145»; a first ‹ › hijacked to one laboratory; the Trisphere's Controls
 * throwing a ReferenceError that left the catalogue marking the previous laboratory; and in the Observable world every
 * released drag, tap or step below 10²³ m switching the world to the Solar System.
 * Checked here, by RUNNING the catalogue's own pure functions (taken from index.html by scripts/extract-kernels.mjs)
 * and by reading the source for the wiring:
 *   1. the tree: part → section → laboratory; every laboratory of the atlas a leaf exactly once, in all three languages
 *   2. the order: chapters in reading order, domain sections alphabetical in the reader's language, the fluid first
 *   3. the names: none shared within a language, none clipped, the cosmological distances no longer a second ladder,
 *      and the name/gloss split keeps one-word heads whole
 *   4. one list, not two: no "start here" block, no synthesised English row, the bar walking the tree's leaves
 *   5. the walk: no hijacked first step, every lab-to-lab bridge through the router, the Trisphere's Controls building
 *   6. the panel: open sections remembered, the scroll kept across rebuilds, the title in the sticky rail, the catalogue
 *      beside Controls where the column above is too short, no keyboard thrown up on a touch screen, and a search
 *      that really hides what it does not match (ё = е)
 *   7. the ladder: the spiral opens the strip; in the Observable world the strip steers the Observable world, clamped
 *      to the band it shows without crossing a seam, and the world beyond is offered on a button, never forced
 */
const fs = require('node:fs'), path = require('node:path');
const SRC = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
let pass = 0, fail = 0;
const ok = (n, c, d) => { if (c) { pass++; console.log('  PASS — ' + n + (d ? ' :: ' + d : '')); } else { fail++; console.log('  FAIL — ' + n + (d ? ' :: ' + d : '')); } };
(async () => {
  const K = await import(path.join(__dirname, '..', 'core', 'atlas', 'extracted.mjs'));
  const { LAB_START, LAB_ELSEWHERE, LAB_PARTS, labSectionOf, labSectionName, labNameIn, labNameSplit, labCatalogueTree, labCatalogueOrder } = K;
  const S3 = (() => { const t = labCatalogueTree('en'); return t.flatMap(P => P.sections.flatMap(S => S.ids)).filter(id => !LAB_ELSEWHERE.some(x => x.id === id)); })();
  const LANGS = ['en', 'ru', 'de'];

  /* 1 · the tree */
  { const rows = LANGS.map(L => { const o = labCatalogueOrder(L); return { L, n: o.length, uniq: new Set(o).size, o }; });
    const base = new Set(rows[0].o), same = rows.every(r => r.n === rows[0].n && r.uniq === r.n && r.o.every(v => base.has(v)));
    const tree = labCatalogueTree('en'), parts = tree.map(P => P.id), declared = new Set(LAB_PARTS.flatMap(P => P.sections));
    const allDeclared = S3.every(id => declared.has(labSectionOf(id)));
    ok('one tree, part → section → laboratory: every laboratory of the atlas is a leaf EXACTLY ONCE — the S³ laboratories and the one that lives in another world — with the same leaves in English, Russian and German, and every section a laboratory falls into declared in a part',
      same && rows[0].n === S3.length + LAB_ELSEWHERE.length && LAB_ELSEWHERE.every(E => base.has(E.id)) && allDeclared && parts.join() === 's3,physics,research,sketch,beyond',
      `${rows.map(r => `${r.L} ${r.n} leaves (${r.uniq} distinct)`).join(' · ')} · parts ${parts.join(' → ')} · ${S3.length} in S³ + ${LAB_ELSEWHERE.map(E => E.id + ' in ' + E.world).join(', ')}`); }

  /* 2 · the order */
  { const tree = labCatalogueTree('ru'), sec = k => tree.flatMap(P => P.sections).find(S => S.id === k);
    const chapters = /const LAB_CHAPTERS=Object\.freeze\(\{\s*navier:\[([^\]]*)\],\s*s3light:\[([^\]]*)\],\s*\/\*[^*]*\*\/\s*frontier:\[([^\]]*)\]/.exec(SRC);
    const ids = s => s.split(',').map(x => x.trim().replace(/'/g, '')).filter(Boolean);
    const reading = chapters && ['navier', 's3light', 'frontier'].every((k, i) => sec(k).ids.join() === ids(chapters[i + 1]).join());
    const col = new Intl.Collator('ru', { sensitivity: 'base', numeric: true }), nm = id => labNameSplit(labNameIn(id, 'ru')).name;
    const alpha = ['geometry', 'dynamics', 'quantum', 'waves', 'thermo', 'astro'].every(k => { const s = sec(k); return s && s.ids.every((id, i) => i === 0 || col.compare(nm(s.ids[i - 1]), nm(id)) <= 0); });
    const civp = sec('research.civp'), cap = sec('research.cap');
    const sketches = tree.find(P => P.id === 'sketch').sections;
    ok('the order: the S³ chapters in the order the programme is read, the research chain in the order its argument runs, every domain section alphabetical in the reader\'s own language, the sketches filed by domain, and the fluid — the ★ — the first leaf in every language',
      reading && alpha && civp.ids.join() === 'civplock,civpcut,civpidx,civpa4,civpsel,civpcar,civpclo' && cap.ids.join() === 'drd,sel'
      && sketches.length >= 4 && sketches.every(S => S.id.startsWith('sketch.')) && LAB_START === 'nsflow' && LANGS.every(L => labCatalogueOrder(L)[0] === 'nsflow'),
      `chapters ${reading ? 'in reading order' : 'OUT OF ORDER'} · domains ${alpha ? 'alphabetical (ru)' : 'NOT SORTED'} · CIVP ${civp.ids.length} + capacity ${cap.ids.length} · sketches ${sketches.map(S => S.id.slice(7) + ' ' + S.ids.length).join(', ')}`); }

  /* 3 · the names */
  { const clash = [], clip = [];
    for (const L of LANGS) { const seen = new Map();
      for (const id of labCatalogueOrder(L)) { const k = labNameIn(id, L).trim().toLowerCase(); if (seen.has(k)) clash.push(`${L}: ${seen.get(k)} = ${id}`); else seen.set(k, id);
        if (L !== 'en' && /[A-Za-zА-Яа-яЁёÄÖÜäöüß]\.(\s|$)/.test(labNameIn(id, L))) clip.push(`${L}:${id}`); } }
    const sp = s => { const r = labNameSplit(s); return r.sub ? r.name + ' | ' + r.sub : r.name; };
    const cases = [['Golay · Steiner · Leech Λ₂₄', 'Golay · Steiner · Leech Λ₂₄'], ['KAM · standard map', 'KAM · standard map'], ['моды β', 'Моды β'],
      ['The tennis racket inside the fluid · every triad of S³ is a free rigid body', 'The tennis racket inside the fluid | every triad of S³ is a free rigid body'],
      ['Neutrino oscillation · PMNS', 'Neutrino oscillation · PMNS'], ['π · digits', 'π · digits']];
    const split = cases.every(([a, b]) => sp(a) === b);
    ok('the names: no two laboratories share one in any of the three languages, none is a clipped «лаб.» or «грав.», the FLRW laboratory is the cosmological distances and the distance ladder is the other one, and the list splits a name from its gloss only where the head is a name of its own',
      clash.length === 0 && clip.length === 0 && split && /^Cosmological distances/.test(labNameIn('cosmo', 'en')) && /^космологические расстояния/.test(labNameIn('cosmo', 'ru')) && /^The ladder/.test(labNameIn('rungs', 'en')),
      `${clash.length} shared · ${clip.length} clipped · split ${split ? 'as specified' : 'WRONG: ' + cases.map(([a]) => sp(a)).join(' / ')} · cosmo «${labNameIn('cosmo', 'ru')}» · rungs «${labNameIn('rungs', 'ru')}»`); }
  { const miss = []; for (const P of LAB_PARTS) for (const L of LANGS) { if (!P.t[L]) miss.push(P.id + ':' + L); for (const k of P.sections) { if (labSectionName(k, L) === k || labSectionName(k, L, true) === k) miss.push(k + ':' + L); } }
    ok('and every part and every section is named in all three languages, in the full form the catalogue shows and the short one the bar and the trail carry',
      miss.length === 0, miss.length ? 'UNNAMED ' + miss.join(', ') : `${LAB_PARTS.length} parts · ${LAB_PARTS.reduce((n, P) => n + P.sections.length, 0)} sections · bar «${labSectionName('navier', 'ru', true)}», catalogue «${labSectionName('navier', 'ru')}»`); }

  /* 4 · one list, not two */
  ok('one list, not two: the "start here" block that listed thirteen laboratories a second time is gone, the start is a ★ on its own row, every row is dressed from the one registry of names in the reader\'s language, and the bar walks and counts the tree\'s own leaves',
    !/LAB_FEATURED|labFeaturedHTML|data-labfeat/.test(SRC) && /function labRowDress\(b,L,cur\)\{/.test(SRC) && /\$\{id===LAB_START\?`<span class="labStart">★/.test(SRC)
    && /for\(const b of buttons\) labRowDress\(b,L,cur\);/.test(SRC) && !/b\.textContent=S3_VIEW_NAMES\[id\]\|\|id;/.test(SRC)
    && /function labBarOrder\(\)\{ return labCatalogueOrder\(labLangNow\(\)\); \}/.test(SRC) && /LAB_BROWSER_TOTAL=order\.length;/.test(SRC)
    && /title=i>=0\?labNameSplit\(labNameIn\(v,lang\)\)\.name/.test(SRC));

  /* 5 · the walk */
  ok('the walk: the first ‹ › after load is a step and not a jump; a synthesised row selects through uiSetS3View like the rest, so in Multiview it fills the active tile; every lab-to-lab bridge goes through the router, so the address bar and the trail follow; and the Trisphere\'s Controls no longer call a $ the module does not have',
    !/firstJumped/.test(SRC) && /b\.onclick=\(\)=>\{ uiSetS3View\(id\); \};/.test(SRC) && !/navPush\(\); setS3View\(/.test(SRC)
    && !/if\(\$\('triProjection'\)\)/.test(SRC) && /const tp=ctl\.querySelector\('#triProjection'\); if\(tp\) tp\.onchange=/.test(SRC)
    && /else if\(k==='sec'\)\{ labBrowserReveal\(b\.dataset\.sec\); \}/.test(SRC) && /data-crumb="sec" data-sec=/.test(SRC));

  /* 5b · every lab-to-lab door through the router, every vertex-coloured object with its colours from the start */
  { const lines = SRC.split('\n');
    const stale = lines.filter(l => /querySelector\('#[a-z]{2,8}To[A-Z][A-Za-z0-9]*'\)/.test(l) && /setS3View\(/.test(l) && /onclick|addEventListener\('click'/.test(l));
    const helpers = lines.filter(l => /const go=\(id,v(iew)?(,prep)?\)=>\{\s*const b=ctl\.querySelector\('#'\+id\);\s*if\(b\)\s*b\.onclick=\(\)=>\{[^}]*setS3View\(/.test(l));
    const dataDoors = [/data-topojump[\s\S]{0,200}?setS3View/, /dataset\.gatego\); buildCtl/, /if\(t\.dataset\.passgo\)\{ navPush\(\); setS3View/].filter(r => r.test(SRC));
    const empties = (SRC.match(/new THREE\.(Points|LineSegments)\(hccEmptyColoured\(\)/g) || []).length;
    ok('every door from one laboratory to another goes through the router — the id\'d bridges (51 of them still moved only the scene in v4.400), their shared helpers, the data-driven chips, the invariance jump and the Nexus door — and every vertex-coloured object starts with its colours, so none renders black or fails the boot check of a laboratory opened by its link',
      stale.length === 0 && helpers.length === 0 && dataDoors.length === 0 && /navPush\(\); hccGo\(\{worldId:'s3',labId:v\}\);   \/\* through the router/.test(SRC)
      && /navPush\(\);hccGo\(\{worldId:'s3',labId:lab\}\);buildCtl\(\);\}/.test(SRC) && /function hccEmptyColoured\(\)\{/.test(SRC) && empties >= 7
      && (SRC.match(/fill\(0\.5\),3\)\);   \/\* painted on the first update/g) || []).length === 2 && /sph\.geometry\.setAttribute\('color'/.test(SRC),
      `${stale.length} bridge lines and ${helpers.length} helpers still on setS3View · ${dataDoors.length} data doors · ${empties} empty geometries born coloured`); }
  ok('and «all N laboratories» counts the router\'s registry — the S³ laboratories and the one in the Cycles world — in the degraded notice and in the check that reads the screen, the same number the catalogue, ⊞ and «i / N» show',
    /if\(n\) n\.textContent=`all \$\{LAB_REGISTRY\.length\} laboratories`;/.test(SRC) && /const reg=LAB_REGISTRY\.length;/.test(SRC));

  /* 6 · the panel */
  ok('the panel: sections open and shut and are remembered per browser; the section of the laboratory in view opens when it changes; a rebuild keeps the reader\'s scroll and the place is scrolled to only when it moved; the title rides in the sticky rail; open on a desk with a short column it stands BESIDE Controls; and on a touch screen opening it does not raise the keyboard',
    /localStorage\.getItem\('hcc\.labCat\.open\.v1'\)/.test(SRC) && /if\(LAB_CAT\.lastLab!==cur\)\{ LAB_CAT\.lastLab=cur; LAB_CAT\.auto=curSec;/.test(SRC)
    && /const keep=panel\.scrollTop;/.test(SRC) && /panel\.scrollTop=keep;/.test(SRC) && /if\(LAB_CAT\.railFor===key\) return;/.test(SRC)
    && /rail\.insertBefore\(labRailTitle\(cur,L,LAB_BROWSER_TOTAL\),rail\.firstChild\)/.test(SRC)
    && /body\.lab-beside #labPanel:not\(\[data-collapsed="1"\]\)\{left:calc\(var\(--ctl-right,364px\) \+ 10px\)/.test(SRC) && /document\.body\.classList\.toggle\('lab-beside',beside\)/.test(SRC)
    && /if\(q&&!touch&&!\(opts&&opts\.focus===false\)\)/.test(SRC));
  ok('and the search really filters: a row hidden by the query is hidden by ATTRIBUTE, because a row is display:flex !important and an inline display:none cannot beat it (measured: one match of ten, all ten shown); ё and е are one letter; the per-section count says how many the query left; a query that finds nothing says so',
    /b\.hidden=!hit; b\.style\.display=hit\?'':'none';/.test(SRC) && /#labPanel \.labList > \.labRow\[hidden\]\{display:none!important\}/.test(SRC)
    && /const yo=x=>x\.replace\(\/ё\/g,'е'\);/.test(SRC) && /if\(c\) c\.textContent=tokens\.length\?`\$\{n\} \/ \$\{all\}`:String\(all\);/.test(SRC) && /const none=el\.querySelector\('\.labNone'\); if\(none\) none\.hidden=!\(tokens\.length&&!shown\);/.test(SRC));

  /* 7 · the ladder */
  { const scrub = SRC.slice(SRC.indexOf('function sxScrubTo(N,final){'), SRC.indexOf('/* ── the vertical ladder of a phone ── */'));
    const fly = SRC.slice(SRC.indexOf('function sxFlyTo(L,lm,cross){'), SRC.indexOf('/* ── THE PHASE TRANSITION OF A LEVEL (v4.380)'));
    const obsFirst = scrub.indexOf("if(state.mode==='obs'&&!DSC.on){") > 0 && scrub.indexOf("if(state.mode==='obs'&&!DSC.on){") < scrub.indexOf('sxFlyTo(L)');
    const flyFirst = fly.indexOf("if(state.mode==='obs'&&!DSC.on&&!cross){") > 0 && fly.indexOf("if(state.mode==='obs'&&!DSC.on&&!cross){") < fly.indexOf('descentGoTo(n)')
      && /if\(E\.side==='below'\)\{ const B=sxObsBand\(\), n=Math\.max\(B\.lo-6,Math\.min\(E\.want,B\.lo-0\.5\)\);/.test(SRC)
      && /state\.solarScaleLayer='cosmic';\n\s*try\{ hccGo\(\{worldId:'solar'\},\{history:true\}\); \}catch\(e\)\{ try\{ setMode\('solar'\); \}catch\(e2\)\{\} \}\n\s*try\{ advanceScaleLayer\('cosmic'\); \}catch\(e\)\{\}/.test(SRC);
    ok('the ladder: the golden spiral opens the slim strip at once and a rung card unfolds the sheet; in the Observable world the strip steers the Observable world — before any path that switches worlds or goes down the descent — clamped to the band between its two seams, with the band drawn on the track and the world beyond offered on a button',
      /sxLadderPaint\(\); sxFold\(true\); \} \};/.test(SRC) && /if\(L\.classList\.contains\('compact'\)\) sxFold\(false\);/.test(SRC)
      && obsFirst && flyFirst && /SCALE_SEAMS\.obsSolarInGly\*1\.12/.test(SRC) && /up\?SCALE_SEAMS\.obsS3OutGly\*0\.9:Infinity/.test(SRC)
      && /<i id="tssBand" hidden><\/i>/.test(SRC) && /<button class="tmBtn tssCross" id="tssCross" hidden><\/button>/.test(SRC) && /cross\.onclick=\(\)=>\{ sxObsCross\(\); cross\.hidden=true; \};/.test(SRC),
      `obs steering ahead of the world switch: ${obsFirst} · card flight in band stays: ${flyFirst}`); }

  console.log('\n  ' + pass + ' passed, ' + fail + ' failed'); process.exit(fail ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
