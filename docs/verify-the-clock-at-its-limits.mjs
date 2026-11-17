/* THE CLOCK AT ITS LIMITS (v4.432) — the time machine flat out, and how precisely the cosmic clock is read.
     1. the clock's tables against an independent integration of the Friedmann equation: the age at a scale factor, the
        particle horizon, and both inverses, from the radiation era to the far future;
     2. the light cone reproduces the Sandage–Loeb drift dz/dt₀ = (1 + z)H₀ − H(z), over ten thousand years;
     3. the quasars on the clock's light cone: today unchanged, beyond the particle horizon invisible, redshift and flux laws;
     4. measured in a headless browser from t = 0 to t₀ + 100 Gyr (docs/data/clock-limits-v4.432.json): no non-finite value in
        the scene, and how many quasars the clock's observer sees;
     5. the changes are in the page.
   NOT checked: the activity of any real quasar at any other time — that is a stated model, not data. */
import fs from 'node:fs'; import path from 'node:path';
const ROOT = path.join(path.dirname(new URL(import.meta.url).pathname), '..');
const src = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
let pass = 0, fail = 0;
const check = (ok, claim, nums) => { if (ok) pass++; else fail++; console.log(`${ok ? 'PASS' : 'FAIL'} — ${claim} :: ${nums}`); };
const grab = (a, b) => { const i = src.indexOf(a), j = src.indexOf(b, i); if (i < 0 || j < 0) throw new Error('not found: ' + a); return src.slice(i, j); };
const S3R = grab('const HCC_S3R=Object.freeze({', "\n});") + '\n});';
const COSMO = grab('const CT_COSMO=(()=>{', '\nconst ctE=');
const HZ = grab('let HZ_TAB=null;', 'function hzScreenAt(');
const QSO = grab('const QSO_CLOCK={', 'globalThis.HCC_QSO_CLOCK=');
const L = new Function('state', `${S3R}\n${COSMO}\n${HZ}\n${QSO}\nreturn {CT_COSMO,hzTable,hzAgeAtA,hzAtT,hzTimeAtParticle,hzEmissionTime,qsoSeen,qsoChiClock};`)({ epochDays: 0 });
const C = L.CT_COSMO, E = a => Math.sqrt(C.Or / a ** 4 + C.Om / a ** 3 + C.OL);
/* independent: Gauss–Legendre, 20 nodes per panel, 4000 panels in ln a, from the analytic radiation era at a = e⁻⁴⁰ */
const GL = (() => { const n = 20, x = [], w = []; for (let i = 0; i < n; i++) { let z = Math.cos(Math.PI * (i + 0.75) / (n + 0.5)), pp = 0; for (let it = 0; it < 100; it++) { let p1 = 1, p2 = 0; for (let j = 1; j <= n; j++) { const p3 = p2; p2 = p1; p1 = ((2 * j - 1) * z * p2 - (j - 1) * p3) / j; } pp = n * (z * p1 - p2) / (z * z - 1); const z1 = z; z = z1 - p1 / pp; if (Math.abs(z - z1) < 1e-16) break; } x.push(z); w.push(2 / ((1 - z * z) * pp * pp)); } return { x, w }; })();
const integ = (f, x0, x1, panels) => { const h = (x1 - x0) / panels; let s = 0; for (let p = 0; p < panels; p++) { const a = x0 + p * h; for (let i = 0; i < 20; i++) s += 0.5 * h * GL.w[i] * f(a + 0.5 * h * (GL.x[i] + 1)); } return s; };
const xs = -40, a0 = Math.exp(xs), tStart = C.tH * a0 * a0 / (2 * Math.sqrt(C.Or)), pStart = C.cH * a0 / Math.sqrt(C.Or);
const tRef = x => tStart + integ(u => C.tH / E(Math.exp(u)), xs, x, 4000), pRef = x => pStart + integ(u => C.cH / (Math.exp(u) * E(Math.exp(u))), xs, x, 4000);

{ let wT = 0, wInvT = 0, wP = 0, wInvP = 0; const rows = [];
  for (const x of [-20, -12.3, -7.0001, -3.3, -1.234567, -0.5, -0.1, 0, 0.0007, 0.3, 1.7, 4.2]) { const tr = tRef(x), pr = pRef(x);
    wT = Math.max(wT, Math.abs(L.hzAgeAtA(Math.exp(x)) - tr) / tr); const h = L.hzAtT(tr); wInvT = Math.max(wInvT, Math.abs(h.lnA - x) / Math.max(1, Math.abs(x)));
    wP = Math.max(wP, Math.abs(h.particle - pr) / pr); wInvP = Math.max(wInvP, Math.abs(L.hzTimeAtParticle(pr) - tr) / tr); if (x === 0) rows.push(`t₀ = ${tr.toFixed(9)} Gyr, χ_p(t₀) = ${pr.toFixed(9)} Gly`); }
  check(wT < 1e-11 && wInvT < 1e-11 && wP < 1e-11 && wInvP < 1e-11, 'the cosmic clock against an independent integration of the Friedmann equation (radiation, matter, Λ; 20-point Gauss–Legendre on 4000 panels from a = e⁻⁴⁰): the age at a given scale factor, the scale factor at a given age, the particle horizon at a given age, and the age at a given horizon, from a = 2·10⁻⁹ to a = 67, all agree to better than 10⁻¹¹ — the tables are read as cubics with their exact slopes',
    `age ${wT.toExponential(1)} · ln a from age ${wInvT.toExponential(1)} · horizon ${wP.toExponential(1)} · age from horizon ${wInvP.toExponential(1)} · ${rows.join('')}`); }

{ const t0 = L.hzAgeAtA(1), d = 1e-5; let worst = 0; const rows = [];
  for (const z of [0.5, 1, 2, 3, 4.5]) { const chi = L.qsoChiClock(z), zAt = dt => { const S = L.qsoSeen(z, dt * 1e9, 0.1); return S.zObs; };
    const num = (zAt(d) - zAt(-d)) / (2 * d), H0 = 1 / C.tH, Hz = E(1 / (1 + z)) / C.tH, ana = (1 + z) * H0 - Hz; worst = Math.max(worst, Math.abs(num - ana) / Math.abs(ana)); rows.push(`z=${z}: ${(ana * 1e9 / 1e9).toExponential(4)}/Gyr`); }
  check(worst < 1e-6, 'the light cone moves as it should: for a source at fixed comoving distance, the redshift the clock’s observer sees changes at the Sandage–Loeb rate dz/dt₀ = (1 + z)H₀ − H(z) — positive below z ≈ 2, negative beyond — measured here by moving the clock ten thousand years either way',
    `worst relative difference ${worst.toExponential(2)} · ${rows.join(' · ')}`); }

{ const today = [0.3, 1, 2.5, 4.4].every(z => { const S = L.qsoSeen(z, 0, 0.1); return S.visible && Math.abs(S.zObs - z) < 1e-9 && Math.abs(S.flux - 1) < 1e-9 && Math.abs(S.active - 1) < 1e-12; });
  const early = L.qsoSeen(2, -13e9, 0.1), earlyNear = L.qsoSeen(0.1, -13e9, 0.1), pre = L.qsoSeen(1, -14e9, 0.1), fut = L.qsoSeen(2, 10e9, 0.1), futLong = L.qsoSeen(2, 10e9, 100);
  const ok = today && !early.visible && earlyNear.visible && earlyNear.zObs > 0.1 && earlyNear.zObs < 0.3 && !pre.visible && fut.visible && fut.zObs > 2 && fut.tE > fut.tE0 && fut.active < 1e-6 && futLong.active > 0.9 && fut.flux < 1;
  check(ok, 'each quasar is seen as the clock’s light cone finds it: today exactly as catalogued; 707 million years after the Big Bang a quasar now seen at z = 2 lies beyond that observer’s whole particle horizon and is not drawn, while one now at z = 0.1 is — seen by that observer at z ≈ 0.18, because the young universe expanded faster while its light crossed; before t = 0 nothing; ten billion years on, the z = 2 quasar is seen later in its life, redder and fainter — and whether it still shines there is the stated assumption of how long quasars shine, not data',
    `t = 707 Myr: z=2 ${early.visible ? 'visible' : 'invisible (' + early.why + ')'}, z=0.1 seen at z = ${earlyNear.zObs?.toFixed(4)} · t₀ + 10 Gyr: z=2 seen at z = ${fut.zObs.toFixed(3)}, t_e ${fut.tE0.toFixed(3)} → ${fut.tE.toFixed(3)} Gyr, flux × ${fut.flux.toPrecision(3)}, shining ${fut.active.toExponential(1)} (τ = 10⁸ yr) or ${futLong.active.toFixed(3)} (τ = 10¹¹ yr)`); }

{ const A = JSON.parse(fs.readFileSync(path.join(ROOT, 'docs/data/clock-limits-v4.432.json'), 'utf8')), R = A.rows, at = y => R.find(r => r.yrs === y);
  const ok = R.length >= 8 && R.every(r => r.bad.length === 0 && r.errors === 0) && at(0).qso.seen === 5959 && at(-13e9).qso.seen < at(0).qso.seen && at(-1.37e10).qso.seen < 500 && at(-14e9).qso.seen === 0 && at(1e10).qso.seen === 5959 && at(1e10).qso.active < 100;
  check(ok, 'measured in a headless browser with the quasar sphere on, the clock set from before t = 0 to t₀ + 100 Gyr: no non-finite value in any visible object of the scene; today all 5 959 quasars are seen; 707 million years after the Big Bang a sixth of them lie beyond that observer’s horizon, seven million years after it all but a few hundred; before t = 0 none; and ten billion years on all are still in view but almost none still shining',
    R.map(r => `${r.yrs.toExponential(1)} yr: seen ${r.qso.seen}, shining ${r.qso.active}`).join(' · ')); }

{ const need = ['function hzHerm(Y,D,H,i,x){', 'function hzHermInv(Y,D,H,i,y){', 'return hzHerm(T,H.DT,H,lo,x); }', "x=hzHermInv(T,H.DT,H,lo,tGyr); p=hzHerm(P,H.DP,H,lo,x);", 'function qsoSeen(z,dtYears,lifeGyr){', 'qso3dBuild(); qsoClockSync();', '<input type="range" id="skyQsoLife"', 'globalThis.HCC_QSO_CLOCK=Object.freeze({', "' · J2000 + '+sxLight(", "{id:'qsoClock432', kind:'revises'"];
  const miss = need.filter(s => !src.includes(s));
  check(!miss.length, 'the changes are in the page: the clock’s tables read as cubics with Newton inverses, the quasars synchronised with the clock each frame they are shown, their assumed lifetime a control and an agent handle, each quasar’s card saying when its light left at the clock’s moment, and far-future dates written in cosmic time',
    miss.length ? 'missing ' + miss.map(x => x.slice(0, 40)).join(' | ') : `${need.length} source pins present`); }

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
