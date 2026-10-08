/**
 * S³ radial finite-band cap observability: pure mathematical reference kernel.
 *
 * Compact round S³, harmonics degree <= L, cap angular radius chi in (0,pi].
 * Returns exact defining integrals and numerically evaluated energies.
 * No light propagation, detector, cosmological evidence, or derivation of phi.
 */
export const GOLDEN_RATIO = (1 + Math.sqrt(5)) / 2;

function validL(L) {
  if (!Number.isInteger(L) || L < 0 || L > 24)
    throw new RangeError('L must be an integer in [0,24]');
}
function validChi(chi) {
  if (!Number.isFinite(chi) || !(chi > 0 && chi <= Math.PI))
    throw new RangeError('chi must belong to (0,pi]');
}
export function fullHarmonicBandDimension(L) {
  validL(L);
  return (L + 1) * (L + 2) * (2 * L + 3) / 6;
}
/* Global squared norm of f_L=(1-cos t)^L with radial sin²t weight. */
export function witnessDenominator(L) {
  validL(L);
  let d = Math.PI / 2;
  for (let k = 1; k <= L; ++k) {
    const a = 2 * k - 0.5;
    d *= 4 * a * (a + 1) / ((a + 1.5) * (a + 2.5));
  }
  return d;
}
export function leadingCapCoefficient(L) {
  return 1 / ((4 * L + 3) * 2 ** (2 * L) * witnessDenominator(L));
}
export function generalizedJacobiLeadingCoefficient(L) {
  validL(L);
  let c = 1;
  for (let j = 1; j <= L; ++j) c *= (L + 0.5 + j) / j;
  return c;
}
/* Sharp leading asymptotic for *radial* minimum eigenvalue, fixed L. */
export function sharpRadialCoefficient(L) {
  const b = generalizedJacobiLeadingCoefficient(L);
  return leadingCapCoefficient(L) / (b * b);
}
function sinc(x) {
  if (Math.abs(x) < 1e-6) {
    const y = x * x;
    return 1 - y / 6 + y * y / 120 - y * y * y / 5040;
  }
  return Math.sin(x) / x;
}
function simpson01(f, N = 2048) {
  let acc = f(0) + f(1);
  for (let j = 1; j < N; ++j) acc += (j % 2 ? 4 : 2) * f(j / N);
  return acc / (3 * N);
}
/* Positive, cancellation-free integration of the cap energy fraction. */
export function witnessFraction(L, chi) {
  validL(L); validChi(chi);
  if (chi === Math.PI) return 1;
  const numerator = simpson01(u => {
    const t = chi * u;
    return u ** (4 * L + 2) * sinc(t / 2) ** (4 * L) * sinc(t) ** 2;
  });
  return chi ** (4 * L + 3) * numerator /
    (2 ** (2 * L) * witnessDenominator(L));
}
export function capVolumeFraction(chi) {
  validChi(chi);
  if (chi < 0.1) return witnessFraction(0, chi);
  return (chi - 0.5 * Math.sin(2 * chi)) / Math.PI;
}
export function capFractionPowerBound(L, chi) {
  validL(L); validChi(chi);
  return leadingCapCoefficient(L) * chi ** (4 * L + 3);
}
export function gramEntry(l, m, chi) {
  if (!Number.isInteger(l) || !Number.isInteger(m) || l < 0 || m < 0)
    throw new RangeError('harmonic indices must be nonnegative integers');
  validL(Math.max(l, m)); validChi(chi);
  if (l === m)
    return (chi - Math.sin(2 * (l + 1) * chi) / (2 * (l + 1))) / Math.PI;
  return (Math.sin((l - m) * chi) / (l - m) -
    Math.sin((l + m + 2) * chi) / (l + m + 2)) / Math.PI;
}
export function radialGram(L, chi) {
  validL(L); validChi(chi);
  return Array.from({ length: L + 1 }, (_, l) =>
    Array.from({ length: L + 1 }, (_, m) => gramEntry(l, m, chi)));
}
/* Necessary instability bound, NOT a sufficient inversion estimate. */
export function inverseAmplificationAtLeast(L, chi) {
  return 1 / Math.sqrt(witnessFraction(L, chi));
}
export function ladderScenario({ L, level, referenceRadius, physicalAperture, base = GOLDEN_RATIO }) {
  validL(L);
  if (!Number.isInteger(level) || level < 0 || level > 400 ||
      !Number.isFinite(referenceRadius) || !(referenceRadius > 0) ||
      !Number.isFinite(physicalAperture) || !(physicalAperture > 0) ||
      !Number.isFinite(base) || !(base > 1))
    throw new RangeError('positive finite radii, base>1, integer level [0,400] required');
  const R = referenceRadius * base ** level;
  const chi = physicalAperture / R;
  validChi(chi);
  return Object.freeze({ L, level, base, R, chi,
    modes: fullHarmonicBandDimension(L), capFraction: capVolumeFraction(chi),
    witnessFraction: witnessFraction(L, chi),
    inverseAmplificationAtLeast: inverseAmplificationAtLeast(L, chi),
    status: 'conditional_ansatz', baseOrigin: 'not_derived' });
}
