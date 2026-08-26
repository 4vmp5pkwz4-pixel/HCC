#!/usr/bin/env node
/* ============================================================================
   WHAT EVERY DECLARED INFLUENCE IS WORTH — WRITTEN DOWN

   The quantity bus says which couplings between laboratories are real.  The scale
   panorama says where each end of one LANDS.  Neither says what a coupling is
   worth: drive the source across its whole declared domain and how far does the
   far end actually move?  A coupling whose target does not budge is declared,
   verified, dimensionally sound and physically limp, and it looks exactly like a
   stiff one.

   The atlas measures that now, in front of a reader, and threw the answer away
   when the tab closed.  An influence map that cannot be read without running a
   browser is not a published fact about this atlas, it is a feature of one page.
   This walks every route the atlas declares — every single coupling and every
   multi-hop path it can enumerate from them — and writes what it finds to
   api/transfers.json, where docs/verify-transfers.cjs can disbelieve it.

   AND THE POINT OF WRITING IT DOWN IS THAT SOMETHING ELSE CHECKS IT.  Seven of
   these exponents are known physical laws — Stefan-Boltzmann, Wien, the Einstein
   radius, the Eddington luminosity, a volume, an area, a reciprocal wavelength —
   held by pairs of laboratories that do not know each other exists.  The verifier
   re-derives each from closed form and refuses the file if the atlas disagrees.

   THIS CANNOT RUN UNDER ?render=0 for the same reason the liveness walk cannot:
   the laboratories must be built for their instruments to be reachable.

   RE-MEASURING TAKES THREE MINUTES, so CI does not do it on every commit — four of
   these couplings run instruments costing half a second a sample.  What CI does
   instead costs microseconds: the artifact records the version and build it was
   measured at, and docs/verify-transfers.cjs refuses it if those disagree with
   version.json.  So a stale file cannot pass unnoticed; it fails and says to run
   this script.  Run it whenever the build is bumped.

   Usage:  node scripts/transfers.mjs [--check]
           --check re-measures and verifies the committed file still matches.
   ========================================================================= */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { createServer } from 'node:http';
import { dirname, join, extname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, 'api', 'transfers.json');
const CHECK = process.argv.includes('--check');

/* -- HOW MANY SAMPLES, AND WHY THE ANSWER IS NOT ONE NUMBER ----------------
   I wrote "forty-eight is enough for every fit here" into this file before
   measuring, and it was not true.  A shell radius into a redshift laboratory came
   back with a ball-volume exponent of 3.0465 instead of 3, and a black hole into
   an interference fringe with 1.0562 instead of 1 -- because those two routes are
   REFUSED almost everywhere and their live window is three or four samples wide.
   A straight line through four points is not a measurement of anything.

   Raising every route to the count the sparsest one needs would be the obvious
   fix and the wrong one: four of these couplings cost between a quarter and half
   a second PER SAMPLE and already have twenty live points each, so the sparse
   routes would be paid for with three minutes of every build spent re-proving
   what was already settled.

   So the count is set by the LIVE window rather than by the sweep: sample, and if
   fewer than MIN_LIVE points survived the target's refusals, sample again four
   times as densely, up to a cap.  The routes that need it happen to be the cheap
   ones -- the sparse windows and the half-second instruments are disjoint sets,
   which is luck rather than design, and the cap is there for the day it stops
   being.  Every route records the count it actually ended at. */
const SAMPLES = 48;
const MIN_LIVE = 12;
const MAX_SAMPLES = 384;
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

const PORT = 8979;
await new Promise(r => server.listen(PORT, r));

let chromium;
try { ({ chromium } = await import('/opt/node22/lib/node_modules/playwright/index.mjs')); }
catch { try { ({ chromium } = await import('playwright')); } catch { chromium = null; } }
if (!chromium) {
  console.error('playwright not available; cannot measure the transfers.');
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
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
const errors = [];
page.on('pageerror', e => errors.push(String(e.message)));

/* rendering ON: the instruments are reachable only once the laboratories are built */
await page.goto(`http://127.0.0.1:${PORT}/index.html`, { waitUntil: 'domcontentloaded' });
await page.waitForFunction(() => globalThis.HCC_API && globalThis.HCC_API.transfers,
  null, { timeout: 60000 }).catch(() => {});
await page.evaluate(async () => { await HCC_API.ready({ timeout: 20000 }); });

const have = await page.evaluate(() => typeof globalThis.HCC_API?.transfers?.measure === 'function');
if (!have) {
  console.error('HCC_API.transfers.measure is not exposed — nothing can be measured.');
  await browser.close(); server.close(); process.exit(1);
}

const routes = await page.evaluate(() => HCC_API.transfers.routes());
const rows = [];
for (const r of routes) {
  try {
    let n = SAMPLES, m = await page.evaluate(([i, k]) => HCC_API.transfers.measure(i, k), [r.index, n]);
    /* the sparse windows are what set the count, and only they pay for it */
    while (m.live < MIN_LIVE && n < MAX_SAMPLES) {
      n = Math.min(MAX_SAMPLES, n * 4);
      m = await page.evaluate(([i, k]) => HCC_API.transfers.measure(i, k), [r.index, n]);
    }
    rows.push({ ...m, densified: n > SAMPLES });
    if (n > SAMPLES) console.log(`  ${r.name}: only ${SAMPLES}-sample sweep left too few live points, `
      + `re-swept at ${n} → ${m.live} live`);
  } catch (e) {
    rows.push({ index: r.index, name: r.name, hops: r.hops, error: String(e.message || e).slice(0, 120) });
  }
}
await browser.close(); server.close();

const version = JSON.parse(readFileSync(join(ROOT, 'version.json'), 'utf8'));

/* ── A BUILD STRING IS NOT A GOOD ENOUGH STAMP, and the first version of this
   staleness guard used one.  It caught the case where somebody changes the atlas
   and bumps the build.  It missed the case where somebody changes an instrument
   and does NOT — which is not hypothetical: a commit in this very branch changed
   scripts and shipped without a bump, correctly, because the page was untouched.
   An instrument gaining an output, losing an input or moving a declared domain
   changes every sweep that drives it and need not touch the version at all.

   So the stamp is a hash of what the sweeps actually depend on: every
   instrument's id, inputs with their domains, and outputs with their units, as
   api/manifest.json publishes them.  Any change to a declaration the sweep reads
   changes the hash, bump or no bump, and the verifier recomputes it from the same
   file in microseconds. */
const instrumentFingerprint = () => {
  const m = JSON.parse(readFileSync(join(ROOT, 'api', 'manifest.json'), 'utf8'));
  const shape = (m.instruments || []).map(i => [i.id,
    (i.inputs || []).map(f => [f.name, f.unit ?? null, f.type ?? null, f.default ?? null, f.min ?? null, f.max ?? null]),
    (i.outputs || []).map(o => [o.name, o.unit ?? null])]);
  shape.sort((a, b) => String(a[0]).localeCompare(String(b[0])));
  return createHash('sha256').update(JSON.stringify(shape)).digest('hex').slice(0, 32);
};
const doc = {
  schema: 'hcc.transfers/1',
  version: version.version, build: version.build,
  instruments_fingerprint: instrumentFingerprint(),
  generator: 'scripts/transfers.mjs — every declared route driven across the source\'s whole domain',
  samples: { start: SAMPLES, min_live: MIN_LIVE, cap: MAX_SAMPLES,
    note: 'each route records the count it actually ended at; a route whose target refuses '
        + 'most of the drive is re-swept more densely until enough points survive, because a '
        + 'straight line through four points is not a measurement of anything' },
  note: 'decades is how far that output moves across the source\'s entire declared range and is always meaningful; '
      + 'slope is d log(target)/d log(source) and is null when the source spans less than 0.3 decades, because a '
      + 'ratio of two logarithms means nothing when the second is the width of a rung index',
  counts: {
    routes: rows.length,
    single_hop: rows.filter(r => r.hops === 1).length,
    multi_hop: rows.filter(r => r.hops > 1).length,
    carrying: rows.filter(r => (r.moved || 0) > 0.02).length,
    limp: rows.filter(r => r.outputs && (r.moved || 0) <= 0.02).length,
    fitted: rows.filter(r => r.fitable).length,
    densified: rows.filter(r => r.densified).length,
    failed: rows.filter(r => r.error).length
  },
  routes: rows
};
const text = JSON.stringify(doc, null, 1) + '\n';

if (CHECK) {
  if (!existsSync(OUT)) { console.error('api/transfers.json is missing.'); process.exit(1); }
  const old = JSON.parse(readFileSync(OUT, 'utf8'));
  const strip = d => JSON.stringify({ ...d, version: 0, build: 0, instruments_fingerprint: 0,
    routes: d.routes.map(r => ({ ...r, ms_per_sample: 0 })) });
  if (strip(old) !== strip(doc)) {
    console.error('api/transfers.json disagrees with what the atlas measures now.');
    process.exit(1);
  }
  console.log(`api/transfers.json matches the atlas (${rows.length} routes).`);
  process.exit(0);
}

mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, text);
console.log(`api/transfers.json written: ${doc.counts.routes} routes `
  + `(${doc.counts.single_hop} single hops, ${doc.counts.multi_hop} paths) · `
  + `${doc.counts.carrying} carry something, ${doc.counts.limp} move nothing · `
  + `${doc.counts.fitted} had enough source travel to fit an exponent · `
  + `page errors: ${errors.length}`);
process.exit(0);
