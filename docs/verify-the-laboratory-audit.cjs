#!/usr/bin/env node
'use strict';
/* ══ WHAT THE LABORATORY AUDIT FOUND, AND WHAT WAS DONE ═════════════════════════════════
 * Five laboratories were read line by line and run point by point (kdv, nuc, earth,
 * localflow, spectrum), each claim to be re-measured before anything was changed. This file
 * re-measures the repaired defects on the extracted kernels, with references written HERE:
 *   1. kdv — the integrating-factor RK4 returned NaN or an energy of the wrong sign in part
 *      of its declared domain; those steps are now refused. The raw kernel still blows up
 *      where the refusal sits (so the refusal is not decoration), stays stable inside it,
 *      and halving the step cuts the I3 drift by about thirty, as the corrected doc says
 *   2. nuc — the liquid-drop formula's summit is iron-58 with nickel-62 1.6 keV behind,
 *      while the measured masses put nickel-62 first: the relation no longer says the two
 *      agree; iron-56 is no longer called a fusion fuel; the deuteron's unbound liquid drop
 *      is said, and the residual numbers in the limit text are recomputed here from AME2020
 *   3. earth — the legacy linear engine is refused beyond ±1000 years, and the pole arc is
 *      atan2(|a×b|, a·b): acos of a dot product returns exactly 0 a fraction of a day away
 *   4. localflow — evaluate() now returns all seven declared outputs, not four
 *   5. spectrum — the lowest level and the gap are taken over j ≤ 2 whatever j_max is (at
 *      j_max = ½ the lowest was wrong on most of the β-plane), and the level list no longer
 *      changes with α, which is an exact overall factor
 */
const fs = require('node:fs'), path = require('node:path');
const SRC = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
let pass = 0, fail = 0;
const ok = (n, c, d) => { if (c) { pass++; console.log('  PASS — ' + n + (d ? ' :: ' + d : '')); } else { fail++; console.log('  FAIL — ' + n + (d ? ' :: ' + d : '')); } };

(async () => {
  const K = await import(path.join(__dirname, '..', 'core', 'atlas', 'extracted.mjs'));

  /* 1 · kdv */
  { const run = (c1, c2, T, dt) => { const u0 = K.kdvTwoSoliton(c1, c2, -20, -8), a = K.kdvInvariants(u0), u = K.kdvEvolve(u0, dt, Math.round(T / dt)), b = K.kdvInvariants(u); return { a, b, e: Math.abs(b.I3 / a.I3 - 1), d3: Math.abs(b.I3 - a.I3) }; };
    const blow = [[16, 16, 6, 0.005], [8, 2, 6, 0.003], [16, 0.5, 6, 0.0016]].map(p => run(...p)), inside = [[16, 0.5, 6, 0.0005], [8, 2, 6, 0.001], [5, 2, 6, 0.0016], [2, 0.5, 6, 0.0025]].map(p => run(...p));
    const h = [0.0016, 0.0008].map(dt => run(5, 2, 4, dt)), ratio = h[0].d3 / h[1].d3;
    const refuse = (c1, c2, dt) => dt * Math.max(c1, c2) > K.KDV_STABLE_DTC || dt > K.KDV_STABLE_DT;
    ok('kdv: the raw kernel blows up where the refusal sits (NaN or |ΔI3/I3| > 0.1 at (16,16,0.005), (8,2,0.003), (16,0.5,0.0016) — all three refused), stays within 1e-3 inside it, and halving the step cuts the I3 drift by 25–40',
      blow.every(r => !(r.e < 0.1)) && [[16, 16, 0.005], [8, 2, 0.003], [16, 0.5, 0.0016]].every(p => refuse(...p)) && inside.every(r => r.e < 1e-3) && ![[16, 0.5, 0.0005], [8, 2, 0.001], [5, 2, 0.0016], [2, 0.5, 0.0025]].some(p => refuse(...p)) && ratio > 25 && ratio < 40
      && /throw new RangeError\(`dt = \$\{i\.dt\} is unstable/.test(SRC),
      `outside ${blow.map(r => Number.isFinite(r.e) ? r.e.toExponential(1) : 'NaN').join(', ')} · inside ${inside.map(r => r.e.toExponential(1)).join(', ')} · halving ×${ratio.toFixed(1)}`); }

  /* 2 · nuc */
  { const L = []; for (let A = 2; A <= 250; A++) for (let Z = 1; Z < A; Z++) L.push([K.nucBE(A, Z) / A, A, Z]); L.sort((a, b) => b[0] - a[0]);
    const E = K.NSY_EXCESS, H = E.H1, n = E.n, Zof = { H: 1, He: 2, Li: 3, Be: 4, B: 5, C: 6, N: 7, O: 8, Ne: 10, Mg: 12, Si: 14, S: 16, Ca: 20, Ti: 22, Cr: 24, Fe: 26, Ni: 28, Co: 27, Zn: 30, Sr: 38, Ba: 56, Pb: 82, U: 92, Au: 79 };
    const R = []; for (const [k, d] of Object.entries(E)) { const m = k.match(/^([A-Z][a-z]?)(\d+)$/); if (!m) continue; const Z = Zof[m[1]], A = +m[2]; if (!Z || A < 12) continue; R.push([k, K.nucBE(A, Z) - (Z * H + (A - Z) * n - d)]); }
    const rms = Math.sqrt(R.reduce((a, r) => a + r[1] ** 2, 0) / R.length), worst = R.reduce((a, r) => Math.abs(r[1]) > Math.abs(a[1]) ? r : a);
    const meas = k => { const m = k.match(/^([A-Z][a-z]?)(\d+)$/), Z = Zof[m[1]], A = +m[2]; return (Z * H + (A - Z) * n - E[k]) / A; };
    ok('nuc: the formula\'s summit is Fe-58 with Ni-62 second, the measured summit Ni-62 over Fe-58 over Fe-56; the relation says they disagree, the HUD has a summit band and an unbound state, and the limit\'s numbers (rms 3.9 MeV over 23 nuclides, +13.0 at U-238, deuteron −4.66) are what AME2020 gives here',
      L[0][1] === 58 && L[0][2] === 26 && L[1][1] === 62 && L[1][2] === 28 && meas('Ni62') > meas('Fe58') && meas('Fe58') > meas('Fe56')
      && R.length === 23 && Math.abs(rms - 3.87) < 0.05 && worst[0] === 'U238' && Math.abs(worst[1] - 13.04) < 0.05 && Math.abs(K.nucBE(2, 1) + 4.661) < 0.01
      && /\['origins','nuc','contrast',/.test(SRC) && /puts IRON-58 first at 8\.8648/.test(SRC) && /summit=Math\.abs\(A-O\.peakA\)<=6/.test(SRC) && /UNBOUND IN THE LIQUID-DROP MODEL/.test(SRC) && /its rms residual is 3\.9 MeV and the largest is \+13\.0 MeV at uranium-238/.test(SRC),
      `formula ${L.slice(0, 3).map(x => x[1] + '/' + x[2]).join(', ')} · measured Ni62 ${meas('Ni62').toFixed(5)} > Fe58 ${meas('Fe58').toFixed(5)} > Fe56 ${meas('Fe56').toFixed(5)} · rms ${rms.toFixed(2)}, worst ${worst[0]} ${worst[1].toFixed(2)}`); }

  /* 3 · earth */
  { const a = [0, 0, 1], th = 1e-9, b = [Math.sin(th), 0, Math.cos(th)], dot = a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
    const viaAcos = Math.acos(Math.min(1, dot)), viaAtan = Math.atan2(Math.hypot(a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]), dot);
    ok('earth: a pole arc of 1e-9 rad reads as exactly 0 through acos and as 1e-9 through atan2(|a×b|, a·b), which both engines now use; the legacy engine is refused beyond ±1000 years',
      viaAcos === 0 && Math.abs(viaAtan / th - 1) < 1e-9 && /poleShift:Math\.atan2\(cr,dot\)\*180\/Math\.PI/.test(SRC) && /poleShift:Math\.atan2\(Math\.hypot\(v\[0\],v\[1\]\),v\[2\]\)/.test(SRC)
      && /if\(m==='iau'&&Math\.abs\(y-2000\)>1000\) throw new RangeError/.test(SRC) && !/poleShift:Math\.acos\(dot\)/.test(SRC), `acos ${viaAcos} · atan2 ${viaAtan.toExponential(3)}`); }

  /* 4 · localflow */
  { const i0 = SRC.indexOf("id:'localflow', world:'obs'"), block = SRC.slice(i0, SRC.indexOf('}); }catch(e){}', i0)), declared = [...block.slice(block.indexOf('outputs:['), block.indexOf('limits:[')).matchAll(/\{name:'([a-z_]+)'/g)].map(m => m[1]);
    const ret = block.slice(block.indexOf('evaluate(inp){')), missing = declared.filter(nm => !new RegExp('\\b' + nm + ':').test(ret));
    ok('localflow: every one of the seven declared outputs is returned by evaluate(), the without-Virgo pair following the reader\'s own d_min', declared.length === 7 && missing.length === 0 && /N=hflowFit\(inp\.min_distance_mpc, false, false, 'lg'\)/.test(ret), `declared ${declared.length} · missing ${missing.join(', ') || 'none'}`); }

  /* 5 · spectrum */
  { let wrongLow = 0, wrongGap = 0, n = 0; for (let i = 0; i <= 10; i++) for (let j = 0; j <= 10; j++) { const bp = -2.5 + 0.5 * i, bm = -3 + 0.6 * j, S6 = K.specSpectrum(0, bp, bm, 6); n++;
      if (Math.abs(K.specSpectrum(0, bp, bm, 0.5).lowest / S6.lowest - 1) > 1e-12) wrongLow++; if (Math.abs(K.specSpectrum(0, bp, bm, 1).gap / S6.gap - 1) > 1e-12) wrongGap++; }
    const counts = [-2, 0, 2, 3, 4].map(al => K.specSpectrum(al, 0, 1e-7, 4).distinct.length), scaled = [-2, 0, 4].map(al => K.specSpectrum(al, 0.3, 0.2, 3).gap * Math.exp(2 * al));
    ok('spectrum: at j_max = ½ and 1 the lowest level and the gap now equal the j ≤ 6 values on the whole β-grid; the number of distinct levels no longer changes with α, and gap·e^{2α} is constant',
      wrongLow === 0 && wrongGap === 0 && new Set(counts).size === 1 && Math.abs(scaled[0] / scaled[2] - 1) < 1e-9, `${n} points · wrong lowest ${wrongLow}, wrong gap ${wrongGap} · distinct levels over α: ${counts.join(' ')}`); }

  /* mutation: the old absolute merge tolerance makes the level list depend on α again */
  { const src = K.specSpectrum.toString(), cut = 'Math.abs(x.e-last.value)<=tol'; const mut = new Function('specC', 'specEig', 'specBlock', 'return ' + src.replace(cut, 'Math.abs(x.e-last.value)<=1e-9*Math.max(1,Math.abs(x.e))'))(K.specC, K.specEig, K.specBlock);
    const counts = [0, 4].map(al => mut(al, 0, 1e-7, 4).distinct.length);
    ok('MUTATION — the old absolute tolerance (1e-9 whenever |λ| < 1) makes the level count change with α again, caught', src.includes(cut) && counts[0] !== counts[1], `distinct at α = 0 and 4: ${counts.join(' vs ')}`); }

  console.log('\n  ' + pass + ' passed, ' + fail + ' failed'); process.exit(fail ? 1 : 0);
})();
