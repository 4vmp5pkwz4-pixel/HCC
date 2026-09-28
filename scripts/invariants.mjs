#!/usr/bin/env node
/* ============================================================================
   WHICH COMBINATIONS OF A LABORATORY'S OUTPUTS NEVER MOVE?

   api/sensitivity.json asks whether an input moves anything. This asks the opposite
   question of every laboratory in the atlas: which combinations of its outputs do NOT
   move — across its whole declared domain, and, where it has a clock, along that clock,
   where a combination that stays fixed is a conserved quantity.

   It runs the page's own finder (HCC_INVARIANTS.find — the same code the parameter
   space runs for a reader, and the same code docs/verify-every-laboratory-keeps-its-
   invariants.cjs checks against the Jeans kernel and an independently integrated rigid
   body), so what is written here is what a reader would see, recorded once.

   Kept apart, as in sensitivity.json, because collapsing them would be the lie:
     FOUND       the laboratory answered, and these relations held at every sample
     NONE        it answered, and no exact relation exists among its outputs there
     THIN        too few answers inside the domain to ask the question
     UNRETURNED  one answer outlasted the clock (a numerical control at the end of
                 its declared domain, usually), and the row says so

   Usage:  node scripts/invariants.mjs
   ========================================================================= */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { createServer } from 'node:http';
import { dirname, join, extname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, 'api', 'invariants.json');
const HANG_MS = 40000;
/* three.js is loaded from a CDN in the shipped page; serve a copy that points at the
   vendored build so the walk does not depend on the network */
const VENDOR = process.env.HCC_VENDOR || join(ROOT, 'vendor');
const HAVE_VENDOR = existsSync(VENDOR);
const html0 = readFileSync(join(ROOT, 'index.html'), 'utf8');
const html = !HAVE_VENDOR ? html0 : html0
  .replace(/https:\/\/cdn\.jsdelivr\.net\/npm\/three@0\.160\.0\/build\/three\.module\.js/g, './vendor/three/build/three.module.js')
  .replace(/https:\/\/cdn\.jsdelivr\.net\/npm\/three@0\.160\.0\/examples\/jsm\//g, './vendor/three/examples/jsm/')
  .replace(/https:\/\/cdn\.jsdelivr\.net\/npm\/@dimforge\/rapier3d-compat@0\.14\.0\/rapier\.es\.js/g, './vendor/rapier/rapier.es.js');

if (!HAVE_VENDOR) console.warn('no vendored three.js found — the walk will fetch it from the CDN.');

const MIME = { '.js': 'text/javascript', '.mjs': 'text/javascript', '.json': 'application/json',
  '.wasm': 'application/wasm', '.html': 'text/html', '.css': 'text/css' };
const server = createServer((req, res) => {
  const url = decodeURIComponent((req.url || '/').split('?')[0]);
  if (url === '/' || url === '/index.html') {
    res.writeHead(200, { 'content-type': 'text/html' }); res.end(html); return;
  }
  try {
    const rel = url.replace(/^\/+/, '');
    const body = readFileSync(rel.startsWith('vendor/') && HAVE_VENDOR
      ? join(VENDOR, rel.slice('vendor/'.length)) : join(ROOT, rel));
    res.writeHead(200, { 'content-type': MIME[extname(url)] || 'application/octet-stream' });
    res.end(body);
  } catch { res.writeHead(404); res.end('not found'); }
});

const PORT = 8987;
await new Promise(r => server.listen(PORT, r));

let chromium;
try { ({ chromium } = await import('/opt/node22/lib/node_modules/playwright/index.mjs')); }
catch { try { ({ chromium } = await import('playwright')); } catch { chromium = null; } }
if (!chromium) {
  console.error('playwright not available; cannot measure invariants.');
  server.close(); process.exit(1);
}

/* ── THE BROWSER PATH MUST NOT BE ONE MACHINE'S ────────────────────────────
   Same fault, same file family, found while fixing it next door in
   scripts/selftest.mjs: this passed a path that exists in ONE sandbox and nowhere
   else. It has not bitten anyone only because no workflow runs this script — which
   is not a defence, it is the reason it stayed. Playwright resolves its own browser
   first, which is right on any machine that installed it; the explicit path is a
   fallback taken only when that fails and the path is really there. */
let browser;
try { browser = await chromium.launch(); }
catch (first) {
  const PW_PATH = process.env.PW_CHROMIUM || '/opt/pw-browsers/chromium';
  if (!existsSync(PW_PATH)) {
    console.error(`could not launch a browser: ${String(first && first.message || first).split('\n')[0]}`);
    server.close(); process.exit(1);
  }
  browser = await chromium.launch({ executablePath: PW_PATH });
}
let page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
const errors = [];
page.on('pageerror', e => errors.push(String(e.message)));
const bring = async () => {
  await page.goto(`http://127.0.0.1:${PORT}/index.html?render=0`, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => globalThis.HCC_API && globalThis.HCC_INVARIANTS, null, { timeout: 60000 });
  await page.evaluate(async () => { await HCC_API.ready({ timeout: 20000 }); });
};
await bring();
const fresh = async () => { try { await page.close(); } catch { } page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  page.on('pageerror', e => errors.push(String(e.message))); await bring(); };
const race = (p, ms, what) => Promise.race([p, new Promise((_, rej) => setTimeout(() => rej(new Error(what)), ms))]);

const ids = await page.evaluate(() => HCC_API.instruments.list().map(x => x.id));
const CLOCK = /^(t|time|tau|tauMax|days|epoch_days|epoch_year|age)$/;
const rows = [];
for (const id of ids) {
  const row = { id };
  const ask = async along => {
    try {
      return await race(page.evaluate(async ([id, along]) => {
        const A = await HCC_INVARIANTS.find(id, along); if (!A) return { verdict: 'THIN' };
        const f = x => +(+x).toPrecision(15);
        const out = { verdict: (A.constants.length || A.products.length || A.sums.length || A.aliases.length) ? 'FOUND' : 'NONE',
          samples: A.samples, moving: A.moving, nullity: A.nullity, rank: A.rank, varied: A.meta ? A.meta.vary : [],
          constants: A.constants.map(c => ({ name: c.name, value: f(c.value), form: c.form || null, exact: c.exact, ...(c.exact ? {} : { spread: f(c.spread) }) })),
          aliases: A.aliases.map(a => ({ name: a.name, of: a.of, factor: f(a.factor), form: a.form || null })),
          products: A.products.slice(0, 24).map(r => ({ terms: r.terms, exponents: r.a.map(f), value: f(r.value), form: r.form || null, exact: r.exact, spread: f(r.spread) })),
          sums: A.sums.slice(0, 16).map(r => ({ terms: r.terms, coefficients: r.a.map(f), value: f(r.c), exact: r.exact, spread: f(r.spread) })),
          residuals: (A.residuals || []).map(x => ({ name: x.name, max: f(x.max) })),
          /* the law of each output: what it IS as a function of the inputs that moved */
          laws: (A.laws || []).map(L => ({ output: L.out, law: L.text, kind: L.kind, exact: L.exact, spread: f(L.spread), free: L.free,
            ...(L.kind === 'power' ? { constant: f(L.C), form: L.cform || null, exponents: Object.fromEntries(L.terms.map(t => [t.input, t.pq ? t.pq[0] + (t.pq[1] === 1 ? '' : '/' + t.pq[1]) : f(t.p)])) }
              : { terms: L.terms.map(t => ({ term: t.tag, coefficient: f(t.b), form: t.form || null })), constant: f(L.c), form: L.cform || null }) })) };
        if (A.rank != null && A.meta && A.rank < A.meta.vary.length && A.rank > 0) out.hidden_symmetries = A.meta.vary.length - A.rank;
        return out; }, [id, along]), HANG_MS, 'hang');
    } catch (e) { await fresh(); return { verdict: 'UNRETURNED', note: String(e.message).slice(0, 80) }; }
  };
  row.integer_inputs = await page.evaluate(id => { try { return HCC_PSPACE.integers(id,{census:true}); } catch (e) { return []; } }, id).catch(() => []);
  row.across = await ask(null);
  /* the law one variable at a time, for every output the all-inputs finder left without one */
  try { const have = (row.across.laws || []).map(l => l.output), consts = (row.across.constants || []).map(c => c.name);
    row.separable = await race(page.evaluate(([id, skip]) => { const R = HCC_INVARIANTS.separable(id); if (!R) return null; if (R.skipped) return { skipped: true, why: R.why };
      return R.laws.filter(l => !skip.includes(l.output)).map(l => ({ output: l.output, law: l.text, mode: l.mode, inner: l.inner, outer: l.outer, fixed: l.fixed })); }, [id, [...have, ...consts]]), HANG_MS, 'hang'); }
  catch (e) { await fresh(); row.separable = null; }
  /* the symmetry itself: the scalings that move nothing, applied at random points before they are believed */
  try { row.symmetries = await race(page.evaluate(id => { const S = HCC_INVARIANTS.symmetries(id); return Array.isArray(S) ? S.map(x => ({ inputs: x.inputs, k: x.k.map(v => +(+v).toPrecision(6)), rational: x.rational, verified: x.verified, trials: x.trials, dead: x.dead })) : null; }, id), HANG_MS, 'hang'); }
  catch (e) { await fresh(); row.symmetries = null; }
  const clock = await page.evaluate(id => { try { const d = HCC_API.describe(id); const f = (d.inputs || []).find(x => x.type === 'number' && /^(t|time|tau|tauMax|days|epoch_days|epoch_year|age)$/.test(x.name)); return f ? f.name : null; } catch { return null; } }, id);
  if (clock) { row.along = { clock, ...(await ask(clock)) }; }
  rows.push(row);
  process.stdout.write(`${id}: ${row.across.verdict}${row.along ? ' · along ' + clock + ' ' + row.along.verdict : ''}\n`);
}
/* ACROSS THE BUS: every declared link, the source driven across its domain and carried over;
   only relations whose terms come from BOTH laboratories are recorded */
const links = await page.evaluate(() => HCC_API.bus.links().map(l => ({ from: l.from, to: l.to })));
const cross = [];
for (const l of links) {
  let r;
  try {
    r = await race(page.evaluate(async ([a, b]) => { const R = await HCC_INVARIANTS.across(a, b); if (!R) return { verdict: 'THIN' }; if (R.thin) return { verdict: 'THIN', samples: R.samples, refused: R.refused };
      const f = x => +(+x).toPrecision(15);
      const o = { samples: R.samples, refused: R.refused,
        products: R.products.slice(0, 12).map(p => ({ terms: p.terms, exponents: p.a.map(f), value: f(p.value), form: p.form || null, exact: p.exact })),
        sums: R.sums.slice(0, 6).map(p => ({ terms: p.terms, coefficients: p.a.map(f), value: f(p.c), exact: p.exact })),
        aliases: R.aliases.map(x => ({ name: x.name, of: x.of, factor: f(x.factor), form: x.form || null })) };
      o.verdict = (o.products.length || o.sums.length || o.aliases.length) ? 'FOUND' : 'NONE'; return o; }, [l.from, l.to]), HANG_MS, 'hang');
  } catch (e) { await fresh(); r = { verdict: 'UNRETURNED' }; }
  cross.push({ from: l.from, to: l.to, ...r });
  process.stdout.write(`${l.from} → ${l.to}: ${r.verdict}\n`);
}
/* THROUGH A MIDDLE LABORATORY: every two-link chain the bus admits; only relations between the
   FIRST and the LAST laboratory are recorded — three laboratories, two of which never meet */
const chains = await page.evaluate(() => HCC_INVARIANTS.chains());
const through = [];
for (const c of chains) {
  let r;
  try {
    r = await race(page.evaluate(async c => { const R = await HCC_INVARIANTS.chain(...c); if (!R) return { verdict: 'THIN' }; if (R.thin) return { verdict: 'THIN', samples: R.samples, refused: R.refused };
      const f = x => +(+x).toPrecision(15);
      const o = { samples: R.samples, refused: R.refused,
        products: R.products.slice(0, 10).map(p => ({ terms: p.terms, exponents: p.a.map(f), value: f(p.value), form: p.form || null, exact: p.exact })),
        aliases: R.aliases.map(x => ({ name: x.name, of: x.of, factor: f(x.factor), form: x.form || null })) };
      o.verdict = (o.products.length || o.aliases.length) ? 'FOUND' : 'NONE'; return o; }, c), HANG_MS, 'hang');
  } catch (e) { await fresh(); r = { verdict: 'UNRETURNED' }; }
  through.push({ chain: c, ...r });
  process.stdout.write(`${c.join(' ⇒ ')}: ${r.verdict}\n`);
}
await browser.close(); server.close();

const identity = JSON.parse(readFileSync(join(ROOT, 'version.json'), 'utf8'));
const cnt = k => rows.filter(r => r.across.verdict === k).length;
const out = { schema: 'hcc.invariants/1', version: identity.version, build: identity.build,
  generator: 'scripts/invariants.mjs — the page\'s own invariant finder (HCC_INVARIANTS.find) run on every laboratory, across its declared domain and along its clock where it has one',
  method: { samples: 'up to 48 per question, deterministic seed, eight-second cap per question', exact: 'relative spread below 1e-9 at every sample', named: 'closed forms to 1e-10 (rational × π^k, roots, φ, √5, one CODATA constant); nothing is named that is not numerically that value; values are recorded to 15 digits so the page can name them to the same standard',
    guard: 'a relation among k features needs k+3 distinct points; a laboratory\'s own residuals are reported by size, never searched',
    laws: 'each moving output as a function of the inputs that moved: a power law over every positive input at once (exponents read as rationals), else the smallest sum of at most three library terms plus a constant; exact below 1e-9 of the output, holding below 1e-5; fitted only with three more distinct answers than parameters' },
  counts: { laboratories: rows.length, found: cnt('FOUND'), none: cnt('NONE'), thin: cnt('THIN'), unreturned: cnt('UNRETURNED'),
    named_constants: rows.reduce((a, r) => a + ((r.across.constants || []).filter(c => c.form).length + (r.across.products || []).filter(p => p.form).length), 0),
    exact_relations: rows.reduce((a, r) => a + (r.across.products || []).filter(p => p.exact).length + (r.across.sums || []).filter(p => p.exact).length, 0),
    hidden_symmetries: rows.filter(r => r.across.hidden_symmetries).length,
    scaling_symmetries: rows.reduce((a, r) => a + (r.symmetries || []).filter(x => x.verified && !x.dead).length, 0),
    dead_inputs: rows.reduce((a, r) => a + (r.symmetries || []).filter(x => x.dead).length, 0),
    undeclared_integer_inputs: rows.reduce((a, r) => a + (r.integer_inputs || []).length, 0),
    conserved_along_a_clock: rows.filter(r => r.along && ((r.along.sums || []).length || (r.along.constants || []).length)).length,
    links_asked: cross.length, links_with_cross_laws: cross.filter(c => c.verdict === 'FOUND' && ((c.products || []).length || (c.sums || []).length)).length,
    chains_asked: through.length, chains_with_laws: through.filter(c => c.verdict === 'FOUND').length,
    laws_exact: rows.reduce((a, r) => a + (r.across.laws || []).filter(L => L.exact).length, 0),
    laws_holding: rows.reduce((a, r) => a + (r.across.laws || []).filter(L => !L.exact).length, 0),
    laws_named: rows.reduce((a, r) => a + (r.across.laws || []).filter(L => L.exact && (L.kind === 'power' ? L.form : L.terms.every(t => t.form))).length, 0),
    laboratories_with_a_law: rows.filter(r => (r.across.laws || []).length).length,
    silent_laboratories_that_now_speak: rows.filter(r => r.across.verdict === 'NONE' && ((r.across.laws || []).length || (Array.isArray(r.separable) && r.separable.length))).length,
    separable_laws: rows.reduce((a, r) => a + (Array.isArray(r.separable) ? r.separable.length : 0), 0),
    laboratories_with_a_separable_law: rows.filter(r => Array.isArray(r.separable) && r.separable.length).length },
  errors: [...new Set(errors)].slice(0, 20), laboratories: rows, across_the_bus: cross, through_a_middle_laboratory: through };
writeFileSync(OUT, JSON.stringify(out, null, 1) + '\n');
console.log(JSON.stringify(out.counts));
