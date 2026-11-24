/* THE LADDER HAS NO DOOR (v4.438). Asked: «по интерактивной быстрой панели фрактальных уровней снизу перемещение должно
   быть свободным по всему диапазону и не прерываться и не разделяться на стопор между горизонтами и солнечной системой и
   вселенной». Measured before, by dragging the folded φ-ladder strip across the whole range in the release container:
     · out of the Solar System the drag walked the chain's layers live but entered the Observable world (the Horizons) only
       when the finger lifted, and never reached the S³ carrier: the track ended at rung 300, the carrier begins at ≈ 300;
     · back in from the Observable world it stopped dead at rung 273 and waited for a door to be pressed.
   After: the same drag runs Solar System → Horizons (at 278.2) → carrier (at 300.0) and back down to the descent, in one
   movement, desktop and phone; a tap on a far rung flies in legs — through the Solar System's layers to its seam, across,
   through the whole Observable world, across, onto the carrier — and the reverse.

   This runs the strip's own steering, extracted from index.html — sxScrubTo, the Observable world's and the carrier's
   steering, the hop, the legs and the carry — on a model of the three worlds: a camera distance paced towards its goal
   every tick, each world's unit and limits, and the seams' own one-to-one map with its bands. No browser, no package. */
import fs from 'node:fs';
const SRC = fs.readFileSync(new URL('../index.html', import.meta.url), 'utf8');
let pass = 0, fail = 0;
const check = (ok, claim, nums) => { if (ok) pass++; else fail++; console.log(`${ok ? 'PASS' : 'FAIL'} — ${claim} :: ${nums}`); };
const cut = (from, to, inclusive = true) => { const i = SRC.indexOf(from); if (i < 0) throw new Error('marker not found: ' + from.slice(0, 60));
  const j = SRC.indexOf(to, i + from.length); if (j < 0) throw new Error('end marker not found: ' + to.slice(0, 60)); return SRC.slice(i, inclusive ? j + to.length : j); };

/* the seams, read from the page */
const seamSrc = cut('const SCALE_SEAMS=Object.freeze({', '});');
const num = k => { const m = seamSrc.match(new RegExp(k + ':\\s*([0-9.]+)\\s*,')); return m ? +m[1] : NaN; };
const mul = k => { const m = seamSrc.match(new RegExp(k + ':\\s*S3\\.R\\*([0-9.]+)')); return m ? +m[1] : NaN; };
const R = 886.59;   /* the atlas's S³ radius in Gly; only the ratios below matter, and they do not depend on it */
const SEAMS = { solarObsOutGly: num('solarObsOutGly'), obsSolarInGly: num('obsSolarInGly'), obsS3OutGly: R * mul('obsS3OutGly'), s3ObsInGly: R * mul('s3ObsInGly'), s3UnitGly: num('s3UnitGly'), crossFrames: 48 };

/* ── the model: three worlds, a camera distance paced to its goal, the seams' map ───────────────────────────────── */
function makeWorld() {
  const PHI = (1 + Math.sqrt(5)) / 2, LN_PHI = Math.log(PHI), FBS = { lP: 1.616255e-35 };
  const levelR = N => FBS.lP * Math.exp(N * LN_PHI), levelOf = L => Math.log(L / FBS.lP) / LN_PHI;
  const HCC_GLY_M = 9.4607304725808e24, AU = 1.495978707e11;
  const mpuOf = m => m === 'solar' ? AU : m === 'obs' ? HCC_GLY_M : m === 's3' ? SEAMS.s3UnitGly * HCC_GLY_M : 0;
  const LIM = { solar: { min: 1e-4, max: 2e12 }, obs: { min: 0.02, max: 2000 }, s3: { min: 8, max: 100 } };
  const W = { d: 74.6 / (2 * Math.tan(55 * Math.PI / 360)), goal: null, t: 0, log: [], hops: [] };
  const state = { mode: 'solar', s3view: null, scaleChain: true, quantShells: false, obsFibShown: false };
  const camera = { fov: 55 };
  const controls = { get minDistance() { return (LIM[state.mode] || LIM.solar).min; }, get maxDistance() { return (LIM[state.mode] || LIM.solar).max; },
    target: { clone: () => ({ lengthSq: () => 0 }) } };
  const SX_STATE = { N: NaN, drag: null, stepGoal: NaN, obsEdge: null, carry: null };
  const DSC = { on: false, exitN: -1 };
  const performance = { now: () => W.t };
  const viewN = () => levelOf(2 * W.d * Math.tan(camera.fov * Math.PI / 360) * mpuOf(state.mode));
  const env = { state, camera, controls, SX_STATE, DSC, performance, levelR, levelOf, HCC_GLY_M, SCALE_SEAMS: SEAMS,
    hccCameraGoal: (d) => { const L = LIM[state.mode]; W.goal = Math.max(L.min, Math.min(L.max, d)); },
    hccSeamCross: (to) => { const from = state.mode, dGly = W.d * mpuOf(from) / HCC_GLY_M;
      if (!(to === 'obs' && (from === 'solar' || from === 's3')) && !(from === 'obs' && (to === 'solar' || to === 's3'))) return false;
      const B = env.hccSeamBand(to), g = Math.min(B.hi, Math.max(B.lo, dGly));
      W.hops.push({ from, to, at: viewN() }); state.mode = to; if (to === 's3') state.s3view = 'sec';
      W.d = g * HCC_GLY_M / mpuOf(to); W.goal = W.d; return true; },
    hccSeamBand: null, sxMetersPerUnit: () => mpuOf(state.mode), sxFlyTo: (L) => { env.hccCameraGoal(L / mpuOf(state.mode) / (2 * Math.tan(camera.fov * Math.PI / 360))); },
    dscTopNow: () => -Infinity, descentGoTo: () => { }, descentEnter: () => { }, fbsTier2: () => true, sxFbsGo: () => { }, clearFocus: () => { } };
  const body = `${cut('function hccSeamBand(w){', "  return {lo:0, hi:Infinity}; }")}
    const SX_NMAX=300; ${cut('const SX_STRIP_TOP=SX_NMAX+12;', '?SX_STRIP_TOP:SX_NMAX;')}
    ${cut('const sxS3Sec=()=>', ';\n', false)};
    ${cut('let sxHops=0;', 'hccCameraGoal(d,final?(SCALE_SEAMS.crossFrames||48):6); }catch(e){} }')}
    ${cut('function sxObsBand(){', '/* the door across the edge:', false)}
    ${cut('function sxScrubTo(N,final){', '\n/* ── the vertical ladder of a phone ── */', false)}
    return { sxScrubTo, sxCarryTick, sxTop, hccSeamBand, SX_STRIP_TOP };`;
  const names = Object.keys(env).filter(k => k !== 'hccSeamBand');
  const api = new Function(...names, body)(...names.map(k => env[k]));
  env.hccSeamBand = api.hccSeamBand;
  const tick = () => { W.t += 100; if (W.goal != null) { const k = Math.log(W.goal / W.d); W.d *= Math.exp(Math.max(-0.35, Math.min(0.35, k))); }
    SX_STATE.N = viewN(); api.sxCarryTick(); W.log.push({ t: W.t, mode: state.mode, V: SX_STATE.N }); };
  SX_STATE.N = viewN();
  return { W, state, SX_STATE, api, tick, viewN, levelOf, HCC_GLY_M };
}
const rungAtGly = (M, g) => M.levelOf(2 * g * M.HCC_GLY_M * Math.tan(55 * Math.PI / 360));
const runs = seq => { const r = []; for (const m of seq) if (!r.length || r[r.length - 1] !== m) r.push(m); return r; };

/* ── 1. a drag out and a drag back ── */
{ const M = makeWorld(); const out = [];
  for (let N = 230; N <= 310; N += 0.4) { M.SX_STATE.drag = { strip: true, N }; M.api.sxScrubTo(N, false); M.tick(); M.tick(); out.push(M.state.mode); }
  const back = [];
  for (let N = 310; N >= 230; N -= 0.4) { M.SX_STATE.drag = { strip: true, N }; M.api.sxScrubTo(N, false); M.tick(); M.tick(); back.push(M.state.mode); }
  M.SX_STATE.drag = null;
  const up = M.W.hops.filter(h => h.from === 'solar' || (h.from === 'obs' && h.to === 's3')), dn = M.W.hops.filter(h => h.from === 's3' || (h.from === 'obs' && h.to === 'solar'));
  check(runs(out).join('→') === 'solar→obs→s3' && runs(back).join('→') === 's3→obs→solar' && M.W.hops.length === 4,
    'one drag runs the whole range and back: out of the Solar System into the Observable world and onto the S³ carrier, and back down the same way — four crossings, no world entered twice, no door',
    `out ${runs(out).join(' → ')} · back ${runs(back).join(' → ')} · crossings at rungs ${M.W.hops.map(h => `${h.from}→${h.to} ${h.at.toFixed(1)}`).join(', ')}`);
  const sUp = rungAtGly(M, SEAMS.solarObsOutGly), sDn = rungAtGly(M, SEAMS.obsSolarInGly), cUp = rungAtGly(M, SEAMS.obsS3OutGly), cDn = rungAtGly(M, SEAMS.s3ObsInGly);
  check(sDn < sUp && cDn < cUp && sUp - sDn > 0.4 && cUp - cDn > 0.2,
    'the crossings are decided at the seams themselves, and each seam is taken lower on the way down than on the way up — a hysteresis, so a finger resting on a seam stays in one world',
    `Solar ↔ Observable: up at ${sUp.toFixed(2)}, down at ${sDn.toFixed(2)} (${(sUp - sDn).toFixed(2)} rungs) · Observable ↔ carrier: up at ${cUp.toFixed(2)}, down at ${cDn.toFixed(2)} (${(cUp - cDn).toFixed(2)})`);
}
/* ── 2. a finger trembling on a seam ── */
{ const M = makeWorld(); const s = rungAtGly(M, SEAMS.solarObsOutGly);
  for (let N = 230; N <= s + 0.8; N += 0.4) { M.SX_STATE.drag = { strip: true, N }; M.api.sxScrubTo(N, false); M.tick(); M.tick(); }
  for (let i = 0; i < 20; i++) M.tick();
  const before = M.W.hops.length;
  for (let k = 0; k < 40; k++) { const N = s + (k % 2 ? 0.2 : -0.2); M.SX_STATE.drag = { strip: true, N }; M.api.sxScrubTo(N, false); M.tick(); }
  check(before === 1 && M.W.hops.length - before === 0 && M.state.mode === 'obs',
    'and a finger trembling ±0.2 rung on the Solar System\'s seam, forty times, does not flicker between the two worlds',
    `crossed once on the way up · ${M.W.hops.length - before} more crossings in forty trembles · world held: ${M.state.mode}`);
}
/* ── 3. a tap a world away, both ways: flown in legs, never over a world ── */
for (const [from, to, path] of [[230, 304, 'solar→obs→s3'], [304, 240, 's3→obs→solar']]) {
  const M = makeWorld();
  if (from > 300) { for (let N = 230; N <= 304; N += 0.4) { M.SX_STATE.drag = { strip: true, N }; M.api.sxScrubTo(N, false); M.tick(); M.tick(); } M.SX_STATE.drag = null; for (let i = 0; i < 60; i++) M.tick(); }
  const start = M.W.log.length; M.api.sxScrubTo(to, true);
  for (let i = 0; i < 3000 && !(Math.abs(M.SX_STATE.N - to) < 0.6 && !M.SX_STATE.carry); i++) M.tick();
  const L = M.W.log.slice(start); let jump = 0; for (let i = 1; i < L.length; i++) jump = Math.max(jump, Math.abs(L[i].V - L[i - 1].V));
  check(runs(L.map(x => x.mode)).join('→') === path && Math.abs(M.SX_STATE.N - to) < 0.6 && jump < 0.8,
    `a tap at rung ${to} from rung ${from} flies in legs — to the seam in the world in view, across, on through the next world — and arrives, never jumping a world`,
    `${runs(L.map(x => x.mode)).join(' → ')} in ${L.length} ticks · arrived at ${M.SX_STATE.N.toFixed(2)} · largest step between two ticks ${jump.toFixed(2)} rung`);
}
/* ── 4. the reader's switch ── */
{ const M = makeWorld(); M.state.scaleChain = false;
  for (let N = 230; N <= 285; N += 0.4) { M.SX_STATE.drag = { strip: true, N }; M.api.sxScrubTo(N, false); M.tick(); M.tick(); }
  M.SX_STATE.drag = null; const modeSolar = M.state.mode;
  M.state.mode = 'obs'; M.W.d = 0.5; for (let i = 0; i < 5; i++) M.tick();
  for (let N = 285; N >= 260; N -= 0.4) { M.SX_STATE.drag = { strip: true, N }; M.api.sxScrubTo(N, false); M.tick(); }
  check(M.W.hops.length === 0 && modeSolar === 'solar' && M.state.mode === 'obs' && M.SX_STATE.obsEdge && M.SX_STATE.obsEdge.side === 'below',
    'and with the scale chain switched off — the reader\'s own switch — the strip crosses nothing and offers the door at the edge, as it always did',
    `crossings ${M.W.hops.length} · Solar System held · in the Observable world the door ${M.SX_STATE.obsEdge ? 'offered ' + M.SX_STATE.obsEdge.side : 'NOT offered'}`);
}
/* ── 5. the strip itself ── */
{ const top = /const SX_STRIP_TOP=SX_NMAX\+12;/.test(SRC) && /const sxStripX=N=>Math\.max\(0,Math\.min\(1,N\/SX_STRIP_TOP\)\);/.test(SRC)
    && /Math\.min\(SX_STRIP_TOP,\(ev\.clientX-r\.left\)\/Math\.max\(1,r\.width\)\*SX_STRIP_TOP\)/.test(SRC) && /N=Math\.max\(0,Math\.min\(SX_STRIP_TOP,D\.N\+\(ev\.clientX-D\.lx\)\/W\(\)\*SX_STRIP_TOP\*g\)\)/.test(SRC)
    && /aria-valuemin="0" aria-valuemax="312"/.test(SRC);
  const reg = /#tssReg\{flex:0 0 112px;width:112px;/.test(SRC) && /if\(tr\)\{ const rn=TT\(g\[1\],g\[2\],g\[1\]\); hccTxt\(tr,rn\); hccTitle\(tr,rn\); \}/.test(SRC);
  const keys = /T\.onkeydown=ev=>\{ const d=\{ArrowLeft:-1,ArrowRight:1,ArrowDown:-1,ArrowUp:1,PageDown:-10,PageUp:10\}\[ev\.key\]; if\(d==null\) return; ev\.preventDefault\(\); step\(d\); \};/.test(SRC);
  const tickHook = /sxCarryTick\(\); \}/.test(SRC);
  check(top && reg && keys && tickHook,
    'and the strip runs to the top of the carrier (N 312) under the same finger, keeps its width when the regime\'s name changes, steps from the keyboard as ‹ and › do, and takes the next leg on the scale tick',
    `track 0–312 ${top ? 'everywhere it is read' : 'NOT consistent'} · regime label ${reg ? '112 px, full name as its title' : 'UNFIXED'} (it was 80 px in the Solar System and 41 in the Horizons, so the track was 449 and 488 px) · keys ${keys ? 'add to the goal' : 'restart from the view'} · legs ${tickHook ? 'on the scale tick' : 'NOT ticked'}`);
}
console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
