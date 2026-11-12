/* THE STAGE HOLDS STILL (v4.422) — four things a reader reported and what was done about each, checked where it can be.
     1. a laboratory opens centred and stays there: the framing of v4.419 re-measured a moving picture three times a second and
        chased it; it is now off unless asked for, and the centre is solved once per layout. Measured: every S³ laboratory at
        three viewports, the slide read at 0.35 s, 1.2 s and 2.6 s after arrival (docs/data/stage-stillness-v4.422.json);
     2. the caption cannot cover the view: a rule on #hud — width and line count bounded — and its measured share of the screen;
     3. the resolution governor: lifted out of the page and run here against a fake renderer at 10, 30 and 60 frames a second;
     4. every instrument an agent can run: core/atlas/instruments.mjs reproduces api/instruments.json at the defaults, refuses
        instead of clamping, and agrees with the page itself (docs/data/instrument-parity-v4.422.json);
     5. the same instruments are in the SDK, the REST service and the MCP tool table.
   What is NOT checked here: the frame rate of any real device. The governor's rule is run; what it buys on a given phone is
   not measured by this file and is not claimed. */
import fs from 'node:fs'; import path from 'node:path';
const ROOT = path.join(path.dirname(new URL(import.meta.url).pathname), '..');
const src = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const read = f => JSON.parse(fs.readFileSync(path.join(ROOT, f), 'utf8'));
let pass = 0, fail = 0;
const check = (ok, claim, nums) => { if (ok) pass++; else fail++; console.log(`${ok ? 'PASS' : 'FAIL'} — ${claim} :: ${nums}`); };
const has = list => list.filter(s => !src.includes(s));

{ const miss = has(["frame:false};", "const STAGE_STEADY=INQ_OCCLUDERS.filter(x=>x!=='labPanel');", '-SEL_INSET.x+SEL_INSET.tx', 'frame:v=>{ STAGE_ALL.frame=!!v;']);
  const C = read('docs/data/stage-stillness-v4.422.json'), V = C.viewports;
  const ok = !miss.length && V.length === 3 && V.every(v => v.labs >= 140 && v.drifting === 0 && v.max_drift_px <= 0.5 && v.errors === 0);
  check(ok, 'a laboratory opens centred and does not drift: the picture is no longer re-measured while it moves (framing on content is off unless HCC_STAGE.frame(true) asks for it), the free rectangle is taken without the late catalogue panel, with the caption left out and with a fixed strip kept for the dock whether or not it has arrived, and the centre is solved once per layout — measured on every S³ laboratory at 1440 × 900, 390 × 844 and 852 × 393, the slide read 0.35 s, 1.2 s and 2.6 s after arrival, none moves by more than half a pixel and none raises a page error',
    V.map(v => `${v.viewport}: ${v.labs} labs · drifting ${v.drifting} · max ${v.max_drift_px} px`).join(' · ') + (miss.length ? ' · missing ' + miss.join(' | ') : '')); }

{ const miss = has(['#hud{max-width:min(72vw,560px)}', '#hud .big,#hud .sub{display:-webkit-box;-webkit-box-orient:vertical;overflow:hidden;overflow-wrap:anywhere}',
    '#hud .big{-webkit-line-clamp:2;line-clamp:2}', '@media (max-width:900px),(pointer:coarse){ #hud .big{-webkit-line-clamp:1!important;line-clamp:1!important} #hud #hudSpark{height:30px;margin-top:3px} }']);
  const V = read('docs/data/stage-stillness-v4.422.json').viewports, worst = Math.max(...V.map(v => v.max_hud_fraction));
  check(!miss.length && worst <= 0.12 && V.every(v => v.hud_over_12pct === 0),
    'the caption cannot cover the view: one rule for the whole atlas — the central caption is at most 72 % of the width and 560 px, its headline and its line are each cut to two lines (the headline to one, and the sparkline to 30 px, on a phone or any touch screen), the full text staying in the laboratory’s panel — and measured on every laboratory at three viewports it never takes more than 12 % of the screen',
    V.map(v => `${v.viewport}: largest ${(100 * v.max_hud_fraction).toFixed(1)} %`).join(' · ') + (miss.length ? ' · missing ' + miss.join(' | ') : '')); }

{ const i = src.indexOf('const PERF_GOV={'), j = src.indexOf('globalThis.HCC_PERF=', i);
  const run = (fps, seconds, start, webdriver, xr) => { let ratio = start, resizes = 0;
    const env = { document: { hidden: false }, navigator: { webdriver }, performance: { now: () => 0 }, requestRendererResize: () => { resizes++; },
      renderer: { xr: { isPresenting: xr }, getPixelRatio: () => ratio, setPixelRatio: v => { ratio = v; } } };
    const tick = new Function(...Object.keys(env), src.slice(i, j) + '\nreturn [perfGovTick,PERF_GOV];')(...Object.values(env));
    const trace = []; for (const [f, s] of [].concat(fps).map((f, k) => [f, [].concat(seconds)[k]])) { for (let t = 0; t < s * f; t++) tick[0](1 / f); trace.push(+ratio.toFixed(3)); }
    return { ratio, trace, resizes, G: tick[1] }; };
  const slow = run(10, 30, 2), mid = run(30, 30, 2), fast = run(60, 30, 2), back = run([10, 60], [30, 120], 2), auto = run(10, 30, 2, true), xr = run(10, 30, 2, false, true), low = run(10, 30, 0.5);
  const ok = Math.abs(slow.ratio - 0.55) < 1e-9 && mid.ratio === 2 && fast.ratio === 2 && back.trace[0] === 0.55 && Math.abs(back.trace[1] - 2) < 1e-9
    && auto.ratio === 2 && xr.ratio === 2 && low.ratio === 0.5 && slow.resizes === slow.G.steps && slow.G.steps >= 5;
  check(ok, 'the resolution governor, run as it stands in the page against a fake renderer: at 10 frames a second it lowers the drawing buffer by a fifth every two seconds until it is 0.55 of a CSS pixel and stops there; at 30 and at 60 it changes nothing; when the frame rate comes back to 60 it returns a tenth at a time to exactly what the quality preset gave; it does nothing in a headset, nothing in an automated browser, and nothing to a buffer already below its floor',
    `10 fps: 2 → ${slow.ratio.toFixed(2)} in ${slow.G.steps} steps · 30 fps: ${mid.ratio} · 60 fps: ${fast.ratio} · 10 then 60: ${back.trace.join(' → ')} · headset ${xr.ratio} · automated ${auto.ratio} · from 0.5: ${low.ratio}`); }

const M = await import(path.join(ROOT, 'core/atlas/instruments.mjs'));
const SDK = await import(path.join(ROOT, 'api/agent-client.mjs'));
{ const J = read('api/instruments.json'), P = read('docs/data/instrument-parity-v4.422.json');
  const close = (a, b) => typeof a === 'number' && typeof b === 'number' ? (a === b || Math.abs(a - b) <= 1e-9 * Math.max(1, Math.abs(a), Math.abs(b))) : JSON.stringify(a) === JSON.stringify(b);
  let same = 0, values = 0; const off = [];
  for (const I of J.instruments.filter(x => x.runnable)) { const S = (I.sample || {}).output || {}, out = JSON.parse(JSON.stringify((await SDK.evaluateInstrument(I.id, (I.sample || {}).input || {})).output)); let ok = Object.keys(S).length > 0;
    for (const k of Object.keys(S)) { values++; if (!close(out[k], S[k])) ok = false; } if (ok) same++; else off.push(I.id); }
  const run = J.counts.runnable, all = J.counts.instruments;
  let refused = 0; const withRange = J.instruments.filter(x => x.runnable && x.inputs.some(i => typeof i.default === 'number' && i.max != null));
  for (const I of withRange) { const i = I.inputs.find(i => typeof i.default === 'number' && i.max != null);
    try { await SDK.evaluateInstrument(I.id, { [i.name]: i.max + Math.max(1, Math.abs(i.max)) }); } catch (e) { if (e.code === 'OUT_OF_DOMAIN') refused++; } }
  let pageOnly = 0; for (const id of Object.keys(M.PAGE_ONLY)) { try { await SDK.evaluateInstrument(id); } catch (e) { if (e.code === 'PAGE_ONLY') pageOnly++; } }
  const ok = all >= 169 && run >= 150 && run === Object.keys(M.INSTRUMENTS).length && same === run && values > 1000 && refused === withRange.length && withRange.length > 100
    && pageOnly === all - run && M.ATLAS_VERSION === (src.match(/const HCC_VERSION='([^']+)'/) || [])[1]
    && P.instruments === run && P.agree >= 140 && P.agree + P.differ.length === P.instruments;
  check(ok, 'every instrument an agent can run: the evaluate() of each computational laboratory is lifted verbatim out of the page with the declarations it names, and all that are pure mathematics run with no browser — each reproduces, here, its outputs at its own defaults; an input beyond its declared range is refused, never clamped; the ones that reach the page say so with the reason instead of answering. Against the page itself in a headless browser the outputs agree to nine digits for most and differ in the last digits of transcendental functions for the rest — chaotic exponents and near-zero residuals — which are listed by name',
    `${run} of ${all} runnable · ${same}/${run} reproduce ${values} sample values · ${refused}/${withRange.length} out-of-range refusals · ${pageOnly} page-only with a reason · page parity ${P.agree}/${P.instruments} (differ: ${P.differ.map(d => d.split(' ')[0]).join(', ')})${off.length ? ' · off ' + off.join(',') : ''}`); }

{ const srv = fs.readFileSync(path.join(ROOT, 'server/server.mjs'), 'utf8'), mcp = read('.well-known/mcp.json'), api = read('api/openapi.json');
  const names = mcp.tools.map(t => t.name), L = await SDK.listInstruments(), q = await SDK.listInstruments({ query: 'hpage' });
  const r = await SDK.evaluateInstrument('hpage', { thooft_lambda: 1 });
  const ok = names.includes('list_instruments') && names.includes('evaluate_instrument') && !!api.paths['/api/v1/instruments'] && !!api.paths['/api/v1/instruments/{id}/evaluate']
    && srv.includes("name: 'evaluate_instrument'") && L.length >= 169 && q.some(x => x.id === 'hpage') && r.schema === 'hcc.instrument-result/1'
    && Math.abs(r.output.quartic_coefficient - (-36.94) / (16 * Math.PI * Math.PI) ** 2) < 1e-12 && r.source.extraction === 'verbatim' && r.units.quartic_coefficient !== undefined;
  check(ok, 'one registry, three doors: the static SDK (listInstruments, evaluateInstrument — importable by URL, nothing to install), the REST service (/api/v1/instruments and …/{id}/evaluate) and the MCP tool table (list_instruments, evaluate_instrument) all answer from the same extracted module, and a result carries its inputs as used, its units and the hash of the page it was lifted from',
    `${L.length} instruments listed · MCP tools ${names.length} · REST paths ${Object.keys(api.paths).length} · hpage(λ = 1): b = ${r.output.quartic_coefficient.toExponential(6)} = −36.94/(16π²)² · source ${r.source.sha256_16}`); }

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
