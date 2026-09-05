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

const REQUIRED_SOURCE_FIELDS = ['id','normalized_term','quantity_kind','tradition','text','operational_definition','epistemic_status','citation'];
export function validateSourceRecord(record) {
  if (!record || typeof record !== 'object') return false;
  for (const key of REQUIRED_SOURCE_FIELDS) if (typeof record[key] !== 'string' || record[key].trim() === '') return false;
  if (record.chain_to_day !== undefined && (!Array.isArray(record.chain_to_day) || record.chain_to_day.length === 0 || record.chain_to_day.some(x => !Number.isInteger(x) || x <= 0))) return false;
  return true;
}
export function derivePartsPerDay(record) {
  if (!validateSourceRecord(record)) throw new TypeError('invalid source record');
  if (!Array.isArray(record.chain_to_day)) throw new RangeError('source record has no exact chain_to_day');
  return record.chain_to_day.reduce((p, x) => p * BigInt(x), 1n);
}
export function groupDefinitionConflicts(records) {
  const byTerm = Object.create(null);
  for (const record of records) {
    if (!validateSourceRecord(record)) throw new TypeError(`invalid source record: ${record && record.id ? record.id : 'unknown'}`);
    const term = record.normalized_term;
    (byTerm[term] ||= []).push(record);
  }
  const out = Object.create(null);
  for (const [term, rs] of Object.entries(byTerm)) {
    const signatures = new Set(rs.map(r => r.operational_definition.trim()));
    if (rs.length > 1 && signatures.size > 1) out[term] = { ids: rs.map(r => r.id), definitions: [...signatures], conflicting: true };
  }
  return out;
}
