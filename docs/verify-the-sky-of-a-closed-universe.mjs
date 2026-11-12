/* THE SKY OF A CLOSED UNIVERSE (v4.423) — the three-sphere seen from inside. The laboratory's mathematics is one block of pure
   functions (SKY-MATH), lifted out of index.html and run here as it stands.
     1. the closed-form entry of a great circle into a geodesic ball agrees with marching along the ray;
     2. the law of apparent size, sin α = sin r / sin χ, found here by bisecting on hit / no hit — smallest at the equator;
     3. the antipode fills the sky, and a ball around the observer is met again from behind at 2π − r;
     4. parallel transport: the frame stays orthonormal and returns after one circuit;
     5. the horizon of a closed Friedmann universe, against an independent quadrature;
     6. the shader runs the same formula, and the laboratory reaches every registry and the browser-free instruments.
   NOT checked here: any pixel. The image is the formula of check 1 evaluated per fragment; this file checks the formula. */
import fs from 'node:fs'; import path from 'node:path';
const ROOT = path.join(path.dirname(new URL(import.meta.url).pathname), '..');
const src = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
let pass = 0, fail = 0;
const check = (ok, claim, nums) => { if (ok) pass++; else fail++; console.log(`${ok ? 'PASS' : 'FAIL'} — ${claim} :: ${nums}`); };
const i0 = src.indexOf('/* ═══ SKY-MATH-BEGIN ═══'), i1 = src.indexOf('/* ═══ SKY-MATH-END ═══', i0);
const names = ['ISKY_TAU', 'iskyDot', 'iskyUnit', 'iskyRay', 'iskyHit', 'iskyAngular', 'iskyPaths', 'iskyMove', 'iskyOrtho', 'iskyHorizon', 'iskyCurvatureFor', 'iskyRng', 'iskyPoints'];
const L = new Function(`${src.slice(i0, i1)}\nreturn {${names.join(',')}};`)();
const TAU = L.ISKY_TAU, R = L.iskyRng(423);
const tangentAt = o => { let d = L.iskyPoints(1, Math.floor(R() * 1e9))[0]; const p = L.iskyDot(d, o); return L.iskyUnit(d.map((x, i) => x - p * o[i])); };

{ let n = 0, hits = 0, worst = 0, wrong = 0;
  for (let k = 0; k < 4000; k++) { const o = L.iskyPoints(1, k + 1)[0], d = tangentAt(o), c = L.iskyPoints(1, 90000 + k)[0], r = 0.02 + 0.5 * R(), H = L.iskyHit(o, d, c, r);
    /* march: first t in (0, 2π) at which the ray goes from outside to inside */
    const N = 20000, cr = Math.cos(r); let prev = L.iskyDot(o, c) >= cr, tm = null;
    for (let j = 1; j <= N && tm === null; j++) { const t = TAU * j / N, inside = L.iskyDot(L.iskyRay(o, d, t), c) >= cr; if (inside && !prev) tm = t - TAU / (2 * N); prev = inside; }
    n++; if ((H === null) !== (tm === null)) { if (H && H.depth > 2e-3) wrong++; continue; } if (H) { hits++; worst = Math.max(worst, Math.abs(H.t - tm)); } }
  check(wrong === 0 && hits > 300 && worst < TAU / 20000, 'the closed form is the ray: for random observers, directions and balls on S³ the entry t₀ − arccos(cos r/ρ) (mod 2π) is where a ray marched in twenty thousand steps first passes from outside to inside, to within one step; rays that miss, miss in both',
    `${n} rays · ${hits} hits · worst difference ${worst.toExponential(2)} rad (step ${(TAU / 20000).toExponential(2)}) · disagreements ${wrong}`); }

{ const o = [1, 0, 0, 0], e = [0, 1, 0, 0], f = [0, 0, 1, 0], r = 0.12; let worst = 0, min = 9, at = 0; const rows = [];
  for (const chi of [0.3, 0.8, 1.2, Math.PI / 2, 1.9, 2.4, 2.9]) { const c = [Math.cos(chi), Math.sin(chi), 0, 0]; let lo = 0, hi = Math.PI / 2 * 0.999;
    for (let k = 0; k < 60; k++) { const a = (lo + hi) / 2, d = [0, Math.cos(a), Math.sin(a), 0]; if (L.iskyHit(o, d, c, r)) lo = a; else hi = a; }
    const law = L.iskyAngular(r, chi); worst = Math.max(worst, Math.abs(lo - law)); if (lo < min) { min = lo; at = chi; } rows.push(`${chi.toFixed(2)}→${(lo * 180 / Math.PI).toFixed(2)}°`); }
  check(worst < 1e-9 && Math.abs(at - Math.PI / 2) < 1e-9 && Math.abs(min - r) < 1e-9, 'the law of apparent size, found by bisection on hit or no hit: a ball of radius r at distance χ is seen under sin α = sin r / sin χ — it shrinks only as far as the equator, where α = r exactly, and grows again beyond it',
    `r = 0.12 rad: ${rows.join(' · ')} · worst against the law ${worst.toExponential(1)}`); }

{ const o = [1, 0, 0, 0], r = 0.16; let all = 0, n = 0, back = 0;
  const anti = [-Math.cos(0.1), -Math.sin(0.1), 0, 0];
  for (let k = 0; k < 2000; k++) { const d = tangentAt(o); n++; if (L.iskyHit(o, d, anti, r)) all++; const H = L.iskyHit(o, d, o, r); if (H && Math.abs(H.t - (TAU - r)) < 1e-9 && Math.abs(H.out - r) < 1e-9) back++; }
  const P = L.iskyPaths(1, 7), P2 = L.iskyPaths(1, 20);
  check(all === n && back === n && L.iskyAngular(r, Math.PI - 0.1) === Math.PI && P.length === 2 && Math.abs(P[1] - (TAU - 1)) < 1e-12 && P2.length === 7,
    'the antipode fills the sky and home is behind everything: a ball within its own radius of the antipode is entered by every one of two thousand random lines of sight; a ball around the observer is left at t = r and met again from behind at exactly 2π − r on every one; and light from a point at χ arrives by χ and by 2π − χ, then by each plus whole circuits',
    `${all}/${n} rays reach the antipodal ball · ${back}/${n} return to home at 2π − r · paths under η = 7: ${P.map(x => x.toFixed(3)).join(', ')} · under 20: ${P2.length}`); }

{ let F = [[1, 0, 0, 0], [0, 1, 0, 0], [0, 0, 1, 0], [0, 0, 0, 1]]; const N = 5000, h = [0.36, -0.48, 0.8]; let err = 0;
  for (let k = 0; k < N; k++) { const u = L.iskyUnit([0, 1, 2, 3].map(i => h[0] * F[1][i] + h[1] * F[2][i] + h[2] * F[3][i])); F = L.iskyMove(F, u, TAU / N); }
  for (let a = 0; a < 4; a++) for (let b = 0; b < 4; b++) err = Math.max(err, Math.abs(L.iskyDot(F[a], F[b]) - (a === b ? 1 : 0)));
  const home = Math.max(...F.map((v, a) => Math.max(...v.map((x, i) => Math.abs(x - (a === i ? 1 : 0)))))), G = L.iskyOrtho(F.map(v => v.map(x => x * 1.01 + 0.001)));
  let e2 = 0; for (let a = 0; a < 4; a++) for (let b = 0; b < 4; b++) e2 = Math.max(e2, Math.abs(L.iskyDot(G[a], G[b]) - (a === b ? 1 : 0)));
  check(err < 1e-11 && home < 1e-10 && e2 < 1e-12, 'the observer’s frame is carried, not guessed: moved in five thousand steps once round a great circle in a fixed direction of its own, the position and the three tangent vectors stay orthonormal and come back to where they began; a spoiled frame is restored by Gram–Schmidt',
    `orthonormality error ${err.toExponential(1)} · return error ${home.toExponential(1)} · after re-orthonormalising ${e2.toExponential(1)}`); }

{ const Om = 0.315, h = 0.674, Or = 4.18e-5 / (h * h);
  const indep = k => { const Ok = -k, OL = 1 - Om - Or - Ok; let S = 0; const N = 400000, zmax = 1e7; /* ∫ dz / E(z) in x = ln(1 + z), midpoint */
    const X = Math.log(1 + zmax); for (let i = 0; i < N; i++) { const x = (i + 0.5) * X / N, q = Math.exp(x); S += q / Math.sqrt(Or * q ** 4 + Om * q ** 3 + Ok * q * q + OL); } return Math.sqrt(k) * S * X / N; };
  const H = L.iskyHorizon(0.001, Om, h), I = indep(0.001), k1 = L.iskyCurvatureFor(Math.PI, Om, h), k2 = L.iskyCurvatureFor(TAU, Om, h);
  const mono = [1e-4, 1e-3, 1e-2, 0.1, 0.5].map(k => L.iskyHorizon(k, Om, h)).every((v, i, a) => !i || v > a[i - 1]);
  check(Math.abs(H - I) < 2e-4 && Math.abs(H - 0.1006) < 2e-4 && mono && Math.abs(L.iskyHorizon(k1, Om, h) - Math.PI) < 1e-9 && k1 > 0.6 && k1 < 0.67 && k2 > 0.98 && k2 < 1.06,
    'how far round its own sphere a closed Friedmann universe sees: χ = √|Ω_K| ∫da/(a²E) with Ω_m = 0.315, h = 0.674 gives 0.1006 rad at |Ω_K| = 0.001 — 3.2 % of the way to the antipode — agreeing with an independent midpoint quadrature in ln(1 + z); it grows with the curvature, and reaches the antipode only near |Ω_K| = 0.63 and a full circuit near 1.02',
    `χ(0.001) = ${H.toFixed(5)} (independent ${I.toFixed(5)}) · ${(100 * H / Math.PI).toFixed(2)} % of π · antipode at |Ω_K| = ${k1.toFixed(3)} · own back at ${k2.toFixed(3)}`); }

{ const need = ["{id:'s3sky', category:'geom'", "  s3sky:{\n    native_space:", "id:'s3sky', world:'s3', lab:'s3sky'", "['s3sky','gmode','exact'", "v==='s3sky'?[0.0,0.0,6.0]:", "iskyGroup.visible = (v==='s3sky');", "s3sky:{speed:['iskySpeed',1]",
    "else if(V==='s3sky') body = iskyPanelHTML();", "if(V==='s3sky'){ iskyBind(ctl); }", "updateIsky(labDt);", "['iskyAtlas','s3sky',iskyGroup,", "  s3sky:'трёхсфера изнутри", "  s3sky:'die Drei-Sphäre von innen", "goLab('s3','s3sky')", "{id:'iskyInside423', kind:'found'", 'globalThis.HCC_INSIDE=Object.freeze({',
    'float dl=acos(min(1.0,cr/rho)), t=mod(atan(B,A)-dl,TAU);', 'vec4 d=normalize(v.x*uE1+v.y*uE2+v.z*uE3);', 'vec4 p=cos(best)*uO+sin(best)*d;'];
  const miss = need.filter(s => !src.includes(s));
  const M = await import(path.join(ROOT, 'core/atlas/instruments.mjs')), out = M.INSTRUMENTS.s3sky ? M.INSTRUMENTS.s3sky({ sky_distance: 2.6, sky_body_radius: 0.12, sky_light_age: 6.6, sky_curvature: 0.001 }) : {};
  const ok = !miss.length && Math.abs(out.sky_seen_radius - Math.asin(Math.sin(0.12) / Math.sin(2.6)) * 180 / Math.PI) < 1e-12 && out.sky_seen_radius > 5 * out.sky_flat_radius && out.sky_image_count === 2 && Math.abs(out.sky_horizon_angle - 0.1006) < 2e-4;
  check(ok, 'the picture is the formula, and the laboratory is in every registry: the fragment shader computes the same entry t = atan(B, A) − acos(cos r/ρ) (mod 2π) on the direction v·(e₁, e₂, e₃) that check 1 tests; the declaration, the native contract, the instrument, five typed relations, the dispatch, the panel, the catalogue in four languages, the journey, the ledger and the agent handle are in the page — and the instrument runs with no browser: at χ = 2.6 a ball of 0.12 rad is seen five times larger than flat space would show it',
    `seen ${out.sky_seen_radius?.toFixed(2)}° against flat ${out.sky_flat_radius?.toFixed(2)}° · light paths ${out.sky_image_count} · horizon ${out.sky_horizon_angle?.toFixed(4)} rad${miss.length ? ' · missing ' + miss.join(' | ') : ''}`); }

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
