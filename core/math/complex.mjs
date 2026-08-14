/* Minimal complex arithmetic. Plain objects so every result is JSON-serialisable. */
export const C  = (re = 0, im = 0) => ({ re, im });
export const add = (a, b) => C(a.re + b.re, a.im + b.im);
export const sub = (a, b) => C(a.re - b.re, a.im - b.im);
export const mul = (a, b) => C(a.re * b.re - a.im * b.im, a.re * b.im + a.im * b.re);
export const div = (a, b) => { const d = b.re * b.re + b.im * b.im;
  return C((a.re * b.re + a.im * b.im) / d, (a.im * b.re - a.re * b.im) / d); };
export const conj = a => C(a.re, -a.im);
export const abs  = a => Math.hypot(a.re, a.im);
export const arg  = a => Math.atan2(a.im, a.re);
export const scale= (a, s) => C(a.re * s, a.im * s);
export const inv  = a => div(C(1, 0), a);
export const exp  = a => { const e = Math.exp(a.re); return C(e * Math.cos(a.im), e * Math.sin(a.im)); };
export const sqrtC= a => { const r = abs(a), t = arg(a) / 2, s = Math.sqrt(r);
  return C(s * Math.cos(t), s * Math.sin(t)); };
