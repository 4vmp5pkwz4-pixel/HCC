import { defineLab, domainError } from '../contract.mjs';
import { STATUS } from '../status.mjs';
import {
  fullHarmonicBandDimension, capVolumeFraction, witnessFraction,
  leadingCapCoefficient, sharpRadialCoefficient, radialGram,
  inverseAmplificationAtLeast, capFractionPowerBound
} from '../math/s3-cap-observability.mjs';

/* This kernel computes a restriction map on the ROUND S³ — NOT a telescope
   or an inference that the observed universe has S³ spatial topology. */
export default defineLab({
  id: 's3.cap_observability',
  title: 'S³ cap observability — finite-band radial obstruction',
  status: STATUS.REFERENCE_MODEL,
  model_id: 's3.round.cap_restriction',
  equation_ids: ['s3.cap.gram', 's3.cap.witness', 's3.cap.sharp_radial', 's3.cap.inverse_bound'],
  summary: 'Exact round-S³ finite harmonic model: a small geodesic cap exponentially suppresses '
    + 'some band-limited radial modes as the band increases. The returned inversion amplification '
    + 'is a necessary LOWER bound. The sharp asymptotic applies only in the radial sector.',
  formulas: [
    'dim H_<=L = (L+1)(L+2)(2L+3)/6',
    'G_lm(chi) = (2/pi) integral_0^chi sin((l+1)t) sin((m+1)t) dt',
    'f_L(t) = (1-cos t)^L,  r_L = ||f_L||_cap^2/||f_L||_S3^2',
    'lambda_min(G_radial) <= r_L <= C_w(L)*chi^(4L+3)',
    'lambda_min(G_radial) ~ C_sharp(L)*chi^(4L+3) for fixed L, chi->0',
    '||inverse restriction|| >= r_L^(-1/2)'
  ],
  assumptions: [
    'round S³ geometry, fixed observer center, scalar harmonics degree <= L',
    'cap restriction measured in normalized L² spatial norm; NO transfer or detector physics',
    'the coefficient C_sharp is an asymptotic only at fixed L and for the radial subspace',
    'numerical witness integral uses positive Simpson quadrature, not a certified interval proof'
  ],
  domain_of_validity: [
    'integer 0<=L<=24 and angular aperture 0<chi<=pi',
    'finite-dimensional fixed-band mathematical reference model only',
    'very small eigenvalues are represented by a witness bound, not numerically diagonalized'
  ],
  falsifiers: [
    'G(pi) differs from the identity, or G is not symmetric',
    'witness fraction exceeds its globally valid analytic upper bound',
    'radial eigenvalue is claimed to bound the full nonradial problem from below',
    'the phi ladder is described as inferred from a cap restriction',
    'a numeric test is described as physical observation'
  ],
  verifiers: ['node docs/verify-s3-cap-observability.cjs',
              'node --test test/s3-cap-observability.test.mjs'],
  open_problems: [
    'extend the sharp smallest eigenvalue to all nonradial SO(4) blocks',
    'derive actual causal propagation, detector response and calibrated noise covariance',
    'identify physical priors for inversion; phi is not selected by this mathematical model',
    'assess originality against classical Slepian spatial-spectral concentration results'
  ],
  cost_hint: 'fast',
  strict_inputs: true,
  inputs: [
    {name:'L',type:'number',unit:'harmonic degree',default:3,min:0,max:24,
     doc:'highest included spherical harmonic degree, integer'},
    {name:'chi',type:'number',unit:'rad',default:0.5,min:0.01,max:Math.PI,
     doc:'geodesic cap angular radius; 0.01 minimum limits numerical cancellation'}
  ],
  outputs: [
    {name:'full_band_dimension',unit:'modes',doc:'exact number of degree <= L scalar S³ modes'},
    {name:'radial_band_dimension',unit:'modes',doc:'L+1 SO(3)-invariant modes'},
    {name:'cap_volume_fraction',unit:'1',doc:'normalized round S³ cap volume'},
    {name:'radial_gram',type:'array',unit:'1',doc:'finite radial restriction Gram matrix'},
    {name:'witness_fraction',unit:'1',doc:'observed energy fraction of (1-cos chi)^L'},
    {name:'analytic_witness_upper_bound',unit:'1',doc:'globally valid upper bound on witness fraction'},
    {name:'sharp_radial_asymptotic_coefficient',unit:'1',doc:'fixed-L small-cap leading coefficient'},
    {name:'inverse_amplification_at_least',unit:'1',doc:'necessary norm lower bound for any inverse'}
  ],
  evaluate(i) {
    if (!Number.isInteger(i.L)) throw domainError('L must be an integer', {L:i.L});
    const r=witnessFraction(i.L,i.chi);
    const u=capFractionPowerBound(i.L,i.chi);
    if (!(r>0 && r<=1+1e-8 && r<=u*(1+2e-8)))
      throw new Error('NUMERIC_INVARIANT_FAILURE: cap witness violates analytic bound');
    return {outputs:{
      full_band_dimension:fullHarmonicBandDimension(i.L),
      radial_band_dimension:i.L+1,
      cap_volume_fraction:capVolumeFraction(i.chi),
      radial_gram:radialGram(i.L,i.chi),
      witness_fraction:r,
      analytic_witness_upper_bound:u,
      sharp_radial_asymptotic_coefficient:sharpRadialCoefficient(i.L),
      inverse_amplification_at_least:inverseAmplificationAtLeast(i.L,i.chi)
    }, warnings:[
      'REFERENCE MODEL ONLY — not evidence for cosmic S³ topology or physical information capacity',
      'the sharp asymptotic is radial and fixed L; it is not a uniform full-band guarantee'
    ], diagnostics:{observation_operator:'restriction to geodesic cap',space:'L2(S3)',
                    physics_input:'none',phi_origin:'not_derived'}};
  },
  selftests:[
    {name:'G(pi)=I on radial harmonics through L=5',
     run(){let e=0;for(let L=0;L<=5;L++){const G=radialGram(L,Math.PI);
       for(let a=0;a<=L;a++)for(let b=0;b<=L;b++)
         e=Math.max(e,Math.abs(G[a][b]-(a===b?1:0))); }
       return {pass:e<1e-12,detail:'largest matrix residual '+e}; }},
    {name:'witness never exceeds analytic power upper bound',
     run(){let e=0;for(let L=0;L<=6;L++)for(const x of [0.05,0.2,0.8,1.7,Math.PI]){
       const r=witnessFraction(L,x),u=capFractionPowerBound(L,x);
       e=Math.max(e,r/u); }
       return {pass:e<=1+2e-8,detail:'max ratio '+e}; }},
    {name:'cap volume equals degree-zero witness',
     run(){let e=0;for(const x of [.05,.2,.8,1.7,Math.PI])
       e=Math.max(e,Math.abs(capVolumeFraction(x)-witnessFraction(0,x)));
       return {pass:e<1e-10,detail:'max difference '+e}; }}
  ]
});
