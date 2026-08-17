/* ── FINITE INDEX: THE GOLDEN WINDOW AND FOUR NO-GO THEOREMS ─────────────────
   Sections VIII to XI of the manuscript.

   The rigidity result is short and strong: a correctly typed conditional expectation whose
   Pimsner-Popa constant lies strictly inside (1/3, 1/2) has index strictly inside (2,3),
   and the Jones spectrum has exactly one value there. The index is phi^2 and nobody had to
   compute an irrational number to find out — a coarse positivity window did it.

   The strength is also the danger, so this module computes the four things that CANNOT be
   the defect with as much care as the thing that can:

     · a divisible semigroup of endomorphisms is forced to index one, because I^{1/n} would
       have to enter the forbidden gap (1,2) where the spectrum is empty;
     · the irreducible fuzzy sphere has only lambda* = 1 or 1/N, and 1/N never lands in the
       window — N = 2 and 3 give exactly the excluded endpoints;
     · Mat_N does not embed unitally in Mat_{N+1} for N > 1, so the fuzzy tower is a
       regularisation sequence and not a Jones tower;
     · phi^2 is irrational, so no integer capacity ladder can step by it.

   The integral shadow that IS correct is BB^T = N_tau^2 = [[1,1],[1,2]], and its powers
   are Fibonacci. That matrix identity is the bridge; an irrational multiplicative ladder
   of areas is not. */
import { jacobiEigenvalues } from '../math/cmatrix.mjs';

export const PHI = (1 + Math.sqrt(5)) / 2;
export const GOLDEN_INDEX = PHI * PHI;                   /* = (3 + sqrt 5)/2 = 4cos^2(pi/5) */

/* ── The Jones spectrum ──────────────────────────────────────────────────── */

/* [M:N] in { 4 cos^2(pi/m) : m = 3,4,... } union [4, infinity).
   Below 4 the set is DISCRETE, and that discreteness is the whole mechanism. */
export function jonesSpectrum(mMax = 24) {
  const out = [];
  for (let m = 3; m <= mMax; m++) out.push({ m, index: 4 * Math.cos(Math.PI / m) ** 2 });
  return out;
}

/* Is a proposed index admissible at all, and if it is below 4, which m is it?
   The gap that does the work in the divisibility no-go is (1,2): the spectrum jumps from
   1 (m = 3 gives 1) straight to 2 (m = 4), with nothing in between. */
export function admissibleIndex(value, tol = 1e-9) {
  if (!(value >= 1)) return { value, admissible: false, reason: 'index is at least 1' };
  if (value >= 4 - tol) return { value, admissible: true, branch: 'continuum', m: null };
  let best = null;
  for (const { m, index } of jonesSpectrum(400)) {
    const d = Math.abs(index - value);
    if (!best || d < best.distance) best = { m, index, distance: d };
  }
  return { value, admissible: best.distance <= tol, branch: 'discrete',
    m: best.distance <= tol ? best.m : null,
    nearest_allowed: best.index, distance_to_allowed: best.distance,
    in_forbidden_gap: value > 1 + tol && value < 2 - tol };
}

/* ── The Pimsner-Popa window ─────────────────────────────────────────────── */

/* lambda*(E)^{-1} = [M:N] in the finite II_1 setting. The window 1/3 < lambda* < 1/2 is
   the same statement as 2 < [M:N] < 3, and the spectrum has one point there. */
export function pimsnerPopaWindow(lambda) {
  if (!(lambda > 0 && lambda <= 1)) throw new RangeError('lambda* lies in (0,1]');
  const index = 1 / lambda;
  const inWindow = lambda > 1 / 3 && lambda < 1 / 2;
  const adm = admissibleIndex(index);
  return {
    lambda_star: lambda, index,
    in_window: inWindow,
    index_window: [2, 3],
    forced_index: inWindow ? GOLDEN_INDEX : null,
    forced_lambda: inWindow ? 1 / GOLDEN_INDEX : null,
    forced_m: inWindow ? 5 : null,
    graph: inWindow ? 'A_4' : null,
    admissible: adm.admissible, m: adm.m,
    /* the number nobody had to compute in order to conclude it */
    distance_to_golden: Math.abs(index - GOLDEN_INDEX),
    verdict: inWindow
      ? 'the small-index spectrum forces Ind = phi^2 and the A_4 / Fibonacci branch'
      : 'outside the window the golden value is not forced'
  };
}

/* Two explicit estimates replace one irrational computation: a uniform lower positivity
   bound and ONE upper witness evaluated in a single normal positive functional. */
export function twoWitnessCertificate({ epsilon_minus, omega_E_x_plus, omega_x_plus }) {
  if (!(omega_x_plus > 0)) throw new RangeError('the witness needs omega(x_+) > 0');
  const lower = 1 / 3 + epsilon_minus;
  const upper = omega_E_x_plus / omega_x_plus;
  const holds = epsilon_minus > 0 && upper < 1 / 2;
  return { lower_bound: lower, upper_witness: upper,
    lower_holds: epsilon_minus > 0, upper_holds: upper < 1 / 2,
    window_established: holds,
    bracket: [lower, upper],
    conclusion: holds ? '1/3 < lambda* < 1/2, hence Ind = phi^2' : 'the window is not established',
    independent_of_Lambda_obs: true };
}

/* ── No-go 1: divisible semigroups ───────────────────────────────────────── */

/* Every supertranslation parameter has an n-th root in the positive cone. If the index
   were multiplicative under a semigroup-homomorphic endomorphic representation, then
   Ind(Theta_{h_n}) = I^{1/n}, and for large n that lands strictly between 1 and 2 where
   the Jones spectrum is EMPTY. The only escape is I = 1. */
export function divisibilityNoGo(I, nMax = 64) {
  if (!(I >= 1)) throw new RangeError('an index is at least 1');
  const rows = [];
  let firstViolation = null;
  for (let n = 2; n <= nMax; n++) {
    const root = Math.pow(I, 1 / n);
    const forbidden = root > 1 + 1e-12 && root < 2 - 1e-12;
    rows.push({ n, root, in_forbidden_gap: forbidden });
    if (forbidden && firstViolation === null) firstViolation = n;
  }
  return { index: I, rows,
    forced_to_one: I > 1 && firstViolation !== null,
    first_violating_n: firstViolation,
    n_needed: I > 1 ? Math.ceil(Math.log(I) / Math.log(2)) + 1 : null,
    conclusion: I > 1
      ? `Ind = ${I} is impossible for a divisible semigroup of endomorphisms: at n = ${firstViolation} ` +
        'the n-th root enters the empty interval (1,2)'
      : 'Ind = 1 is the only value a divisible endomorphic representation can carry',
    scope: 'excludes only the raw semigroup-homomorphic endomorphism route; ' +
      'a channel correspondence may still have finite statistical dimension' };
}

/* ── No-go 2: the irreducible fuzzy sphere ───────────────────────────────── */

/* An SU(2)-covariant trace-preserving conditional expectation on Mat_N is either the
   identity or x -> tau_N(x) 1, and the scalar one has lambda* = 1/N exactly. The window
   endpoints 1/2 and 1/3 are hit by N = 2 and N = 3 and EXCLUDED because the window is
   strict; N >= 4 gives at most 1/4. */
export function fuzzySphereNoGo(N) {
  if (!Number.isInteger(N) || N < 1) throw new RangeError('N must be a positive integer');
  const lambda = 1 / N;
  const inOpenWindow = lambda > 1 / 3 && lambda < 1 / 2;
  return { N, J: (N - 1) / 2, algebra: `Mat_${N}(C)`,
    covariant_expectations: N === 1 ? ['identity'] : ['identity (lambda* = 1)', `scalar (lambda* = 1/${N})`],
    lambda_scalar: lambda, lambda_identity: 1,
    in_open_window: inOpenWindow,
    boundary_case: N === 2 || N === 3,
    conclusion: inOpenWindow
      ? 'unexpected — check the invariant-subalgebra dichotomy'
      : N === 2 ? 'lambda* = 1/2 is the EXCLUDED upper endpoint'
      : N === 3 ? 'lambda* = 1/3 is the EXCLUDED lower endpoint'
      : `lambda* = 1/${N} <= 1/4, far below the window`,
    what_it_does_not_forbid: 'a covariant UCP quantisation map into Mat_N — a channel need not ' +
      'be a conditional expectation onto an invariant subalgebra' };
}

/* ── No-go 3: no consecutive matrix tower ────────────────────────────────── */

/* A unital *-homomorphism Mat_N -> Mat_m exists iff N divides m. m = N+1 fails for N > 1,
   so fuzzy spheres are a regularisation SEQUENCE and the non-integer index lives elsewhere. */
export function matrixTowerNoGo(N) {
  const embeds = m => Number.isInteger(m / N);
  return { N, target: N + 1, unital_embedding_exists: N === 1 ? true : embeds(N + 1),
    multiplicity_required: `m must be divisible by ${N}`,
    smallest_valid_target: 2 * N,
    conclusion: N > 1
      ? `Mat_${N} does not embed unitally in Mat_${N + 1}; the smallest target is Mat_${2 * N}`
      : 'N = 1 is degenerate',
    consequence: 'the fuzzy-sphere sequence is not a Jones tower' };
}

/* ── No-go 4: no irrational integer ladder ───────────────────────────────── */

export function irrationalLadderNoGo(q0, steps = 6) {
  const rows = [];
  let q = q0;
  for (let n = 0; n < steps; n++) {
    const next = q * GOLDEN_INDEX;
    rows.push({ n, q, next, integer: Number.isInteger(next),
      distance_to_integer: Math.abs(next - Math.round(next)) });
    q = next;
  }
  return { q0, ratio: GOLDEN_INDEX, rows, any_integer_step: rows.some(r => r.integer && r.q !== 0),
    conclusion: 'phi^2 is irrational, so phi^2 q is never a nonzero integer when q is' };
}

/* ── The A_4 branch: what the golden index DOES carry ─────────────────────── */

/* B = [[1,0],[1,1]] is the two-step principal-graph transfer, N_tau = [[0,1],[1,1]] is the
   Fibonacci fusion matrix, and BB^T = N_tau^2 = A = [[1,1],[1,2]]. That EXACT integral
   identity is the correct shadow of the irrational Perron-Frobenius eigenvalue.
   A^n is the Fibonacci matrix and Tr A^n = L_{2n}. */
export function a4Transfer(n = 1) {
  const B = [[1, 0], [1, 1]], Ntau = [[0, 1], [1, 1]];
  const mm = (X, Y) => [[X[0][0] * Y[0][0] + X[0][1] * Y[1][0], X[0][0] * Y[0][1] + X[0][1] * Y[1][1]],
                        [X[1][0] * Y[0][0] + X[1][1] * Y[1][0], X[1][0] * Y[0][1] + X[1][1] * Y[1][1]]];
  const A = [[1, 1], [1, 2]];
  const BBt = mm(B, [[B[0][0], B[1][0]], [B[0][1], B[1][1]]]);
  const N2 = mm(Ntau, Ntau);
  /* Fibonacci and Lucas by exact integer recursion, not by rounding a power of phi */
  const F = [0, 1]; for (let i = 2; i <= 2 * n + 2; i++) F.push(F[i - 1] + F[i - 2]);
  const L = [2, 1]; for (let i = 2; i <= 2 * n + 2; i++) L.push(L[i - 1] + L[i - 2]);
  let An = [[1, 0], [0, 1]];
  for (let i = 0; i < n; i++) An = mm(An, A);
  const closed = [[F[2 * n - 1] ?? (n === 0 ? 1 : NaN), F[2 * n]], [F[2 * n], F[2 * n + 1]]];
  if (n === 0) { closed[0][0] = 1; closed[0][1] = 0; closed[1][0] = 0; closed[1][1] = 1; }
  const spec = jacobiEigenvalues(A);
  return {
    n, B, N_tau: Ntau, A,
    BBt, N_tau_squared: N2,
    identity_holds: BBt.flat().every((v, i) => v === N2.flat()[i] && v === A.flat()[i]),
    A_power: An, closed_form: closed,
    power_matches_fibonacci: An.flat().every((v, i) => v === closed.flat()[i]),
    trace: An[0][0] + An[1][1], lucas_2n: n === 0 ? 2 : L[2 * n],
    trace_is_lucas: (An[0][0] + An[1][1]) === (n === 0 ? 2 : L[2 * n]),
    spectrum: spec, det_A: 1,
    spectrum_closed: [1 / GOLDEN_INDEX, GOLDEN_INDEX],
    spectrum_residual: Math.max(Math.abs(spec[0] - 1 / GOLDEN_INDEX), Math.abs(spec[1] - GOLDEN_INDEX)),
    cayley_hamilton: 'A^2 - 3A + 1 = 0',
    fibonacci_from_index: (Math.pow(GOLDEN_INDEX, n) - Math.pow(GOLDEN_INDEX, -n)) / Math.sqrt(5),
    F_2n: n === 0 ? 0 : F[2 * n]
  };
}

/* the ADE window: ||G||^2 strictly inside (2,3) selects A_4 among connected principal
   graphs, because A_3, A_4, A_5 sit at 2, phi^2, 3 and the first D case is already at 3 */
export function adeWindow(normSquared, tol = 1e-9) {
  const cand = [];
  for (let n = 2; n <= 12; n++) cand.push({ graph: `A_${n}`, norm_squared: 4 * Math.cos(Math.PI / (n + 1)) ** 2 });
  cand.push({ graph: 'D_4', norm_squared: 3 }, { graph: 'E_6', norm_squared: 4 * Math.cos(Math.PI / 12) ** 2 });
  const inWindow = normSquared > 2 + tol && normSquared < 3 - tol;
  const hits = cand.filter(c => c.norm_squared > 2 + tol && c.norm_squared < 3 - tol);
  return { norm_squared: normSquared, in_window: inWindow,
    candidates_in_window: hits,
    selected: inWindow && hits.length === 1 ? hits[0].graph : null,
    index: inWindow ? GOLDEN_INDEX : null,
    conditional_on: 'full commuting-square / principal-graph hypotheses; an integer graph ' +
      'extracted from a matrix regularisation is not enough' };
}

/* Fibonacci data downstream of A_4 — and the quantities that must NOT be merged */
export function fibonacciFibre(nEmb = 0) {
  return {
    fusion_rule: 'tau x tau = 1 + tau',
    quantum_dimension: PHI,
    charged_sector_index: GOLDEN_INDEX,
    global_dimension: 1 + GOLDEN_INDEX,                    /* = phi + 2 */
    global_dimension_alt: PHI + 2,
    distinct_quantities: ['d_tau = phi', 'I_tau = phi^2', 'mu_Fib = 1 + phi^2 = phi + 2'],
    /* an extensive Fibonacci degree of freedom per embadon grows as phi^N and contributes
       O(q) to the effective action — part of I_q^UV, never a second selector factor */
    state_space_factor_log: nEmb * Math.log(PHI),
    state_space_factor: Math.pow(PHI, nEmb),
    contributes_to: 'the primitive sequence I_q^UV (an O(q) term after unit-weight locking)',
    not_a_count: 'the existence of a Fibonacci fibre does not give N_emb = I_tau or N_emb = d_tau',
    chirality_undetermined: true,
    chirality_note: 'opposite braidings share the fusion ring and quantum dimensions; ' +
      'modular T / framing is an independent datum'
  };
}

/* Jones tower depth is an operator-algebraic grading, NOT a geometric shell number */
export function jonesTower(depth, elementaryIndex = GOLDEN_INDEX) {
  const rows = [];
  for (let n = 0; n <= depth; n++)
    rows.push({ n, index: Math.pow(elementaryIndex, n), log_index: n * Math.log(elementaryIndex) });
  return { elementary_index: elementaryIndex, depth, rows,
    is_geometric_shell: false,
    note: 'a canonical grading of the tower; the entropy typing forbids reading it as a ' +
      'constant multiplicative ladder of horizon areas' };
}

export const JONES_EQUATIONS = Object.freeze([
  '[M:N] in {4 cos^2(pi/m)} u [4, inf)',
  'lambda*(E)^{-1} = [M:N]',
  '1/3 < lambda* < 1/2  =>  [M:N] = 4cos^2(pi/5) = (3+sqrt5)/2 = phi^2',
  'Ind(Theta_g) = Ind(Theta_{h_n})^n and no index lies in (1,2) => Ind = 1',
  'lambda*(x -> tau_N(x)1) = 1/N',
  'Mat_N -> Mat_m unital  <=>  N | m',
  'BB^T = N_tau^2 = A = [[1,1],[1,2]], Spec A = {phi^2, phi^-2}, det A = 1',
  'A^n = [[F_{2n-1}, F_{2n}],[F_{2n}, F_{2n+1}]], Tr A^n = L_{2n}',
  'mu_Fib = 1 + d_tau^2 = phi + 2'
]);
