#!/usr/bin/env node
/* ============================================================================
   HOW ALIVE IS EACH LABORATORY?

   This atlas has now had to rebuild three laboratories that turned out to be
   pictures rather than systems, and the difference has a number: how much of what
   is on the screen is RECOMPUTED between one frame and the next.  A laboratory
   that builds its scene once and then only lets the camera move around it scores
   zero however impressive it looks, and three of them shipped that way before
   anybody counted.

   Counting it was, until now, something done by hand and remembered — which is how
   a wrong number gets quoted.  It was quoted wrong: the first version of this
   measurement counted only geometry and therefore called the Willmore laboratory
   dead, and the Willmore laboratory is not dead, it turns a Clifford torus whose
   vertices never move.  So TWO numbers are reported and never added together
   silently:

     RECOMPUTED  buffer attributes whose version advanced — instance matrices,
                 instance colours, vertex positions.  Geometry rebuilt.
     MOVED       objects whose world matrix changed.  Rigid bodies driven.

   NEITHER IS A VERDICT.  A laboratory that is meant to be a diagram scores zero on
   both and is right to.  What the numbers are for is the claim some laboratories
   make in their own prose — "rebuilt every frame" — which until now nothing could
   check.

   THIS CANNOT RUN UNDER ?render=0.  The manifest walk uses that mode deliberately,
   to prove the atlas comes up without a GPU; but with no render loop every
   laboratory would measure zero and the walk would produce a table of confident
   falsehoods.  So this is its own walk, with rendering on, and says so.

   Usage:  node scripts/liveness.mjs [--json]
   ========================================================================= */

import { readFileSync, existsSync } from 'node:fs';
import { createServer } from 'node:http';
import { dirname, join, extname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const JSON_OUT = process.argv.includes('--json');

/* ── THE FLOOR, AND WHAT KIND OF NUMBER IT IS ───────────────────────────────
   A ratchet, and a hand-written one, which is the fault class this atlas keeps
   refusing: a list standing in for a registry.  It is accepted here deliberately
   and with the reason written down, because the claim "this laboratory recomputes
   every frame" is currently made in PROSE by the laboratories that make it, and
   the atlas has no machine-readable form of it to derive a gate from.  Giving it
   one would be the better fix and is not done here.  Until then this catches the
   regression that matters: a change that quietly turns living laboratories back
   into pictures. */
const FLOOR = 60;
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

const PORT = 8973;
await new Promise(r => server.listen(PORT, r));

let chromium;
try { ({ chromium } = await import('/opt/node22/lib/node_modules/playwright/index.mjs')); }
catch { try { ({ chromium } = await import('playwright')); } catch { chromium = null; } }
if (!chromium) {
  console.error('playwright not available; cannot measure liveness.');
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
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
const errors = [];
page.on('pageerror', e => errors.push(String(e.message)));

/* rendering ON — the opposite of the manifest walk, and the reason this is its own file */
await page.goto(`http://127.0.0.1:${PORT}/index.html`, { waitUntil: 'domcontentloaded' });
await page.waitForFunction(() => globalThis.HCC_API && globalThis.HCC_API.liveness,
  null, { timeout: 60000 }).catch(() => {});
await page.evaluate(async () => { await HCC_API.ready({ timeout: 20000 }); });

const has = await page.evaluate(() => typeof globalThis.HCC_API?.liveness === 'function');
if (!has) {
  console.error('HCC_API.liveness is not exposed — nothing can be measured.');
  await browser.close(); server.close(); process.exit(1);
}

const labs = await page.evaluate(() => HCC_API.labs.list().map(l => ({ id: l.id, world: l.world || 's3',
  title: String(l.title || '').slice(0, 40) })));

const rows = [];
for (const L of labs) {
  try {
    await page.evaluate(([w, id]) => { HCC_NAV.go(w, id); }, [L.world, L.id]);
    await page.waitForTimeout(900);
    const r = await page.evaluate(() => HCC_API.liveness(16));
    rows.push({ id: L.id, title: L.title, recomputed: r.recomputed, moved: r.moved, bodies: r.bodies });
  } catch (e) {
    rows.push({ id: L.id, title: L.title, recomputed: -1, moved: -1, bodies: 0, error: String(e.message || e).slice(0, 60) });
  }
}
await browser.close(); server.close();

rows.sort((a, b) => (a.recomputed + a.moved) - (b.recomputed + b.moved) || a.id.localeCompare(b.id));
const alive = rows.filter(r => r.recomputed > 0 || r.moved > 0);
const still = rows.filter(r => r.recomputed === 0 && r.moved === 0);
const broke = rows.filter(r => r.recomputed < 0);

if (JSON_OUT) { console.log(JSON.stringify({ floor: FLOOR, alive: alive.length, rows }, null, 1)); }
else {
  console.log('\n  rebuilt  moved  of      laboratory');
  for (const r of rows) console.log(
    String(r.recomputed).padStart(9), String(r.moved).padStart(6), String(r.bodies).padStart(5), '   ',
    r.id.padEnd(11), r.title);
  console.log(`\n${alive.length} of ${rows.length} laboratories change something between frames · ${still.length} change nothing at all`);
  if (still.length) console.log(`  still: ${still.map(r => r.id).join(' ')}`);
  console.log('\nNEITHER NUMBER IS A VERDICT. A laboratory meant to be a diagram scores zero on both\nand is right to. What is checked is only that the atlas as a whole has not gone quiet.');
}

if (broke.length) {
  console.error(`\nFAIL — ${broke.length} laboratories could not be measured: ${broke.map(r => r.id).join(' ')}`);
  process.exit(1);
}
if (alive.length < FLOOR) {
  console.error(`\nFAIL — only ${alive.length} laboratories are alive, against a floor of ${FLOOR}.`);
  console.error('Something turned living laboratories back into pictures. That is what this floor is for.');
  process.exit(1);
}
console.log(`\nliveness: ${alive.length} alive, floor ${FLOOR} — ok`);
process.exit(0);
