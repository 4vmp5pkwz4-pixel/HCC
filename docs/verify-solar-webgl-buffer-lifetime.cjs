#!/usr/bin/env node
'use strict';

/* Regression for the GPU hang fixed in v3.64.0.
   The failure mode is not "too many objects" but unbounded WebGLBuffer lifetime:
   replacing a live BufferAttribute (for example through setFromPoints or
   computeLineDistances) makes three.js allocate a new VBO while the abandoned
   attribute's VBO can remain resident.  Measure the driver's allocation boundary
   directly instead of inferring it from source shape. */

const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');
const assert = require('node:assert/strict');

const ROOT = path.join(__dirname, '..');
const VENDOR = process.env.HCC_VENDOR || path.join(ROOT, 'vendor');
const HAVE_VENDOR = fs.existsSync(VENDOR);
const html0 = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const html = !HAVE_VENDOR ? html0 : html0
  .replace(/https:\/\/cdn\.jsdelivr\.net\/npm\/three@0\.160\.0\/build\/three\.module\.js/g, './vendor/three/build/three.module.js')
  .replace(/https:\/\/cdn\.jsdelivr\.net\/npm\/three@0\.160\.0\/examples\/jsm\//g, './vendor/three/examples/jsm/')
  .replace(/https:\/\/cdn\.jsdelivr\.net\/npm\/@dimforge\/rapier3d-compat@0\.14\.0\/rapier\.es\.js/g, './vendor/rapier/rapier.es.js');

const MIME = {
  '.js':'text/javascript', '.mjs':'text/javascript', '.json':'application/json',
  '.wasm':'application/wasm', '.html':'text/html', '.css':'text/css'
};
const server = http.createServer((req, res) => {
  const url = decodeURIComponent((req.url || '/').split('?')[0]);
  if (url === '/' || url === '/index.html') {
    res.writeHead(200, {'content-type':'text/html'}); res.end(html); return;
  }
  try {
    const rel = url.replace(/^\/+/, '');
    const file = rel.startsWith('vendor/') && HAVE_VENDOR
      ? path.join(VENDOR, rel.slice('vendor/'.length)) : path.join(ROOT, rel);
    const body = fs.readFileSync(file);
    res.writeHead(200, {'content-type':MIME[path.extname(url)] || 'application/octet-stream'});
    res.end(body);
  } catch {
    res.writeHead(404); res.end('not found');
  }
});

function listen() {
  return new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => resolve(server.address().port));
  });
}

(async () => {
  let chromium;
  try { ({chromium} = require('playwright')); }
  catch (e) {
    console.error('FAIL — playwright is required for the Solar GPU lifetime check');
    process.exitCode = 1; return;
  }

  const port = await listen();
  let browser;
  try {
    browser = await chromium.launch();
    const page = await browser.newPage({viewport:{width:1280,height:800}});
    const pageErrors = [];
    page.on('pageerror', e => pageErrors.push(String(e && e.message || e)));

    /* Install before three.js requests the context, so every VBO created by the
       renderer is inside the accounting boundary.  Wrap context instances rather
       than the WebGL prototypes to avoid double-counting WebGL2 inheritance. */
    await page.addInitScript(() => {
      const counts = globalThis.__hccWebGLBuffers = {created:0, deleted:0, contexts:0};
      const originalGetContext = HTMLCanvasElement.prototype.getContext;
      HTMLCanvasElement.prototype.getContext = function(type, ...args) {
        const gl = originalGetContext.call(this, type, ...args);
        if (!gl || !/^webgl2?$/.test(String(type)) || gl.__hccBufferLifetimeWrapped) return gl;
        Object.defineProperty(gl, '__hccBufferLifetimeWrapped', {value:true});
        counts.contexts++;
        const originalCreate = gl.createBuffer.bind(gl);
        const originalDelete = gl.deleteBuffer.bind(gl);
        const deleted = new WeakSet();
        gl.createBuffer = function() {
          const b = originalCreate();
          if (b) counts.created++;
          return b;
        };
        gl.deleteBuffer = function(b) {
          if (b && !deleted.has(b)) { deleted.add(b); counts.deleted++; }
          return originalDelete(b);
        };
        return gl;
      };
    });

    await page.goto(`http://127.0.0.1:${port}/index.html`, {waitUntil:'domcontentloaded'});
    await page.waitForFunction(() => globalThis.HCC_API, null, {timeout:60000});
    await page.evaluate(async () => { await HCC_API.ready({timeout:20000}); });

    const frames = n => page.evaluate(n => new Promise(resolve => {
      let seen = 0;
      const tick = () => { if (++seen >= n) resolve(); else requestAnimationFrame(tick); };
      requestAnimationFrame(tick);
    }), n);

    /* Let shader/program compilation and lazy first-use buffers settle before the
       measurement window.  The old defect then leaked on every rendered Solar frame. */
    await frames(10);
    const before = await page.evaluate(() => ({...globalThis.__hccWebGLBuffers}));
    await frames(18);
    const after = await page.evaluate(() => ({...globalThis.__hccWebGLBuffers}));

    assert.equal(pageErrors.length, 0, `page errors during Solar measurement: ${pageErrors.join(' | ')}`);
    assert.ok(before.contexts > 0, 'no WebGL context was created; the GPU lifetime test did not measure WebGL');
    const liveBefore = before.created - before.deleted;
    const liveAfter = after.created - after.deleted;
    const growth = liveAfter - liveBefore;
    console.log(`Solar WebGL buffers: ${liveBefore} live after warm-up -> ${liveAfter} after 18 rendered frames `+
      `(created ${after.created-before.created}, deleted ${after.deleted-before.deleted}, growth ${growth})`);
    assert.equal(growth, 0,
      `Solar leaks ${growth} live WebGL buffer(s) across 18 steady-state frames; `+
      'a live BufferAttribute is being replaced without releasing its old GPU buffer');
    console.log('PASS — Solar steady-state WebGL buffer lifetime is bounded');
  } finally {
    if (browser) await browser.close().catch(() => {});
    await new Promise(resolve => server.close(resolve));
  }
})().catch(err => {
  console.error('FAIL — Solar WebGL buffer lifetime:', err && err.stack || err);
  process.exitCode = 1;
});
