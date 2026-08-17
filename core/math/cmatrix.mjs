/* ── DENSE COMPLEX LINEAR ALGEBRA, SMALL AND AUDITABLE ───────────────────────
   Rank, determinant and kernel dimension for the confluent evaluation matrices of the
   CP^1 locking problem. The matrices are at most a few dozen rows, so the honest thing
   is Gaussian elimination with full partial pivoting and a declared tolerance — not an
   SVD nobody here would be able to check.

   The tolerance is RETURNED, never hidden. A rank is a statement about how far a pivot
   is from zero, and a routine that decides that silently is deciding physics silently. */
import { C, add, sub, mul, div, abs, scale } from './complex.mjs';

const clone = A => A.map(r => r.map(z => C(z.re, z.im)));

/* row-echelon with partial pivoting; returns the pivots actually used and the running
   product of them, which is the determinant up to the sign of the permutation */
function eliminate(A0, tol) {
  const A = clone(A0), m = A.length, n = m ? A[0].length : 0;
  let det = C(1, 0), swaps = 0, row = 0;
  const pivots = [];
  for (let col = 0; col < n && row < m; col++) {
    let best = row, bestMag = abs(A[row][col]);
    for (let r = row + 1; r < m; r++) { const g = abs(A[r][col]); if (g > bestMag) { bestMag = g; best = r; } }
    if (bestMag <= tol) { det = C(0, 0); continue; }          /* a column with no pivot */
    if (best !== row) { [A[row], A[best]] = [A[best], A[row]]; swaps++; }
    const p = A[row][col];
    pivots.push(bestMag);
    det = mul(det, p);
    for (let r = row + 1; r < m; r++) {
      if (abs(A[r][col]) === 0) continue;
      const f = div(A[r][col], p);
      for (let k = col; k < n; k++) A[r][k] = sub(A[r][k], mul(f, A[row][k]));
    }
    row++;
  }
  if (swaps % 2) det = scale(det, -1);
  return { echelon: A, rank: row, det, pivots, swaps };
}

/* The scale-aware default: a pivot is zero when it is small compared with the largest
   entry the matrix ever had, not when it is small compared with 1. A matrix of radii
   10^-9 is not a matrix of rank zero. */
export function matrixTolerance(A, rel = 1e-11) {
  let big = 0;
  for (const r of A) for (const z of r) big = Math.max(big, abs(z));
  const n = Math.max(1, A.length, A[0] ? A[0].length : 1);
  return Math.max(big * n * rel, Number.MIN_VALUE * 1e12);
}

export function rank(A, tol) {
  if (!A.length || !A[0].length) return 0;
  return eliminate(A, tol ?? matrixTolerance(A)).rank;
}

export function det(A, tol) {
  if (!A.length) return C(1, 0);
  if (A.length !== A[0].length) throw new Error('determinant of a non-square matrix');
  return eliminate(A, tol ?? matrixTolerance(A)).det;
}

/* rank, kernel and cokernel in one pass, because the locking theorem is a statement
   about all three at once and computing them separately invites them to disagree */
export function rankProfile(A, tol) {
  const m = A.length, n = m ? A[0].length : 0;
  const t = tol ?? matrixTolerance(A);
  const { rank: r, pivots } = eliminate(A, t);
  return { rows: m, cols: n, rank: r, kernel_dim: n - r, cokernel_dim: m - r,
    tolerance: t, smallest_pivot: pivots.length ? Math.min(...pivots) : 0,
    largest_pivot: pivots.length ? Math.max(...pivots) : 0 };
}

/* real symmetric eigenvalues by cyclic Jacobi — used for the 2x2 transfer matrices of the
   A4 branch, where a closed form exists and the numerical route is the check on it */
export function jacobiEigenvalues(S, sweeps = 64) {
  const n = S.length, A = S.map(r => r.slice());
  for (let s = 0; s < sweeps; s++) {
    let off = 0;
    for (let p = 0; p < n; p++) for (let q = p + 1; q < n; q++) off += A[p][q] * A[p][q];
    if (off < 1e-30) break;
    for (let p = 0; p < n; p++) for (let q = p + 1; q < n; q++) {
      if (Math.abs(A[p][q]) < 1e-300) continue;
      const theta = (A[q][q] - A[p][p]) / (2 * A[p][q]);
      const t = Math.sign(theta || 1) / (Math.abs(theta) + Math.sqrt(theta * theta + 1));
      const c = 1 / Math.sqrt(t * t + 1), sn = t * c;
      for (let k = 0; k < n; k++) {
        const akp = A[k][p], akq = A[k][q];
        A[k][p] = c * akp - sn * akq; A[k][q] = sn * akp + c * akq;
      }
      for (let k = 0; k < n; k++) {
        const apk = A[p][k], aqk = A[q][k];
        A[p][k] = c * apk - sn * aqk; A[q][k] = sn * apk + c * aqk;
      }
    }
  }
  return A.map((r, i) => r[i]).sort((a, b) => a - b);
}

export { add, sub, mul, div, abs, C };
