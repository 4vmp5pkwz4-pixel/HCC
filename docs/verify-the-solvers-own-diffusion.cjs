#!/usr/bin/env node
'use strict';
/* ══ THE SOLVER'S OWN DIFFUSION, AND THE BOUND THAT IS A WORST CASE ═══════════
 *
 * The blast wave had the dimension table predict a number that PHOTOGRAPHS could
 * contradict. This closes a shorter and stranger loop: the table predicts how the
 * SIMULATOR STANDING NEXT TO IT must behave, and the simulator is measured.
 *
 * Three kinds — {diffusivity, time, length} — give exactly one dimensionless group,
 * L²/(Dt), so L = (Dt)^(1/2). For a spreading pulse that half-power says something
 * sharper than it looks: the SECOND MOMENT is linear in time. The Field Lab's heat
 * solver steps a[i] = u[i] + α·dt·lap(u,i), so its D is α and the predicted slope is
 * 6α with no free parameter anywhere.
 *
 * WHAT DIMENSIONAL ANALYSIS DOES NOT GIVE, AGAIN, IS THE COEFFICIENT. The half-power
 * fixes linearity and is silent about the slope; the 2ν comes from the Gaussian
 * solution exactly as ξ came from integrating the gas dynamics. This file checks that
 * the source says so rather than dressing the six up as a consequence of the units.
 *
 * MEASURED IN THE BROWSER, NOT HERE. The probe has to run the real advance() on the
 * real buffers — a check that reimplemented the heat step would agree with a broken
 * solver about a shared mistake — so the numbers live in the boot suite and this file
 * checks the arithmetic that has no solver in it, plus the SHAPE of the probe: that
 * it calls advance(), that it restores what it changed, and that the honest parts
 * are present rather than rounded away.
 */
const fs = require('node:fs'), path = require('node:path');
const ROOT = path.join(__dirname, '..');
const src = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
let pass = 0, fail = 0;
const ok = (n, c, d) => { if (c) { pass++; console.log('  PASS — ' + n + (d ? ' :: ' + d : '')); }
  else { fail++; console.log('  FAIL — ' + n + (d ? ' :: EXPECTED ' + d : '')); } };
const cut = (a, b) => { const i = src.indexOf(a); const j = src.indexOf(b, i);
  if (i < 0 || j < 0) throw new Error('could not cut ' + a.slice(0, 40)); return src.slice(i, j); };

const API = (() => {
  const code = cut('const HCC_DIM=', '/* ══ TWENTY-NINE')
    + cut('function hccNullBasis', 'function hccDirectionCensus')
    + cut('/* ══ THE SOLVER', '/* and four that must FAIL')
    + '\nreturn {hccDiffusionExponents, hccDiffusionSlope, hccLinearFit, HCC_DIFFUSION, HCC_DIFF_NU};';
  return new Function(code)();
})();

/* 1 ── the exponent is derived, again, by the same routine */
{ const x = API.hccDiffusionExponents();
  ok('three kinds admit exactly one dimensionless group, and it is L²/(Dt)',
    !!x && x.groups === 1 && JSON.stringify(x.vector) === '[-1,-1,2]',
    x ? 'null space of {diffusivity, time, length} → [' + x.vector.join(', ') + ']' : 'one group');
  ok('and the half-power is read out of it rather than typed',
    Math.abs(x.diffusivity - 0.5) < 1e-12 && Math.abs(x.time - 0.5) < 1e-12,
    'L = D^' + x.diffusivity + ' t^' + x.time + ' · the same routine that gave the blast wave its 2/5');

  /* the coefficient is NOT from the units, and the file must not pretend otherwise */
  const fn = cut('function hccDiffusionSlope', '/* and four that must FAIL');
  ok('the coefficient is stated as coming from the solution, not dressed up as a consequence of the units',
    API.HCC_DIFF_NU === 3 && API.hccDiffusionSlope(0.16) === 0.96
    && /2\*HCC_DIFF_NU\*alpha/.test(fn)
    && /says nothing whatever about the slope/.test(src)
    && /exactly as ξ came from integrating the gas dynamics/.test(src),
    '2ν = 6 comes from the Gaussian solution · the function asserts the half-power it depends on and then states the coefficient as what it is');
  ok('and it refuses to answer at all if that half-power is not what it depends on',
    /if\(Math\.abs\(x\.diffusivity-0\.5\)>1e-12\|\|Math\.abs\(x\.time-0\.5\)>1e-12\) return null;/.test(fn),
    'a coefficient handed back regardless of the exponent it belongs to is a constant with a function wrapped round it');
}

/* 2 ── the fit reports how well it fits, which is the whole point of a fit */
{ const f = API.hccLinearFit([[0, 1], [1, 3], [2, 5], [3, 7]]);
  ok('the least-squares helper returns the coefficient of determination alongside the slope',
    f.slope === 2 && f.intercept === 1 && f.r2 === 1 && f.n === 4,
    'a slope without an R² is a line drawn through whatever was there');
  const noisy = API.hccLinearFit([[0, 0], [1, 5], [2, 1], [3, 6]]);
  ok('and it reports a poor fit as poor rather than returning a slope regardless',
    noisy.r2 < 0.8 && noisy.r2 >= 0,
    'R² = ' + noisy.r2.toFixed(4) + ' on scattered points — a detector that cannot fire is not a detector');
}

/* 3 ── the probe runs the solver rather than a copy of it */
{ const p = cut('function diffusionProbe(opts)', 'function diffusionSweep');
  /* the first version of this also banned the string `alpha*dt*` and so flagged
     `cfl:alpha*dt*stabilityFactor`, which is the CFL number and entirely correct. A
     check that fires on correct code is worse than no check, so it now asks the
     question that actually distinguishes the two: a heat step must READ NEIGHBOURS,
     and the only thing in this file that reads neighbours is advance(). */
  ok('the probe calls the real advance() on the real buffers rather than stepping the field itself',
    /rows\.push\(\{t:s\*dt, r2:q\.r2, mass:q\.mass, peak:q\.peak\}\); advance\(dt\); \}/.test(p)
    && !/lap\(/.test(p) && !/\ba\[i\]\s*=/.test(p) && !/u\[i\]\s*\+=/.test(p),
    'a probe that wrote its own three-line heat step would be checking its own arithmetic and would agree with a broken advance() about a shared mistake');
  ok('and it puts the laboratory back exactly as it found it',
    /const keep=\{model:state\.fieldModel, preset:state\.fieldPreset, alpha:state\.fieldAlpha\};/.test(p)
    && /state\.fieldModel=keep\.model; state\.fieldPreset=keep\.preset; state\.fieldAlpha=keep\.alpha;/.test(p)
    && /reset\(\); visual\(\);/.test(p),
    'a self-test that quietly changes the instrument it tested is worse than none');
  ok('the second moment is taken over the interior only, because the faces are held at zero and are not part of the field',
    /for\(let z=1;z<N-1;z\+\+\)for\(let y=1;y<N-1;y\+\+\)for\(let x=1;x<N-1;x\+\+\)\{\n\s+const w=u\[idx\(x,y,z\)\]; mx=Math\.max/.test(p),
    'counting the Dirichlet faces would be counting the zeros the boundary condition puts there');
  ok('and it reports the mass the walls took, which is the quantity that explains the deficit',
    /massLost:rows\[0\]\.mass\?1-last\.mass\/rows\[0\]\.mass:0/.test(p)
    && /amplification:rows\[0\]\.peak\?last\.peak\/rows\[0\]\.peak:0/.test(p)
    && /cfl:alpha\*dt\*HCC_DIFFUSION\.stabilityFactor/.test(p),
    'a measurement that is three per cent low without saying why is three per cent of nothing');
}

/* 4 ── the deficit is admitted as one-sided, which is the honest part */
ok('the source says the measurement is a LOWER bound on 6α rather than an estimate of it',
  /the measurement is a LOWER BOUND on 6α rather\s*\n\s+than an estimate of it/.test(src)
  && /Quoting the number from the widest window would have been\s*\n\s+quoting the worst one/.test(src)
  && /The deficit is therefore\s*\n\s+ALWAYS NEGATIVE/.test(src),
  'every step destroys the material furthest from the centre, which is exactly the material the second moment weights most');

ok('and the boot suite checks the one-sidedness by widening the window, not by asserting it',
  /const w=\[3,6,10,16\]\.map\(k=>FIELD\.diffusionProbe\(\{alpha:0\.16,samples:k\}\)\.ratio\);/.test(src)
  && /return w\.every\(\(v,i\)=>i===0\|\|v<w\[i-1\]\)&&w\[0\]<1;/.test(src),
  'monotone decreasing across four windows is a measurement; "the walls take a few per cent" is a sentence');

/* 5 ── the stability bound, measured on the mode that attains it */
ok('the stability bound is measured on the checkerboard, where the discrete Laplacian attains −12',
  /if\(seed==='checker'\)\{ u\.fill\(0\);/.test(src)
  && /u\[idx\(x,y,z\)\]=\(\(x\+y\+z\)&1\)\?1:-1;/.test(src)
  && /a bound tested only on data that cannot violate it is a bound nobody has tested/.test(src),
  'run the smooth pulse past the bound and nothing happens, which is what a worst-case bound means and not the bound being wrong');

ok('and the boot suite requires BOTH sides of that: the smooth pulse surviving and the worst mode not',
  /smooth\.cfl>1&&smooth\.amplification<1&&worst\.amplification>1/.test(src),
  'checking only the blow-up would pass on a solver that blew up for every mode');

ok('the factor in the bound is named for the reason it has that value',
  API.HCC_DIFFUSION.stabilityFactor === 6
  && /the 3D 7-point Laplacian attains −12, and explicit Euler needs α·dt·12 ≤ 2/.test(src),
  'a constant 6 with no derivation beside it is a number somebody will change without re-deriving');

/* 6 ── the picture makes the window visible rather than describing it */
ok('the law and the lattice are drawn together, so the reader watches the model stop being true',
  /DIFFMARK\.measured=rings\(0x00f0ff,\.98\); DIFFMARK\.predicted=rings\(0xffc24d,\.92\);/.test(src)
  && /DIFFMARK\.measured\.scale\.setScalar\(rm\);/.test(src)
  && /DIFFMARK\.predicted\.scale\.setScalar\(Math\.sqrt\(q\.predictedR2\)\*q\.spacing\);/.test(src),
  'cyan is the radius the lattice has and gold is the radius the law says it should have');

ok('the baseline the prediction is measured from is measured at reset, not written down',
  /function seedBaseline\(\)\{/.test(src) && /seedBaseline\(\); visual\(\);lastDiag=null;/.test(src)
  && /a constant here would be a second authority\s*\n\s+for the initial condition/.test(src),
  '⟨r²⟩₀ depends on the lattice size and on the preset, so a literal would drift from both');

ok('and the annotation draws over the cloud it annotates, which the first version did not',
  /depthTest:false,depthWrite:false,blending:THREE\.AdditiveBlending/.test(src)
  && /a measurement ring that disappears behind the cloud it measures has\s*\n\s+annotated nothing/.test(src),
  'the rings were invisible against the point cloud until they were given a render order and depth test of their own');

ok('the marks read the field on their own clock rather than every frame',
  /DIFFMARK\.acc\+=dt; if\(DIFFMARK\.acc<0\.08\) return; DIFFMARK\.acc=0;/.test(src),
  'a full pass over the interior twelve times a second is enough to watch a pulse spread and is not enough to cost a frame');

console.log(`\n  ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
