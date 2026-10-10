import { defineLab } from '../contract.mjs';
import { STATUS } from '../status.mjs';
import { hopfJacobiCertificate,viscousEigenmodeRates } from '../math/s3-hopf-jacobi-certificate.mjs';

/* Native computational reference lab. The visual atlas is NOT modified here. */
export default defineLab({
 id:'s3.hopf_jacobi_certificate',
 title:'Round S3 Hopf-Jacobi resonance, spectral variance and projective speed',
 status:STATUS.REFERENCE_MODEL,
 model_id:'s3.round.signed_curl_reference',
 equation_ids:['s3.curl_spectrum','s3.spectral_variance','s3.projective_curl_FS'],
 summary:'A typed necessary spectral compatibility calculator on the EXACT round sphere. '+
  'The signed eigenmode assumption is explicit. This does not verify a nonlinear PDE or cosmic topology.',
 formulas:[
  'R lambda_H=m+2; R lambda_J=sigma*2(n+1)',
  'exact resonance iff sigma=+1 and m=2n',
  'V=Z-H^2/(2E)=sum_(i<j) A_i A_j (lambda_i-lambda_j)^2/sum A_i',
  'FS_speed_squared=V/(2E) under auxiliary exp(-is curl); pure-state QFI=4 FS_speed_squared',
  'gamma_H=nu lambda^2; gamma_EM=nu(lambda^2-4/R^2)'
 ],
 assumptions:[
  'orientation fixed, round S3 with radius R',
  'independently verified smooth divergence-free signed curl eigenmodes',
  'squared L2 norms use the metric measure; same-eigenvalue modes require a supplied Gram overlap'
 ],
 domain_of_validity:[
  'spectral reference calculation on exact round S3 only',
  'auxiliary projective parameter is not Navier-Stokes time',
  'Hodge and Ebin-Marsden rates are modewise, not a general nonlinear equivalence'
 ],
 falsifiers:[
  'odd degree or negative chirality is reported resonant',
  'V and pairwise nonnegative weighted formula disagree',
  'the laboratory claims global unforced NSE from a spectrum-only check',
  'OpenAI Math families 350/376 are marked as proof of round S3 or unforced S3 closure'
 ],
 verifiers:['test/s3-hopf-jacobi-certificate.test.mjs'],
 cost_hint:'fast',
 inputs:[
  {name:'degree',type:'number',default:3,min:0,max:128,unit:'degree',doc:'nonnegative integer Hopf polynomial degree'},
  {name:'jacobi_index',type:'number',default:1,min:0,max:64,unit:'index',doc:'nonnegative integer Jacobi index; physical mode requires its own proof'},
  {name:'chirality',type:'number',default:1,enum:[1,-1],unit:null,doc:'orientation consistent signed curl branch'},
  {name:'radius',type:'number',default:1,min:0.000001,max:1000000,unit:'length',doc:'round S3 radius'},
  {name:'hopf_norm',type:'number',default:1,min:0,max:1000000,unit:'L2 norm squared'},
  {name:'jacobi_norm',type:'number',default:1,min:0,max:1000000,unit:'L2 norm squared'},
  {name:'overlap',type:'number',default:0,min:-1000000,max:1000000,unit:'L2 inner product',doc:'Gram cross term for equal eigenvalues, forced to 0 for distinct eigenvalues; default 0 is an explicit orthogonality hypothesis'}, 
  {name:'viscosity',type:'number',default:0.1,min:0,max:1000,unit:'length^2/time'}
 ],
 outputs:[
  {name:'exact_resonance',type:'boolean',unit:null},
  {name:'integer_detuning',unit:'dimensionless'},
  {name:'physical_detuning',unit:'inverse length'},
  {name:'spectral_deficit',unit:'norm^2 / length^2'},
  {name:'pairwise_residual',unit:'norm^2 / length^2'},
  {name:'fubini_study_speed_squared',unit:'inverse length^2'},
  {name:'pure_state_qfi',unit:'inverse length^2'},
  {name:'odd_degree_lower_bound',unit:'norm^2 / length^2'},
  {name:'hodge_rates',type:'array',unit:'inverse time'},
  {name:'ebin_marsden_rates',type:'array',unit:'inverse time'},
  {name:'nonlinear_pde_certified',type:'boolean',unit:null}
 ],
 evaluate(i){
  const o=hopfJacobiCertificate({degree:i.degree,jacobiIndex:i.jacobi_index,
   chirality:i.chirality,radius:i.radius,hopfNorm:i.hopf_norm,jacobiNorm:i.jacobi_norm,overlap:i.overlap});
  const h=viscousEigenmodeRates({Rlambda:o.hopfRlambda,radius:i.radius,viscosity:i.viscosity});
  const j=viscousEigenmodeRates({Rlambda:o.jacobiRlambda,radius:i.radius,viscosity:i.viscosity});
  return {
   outputs:{
    exact_resonance:o.exactCompatibility,
    integer_detuning:o.differenceInteger,physical_detuning:o.detuning,
    spectral_deficit:o.spectralDeficit,pairwise_residual:Math.abs(o.spectralDeficit-o.pairwiseDeficit),
    fubini_study_speed_squared:o.fubiniStudySpeedSquared,
    pure_state_qfi:o.pureStateQuantumFisherInformation,
    odd_degree_lower_bound:o.oddPositiveObstruction,
    hodge_rates:[h.hodgeRate,j.hodgeRate],
    ebin_marsden_rates:[h.ebinMarsdenRate,j.ebinMarsdenRate],
    nonlinear_pde_certified:false
   },
   warnings:[o.candidateNSConclusion,o.forcedSector376Transfer,
     o.nodalSector350Transfer,o.conservationStatus],
   diagnostics:{source_families:[350,376],
    projective_phase_scope:'AUXILIARY, NOT VISCOUS TIME',
    eigenvalues:[o.hopfEigenvalue,o.jacobiEigenvalue]}
  };
 },
 selftests:[
  {name:'integer resonance and odd obstruction',
    run(L){const a=L.run({degree:4,jacobi_index:2},{provenance:{}}).outputs;
      const b=L.run({degree:3,jacobi_index:1},{provenance:{}}).outputs;
      return {pass:a.exact_resonance&&!b.exact_resonance&&a.spectral_deficit===0&&b.spectral_deficit>0};}},
  {name:'negative chirality and PDE refusal',
    run(L){const a=L.run({degree:4,jacobi_index:2,chirality:-1},{provenance:{}}).outputs;
      return {pass:!a.exact_resonance&&!a.nonlinear_pde_certified&&a.pairwise_residual<1e-12};}}
 ]
});
