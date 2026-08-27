#!/usr/bin/env node
/* ============================================================================
   DOES A LABORATORY'S OWN CONTROL DO ANYTHING?

   Every influence this atlas measures is BETWEEN laboratories: the quantity bus
   declares which output feeds which input, and api/transfers.json records what
   each of those couplings is worth.  Inside one laboratory, nothing had ever been
   asked.  A laboratory declares its inputs with a name, a unit and a domain, and
   declares its outputs, and whether moving one of those inputs across everything
   it declares actually MOVES any of those outputs was a thing the atlas took on
   faith about itself.

   It is the same question the bus asks about couplings, one scale smaller, and it
   has the same interesting answer.  An input across whose entire declared range no
   output responds is DEAD: either the laboratory does not use it, or it uses it
   somewhere that never reaches an output.  Both are worth knowing about a control
   a reader is invited to turn.

   ONE AT A TIME, WHICH IS A LIMITATION AND NOT A METHOD.  Each input is swept with
   every other held at its declared default, so what is measured is the response
   along one axis through the default point.  An input that does nothing alone but
   matters in combination with another reads dead here and is not.  Saying so is
   cheaper than pretending otherwise; a full interaction sweep of three hundred and
   eighty-four inputs is a different and much larger piece of work.

   AND THREE OUTCOMES ARE KEPT APART, because collapsing them would be the lie this
   file exists to avoid:

     DEAD        the sweep ran, and no declared output moved.
     REFUSED     every value in the declared domain was refused, so nothing was
                 learned — this is NOT evidence the input does nothing.
     UNRETURNED  the laboratory did not come back within the clock at some value
                 inside its own declared domain.  A declared domain ought to be a
                 domain the instrument can be evaluated on, and where it is not,
                 the field is named rather than the whole laboratory.

   Usage:  node scripts/sensitivity.mjs [--check]
   ========================================================================= */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { createServer } from 'node:http';
import { dirname, join, extname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, 'api', 'sensitivity.json');
const CHECK = process.argv.includes('--check');

/* ── THE CLOCKS, AND WHY THERE ARE TWO ──────────────────────────────────────
   SAMPLES is small because the question is "does anything move at all", not "by
   what exponent" — the bus sweep answers the second and pays for it.  BUDGET_MS
   is checked between samples inside the page, which bounds a slow input.  It
   cannot bound a slow SINGLE evaluation, so HANG_MS is a wall clock out here:
   for several of these laboratories the input being swept IS the cost, a step
   count or a tolerance, and one evaluation at the far end of its declared domain
   can outlast any budget the whole instrument was given. */
const SAMPLES = 10;
const BUDGET_MS = 900;
const HANG_MS = 20000;
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

const PORT = 8983;
await new Promise(r => server.listen(PORT, r));

let chromium;
try { ({ chromium } = await import('/opt/node22/lib/node_modules/playwright/index.mjs')); }
catch { try { ({ chromium } = await import('playwright')); } catch { chromium = null; } }
if (!chromium) {
  console.error('playwright not available; cannot measure sensitivity.');
  server.close(); process.exit(CHECK ? 0 : 1);
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
    server.close(); process.exit(CHECK ? 0 : 1);
  }
  browser = await chromium.launch({ executablePath: PW_PATH });
}
let page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
const errors = [];
page.on('pageerror', e => errors.push(String(e.message)));

const bring = async () => {
  await page.goto(`http://127.0.0.1:${PORT}/index.html?render=0`, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => globalThis.HCC_API && globalThis.HCC_API.sensitivity,
    null, { timeout: 60000 });
  await page.evaluate(async () => { await HCC_API.ready({ timeout: 20000 }); });
};
await bring();

const have = await page.evaluate(() => typeof globalThis.HCC_API?.sensitivity?.measure === 'function');
if (!have) {
  console.error('HCC_API.sensitivity.measure is not exposed — nothing can be measured.');
  await browser.close(); server.close(); process.exit(1);
}

/* a hung evaluation leaves the page unusable, so it gets a fresh one rather than a reload:
   the first version reloaded, the reload timed out behind the still-running evaluation, and
   the walk stopped at instrument sixty-two of ninety-one reporting the rest as absent */
const fresh = async () => {
  try { await page.close(); } catch { }
  page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  page.on('pageerror', e => errors.push(String(e.message)));
  await bring();
};

const race = (p, ms, what) => Promise.race([p,
  new Promise((_, rej) => setTimeout(() => rej(new Error(what)), ms))]);

const ids = await page.evaluate(() => HCC_API.instruments.list().map(x => x.id));
const rows = [];
for (const id of ids) {
  const fields = await page.evaluate(i => HCC_API.sensitivity.inputs(i), id).catch(() => []);
  const measured = [];
  let hung = 0;
  for (const f of fields) {
    try {
      const r = await race(
        page.evaluate(([i, n, b, only]) => HCC_API.sensitivity.measure(i, n, b, only),
          [id, SAMPLES, BUDGET_MS, f.name]),
        HANG_MS, 'unreturned');
      measured.push(...(r.rows || []));
    } catch (e) {
      hung++;
      measured.push({ input: f.name, unit: f.unit, min: f.min, max: f.max,
        dead: null, unreturned: true,
        why: `the laboratory did not return within ${HANG_MS / 1000} s at some value inside this input's declared domain` });
      await fresh();
    }
  }
  rows.push({ id, inputs: fields.length, hung, rows: measured });
  process.stdout.write(`· ${id} ${measured.length}/${fields.length}${hung ? ` · ${hung} unreturned` : ''}\n`);
}
await browser.close(); server.close();

const flat = rows.flatMap(r => r.rows.map(w => ({ instrument: r.id, ...w })));
const dead = flat.filter(w => w.dead === true);
const refused = flat.filter(w => w.dead === null && !w.unreturned);
const unreturned = flat.filter(w => w.unreturned);
const live = flat.filter(w => w.dead === false);

const version = JSON.parse(readFileSync(join(ROOT, 'version.json'), 'utf8'));
const doc = {
  schema: 'hcc.sensitivity/1',
  version: version.version, build: version.build,
  generator: "scripts/sensitivity.mjs — every declared numeric input swept across its own declared domain, "
    + "every other input held at its declared default",
  method: { samples: SAMPLES, budget_ms: BUDGET_MS, hang_ms: HANG_MS,
    one_at_a_time: 'each input is swept with the others at their defaults, so this is the response along one '
      + 'axis through the default point; an input that does nothing alone but matters in combination reads dead '
      + 'here and is not',
    moved: 'an output counts as moved when its range across the sweep exceeds 1e-12 of its own magnitude — '
      + 'relative, because an output of order 1e40 that changes by 1e20 has not moved' },
  counts: { instruments: rows.length, inputs: flat.length,
    responding: live.length, dead: dead.length, refused: refused.length, unreturned: unreturned.length },
  dead: dead.map(w => ({ input: `${w.instrument}.${w.input}`, unit: w.unit ?? null, min: w.min, max: w.max,
    outputs_checked: w.responding === 0 ? undefined : undefined, live: w.live, refused: w.refused })),
  refused: refused.map(w => ({ input: `${w.instrument}.${w.input}`, why: w.why })),
  unreturned: unreturned.map(w => ({ input: `${w.instrument}.${w.input}`, min: w.min, max: w.max, why: w.why })),
  instruments: rows.map(r => ({ id: r.id, inputs: r.inputs,
    rows: r.rows.map(w => ({ input: w.input, dead: w.dead ?? null, unreturned: !!w.unreturned,
      responding: w.responding ?? null, live: w.live ?? null, refused: w.refused ?? null,
      truncated: !!w.truncated,
      moves: (w.outputs || []).slice(0, 6).map(o => ({ key: o.key, decades: o.decades, slope: o.slope })) })) }))
};
const text = JSON.stringify(doc, null, 1) + '\n';

if (CHECK) {
  if (!existsSync(OUT)) { console.error('api/sensitivity.json is missing.'); process.exit(1); }
  const prev = JSON.parse(readFileSync(OUT, 'utf8'));
  const strip = d => JSON.stringify({ ...d, version: 0, build: 0 });
  if (strip(prev) !== strip(doc)) {
    console.error('api/sensitivity.json disagrees with what the atlas measures now.');
    process.exit(1);
  }
  console.log(`api/sensitivity.json matches the atlas (${flat.length} inputs).`);
  process.exit(0);
}

mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, text);
console.log(`\napi/sensitivity.json written: ${doc.counts.inputs} declared inputs across ${doc.counts.instruments} instruments`);
console.log(`  ${doc.counts.responding} move at least one declared output`);
console.log(`  ${doc.counts.dead} move NOTHING across their whole declared domain`);
console.log(`  ${doc.counts.refused} had every value refused, so nothing was learned about them`);
console.log(`  ${doc.counts.unreturned} did not return within ${HANG_MS / 1000} s at some declared value`);
if (dead.length) console.log(`\n  dead: ${dead.map(w => `${w.instrument}.${w.input}`).join(' · ')}`);
if (unreturned.length) console.log(`  unreturned: ${unreturned.map(w => `${w.instrument}.${w.input}`).join(' · ')}`);
console.log(`\npage errors during the walk: ${errors.length}`);
process.exit(0);
