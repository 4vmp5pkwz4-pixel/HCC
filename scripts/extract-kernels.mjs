#!/usr/bin/env node
/* ── ONE SOURCE OF TRUTH FOR THE PHYSICS ─────────────────────────────────────
   Eight of the twelve computational kernels are the mathematics the atlas already draws.
   There were two ways to give them a machine contract: retype them into core/labs, or take
   them. Retyping creates a second copy that can drift, and a drift between the picture and
   the number is exactly the failure this whole core exists to prevent — so this script
   TAKES them.

   It reads the single module block of index.html, finds every top-level declaration,
   builds the identifier graph between them, and emits the transitive closure of the
   declarations the kernels name. Emission is in ORIGINAL SOURCE ORDER, which is the only
   ordering guaranteed to respect the temporal dead zone of the consts as written.

   If the closure ever touches a browser global — window, document, THREE, a canvas — the
   extraction FAILS rather than emitting a module that cannot load in node. That failure is
   the useful part: it says which piece of physics is still entangled with a renderer. */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const HTML = readFileSync(join(ROOT, 'index.html'), 'utf8');

/* the single module block */
const open = HTML.indexOf('<script type="module">');
if (open < 0) throw new Error('index.html has no module block');
const bodyStart = HTML.indexOf('>', open) + 1;
const bodyEnd = HTML.lastIndexOf('</script>');
const SRC = HTML.slice(bodyStart, bodyEnd);

/* the keywords a '/' can legally follow, where it opens a REGEX and never a division.
   `p === ''` covers the start of the file; the punctuation set covers operators; this
   covers the third case, which is the one that was missing. */
const REGEX_AFTER = new Set(['return', 'typeof', 'instanceof', 'in', 'of', 'new', 'delete',
  'void', 'throw', 'case', 'do', 'else', 'yield', 'await']);
const BROWSER = new Set(['window', 'document', 'THREE', 'navigator', 'localStorage', 'location',
  'requestAnimationFrame', 'cancelAnimationFrame', 'HTMLElement', 'CanvasRenderingContext2D',
  'performance', 'fetch', 'getComputedStyle', 'MutationObserver', 'ResizeObserver', 'Image',
  'devicePixelRatio', 'screen', 'history', 'alert', 'customElements', 'WebGLRenderingContext',
  /* matchMedia was NOT on this list, so a closure that reached it only produced a warning
     and the emitted module failed at import time instead of failing here. A guard that
     warns where it should refuse is not a guard; these are the rest of the same family. */
  'matchMedia', 'speechSynthesis', 'indexedDB', 'sessionStorage', 'caches', 'crypto',
  'XMLHttpRequest', 'WebSocket', 'Worker', 'OffscreenCanvas', 'AudioContext', 'visualViewport']);
const GLOBALS = new Set(['Math', 'Number', 'Object', 'Array', 'String', 'Boolean', 'JSON', 'Map',
  'Set', 'WeakMap', 'WeakSet', 'Promise', 'Symbol', 'Error', 'RangeError', 'TypeError', 'Infinity',
  'NaN', 'undefined', 'null', 'true', 'false', 'this', 'BigInt', 'Float64Array', 'Float32Array',
  'Int32Array', 'Uint8Array', 'Uint32Array', 'Int8Array', 'Int16Array', 'Uint16Array', 'ArrayBuffer',
  'DataView', 'Date', 'RegExp', 'Function', 'Proxy', 'Reflect', 'globalThis', 'console', 'structuredClone',
  'isFinite', 'isNaN', 'parseFloat', 'parseInt', 'encodeURIComponent', 'decodeURIComponent', 'Intl',
  'setTimeout', 'clearTimeout', 'setInterval', 'clearInterval', 'queueMicrotask', 'AbortController']);
const KEYWORD = new Set(['if', 'else', 'for', 'while', 'do', 'return', 'break', 'continue', 'new',
  'typeof', 'instanceof', 'in', 'of', 'delete', 'void', 'try', 'catch', 'finally', 'throw', 'switch',
  'case', 'default', 'const', 'let', 'var', 'function', 'class', 'extends', 'super', 'yield', 'await',
  'async', 'static', 'get', 'set', 'from', 'as', 'export', 'import']);


/* ── A SCANNER THAT KNOWS WHAT IT IS LOOKING AT ──────────────────────────────
   Brace depth alone is not enough: a brace inside a string, a template, a regex or a
   comment is not a brace. Everything downstream depends on "top level" meaning top level,
   so the scanner classifies every character once and the rest of the script trusts it. */
function scan(s) {
  const depth = new Int32Array(s.length);     // brace/paren/bracket depth at each char
  const code = new Uint8Array(s.length);      // 1 iff this char is executable code
  let d = 0, i = 0;
  const prevSignificant = () => { let k = i - 1; while (k >= 0 && !code[k]) k--;
    while (k >= 0 && /\s/.test(s[k])) k--; return k >= 0 ? s[k] : ''; };
  /* ── AND A KEYWORD IS NOT AN IDENTIFIER ──────────────────────────────────
     `return /^https?:/.test(x)` was read as DIVISION, because the character before the
     slash is the "n" of return and one character cannot tell a keyword from a variable.
     Everything from that slash to the next one became code, the next slash opened a
     phantom regex, and it swallowed four lines — including an `if(...){`. The brace was
     never counted, its `}` was, and the depth of this file went to -1 and never came
     back. Ten thousand lines after it were invisible to extraction: `topLevel` is
     depth === 0, so no declaration in them existed as far as this script was concerned,
     and naming one as a root reported that it is "not a top-level declaration" — a true
     sentence about the parse and a false one about the file. Both halves of that are
     fixed below: keywords are read as words, and the depth is checked. */
  const prevWord = () => { let k = i - 1; while (k >= 0 && !code[k]) k--;
    while (k >= 0 && /\s/.test(s[k])) k--;
    const e = k; while (k >= 0 && /[\w$]/.test(s[k])) k--;
    return e > k ? s.slice(k + 1, e + 1) : ''; };
  while (i < s.length) {
    const c = s[i], c2 = s.slice(i, i + 2);
    if (c2 === '//') { while (i < s.length && s[i] !== '\n') { depth[i] = d; i++; } continue; }
    if (c2 === '/*') { const e = s.indexOf('*/', i + 2); const stop = e < 0 ? s.length : e + 2;
      while (i < stop) { depth[i] = d; i++; } continue; }
    if (c === '"' || c === "'") { const q = c; depth[i] = d; code[i] = 1; i++;
      while (i < s.length) { depth[i] = d; if (s[i] === '\\') { i += 2; continue; }
        if (s[i] === q) { i++; break; } i++; } continue; }
    if (c === '`') { // template literal, with ${ } holes that ARE code
      depth[i] = d; code[i] = 1; i++;
      while (i < s.length) {
        if (s[i] === '\\') { depth[i] = d; depth[i + 1] = d; i += 2; continue; }
        if (s[i] === '`') { depth[i] = d; i++; break; }
        if (s[i] === '$' && s[i + 1] === '{') {
          depth[i] = d; depth[i + 1] = d; i += 2;
          let h = 1;
          while (i < s.length && h > 0) {   // recurse by re-entering the main loop shape
            const sub = scanHole(s, i, d);
            i = sub.i; h = sub.h; for (let k = sub.from; k < i; k++) { depth[k] = d; code[k] = 1; }
          }
          continue;
        }
        depth[i] = d; i++;
      }
      continue;
    }
    if (c === '/') {   // regex, but only where a regex can legally begin
      const p = prevSignificant();
      if (p === '' || '(,=:[!&|?{};+-*%~^<>'.includes(p) || REGEX_AFTER.has(prevWord())) {
        depth[i] = d; code[i] = 1; i++; let cls = false;
        while (i < s.length) { depth[i] = d;
          if (s[i] === '\\') { i += 2; continue; }
          if (s[i] === '[') cls = true; else if (s[i] === ']') cls = false;
          else if (s[i] === '/' && !cls) { i++; break; }
          else if (s[i] === '\n') break;
          i++; }
        continue;
      }
    }
    if (c === '{' || c === '(' || c === '[') { depth[i] = d; code[i] = 1; d++; i++; continue; }
    if (c === '}' || c === ')' || c === ']') { d--; depth[i] = d; code[i] = 1; i++; continue; }
    depth[i] = d; code[i] = 1; i++;
  }
  return { depth, code };
}
/* a template hole is ordinary code; walk it until its brace closes */
function scanHole(s, i, d) {
  const from = i; let h = 1;
  while (i < s.length && h > 0) {
    const c = s[i];
    if (c === '"' || c === "'" || c === '`') { const q = c; i++;
      while (i < s.length) { if (s[i] === '\\') { i += 2; continue; } if (s[i] === q) { i++; break; } i++; }
      continue; }
    if (c === '{') h++; else if (c === '}') h--;
    i++;
  }
  return { i, h: 0, from };
}

const { depth, code } = scan(SRC);
/* ── AND THE PARSE MUST BALANCE, OR NOTHING BELOW IT IS TRUE ────────────────
   The whole of this script rests on depth === 0 meaning "top level". If the mask
   above loses a brace, depth is wrong from that point to the end of the file and
   every declaration after it silently stops existing — which is what happened, for
   ten thousand lines, until a root that was plainly there was reported missing.
   A parse that has lost track says so now, at the line where it lost it, instead of
   handing back an answer about a file it is no longer reading correctly. */
{
  let bad = -1;
  for (let i = 0; i < SRC.length; i++) if (depth[i] < 0) { bad = i; break; }
  const tail = SRC.length ? depth[SRC.length - 1] : 0;
  if (bad >= 0 || tail !== 0) {
    const at = bad >= 0 ? bad : SRC.length - 1;
    const line = SRC.slice(0, at).split('\n').length;
    console.error('extraction FAILED: the brace parse does not balance.');
    console.error(bad >= 0
      ? `  depth goes NEGATIVE at module line ${line} — a '{' was read as something else, or a '}' was counted twice`
      : `  depth ends at ${tail} rather than 0 — a block was opened and never closed, as this script reads it`);
    console.error(`  ${SRC.split('\n')[line - 1].trim().slice(0, 120)}`);
    console.error('  Every declaration after that point is invisible to this extractor, so no');
    console.error('  answer it gives about them can be trusted. Usually a regex literal read as');
    console.error('  a division, or a division read as a regex — see REGEX_AFTER above.');
    process.exit(1);
  }
}
const topLevel = i => depth[i] === 0 && code[i] === 1;

const IDENT = /(?<![.\w$])([A-Za-z_$][\w$]*)/g;

/* ── ONE DECLARATOR WALKER, USED TWICE ───────────────────────────────────────
   `const a = 1, b = f(x), {c, d} = o` binds four names; `const g = (N, M = 1) => …` binds
   ONE, and the M inside its parameter list is not a declarator at all. Both questions —
   what does this statement bind, and what is bound anywhere inside this function — are the
   same walk, so there is one implementation of it. Reading the head with a regex answered
   the first question wrongly and exported a parameter as a module-level name. */
function listBinders(text, c2, dp, at, kwLen) {
  const out = [], D = dp[at];
  let i = at + kwLen, binder = true;
  while (i < text.length) {
    if (!c2[i]) { i++; continue; }
    const d = dp[i], ch = text[i];
    if (d < D) break;
    if (d === D) {
      if (ch === ';') break;
      if (ch === '\n') { let n = i + 1; while (n < text.length && /\s/.test(text[n])) n++;
        if (n >= text.length || (!'.,+-*/%?:)]}=&|`'.includes(text[n]) && text.slice(n, n + 2) !== '=>')) break; }
      if (ch === ',') { binder = true; i++; continue; }
      if (ch === '=' && text[i + 1] !== '=') { binder = false; i++; continue; }
      if (binder && (ch === '{' || ch === '[')) {          /* destructuring pattern */
        let dd = d, k = i;
        for (; k < text.length; k++) { if (!c2[k]) continue;
          if ('{(['.includes(text[k])) dd++;
          else if ('})]'.includes(text[k])) { dd--; if (dd === d) break; } }
        for (const g of text.slice(i, k + 1).matchAll(IDENT)) if (!KEYWORD.has(g[1])) out.push(g[1]);
        i = k + 1; binder = false; continue;
      }
      if (binder && /[A-Za-z_$]/.test(ch)) {
        const nm = /^[A-Za-z_$][\w$]*/.exec(text.slice(i))[0];
        if (!KEYWORD.has(nm)) out.push(nm);
        i += nm.length; binder = false; continue;
      }
    }
    i++;
  }
  return out;
}

/* ── TOP-LEVEL DECLARATIONS ──────────────────────────────────────────────────
   function f(...){...}, const a=…, let a=…, class C{…}. Destructuring patterns are
   recorded with every name they bind, because a closure that needs one of them needs the
   whole statement. */
const DECLS = [];
const kwRe = /\b(function|const|let|var|class)\b/g;
let m;
while ((m = kwRe.exec(SRC))) {
  const at = m.index;
  if (!topLevel(at)) continue;
  /* it must begin a statement: nothing but whitespace back to a newline, ; or } */
  let k = at - 1; while (k >= 0 && ' \t'.includes(SRC[k])) k--;
  if (k >= 0 && !'\n;}'.includes(SRC[k])) continue;
  const kw = m[1];
  let end;
  if (kw === 'function' || kw === 'class') {
    /* run to the closing brace of the body: the first '{' at depth 0→1 after the head,
       then the matching '}' back at depth 0 */
    let j = at, seen = false;
    for (; j < SRC.length; j++) {
      if (!code[j]) continue;
      if (SRC[j] === '{' && depth[j] === 0) seen = true;
      else if (seen && SRC[j] === '}' && depth[j] === 0) { j++; break; }
    }
    end = j;
  } else {
    /* run to the terminating semicolon or newline at depth 0 */
    let j = at + kw.length;
    for (; j < SRC.length; j++) {
      if (!code[j] || depth[j] !== 0) continue;
      if (SRC[j] === ';') { j++; break; }
      if (SRC[j] === '\n') {
        /* a newline ends the statement only if the next code char cannot continue it */
        let n = j + 1; while (n < SRC.length && /\s/.test(SRC[n])) n++;
        if (n >= SRC.length) break;
        if (!'.,+-*/%?:)]}=&|`'.includes(SRC[n]) && SRC.slice(n, n + 2) !== '=>') break;
      }
    }
    end = j;
  }
  const text = SRC.slice(at, end);
  const names = [];
  if (kw === 'function' || kw === 'class') {
    const nm = /^(?:function|class)\s*\*?\s*([A-Za-z_$][\w$]*)/.exec(text);
    if (nm) names.push(nm[1]);
  } else {
    names.push(...listBinders(SRC, code, depth, at, kw.length));
  }
  if (!names.length) continue;
  DECLS.push({ names, text, at, end, kw });
  kwRe.lastIndex = end;
}

const BY_NAME = new Map();
for (const d of DECLS) for (const n of d.names) if (!BY_NAME.has(n)) BY_NAME.set(n, d);

/* ── SHADOWING ───────────────────────────────────────────────────────────────
   A name used inside a declaration is a DEPENDENCY only if it is not bound there. This
   file has 47 000 lines and names like j, gap, C, p, key and name exist both as loop
   variables and as top-level declarations, so without this the closure of specSpectrum
   swallowed the renderer through a parameter called j.

   The analysis deliberately OVER-collects binders: a name bound anywhere inside counts as
   bound everywhere inside. Over-collecting drops a real dependency, which makes the emitted
   module throw ReferenceError the moment it is imported — loud, immediate and caught by the
   very first self-test. Under-collecting drags in a renderer, which is silent. */
function boundNames(text) {
  const { code: c2, depth: dp } = scan(text);
  const out = new Set();
  const add = s => { for (const g of s.matchAll(IDENT)) if (!KEYWORD.has(g[1])) out.add(g[1]); };
  const matchParen = a => { let d2 = 0;
    for (let k = a; k < text.length; k++) { if (!c2[k]) continue;
      if (text[k] === '(') d2++; else if (text[k] === ')') { d2--; if (!d2) return k; } }
    return -1; };
  for (let i = 0; i < text.length; i++) {
    if (!c2[i]) continue;
    if (text.startsWith('function', i) && !/[\w$]/.test(text[i - 1] || ' ')) {
      const a = text.indexOf('(', i), b = a >= 0 ? matchParen(a) : -1;
      if (b > 0) add(text.slice(a + 1, b));
    }
    if (text[i] === '(') {                       /* ( params ) => */
      const b = matchParen(i);
      if (b > 0) { let k = b + 1; while (k < text.length && /\s/.test(text[k])) k++;
        if (text.slice(k, k + 2) === '=>') add(text.slice(i + 1, b)); }
    }
  }
  for (const g of text.matchAll(/([A-Za-z_$][\w$]*)\s*=>/g)) out.add(g[1]);   /* x => … */
  for (const g of text.matchAll(/\b(?:function|class)\s+([A-Za-z_$][\w$]*)/g)) out.add(g[1]);
  for (const g of text.matchAll(/\bcatch\s*\(\s*([A-Za-z_$][\w$]*)/g)) out.add(g[1]);

  /* ── DECLARATOR LISTS ──────────────────────────────────────────────────────
     `const c = …, L = j + 0.5, ex = specEig(…), rows = []` binds FOUR names. A regex that
     stops at the first '=' binds one, and the other three then look like references to
     whatever the atlas happens to declare at top level under those names — which is how
     ebkCompare's local `rows` resolved to a renderer array. So the list is walked at its
     own bracket depth: a binder sits after the keyword or after a comma at that depth,
     and the statement ends at a semicolon there or at any bracket closing below it. */
  const kw = /\b(var|let|const)\b/g;
  let g;
  while ((g = kw.exec(text))) {
    if (!c2[g.index]) continue;
    for (const n of listBinders(text, c2, dp, g.index, g[1].length)) out.add(n);
  }
  return out;
}
/* an object-literal KEY is not a reference. ZPF = {…, C: 2.99792458e8, …} was pulling the
   whole renderer in through a top-level `C` declared 20 000 lines away, and specSpectrum
   through its own `gap:` and `total:` keys. A key is an identifier followed by ':' whose
   previous significant character opens or continues an object literal — which is exactly
   what distinguishes it from the middle branch of a ternary. */
function isObjectKey(text, c2, i, len) {
  let k = i + len; while (k < text.length && /\s/.test(text[k])) k++;
  if (text[k] !== ':' || text[k + 1] === ':') return false;
  let j = i - 1; while (j >= 0 && (/\s/.test(text[j]) || !c2[j])) j--;
  return j < 0 || text[j] === '{' || text[j] === ',';
}
function refs(d) {
  const out = new Set();
  const { code: c2 } = scan(d.text);
  const bound = boundNames(d.text);
  for (const g of d.text.matchAll(IDENT)) {
    if (!c2[g.index]) continue;                 // inside a string or comment
    if (d.names.includes(g[1]) || bound.has(g[1])) continue;
    if (isObjectKey(d.text, c2, g.index, g[1].length)) continue;
    out.add(g[1]);
  }
  return out;
}

/* ── AUGMENTING STATEMENTS ───────────────────────────────────────────────────
   `const ZPF = {…}` is a declaration; the very next line, `ZPF.EP = ZPF.HBAR*ZPF.C/FBS.lP`,
   is not — it is a bare expression statement, and an extractor that only collects
   declarations emits an object with a missing field and no error anywhere. So top-level
   statements that WRITE TO a name already in the closure come along with it. */
const PATCHES = [];
{
  const re = /(?:^|\n)([ \t]*)([A-Za-z_$][\w$]*)\s*(?:\.[\w$]+|\[[^\]\n]*\])(?:\s*(?:\.[\w$]+|\[[^\]\n]*\]))*\s*(?:\+|-|\*|\/|\|\||\?\?)?=[^=]/g;
  let g;
  while ((g = re.exec(SRC))) {
    const at = g.index + (g[0][0] === '\n' ? 1 : 0) + g[1].length;
    if (!topLevel(at)) continue;
    let j = at;
    for (; j < SRC.length; j++) {
      if (!code[j] || depth[j] !== 0) continue;
      if (SRC[j] === ';') { j++; break; }
      if (SRC[j] === '\n') { let n = j + 1; while (n < SRC.length && /\s/.test(SRC[n])) n++;
        if (n >= SRC.length || (!'.,+-*/%?:)]}=&|`'.includes(SRC[n]) && SRC.slice(n, n + 2) !== '=>')) break; }
    }
    PATCHES.push({ base: g[2], text: SRC.slice(at, j), at, end: j, names: [], patch: true });
  }
}
for (const p of PATCHES) p.refs = refs({ ...p, names: [] });

/* ── THE ROOTS ───────────────────────────────────────────────────────────────
   Named here and nowhere else. Adding a kernel means adding its entry point to this list;
   everything it needs comes along by itself. */
export const ROOTS = [
  /* fbs.zero_point_ladder */
  'zpRung', 'zpTemperatureOf', 'levelR', 'ZPF', 'zpEqualTemperature',
  /* s3.spectral_operator · s3.ebk_quantisation · s3.particle_creation */
  'specSpectrum', 'ebkCompare', 'pcCreate',
  /* stars.main_sequence_and_the_mass_to_light_ratio */
  'HR_MSUN', 'HR_LSUN', 'HR_RSUN', 'HR_TSUN', 'HR_C', 'HR_G', 'HR_SIGMA', 'HR_YR', 'HR_GYR',
  'HR_EPS', 'HR_FCORE', 'HR_KAPPA', 'HR_EDD_FRACTION',
  'hrEddington', 'hrLuminosity', 'hrExponent', 'hrRadius', 'hrTemperature',
  'hrLifetime', 'hrLifetimeGyr', 'hrTurnoff', 'hrRemnant', 'hrIMF',
  'hrMassToLight', 'hrMassToLightNoRemnants', 'hrPopulation', 'hrSunCheck', 'hrGiantLight',
  /* galaxy.rotation_curve_and_the_missing_mass */
  'GR_G', 'GR_MSUN', 'GR_KPC', 'GR_PC', 'GR_C', 'GR_MPC', 'GR_A0', 'GR_HELIUM', 'GR_GALAXIES',
  'grBessI0', 'grBessI1', 'grBessK0', 'grBessK1', 'grWronskian', 'grBesselResidual',
  'grDiscV2', 'grDiscSigma0', 'grDiscV', 'grDiscPeak', 'grKeplerV', 'grGasV2',
  'grNFWMass', 'grNFWV', 'grIsoV', 'grIsoAsymptote',
  'grGalaxy', 'grBaryonicMass', 'grDecompose',
  'grBTFRFit', 'grBTFRFromA0', 'grA0FromBTFR', 'grMondNu', 'grMondG', 'grRAR',
  'grAccelerationScales',
  /* exoplanet.transit_wobble_zone */
  'XP_AU', 'XP_RSUN', 'XP_RJUP', 'XP_REARTH', 'XP_MJUP', 'XP_MEARTH', 'XP_DAY', 'XP_YR',
  'XP_G', 'XP_GMSUN', 'XP_MSUN_IMPLIED', 'XP_LSUN', 'XP_TSUN', 'XP_SIGMA', 'XP_HZ',
  'xpDepth', 'xpSemiMajor', 'xpPeriod', 'xpDuration', 'xpTransitProbability',
  'xpRadialVelocity', 'xpEquilibriumT', 'xpLuminosity', 'xpHabitableZone', 'xpInZone',
  'XP_SYSTEMS', 'xpSystem', 'xpLightCurve', 'xpOverlap', 'xpZoneStanding', 'xpFluxEarth',
  /* lambda.as_a_length */
  'LM_C', 'LM_G', 'LM_HBAR', 'LM_KB', 'LM_MPC', 'LM_GLY', 'LM_PARTICLE_GLY',
  'lmPlanckArea', 'lmPlanckDensity', 'lmLambda', 'lmHubbleLength', 'lmDeSitter',
  'lmArea', 'lmEntropy', 'lmBits', 'lmGibbonsHawking', 'lmVacuumDensity',
  'lmVacuumEnergyDensity', 'lmPlanckRatio', 'lmLambdaInPlanckUnits', 'lmHorizons',
  'LM_DENSITIES',
  /* circulation.same_theorem */
  'CQ_H', 'CQ_E', 'CQ_U', 'CQ_M4', 'CQ_M3', 'CQ_CORE', 'cqKappa4', 'cqKappa3', 'cqPhi0',
  'cqFeynman', 'cqAbrikosov', 'cqRotationPerTesla', 'cqSpacing', 'cqOmegaC1',
  'cqRingSpeed', 'cqLattice', 'cqVTheta', 'cqProfile',
  /* clock.exchange */
  'CK_S', 'CK_R', 'CK_B', 'CK_REF', 'ckF', 'ckRK', 'ckMaxima', 'ckMapExponent',
  'ckBridge', 'CK_TIME_UNITS', 'ckHasClock', 'CK_CLOCKS',
  /* phorizon.horizon */
  'HZ_LN2', 'hzJac', 'hzMv', 'hzStep', 'hzGS', 'hzRK', 'hzSpectrum', 'hzKY',
  'hzHorizon', 'hzPesin', 'hzSpread', 'hzFirstPassage', 'hzStretch', 'hzBlocks',
  'HZ_CLOCKS', 'HZ_SOURCES', 'hzGyroPair',
  /* bianchi_ix.evolution */
  'bixSeed', 'bixIntegrate', 'bixLyapunov', 'bixClassify',
  /* edge.admissibility_no_go */
  'PHI_R', 'edgeRdiag', 'edgeNaiveRoot', 'edgeRootWith', 'edgeZetaEff', 'edgeZetaFromSpecies',
  'edgePval', 'edgeKL', 'edgeEisenstein', 'EDGE_ZETA0_SCALAR', 'EDGE_LNDET_UNIT',
  /* capacity.conditional_selector */
  'capNphi', 'capLambda', 'capSigma', 'capGamma', 'capGammaD', 'capBg2', 'capGateBudget',
  'CAP_LAM_OBS', 'CAP_LAM_SIG', 'CAP_U_STAR', 'CAP_GATES',
  /* fibonacci.anyons */
  'FIB_PHI', 'FIB_D', 'FIB_S1', 'FIB_S2', 'fibFusion', 'fibBraid', 'fibMM',
  'fibFsym', 'fibMonodromy', 'fibAxioms', 'fibPentagon', 'fibHexagon',
  /* civp.cp1_locking */
  'civpLock', 'civpResidual', 'civpCarrier', 'civpBergman', 'civpAndreief', 'civpTate',
  'civpZeroNoGo', 'civpNormDivisor', 'civpEvalMatrix', 'civpVandermonde', 'civpCohomology',
  /* civp.embadon_measure */
  'civpCapacity', 'civpBosonic', 'civpGluing', 'civpEffectiveDivisor', 'civpRigidity',
  'civpCornerModes', 'civpCentralWeight',
  /* civp.finite_index */
  'CIVP_PHI', 'CIVP_GOLD', 'civpJonesSpectrum', 'civpAdmissible', 'civpWindow',
  'civpTwoWitness', 'civpDivisibleNoGo', 'civpFuzzyNoGo', 'civpMatrixTower',
  'civpLadderNoGo', 'civpA4', 'civpADE', 'civpFibFibre', 'civpTower',
  /* civp.uv_selector */
  'civpKappa', 'civpReweight', 'civpProfile', 'civpSelect', 'civpBoundedGrowth',
  'civpTopResponse', 'civpTopStability', 'civpDiffQuotient',
  'CIVP_EXTERNAL', 'civpCasimirDecompose', 'civpCasimirGate', 'civpUltralocalDefect', 'CIVP_NULL_PHASE',
  /* civp.finite_carrier */
  'civpBorelWeil', 'civpPolarisation', 'civpLeakage', 'civpHankel', 'civpCapelli',
  'civpCrossRatio', 'civpProjectiveNoGo', 'civpCapelliGate',
  /* civp.closure */
  'CIVP_LP', 'civpVacuumShift', 'civpDeSitter', 'civpCapacityFromLambda', 'civpSaddle',
  'civpEntropyBridge', 'civpAddMultNoGo', 'civpFirstLaw', 'civpShapeNorm',
  'civpShapeQuotient', 'civpHopf', 'civpClosure', 'CIVP_CERTIFICATES', 'CIVP_LEDGER',
  /* the seven stations: the SAME function that draws the scene answers the API */
  'CIVP_STATIONS', 'civpDiagnostics', 'civpExportData',
  /* ── FIVE LABORATORIES THAT DREW AND DID NOT COMPUTE ──────────────────────
     Sixty-nine of the eighty render and return no number. For these five the physics was
     already here — written to draw the scene — and one declaration short of an instrument.
     Taking them is a slice, not a retyping, so the kernel and the picture stay the same
     function. bhtKerr had to be made pure first: it reached for state.bhtSpin as a default
     and THREE.MathUtils for a clamp, and either one would have failed the extraction. */
  'bhtKerr', 'bhtArea', 'bhtEvapYr',
  'shY', 'shPlm', 'shNlm',
  'nucBE', 'nucBperA', 'nucBestZ',
  'bbPlanck',
  'wilQuad',
  /* ── AND FOUR MORE THAT DREW AND DID NOT COMPUTE ──────────────────────────
     Kramers-Kronig on a Lorentz oscillator, the EXACT Schwarzschild deflection by
     quadrature, the free rigid body in Jacobi elliptic functions, and the standard map's
     Lyapunov exponent. Same rule as the five before them: the function that draws is the
     function that answers, and the extractor refuses anything that reaches for a renderer. */
  'cauChiIm', 'cauKK', 'cauSum', 'CAU_H', 'CAU_N',
  'lensAlpha', 'lensPeriU', 'LENS_RS', 'LENS_BCRIT',
  'poinSolve', 'poinOmega', 'jacobiSCD',
  'kamStep', 'kamLyapunov',
  /* two integers that cannot be almost right: a linking number and a winding number. The
     Gauss integral had to be rewritten on plain [x,y,z] triples first — it allocated
     THREE.Vector3 and read .x off its input, and the extractor refuses that on purpose. */
  'topoLinkPure', 'topoHopfPts', 'topoHopfPair',
  'dfxPhase', 'dfxWinding', 'dfxOmega', 'dfxDegree',
  /* five more that drew without answering: the Chern number of the Qi-Wu-Zhang band (an
     exact integer, by the gauge-invariant Fukui-Hatsugai-Suzuki plaquette sum), the three
     KdV invariants under a spectral integrator, the quaternion double cover, the cusp
     catastrophe's real roots, and the Chandrasekhar mass-radius relation. */
  'berryD', 'berryN', 'berryF', 'berryChernFHS', 'berryGap',
  'qmFFT', 'KDV_N', 'KDV_L', 'kdvSech', 'kdvSoliton', 'kdvGridX', 'kdvTwoSoliton',
  'kdvNonlin', 'kdvEvolve', 'kdvInvariants',
  'su2mul', 'su2conj', 'su2axang', 'su2slerp',
  'cuspRoots',
  'wdMch', 'wdRadiusKm', 'WD_RSUN_KM', 'WD_G', 'WD_MSUN', 'WD_C',
  /* five more: the holonomy observatory's five closed-form identities, the exact
     thermoelectric efficiency, the Peters inspiral, the Turing threshold, and the
     phase/group velocity ratios. holSphereTransport allocated four THREE.Vector3 per
     step and had to be rewritten as Rodrigues on plain arrays first. */
  'HOL_TAU', 'holWrap', 'holPt', 'holTransportPure', 'holBerryWilson',
  'holQ', 'holQMul', 'holQInv', 'holQNorm', 'holQAxis', 'holQArray',
  'holM3Mul', 'holM3Vec', 'holM3Det', 'holBoostX', 'holBoostY',
  'holM2Mul', 'holM2Det', 'holM2Inv', 'holMobiusApply',
  'teMroot', 'teEta', 'teCOP',
  'GW_G', 'GW_C', 'GW_MSUN', 'gwChirpMass', 'gwDfdt', 'gwTau', 'gwFisco', 'gwStokes',
  'gwPetersRates', 'gwMergerTime',
  'rdTuring',
  'DISP_SYS',
  /* four more: the Laplace-Runge-Lenz vector, which is conserved for the inverse-square
     law and for NOTHING ELSE — the sharpest statement in classical mechanics and the one
     this atlas can measure; the Aufbau order with its twenty exceptions and Slater's
     screening; the pole-zero response of a driven resonator; and the Lorentz boost. */
  'noeJ', 'noeOrbit', 'noeInvariants', 'noeFock', 'noeEig4', 'noeGram',
  'AUFBAU', 'CONF_EXC', 'atomConfig', 'slaterZeff',
  'POLE_W0', 'poleR', 'POLE_PRESETS',
  'relGamma', 'relBoostPts', 'REL_S',
  /* four more: detailed balance (the Shockley-Queisser limit is an INTEGRAL, not a fit),
     the strange attractors with their exact fixed points and volume contraction, the Boris
     pusher — whose defining property is exact energy conservation in a pure magnetic field —
     and the three superconducting numbers, two of them exact by SI definition. */
  'PV_q', 'PV_kB', 'PV_h', 'PV_c', 'PV_SIG', 'PV_TSUN', 'PV_DIL', 'pvFlux', 'pvCell',
  'CHAOS_SYS', 'chaosRK4',
  'cpFieldPure', 'cpBorisPure',
  'SC_PHI0', 'SC_KJ', 'SC_KB_MEV', 'SC_MATS', 'scGapMeV', 'scJosephsonGHz', 'scFluxQuanta',
  /* five more: the Tolman-Oppenheimer-Volkoff equation (a real integration, with a maximum
     mass that is the whole point of it), the Carnot cycle, the surface-plasmon resonance of
     a hole array, the split-step Schrodinger propagator, and the Hopf fibre of a qubit. */
  'NS_K', 'NS_GAM', 'NS_KM', 'tovSolve',
  'heCyclePure',
  'eotEpsM', 'eotLamRes', 'EOT_LMIN', 'EOT_LMAX', 'EOT_AMIN', 'EOT_AMAX',
  'QM_N', 'QM_L', 'QM_DX', 'qmX', 'qmK', 'qmPropagate', 'qmGaussian', 'qmHarmonic', 'qmMoments',
  'spinRodrigues', 'spinFibrePure', 'spinHopfProject',
  /* four more: pulsar spin-down (four closed forms and a geometry), the Eddington
     luminosity, a two-pole S-matrix whose unitarity is an identity rather than a fit, and
     an information ledger whose counts are exact integers. */
  'PSR_PRESETS', 'psrB', 'psrTau', 'psrLsd', 'psrRvm',
  'QSO_ETA', 'qsoLEdd',
  'RSH_C', 'rshErePole', 'rshCmul', 'rshCdiv', 'rshS', 'rshSigma',
  'RPD_N', 'RPD_RCAR', 'RPD_RHMAX', 'rpdArea', 'rpdRh', 'rpdLayer', 'rpdCounts', 'rpdIext',
  /* four more: the Rankine-Hugoniot jump conditions (whose strong-shock compression is
     exactly (gamma+1)/(gamma-1) and no more, however hard you hit it), the Anderson
     transfer-matrix Lyapunov exponent against the Thouless formula, the Bateman solution
     for Ni -> Co -> Fe, and a geodesic integrator checked against the exact deflection. */
  'rmhdAlfven', 'rmhdSweetParker', 'rmhdShock', 'rmhdRT',
  'andRng', 'andGamma', 'andThouless',
  'SN_DAY', 'SN_YEAR', 'SN_TAUNI', 'SN_TAUCO', 'SN_ENI', 'SN_ECO', 'SN_MSUNG', 'SN_C',
  'snDecayFractions', 'snRadioComponents', 'snLradio',
  'bhrTraceJS',
  /* four more: symplectic matrices (where det = 1 is necessary and NOT sufficient, and the
     laboratory carries a counterexample), the Kerr-Newman first law with an analytic dA and
     a field-space curl that must come out exactly 2c, a fourth-order symplectic three-body
     integrator, and the Cornell potential with its running coupling. */
  'PSP_J', 'pspI4', 'pspMul', 'pspT4', 'pspSympDefect', 'pspDet', 'PSP_MAPS',
  'CPS_EXTREMAL_TOL', 'cpsKN', 'cpsDA', 'cpsAlpha', 'cpsCurl', 'cpsPathIntegral',
  'GRAV_CS', 'GRAV_DS', 'gravAccel', 'gravStep', 'gravRmin', 'gravInvariants',
  'QCD_HC', 'QCD_AS', 'QCD_SIG', 'qcdV', 'qcdAlphaS',
  /* the three remaining observatories, in the shape hol already established: pure kernels
     out, the station logic written once in the instrument. The *Lang helpers are NOT here —
     they read state.lang and belong to the renderer. */
  'nulC', 'nulCadd', 'nulCsub', 'nulCmul', 'nulCdiv', 'nulCconj', 'nulCabs', 'nulCarg',
  'nulCscale', 'nulCMulExp', 'nulCDot', 'nulSpinor', 'nulSpinNorm', 'nulSpinNormalize',
  'nulSpinDir', 'nulMouter', 'nulMscale', 'nulMdet', 'nulMmul', 'nulMdag', 'nulMapply',
  'nulMatFromVec', 'nulVecFromHermitian', 'nulCVecFromMat', 'nulDot', 'nulMaxVec',
  'nulZeta', 'nulMobius', 'nulCrossRatio', 'nulSL2', 'nulTransformVec',
  'nulWrap', 'nulClamp01',
  'actWrap', 'actClamp01', 'actDot', 'actNorm', 'actScale', 'actGcd', 'actJ', 'actJ4',
  'actLam', 'actDLam', 'actAlpha', 'actDAlpha', 'actXi1', 'actXi2', 'actHopf',
  'actProj4', 'actDProj4', 'actReebPath', 'actEllipsoidPath', 'actLegendrianPath',
  'actContactResidual', 'actGauge', 'actApprox',
  /* syd stops HERE, and the reason is worth recording rather than working around:
     SYD_WORLDS defines each world's state, its sample points and its group action by
     building THREE.Vector3 objects, so the discovery engine cannot be lifted out without
     rewriting those definitions. That is a larger change than this batch, and the
     laboratory stays parametric until it is made. The pure linear algebra underneath —
     the null-space search and the Jacobi eigensolver — comes out now regardless. */
  'sydC', 'sydCSub', 'sydCMul', 'sydCDiv', 'sydCrossRatio', 'sydAngle',
  'sydStereoPt', 'sydMobiusBase', 'sydHash', 'sydEvalPoly',
  'sydMonomials', 'sydMonomialNames', 'sydRREF', 'sydJacobiEig', 'sydSplitPoly',
  /* THE GATE, which is the atlas grading its own claims. Every claim is evaluated at three
     refinement levels and the sequence is graded EXACT / CONVERGED / SENSITIVE / ARTEFACT —
     and separately against theory, because a number can be perfectly converged and still sit
     away from what a formula predicts. The Anderson band-centre anomaly does exactly that. */
  'pspShadow', 'cauG', 'dfxPerturb', 'dfxHedge',
  'GATE_TOL', 'GATE_CLAIMS', 'gateAnalyse', 'gateRun', 'gateRunAll',
  /* and the Bell correlation, which had no name at all: E(a,b) and the lune's solid angle
     were computed inline inside the render loop. */
  'bellE', 'bellLuneOmega', 'bellHolonomy', 'bellCHSH', 'BELL_TSIRELSON',
  /* and the low-multipole sky: synthesise a_lm from a spectrum, integrate them back out of
     the field, and watch a galactic mask break the orthogonality that makes the recovery
     exact. cmbModelDl and cmbModelCl read state.cmbLowPower, so the suppression factor is
     an argument now and the renderer passes its control. */
  'CMB_LMAX', 'CMB_D0', 'cmbHash01', 'cmbGaussian', 'cmbCoeffKey',
  'cmbDlOf', 'cmbClOf', 'cmbCoeffsPure', 'cmbSumL', 'cmbDl', 'cmbMaskAllows', 'cmbRecoverPure',
  /* ── FOUR MORE THAT DREW AND DID NOT COMPUTE ─────────────────────────────
     Resonant transfer, wave optics, kinetic theory and dipole radiation all had their
     physics written INLINE inside their update* functions, exactly as bell's was. The
     closed forms are named now and the renderers call them, so the picture and the
     number cannot come apart. */
  'retOmegaSym', 'retOmegaAnti', 'retBeatTime', 'retEnergyPure', 'retAccel', 'retLeapfrog',
  'retAnalytic', 'retDrivenAmp', 'retPeakOmega', 'retPeakAmp', 'retWirelessU',
  'retWirelessEta', 'retWirelessEtaAlt',
  'waveSlitCenters', 'waveSources', 'waveIntensity', 'waveProfile', 'wavePeaks',
  'waveOrderZ', 'waveOrderZFar', 'waveGratingSin', 'waveOrderZAsym',
  'waveSlitMinSin', 'waveSlitMinSinCont',
  'mathErf', 'mathErfc',
  'kinRandDir', 'kinInitPure', 'kinStepPure', 'kinMoments', 'kinMBPdf', 'kinEntropyPure',
  'kinMaxwellCdf', 'kinSampleMeanSpeed', 'kinKS',
  'kinWallSide', 'kinPressure', 'kinPacking', 'kinZ', 'kinZCarnahanStarling',
  'dipPattern', 'dipPatternNorm', 'dipPatternIntegral', 'DIP_PATTERN_EXACT',
  'dipLarmorRel', 'dipRayleighRatio', 'dipWavefrontSpacing', 'dipHalfPower',
  'emBaseQ', 'emHopfPtPure', 'emFibreTangentPure', 'emFibreLoop',
  'emRightI', 'emRightJ', 'emProjTangent', 'emNullResidual',
  /* ── THE EMBADON LABORATORY ───────────────────────────────────────────────
     Sym^N(CP1) is CP^N, so two embadons on the carrier are a point of a real FOUR
     manifold. These kernels are that identification, its moment polytope, the
     discriminant where two atoms collide, and the braid monodromy of a loop
     around it, which is where the 1/N! of the bosonic quotient comes from. */
  'embSphereFromZ', 'embZFromSphere', 'embPositions', 'embWeights',
  'embFormFromRoots', 'embRootsOfMonic', 'embMatchRoots', 'embMoment',
  'embTorusAngles', 'embFubiniStudy', 'embDiscriminant', 'embSeparation',
  'embCollisionPoint', 'embBraidQ', 'embMonodromy',
  'embRot4', 'embProject4', 'embIsoclinicAngle',
  /* ── THE QUASICRYSTAL, AND THE CRYSTALLOGRAPHIC RESTRICTION IT RESOLVES ───
     Five-fold symmetry is forbidden for any 3D lattice and is an INTEGER matrix
     in six. qcBasis and qcBuild were already pure; the rest is the arithmetic
     that makes the picture a statement. */
  'QC_TAU', 'qcBasis', 'qcBuild', 'qcDot3', 'qcGram', 'qcSplitResidual',
  'qcCompletenessResidual', 'qcRot3', 'qcFiveFold', 'qcMatMul6', 'qcOrderResidual',
  'qcTraceSplit', 'qcInflation', 'qcMinSeparation', 'qcRadialCount',
  /* ── AND POINCARE'S CONE, WHICH IS ALSO THE TAUB-NUT GEODESIC STRUCTURE ───
     J = r x v - N r-hat is conserved, so J . r-hat = -N pins every orbit to a
     cone that can be drawn before a single step is integrated. */
  'tnCross', 'tnDot', 'tnNorm', 'tnUnit', 'tnAccPure', 'tnPoincare',
  'tnConeCos', 'tnConeAngle', 'tnEnergy', 'tnRK4', 'tnV', 'tnSquashOf',
  /* ── AND THE MAGNETIC SOLITON, WHOSE CHARGE IS A LATTICE SUM ─────────────
     Berg-Lüscher is exact on a finite mesh, the Belavin-Polyakov map saturates
     the Bogomolny bound, and the Thiele equation has a closed-form solution the
     laboratory was printing the wrong angle from. */
  'skBPField', 'skSampleBP', 'skSolidAngle', 'skBergLuscher', 'skEnergyPure',
  'skBogomolny', 'skGyrovector', 'skThieleSolve', 'skHallAngle',
  /* ── AND THE HOPF INVARIANT, WHICH IS A LINKING NUMBER AND CAN BE MEASURED ──
     The preimage of a target point is a torus knot in closed form, so the integer
     the field was BUILT from can be read back out of it with a Gauss integral. */
  'hfFieldN', 'hfWMagOfTheta', 'hfPreimage', 'hfHopfCharge',
  'hfEnergySlab', 'hfEnergyPure', 'hfDerrick', 'hfScaled',
  /* ── AND THE OBSERVATIONAL GEOMETRY OF THE THREE-SPHERE ───────────────────
     The redshift kernel the atlas has drawn for versions is exactly the
     surface-to-volume ratio of the causal ball, and exactly the logarithmic
     derivative of its volume measure — which is why the ansatz integrates. */
  'volMeasure', 'S3kernel', 'lnRedshift', 's3BallVolume', 's3SphereArea',
  'S3_UNIT_VOLUME', 's3KernelFlatLimit', 's3ArcShort', 's3ArcLong',
  's3AngularDiameterDistance', 's3AngularSize', 's3Magnification',
  /* ── AND FIVE EXCITATIONS, EACH WITH A DISPERSION NOBODY COULD REACH ──────
     The diatomic chain, the Heisenberg magnon, the Wannier-Mott exciton, the
     Frohlich polaron and the quantised vortex whose circulation does not depend
     on the loop it is measured round. */
  'qpPhononOmega2', 'qpPhononOmega', 'qpSoundSpeed', 'qpOpticalAtZero', 'qpZoneGap',
  'qpMagnonOmega', 'qpMagnonStiffness', 'QP_A0_NM', 'QP_RY_MEV',
  'qpExcitonRadius', 'qpExcitonBinding', 'qpExcitonInvariant',
  'qpPolaronMass', 'qpPolaronEnergy',
  'qpVortexSpeed', 'qpCirculation', 'qpCirculationFromLoop',
  /* ── AND THE HAUSDORFF DIMENSION ATLAS ───────────────────────────────────
     Five self-similar solids built by their own substitution rules, with the
     dimension measured back out of the built geometry by box counting. */
  'FRAC_RULES', 'fracDimension', 'fracExactDimension', 'fracBuild',
  'fracBoxCount', 'fracMeasuredDimension', 'fracCellCount',
  /* ── AND THE MAJOR MOONS, WHICH RECOVER THEIR PARENTS' MASSES ─────────────
     Entered from their own literature values with no planet mass in sight, so
     Kepler's third law over them is a second route to Jupiter and Saturn. */
  'MAJOR_MOONS', 'moonKeplerGM', 'moonOrbitalSpeed', 'moonBiggerThanMercury',
  /* ── EINSTEIN RINGS ───────────────────────────────────────────────────────
     The deflection laboratory says how far a ray bends; these say WHERE the
     images are, which is a quadratic with three exact identities in it. */
  'EL_G', 'EL_C', 'EL_MSUN', 'EL_PC', 'elEinsteinRadius', 'elImages',
  'elMagnifications', 'elTotalMagnification', 'elSisEinsteinRadius',
  'elSisImages', 'elSisMagnifications', 'elIsRing', 'elRingRadiusArcsec', 'elTimeDelay',
  /* ── THE ACCRETION DISK ───────────────────────────────────────────────────
     A temperature profile whose maximum is an exact rational multiple of the
     inner edge, and a spectrum that is a power law because the profile is. */
  'AD_SIGMA', 'AD_G', 'AD_C', 'AD_MSUN', 'AD_H', 'AD_KB', 'AD_MP', 'AD_SIGT',
  'xrLabIds', 'xrLabShort', 'xrLabHeadCounts', 'XR_DOM_SHORT', 'xrDomShort', 'xrLabPickerPlan',
  'xrLabRemember', 'labNamesAllLangs',
  'HE3_HBAR', 'HE3_KB', 'HE3_H', 'HE3_M3', 'HE3_GAMMA', 'HE3_BCS', 'HE3_KAPPA',
  'he3Atanh', 'he3GapA', 'he3GapB', 'he3Gap', 'he3MeanSquareGap', 'he3MeanFourthGap',
  'he3DosA', 'he3DosB', 'he3Dos', 'he3GapFromTc', 'he3TcFromGap', 'he3Coherence',
  'he3Circulation', 'he3NodeCount', 'he3NodeCharge', 'he3TotalNodeCharge',
  'he3HeatCapacityExponent', 'he3GapAnisotropy',
  'NU_HBARC', 'NU_KM', 'NU_GF', 'NU_FLAVOURS', 'nuC', 'nuMul', 'nuAdd', 'nuConj', 'nuAbs2',
  'nuPmns', 'nuUnitarityResidual', 'nuDelta', 'nuProb', 'nuProbRow',
  'nuJarlskogAngles', 'nuJarlskogFromU', 'nuTriangle', 'nuTriangleArea', 'nuTriangleClosure',
  'nuOscLength', 'nuFirstMaximum', 'nuTwoFlavour', 'nuMswDensity', 'nuMixingSquared',
  'DISK_PEAK_RATIO', 'diskShape', 'diskPeakRadius', 'diskTemperature',
  'diskPeakTemperature', 'diskIsco', 'diskEfficiency', 'diskLuminosity',
  'diskEddington', 'diskSpectrum', 'diskSpectralSlope',
  /* ── AND THE LAW THAT JOINS THE TWO MEASUREMENTS ──────────────────────────
     scripts/reach.mjs used to carry its own copy of the composition and multiply two
     artifacts on disk. It imports this one now, so the rule that a chain is the PRODUCT
     of two local exponents — and that the second leg must be fitted from the SOURCE and
     not from the last hop — is written once and read by both the page and the build. */
  'hccReachCompose',
  /* PREMIUM_VIEW_DOMAINS is inside this closure, and folding LAB_DECLARATIONS into it
     put a reference to labDeclIn in the emitted module that the roots did not carry.
     The extractor listed it as "assumed free" and wrote the module anyway. */
  'LAB_DECLARATIONS', 'LAB_DECL_BY_ID', 'labDeclNames', 'labDeclIn', 'labDeclIds',
  /* ── AND WHEN A CLOUD STOPS BEING A CLOUD ─────────────────────────────────
     The join the atlas was missing: seven instruments publish a temperature and
     four inputs take a mass, and nothing turned the first into the second. */
  'JEANS_G', 'JEANS_KB', 'JEANS_MH', 'JEANS_MSUN', 'JEANS_PC', 'JEANS_YR',
  'jeansSound', 'jeansRho', 'jeansLength', 'jeansMass', 'jeansMassVirial',
  'jeansFreeFall', 'jeansCollapses',
  /* ── AND HOW FAR IT IS ────────────────────────────────────────────────────
     The rung between a redshift and a distance. Three inputs of the Einstein-ring
     laboratory took a megaparsec and nothing in the atlas produced one. */
  'COSMO_C', 'COSMO_GYR_PER_INVH', 'cosmoSimpson', 'cosmoE', 'cosmoHubbleDistance',
  'cosmoComoving', 'cosmoLookback', 'cosmoAge', 'cosmoAngularPeak',
  /* and what arrives: the inverse square law and the magnitude scale */
  'PHOT_L0', 'PHOT_LSUN', 'PHOT_PC', 'PHOT_ERG_W',
  'photAbsolute', 'photModulus', 'photFlux', 'photApparent', 'photRatio',
  /* and whether any of it can be seen: the diffraction floor under every angle */
  'RES_AS', 'resBesselJ1', 'RES_J1_ZERO', 'RES_RAYLEIGH_K', 'resRayleigh',
  'resAiry', 'resAiryX', 'resApertureFor', 'resDawes', 'RES_INSTRUMENTS',
  /* and how long you must look for it: the one place in this atlas where a quantity
     is discrete, and where the discreteness IS the noise */
  'PHOTON_H', 'PHOTON_C', 'photonF0', 'photonEnergy', 'photonArea', 'photonRate',
  'photonSNR', 'photonTimeFor', 'photonFluxOfMag', 'photonMagOfFlux',
  'photonLimitingMag', 'photonPoisson', 'photonRng',
  /* and what pushes back: one Fermi-Dirac integral with the ideal gas and the
     Chandrasekhar degenerate form as its two limits rather than as separate terms */
  'EOS_KB', 'EOS_MU', 'EOS_ARAD', 'EOS_H', 'EOS_ME', 'EOS_C', 'EOS_G', 'EOS_MSUN',
  'EOS_LAMC', 'EOS_MEC2', 'EOS_A0', 'EOS_LANE_EMDEN_3',
  'eosFermi', 'eosPsiFor', 'eosNe', 'eosElectron', 'eosIdealE', 'eosX',
  'eosFx', 'eosDegenerateT0', 'eosIon', 'eosRad', 'eosFermiT', 'eosState',
  'eosGamma', 'eosGammaDegenerate', 'eosDominant', 'eosDensityFor',
  'eosKur', 'eosKnr', 'eosLimitingMass',
  /* and how long it lasts: three clocks, twelve orders of magnitude apart */
  'TS_G', 'TS_C', 'TS_YR', 'TS_MSUN', 'TS_RSUN', 'TS_LSUN', 'TS_M_H', 'TS_M_HE',
  'tsEfficiency', 'tsDynamical', 'tsThermal', 'tsNuclear', 'tsGrowth',
  'tsMeanDensity', 'tsFreeFall', 'tsBinding', 'tsOrdering',
  /* and how bright it is per patch of sky, which nothing could ask before */
  'SB_AS', 'SB_SR_PER_ASEC2', 'SB_L0', 'SB_PC', 'SB_TOLMAN_POWERS',
  'sbF0', 'sbI0', 'sbRadianceOfMu', 'sbMuOfRadiance', 'sbRadiance',
  'sbDiscSolidAngle', 'sbSolidAngleToAsec2', 'sbImageIrradiance', 'sbImagePhotonRate',
  'sbTolmanExponent', 'sbDimming', 'sbDimmingMag', 'sbTiredLightDimming', 'sbContrast',
  /* and every anyon there is: the modular data of thirteen models, computed */
  'AZ_MODELS', 'AZ_BY_ID', 'AZ_UNIVERSAL',
  'azFusion', 'azQuantumDim', 'azDims', 'azSpins', 'azS', 'azGauss',
  'azVerlinde', 'azModular', 'azUniversal',
  'azC', 'azCm', 'azCa', 'azMm', 'azDag', 'azPh', 'AZ_ID2',
  'azBraidGens', 'azBloch', 'azBraidImage',
  /* and the chain from a knot to a computer: Kauffman bracket, Temperley-Lieb, the
     Markov trace, the Jones polynomial, and a hunt for a braid word */
  'JQ_A', 'jqPZero', 'jqPMono', 'jqPAdd', 'jqPMul', 'JQ_DELTA',
  'jqIdentity', 'jqE', 'jqKey', 'jqCompose', 'jqUnit', 'jqMul', 'jqRho',
  'jqClosureLoops', 'jqBracket', 'jqJones', 'jqPolyString', 'jqPolyEqual',
  'jqCatalan', 'jqDelta', 'JQ_KNOTS',
  'JQ_GATES', 'jqDist', 'jqGens', 'jqHuntExhaustive', 'jqHuntRandom',
  /* and the one question sixteen quantum laboratories never answered: when */
  'QR_H', 'QR_HBAR', 'QR_KB', 'QR_C', 'QR_ME', 'QR_MU', 'QR_E', 'QR_EPS0', 'QR_BEC',
  'qrLambdaT', 'qrDegeneracy', 'qrFermiEnergy', 'qrFermiT', 'qrFrozen',
  'qrFreezeFrequency', 'qrCyclotron', 'qrLandau', 'qrAction', 'qrTunnel',
  'qrTransmission', 'qrCasimir', 'qrCompton', 'qrBecT', 'qrCriteria', 'QR_SYSTEMS',
  /* and what a bit costs: entropy published in three clusters and consumed in none */
  'IL_KB', 'IL_HBAR', 'IL_H', 'IL_C', 'IL_G', 'IL_LN2', 'IL_MSUN', 'IL_E',
  'ilPlanckArea', 'ilLandauer', 'ilLandauerEV', 'ilBitsFromJK', 'ilBitsFromNats',
  'ilJKFromBits', 'ilBekenstein', 'ilHorizonEntropy', 'ilHolographicDensity',
  'ilSchwarzschildArea', 'ilMargolus', 'ilBremermann', 'ilEntropyGap', 'IL_HOLDERS'
];

const REFS = new Map(DECLS.map(d => [d, refs(d)]));

function closure(roots) {
  const want = new Set(), missing = new Set(), browser = new Map();
  /* breadth first, remembering who pulled whom in, so a failure can name the CHAIN from a
     kernel to the renderer instead of just the renderer — the chain is the thing to cut */
  const via = new Map(roots.map(r => [r, null]));
  const queue = [...roots];
  while (queue.length) {
    const n = queue.shift();
    if (GLOBALS.has(n) || KEYWORD.has(n)) continue;
    if (BROWSER.has(n)) { if (!browser.has(n)) browser.set(n, path(via, n)); continue; }
    const d = BY_NAME.get(n);
    if (!d) { missing.add(n); continue; }
    if (want.has(d)) continue;
    want.add(d);
    for (const r of REFS.get(d)) { if (!via.has(r)) via.set(r, n); queue.push(r); }
    /* whatever writes to this name is part of it */
    for (const p of PATCHES) if (p.base === n && !want.has(p)) { want.add(p);
      for (const r of p.refs) { if (!via.has(r)) via.set(r, n); queue.push(r); } }
  }
  return { want, missing, browser };
}
function path(via, n) { const out = []; let k = n, guard = 0;
  while (k != null && guard++ < 64) { out.push(k); k = via.get(k); }
  return out.reverse().join(' → '); }

const { want, missing, browser } = closure(ROOTS);
const rootMissing = ROOTS.filter(r => !BY_NAME.has(r));

if (rootMissing.length) {
  console.error(`extraction FAILED: these roots are not top-level declarations in index.html:\n  ${rootMissing.join(', ')}`);
  process.exit(1);
}
if (browser.size) {
  console.error(`extraction FAILED: the closure touches browser globals — the physics is still ` +
    `entangled with the renderer. The chain from a kernel to each one:`);
  for (const [g, chain] of browser) console.error(`  ${g}\n    ${chain}`);
  process.exit(1);
}

/* names that are referenced but never declared at top level: parameters of enclosing
   arrow chains, labels, and genuine globals. They are reported, not silently allowed. */
const unresolved = [...missing].filter(n => !GLOBALS.has(n) && !KEYWORD.has(n)).sort();

const ordered = [...want].sort((a, b) => a.at - b.at);
const exported = [...new Set(ordered.flatMap(d => d.names || []))].sort();

const body = ordered.map(d => d.text).join('\n\n');
/* The recorded hash covers the EXTRACTED DECLARATIONS, not the whole module block. Hashing
   the block made a version-string bump read as a change to the physics, so the drift guard
   cried wolf on every release and would soon have been switched off — which is how a guard
   stops guarding. This hash moves when, and only when, the mathematics does. */
const header = `/* GENERATED by scripts/extract-kernels.mjs — DO NOT EDIT.
   The transitive closure of the physics the computational kernels name, sliced verbatim
   out of the single module block of index.html and emitted in original source order.
   Editing this file instead of index.html would create the second copy the extractor
   exists to prevent; scripts/ci.mjs regenerates it and the build fails if it differs.

   declarations: ${ordered.length}   ·   exported names: ${exported.length}
   extracted physics, sha256 ${createHash('sha256').update(body).digest('hex')} */

`;
const foot = `\n\nexport {\n  ${exported.join(', ')}\n};\n`;
const out = header + body + foot;

mkdirSync(join(ROOT, 'core/atlas'), { recursive: true });
const target = join(ROOT, 'core/atlas/extracted.mjs');
let previous = null;
try { previous = readFileSync(target, 'utf8'); } catch {}

/* --check is the DRIFT GUARD. Someone editing the physics in index.html and not
   regenerating would leave the API answering with yesterday's mathematics while the picture
   shows today's, and nothing would say so. In CI this fails the build instead. */
const check = process.argv.includes('--check');
if (check) {
  if (previous === out) { console.log(`extracted module is in step with index.html · ${ordered.length} declarations`); process.exit(0); }
  console.error('DRIFT: core/atlas/extracted.mjs does not match index.html.\n' +
    '  The atlas physics changed and the kernels were not regenerated, so the API would answer\n' +
    '  with different mathematics from the one the atlas draws. Run: node scripts/extract-kernels.mjs');
  process.exit(1);
}
writeFileSync(target, out);

/* ── AND THE MODULE MUST LOAD, WHICH THIS NEVER CHECKED ─────────────────────
   This wrote a file and reported success on its byte count. Whether the file it had just
   emitted could be IMPORTED was somebody else's problem, and the somebody was
   scripts/build-api.mjs three steps later, failing with a raw stack trace about a name
   nobody would connect to an extraction.

   That is exactly what happened: folding a declaration table into PREMIUM_VIEW_DOMAINS
   put a reference to labDeclIn inside this closure, the roots did not carry it, and this
   script printed it in the "assumed free" line and wrote the module anyway. That line is
   where a broken module hides — it is a list of names this script decided not to worry
   about, and every one of them is either a genuine global or a defect.

   So the emitted module is imported before this exits. A file that cannot be loaded is
   not an extraction, and the error names the extraction rather than surfacing three steps
   downstream as somebody else's ReferenceError. */
{
  const url = pathToFileURL(target).href + '?verify=' + out.length;
  try { await import(url); }
  catch (e) {
    console.error(`extraction FAILED: core/atlas/extracted.mjs was written and does not load.`);
    console.error(`  ${String(e && e.message || e).split('\n')[0]}`);
    if (unresolved.length) {
      console.error(`  names this script resolved outside the closure and assumed were globals:\n    ${unresolved.join(', ')}`);
      console.error('  If the missing name is one of those, it is not a global — add it to ROOTS.');
    } else {
      console.error('  Nothing was assumed free, so the missing name is reached from inside a declaration');
      console.error('  this script DID take: add it to ROOTS and the closure will carry it.');
    }
    process.exit(1);
  }
}

console.log(`extracted ${ordered.length} declarations · ${exported.length} names · ` +
  `${(out.length / 1024).toFixed(1)} KB${previous === out ? ' · unchanged' : ' · REWRITTEN'} · loads`);
if (unresolved.length)
  console.log(`  references resolved outside the closure (assumed free): ${unresolved.join(', ')}`);
