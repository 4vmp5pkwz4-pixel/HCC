/* JAPANESE, THE FOURTH LANGUAGE (v4.412). The atlas spoke English, Russian and German; a reader asked for Japanese "for the key
   elements of the whole atlas". This verifier holds what was built, against the code that ships rather than a description of it:

     1. the language is WIRED wherever a language is chosen — the switch's cycle, the translator's languages and caches, the render-
        time TT() and the array resolver hccL(), each with a Japanese path;
     2. the DICTIONARY'S Japanese column is what data/i18n/ja/ builds, every value is Japanese (or the English designation itself),
        carries no Cyrillic, and keeps every number and capture slot of its English key;
     3. the RUNTIME, taken out of index.html and run here, translates exactly, through masked numbers, through numbered number slots
        when Japanese word order moves them ({#2} … {#1}), through templates whose captures it reorders ({2}の{1}), and leaves an
        unknown string as it was — while Russian and German are untouched;
     4. every NAME a reader navigates by has its Japanese: the seven worlds and their lines, the catalogue's parts, sections, domains
        and nine categories, the top bar and the panel tabs, and all 152 laboratories — each Japanese name distinct, so the
        catalogue can find the laboratory a Japanese name belongs to, and split it where the English name splits;
     5. the PAGE asks for Japanese faces under lang="ja", so Han characters take their Japanese forms, not a Chinese font's;
     6. COVERAGE of the text the running page shows (data/i18n/corpus.json) in Japanese never falls below the floor recorded here. */
import fs from 'node:fs'; import path from 'node:path'; import cp from 'node:child_process';
const ROOT = path.join(path.dirname(new URL(import.meta.url).pathname), '..');
const src = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
let pass = 0, fail = 0;
const check = (ok, claim, nums) => { if (ok) pass++; else fail++; console.log(`${ok ? 'PASS' : 'FAIL'} — ${claim} :: ${nums}`); };
const between = (a, b) => { const i = src.indexOf(a); const j = src.indexOf(b, i); return i < 0 || j < 0 ? '' : src.slice(i, j); };
const JP = /[぀-ヿ㐀-鿿]/, CYR = /[А-Яа-яЁё]/;
/* the floor: raise it when a batch lands, never lower it */
const FLOOR_JA = 0.77;

/* 1. wiring */
{
  const tt = between('function TT(en,ru,de,ja){', 'const state = {');
  const hl = between('const hccL=a=>{', '/* the whole-sky layer');
  const ok = /const ATLAS_LANG_ORDER=\['en','ru','de','ja'\];/.test(src) && /const HCC_TX_LANGS=\['en','ru','de','ja'\];/.test(src)
    && /const HCC_TX_CACHE=\{ru:new Map\(\),de:new Map\(\),ja:new Map\(\)\};/.test(src)
    && /const hccTxIdx=L=>L==='ru'\?0:L==='de'\?1:L==='ja'\?2:-1;/.test(src)
    && /if\(L==='ja'\)\{ if\(ja!=null\) return ja;[^}]*hccTx\(en,'ja'\)/.test(tt)
    && /if\(L==='ja'\)\{ if\(a\[3\]\) return a\[3\]; try\{ return hccTx\(a\[0\]\|\|'','ja'\)/.test(hl)
    && /for\(const k in \(j\.ja\|\|\{\}\)\) HCC_TX_JA\.set\(k,j\.ja\[k\]\);/.test(src) && /for\(const \[en,ja\] of \(j\.pja\|\|\[\]\)\)/.test(src);
  check(ok, 'Japanese is wired wherever a language is chosen: the switch cycles en → ru → de → ja, the translator knows it and caches it, TT() returns a hand-written Japanese argument or the English through the dictionary (so canvas text is translated too), and hccL() reads a fourth element or the dictionary',
    ok ? 'ATLAS_LANG_ORDER · HCC_TX_LANGS · HCC_TX_CACHE · hccTxIdx · TT · hccL · loader' : 'a wire is missing');
}

/* 2. the dictionary's Japanese column */
const dictJSON = (src.match(/<script type="application\/json" id="hcc-i18n">([\s\S]*?)<\/script>/) || [])[1] || '{}';
const dict = JSON.parse(dictJSON.replace(/<\\\//g, '</').replace(/<\\!--/g, '<!--'));
{
  const r = cp.spawnSync(process.execPath, [path.join(ROOT, 'scripts', 'build-i18n.mjs'), '--check'], { encoding: 'utf8' });
  const ja = dict.ja || {}, pja = dict.pja || [];
  const cnt = (s, re) => (String(s).match(re) || []).length;
  const bad = [];
  for (const [en, v] of Object.entries(ja)) {
    const nEn = cnt(en, /\{#\}/g), refs = (v.match(/\{#([1-9])\}/g) || []).map(x => +x[2]);
    if (!(JP.test(v) || v === en)) bad.push('not Japanese: ' + en.slice(0, 40));
    if (CYR.test(v)) bad.push('Cyrillic: ' + en.slice(0, 40));
    if (nEn !== cnt(v, /\{#[1-9]?\}/g) || (refs.length && cnt(v, /\{#\}/g)) || new Set(refs).size !== refs.length || refs.some(x => x > nEn)) bad.push('numbers: ' + en.slice(0, 40));
    if (cnt(en, /\{\*\}/g) !== cnt(v, /\{\*\}/g)) bad.push('captures: ' + en.slice(0, 40));
  }
  for (const [en, v] of pja) if (cnt(en, /\{\*\}|\{#\}|\{[0-9]\}/g) !== cnt(v, /\{\*\}|\{#\}|\{[0-9]\}/g) || !JP.test(v)) bad.push('template: ' + en.slice(0, 40));
  check(r.status === 0 && Object.keys(ja).length > 1000 && pja.length === (dict.p || []).length && !bad.length,
    'the embedded Japanese column is exactly what data/i18n/ja/ builds; every value is Japanese or the English designation itself, carries no Cyrillic, and keeps every number and capture slot of its key — and every Russian–German template has its Japanese template',
    `${Object.keys(ja).length} strings · ${pja.length}/${(dict.p || []).length} templates · ${bad.length ? bad.slice(0, 4).join(' | ') : 'none malformed'} · ${(r.stdout || r.stderr || '').trim()}`);
}

/* 3. the runtime, taken out of the page and run here */
const runtime = between('const HCC_TX_LANGS=', '/* ── the observer ── */');
const makeT = json => new Function('document', 'localStorage', 'navigator', runtime + '\nreturn {hccTx, hccTxLoad, hccTxPiece, HCC_TX_SPLITS};')(
  { getElementById: id => id === 'hcc-i18n' ? { textContent: json } : null }, undefined, { language: 'ja-JP' });
const T = makeT(dictJSON.replace(/<\\\//g, '</'));
{
  const tx = (s, L) => T.hccTx(s, L);
  const exact = tx('HDR bloom', 'ja') === 'HDR グロー' && tx('Hierarchy locator', 'ja') === '階層ロケーター';
  const masked = tx('500 BCE', 'ja') === '紀元前 500 年';
  const lag = tx('Lagrange point L4 of the Sun–Earth pair, solved from the circular restricted three-body problem rather than approximated.', 'ja');
  const tmpl = /系のラグランジュ点 L4。近似ではなく、円制限三体問題を解いて求めた点である。$/.test(lag) && !/L\{|\{2\}|\{1\}/.test(lag);
  const keep = tx('Zyx qwv unknown phrase', 'ja') === 'Zyx qwv unknown phrase' && tx('', 'ja') === '' && tx('Blast wave', 'en') === 'Blast wave';
  const rude = tx('Blast wave', 'ru') === 'Взрывная волна' && tx('Blast wave', 'de') === 'Druckwelle' && tx('Blast wave', 'ja') === '爆風波';
  /* numbered number slots: a dictionary built here, so the mechanism is tested and not one entry */
  const T2 = makeT(JSON.stringify({ t: {}, p: [], ja: { '{#} of {#} stations': '全 {#2} ステーション中 {#1}' }, pja: [] }));
  const reorder = T2.hccTx('3 of 7 stations', 'ja') === '全 7 ステーション中 3';
  check(exact && masked && tmpl && keep && rude && reorder,
    'the shipped runtime translates Japanese exactly, through masked numbers, through numbered number slots when Japanese word order moves them, and through templates whose captures it reorders ({2}の{1}); an unknown string comes back as it went in, and Russian and German are untouched',
    `exact ${exact} · masked ${masked} · template "${lag.slice(0, 48)}…" · reorder ${reorder} · fallback ${keep} · ru/de ${rude}`);
}

/* 4. every name a reader navigates by */
{
  const W = new Function(between('const WORLD_REGISTRY=[', 'const WORLD_BY_ID=') + ';return WORLD_REGISTRY;')();
  const worlds = W.length === 7 && W.every(w => JP.test(w.t[3] || '') && JP.test(w.d[3] || ''));
  const cats = new Function(between('const LAB_CATEGORIES=[', 'const LAB_CATEGORY_OF=') + ';return LAB_CATEGORIES;')();
  const catOk = cats.length === 9 && cats.every(c => JP.test(c[1][3] || ''));
  const parts = new Function(between('const LAB_ELSEWHERE=Object.freeze([', '/* where a laboratory stands in the tree') + ';return {LAB_ELSEWHERE,LAB_PARTS,LAB_SECTION_SHORT,LAB_SECTION_LONG};')();
  const dom = new Function(between('const LAB_DOMAIN_LABEL={', '/* ══ SKETCHES') + ';return LAB_DOMAIN_LABEL;')();
  const objs = [...parts.LAB_ELSEWHERE.map(x => x.t), ...parts.LAB_PARTS.map(x => x.t), ...parts.LAB_PARTS.filter(x => x.note).map(x => x.note),
    ...Object.values(parts.LAB_SECTION_SHORT), ...Object.values(parts.LAB_SECTION_LONG), ...Object.values(dom)];
  const tree = objs.length > 30 && objs.every(o => JP.test(o.ja || ''));
  const chrome = new Function(between('const LANG_MODE={', 'function hccFitModeRow(){') + ';return {LANG_MODE,LANG_PANEL,LANG_MISC};')();
  const chromeOk = ['LANG_MODE', 'LANG_PANEL', 'LANG_MISC'].every(k => Object.values(chrome[k]).every(o => typeof o.ja === 'string' && o.ja.trim()));
  const a = src.indexOf('const LAB_DECLARATIONS=Object.freeze(['), b = src.indexOf('\n]);', a) + 4;
  const c = src.indexOf('const S3_VIEW_NAMES={'), e = src.indexOf("...labDeclNames('ja')} };", c) + "...labDeclNames('ja')} };".length;
  const R = new Function(src.slice(a, b) + ';const labDeclNames=lang=>Object.fromEntries(LAB_DECLARATIONS.map(d=>[d.id,d.title[lang]]));' + src.slice(c, e) + ';return {LAB_DECLARATIONS,S3_VIEW_NAMES,S3_VIEW_I18N};')();
  const ids = Object.keys(R.S3_VIEW_NAMES), ja = R.S3_VIEW_I18N.ja;
  const names = [...ids.map(i => ja[i]), ...parts.LAB_ELSEWHERE.map(x => x.t.ja)];
  const labsOk = ids.every(i => JP.test(ja[i] || '')) && R.LAB_DECLARATIONS.every(d => d.title.ja && ja[d.id] === d.title.ja) && new Set(names).size === names.length;
  /* the catalogue splits a Japanese name where it splits the English one, by finding the laboratory the Japanese name belongs to */
  const split = /if\(\/\[\\u3040-\\u30ff\\u3400-\\u9fff\]\/\.test\(s\)\)\{/.test(src) && /const id=LAB_JA_TO_ID\.get\(s\), en=id\?String\(labNameIn\(id,'en'\)\):'';/.test(src)
    && /if\(!d\.title\.ja\|\|S3_VIEW_I18N\.ja\[d\.id\]!==d\.title\.ja\) miss\.push/.test(src);
  check(worlds && catOk && tree && chromeOk && labsOk && split,
    'every name a reader navigates by is in Japanese: the seven worlds and their lines, the catalogue’s parts, sections, domains and nine categories, the world row, the panel tabs and the top-bar buttons, and all laboratories — each Japanese name distinct, and the catalogue splits a Japanese name exactly where it splits the English one',
    `worlds ${worlds} · categories ${catOk} · ${objs.length} tree names ${tree} · chrome ${chromeOk} · ${names.length} laboratories ${labsOk} (${R.LAB_DECLARATIONS.length} declared with title.ja) · split ${split}`);
}

/* 5. Japanese faces under lang="ja" */
{
  const css = between('html:lang(ja){', '}');
  const ok = /--sans:[^;]*'Hiragino Sans'[^;]*'Yu Gothic'[^;]*'Noto Sans JP'/.test(css) && /--serif:[^;]*'Hiragino Mincho ProN'[^;]*'Noto Serif JP'/.test(css)
    && /--sans:'HCC Greek','Manrope'/.test(css) && /document\.documentElement\.setAttribute\('lang',L\)/.test(src);
  check(ok, 'under lang="ja" the page names Japanese faces after its Latin ones, so Han characters take their Japanese forms instead of whatever CJK font a system finds first, while formulas, numbers and Greek keep the atlas’s own faces',
    ok ? 'Hiragino · Yu · Noto JP · IPA in --sans and --serif' : 'font stack missing');
}

/* 6. coverage of what the running page shows */
{
  const C = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'i18n', 'corpus.json'), 'utf8')).units;
  const worth = s => /(?<![A-Za-z_.])[A-Za-z][a-z]{2,}/.test(s) && !/[А-Яа-яЁё]/.test(s);
  const covered = (s, L, lvl = 0) => {
    if (lvl === 0) s = s.replace(/\{#\}/g, '7.5');
    if (!worth(s) || T.hccTxPiece(s, L) != null) return true;
    for (let i = lvl; i < T.HCC_TX_SPLITS.length; i++) {
      const parts = s.split(T.HCC_TX_SPLITS[i]); if (parts.length < 2) continue;
      return parts.every((p, j) => j % 2 === 1 || !p.trim() || covered(p.trim(), L, i + 1));
    }
    return false; };
  const f = L => C.filter(u => covered(u, L)).length / C.length;
  const ja = f('ja'), ru = f('ru');
  check(ja >= FLOOR_JA, `coverage in JA of the ${C.length} text units the running page shows is at or above the recorded floor (Russian, for scale, measured the same way)`,
    `${(100 * ja).toFixed(1)} % (floor ${(100 * FLOOR_JA).toFixed(0)} %) · RU ${(100 * ru).toFixed(1)} %`);
}

/* 7. the catalogue sheet finds a laboratory by the words a Japanese reader can see */
{
  const sheet = between('function renderAtlasNav(){', 'const pass=L=>');
  const hay = between('function labHaystack(id){', 'h=h.toLowerCase();');
  const ok = /const qt=q\.split\(\/\\s\+\/\)\.filter\(Boolean\);/.test(sheet) && /labHaystack\(L\.id\); return qt\.every\(t=>h\.includes\(t\)\)/.test(sheet)
    && /h\+=' '\+hccTx\(d,'ja'\)/.test(hay) && /for\(const lg of \['en','ru','de','ja'\]\)/.test(hay) && /h\+=' '\+labNamesAllLangs\(id\);/.test(hay)
    && /for\(const L of Object\.values\(S3_VIEW_I18N\)\)/.test(src);
  check(ok, 'the catalogue sheet searches what the reader can read: every laboratory name and description in every language — Japanese descriptions as the dictionary renders them — and the section names, word by word (it compared the query with the English only, so «ホップ» found nothing)',
    ok ? 'sheet → labHaystack · names ×4 languages · ja descriptions · sections ×4' : 'search path changed');
}
/* 8. the Emerald Tablet, whose rows pick their language by index, carries Japanese at the index Japanese reads */
{
  const a = src.indexOf('const HERMES_TABLET=['), b = src.indexOf('const HERMES_CK={}', a);
  const deps = ['vxExactChecks','vxTree','TT','vxFusionPaths','vxFibBig','vxLucasBig','VX_PHI','vxRungGap','vxRydberg','vxGKSL','vxJumps','vxPropagate','vxVacuum','vxPop','vxEnvelope','vxDarkMoments','vxAllTimeB','FBS','vxWordOf'];
  const H = new Function(...deps, src.slice(a, b) + ';return {HERMES_TABLET,HERMES_ST};')();
  const rows = H.HERMES_TABLET.length === 13 && H.HERMES_TABLET.every(r => r.t.length === 4 && r.s.length === 4 && JP.test(r.t[3]) && JP.test(r.s[3]));
  const st = Object.values(H.HERMES_ST).every(x => x.length === 5 && /^#[0-9a-f]{6}$/.test(x[3]) && JP.test(x[4]));
  const read = /L=state\.lang==='ru'\?1:state\.lang==='de'\?2:state\.lang==='ja'\?3:0, SL=state\.lang==='ja'\?4:L;/.test(src) && /\$\{st\[SL\]\}/.test(src);
  check(rows && st && read, 'the Emerald Tablet — thirteen lines and the statement each can honestly name — reads in Japanese, and its status labels take their Japanese without the colour, which stays at the index every reader of the table expects',
    `rows ${rows} · statuses ${st} · reader ${read}`);
}
console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
