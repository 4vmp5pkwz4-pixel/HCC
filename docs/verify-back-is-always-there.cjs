#!/usr/bin/env node
'use strict';
/* ══ BACK IS ALWAYS THERE ═════════════════════════════════════════════════════════════════
 * The user's rule: after ANY transition a Back button must be visible. There used to be two back-stacks —
 * the camera-exact one (navPush) and the route history (hccGo) — and a floating button shown only when the
 * first had something in it, sitting under the trail when it did. Most transitions fed the other stack.
 * Checked here, statically (the page harness walks it live: Fractal → NS-flow → Trisphere → Observable → Solar):
 *   1. Back is the FIRST element of the trail on every render, and the phone's shortened trail keeps it
 *   2. it is never hidden: with nowhere to go it is dimmed and says so; its state is synced every frame
 *   3. ONE CLOCK: both stacks stamp their entries from one counter, and Back takes the latest; a jump that
 *      recorded both (navPush then hccGo) is one step — the route is followed and the saved camera restored
 *   4. the route history keeps the camera too, and HCC_NAV.back is the same unified Back
 *   5. the floating button is retired (it cannot sit under the trail any more)
 */
const fs = require('node:fs'), path = require('node:path');
const SRC = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
let pass = 0, fail = 0;
const ok = (n, c, d) => { if (c) { pass++; console.log('  PASS — ' + n + (d ? ' :: ' + d : '')); } else { fail++; console.log('  FAIL — ' + n + (d ? ' :: ' + d : '')); } };
const render = SRC.slice(SRC.indexOf('function hccRenderBreadcrumb(){'), SRC.indexOf("addEventListener('popstate'"));
ok('Back is the first element of the trail on every render, outside the phone\'s shortening',
  /el\.innerHTML=`<button data-crumb="back" class="crumbBack\$\{canBack\?'':' off'\}"[^`]*`\+\(narrow\?seg\.slice\(-2\):seg\)\.join/.test(render) && /if\(k==='back'\)\{ navUnifiedBack\(\); return; \}/.test(render));
ok('it is never hidden: dimmed with nowhere to go, and synced every frame',
  /#hccCrumb button\.crumbBack\.off\{opacity:\.38/.test(SRC) && /try\{ navBackSync\(\); \}catch\(e\)\{\}\n  try\{ labBarTick\(\); \}/.test(SRC) && !/crumbBack[^{]*\{[^}]*display:none/.test(SRC)
  && /function navCanGoBack\(\)\{ try\{ return NAV_STACK\.length>0\|\|HCC_CTX\.navigationHistory\.length>0\|\|!!HCC_CTX\.labId\|\|HCC_CTX\.worldId!=='solar'/.test(SRC));
ok('ONE CLOCK: both stacks stamp from one counter, Back takes the latest, and a jump that recorded both is one step with its saved camera',
  /const NAV_SEQ=\{n:0\};/.test(SRC) && /snap\.seq=\+\+NAV_SEQ\.n; NAV_STACK\.push\(snap\)/.test(SRC) && /prev\.seq=\+\+NAV_SEQ\.n; prev\.cam=camera\.position\.toArray\(\)/.test(SRC)
  && /if\(a>=0&&b-a===1\)\{ const snap=NAV_STACK\.pop\(\); cam=snap\.cam; tgt=snap\.tgt; \}/.test(SRC) && /hccGo\(t,\{history:false\}\);/.test(SRC));
ok('HCC_NAV.back is the same unified Back', /globalThis\.HCC_NAV=\{go:\(w,l\)=>hccGo\(\{worldId:w,labId:l\|\|null\}\),back:\(\)=>navUnifiedBack\(\),/.test(SRC));
ok('the floating button is retired', /#navCluster>#navBackBtn\{display:none!important\}/.test(SRC));
console.log('\n  ' + pass + ' passed, ' + fail + ' failed'); process.exit(fail ? 1 : 0);
