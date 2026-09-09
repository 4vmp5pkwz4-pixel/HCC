const NUMERICAL_CONTROLS = new Map([
  ['ns.step', {
    kind: 'NUMERICAL_CONTROL',
    reason: 'Known integration-step control. Its propagated response describes numerical convergence/discretisation sensitivity, not a physical intervention.'
  }]
]);

function finiteNumber(value) {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function cloneIdentity(identity = {}) {
  return {
    version: typeof identity.version === 'string' ? identity.version : null,
    build: typeof identity.build === 'string' ? identity.build : null
  };
}

export function controlSemantics(control) {
  const key = String(control || '');
  const known = NUMERICAL_CONTROLS.get(key);
  if (known) return { control: key, ...known };
  return {
    control: key,
    kind: 'PHYSICAL_OR_MODEL',
    reason: 'Atlas input declarations do not yet type every control as independently physical versus model/numerical. This control may be a physical quantity or a model parameter; no stronger claim is made.'
  };
}

export function validateReachArtifact(reach, identity = null) {
  if (!reach || typeof reach !== 'object' || Array.isArray(reach)) {
    return { ok: false, error: 'reach artifact must be an object' };
  }
  if (reach.schema !== 'hcc.reach/1') {
    return { ok: false, error: `reach schema mismatch: ${String(reach.schema)}` };
  }
  if (!Array.isArray(reach.chains)) {
    return { ok: false, error: 'reach chains must be an array' };
  }
  if (reach.chains.some(c => !c || typeof c !== 'object' || Array.isArray(c))) {
    return { ok: false, error: 'every reach chain must be an object' };
  }
  if (identity) {
    const expected = cloneIdentity(identity);
    if (expected.version && reach.version !== expected.version) {
      return { ok: false, error: `reach version mismatch: ${String(reach.version)} != ${expected.version}` };
    }
    if (expected.build && reach.build !== expected.build) {
      return { ok: false, error: `reach build mismatch: ${String(reach.build)} != ${expected.build}` };
    }
  }
  return { ok: true, error: null };
}

export function listReachControls(reach) {
  const verdict = validateReachArtifact(reach);
  if (!verdict.ok) throw new Error(verdict.error);
  return [...new Set(reach.chains.map(c => String(c && c.control || '')).filter(Boolean))].sort();
}

function forecastability(chain) {
  if (chain && chain.power_law === true && finiteNumber(chain.exponent) !== null) return 'SCALING_LAW';
  if (chain && chain.power_law === false) return 'LOCAL_ONLY';
  return 'UNJUDGED';
}

function evidence(chain) {
  return {
    near_r2: finiteNumber(chain && chain.near_r2),
    near_covered: finiteNumber(chain && chain.near_covered),
    far_r2: finiteNumber(chain && chain.far_r2),
    far_drift: finiteNumber(chain && chain.far_drift),
    far_live: finiteNumber(chain && chain.far_live),
    holds_on: chain && chain.holds_on != null ? chain.holds_on : null,
    why: String(chain && chain.why || '')
  };
}

function intervalForExponent(exponent, delta) {
  const a = Number(exponent);
  const loInput = 1 - delta;
  const hiInput = 1 + delta;
  const u = Math.pow(loInput, a);
  const v = Math.pow(hiInput, a);
  if (!Number.isFinite(u) || !Number.isFinite(v) || u <= 0 || v <= 0) return null;
  return { low: Math.min(u, v), high: Math.max(u, v) };
}

export function forecastReach(reach, control, delta = 0.1, identity = null) {
  const verdict = validateReachArtifact(reach, identity);
  if (!verdict.ok) throw new Error(verdict.error);
  const d = finiteNumber(delta);
  if (d === null || d < 0 || d >= 1) {
    throw new RangeError('delta must be finite and satisfy 0 <= delta < 1 so the symmetric lower input ratio stays positive');
  }
  const key = String(control || '');
  const semantics = controlSemantics(key);
  const chains = reach.chains.filter(c => String(c && c.control || '') === key);
  const results = chains.map(chain => {
    const cls = forecastability(chain);
    const exponent = finiteNumber(chain.exponent);
    let responseRatio = null;
    let intervalRatio = null;
    if (cls === 'SCALING_LAW') {
      const r = Math.pow(1 + d, exponent);
      const interval = intervalForExponent(exponent, d);
      if (Number.isFinite(r) && interval) {
        responseRatio = r;
        intervalRatio = interval;
      }
    }
    return {
      control: key,
      control_semantics: semantics,
      through: String(chain.through || ''),
      reaches: String(chain.reaches || ''),
      route: String(chain.route || ''),
      laboratories: finiteNumber(chain.laboratories),
      exponent,
      forecastability: cls,
      domain_status: 'NOT_ESTABLISHED_FOR_INTERVENTION',
      interpretation: semantics.kind === 'NUMERICAL_CONTROL' ? 'NUMERICAL_SENSITIVITY' : 'CONDITIONAL_MODEL_SCALING',
      response_ratio: responseRatio,
      interval_ratio: intervalRatio,
      evidence: evidence(chain)
    };
  });
  const counts = { SCALING_LAW: 0, LOCAL_ONLY: 0, UNJUDGED: 0 };
  for (const row of results) counts[row.forecastability] += 1;
  return {
    schema: 'hcc.predictive-reach-forecast/1',
    status: chains.length ? 'OK' : 'NO_REACH',
    source: { schema: reach.schema, version: reach.version, build: reach.build },
    control: key,
    control_semantics: semantics,
    empirical_validation: false,
    uncertainty: {
      kind: 'PARAMETER_SCENARIO',
      coverage_probability: null,
      note: 'Endpoints propagate the chosen input perturbation through a fitted scaling exponent. They are not a confidence or prediction interval. Exponent uncertainty, model discrepancy and validity of the requested intervention are not established by this artifact.'
    },
    delta: d,
    input_ratio: 1 + d,
    symmetric_input_ratio: { low: 1 - d, high: 1 + d },
    counts,
    results
  };
}
