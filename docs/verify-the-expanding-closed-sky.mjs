/* THE EXPANDING CLOSED UNIVERSE, FROM INSIDE (v4.424) — the sky laboratory of v4.423 drew a static three-sphere and said so: «no
   expansion here, no redshift». This release gives it a cosmic clock. In a closed Friedmann universe the light that reaches the
   observer from path length t left at conformal time η − t, so per pixel: a body's angular radius on the comoving sphere was then
   R / x(η − t), its colour and brightness are those of a black body at T / (1 + z), and behind every body is the last-scattering
   surface. Run here, on the SKY-MATH block lifted out of index.html as it stands:
     1. two codes, one number: today's conformal age from the new Friedmann table equals the horizon of v4.423, for every curvature;
     2. the closed dust universe: the general integrator lands on the exact cycloid x = (1 − cos η)/2 — light from the big bang
        reaches the antipode at the largest expansion and comes home at the crunch — and t = (η − sin η)/2 solves Friedmann;
     3. fates: our numbers barely closed expand forever, and light sent today ever gets only 0.036 rad further; Ω_m 0.3, Ω_Λ 1.3
        sees round; Ω_m 2, Ω_Λ 0.02 recollapses; an open model and a bounce are refused;
     4. where a ray enters a body whose comoving radius grows into the past — against marching, in three universes;
     5. redshift, and blueshift in the collapse;
     6. black bodies: the CIE chromaticity of illuminant A and of the Planckian locus; Tolman's (1 + z)⁻⁴ as Stefan–Boltzmann;
     7. the shader runs the same mathematics, and the panel's chips answer (in v4.423 four of them did not);
     8. the first view: the observer begins clear of every body, home in sight, the frame unmirrored. */
import fs from 'node:fs'; import path from 'node:path';
const ROOT = path.join(path.dirname(new URL(import.meta.url).pathname), '..');
const src = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
let pass = 0, fail = 0;
const check = (ok, claim, nums) => { if (ok) pass++; else fail++; console.log(`${ok ? 'PASS' : 'FAIL'} — ${claim} :: ${nums}`); };
const i0 = src.indexOf('/* ═══ SKY-MATH-BEGIN ═══'), i1 = src.indexOf('/* ═══ SKY-MATH-END ═══', i0);
if (i0 < 0 || i1 < i0) { console.log('FAIL — the SKY-MATH block is missing'); process.exit(1); }
const names = ['ISKY_TAU', 'iskyDot', 'iskyUnit', 'iskyRay', 'iskyMove', 'iskyOrtho', 'iskyPoints', 'iskyRng', 'iskyHorizon', 'iskyModel', 'iskyDust', 'iskyDustTime', 'iskyX', 'iskyP',
  'iskyHitExp', 'iskyXYZ', 'iskyBlackbody', 'iskyLogLum', 'iskyBlackbodyTable', 'iskyReach', 'iskyFlatAngle', 'iskyStartFrame', 'iskyDet4', 'ISKY_TABLE'];
const L = new Function(`${src.slice(i0, i1)}\nreturn {${names.join(',')}};`)();
const TAU = L.ISKY_TAU, Or = h => 4.18e-5 / (h * h);
/* 1 */
{ const rows = [0.001, 0.01, 0.1, 0.6].map(k => { const M = L.iskyModel(0.315, 1 - 0.315 - Or(0.674) + k, 0.674); return [k, M.eta0, L.iskyHorizon(k, 0.315, 0.674), M]; });
  check(rows.every(([, a, b, M]) => M.ok && Math.abs(a - b) < 1e-5 * Math.max(1, b) && Math.abs(L.iskyX(M, a) - 1) < 1e-4),
    'two codes, one number: the conformal age read off the new Friedmann table — the table the shader interpolates — equals the horizon of v4.423, χ = √|Ω_K| ∫ da/(a²E), at every curvature tried, and the table puts x = 1 there',
    rows.map(([k, a, b]) => `|Ω_K| ${k}: ${a.toFixed(6)} / ${b.toFixed(6)}`).join(' · ')); }
/* 2 */
{ const G = L.iskyModel(2, 0, 0), D = L.iskyDust(); let wG = 0, wD = 0;
  for (let k = 0; k <= 400; k++) { const e = TAU * k / 400; wG = Math.max(wG, Math.abs(L.iskyX(G, e * G.etaEnd / TAU) / 2 - (1 - Math.cos(e * G.etaEnd / TAU)) / 2)); }
  for (let k = 0; k <= L.ISKY_TABLE; k++) { const e = TAU * k / L.ISKY_TABLE; wD = Math.max(wD, Math.abs(D.table[k] - (1 - Math.cos(e)) / 2)); }
  /* Friedmann for closed dust, x = a/a_max and t in units of a_max/c: (dx/dt)² = 1/x − 1 */
  let wF = 0; for (const e of [0.4, 1.0, 2.0, 2.8, 3.5, 4.6, 5.5]) { const h = 1e-5, x = (1 - Math.cos(e)) / 2, dx = ((1 - Math.cos(e + h)) - (1 - Math.cos(e - h))) / 4 / h, dt = (L.iskyDustTime(e + h) - L.iskyDustTime(e - h)) / (2 * h); wF = Math.max(wF, Math.abs((dx / dt) ** 2 - (1 / x - 1))); }
  check(G.ok && G.fate === 'recollapse' && Math.abs(G.etaMax - Math.PI) < 1e-4 && Math.abs(G.xMax - 2) < 1e-9 && wG < 2e-4 && wD < 1e-15 && wF < 1e-5 && D.etaEnd === TAU && D.etaMax === Math.PI,
    'the closed dust universe: the general Friedmann integrator, given Ω_m = 2 and no Λ, lands on the cycloid x = (1 − cos η)·Ω_m/2(Ω_m − 1) — its largest expansion at η = π, x_max = Ω_m/(Ω_m − 1), its crunch at 2π: light from the big bang reaches the antipode exactly as the expansion stops and comes home at the crunch — and t = (η − sin η)/2 solves (dx/dt)² = 1/x − 1',
    `η_max ${G.etaMax.toFixed(6)} (π ${Math.PI.toFixed(6)}) · x_max ${G.xMax.toFixed(9)} · worst against the cycloid ${wG.toExponential(1)} · the closed-form table ${wD.toExponential(1)} · Friedmann ${wF.toExponential(1)}`); }
/* 3 */
{ const ours = L.iskyReach(0.001), R = L.iskyModel(0.3, 1.3, 0.674), C = L.iskyModel(2, 0.02, 0.674), open = L.iskyModel(0.3, 0.6, 0.674), bounce = L.iskyModel(0.1, 2.5, 0.674);
  const lsR = R.etaOf(1 / 1091);
  check(Math.abs(ours.today - 0.1006) < 2e-4 && Math.abs(ours.future - 0.0363) < 2e-4 && Math.abs(ours.ever - 0.1369) < 2e-4
    && R.ok && R.fate === 'expands forever' && R.eta0 < Math.PI && R.etaEnd - lsR > Math.PI && C.ok && C.fate === 'recollapse' && Number.isFinite(C.xMax) && C.xMax > 1 && open.why === 'open' && bounce.why === 'bounce',
    'fates: with our numbers and |Ω_K| = 0.001 the universe expands forever and Λ makes the future finite — light sent today ever gets only 0.036 rad further, 1.2 % of the way to the antipode, and light from the beginning 0.137 rad in all; Ω_m 0.3, Ω_Λ 1.3 is just short of seeing the antipode today and will see it; Ω_m 2, Ω_Λ 0.02 stops and recollapses; an open universe and one that bounced instead of beginning are refused',
    `ours: today ${ours.today.toFixed(4)} · future ${ours.future.toFixed(4)} · ever ${ours.ever.toFixed(4)} · Ω_m 0.3/Ω_Λ 1.3: η₀ ${R.eta0.toFixed(3)}, end ${R.etaEnd.toFixed(3)} · Ω_m 2/Ω_Λ 0.02: x_max ${C.xMax.toFixed(3)} · ${open.why}, ${bounce.why}`); }
/* 4 */
{ const R = L.iskyRng(424), tangentAt = o => { const d = L.iskyPoints(1, Math.floor(R() * 1e9))[0], p = L.iskyDot(d, o); return L.iskyUnit(d.map((x, i) => x - p * o[i])); };
  const runs = [['Λ 0.3/1.3, η 3.0', L.iskyModel(0.3, 1.3, 0.674), 3.0], ['dust, η 4.2 (collapsing)', L.iskyDust(), 4.2], ['dust, η 1.6', L.iskyDust(), 1.6]].map(([name, M, eta]) => {
    let hits = 0, bad = 0, worst = 0; const N = 20000, T = Math.min(TAU * 0.999, eta);
    for (let k = 0; k < 2000; k++) { const o = L.iskyPoints(1, Math.floor(R() * 1e9))[0], d = tangentAt(o), c = L.iskyPoints(1, Math.floor(R() * 1e9))[0], Rb = 0.03 + 0.12 * R(), xf = 0.15, etaF = M.etaOf(xf);
      const h = L.iskyHitExp(o, d, c, Rb, M, eta, xf, etaF), psi = t => Math.min(Math.PI, Rb / Math.max(xf, L.iskyX(M, eta - t)));
      const startIn = L.iskyDot(o, c) >= Math.cos(psi(0)); let tm = null, prev = startIn;
      if (!startIn) for (let i = 1; i <= N; i++) { const t = T * i / N; if (eta - t <= etaF) break; const inside = L.iskyDot(L.iskyRay(o, d, t), c) >= Math.cos(psi(t)); if (inside && !prev) { tm = t; break; } prev = inside; }
      if (h && tm != null) { hits++; worst = Math.max(worst, Math.abs(h.t - tm)); if (Math.abs(h.t - tm) > 2 * T / N + 1e-6) bad++; } else if ((h == null) !== (tm == null)) bad++; }
    return { name, hits, bad, worst, step: T / N }; });
  check(runs.every(r => r.bad === 0 && r.hits > 80 && r.worst <= 2 * r.step + 1e-6),
    'where a ray enters a body whose angular radius on the comoving sphere was R/x(η − t) when the light left — larger the further back, at up to half the speed of light — the least t with ρ cos(t − t₀) ≥ cos(R/x(η − t)) found on both passes and bisected agrees with marching along the ray in twenty thousand steps; rays that miss, miss in both; a body growing into the past that catches the ray twice is entered at the first',
    runs.map(r => `${r.name}: ${r.hits} hits, worst ${r.worst.toExponential(1)} (step ${r.step.toExponential(1)}), ${r.bad} disagreements`).join(' · ')); }
/* 5 */
{ const D = L.iskyDust(), z = (e, eE) => L.iskyX(D, e) / L.iskyX(D, eE) - 1, zb = z(5.0, 2.0), z0 = z(TAU - 1.5, 1.5), zr = z(3.0, 1.0);
  const exact = (1 - Math.cos(5)) / (1 - Math.cos(2)) - 1;
  check(zb < -0.4 && Math.abs(zb - exact) < 2e-3 && Math.abs(z0) < 3e-3 && zr > 1,
    'redshift is the ratio of the scale factors, 1 + z = x(η)/x(η − t): light that left during the expansion and arrives in the collapse is blueshifted, and at the mirror-image moment it arrives at the colour it left',
    `left at η 2.0, seen at 5.0: z = ${zb.toFixed(4)} (exact ${exact.toFixed(4)}) · left at 1.5, seen at 2π − 1.5: z = ${z0.toExponential(1)} · left at 1.0, seen at 3.0: z = ${zr.toFixed(3)}`); }
/* 6 */
{ const xy = T => { const [X, Y, Z] = L.iskyXYZ(T); return [X / (X + Y + Z), Y / (X + Y + Z)]; }, A = xy(2856), P = xy(6504);
  /* Stefan–Boltzmann: ∫ B_λ(T/(1+z)) dλ = (1 + z)⁻⁴ ∫ B_λ(T) dλ — Tolman's law for a black body */
  const bol = T => { let S = 0; for (let l = 50; l < 2e6; l *= 1.002) { const m = l * 1e-9, B = 1 / (Math.pow(m, 5) * (Math.exp(0.014387769 / (m * T)) - 1)); S += B * m * (1.002 - 1); } return S; };
  const tol = [0.5, 1, 3].map(z => bol(5772 / (1 + z)) / bol(5772) * (1 + z) ** 4);
  const lum = [0, 0.5, 1, 2, 4].map(z => L.iskyLogLum(5772 / (1 + z)));
  check(Math.hypot(A[0] - 0.44757, A[1] - 0.40745) < 0.002 && Math.hypot(P[0] - 0.3135, P[1] - 0.3236) < 0.0015 && tol.every(r => Math.abs(r - 1) < 2e-5)
    && Math.abs(lum[0]) < 1e-12 && lum.every((v, i) => !i || v < lum[i - 1]) && lum[4] < -4 * Math.log10(5),
    'black bodies: Planck’s law against the CIE 1931 observer gives illuminant A’s chromaticity at 2856 K and the Planckian locus at 6504 K; a black body seen with redshift z is exactly one at T/(1 + z), and its whole emission falls as (1 + z)⁻⁴ — Tolman’s law is Stefan–Boltzmann — while its visible brightness falls faster still as the peak leaves the visible band',
    `2856 K xy ${A.map(v => v.toFixed(4)).join(', ')} (A 0.4476, 0.4074) · 6504 K ${P.map(v => v.toFixed(4)).join(', ')} · (1 + z)⁴ × bolometric ratio ${tol.map(r => r.toFixed(6)).join(', ')} · log₁₀ visible luminance at z = 0, 0.5, 1, 2, 4: ${lum.map(v => v.toFixed(2)).join(', ')}`); }
/* 7 */
{ const need = ["float fIn(float rho,float t0,float R,float t){ return rho*cos(t-t0)-cos(min(PI,R/max(uXf,xAt(uNow-t)))); }", 'for(int w=0;w<2;w++){ float ctr=t0+float(w)*TAU',
    'return mix(texelFetch(uSky,ivec2(k,0),0).r,texelFetch(uSky,ivec2(k+1,0),0).r,w);', 'Tobs=bodyT(bi)*xe/uXNow', 'float Tls=${ISKY_TLS}.0*uXLS/uXNow',
    'for(let k=0;k<=ISKY_TABLE;k++) a[k*4]=M.table[k]', "chip('iskyact','pause'", "R.querySelectorAll('[data-iskyact]')", "R.querySelectorAll('[data-iskymodel]')", "R.querySelectorAll('[data-iskycosmo]')",
    'cosmos:()=>{', 'traceExpanding:v=>{', 'float dl=acos(min(1.0,cr/rho)), t=mod(atan(B,A)-dl,TAU);'];
  const miss = need.filter(s => !src.includes(s)), stale = (src.match(/chip\('skyact'/g) || []).length, bodyT = (() => { const m = src.match(/float bodyT\(int i\)\{ return i==0\?\$\{ISKY_THOME\}\.0:3200\.0\*exp2\(fract\(float\(i\)\*0\.6180339887498949\)\*([0-9.]+)\); \}/); return !!m && Math.abs(+m[1] - Math.log2(7.8125)) < 1e-15 && /function iskyTemp\(i\)\{ return i===0\?ISKY_THOME:3200\*Math\.pow\(7\.8125,\(i\*0\.6180339887498949\)%1\); \}/.test(src); })();
  check(!miss.length && !stale && bodyT,
    'the shader runs the same mathematics: the same inside-test f(t), both passes, the same linear reading of x(η) from the table the page computes, T/(1 + z) and the fireball’s 3000 K × x_LS/x; the static sky of v4.423 is untouched; and the panel’s chips answer — v4.423 wrote four of them as data-skyact and listened for data-iskyact, so hover, steer, home and antipode did nothing',
    `${need.length - miss.length}/${need.length} present · stale chip names ${stale} · body temperatures shared ${bodyT}${miss.length ? ' · MISSING ' + miss.join(' | ') : ''}`); }
/* 8 */
{ const P = L.iskyPoints(63, 20261112), Rg = L.iskyRng(7), B = [{ c: [1, 0, 0, 0], r: 0.16 }]; for (let i = 0; i < P.length; i++) B.push({ c: P[i], r: i < 22 ? 0.07 + 0.09 * Rg() : 0.012 + 0.02 * Rg() });
  const S = L.iskyStartFrame(B, [1, 0, 0, 0]), F = S.F, o = F[0], toHome = Math.acos(Math.max(-1, Math.min(1, L.iskyDot(o, [1, 0, 0, 0])))), back = L.iskyUnit([1, 0, 0, 0].map((x, i) => x - L.iskyDot([1, 0, 0, 0], o) * o[i]));
  let ortho = 0; for (let a = 0; a < 4; a++) for (let b = 0; b < 4; b++) ortho = Math.max(ortho, Math.abs(L.iskyDot(F[a], F[b]) - (a === b ? 1 : 0)));
  const v423 = L.iskyOrtho(L.iskyMove([[1, 0, 0, 0], [0, 1, 0, 0], [0, 0, 1, 0], [0, 0, 0, 1]], [0, 0, 0, 1], 1.1)); let c423 = 9; for (let i = 1; i < B.length; i++) c423 = Math.min(c423, Math.acos(Math.max(-1, Math.min(1, L.iskyDot(v423[0], B[i].c)))) - B[i].r);
  check(S.clear > 0.25 && S.flight > 0.05 && Math.abs(toHome - 1.1) < 1e-9 && L.iskyDot(F[3], back) < -0.999999 && ortho < 1e-12 && L.iskyDet4(F) > 0 && c423 < 0.13,
    'the first view: the observer begins 1.1 rad from home, looking back at it, on the line out of home that keeps clearest of every body even at the largest body size, and drifts along the clearest direction — v4.423 began 0.12 rad from the surface of a large body, which filled a phone’s narrow view; the frame is orthonormal and has the handedness of v4.423, so the sky is not mirrored',
    `clearance ${S.clear.toFixed(3)} rad at 2.5× size (v4.423: ${c423.toFixed(3)} at 1×) · along the first two radians of flight ${S.flight.toFixed(3)} · from home ${toHome.toFixed(6)} · orthonormal to ${ortho.toExponential(1)} · det ${L.iskyDet4(F).toFixed(6)}`); }
console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
