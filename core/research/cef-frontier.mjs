/**
 * CEF frontier: exact algebraic model formulas, not physical evidence.
 * The formulas are independent of HCC visual rendering and source assumptions.
 * References and scoped mathematical proofs:
 * docs/CEF_OPERATOR_FRONTIER_2026-10-08.md
 */
const TWO_PI = 2 * Math.PI;
const requireFinite = (x, label) => {
  if (!Number.isFinite(x)) throw new RangeError(`${label} must be finite`);
  return x;
};
const requirePositive = (x, label) => {
  requireFinite(x, label);
  if (!(x > 0)) throw new RangeError(`${label} must be positive`);
  return x;
};

/**
 * For Ue_j=exp(2πij/n)e_j and Ve_j=e_{j+1 mod n},
 * U V U* V* = exp(2πi/n) I.
 * Bott = (1/2πi)Tr log(commutator) = 1 for n>=3.
 * With n>=4 any commuting pair is at least 1/8 away in max-norm:
 * geodesics from pairs within <1/8 yield commutator paths avoiding -1,
 * contradicting homotopy-invariance of the winding/Bott index.
 */
export function clockShiftCertificate(n) {
  if (!Number.isSafeInteger(n) || n < 4 || n > 10000000)
    throw new RangeError('n must be a safe integer in [4,10000000]');
  const gap = 2 * Math.sin(Math.PI / n);
  const perturbation = 1 / 8;
  const spectralAvoidanceMargin = 2 - gap - 4 * perturbation;
  return Object.freeze({
    n,
    commutatorNorm: gap,
    bottIndex: 1,
    maxApproximationDistanceLowerBound: perturbation,
    spectralAvoidanceMargin,
    isCertified: spectralAvoidanceMargin > 0,
    mathematicalStatus: 'exact finite-dimensional algebraic model; classical Bott obstruction',
    physicalStatus: 'no established CEF identification'
  });
}

/** Real scalar part of e^(i phase) and test for trivial Weyl cocycle. */
export function weylTensorObstruction(phase) {
  requireFinite(phase, 'phase');
  const normalized = Math.atan2(Math.sin(phase), Math.cos(phase));
  const distanceFromTrivial = 2 * Math.abs(Math.sin(normalized / 2));
  return Object.freeze({
    phaseRadians: phase,
    normalizedPhaseRadians: normalized,
    cocycleDistanceFromOne: distanceFromTrivial,
    forbidsIndependentTensorFactors: distanceFromTrivial > 1e-10,
    scope: 'if WX=e^(i phase)XW, WX and XW cannot occupy commuting tensor factors unless phase=0 mod 2π'
  });
}

/**
 * Toy M_2(C), NOT a Type-II factor. Faithful density diag(p,1-p).
 * The diagonal spectral projection is in the centralizer for every p.
 * If p=1/2 the whole M_2 is fixed; otherwise the diagonal M_1⊕M_1.
 */
export function toyCentralizer(p) {
  requireFinite(p, 'p');
  if (p <= 0 || p >= 1) throw new RangeError('0<p<1 is required');
  const tracial = p === 0.5;
  return Object.freeze({
    p, densityEigenvalues: [p, 1 - p],
    modularOffDiagonalFrequency: Math.log(p / (1 - p)),
    centralizerComplexDimension: tracial ? 4 : 2,
    scalarCentralizer: false,
    scope: 'finite Type-I illustrative example only; Type-II theorem requires density spectral projection proof'
  });
}

/** Conditional free energy Gamma = q(log(q/q*)-1)+nu log q+C. */
export function selectorLocal(q, qStar, nu = 0.5) {
  requirePositive(q,'q'); requirePositive(qStar,'qStar'); requireFinite(nu,'nu');
  return Object.freeze({
    value: q * (Math.log(q / qStar) - 1) + nu * Math.log(q),
    derivative: Math.log(q / qStar) + nu / q,
    hessian: (q - nu) / (q * q),
    domainStrictConvexWhen: 'q>nu under exactly constant remainder',
    qStarIsAnInput: true
  });
}

/**
 * Conditional one-loop dictionary: q*=Xi exp(16π²/g), Lambda=3π/(lP²q*).
 * d log Lambda / d log g = 16π²/g (large sensitivity).
 * A single Lambda measurement cannot independently identify g and Xi.
 */
export function couplingSensitivity(g, xi = 1, relativeDelta = 0) {
  requirePositive(g,'g'); requirePositive(xi,'xi'); requireFinite(relativeDelta,'relativeDelta');
  if (!(relativeDelta > -1)) throw new RangeError('relativeDelta must exceed -1');
  const beta = 16 * Math.PI * Math.PI / g;
  const logQ = Math.log(xi) + beta;
  const logLambdaRatio = beta * relativeDelta / (1 + relativeDelta);
  const targetLog = Math.log1p(0.01);
  return Object.freeze({
    g, xi, beta, logQ,
    elasticityOfLambdaToG: beta,
    elasticityOfLambdaToXi: -1,
    relativeDelta,
    logLambdaRatio,
    lambdaRatio: Math.exp(logLambdaRatio),
    maxPositiveCouplingChangeForOnePercentLambda: targetLog / (beta - targetLog),
    finiteDifferenceCompensationLogXi: logLambdaRatio,
    locallyUnidentifiedDirection: 'delta(log Xi)=beta*delta(log g); requires independent Xi or g constraint',
    status: 'exact consequence of the assumed one-loop relation; not a measured physical prediction'
  });
}

export const FRONTIER_RESEARCH_CONTRACT = Object.freeze({
  domain: 'finite clock-shift, Weyl cocycle, Type-I modular toy, conditional selector',
  researchOnly: true,
  independentPhysicalBridgeProved: false,
  establishedWorldNovelty: false,
  source: 'docs/CEF_OPERATOR_FRONTIER_2026-10-08.md'
});
