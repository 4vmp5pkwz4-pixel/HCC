/* HEARING THE SHAPE OF THE UNIVERSE (v4.429) — a flash, its echoes, and the experiment that names the space.
     1. the echo spectra, computed from the groups: times and multiplicities for the six spaces;
     2. the first echo alone tells the six apart, with room to spare;
     3. an arrival is where the copy is: its time is the distance to g·o, its direction points at it, for an observer who has moved;
     4. the antipode and the full circuit arrive from the whole sky; the flux law 1/sin² d from the area of a sphere in S³;
     5. the shader, the panel, the experiment and the instrument are in the page.
   NOT checked here: any pixel; and nothing about the real sky — this is a thought experiment in a static space. */
import fs from 'node:fs'; import path from 'node:path';
const ROOT = path.join(path.dirname(new URL(import.meta.url).pathname), '..');
const src = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
let pass = 0, fail = 0;
const check = (ok, claim, nums) => { if (ok) pass++; else fail++; console.log(`${ok ? 'PASS' : 'FAIL'} — ${claim} :: ${nums}`); };
const cut = (a, b) => { const i = src.indexOf(a), j = src.indexOf(b, i); if (i < 0 || j < 0) throw new Error('block not found: ' + a); return src.slice(i, j); };
const L = new Function(`${cut('/* ═══ SKY-MATH-BEGIN ═══', '/* ═══ SKY-MATH-END ═══')}\n${cut('/* ═══ TOPO-MATH-BEGIN ═══', '/* ═══ TOPO-MATH-END ═══')}\n${cut('/* ═══ ECHO-MATH-BEGIN ═══', '/* ═══ ECHO-MATH-END ═══')}
  return {ISKY_TAU,iskyDot,iskyUnit,iskyRay,iskyPoints,iskyRng,iskyQmul,iskyMove,ISKY_SPACES,iskyGroupOf,iskyNearestCopy,iskyEchoSpectrum,iskyEchoFlux,iskyBallFraction,iskyEchoArrivals,iskyEchoIdentify,iskyEchoPitch};`)();
const KEYS = Object.keys(L.ISKY_SPACES), G = Object.fromEntries(KEYS.map(k => [k, L.iskyGroupOf(k)])), deg = x => Math.round(x * 180 / Math.PI);
const spec = k => L.iskyEchoSpectrum(G[k]).map(e => `${deg(e.theta)}×${e.count}`).join(' ');

{ const want = { s3: '', rp3: '180×1', q8: '90×6 180×1', t24: '60×8 90×6 120×8 180×1', o48: '45×6 60×8 90×18 120×8 135×6 180×1', i120: '36×12 60×20 72×12 90×30 108×12 120×20 144×12 180×1' };
  const ok = KEYS.every(k => spec(k) === want[k] && L.iskyEchoSpectrum(G[k]).reduce((s, e) => s + e.count, 0) === G[k].length - 1);
  check(ok, 'the echo spectra, from the groups and nothing else: the distances arccos(Re g) of the copies and how many share each — twelve at 36° in Poincaré’s space, then twenty at 60°, twelve at 72°, thirty at 90°, and the mirror of these to one at 180°; six at 45° in the octahedral space; eight at 60° in the tetrahedral; six at 90° in the quaternion space; one at 180° in projective space; none on the sphere itself — and every element but the identity is counted once',
    KEYS.map(k => `${k}: ${spec(k) || '—'}`).join(' · ')); }

{ const first = Object.fromEntries(KEYS.map(k => [k, G[k].length > 1 ? L.iskyNearestCopy(G[k]) : L.ISKY_TAU])), v = Object.values(first).sort((a, b) => a - b); let gap = 9; for (let i = 1; i < v.length; i++) gap = Math.min(gap, v[i] - v[i - 1]);
  let wrong = 0, n = 0; const R = L.iskyRng(429); for (const k of KEYS) for (let t = 0; t < 200; t++) { n++; if (L.iskyEchoIdentify(first[k] + (R() - 0.5) * 0.14).key !== k) wrong++; }
  check(wrong === 0 && gap > 0.15, 'one flash and a clock name the space: the first echo arrives at π/5, π/4, π/3, π/2, π or 2π, no two closer than 0.157 rad, so a reading of its time wrong by as much as 0.07 rad — the width of the flash drawn — still picks the right one of the six every time',
    `first echoes ${KEYS.map(k => `${k} ${first[k].toFixed(3)}`).join(' · ')} · least gap ${gap.toFixed(3)} · ${n} noisy readings, misidentified ${wrong}`); }

{ let worst = 0, dirErr = 0, n = 0;
  for (const k of ['q8', 't24', 'i120']) for (let t = 0; t < 6; t++) { const oF = L.iskyPoints(1, 40 + t)[0]; let u = L.iskyPoints(1, 80 + t)[0]; const p = L.iskyDot(u, oF); u = L.iskyUnit(u.map((x, i) => x - p * oF[i]));
    const o = L.iskyMove([oF, u, u, u], u, 0.23 * t)[0];                                   /* the observer has drifted since the flash */
    for (const a of L.iskyEchoArrivals(G[k], o, oF)) { if (!a.dir) continue; n++; const c = L.iskyQmul(G[k][a.k], oF); worst = Math.max(worst, Math.abs(Math.acos(Math.max(-1, Math.min(1, L.iskyDot(c, o)))) - a.t));
      const q = L.iskyRay(o, a.dir, a.t); dirErr = Math.max(dirErr, Math.sqrt(q.reduce((s, x, i) => s + (x - c[i]) ** 2, 0)), Math.abs(L.iskyDot(a.dir, o))); } }
  const still = L.iskyEchoArrivals(G.i120, [1, 0, 0, 0], [1, 0, 0, 0]);
  check(worst < 1e-9 && dirErr < 1e-7 && n > 500 && still.filter(a => Math.abs(a.t - Math.PI / 5) < 1e-9).length === 12, 'an echo is where the copy is: for an observer who has drifted since the flash, each arrival’s time is the distance from where the observer now stands to the copy g·o_F of where the flash left, and following its direction for that time lands on the copy; an observer who has not moved hears twelve at once at π/5 in Poincaré’s space',
    `${n} arrivals · worst time error ${worst.toExponential(1)} · worst miss of the copy ${dirErr.toExponential(1)}`); }

{ const A = L.iskyEchoArrivals(G.i120, [1, 0, 0, 0], [1, 0, 0, 0]), S = L.iskyEchoArrivals(G.s3, [0, 1, 0, 0], [0, 1, 0, 0]), whole = A.filter(a => a.dir === null).map(a => a.t.toFixed(4)).join(', ');
  /* the fraction of the sphere within distance d, counted on random points, against (d − sin d cos d)/π, whose derivative is 2 sin² d/π */
  const P = L.iskyPoints(40000, 77), o = [1, 0, 0, 0]; let worst = 0; for (const d of [0.4, 1.0, Math.PI / 2, 2.2, 2.9]) { const f = P.filter(p => Math.acos(p[0]) < d).length / P.length; worst = Math.max(worst, Math.abs(f - L.iskyBallFraction(d))); }
  const h = 1e-5, deriv = [0.5, 1.3, 2.4].map(d => Math.abs((L.iskyBallFraction(d + h) - L.iskyBallFraction(d - h)) / (2 * h) - 2 * Math.sin(d) ** 2 / Math.PI)).reduce((a, b) => Math.max(a, b), 0);
  check(whole === '3.1416, 6.2832' && S.length === 1 && S[0].dir === null && Math.abs(S[0].t - L.ISKY_TAU) < 1e-12 && worst < 0.01 && deriv < 1e-8 && Math.abs(L.iskyEchoFlux(Math.PI / 2) - 1) < 1e-12 && L.iskyEchoFlux(0.3) > 11,
    'the whole sky at once, twice: the copy at the antipode sends its light from every direction at τ = π, and the flash itself, having gone all the way round, at 2π — on the simply connected sphere that is the only echo there is; and the flux law is the geometry’s: the fraction of the sphere within d is (d − sin d cos d)/π, counted here on forty thousand random points, so the area of a sphere of radius d is 4π sin² d and an echo’s light is spread as 1/sin² d — least at the equator',
    `Poincaré, whole-sky arrivals at ${whole} · S³: ${S.length} arrival at ${S[0].t.toFixed(4)} · ball fraction worst ${worst.toFixed(4)} · derivative error ${deriv.toExponential(1)}`); }

{ const need = ['uniform float uFlashT,uFlashAll; uniform vec4 uFlashO; uniform vec4 uEcho[16]; uniform vec2 uEchoI[16];', 'float x=(uFlashT-best-acos(clamp(mx,-1.0,1.0)))/0.07;', 'if(bi>=0&&best<uEchoI[j].y) continue;', 'function iskyEchoSync(O,P,dt){', 'iskyCmbSync(O,P); iskyEchoSync(O,P,dt);',
    '<canvas id="iskyEchoCv"', "R.querySelectorAll('[data-iskyguess]')", 'globalThis.HCC_ECHO=Object.freeze({', "${P.model==='static'&&!iskyMysteryOn()?iskyCmbPanel(P):''}", "{id:'iskyEcho429', kind:'found'", "name:'first_echo_count'"];
  const miss = need.filter(s => !src.includes(s));
  const M = await import(path.join(ROOT, 'core/atlas/instruments.mjs')), f = M.INSTRUMENTS.skytopo, a = f ? f({ space_order: 120, topo_curvature: 0.001 }) : {}, b = f ? f({ space_order: 48, topo_curvature: 0.001 }) : {}, c = f ? f({ space_order: 1, topo_curvature: 0.001 }) : {};
  check(!miss.length && a.first_echo_count === 12 && b.first_echo_count === 6 && c.first_echo_count === 0, 'the layer is in the page: the shader lights a body when the wave from the nearest copy of the flash reaches it, delayed by the light’s way back, and draws each arriving copy as a star unless a nearer body hides it; the trace, the experiment with an unnamed space — which hides the panels that would name it — the ledger and the agent handle are there; and the instrument, with no browser, gives twelve first echoes for Poincaré’s space and six for the octahedral',
    `first_echo_count: 120 → ${a.first_echo_count} · 48 → ${b.first_echo_count} · 1 → ${c.first_echo_count}${miss.length ? ' · missing ' + miss.map(x => x.slice(0, 44)).join(' | ') : ''}`); }

{ const need = ['<div id="iskyFlashDock" class="stageDock" role="toolbar"></div>', "if(e.target.closest&&e.target.closest('[data-iskyfd]')) iskyFlash();", 'function iskyPing(freq,gain,dur){ if(state.iskySound===false) return;', 'iskyPing(iskyEchoPitch(a.t),a.dir===null?0.22:0.05*Math.sqrt(n),', "hudBig.textContent+=` · ⚡ τ ", "{id:'iskyEchoHeard430', kind:'revises'"];
  const miss = need.filter(s => !src.includes(s)), p = [0, Math.PI / 5, Math.PI / 4, Math.PI / 3, Math.PI / 2, Math.PI, L.ISKY_TAU].map(L.iskyEchoPitch);
  check(!miss.length && Math.abs(p[0] - 880) < 1e-9 && Math.abs(p[6] - 220) < 1e-9 && Math.abs(p[5] - 440) < 1e-9 && p.every((x, i) => !i || x < p[i - 1]) && Math.abs(p[1] - 766.1) < 0.1,
    'v4.430 — the experiment without the panel: a flash button stands on the stage, the caption counts the time since the flash and names the last echo, and each echo is sounded only after the reader has acted and unless sound is off; the pitch falls with the echo’s time from 880 Hz to 220 Hz over the circuit, an octave at the antipode, so the six spaces’ first echoes are six different notes, highest for the smallest space',
    `first-echo notes: Poincaré ${p[1].toFixed(0)} Hz · 2O ${p[2].toFixed(0)} · 2T ${p[3].toFixed(0)} · Q8 ${p[4].toFixed(0)} · RP³ ${p[5].toFixed(0)} · S³ ${p[6].toFixed(0)}${miss.length ? ' · missing ' + miss.map(x => x.slice(0, 40)).join(' | ') : ''}`); }

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
