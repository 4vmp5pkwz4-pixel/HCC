#!/usr/bin/env node
/* ============================================================================
   BUILD api/manifest.json BY WALKING THE ATLAS

   An external audit asked for a static manifest that a machine can read without
   executing the application: every laboratory, its capability class, its typed
   inputs and outputs where it has them.

   The manifest is not hand-written, because a hand-written list of seventy-three
   entries is a list of guesses that drifts away from the code within one version.
   It is MEASURED: this script boots the real index.html headless with ?render=0
   — the mode that exists precisely so a machine can run the atlas without a GPU —
   opens every laboratory in turn, harvests the controls each one declares, and
   records what it found.

   That also makes the manifest a test of the no-WebGL path: if the core cannot
   come up without a renderer, this script cannot produce a manifest at all.

   Usage:  node scripts/build-manifest.mjs [--check]
           --check verifies the committed manifest still matches the code.
   ========================================================================= */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { createServer } from 'node:http';
import { execSync } from 'node:child_process';
import { dirname, join, extname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, 'api', 'manifest.json');
const CHECK = process.argv.includes('--check');

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

const PORT = 8951;
await new Promise(r => server.listen(PORT, r));

let chromium;
try { ({ chromium } = await import('/opt/node22/lib/node_modules/playwright/index.mjs')); }
catch { try { ({ chromium } = await import('playwright')); } catch { chromium = null; } }
if (!chromium) {
  console.error('playwright not available; cannot build the manifest.');
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

/* the whole point: ?render=0 means the page must not need a GPU at all */
await page.goto(`http://127.0.0.1:${PORT}/index.html?render=0`, { waitUntil: 'domcontentloaded' });
await page.waitForFunction(() => globalThis.HCC_API && document.documentElement.dataset.hccRender,
  null, { timeout: 30000 }).catch(() => {});
await page.evaluate(async () => { await HCC_API.ready({ timeout: 15000 }); });

const head = await page.evaluate(() => ({
  version: HCC_API.version, build: HCC_API.build,
  render: document.documentElement.dataset.hccRender,
  worlds: HCC_NAV.worlds().map(w => ({ id: w.id, title: w.title || w.id, route: w.route })),
  instruments: HCC_API.instruments.list().map(i => ({ ...i, describe: HCC_API.describe(i.id) })),
  labs: HCC_API.labs.list(),
  /* ── THE BUS IS PART OF THE CONTRACT, NOT A BROWSER AFFORDANCE ────────────
     Twenty-seven declared couplings, two refusals written down with their reasons, and a
     surface that says why a laboratory is alone — all of it lived in the page and NONE of
     it reached api/manifest.json, which is the file an agent actually reads. An agent
     could describe every instrument here and still not know that the neutron-star mass
     runs into four other laboratories, or that gw.total_mass → adisk.mass was examined
     and refused because one input takes one source. Reachable through the website has to
     mean reachable through the CONTRACT the website publishes. */
  /* what the atlas has NOT measured, published beside what it has — an agent that can
     read every verified claim and not the unverified ones has been told a flattering half
     of the truth */
  unmeasured: (HCC_API.unmeasured ? HCC_API.unmeasured() : []),
  bus: (() => {
    const B = HCC_API.bus;
    const links = B.links();
    const cand = B.candidates();
    const isolated = B.isolated();
    const nb = isolated.map(id => B.neighbourhood(id));
    return {
      links: links.map(l => ({ from: l.from, to: l.to, unit: l.unit, scale: l.scale, converted: !!l.converted })),
      /* a proposal the atlas declined, and the sentence saying why — the refusals are as
         much a part of what this atlas asserts as the links are */
      refused: cand.filter(c => !links.some(l => l.from === c.from && l.to === c.to))
        .map(c => ({ from: c.from, to: c.to, reason: HCC_API.bus.refusal ? HCC_API.bus.refusal(c.from, c.to) : null })),
      isolated: nb.map(n => ({ id: n.id, distinctive_reach: n.distinctiveReach })),
      counts: { admissible: cand.length, declared: links.length,
        refused: cand.length - links.length, isolated: isolated.length,
        isolated_dimensionless_only: nb.filter(n => n.distinctiveReach === 0).length }
    };
  })()
}));

if (head.render !== 'off') {
  console.error(`?render=0 did not take: dataset.hccRender = ${head.render}`);
  await browser.close(); server.close(); process.exit(1);
}

/* walk every laboratory and harvest the controls it declares */
const labs = [];
for (const L of head.labs) {
  const row = await page.evaluate(async id => {
    HCC_NAV.go('s3', id);
    await new Promise(r => setTimeout(r, 140));
    /* the configuration surface is harvested from the live controls, so it has to be
       asked for after the laboratory has built its panel — reading the cache first
       reports every laboratory as having no parameters, which is how the first run
       of this script produced sixty-nine confident zeroes */
    try { HCC_API.config.harvest(id); } catch { }
    await new Promise(r => setTimeout(r, 40));
    let schema = [];
    try { schema = HCC_API.config.schema(id); } catch { schema = []; }
    return { id, kind: HCC_API.labs.get(id).kind, instrument: HCC_API.labs.get(id).instrument,
      params: schema.map(s => ({ id: s.id, label: s.label || null,
        min: (s.domain && s.domain.min !== undefined) ? s.domain.min : null,
        max: (s.domain && s.domain.max !== undefined) ? s.domain.max : null })) };
  }, L.id);
  const kind = row.instrument ? 'computational' : (row.params.length ? 'parametric' : 'visual');
  labs.push({ id: L.id, title: L.title, world: L.world, category: L.category, status: L.status,
    route: L.route, description: L.description || null,
    kind, instrument: row.instrument, parameters: row.params });
}

/* ── A STAMP THAT IS FALSE THE INSTANT IT IS WRITTEN ────────────────────────
   This file used to record `git rev-parse HEAD`. scripts/build-api.mjs already refuses
   to do that and says why: a file that is GENERATED and then COMMITTED is written before
   the commit it would have to name, so the snapshot can only ever record its own parent.
   That is not a stamp that goes stale eventually — it is one that is wrong immediately.

   And it had a cost beyond being wrong. It made `build-manifest.mjs --check` report
   "stale" after every single commit, so api/manifest.json could not be added to the
   workflow step that asserts the generated contracts are committed — the step covers
   openapi, mcp and open-problems and pointedly not the manifest. That exclusion is how
   the v4.34.1 regression reached main: build-api was skipped, the manifest silently lost
   core, contracts and instruments_v2, and a reviewing bot found it after the merge.

   The manifest identifies itself by version and build, which come from the document it
   was measured from and are true of it. Nothing consumed the commit — checked. */

const manifest = {
  schema: 'hcc.manifest/2',
  version: head.version, build: head.build,
  generator: 'scripts/build-manifest.mjs — measured by walking every laboratory with ?render=0',
  counts: {
    worlds: head.worlds.length, laboratories: labs.length, instruments: head.instruments.length,
    computational: labs.filter(l => l.kind === 'computational').length,
    parametric: labs.filter(l => l.kind === 'parametric').length,
    visual: labs.filter(l => l.kind === 'visual').length,
    bus_links: head.bus.counts.declared, bus_refused: head.bus.counts.refused,
    bus_isolated: head.bus.counts.isolated, unmeasured_blocks: head.unmeasured.length
  },
  worlds: head.worlds,
  unmeasured: head.unmeasured,
  bus: head.bus,
  instruments: head.instruments.map(i => ({
    id: i.id, title: i.title, world: i.world, lab: i.lab, status: i.status,
    inputs: (i.describe && i.describe.inputs) || [],
    outputs: (i.describe && i.describe.outputs) || i.outputs || [],
    units: (i.describe && i.describe.units) || null,
    verifiers: (i.describe && i.describe.verifiers) || []
  })),
  labs
};

await browser.close();
server.close();

const text = JSON.stringify(manifest, null, 2) + '\n';
if (CHECK) {
  /* ── --check COULD NEVER PASS, WHICH IS WHY NOTHING RAN IT ──────────────────
     It compared this script's whole output, as text, against the committed file.
     But the committed file is not this script's output: scripts/build-api.mjs
     runs afterwards and ENRICHES it, adding `contracts`, `core`, `instruments_v2`
     and two more counts.  So the comparison found five extra sections every time
     and reported the manifest stale on a tree where nothing was stale — a check
     that always fails is exactly as useless as one that always passes, and this
     one had been quietly excluded from CI rather than fixed.

     A comparison now runs over the keys THIS script owns, which is the question
     it was always trying to ask: has the atlas drifted away from the manifest
     section that walking the atlas produces.  Whatever a later stage adds is not
     this stage's business and is left alone. */
  const prev = existsSync(OUT) ? JSON.parse(readFileSync(OUT, 'utf8')) : {};
  const mine = JSON.parse(text);
  const ignore = new Set(['commit']);
  /* AND THE ENRICHMENT REACHES INSIDE, so a key-by-key comparison is not enough
     either: build-api adds core_implemented and core_labs into the SAME `counts`
     object this script writes.  What has to hold is that everything this script
     produces is present and unchanged in the committed file — extra fields, at
     any depth, belong to whoever added them. */
  const drift = [];
  const walk = (a, b, path) => {
    if (a && b && typeof a === 'object' && typeof b === 'object'
        && !Array.isArray(a) && !Array.isArray(b)) {
      for (const k of Object.keys(a)) walk(a[k], b[k], path ? `${path}.${k}` : k);
    } else if (JSON.stringify(a) !== JSON.stringify(b)) drift.push(path);
  };
  for (const k of Object.keys(mine)) if (!ignore.has(k)) walk(mine[k], prev[k], k);
  if (drift.length) {
    console.error(`api/manifest.json is stale in ${drift.slice(0, 6).join(', ')}`
      + `${drift.length > 6 ? ` and ${drift.length - 6} more` : ''} — run: node scripts/build-manifest.mjs`);
    process.exit(1);
  }
  const added = Object.keys(prev).filter(k => !(k in mine));
  console.log(`api/manifest.json matches the code (${labs.length} laboratories, `
    + `every field this script writes intact`
    + `${added.length ? `; ${added.length} sections added later by build-api and left alone: ${added.join(', ')}` : ''}).`);
} else {
  mkdirSync(join(ROOT, 'api'), { recursive: true });
  writeFileSync(OUT, text);
  console.log(`api/manifest.json written: ${labs.length} laboratories, ` +
    `${manifest.counts.computational} computational, ${manifest.counts.parametric} parametric, ` +
    `${manifest.counts.visual} visual · ${head.instruments.length} instruments · ` +
    `page errors during the walk: ${errors.length}`);
  if (errors.length) errors.slice(0, 5).forEach(e => console.log('  ', e));
}
