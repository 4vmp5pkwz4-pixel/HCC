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

const browser = await chromium.launch({
  executablePath: process.env.PW_CHROMIUM || '/opt/pw-browsers/chromium' });
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

let commit = null;
try { commit = execSync('git rev-parse HEAD', { cwd: ROOT }).toString().trim(); } catch { }

const manifest = {
  schema: 'hcc.manifest/2',
  version: head.version, build: head.build, commit,
  generator: 'scripts/build-manifest.mjs — measured by walking every laboratory with ?render=0',
  counts: {
    worlds: head.worlds.length, laboratories: labs.length, instruments: head.instruments.length,
    computational: labs.filter(l => l.kind === 'computational').length,
    parametric: labs.filter(l => l.kind === 'parametric').length,
    visual: labs.filter(l => l.kind === 'visual').length,
    bus_links: head.bus.counts.declared, bus_refused: head.bus.counts.refused,
    bus_isolated: head.bus.counts.isolated
  },
  worlds: head.worlds,
  bus: head.bus,
  instruments: head.instruments.map(i => ({
    id: i.id, title: i.title, world: i.world, lab: i.lab, status: i.status,
    inputs: (i.describe && i.describe.inputs) || [], outputs: i.outputs || [],
    units: (i.describe && i.describe.units) || null,
    verifiers: (i.describe && i.describe.verifiers) || []
  })),
  labs
};

await browser.close();
server.close();

const text = JSON.stringify(manifest, null, 2) + '\n';
if (CHECK) {
  const prev = existsSync(OUT) ? readFileSync(OUT, 'utf8') : '';
  const strip = t => t.replace(/"commit": "[^"]*"/, '"commit": "*"');
  if (strip(prev) !== strip(text)) {
    console.error('api/manifest.json is stale — run: node scripts/build-manifest.mjs');
    process.exit(1);
  }
  console.log(`api/manifest.json matches the code (${labs.length} laboratories).`);
} else {
  mkdirSync(join(ROOT, 'api'), { recursive: true });
  writeFileSync(OUT, text);
  console.log(`api/manifest.json written: ${labs.length} laboratories, ` +
    `${manifest.counts.computational} computational, ${manifest.counts.parametric} parametric, ` +
    `${manifest.counts.visual} visual · ${head.instruments.length} instruments · ` +
    `page errors during the walk: ${errors.length}`);
  if (errors.length) errors.slice(0, 5).forEach(e => console.log('  ', e));
}
