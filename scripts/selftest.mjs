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
try { ({ chromium } = await import('/opt/node22/lib/node_modules/playwright/index.mjs')); }
catch { try { ({ chromium } = await import('playwright')); }
  catch { console.error('playwright not available; cannot run the self-tests.'); server.close(); process.exit(1); } }

const browser = await chromium.launch({ executablePath: process.env.PW_CHROMIUM || '/opt/pw-browsers/chromium' });

/* the arrivals. render=0 keeps this fast and headless-safe; the deep link is the path a
   shared link takes, and it is the one that reaches the S³-gated clauses. */
const ARRIVALS = [
  { name: 'default arrival (solar system)', hash: '' },
  { name: 'deep link into an S³ laboratory', hash: '#/world/s3/lab/ns' },
];

let worst = 0, grand = 0;
const seen = new Map();          /* name → whether it EVER passed, so an arrival that skips
                                    a clause does not hide an arrival that fails it */
for (const arrival of ARRIVALS) {
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  const errs = [];
  page.on('pageerror', e => errs.push(String(e.message)));
  await page.goto(`http://127.0.0.1:${PORT}/index.html?render=0${arrival.hash}`, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => globalThis.HCC_API && document.documentElement.dataset.hccRender,
    null, { timeout: 30000 }).catch(() => { });
  await page.evaluate(async () => { await HCC_API.ready({ timeout: 15000 }); });
  const res = await page.evaluate(() => {
    const T = (globalThis.FBS3R_QA && globalThis.FBS3R_QA.selfTests()) || [];
    return { total: T.length, failed: T.filter(t => !t.pass).map(t => ({ name: t.name, detail: String(t.detail) })) };
  });
  await page.close();

  if (res.total === 0) {
    console.error(`✗ ${arrival.name}: the suite reported ZERO tests — the page did not boot`);
    if (errs.length) console.error('  page errors: ' + errs.slice(0, 3).join(' · '));
    worst = 1; continue;
  }
  grand = Math.max(grand, res.total);
  for (const f of res.failed) seen.set(f.name, f);
  console.log(`· ${arrival.name} … ${res.total - res.failed.length}/${res.total} passed`
    + (res.failed.length ? ` · ${res.failed.length} FAILED` : '')
    + (errs.length ? ` · ${errs.length} page error(s)` : ''));
  if (res.failed.length) worst = 1;
}

await browser.close();
server.close();

if (seen.size) {
  console.error(`\n${seen.size} assertion(s) failed across ${ARRIVALS.length} arrivals:`);
  for (const f of seen.values())
    console.error(`\n  FAIL · ${LIST ? f.name : f.name.slice(0, 150)}\n         ${LIST ? f.detail : f.detail.slice(0, 300)}`);
  console.error('');
} else {
  console.log(`\nself-tests: ${grand} assertions, 0 failures, across ${ARRIVALS.length} arrivals`);
}
process.exit(worst);
