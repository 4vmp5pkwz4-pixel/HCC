/** Round spatial S³ in unit R⁴ coordinates. No renderer coordinates or cosmological fit. */
function vector(value, length, name) {
  if (!Array.isArray(value) || value.length !== length || value.some(v => typeof v !== 'number' || !Number.isFinite(v))) {
    throw new TypeError(`${name} must be an array of ${length} finite numbers`);
  }
  return value;
}

function unitPoint(value, name) {
  const p = vector(value, 4, name);
  if (Math.abs(Math.hypot(...p) - 1) > 1e-10) throw new RangeError(`${name} must lie on the unit S³ sphere`);
  return p;
}

/** North-pole chart x = (q0,q1,q2)/(1-q3); the chart coordinates are dimensionless. */
export function stereographicToS3(chart) {
  const x = vector(chart, 3, 'chart');
  const r = Math.hypot(...x);
  if (!Number.isFinite(r)) throw new RangeError('chart magnitude is outside float64 range');
  if (r <= 1) {
    const d = 1 + r * r;
    return [2 * x[0] / d, 2 * x[1] / d, 2 * x[2] / d, (r * r - 1) / d];
  }
  // Divide by r before squaring: a distant finite chart point need not overflow r².
  const inverse = 1 / r, d = 1 + inverse * inverse;
  return [2 * (x[0] / r) * inverse / d, 2 * (x[1] / r) * inverse / d,
    2 * (x[2] / r) * inverse / d, (1 - inverse * inverse) / d];
}

export function s3ToStereographic(point) {
  const q = unitPoint(point, 'point');
  // Near the north pole 1-q3 suffers cancellation (q3 can round to exactly 1).
  // On the unit sphere, (1-q3) = (q0²+q1²+q2²)/(1+q3).
  const d = q[3] > 0
    ? (q[0] * q[0] + q[1] * q[1] + q[2] * q[2]) / (1 + q[3])
    : 1 - q[3];
  if (d === 0) throw new RangeError('north pole is excluded from the stereographic chart');
  const x = q.slice(0, 3).map(v => v / d);
  if (x.some(v => !Number.isFinite(v))) throw new RangeError('projected chart coordinate is outside float64 range');
  return x;
}

/** ds² = [2R/(1+|x|²)]² |dx|² for dimensionless chart x. */
export function s3ConformalFactor(chart) {
  const x = vector(chart, 3, 'chart');
  const r = Math.hypot(...x);
  if (!Number.isFinite(r)) throw new RangeError('chart magnitude is outside float64 range');
  const factor = r <= 1 ? 2 / (1 + r * r) : 2 * (1 / r) ** 2 / (1 + (1 / r) ** 2);
  if (factor === 0) throw new RangeError('metric is below float64 resolution in this chart');
  return factor;
}

/** Stable at very small separations and at antipodes. Radius uses the caller's unit. */
export function s3GeodesicDistance(from, to, radius = 1) {
  const p = unitPoint(from, 'from'), q = unitPoint(to, 'to');
  if (typeof radius !== 'number' || !Number.isFinite(radius) || radius <= 0) {
    throw new RangeError('radius must be a finite positive number');
  }
  const minus = Math.hypot(...p.map((v, i) => v - q[i]));
  const plus = Math.hypot(...p.map((v, i) => v + q[i]));
  const arc = radius * 2 * Math.atan2(minus, plus);
  if (!Number.isFinite(arc)) throw new RangeError('arc length is outside float64 range');
  return arc;
}

/** Hopf map C² -> S²; simultaneous phase rotation of z1 and z2 leaves it fixed. */
export function hopfBase(point) {
  const [a, b, c, d] = unitPoint(point, 'point');
  return [2 * (a * c + b * d), 2 * (b * c - a * d), a * a + b * b - c * c - d * d];
}

/** A mathematical measurement conditional on the supplied round-S³ radius. */
export function measureS3({from, to, radius, unit} = {}) {
  if (typeof unit !== 'string' || !unit.trim()) throw new TypeError('unit must be an explicit non-empty string');
  if (typeof radius !== 'number' || !Number.isFinite(radius) || radius <= 0) {
    throw new RangeError('radius must be supplied explicitly as a finite positive number');
  }
  const length = s3GeodesicDistance(from, to, radius);
  return {
    schema: 'hcc.s3-measurement/1', status: 'CONDITIONAL', metric: 'round-spatial-s3',
    from: [...from], to: [...to], radius, unit, length,
    angle_rad: length / radius, precision: 'float64',
    shortest_path_unique: !from.every((v, i) => v === -to[i]),
    assumptions: ['unit native R⁴ coordinates on a round spatial S³',
      'radius and unit supplied by the caller; no observational inference'],
    provenance: {equation: 'R·2 atan2(|p−q|, |p+q|)', source: 'core/math/s3-geometry.mjs'},
  };
}
