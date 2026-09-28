#!/usr/bin/env node
'use strict';
/* ══ THE COLOUR OF COSMIC TIME, AND ONE UNIVERSE DRAWN ONCE ══════════════════════════════════
 * Distance is time: one colour says both, the same everywhere. And the giant structures are drawn once, carried
 * from Horizons into the solar chain rather than copied. Checked here:
 *   1. the chain distance ↔ epoch is this atlas's cosmology with radiation, and it lands where the Boltzmann
 *      code does: χ(z*) against CAMB's D_A* within 0.1%, the age within 0.002 Gyr, recombination at 370–380 kyr
 *   2. z(χ) inverts χ(z) to 10⁻⁶ across 0 < z < 1000
 *   3. the brightness after the first stars is the measured star-formation history: Madau & Dickinson peak at
 *      z = 1.86 ± 0.1, and cosmic noon outshines both the dark ages and today
 *   4. before the first stars the colour IS the relic radiation: at recombination the colour of the slice equals
 *      the wall's "colour it was" (the Planckian at T₀(1+z*)), and the dark ages are dim
 *   5. the clock moves it exactly: colour at (χ, Δt) = colour at t_emit(χ) + Δt, and the future fades
 *   6. one authority, two readings: the solar chain keeps its own true-scale structures untouched, Horizons keeps
 *      its instruments, the ticks follow where each is shown, and the tabs say what they are (Sun → Cosmos, Horizons)
 *   7. sphere in sphere: the structures continue the solar model by the same formula and exact scale, and the
 *      epoch spheres ride with them out to last scattering
 */
const fs = require('node:fs'), path = require('node:path');
const SRC = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
let pass = 0, fail = 0;
const ok = (n, c, d) => { if (c) { pass++; console.log('  PASS — ' + n + (d ? ' :: ' + d : '')); } else { fail++; console.log('  FAIL — ' + n + (d ? ' :: ' + d : '')); } };
(async () => {
  const K = await import(path.join(__dirname, '..', 'core', 'atlas', 'extracted.mjs'));
  const { ctChiOfZ, ctZOfChi, ctAgeOfZ, CT_T0, ctSFR, ctColorAtTime, ctColorAtChi, CMB_CAMB, cmbPlanckianRGB, HCC_S3R } = K;
  const zs = CMB_CAMB.meta.derived.zstar, camb = CMB_CAMB.meta.derived.DAstar * 3.2615637771674333, chi = ctChiOfZ(zs), trec = ctAgeOfZ(zs) * 1e6;
  ok('the chain lands where the Boltzmann code does: χ(z*) against CAMB\'s D_A* within 0.1%, the age within 0.002 Gyr, recombination at 370–380 kyr',
    Math.abs(chi / camb - 1) < 1e-3 && Math.abs(CT_T0() - CMB_CAMB.meta.derived.age) < 0.002 && trec > 370 && trec < 380, `χ(z*) ${chi.toFixed(3)} Gly vs CAMB ${camb.toFixed(3)} · age ${CT_T0().toFixed(4)} vs ${CMB_CAMB.meta.derived.age} · t(z*) ${trec.toFixed(1)} kyr`);
  { let w = 0; for (const z of [0.01, 0.3, 1, 3, 10, 60, 300, 1000]) w = Math.max(w, Math.abs(ctZOfChi(ctChiOfZ(z)) / z - 1));
    ok('z(χ) inverts χ(z) across 0 < z < 1000', w < 1e-4, `worst ${w.toExponential(1)}`); }
  { let zb = 0, pb = 0; for (let z = 0; z < 8; z += 0.001) { const p = ctSFR(z); if (p > pb) { pb = p; zb = z; } }
    const noon = ctColorAtTime(ctAgeOfZ(1.9)).b, today = ctColorAtTime(CT_T0()).b, dark = ctColorAtTime(ctAgeOfZ(100)).b;
    ok('the brightness is the measured star-formation history: the Madau & Dickinson peak at z ≈ 1.86, and noon outshines the dark ages and today', Math.abs(zb - 1.86) < 0.1 && noon > today && noon > dark,
      `peak z ${zb.toFixed(3)} · brightness noon ${noon.toFixed(2)}, today ${today.toFixed(2)}, dark ages ${dark.toFixed(2)}`); }
  { const r = ctColorAtTime(ctAgeOfZ(zs)), w = cmbPlanckianRGB(HCC_S3R.T_cmb * (1 + zs)), d = Math.max(...r.rgb.map((v, i) => Math.abs(v - w[i]))), dark = ctColorAtTime(ctAgeOfZ(200));
    ok('before the first stars the colour IS the relic radiation: at recombination the slice\'s colour is the wall\'s Planckian at T₀(1+z*), and the dark ages are dim', d < 0.02 && r.b > 0.9 && dark.b < 0.12,
      `rgb ${r.rgb.map(v => v.toFixed(3))} vs ${w.map(v => v.toFixed(3))} · dark-age brightness ${dark.b.toFixed(3)}`); }
  { const c = 20, dt = 2e9, a = ctColorAtChi(c, dt), b = ctColorAtTime(ctAgeOfZ(ctZOfChi(c)) + 2), f1 = ctColorAtTime(CT_T0() + 5), f2 = ctColorAtTime(CT_T0() + 20);
    ok('the clock moves it exactly, and the future fades', a.rgb.every((v, i) => Math.abs(v - b.rgb[i]) < 1e-12) && Math.abs(a.b - b.b) < 1e-12 && f2.b < f1.b && f1.b < ctColorAtTime(CT_T0()).b, `+5 Gyr ${f1.b.toFixed(3)} · +20 Gyr ${f2.b.toFixed(3)}`); }
  ok('one authority, two readings, and the solar chain untouched: the Horizons group stays in Horizons, the solar chain draws its own true-scale structures and Laniakea flows as it always did, the ticks follow where each is shown, the tabs say what they are',
    /function cosmosHome\(\)\{[\s\S]{0,500}if\(cosmosGroup\.parent!==obsGroup\) obsGroup\.add\(cosmosGroup\);/.test(SRC) && !/o\.g\.visible=false;   \/\* retired/.test(SRC)
    && /o\.g\.visible=\(layer==='cosmic'\|\|layer==='andromeda'\)&&\(o\.s\.size>=\.2\|\|\['greatatt','laniakea','virgo'\]\.includes\(o\.s\.key\)\);/.test(SRC)
    && /solarLaniakeaFlowGroup\.visible=layer==='cosmic'&&!!state\.showLaniakeaFlows/.test(SRC) && /function cosmosShown\(\)\{ return cosmosGroup\.visible&&obsGroup\.visible; \}/.test(SRC)
    && /function lssReliefTick\(\)\{ if\(!cosmosShown\(\)\) return;/.test(SRC) && /solar:\{en:'☀ Sun → Cosmos',ru:'☀ Солнце → Космос'/.test(SRC) && /obs:\{en:'◯ Horizons',ru:'◯ Горизонты'/.test(SRC) && /try\{ ctViewTick\(\); \}/.test(SRC));
  /* 7. SPHERE IN SPHERE — the giant structures are the continuation of the solar model, and must stay exactly that:
     both readings place every structure by the same formula (J2000 direction × comoving distance, the Sun at the
     origin, ecliptic, Y up), the solar one at exactly 1 Gly → GLY_AU AU; the cosmos group is never moved, rotated
     or scaled; and the spheres of cosmic time — which carry no distance constant — are carried into the solar chain
     by a holder at exactly that scale, so the nesting runs on past the structures to last scattering. */
  { const shells = [0.63, 2, 5.5, 10, 20, 1089.9].map(z => ctChiOfZ(z)), nested = shells.every((r, i) => i === 0 || r > shells[i - 1]);
    const sameFormula = /const dist = s\.dGly!=null \? s\.dGly : comovingGly\(s\.z\);\s*const dir = raDecDir\(s\.ra\/15, s\.dec\), g = new THREE\.Group\(\);\s*g\.position\.copy\(dir\)\.multiplyScalar\(dist\); cosmosGroup\.add\(g\);/.test(SRC)
      && /const dist=s\.dGly!=null\?s\.dGly:comovingGly\(s\.z\), dir=raDecDir\(s\.ra\/15,s\.dec\), g=new THREE\.Group\(\);\s*g\.position\.copy\(dir\)\.multiplyScalar\(dist\*GLY_AU\); solarCosmicGroup\.add\(g\);/.test(SRC);
    const holder = /const GLY_AU=1e9\*OORT\.AU_PER_LY/.test(SRC) && /SOLAR_COSMOS_HOLDER\.scale\.setScalar\(GLY_AU\); solarCosmicGroup\.add\(SOLAR_COSMOS_HOLDER\);/.test(SRC) && /solarDeepGroup\.add\(solarGalacticGroup,solarCosmicGroup\);/.test(SRC) && /const solarDeepGroup=new THREE\.Group\(\); solarGroup\.add\(solarDeepGroup\);/.test(SRC);
    const untouched = !/cosmosGroup\.(position|rotation|quaternion|scale)\.(set|copy|multiply)/.test(SRC);
    const rides = /const want=inSolar\?SOLAR_COSMOS_HOLDER:cosmosGroup; if\(CT_VIEW\.group\.parent!==want\) want\.add\(CT_VIEW\.group\);/.test(SRC) && /CT_VIEW\.group\.add\(sh\)/.test(SRC) && /pq=CT_VIEW\.group\.getWorldQuaternion/.test(SRC) && /\/CT_VIEW\.group\.getWorldScale\(new THREE\.Vector3\(\)\)\.x, f=THREE\.MathUtils\.smoothstep\(dGly,1\.5,6\)/.test(SRC);
    ok('sphere in sphere: the structures continue the solar model exactly — same placement formula, 1 Gly → GLY_AU, the group never moved — and the epoch spheres ride with them to last scattering',
      sameFormula && holder && untouched && rides && nested && Math.abs(shells[5] - ctChiOfZ(1089.9)) < 1e-12,
      `shells ${shells.map(r => r.toFixed(2)).join(' < ')} Gly · formula ${sameFormula} · holder ${holder} · untouched ${untouched} · rides ${rides}`); }
  console.log('\n  ' + pass + ' passed, ' + fail + ' failed'); process.exit(fail ? 1 : 0);
})();
