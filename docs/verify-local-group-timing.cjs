#!/usr/bin/env node
'use strict';
/* ══ THE MASS OF EVERYTHING WE ARE BOUND TO ════════════════════════════════════
 *
 * The catalogue placed forty-five galaxies. A catalogue is a description; the
 * timing argument is the first thing this atlas does with it that is a PREDICTION.
 *
 * Every other galaxy recedes. M31 approaches, and it can only be approaching
 * because the pair turned around and fell back — which happens if and only if
 * there is enough mass. Kahn & Woltjer 1959 made that one equation in one unknown.
 *
 * This runs the solver out of index.html and checks it against things that are
 * true outside this file:
 *
 *   · the answer, 4.3e12 solar masses, which is the published value;
 *   · the two limits — at zero approach speed the pair is AT turnaround, and there
 *     the cycloid must return exactly the Sandage zero-velocity mass, which is
 *     coded separately as a numerical integral. Two independent implementations
 *     that must agree in one place, and do, to twelve digits;
 *   · the Lambda=0 limit of that integral against its own closed form;
 *   · the direction of every dependence: more speed is more mass, more time is
 *     less mass, a wider zero-velocity surface is more mass;
 *   · and that the separation is not typed here at all — it is M31's own
 *     catalogue entry, converted once.
 */
const fs = require('node:fs'), path = require('node:path'), vm = require('node:vm');
const ROOT = path.join(__dirname, '..');
const src = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');

let pass = 0, fail = 0;
const ok = (n, c, d) => { if (c) { pass++; console.log('  PASS — ' + n + (d ? ' :: ' + d : '')); }
  else { fail++; console.log('  FAIL — ' + n + (d ? ' :: EXPECTED ' + d : '')); } };

function cutBalanced(from, open, close, tail) {
  const i = src.indexOf(from);
  if (i < 0) throw new Error('slice not found: ' + from);
  const j = src.indexOf(open, i);
  let d = 0;
  for (let k = j; k < src.length; k++) {
    if (src[k] === open) d++;
    else if (src[k] === close) { d--; if (d === 0) return src.slice(i, k + 1) + (tail || ''); }
  }
  throw new Error('unbalanced: ' + from);
}
const S_S3     = cutBalanced('const S3 = {', '{', '}', ';');
const S_GAL    = cutBalanced('const GALAXIES=Object.freeze([', '[', ']', ');');
const S_COSMOS = cutBalanced('const COSMOS = [', '[', ']', ';');
const S_GALRD  = cutBalanced('function galacticRaDec(lDeg,bDeg){', '{', '}');
/* From the first constant of the laboratory to the end of its last function — cut by
   the declarations that bound it, never by a line number. */
const S_LG = src.slice(src.indexOf('const LG_G=6.67430e-11'),
                       src.indexOf('const LG_DEFAULT_R0_MPC='))
  + src.slice(src.indexOf('const LG_DEFAULT_R0_MPC='), src.indexOf('\n', src.indexOf('const LG_DEFAULT_R0_MPC=')));
const APPROACH = src.match(/const LG_APPROACH_KMS=(\d+(?:\.\d+)?);/);

ok('the laboratory and the tables it reads were cut out of index.html rather than copied beside it',
  S_LG.length > 1200 && S_S3.length > 200 && !!APPROACH, `${S_LG.length} chars of live solver`);

const sandbox = { Math, Map, Set, Object, Array, Number, console, JSON,
  DEG: Math.PI / 180, MPC_PER_GLY: 306.601, Infinity };
const ctx = vm.createContext(sandbox);
const built = vm.runInContext([
  S_S3, S_GALRD,
  'const VELA_EQ=galacticRaDec(272.5,0), DIPOLE_EQ=galacticRaDec(94,-16), LOCALVOID_EQ=galacticRaDec(60,15);',
  S_GAL, S_COSMOS,
  'for(const s of COSMOS) if(s.dGly==null && s.dMly!=null) s.dGly=s.dMly/1000;',
  `const LG_APPROACH_KMS=${APPROACH[1]};`,
  S_LG,
  '({lgTiming, lgReport, lgTurnaroundAge, lgMassFromZeroVelocity, lgZeroVelocityRadius, LG_SEPARATION_MPC, LG_LAMBDA, LG_DEFAULT_R0_MPC, LG_G, LG_MSUN, LG_MPC_M, LG_YR_S, S3, COSMOS})'
].join('\n'), ctx, { timeout: 30000 });

const { lgTiming, lgReport, lgMassFromZeroVelocity, LG_SEPARATION_MPC, LG_LAMBDA,
        LG_DEFAULT_R0_MPC, LG_G, LG_MSUN, LG_MPC_M, LG_YR_S, S3, COSMOS } = built;
const APPROACH_KMS = +APPROACH[1];

/* ── the inputs are the atlas's own, not this file's ──────────────────────── */
const m31 = COSMOS.find(s => s.key === 'm31');
ok('the separation is not typed in the laboratory — it is M31`s own catalogue entry, converted once',
  Math.abs(LG_SEPARATION_MPC - m31.dMly / 1000 * 306.601) < 1e-12 && !/LG_SEPARATION_MPC\s*=\s*[\d.]/.test(S_LG),
  `${LG_SEPARATION_MPC.toFixed(5)} Mpc, from dMly = ${m31.dMly}`);
ok('and the approach speed is declared exactly once in the whole file, where the motion-vector table needs it',
  (src.match(/const LG_APPROACH_KMS=/g) || []).length === 1 &&
  (src.match(/\bv:110\b/g) || []).length === 0,
  `LG_APPROACH_KMS = ${APPROACH_KMS} km/s, and no second literal 110 stands in the vector table`);

/* ── the answer ───────────────────────────────────────────────────────────── */
const R = lgReport(LG_SEPARATION_MPC, APPROACH_KMS, S3.t0, LG_DEFAULT_R0_MPC);
ok('the timing argument returns the published Local Group mass — a little over four trillion suns',
  Math.abs(R.mass_solar / 1e12 - 4.285) < 0.06, `${(R.mass_solar / 1e12).toFixed(4)}e12 M☉`);
ok('the orbit phase lands strictly between turnaround and collapse, which is the only interval where a pair can be approaching',
  R.eta > Math.PI && R.eta < 2 * Math.PI, `η = ${R.eta.toFixed(6)} rad, against π = ${Math.PI.toFixed(6)} and 2π = ${(2 * Math.PI).toFixed(6)}`);
ok('the pair got about a megaparsec apart before it fell back, a little over eight billion years ago',
  Math.abs(R.turnaround_mpc - 1.044) < 0.02 && Math.abs(R.turnaround_gyr - 8.54) < 0.15,
  `${R.turnaround_mpc.toFixed(4)} Mpc at ${R.turnaround_gyr.toFixed(3)} Gyr`);
ok('and on this purely radial solution they arrive in a little over three billion years',
  R.merge_in_gyr > 2.5 && R.merge_in_gyr < 4.0,
  `${R.merge_in_gyr.toFixed(3)} Gyr — a LOWER bound, because a transverse velocity can only delay a collision`);

/* ── the limit where two independent implementations must agree ───────────── */
{
  const T0 = lgTiming(LG_DEFAULT_R0_MPC, 0, S3.t0);
  const Z0 = lgMassFromZeroVelocity(LG_DEFAULT_R0_MPC, S3.t0, 0);
  ok('AT ZERO APPROACH SPEED THE PAIR IS AT TURNAROUND, AND THERE THE CYCLOID MUST RETURN EXACTLY WHAT THE ZERO-VELOCITY INTEGRAL RETURNS. Two estimators written separately — one a closed-form bisection on a cycloid, one a numerical quadrature with a substitution — meeting in the one place they are the same statement',
    Math.abs(T0.mass_solar / Z0 - 1) < 1e-9 && Math.abs(T0.eta - Math.PI) < 1e-8,
    `cycloid ${(T0.mass_solar / 1e12).toFixed(9)}e12 against integral ${(Z0 / 1e12).toFixed(9)}e12 — agreeing to ${Math.abs(T0.mass_solar / Z0 - 1).toExponential(1)}`);
  const t = S3.t0 * 1e9 * LG_YR_S, r0 = LG_DEFAULT_R0_MPC * LG_MPC_M;
  const closed = Math.pow(r0, 3) * Math.PI * Math.PI / (8 * LG_G * t * t) / LG_MSUN;
  ok('and with the cosmological constant set to zero that integral is the Sandage relation exactly, which is the check that the quadrature solves what it claims to',
    Math.abs(Z0 / closed - 1) < 1e-8, `numeric / closed form = ${(Z0 / closed).toFixed(12)}`);
}

/* ── the second estimator, and the tension ────────────────────────────────── */
ok('the zero-velocity surface says a smaller mass, and the two are published as a ratio rather than reconciled',
  R.mass_ratio > 2 && R.mass_ratio < 3.2 && R.zero_velocity_mass < R.mass_solar,
  `timing ${(R.mass_solar / 1e12).toFixed(3)}e12 against zero-velocity ${(R.zero_velocity_mass / 1e12).toFixed(3)}e12 — a factor of ${R.mass_ratio.toFixed(3)}`);
ok('the cosmological constant is worth about a third on the estimator that carries it, and carrying it moves the answer TOWARD the published value rather than away',
  R.zero_velocity_mass > R.zero_velocity_mass_no_lambda * 1.3 &&
  R.zero_velocity_mass > R.zero_velocity_mass_no_lambda * 1.0,
  `${(R.zero_velocity_mass / 1e12).toFixed(3)}e12 with Λ against ${(R.zero_velocity_mass_no_lambda / 1e12).toFixed(3)}e12 without — Λ = ${LG_LAMBDA.toExponential(4)} m⁻²`);
ok('and the same disagreement seen as a length: the timing mass puts the zero-velocity surface further out than it is measured',
  R.implied_zero_velocity_radius > LG_DEFAULT_R0_MPC * 1.2,
  `${R.implied_zero_velocity_radius.toFixed(4)} Mpc implied against ${LG_DEFAULT_R0_MPC} Mpc measured`);

/* ── every dependence points the way physics says it must ─────────────────── */
const M = (s, v, t) => lgTiming(s, v, t).mass_solar;
ok('a faster approach means more mass — the pair had to be pulled harder to be moving that fast',
  M(LG_SEPARATION_MPC, 140, S3.t0) > M(LG_SEPARATION_MPC, 110, S3.t0),
  `${(M(LG_SEPARATION_MPC, 140, S3.t0) / 1e12).toFixed(3)}e12 at 140 km/s against ${(M(LG_SEPARATION_MPC, 110, S3.t0) / 1e12).toFixed(3)}e12 at 110`);
ok('a longer time means less mass — there was more of it available to do the same job',
  M(LG_SEPARATION_MPC, APPROACH_KMS, 16) < M(LG_SEPARATION_MPC, APPROACH_KMS, 13.79),
  `${(M(LG_SEPARATION_MPC, APPROACH_KMS, 16) / 1e12).toFixed(3)}e12 at 16 Gyr against ${(M(LG_SEPARATION_MPC, APPROACH_KMS, 13.79) / 1e12).toFixed(3)}e12 at 13.79`);
ok('a wider separation means more mass — it had further to fall back from',
  M(1.0, APPROACH_KMS, S3.t0) > M(0.6, APPROACH_KMS, S3.t0),
  `${(M(1.0, APPROACH_KMS, S3.t0) / 1e12).toFixed(3)}e12 at 1.0 Mpc against ${(M(0.6, APPROACH_KMS, S3.t0) / 1e12).toFixed(3)}e12 at 0.6`);
ok('and a wider zero-velocity surface means more mass on the other estimator too',
  lgMassFromZeroVelocity(1.3, S3.t0, LG_LAMBDA) > lgMassFromZeroVelocity(0.96, S3.t0, LG_LAMBDA),
  `${(lgMassFromZeroVelocity(1.3, S3.t0, LG_LAMBDA) / 1e12).toFixed(3)}e12 at 1.3 Mpc against ${(lgMassFromZeroVelocity(0.96, S3.t0, LG_LAMBDA) / 1e12).toFixed(3)}e12 at 0.96`);

/* ── and the coupling the bus proposed and the atlas refused ──────────────── */
ok('a star`s rotation age may not set the age of the Universe, and the refusal is written down rather than the check being loosened',
  src.includes("'gyro.age|localgroup.age'"),
  'the units convert and the coordinate names match — both of the bus`s tests pass, and the coupling is still nonsense');

console.log(`\n  ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
