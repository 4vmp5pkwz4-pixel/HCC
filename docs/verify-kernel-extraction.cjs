#!/usr/bin/env node
/* ── DOES THE EXTRACTED MODULE STILL SAY WHAT THE ATLAS SAYS? ─────────────────
   Eight of the twelve computational kernels are not written in core/labs — they are SLICED
   out of index.html by scripts/extract-kernels.mjs. That buys a guarantee (the picture and
   the number cannot drift) and creates a risk (the slicer could be wrong).

   So this file checks the slicer against the thing it sliced from, by two independent
   routes that must agree:

     1. the extracted module is byte-identical to a fresh extraction — no hand edits;
     2. every extracted declaration appears VERBATIM inside index.html — the slicer copies,
        it never paraphrases;
     3. the closure is closed: nothing in the module references a name the module does not
        define, other than the language's own globals;
     4. the physics comes out with the values the atlas quotes for it, checked against
        numbers written down in the atlas's own prose rather than against itself.

   Run: node docs/verify-kernel-extraction.cjs */
const { readFileSync } = require('node:fs');
const { execFileSync } = require('node:child_process');
const { join } = require('node:path');

const ROOT = join(__dirname, '..');
let pass = 0, fail = 0;
const ok = (name, cond, detail = '') => { cond ? pass++ : fail++;
  console.log(`${cond ? '  PASS' : '  FAIL'} — ${name}${detail ? '\n         ' + detail : ''}`); };

const HTML = readFileSync(join(ROOT, 'index.html'), 'utf8');
const MOD = readFileSync(join(ROOT, 'core/atlas/extracted.mjs'), 'utf8');

console.log('\n=== 1. The module is generated, not typed ===\n');
{
  let out = '', clean = true;
  try { out = execFileSync('node', [join(ROOT, 'scripts/extract-kernels.mjs'), '--check'],
    { cwd: ROOT, encoding: 'utf8' }); }
  catch (e) { clean = false; out = String(e.stdout || '') + String(e.stderr || ''); }
  ok('a fresh extraction reproduces the committed module byte for byte', clean, out.trim().split('\n')[0]);
}

console.log('\n=== 2. The slicer copies; it never paraphrases ===\n');
{
  /* strip the generated header and the export list, then require every remaining
     declaration to occur verbatim in index.html */
  const body = MOD.slice(MOD.indexOf('*/') + 2, MOD.lastIndexOf('\nexport {'));
  /* ── AND A BLANK LINE IS NOT A BOUNDARY ───────────────────────────────────
     This split on '\n\n' because the extractor joins declarations with a blank line
     and no declaration had ever contained one. That was an accident about the corpus,
     not a property of the format, and the first function whose body carried a
     paragraph break in a comment split into four pieces here — three of which were
     English prose, reported as declarations that are neither declarations nor
     statements, plus a header count that suddenly disagreed by exactly four.

     The extractor's boundaries are recoverable without changing what it writes: a new
     declaration begins at a blank line FOLLOWED BY one, at column zero. A blank line
     inside a body is followed by indented code or by more of a comment, so it does not
     end anything. */
  const STARTS = /^(?:function|const|let|var|class)\b|^[A-Za-z_$][\w$]*\s*[.[]/;
  const decls = body.split('\n\n').reduce((acc, part) => {
    if (acc.length && !STARTS.test(part)) acc[acc.length - 1] += '\n\n' + part;
    else acc.push(part);
    return acc;
  }, []).map(s => s.trim()).filter(Boolean);
  const missing = decls.filter(d => !HTML.includes(d));
  ok(`all ${decls.length} extracted declarations appear verbatim in index.html`,
    missing.length === 0,
    missing.length ? `${missing.length} do not, first: ${missing[0].slice(0, 120)}…`
      : 'every byte of the physics in the module is a byte of the physics in the atlas');

  /* not every piece is a DECLARATION: four of them are augmenting statements — `ZPF.EP =
     ZPF.HBAR*ZPF.C/FBS.lP` and its kind — which the extractor deliberately carries along,
     because an object whose fields are filled in on the next line is not complete without
     them. A check that demanded declarations only was demanding the extractor be wrong. */
  const isDecl = d => /^(function|const|let|var|class)\b/.test(d);
  const isPatch = d => /^[A-Za-z_$][\w$]*\s*[.[]/.test(d);
  const stray = decls.filter(d => !isDecl(d) && !isPatch(d));
  ok('and every piece is either a declaration or a statement that completes one',
    stray.length === 0,
    stray.length ? `${stray.length} are neither, first: ${stray[0].slice(0, 120)}…`
      : `${decls.filter(isDecl).length} declarations and ${decls.filter(isPatch).length} augmenting statements ` +
        `(an object filled in on the line after it is declared is not complete without them)`);

  const stated = Number(/declarations:\s*(\d+)/.exec(MOD)[1]);
  ok('the module\'s own header counts what the module actually contains', stated === decls.length,
    `header says ${stated}, the file holds ${decls.length}`);
}

console.log('\n=== 3. The closure is closed ===\n');
{
  /* the module must import nothing. If it referenced anything outside itself it could only
     get it from a global, and a global is exactly what a pure kernel must not need. */
  ok('the module imports nothing at all', !/^\s*import\s/m.test(MOD),
    'no import statement anywhere; the physics stands on the language and nothing else');

  /* A browser global is only dangerous when it is DEREFERENCED or CALLED. The first version
     of this check matched the bare word and failed on `stop = 'window'` — the name of a
     stopping reason inside a string, which is not a global at all. Grepping for a word and
     grepping for a use are different questions, and only the second one is this one. */
  const browser = ['window', 'document', 'THREE', 'navigator', 'localStorage', 'location',
    'devicePixelRatio', 'screen', 'history', 'HTMLElement', 'performance'];
  const called = ['requestAnimationFrame', 'cancelAnimationFrame', 'getComputedStyle', 'fetch', 'alert'];
  /* AND THE SECOND TIME IT WAS WRONG IT WAS WRONG THE OTHER WAY. Tightened to require a
     dereference, this still matched `twice the window. It is published so...` — a sentence
     inside a doc string, where the full stop that follows the word is punctuation and not
     a property access. Excluding the quote character before the name does not help; the
     character before `window` there is a space, exactly as it would be in code.

     A regex over a file cannot tell code from prose, so this stops trying: string and
     template literals and comments are REMOVED first, and only what is left is grepped.
     The doc strings of this atlas are long and full of English, and every one of them was
     a place a browser global could hide from a reader while tripping a check. */
  const stripLiterals = src => {
    let out = '', i = 0;
    while (i < src.length) {
      const c = src[i];
      if (c === '/' && src[i + 1] === '/') { while (i < src.length && src[i] !== '\n') i++; continue; }
      if (c === '/' && src[i + 1] === '*') { i += 2; while (i < src.length && !(src[i] === '*' && src[i + 1] === '/')) i++; i += 2; continue; }
      if (c === "'" || c === '"' || c === '`') {
        const q = c; i++;
        while (i < src.length && src[i] !== q) { if (src[i] === '\\') i++; i++; }
        i++; out += ' '; continue;
      }
      out += c; i++;
    }
    return out;
  };
  const CODE = stripLiterals(MOD);
  const found = [
    ...browser.filter(g => new RegExp(`(?<![.\\w$])${g}\\s*\\.`).test(CODE)),
    ...called.filter(g => new RegExp(`(?<![.\\w$])${g}\\s*\\(`).test(CODE)),
    ...(/\bnew\s+(THREE|MutationObserver|ResizeObserver|Image|Worker)\b/.test(CODE) ? ['a renderer constructor'] : [])
  ];
  ok('and it dereferences or calls no browser global, so it runs wherever node runs',
    found.length === 0,
    found.length ? `found: ${found.join(', ')}`
      : `checked ${browser.length} globals for property access, ${called.length} for invocation, ` +
        `and every renderer constructor — none present`);
}

console.log('\n=== 4. The physics arrives with the values the atlas quotes for it ===\n');
(async () => {
  const A = await import('file://' + join(ROOT, 'core/atlas/extracted.mjs'));
  const PHI = (1 + Math.sqrt(5)) / 2;

  /* Each expected value below is quoted in the atlas's own prose in index.html, so this
     compares the extracted code against the atlas's WRITTEN claims and not against itself.
     A slicer that produced a self-consistent but different module would fail here. */
  const quoted = [
    ['the naive root of the gap balance', A.edgeNaiveRoot(1), 9.286, 1e-3, 'e.n_naive-9.286'],
    ['the zeta_eff(0) that would put the root at 292', A.edgeZetaEff(292, 1), -0.4596, 1e-6, 'e.zeta_eff_needed+0.4596'],
    ['zeta_eff(0) from the full l = 1 vector kernel', A.edgeZetaFromSpecies(6), -8 / 3, 1e-12, 'e.zeta_eff_species+8/3'],
    ['zeta_eff(0) with Killing vectors alone', A.edgeZetaFromSpecies(3), -7 / 6, 1e-12, 'e.zeta_eff_species_killing+7/6']
  ];
  for (const [name, got, want, tol, marker] of quoted)
    ok(`${name} = ${want}, and the atlas asserts that in its own text`,
      Math.abs(got - want) < tol && HTML.includes(marker),
      `computed ${got} · the assertion "${marker}" is present in index.html`);

  const S = A.specSpectrum(-0.4, 0.18, 0, 2), I = A.specSpectrum(-0.4, 0, 0, 2);
  ok('the spectral gap counterexample the atlas describes is reproduced: isotropic 1.391 > anisotropic 0.593',
    Math.abs(S.gap - 0.593) < 5e-3 && Math.abs(I.gap - 1.391) < 5e-3,
    `anisotropic ${S.gap.toFixed(6)} · isotropic ${I.gap.toFixed(6)} · both quoted in the atlas's limits`);

  ok('the trace identity holds exactly, which is what makes those gaps trustworthy',
    S.traceResidual < 1e-12, `relative trace residual ${S.traceResidual.toExponential(2)}`);

  const f = A.fibFusion(10);
  ok('the Fibonacci fusion dimension and the golden ratio agree with each other from the fusion rule alone',
    f.total === 89 && Math.abs(A.FIB_PHI - PHI) < 1e-15 && Math.abs(A.FIB_D ** 2 - (2 + PHI)) < 1e-14,
    `dim Fus(10) = ${f.total} = F₁₁ · d_τ = φ = ${A.FIB_PHI.toFixed(15)} · D² = 2 + φ`);

  const ax = A.fibAxioms();
  ok('the pentagon closes and the hexagon REJECTS mixed chirality — the check that fixed the handedness',
    ax.pentagon < 1e-12 && Math.min(ax.hexRight, ax.hexMirror) < 1e-12 && ax.hexMixed > 0.5,
    `pentagon ${ax.pentagon.toExponential(2)} over ${ax.cases} labellings · hexagon ${Math.min(ax.hexRight, ax.hexMirror).toExponential(2)} ` +
    `consistent, ${ax.hexMixed.toFixed(6)} mixed`);

  const r = A.zpRung(207, 1, 24, 1 / Math.log(3));
  ok('the zero-point ladder carries an action cell of exactly ħ/2 and a compactness of φ^(−2N)',
    Math.abs(r.action / (1.054571817e-34 / 2) - 1) < 1e-12 &&
    Math.abs(r.compact / Math.pow(PHI, -414) - 1) < 1e-9,
    `action ${r.action.toExponential(9)} J s · compactness ${r.compact.toExponential(6)} against φ^(−414) = ${Math.pow(PHI, -414).toExponential(6)}`);

  const ic = A.bixSeed(-0.8, 0.18, 0, 0, 0.7, 0.08, 'expanding');
  const b = A.bixIntegrate(ic, 0.08, { tauMax: 5 });
  ok('a Bianchi IX trajectory integrates with the constraint preserved and never projected back',
    b.resid < 1e-7, `relative |H_τ| = ${b.resid.toExponential(2)} after ${b.steps} adaptive steps`);

  const iso = A.pcCreate(A.bixSeed(0.5, 0, 0, 0, 0, 0.5, 'expanding'), 0.5, { j: 1, idx: 0, tauMax: 3 });
  ok('an isotropic universe creates exactly zero quanta — zero, not a small number',
    iso.n === 0, `n = ${iso.n} after ${iso.alphaGrowth.toFixed(4)} e-folds`);

  const e8 = A.ebkCompare(8, 0.3, 0.2, 2, 40000), e16 = A.ebkCompare(16, 0.3, 0.2, 2, 40000);
  const w = x => Math.max(...x.levels.map(l => l.relativeError));
  const ratio = w(e8) / w(e16);
  ok('the EBK error falls by roughly four when j doubles, the 1/j² law of a leading O(ħ²) correction',
    ratio > 3 && ratio < 5.5,
    `err(8) = ${w(e8).toExponential(3)}, err(16) = ${w(e16).toExponential(3)}, ratio ${ratio.toFixed(3)}`);

  console.log(`\n${pass}/${pass + fail} checks pass\n`);
  process.exit(fail ? 1 : 0);
})();
