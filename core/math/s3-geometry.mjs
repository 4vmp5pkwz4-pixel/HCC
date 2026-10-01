/** Round spatial S³ in unit R⁴ coordinates. No renderer coordinates or cosmological fit. */
function vector(value, length, name) {
  if (!Array.isArray(value) || value.length !== length || value.some(v => typeof v !== 'number' || !Number.isFinite(v))) {
    throw new TypeError(`${name} must be an array of ${length} finite numbers`);
  }
  return value;
}

function unitPoint(value, name) {
  const p = vector(value, 4, name);
  const norm = Math.hypot(...p);
  if (Math.abs(norm - 1) > 1e-10) throw new RangeError(`${name} must lie on the unit S³ sphere`);
  return norm === 1 ? p : p.map(v => v / norm);
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
  // Use the transverse norm before division: squared components underflow near the pole.
  const transverse = Math.hypot(q[0], q[1], q[2]);
  if (transverse === 0 && q[3] > 0) throw new RangeError('north pole is excluded from the stereographic chart');
  const x = q[3] > 0
    ? q.slice(0, 3).map(v => (v / transverse) * ((1 + q[3]) / transverse))
    : q.slice(0, 3).map(v => v / (1 - q[3]));
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

function quaternionProduct(a,b) {
  const [x,y,z,w]=a,[X,Y,Z,W]=b;
  return [w*X+W*x+y*Z-z*Y,w*Y+W*y+z*X-x*Z,w*Z+W*z+x*Y-y*X,w*W-x*X-y*Y-z*Z];
}

/** Spin(4): left·point·conjugate(right). Quaternions use [x,y,z,w], scalar last. */
export function s3RotateSpin4(point,left,right) {
  const p=unitPoint(point,'point'),l=unitPoint(left,'left quaternion'),r=unitPoint(right,'right quaternion');
  return quaternionProduct(quaternionProduct(l,p),[-r[0],-r[1],-r[2],r[3]]);
}

/** Push forward a tangent in R⁴ to dimensional stereographic X=R·q_xyz/(1-q_w).
 * For surface lighting transform TWO independent tangents, then take their cross
 * product. Multiplying an existing 3D normal by a scalar and normalizing cannot do this.
 */
export function s3StereographicDifferential(point,tangent,radius=1) {
  const q=unitPoint(point,'point'),v=vector(tangent,4,'tangent');
  if(!Number.isFinite(radius)||radius<=0)throw new RangeError('radius must be finite and positive');
  const norm=Math.hypot(...v),dot=q.reduce((s,w,i)=>s+w*v[i],0);
  if(Math.abs(dot)>1e-10*Math.max(norm,Number.MIN_VALUE))throw new RangeError('vector must be tangent to S³ at point');
  const x=s3ToStereographic(q);
  const d=q[3]>0?(q[0]**2+q[1]**2+q[2]**2)/(1+q[3]):1-q[3];
  const out=x.map((w,i)=>radius*(v[i]+w*v[3])/d);
  if(out.some(w=>!Number.isFinite(w)))throw new RangeError('differential is outside float64 range in this chart');
  return out;
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
  const p = unitPoint(from, 'from'), q = unitPoint(to, 'to');
  const length = s3GeodesicDistance(p, q, radius);
  return {
    schema: 'hcc.s3-measurement/1', status: 'CONDITIONAL', metric: 'round-spatial-s3',
    from: [...p], to: [...q], radius, unit, length,
    angle_rad: length / radius, precision: 'float64',
    shortest_path_unique: !p.every((v, i) => v === -q[i]),
    assumptions: ['unit native R⁴ coordinates on a round spatial S³',
      'radius and unit supplied by the caller; no observational inference'],
    provenance: {equation: 'R·2 atan2(|p−q|, |p+q|)', source: 'core/math/s3-geometry.mjs'},
  };
}
