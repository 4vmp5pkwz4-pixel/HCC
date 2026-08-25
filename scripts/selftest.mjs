/* ══ RUN THE ATLAS'S OWN SELF-TESTS, AND FAIL THE BUILD ON ANY THAT DO NOT PASS ══
   index.html carries eight hundred assertions about itself, and until this file existed
   NOTHING RAN THEM. scripts/validate.mjs checked that the string "runSelfTests" appeared
   in the document — that the suite existed, not that it passed. Eight hundred checks, a
   green pipeline, and no connection between the two.

   That is not a hypothetical gap. It was found by a failing assertion that had been
   shipping for every release since the seventy-second laboratory: the catalogue check
   demanded labs===72 against an atlas carrying eighty-five, and it stayed invisible
   because the clause is gated on being in the S³ world while every harness ever pointed
   at this page arrives in the SOLAR system. `!s3 ||` short-circuited it to true, forever.

   So this runs the suite from MORE THAN ONE ARRIVAL. A world-gated clause is only a check
   in the world that gates it, and a suite executed from a single entry point silently
   excuses every assertion the other entries would have exercised. Two arrivals here: the
   default one, and a deep link into an S³ laboratory — which is also how a shared link
   opens, so it is the reader's path and not a contrivance.

   Usage:  node scripts/selftest.mjs            fail on any failing assertion
           node scripts/selftest.mjs --list     print every failure in full
*/
import { readFileSync, existsSync } from 'node:fs';
import { createServer } from 'node:http';
import { join, extname, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const LIST = process.argv.includes('--list');
const VENDOR = join(ROOT, 'vendor');
const HAVE_VENDOR = existsSync(VENDOR);

/* the CDN is not reachable from a sandboxed build, and a suite that cannot load three.js
   would report zero failures out of zero tests — the most dangerous green there is */
const html0 = readFileSync(join(ROOT, 'index.html'), 'utf8');
const html = !HAVE_VENDOR ? html0 : html0
  .replace(/https:\/\/cdn\.jsdelivr\.net\/npm\/three@0\.160\.0\/build\/three\.module\.js/g, './vendor/three/build/three.module.js')
  .replace(/https:\/\/cdn\.jsdelivr\.net\/npm\/three@0\.160\.0\/examples\/jsm\//g, './vendor/three/examples/jsm/')
  .replace(/https:\/\/cdn\.jsdelivr\.net\/npm\/@dimforge\/rapier3d-compat@0\.14\.0\/rapier\.es\.js/g, './vendor/rapier/rapier.es.js');

const MIME = { '.js': 'text/javascript', '.mjs': 'text/javascript', '.json': 'application/json',
  '.wasm': 'application/wasm', '.html': 'text/html', '.css': 'text/css' };
const server = createServer((req, res) => {
  const url = decodeURIComponent((req.url || '/').split('?')[0]);
  if (url === '/' || url === '/index.html') { res.writeHead(200, { 'content-type': 'text/html' }); res.end(html); return; }
  try {
    const rel = url.replace(/^\/+/, '');
    const body = readFileSync(rel.startsWith('vendor/') && HAVE_VENDOR ? join(VENDOR, rel.slice(7)) : join(ROOT, rel));
    res.writeHead(200, { 'content-type': MIME[extname(url)] || 'application/octet-stream' }); res.end(body);
  } catch { res.writeHead(404); res.end('not found'); }
});
const PORT = 8907;
await new Promise(r => server.listen(PORT, r));

let chromium;
try { ({ chromium } = await import('playwright')); }
catch { try { ({ chromium } = await import('/opt/node22/lib/node_modules/playwright/index.mjs')); }
  catch {
    console.error('playwright not available; cannot run the self-tests.');
    console.error('  `npx playwright install chromium` downloads BROWSERS, not the package —');
    console.error('  the runner also needs `npm install --no-save playwright` for this import.');
    server.close(); process.exit(1); } }

/* ── AND THE BROWSER PATH MUST NOT BE ONE MACHINE'S ─────────────────────────
   This passed executablePath: '/opt/pw-browsers/chromium' unconditionally — the path
   THIS sandbox keeps Chromium at, and nowhere else. A CI runner keeps it wherever
   playwright put it, so the hard-coded path would have failed the launch even after the
   missing driver was fixed. Same fault as a hard-coded count: true on the machine it was
   written on, false on the one that decides whether a release ships.

   Nor is "pass it only if the file exists" enough, because it exists HERE and points at
   a build this playwright version does not use. So the order is: let playwright resolve
   its own browser first — that is what it is for and it is right on any runner — and
   fall back to the explicit path only when that fails and the path is really there. */
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

/* the arrivals. render=0 keeps this fast and headless-safe; the deep link is the path a
   shared link takes, and it is the one that reaches the S³-gated clauses. */
const ARRIVALS = [
  { name: 'default arrival (solar system)', hash: '' },
  { name: 'deep link into an S³ laboratory', hash: '#/world/s3/lab/ns' },
  /* a clause gated on a PREFERENCE is only a check for readers who hold it. The
     reduced-motion contract has two halves — a stylesheet rule and an early return inside
     armIdleDrift — and the second is the kind that rots silently, because nothing notices
     when a fifth caller appears that does not consult the flag. So the suite arrives once
     more with the preference set, the same way it arrives once in S³ because a clause
     gated on a world is only a check in that world. */
  { name: 'reduced motion, at the reader\'s request', hash: '', reducedMotion: 'reduce' },
  /* and a phone, for the same reason again: a clause gated on a VIEWPORT is only a check
     at that viewport. The occlusion promise — that panels never fully cover the scene —
     is meaningless at 1280x800, where nothing is close to covering anything. */
  /* AND WITH TOUCH, because a phone has one. Without hasTouch this arrival is a narrow
     desktop WINDOW: `(pointer:coarse)` does not match, so two blocks in the stylesheet
     that are gated on it ALONE have never been exercised by anything, and the JS gate
     `innerWidth<=900 || pointer:coarse` has only ever been reached down its left branch.
     The landscape arrival below found what that costs; this closes the same hole in
     portrait, where the reader actually spends their time. */
  { name: 'a phone, 390x844', hash: '#/world/s3/lab/ns',
    viewport: { width: 390, height: 844 }, touch: true },
  /* and the LIGHT palette, because the contrast correction only runs there. Shipping a
     fix whose applied behaviour no arrival exercises is how the catalogue clamp survived:
     the pure functions were checked, the result was not. */
  { name: 'the light palette', hash: '#/world/s3/lab/ns', theme: 'day' },
  /* and premium visuals REMEMBERED ON, which is how a returning reader arrives. The tone
     mapping, the domain palettes and the stage materials are all gated on it, and the
     suite has only ever arrived with it off — so every clause about them has been
     vacuous in every run this atlas has ever made. */
  { name: 'premium visuals, remembered on', hash: '#/world/s3/lab/ns', premium: true },
  /* AND A PHONE TURNED SIDEWAYS, which nothing here had ever done. Every landscape rule
     in the stylesheet is gated on `(pointer:coarse) and (orientation:landscape)`, and the
     arrival above is a 390x844 window with a MOUSE — so `pointer:coarse` never matched
     and not one of those rules has ever been exercised by anything. Three of them lost
     the cascade to a later block with one point more specificity, each time silently,
     and the reader found it before the suite did: the catalogue held the left edge, the
     controls held the right, and the scene was a 170-pixel strip between them.

     hasTouch is what makes this arrival real. Without it the viewport is landscape and
     the pointer is fine, which is a desktop window in a strange shape and exercises
     nothing. */
  { name: 'a phone turned sideways, 852x393', hash: '#/world/s3/lab/ns',
    viewport: { width: 852, height: 393 }, touch: true },
];

let worst = 0, grand = 0;
const seen = new Map();          /* name → whether it EVER passed, so an arrival that skips
                                    a clause does not hide an arrival that fails it */
/* ── AND WHETHER IT EVER RAN AT ALL ─────────────────────────────────────────
   A clause gated on a viewport reports "not applicable" everywhere the gate is shut,
   and a clause that says that in EVERY arrival has never run once — it is a green line
   in the report that measures nothing, and it is indistinguishable from a passing one.
   That is exactly what the landscape clause was before this arrival existed: the phone
   arrival was a narrow desktop WINDOW with a mouse, `(pointer:coarse)` never matched,
   and the clause answered "not a landscape phone" in all six arrivals while counting
   as six passes.

   So the atlas prefixes such a detail with NOT APPLICABLE HERE, and this fails the run
   if any clause carries that prefix in every arrival. It is a convention, not a list:
   any future gated clause gets the same protection by using the same words. */
const applied = new Map();       /* name → whether it EVER applied */
for (const arrival of ARRIVALS) {
  const page = await browser.newPage({ viewport: arrival.viewport || { width: 1280, height: 800 },
    ...(arrival.touch ? { hasTouch: true, isMobile: true } : {}) });
  if (arrival.reducedMotion) await page.emulateMedia({ reducedMotion: arrival.reducedMotion });
  /* the theme is remembered in localStorage, so it is set the way a returning reader
     would already have it rather than by clicking a cycling button and hoping */
  if (arrival.theme) await page.addInitScript(t => {
    try { localStorage.setItem('lts-theme', t); } catch (e) { }
  }, arrival.theme);
  if (arrival.premium) await page.addInitScript(() => {
    try { localStorage.setItem('s3.premiumVisuals', '1'); } catch (e) { }
  });
  const errs = [];
  page.on('pageerror', e => errs.push(String(e.message)));
  await page.goto(`http://127.0.0.1:${PORT}/index.html?render=0${arrival.hash}`, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => globalThis.HCC_API && document.documentElement.dataset.hccRender,
    null, { timeout: 30000 }).catch(() => { });
  await page.evaluate(async () => { await HCC_API.ready({ timeout: 15000 }); });
  const res = await page.evaluate(() => {
    const T = (globalThis.FBS3R_QA && globalThis.FBS3R_QA.selfTests()) || [];
    return { total: T.length,
      failed: T.filter(t => !t.pass).map(t => ({ name: t.name, detail: String(t.detail) })),
      /* every clause and whether it ran here, so a clause that never runs anywhere
         cannot pass by being permanently out of scope */
      gated: T.map(t => ({ name: t.name, na: /NOT APPLICABLE HERE/.test(String(t.detail)) })) };
  });
  await page.close();

  if (res.total === 0) {
    console.error(`✗ ${arrival.name}: the suite reported ZERO tests — the page did not boot`);
    if (errs.length) console.error('  page errors: ' + errs.slice(0, 3).join(' · '));
    worst = 1; continue;
  }
  grand = Math.max(grand, res.total);
  for (const f of res.failed) seen.set(f.name, f);
  for (const g of res.gated) applied.set(g.name, (applied.get(g.name) || false) || !g.na);
  console.log(`· ${arrival.name} … ${res.total - res.failed.length}/${res.total} passed`
    + (res.failed.length ? ` · ${res.failed.length} FAILED` : '')
    + (errs.length ? ` · ${errs.length} page error(s)` : ''));
  if (res.failed.length) worst = 1;
}

await browser.close();
server.close();

/* a clause that answered NOT APPLICABLE HERE in every single arrival has never run */
const neverRan = [...applied.entries()].filter(([, ran]) => !ran).map(([name]) => name);
if (neverRan.length) {
  console.error(`\n${neverRan.length} clause(s) reported NOT APPLICABLE HERE in all ${ARRIVALS.length} arrivals — never once run, which is not a pass:`);
  for (const n of neverRan) console.error(`  · ${LIST ? n : n.slice(0, 150)}`);
  console.error('');
  worst = 1;
}

if (seen.size) {
  console.error(`\n${seen.size} assertion(s) failed across ${ARRIVALS.length} arrivals:`);
  for (const f of seen.values())
    console.error(`\n  FAIL · ${LIST ? f.name : f.name.slice(0, 150)}\n         ${LIST ? f.detail : f.detail.slice(0, 300)}`);
  console.error('');
} else {
  console.log(`\nself-tests: ${grand} assertions, 0 failures, across ${ARRIVALS.length} arrivals`);
}
process.exit(worst);
