import { C, add, sub, mul, div, abs } from './complex.mjs';
/* Durand–Kerner: all roots of a complex polynomial at once, no companion matrix and no
   eigensolver. Chosen because it is short enough to audit and converges quadratically for
   simple roots, which is the case that matters for pole extraction. */
export function polyRoots(coeffs, { iters = 500, tol = 1e-14 } = {}) {
  /* coeffs[i] multiplies s^i; highest first is NOT assumed */
  let a = coeffs.slice();
  while (a.length > 1 && abs(a[a.length - 1]) < 1e-300) a.pop();
  const n = a.length - 1;
  if (n < 1) return [];
  const lead = a[n];
  a = a.map(c => div(c, lead));
  const evalAt = z => { let r = C(0, 0);
    for (let i = n; i >= 0; i--) r = add(mul(r, z), a[i]); return r; };
  let roots = [];
  for (let i = 0; i < n; i++) { const t = 0.4 + 0.9 * i;
    roots.push(C(0.4 * Math.cos(t) + 0.9, 0.4 * Math.sin(t) + 0.9)); }
  for (let it = 0; it < iters; it++) {
    let moved = 0;
    for (let i = 0; i < n; i++) {
      let den = C(1, 0);
      for (let j = 0; j < n; j++) if (j !== i) den = mul(den, sub(roots[i], roots[j]));
      if (abs(den) < 1e-300) continue;
      const d = div(evalAt(roots[i]), den);
      roots[i] = sub(roots[i], d);
      moved = Math.max(moved, abs(d));
    }
    if (moved < tol) break;
  }
  return roots;
}
