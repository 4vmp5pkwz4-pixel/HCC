/* Complete elliptic integrals by the arithmetic–geometric mean: K to machine precision in
   about six iterations, and E from the AGM's own convergents. Used by the mutual-inductance
   formula, which is exact for coaxial circular filaments and therefore worth doing exactly. */
export function ellipK(k) {
  let a = 1, b = Math.sqrt(1 - k * k);
  for (let i = 0; i < 60 && Math.abs(a - b) > 1e-17; i++) { const t = (a + b) / 2; b = Math.sqrt(a * b); a = t; }
  return Math.PI / (2 * a);
}
export function ellipE(k) {
  let a = 1, b = Math.sqrt(1 - k * k), c = k, sum = c * c / 2, p = 1;
  for (let i = 0; i < 60 && Math.abs(c) > 1e-17; i++) {
    const t = (a + b) / 2; c = (a - b) / 2; b = Math.sqrt(a * b); a = t;
    p *= 2; sum += p * c * c / 2;
  }
  return ellipK(k) * (1 - sum);
}
