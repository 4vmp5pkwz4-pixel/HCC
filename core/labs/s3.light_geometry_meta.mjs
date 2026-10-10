import { defineLab } from '../contract.mjs';
import { STATUS } from '../status.mjs';
import {lightFluidBridge,lightSampleGrid,lightReconstructGram,lightTopologicalNoGo}
 from '../math/s3-light-geometry-meta.mjs';

/* Typed mathematical correspondence. This is not a replacement for HCC 3D/XR.
 * Input field existence and curl orientation require external PDE verification. */
export default defineLab({
 id:'s3.light_geometry_meta',
 title:'Geometry of Light: Hopf intensity, fluid pressure and algebraic nodal tomography',
 status:STATUS.CONDITIONAL,
 model_id:'s3.round.fixed_hopf_null_beltrami',
 equation_ids:['s3.light.null_curl','s3.light.pressure_intensity','s3.light.gram_tomography'],
 summary:'A finite exact Hopf-base optical-intensity reference calculation and a distinct Beltrami-fluid pressure correspondence; no equivalence of physical Maxwell and Navier-Stokes dynamics.',
 formulas:[
  'F_p=p(z1,z2)(X2+iX3), curl F_p=(m+2)/R F_p, F_p.F_p=0: INPUT HYPOTHESIS',
  'I_p=|p|^2,  P-P0=-exp(-2 gamma t) I_p/2 under the separately specified fluid dynamics',
  'Q_d(x)=[x(1-x)]^(d/2) sum_l c_(l+d)*conj(c_l)*x^l*(1-x)^(m-d-l)',
  '(m+1)(2m+1) exact samples recover coefficient Gram cc*; not a noise-stable guarantee'
 ],
 assumptions:[
  'independently justified globally smooth null signed-curl seed, fixed orientation, and normalized Hopf orthonormal frame',
  'different Maxwell and fluid evolution laws must remain physically separate',
  'pressure is calibrated by P0(t); intensity and coefficients are purely model inputs',
  'sampling grid and finite degree are exact; numerical conditioning is not universal'
 ],
 domain_of_validity:['exact round S3; binary polynomial degree 0..6 for this floating-point reference implementation',
 'x within [0,1], phase real, R>0, nu>=0 and t>=0'],
 falsifiers:[
  'finite-grid Gram does not reproduce input coefficient products',
  'fluid pressure does not equal minus half the attenuated equal-time intensity',
  'two equal-energy binary forms are asserted to have identical Hopf divisors',
  'a cross-physics identity is advertised as experimental validation or universal Maxwell/NS equivalence'
 ],
 verifiers:['test/s3-light-geometry-meta.test.mjs'],
 cost_hint:'fast',
 inputs:[
  {name:'coefficients',type:'array',default:[[1,0],[0,1]],unit:null,doc:'complex c_k as [real,imag] for homogeneous binary form'},
  {name:'x',type:'number',default:.35,min:0,max:1,unit:'Hopf base latitude'},
  {name:'delta',type:'number',default:0,unit:'radian'},
  {name:'radius',type:'number',default:1,min:.00001,max:1e6,unit:'length'},
  {name:'viscosity',type:'number',default:.01,min:0,max:100,unit:'length squared / time'},
  {name:'time',type:'number',default:1,min:0,max:1e4,unit:'time'},
  {name:'operator',type:'string',default:'Hodge',enum:['Hodge','EbinMarsden']}
 ],
 outputs:[
  {name:'optical_intensity',unit:'field amplitude squared'},
  {name:'fluid_pressure_minus_offset',unit:'velocity squared'},
  {name:'curl_eigenvalue',unit:'inverse length'},
  {name:'integrated_intensity',unit:'amplitude squared times volume'},
  {name:'reconstructed_coefficient_gram',type:'array',unit:'coefficient amplitude squared'},
  {name:'gram_rank_one_residual',unit:'relative'},
  {name:'topology_from_energy_alone',type:'boolean',unit:null},
  {name:'nonlinear_pde_proved_here',type:'boolean',unit:null}
 ],
 evaluate(i){
  const F=lightFluidBridge(i),T=lightReconstructGram(lightSampleGrid(i.coefficients));
  return {outputs:{
   optical_intensity:F.opticalIntensity,fluid_pressure_minus_offset:F.fluidPressureMinusOffset,
   curl_eigenvalue:F.positiveCurlEigenvalue,integrated_intensity:F.integratedIntensity,
   reconstructed_coefficient_gram:T.gram,gram_rank_one_residual:T.relativeRankOneResidual,
   topology_from_energy_alone:false,nonlinear_pde_proved_here:false},
   diagnostics:{sample_count:(i.coefficients.length)*(2*i.coefficients.length-1),
    phase_unobservable:true,nullness_requires_verified_geometry:true,
    external_catalog:[350,365,376],light_no_go_degree2:lightTopologicalNoGo(2).identicalIntegratedIntensity},
   warnings:['REFERENCE ONLY: polynomial null-curl assumptions, Maxwell and fluid PDE are not a single physical model.',
    'No universal inverse stability, S3 cosmology measurement, or Clay problem resolution follows.']
  };
 },
 selftests:[
  {name:'finite optical Gram recovers rank-one products',
   run(L){const r=L.run({}, {provenance:{}}).outputs;return {pass:r.gram_rank_one_residual<1e-10&&!r.topology_from_energy_alone};}},
  {name:'two topologically inequivalent divisors share global energy',
   run(L){const a=lightTopologicalNoGo(3);return {pass:a.identicalIntegratedIntensity&&a.firstDivisorMultiplicities.length!==a.secondDivisorMultiplicities.length};}}
 ]
});
