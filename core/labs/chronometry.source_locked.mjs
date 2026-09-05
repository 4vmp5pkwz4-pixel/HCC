const abs = x => x < 0n ? -x : x;
function gcd(a, b) {
  a = abs(a); b = abs(b);
  while (b) { const t = a % b; a = b; b = t; }
  return a || 1n;
}
export function makeRational(n, d = 1n) {
  n = BigInt(n); d = BigInt(d);
  if (d === 0n) throw new RangeError('zero denominator');
  if (d < 0n) { n = -n; d = -d; }
  const g = gcd(n, d);
  return Object.freeze({ n: n / g, d: d / g });
}
export const mul = (a, b) => makeRational(a.n * b.n, a.d * b.d);
export const div = (a, b) => makeRational(a.n * b.d, a.d * b.n);
export const add = (a, b) => makeRational(a.n * b.d + b.n * a.d, a.d * b.d);
export const sub = (a, b) => makeRational(a.n * b.d - b.n * a.d, a.d * b.d);
export const toNumber = r => Number(r.n) / Number(r.d);
export function toDecimal(r, digits = 12) {
  if (!Number.isInteger(digits) || digits < 0 || digits > 1000) throw new RangeError('digits must be an integer in [0,1000]');
  const neg = r.n < 0n;
  let n = neg ? -r.n : r.n;
  const q = n / r.d;
  let rem = n % r.d;
  if (digits === 0) return `${neg ? '-' : ''}${q}`;
  let s = '';
  for (let i = 0; i < digits; i++) { rem *= 10n; s += (rem / r.d).toString(); rem %= r.d; }
  return `${neg ? '-' : ''}${q}.${s}`;
}
export const calibrateFromDay = (partsPerDay, secondsPerDay = 86400n) => makeRational(secondsPerDay, partsPerDay);
