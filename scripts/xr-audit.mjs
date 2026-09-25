#!/usr/bin/env node
/* ══ THE HEADSET AUDIT ══════════════════════════════════════════════════════════════
   Drives the atlas in an EMULATED Meta Quest 3 (IWER, the Immersive Web Emulation Runtime,
   MIT) through every world, and records what the reader would see: every visible panel as
   an angular rectangle about the head, whether any two content panels overlap, how large the
   body text is in degrees, and where the Solar world's orrery stands. Written to
   docs/xr-audit.json; docs/verify-the-headset-is-usable.cjs recomputes the overlaps from the
   raw rectangles and checks the rest.

   The emulator is not a headset: it has no lenses, no comfort, no real hands. What it does
   measure — geometry in the reader's frame — is exactly what "the panels stick together"
   was about. IWER is looked for in vendor/iwer/, node_modules/iwer/build/ or HCC_IWER. */
import { createServer } from 'node:http';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join, extname, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, 'docs', 'xr-audit.json');
const VENDOR = process.env.HCC_VENDOR || join(ROOT, 'vendor');
const IWER = [process.env.HCC_IWER, join(VENDOR, 'iwer', 'iwer.min.js'), join(ROOT, 'node_modules', 'iwer', 'build', 'iwer.min.js')].filter(Boolean).find(p => existsSync(p));
if (!IWER) { console.error('IWER not found (vendor/iwer/iwer.min.js, node_modules/iwer or HCC_IWER) — cannot emulate a headset.'); process.exit(1); }
const html = readFileSync(join(ROOT, 'index.html'), 'utf8')
  .replace(/https:\/\/cdn\.jsdelivr\.net\/npm\/three@0\.160\.0\/build\/three\.module\.js/g, './vendor/three/build/three.module.js')
  .replace(/https:\/\/cdn\.jsdelivr\.net\/npm\/three@0\.160\.0\/examples\/jsm\//g, './vendor/three/examples/jsm/')
  .replace(/https:\/\/cdn\.jsdelivr\.net\/npm\/@dimforge\/rapier3d-compat@0\.14\.0\/rapier\.es\.js/g, './vendor/rapier/rapier.es.js');
const MIME = { '.js': 'text/javascript', '.mjs': 'text/javascript', '.json': 'application/json', '.wasm': 'application/wasm', '.html': 'text/html', '.css': 'text/css' };
const server = createServer((req, res) => { const url = decodeURIComponent((req.url || '/').split('?')[0]);
  if (url === '/' || url === '/index.html') { res.writeHead(200, { 'content-type': 'text/html' }); res.end(html); return; }
  try { const rel = url.replace(/^\/+/, ''); const body = readFileSync(rel.startsWith('vendor/') ? join(VENDOR, rel.slice(7)) : join(ROOT, rel));
    res.writeHead(200, { 'content-type': MIME[extname(url)] || 'application/octet-stream' }); res.end(body); } catch { res.writeHead(404); res.end('not found'); } });
const PORT = 8989; await new Promise(r => server.listen(PORT, r));
let chromium; try { ({ chromium } = await import('/opt/node22/lib/node_modules/playwright/index.mjs')); } catch { ({ chromium } = await import('playwright')); }
const args = ['--no-sandbox', '--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'];
let browser; try { browser = await chromium.launch({ args }); } catch { browser = await chromium.launch({ args, executablePath: process.env.PW_CHROMIUM || '/opt/pw-browsers/chromium' }); }
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
const errors = []; page.on('pageerror', e => errors.push(String(e.message).slice(0, 200)));
await page.addInitScript({ content: readFileSync(IWER, 'utf8') + ';try{ const d=new IWER.XRDevice(IWER.metaQuest3); d.installRuntime({forceInstall:true}); window.__xrdev=d; }catch(e){ window.__xrerr=String(e); }' });
await page.goto(`http://127.0.0.1:${PORT}/index.html`, { waitUntil: 'domcontentloaded' });
await page.waitForFunction(() => globalThis.HCC_API && globalThis.FBS3R_QA, null, { timeout: 90000 });
await page.evaluate(async () => { await HCC_API.ready({ timeout: 60000 }); });
await page.waitForTimeout(3000);
const result = await page.evaluate(async () => {
  const wait = ms => new Promise(r => setTimeout(r, ms));
  document.getElementById('vrBtn').click(); await wait(4000);
  const P = FBS3R_QA.xrProbe(), worlds = [];
  const orr = () => { const g = FBS3R_QA.xr(); return g; };
  for (const m of ['solar', 's3', 'fbs', 'obs', 'field', 'cyc', 'fractal', 'solar']) {
    P.mode(m); await wait(1200);
    const opened = {}; for (const n of ['card', 'status', 'ctrl', 'measure', 'debug']) opened[n] = P.open(n);
    P.settle(300); await wait(900);
    worlds.push({ world: m, opened, panels: P.panels(), audit: P.audit(), qa: orr() });
    for (const n of ['card', 'status', 'ctrl', 'measure', 'debug']) P.close(n); P.settle(60);
  }
  return { presenting: FBS3R_QA.xr().session, worlds };
});
/* the orrery transform per world, read straight from the scene */
const solarScale = await page.evaluate(() => { try { return FBS3R_QA.xr().rig; } catch (e) { return null; } });
await browser.close(); server.close();
const identity = JSON.parse(readFileSync(join(ROOT, 'version.json'), 'utf8'));
const out = { schema: 'hcc.xr-audit/1', version: identity.version, build: identity.build, device: 'IWER 2.5 · metaQuest3 (emulated)',
  method: 'enter immersive-vr; in each world open the object card, status, controls, measure and debug windows; let the dock settle; read every visible panel as an angular rectangle about the head',
  presenting: result.presenting, worlds: result.worlds, errors: [...new Set(errors)].slice(0, 20), rig_at_end: solarScale };
writeFileSync(OUT, JSON.stringify(out, null, 1) + '\n');
console.log(result.worlds.map(w => `${w.world}: ${w.audit.panels} panels, ${w.audit.counted} overlaps, text ${Math.min(...w.panels.filter(p => p.name !== 'menu' && p.name !== 'tabs').map(p => p.textDeg)).toFixed(2)}°`).join('\n'));
