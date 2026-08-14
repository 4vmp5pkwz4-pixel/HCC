/* Real linear least squares by normal equations with Tikhonov-free Gaussian elimination and
   partial pivoting, plus the condition estimate the caller must be told about. Small, dense
   and auditable — the systems here are at most a few dozen columns. */
export function lstsq(A, y) {
  const m = A.length, n = A[0].length;
  const AtA = Array.from({ length: n }, () => new Float64Array(n));
  const Aty = new Float64Array(n);
  for (let i = 0; i < m; i++) for (let j = 0; j < n; j++) {
    Aty[j] += A[i][j] * y[i];
    for (let k = j; k < n; k++) AtA[j][k] += A[i][j] * A[i][k];
  }
  for (let j = 0; j < n; j++) for (let k = 0; k < j; k++) AtA[j][k] = AtA[k][j];
  /* condition estimate from the diagonal spread before elimination */
  let dmin = Infinity, dmax = 0;
  for (let j = 0; j < n; j++) { dmin = Math.min(dmin, Math.abs(AtA[j][j])); dmax = Math.max(dmax, Math.abs(AtA[j][j])); }
  const M = AtA.map((r, i) => Array.from(r).concat([Aty[i]]));
  for (let c = 0; c < n; c++) {
    let p = c; for (let r = c + 1; r < n; r++) if (Math.abs(M[r][c]) > Math.abs(M[p][c])) p = r;
    [M[c], M[p]] = [M[p], M[c]];
    if (Math.abs(M[c][c]) < 1e-300) continue;
    for (let r = 0; r < n; r++) { if (r === c) continue; const f = M[r][c] / M[c][c];
      for (let k = c; k <= n; k++) M[r][k] -= f * M[c][k]; }
  }
  const x = new Float64Array(n);
  for (let c = 0; c < n; c++) x[c] = Math.abs(M[c][c]) < 1e-300 ? 0 : M[c][n] / M[c][c];
  const resid = new Float64Array(m);
  for (let i = 0; i < m; i++) { let s = 0; for (let j = 0; j < n; j++) s += A[i][j] * x[j]; resid[i] = y[i] - s; }
  return { x: Array.from(x), residuals: Array.from(resid),
    condition_estimate: dmin > 0 ? Math.sqrt(dmax / dmin) : Infinity };
}
