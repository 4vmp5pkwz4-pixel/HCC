#!/usr/bin/env node
'use strict';
/* ══ EVERY WORD IN THREE LANGUAGES ═══════════════════════════════════════════
 *
 * The atlas offered a language switch and honoured it in the chrome, the world and
 * laboratory names, the laboratory descriptions and the typed ports — and nowhere
 * else. MEASURED in Russian across all 7 worlds and 120 laboratories before this:
 * 2295 distinct English strings on the panels, 886 of 886 object cards described in
 * English only, 3625 of 6489 card row labels in English, 650 scene captions that
 * could not be clicked at all.
 *
 * This file takes the translation runtime and the dictionary OUT of index.html and
 * runs them here, so what it checks is the code that ships:
 *
 *   1. the embedded dictionary is exactly what data/i18n/ builds (no hand edits)
 *   2. lookup: exact, numbers masked as {#}, templates whose captures are translated
 *      in turn, and coarse-to-fine splitting — sentences, then ' — ', then ' · '
 *   3. English passes through untouched, and an unknown string is returned as it was
 *      (a fallback, never a blank)
 *   4. coverage of the corpus the running page actually shows (data/i18n/corpus.json)
 *      never falls below the floor recorded here — the ratchet only moves up
 *   5. every caption in a scene can be asked what it is: it opens the card of the
 *      object it names, or a card of its own with its world, laboratory, owner and
 *      typed relations
 */
const fs = require('node:fs'), path = require('node:path'), cp = require('node:child_process');
const ROOT = path.join(__dirname, '..');
const src = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
let pass = 0, fail = 0;
const ok = (n, c, d) => { if (c) { pass++; console.log('  PASS — ' + n + (d ? ' :: ' + d : '')); }
  else { fail++; console.log('  FAIL — ' + n + (d ? ' :: ' + d : '')); } };
const between = (a, b) => { const i = src.indexOf(a); const j = src.indexOf(b, i); return i < 0 || j < 0 ? '' : src.slice(i, j); };
/* the coverage floor: raise it when a batch lands, never lower it */
const FLOOR = { ru: 0.14, de: 0.14 };

{ /* 1 */
  const r = cp.spawnSync(process.execPath, [path.join(ROOT, 'scripts', 'build-i18n.mjs'), '--check'], { encoding: 'utf8' });
  ok('the dictionary embedded in index.html is exactly what data/i18n/ builds, so nobody edits a translation in one place and not the other',
    r.status === 0, (r.stdout || r.stderr || '').trim());
}
const dictJSON = (src.match(/<script type="application\/json" id="hcc-i18n">([\s\S]*?)<\/script>/) || [])[1] || '{"t":{},"p":[]}';
const runtime = between('const HCC_TX_LANGS=', '/* ── the observer ── */');
const T = new Function('document', 'localStorage', 'navigator', runtime + '\nreturn {hccTx, hccTxLoad, hccTxPiece, HCC_TX_SPLITS};')(
  { getElementById: id => id === 'hcc-i18n' ? { textContent: dictJSON.replace(/<\\\//g, '</') } : null },
  undefined, { language: 'en-GB' });
const D = T.hccTxLoad();
{ /* 2 and 3 */
  const tx = (s, L) => T.hccTx(s, L);
  ok('an exact entry is found in both languages', tx('Blast wave', 'ru') === 'Взрывная волна' && tx('Blast wave', 'de') === 'Druckwelle');
  ok('a readout translates whatever its value: the numbers are masked, looked up and put back where they were',
    tx('Blast wave · 12 BCE', 'ru') === 'Взрывная волна · 12 до н. э.' && tx('BCS gap Δ(0) = 1.764·k_B·T_c = 1.51 meV', 'de') === 'BCS-Lücke Δ(0) = 1.764·k_B·T_c = 1.51 meV',
    tx('Blast wave · 12 BCE', 'ru'));
  const lp = tx('Lagrange point L4 of the Sun–Earth pair, solved from the circular restricted three-body problem rather than approximated.', 'ru');
  ok('a template keeps its number slot and hands its capture back to the dictionary', /^Точка Лагранжа L4 пары /.test(lp), lp);
  const two = tx('A selectable relation-space proxy for the Accretion disk · Shakura–Sunyaev laboratory. Position morphs between disciplinary and typed-relation embeddings; it is deliberately non-metric.', 'ru');
  ok('splitting goes coarse to fine, so a template whose own text contains " · " is still matched whole before the fields are split',
    /^Выбираемый заместитель в пространстве связей для лаборатории «/.test(two) && /неметрическое\.$/.test(two), two.slice(0, 110));
  ok('English passes through untouched, and a string the dictionary does not know comes back exactly as it went in — a fallback, never a blank',
    tx('Blast wave', 'en') === 'Blast wave' && tx('Zyx qwv unknown phrase', 'ru') === 'Zyx qwv unknown phrase' && tx('', 'ru') === '');
  let cyr = 0; for (const [, v] of D) if (/[А-Яа-яЁё]/.test(v[1])) cyr++;
  ok('no German entry carries Cyrillic, and every entry carries both languages',
    cyr === 0 && [...D.values()].every(v => Array.isArray(v) && v[0] && v[1]), `${D.size} entries`);
}
{ /* 4 coverage ratchet */
  const C = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'i18n', 'corpus.json'), 'utf8')).units;
  /* a unit is COVERED when the dictionary resolves every piece of it — a German name that
     is spelled as in English is covered, a sentence with one clause left in English is not */
  const worth = s => /(?<![A-Za-z_.])[A-Za-z][a-z]{2,}/.test(s) && !/[А-Яа-яЁё]/.test(s);
  const covered = (s, L, lvl = 0) => {
    if (!worth(s) || T.hccTxPiece(s, L) != null) return true;
    for (let i = lvl; i < T.HCC_TX_SPLITS.length; i++) {
      const parts = s.split(T.HCC_TX_SPLITS[i]); if (parts.length < 2) continue;
      return parts.every((p, j) => j % 2 === 1 || !p.trim() || covered(p.trim(), L, i + 1));
    }
    return false; };
  for (const L of ['ru', 'de']) {
    let n = 0; for (const u of C) if (covered(u, L)) n++;
    const f = n / C.length;
    ok(`coverage in ${L.toUpperCase()} of the ${C.length} text units the running page shows is at or above the recorded floor`,
      f >= FLOOR[L], `${n}/${C.length} = ${(100 * f).toFixed(1)} % (floor ${(100 * FLOOR[L]).toFixed(0)} %)`);
  }
}
{ /* 5 captions */
  ok('every scene label keeps a handle to its own scene object, which is what lets a caption be asked what it is',
    /const obj=new CSS2DObject\(div\); div\._hccObj=obj;/.test(src));
  ok('a click that lands on a visible caption opens it BEFORE any body behind it is ray-cast — the caption is what the reader pointed at',
    /let cap=null; try\{ cap=hccAnnotAt\(e\.clientX,e\.clientY\); \}catch\(err\)\{\}/.test(src)
    && /if\(cap\)\{ try\{ hccAnnotOpen\(cap\); \}/.test(src));
  const H = new Function(between('const hccAnnotNorm=', 'function hccAnnotText(') + '\nreturn {hccAnnotNorm, hccAnnotHead};')();
  ok('the caption head is the name before the first qualifier', H.hccAnnotHead('Sirius · m = −1.46 · μ = 1.3') === 'Sirius'
    && H.hccAnnotHead('Coma Cluster (Abell 1656)') === 'Coma Cluster' && H.hccAnnotHead('Regulus') === 'Regulus');
  ok('and a caption is taken as the NAME of an object only when what follows is a qualifier — "Sun · galactic orbit → Cygnus" is a caption about the Sun and gets its own card',
    /rest=String\(text\)\.slice\(h0\.length\), head=\(String\(rest\)\.match\(\/\[A-Za-z\]\{3,\}\/g\)\|\|\[\]\)\.length>1\?'':hccAnnotNorm\(h0\);/.test(src));
  ok('its own card carries the world, the laboratory, the object it hangs from in the scene graph and the three nearest registered objects as typed DISPLAY relations — never a physical one',
    /\[owner,'caption of',/.test(src) && /near\.map\(k=>\[k,'display proximity',/.test(src)
    && /try\{ for\(const r of \(s\?\.relations\?\.\(\)\|\|\[\]\)\) add\(r\[0\],r\[1\],r\[2\]\); \}catch\(e\)\{\}/.test(src));
  ok('and in English the observer is not connected at all, so a reader who never switches pays nothing for the other two languages',
    /hccTxConnect\(HCC_TX_LANG!=='en'\);/.test(src) && /else HCC_TX_OBS\.disconnect\(\);/.test(src) && /try\{ hccTxSetLang\(L\); \}catch\(e\)\{\}/.test(src));
}

console.log('\n  ' + pass + ' passed, ' + fail + ' failed');
process.exit(fail ? 1 : 0);
